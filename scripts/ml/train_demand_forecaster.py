#!/usr/bin/env python3
"""
scripts/ml/train_demand_forecaster.py
ParkLah Urban Commercial Hub Parking Demand & Turnover Regressor (Zoning-Aware Calibration)
Trains a LightGBM regressor predicting parking occupancy rates and turnover pressure
across Klang Valley urban hubs calibrated against DBKL land-use zoning dynamics:
  - NIGHTLIFE_ENTERTAINMENT: Bukit Bintang, Bangsar Telawi (Lunch peak + Fri/Sat 21:00–02:30 late-night surge)
  - RETAIL_MALL: Mid Valley Megamall, Damansara Uptown (Daytime shopping peak + steep post-closing drop after 22:00)
  - CAMPUS_COMMUTER: SS15 Subang Jaya (Heavy weekday daytime pressure 08:00–18:00 + evening café turnover)
  - RESIDENTIAL_LOCAL: Quiet non-commercial neighborhoods (Late-night commercial handoff drop to 15%–20%)
Exports calibrated model metadata to scripts/ml/demand_model_metadata.json.
"""

import os
import sys
import json
import time
import argparse
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False
    from sklearn.ensemble import RandomForestRegressor

FEATURE_COLUMNS = [
    'hub_index',
    'hub_archetype',
    'hour_of_day',
    'day_of_week',
    'is_rush_hour',
    'is_weekend',
    'rain_intensity'
]

# Land-Use Zoning Archetypes
ARCHETYPE_RETAIL_MALL = 0
ARCHETYPE_NIGHTLIFE = 1
ARCHETYPE_CAMPUS_COMMUTER = 2
ARCHETYPE_RESIDENTIAL = 3

ZONING_ARCHETYPES = {
    "RETAIL_MALL": {
        "index": ARCHETYPE_RETAIL_MALL,
        "description": "Large-scale shopping and lifestyle malls with high daytime turnover and post-closing wind-down.",
        "mall_closing_hour": 22.0,
        "post_closing_occupancy_range": [0.25, 0.35],
    },
    "NIGHTLIFE_ENTERTAINMENT": {
        "index": ARCHETYPE_NIGHTLIFE,
        "description": "High-density dining, bistros, and entertainment hubs with intense Friday/Saturday late-night surges.",
        "late_night_window": "21:00 - 02:30",
        "late_night_occupancy_range": [0.82, 0.92],
    },
    "CAMPUS_COMMUTER": {
        "index": ARCHETYPE_CAMPUS_COMMUTER,
        "description": "University campus and dense transit commercial districts with heavy weekday daytime parking demand.",
        "peak_window": "08:00 - 18:00",
        "peak_occupancy_range": [0.78, 0.88],
    },
    "RESIDENTIAL_LOCAL": {
        "index": ARCHETYPE_RESIDENTIAL,
        "description": "Low-density residential neighborhoods with minimal late-night commercial parking demand.",
        "late_night_occupancy_range": [0.15, 0.22],
    },
}

COMMERCIAL_HUBS = [
    {
        "hub_index": 0,
        "name": "Mid Valley Megamall",
        "archetype": "RETAIL_MALL",
        "archetype_index": ARCHETYPE_RETAIL_MALL,
        "latitude": 3.1176,
        "longitude": 101.6778,
        "capacity": 4500,
        "base_occupancy": 0.65,
        "traffic_multiplier": 1.35
    },
    {
        "hub_index": 1,
        "name": "Bangsar Telawi",
        "archetype": "NIGHTLIFE_ENTERTAINMENT",
        "archetype_index": ARCHETYPE_NIGHTLIFE,
        "latitude": 3.1303,
        "longitude": 101.6710,
        "capacity": 1200,
        "base_occupancy": 0.55,
        "traffic_multiplier": 1.40
    },
    {
        "hub_index": 2,
        "name": "SS15 Subang Jaya",
        "archetype": "CAMPUS_COMMUTER",
        "archetype_index": ARCHETYPE_CAMPUS_COMMUTER,
        "latitude": 3.0765,
        "longitude": 101.5900,
        "capacity": 1800,
        "base_occupancy": 0.58,
        "traffic_multiplier": 1.42
    },
    {
        "hub_index": 3,
        "name": "Bukit Bintang",
        "archetype": "NIGHTLIFE_ENTERTAINMENT",
        "archetype_index": ARCHETYPE_NIGHTLIFE,
        "latitude": 3.1466,
        "longitude": 101.7112,
        "capacity": 3500,
        "base_occupancy": 0.68,
        "traffic_multiplier": 1.38
    },
    {
        "hub_index": 4,
        "name": "Damansara Uptown",
        "archetype": "RETAIL_MALL",
        "archetype_index": ARCHETYPE_RETAIL_MALL,
        "latitude": 3.1350,
        "longitude": 101.6210,
        "capacity": 2200,
        "base_occupancy": 0.60,
        "traffic_multiplier": 1.36
    },
    {
        "hub_index": 5,
        "name": "Residential Local Area",
        "archetype": "RESIDENTIAL_LOCAL",
        "archetype_index": ARCHETYPE_RESIDENTIAL,
        "latitude": 3.1200,
        "longitude": 101.6300,
        "capacity": 500,
        "base_occupancy": 0.20,
        "traffic_multiplier": 1.00
    }
]

def calculate_zoning_diurnal_curve(archetype_idx: int, hour: int, day_of_week: int) -> float:
    """
    Computes time-factor curve based on DBKL urban land-use zoning archetypes:
      - 0: RETAIL_MALL: Lunch peak (12:00-14:30), evening shopping peak (18:00-21:30),
                        steep drop after 22:00 (25%-35%).
      - 1: NIGHTLIFE_ENTERTAINMENT: Lunch peak + Fri/Sat late night (21:00-02:30) maintaining 82%-92% critical occupancy.
      - 2: CAMPUS_COMMUTER: Heavy weekday daytime (08:00-18:00) + moderate evening cafe turnover.
      - 3: RESIDENTIAL_LOCAL: Minimal commercial activity; late-night drops to 15%-20%.
    """
    is_weekend = 1 if day_of_week in [5, 6] else 0
    is_fri_night = (day_of_week == 4 and hour >= 21)
    is_sat_night = (day_of_week == 5 and hour >= 21)
    is_weekend_late_night = (day_of_week in [5, 6] and 0 <= hour <= 2)

    if archetype_idx == ARCHETYPE_NIGHTLIFE:
        # Friday/Saturday late-night dining/clubbing surge (21:00-02:30)
        if is_fri_night or is_sat_night or is_weekend_late_night:
            return 0.88 + 0.02 * np.sin(hour)
        elif 0 <= hour < 7:
            return 0.22 + 0.02 * hour
        elif 7 <= hour < 11:
            return 0.38 + 0.06 * (hour - 7)
        elif 11 <= hour < 15: # Lunch dining peak
            return 0.76 + 0.08 * np.sin((hour - 11) / 4.0 * np.pi)
        elif 15 <= hour < 18:
            return 0.58 + 0.05 * (hour - 15)
        elif 18 <= hour < 21: # Dinner surge
            return 0.80 + 0.06 * np.sin((hour - 18) / 3.0 * np.pi)
        else: # 21:00 - 24:00 on weekdays
            return 0.60 - 0.08 * (hour - 21)

    elif archetype_idx == ARCHETYPE_RETAIL_MALL:
        # Daytime shopping peak (12:00-21:30); post-closing drop after 22:00 (25%-35%)
        if hour >= 22 or hour < 7:
            # Steep post-closing wind-down
            return 0.28 + 0.02 * (hour % 6)
        elif 7 <= hour < 11:
            return 0.42 + 0.08 * (hour - 7)
        elif 11 <= hour < 15: # Lunch peak
            return 0.84 + 0.06 * np.sin((hour - 11) / 4.0 * np.pi)
        elif 15 <= hour < 18:
            return 0.74 + 0.04 * (hour - 15)
        else: # 18:00 - 21:59 evening peak
            return 0.86 + 0.04 * np.sin((hour - 18) / 4.0 * np.pi)

    elif archetype_idx == ARCHETYPE_CAMPUS_COMMUTER:
        # Heavy weekday daytime pressure (08:00-18:00) with moderate evening cafe turnover
        if hour < 7:
            return 0.20 + 0.02 * hour
        elif 7 <= hour < 18:
            if not is_weekend:
                return 0.82 + 0.04 * np.sin((hour - 7) / 11.0 * np.pi)
            else:
                return 0.56 + 0.06 * np.sin((hour - 7) / 11.0 * np.pi)
        elif 18 <= hour < 22:
            return 0.66 + 0.04 * np.sin((hour - 18) / 4.0 * np.pi)
        else:
            return 0.32 - 0.04 * (hour - 22)

    else: # RESIDENTIAL_LOCAL
        # Quiet non-commercial neighborhood; late-night commercial handoff drops to 15%-20%
        if hour >= 21 or hour < 7:
            return 0.17 + 0.02 * (hour % 5)
        elif 7 <= hour < 19:
            return 0.32 + 0.04 * np.sin((hour - 7) / 12.0 * np.pi)
        else:
            return 0.24 - 0.03 * (hour - 19)

def generate_demand_dataset(n_samples=25000, random_seed=42):
    """
    Generates 25,000 hourly historical observation rows across 6 hubs and 4 zoning archetypes.
    """
    print(f"[+] Synthesizing {n_samples:,} zoning-calibrated demand observations (seed={random_seed})...")
    np.random.seed(random_seed)
    
    rows = []
    for _ in range(n_samples):
        hub = COMMERCIAL_HUBS[np.random.randint(0, len(COMMERCIAL_HUBS))]
        hub_idx = hub["hub_index"]
        arch_idx = hub["archetype_index"]
        hour = int(np.random.randint(0, 24))
        dow = int(np.random.randint(0, 7)) # 0: Mon ... 6: Sun
        is_weekend = 1 if dow >= 5 else 0
        is_rush = 1 if (is_weekend == 0 and ((7 <= hour <= 9) or (17 <= hour <= 19))) else 0
        rain = float(np.random.beta(0.5, 2.0))
        
        time_factor = calculate_zoning_diurnal_curve(arch_idx, hour, dow)
        rain_boost = rain * 0.04
        
        occ = (hub["base_occupancy"] * 0.25) + (time_factor * 0.70) + rain_boost
        occ += np.random.normal(0.0, 0.01)
        occ = float(np.clip(occ, 0.08, 0.98))
        
        # Turnover Pressure (1 to 5 scale)
        if occ < 0.40:
            pressure = 1 # Low
        elif occ < 0.65:
            pressure = 2 # Moderate
        elif occ < 0.82:
            pressure = 3 # High
        elif occ < 0.90:
            pressure = 4 # Severe
        else:
            pressure = 5 # Critical
            
        rows.append({
            "hub_index": hub_idx,
            "hub_archetype": arch_idx,
            "hour_of_day": hour,
            "day_of_week": dow,
            "is_rush_hour": is_rush,
            "is_weekend": is_weekend,
            "rain_intensity": round(rain, 3),
            "occupancy_rate": round(occ, 4),
            "turnover_pressure": pressure
        })
        
    df = pd.DataFrame(rows)
    print(f"[✓] Generated dataset: {len(df):,} rows across {len(COMMERCIAL_HUBS)} hubs/archetypes.")
    return df

def train_and_evaluate(df, random_seed=42):
    """
    Trains regressor optimizing for R^2 >= 0.88 and MAE <= 0.05.
    """
    X = df[FEATURE_COLUMNS]
    y = df['occupancy_rate']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=random_seed)
    print(f"[+] Train split: {len(X_train):,}, Test split: {len(X_test):,}")
    
    t0 = time.perf_counter()
    if HAS_LIGHTGBM:
        print("[+] Training LightGBM Zoning-Aware Regressor...")
        model = lgb.LGBMRegressor(
            objective='regression',
            n_estimators=300,
            learning_rate=0.05,
            num_leaves=31,
            max_depth=6,
            random_state=random_seed,
            verbosity=-1
        )
    else:
        print("[+] LightGBM not available, training RandomForestRegressor fallback...")
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=12,
            random_state=random_seed,
            n_jobs=-1
        )
        
    model.fit(X_train, y_train)
    train_duration_sec = time.perf_counter() - t0
    print(f"[✓] Regressor trained in {train_duration_sec:.2f}s")
    
    preds = model.predict(X_test)
    r2 = float(r2_score(y_test, preds))
    mae = float(mean_absolute_error(y_test, preds))
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    
    print("\n--- Zoning-Aware Demand Forecaster Test Set Metrics ---")
    print(f"  R^2 Score: {r2:.4f} (Target: >= 0.8800)")
    print(f"  MAE:       {mae:.4f} (Target: <= 0.0500)")
    print(f"  RMSE:      {rmse:.4f}")
    
    if r2 < 0.88 or mae > 0.05:
        raise ValueError(f"Model failed quality gate: R^2={r2:.4f} (< 0.88) or MAE={mae:.4f} (> 0.05)")
        
    feature_importances = {}
    if hasattr(model, 'feature_importances_'):
        total_imp = float(sum(model.feature_importances_))
        for col, imp in zip(FEATURE_COLUMNS, model.feature_importances_):
            feature_importances[col] = round(float(imp) / total_imp if total_imp > 0 else 0.0, 4)
            
    return model, {
        "r2_score": round(r2, 4),
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "train_duration_sec": round(train_duration_sec, 3),
        "feature_importances": feature_importances
    }

def compute_hourly_profiles(model):
    """
    Computes static hourly profiles (0-23) for each hub across:
      - weekday (Mon-Thu)
      - friday_eve (Friday night nightlife surge)
      - weekend (Sat/Sun nightlife and mall shopping)
    """
    profiles = {}
    
    schedule_configs = [
        ("weekday", 2, 0),    # Wednesday, not weekend
        ("friday_eve", 4, 0), # Friday, not weekend
        ("weekend", 5, 1)     # Saturday, weekend
    ]
    
    for hub in COMMERCIAL_HUBS:
        hub_idx = hub["hub_index"]
        arch_idx = hub["archetype_index"]
        hub_profiles = {"weekday": {}, "friday_eve": {}, "weekend": {}}
        
        for sched_name, dow, is_we in schedule_configs:
            for hour in range(24):
                is_rush = 1 if (not is_we and ((7 <= hour <= 9) or (17 <= hour <= 19))) else 0
                row = pd.DataFrame([{
                    'hub_index': hub_idx,
                    'hub_archetype': arch_idx,
                    'hour_of_day': hour,
                    'day_of_week': dow,
                    'is_rush_hour': is_rush,
                    'is_weekend': is_we,
                    'rain_intensity': 0.0
                }])
                
                occ = float(model.predict(row)[0])
                occ = float(np.clip(occ, 0.08, 0.98))
                
                # Determine demand level & turnover behavior
                is_nightlife_surge = (arch_idx == ARCHETYPE_NIGHTLIFE and (dow in [4, 5] and (hour >= 21 or hour <= 2)))
                
                if is_nightlife_surge:
                    demand_level = "CRITICAL"
                    turnover_mins = 2.5
                    cruising_saved = 22
                    recommended = "P2P_HANDOFF"
                    is_peak = True
                    window_label = "Weekend Nightlife & Dining Peak (9:00 PM – 2:00 AM)"
                elif occ < 0.38:
                    demand_level = "LOW"
                    turnover_mins = 14.5
                    cruising_saved = 3
                    recommended = "CRUISING_PERMITTED"
                    is_peak = False
                    window_label = "Low Demand Window"
                elif occ < 0.65:
                    demand_level = "MODERATE"
                    turnover_mins = 8.5
                    cruising_saved = 10
                    recommended = "P2P_HANDOFF"
                    is_peak = False
                    window_label = "Moderate Activity"
                elif occ < 0.85:
                    demand_level = "HIGH"
                    turnover_mins = 4.5
                    cruising_saved = 18
                    recommended = "P2P_HANDOFF"
                    is_peak = True
                    if 11 <= hour <= 14:
                        window_label = "Peak Turnover Zone (12:00 PM – 2:30 PM)"
                    elif 18 <= hour <= 21:
                        window_label = "Evening Peak Zone (6:00 PM – 9:30 PM)"
                    else:
                        window_label = "Commercial Peak Period"
                else:
                    demand_level = "CRITICAL"
                    turnover_mins = 2.8
                    cruising_saved = 24
                    recommended = "P2P_HANDOFF"
                    is_peak = True
                    window_label = "Critical Occupancy Period"
                    
                hub_profiles[sched_name][str(hour)] = {
                    "occupancy_rate": round(occ, 2),
                    "occupancy_pct": int(round(occ * 100)),
                    "demand_level": demand_level,
                    "turnover_minutes": turnover_mins,
                    "estimated_cruising_saved_mins": cruising_saved,
                    "recommended_mode": recommended,
                    "is_peak_hour": is_peak,
                    "peak_window_label": window_label
                }
                
        profiles[hub["name"]] = hub_profiles
    return profiles

def export_metadata(metrics, profiles, output_path):
    """
    Exports archetype priors, peak windows, hourly demand profiles, and regression metrics.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    metadata = {
        "model_name": "ParkLah Urban Commercial Hub Demand & Turnover Forecaster (Zoning-Aware)",
        "model_version": "lgbm_zoning_demand_forecaster_v2",
        "exported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_training_samples": 25000,
        "feature_columns": FEATURE_COLUMNS,
        "metrics": metrics,
        "quality_gate": {
            "passed": bool(metrics["r2_score"] >= 0.88 and metrics["mae"] <= 0.05),
            "target_r2": ">= 0.88",
            "target_mae": "<= 0.05",
            "evaluated_r2": metrics["r2_score"],
            "evaluated_mae": metrics["mae"]
        },
        "zoning_archetypes": ZONING_ARCHETYPES,
        "hubs": COMMERCIAL_HUBS,
        "peak_windows": {
            "lunch_peak": {
                "start_hour": 12.0,
                "end_hour": 14.5,
                "display_window": "12:00 PM – 2:30 PM",
                "label": "Lunch Dining Peak"
            },
            "evening_shopping": {
                "start_hour": 18.0,
                "end_hour": 21.5,
                "display_window": "6:00 PM – 9:30 PM",
                "label": "Evening Shopping & Dining Peak"
            },
            "weekend_nightlife": {
                "start_hour": 21.0,
                "end_hour": 2.5,
                "display_window": "9:00 PM – 2:00 AM",
                "label": "Weekend Nightlife & Dining Peak"
            },
            "morning_commute": {
                "start_hour": 7.5,
                "end_hour": 9.5,
                "display_window": "7:30 AM – 9:30 AM",
                "label": "Morning Work Commute"
            }
        },
        "hourly_profiles": profiles
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\n[✓] Saved zoning-aware demand forecaster metadata to: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Train ParkLah Zoning-Aware Demand Forecaster")
    parser.add_argument("--samples", type=int, default=25000, help="Number of synthetic observations.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    parser.add_argument("--meta-out", type=str, default="scripts/ml/demand_model_metadata.json", help="Path to export metadata JSON.")
    parser.add_argument("--data-out", type=str, default="", help="Optional path to export CSV.")
    args = parser.parse_args()
    
    df = generate_demand_dataset(n_samples=args.samples, random_seed=args.seed)
    
    if args.data_out:
        os.makedirs(os.path.dirname(os.path.abspath(args.data_out)), exist_ok=True)
        df.to_csv(args.data_out, index=False)
        print(f"[✓] Saved synthetic dataset to {args.data_out}")
        
    model, metrics = train_and_evaluate(df=df, random_seed=args.seed)
    profiles = compute_hourly_profiles(model)
    export_metadata(metrics, profiles, args.meta_out)
    print("\n[✓] Task 1.2 Completed Successfully: Zoning-Aware Demand Forecaster trained and exported.")

if __name__ == "__main__":
    main()
