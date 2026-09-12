#!/usr/bin/env python3
"""
scripts/ml/train_fraud_isolation_forest.py
ParkLah Anti-Abuse & Driver Telemetry Anomaly Detection Pipeline
Trains an Isolation Forest model to detect GPS spoofing, signal jamming, and bot abuse.
Exports model metadata and decision boundaries to scripts/ml/fraud_model_metadata.json.
"""

import os
import sys
import json
import time
import argparse
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score, classification_report

FEATURE_COLUMNS = [
    'speed_kmh',
    'acceleration_variance',
    'horizontal_accuracy_meters',
    'ping_staleness_seconds',
    'teleport_jump_ratio',
    'historical_cancellation_rate',
    'unverified_claim_ratio'
]

def generate_synthetic_telemetry(n_samples=12000, contamination=0.08, random_seed=42):
    """
    Generates 12,000 synthetic driver interaction episodes:
      - 92% Normal Drivers: Speed 10-60 km/h, accuracy < 15m, staleness < 5s, cancellation < 8%
      - 8% Malicious / Anomalous Drivers:
          1. GPS Teleportation / Spoofers (jumps > 500m/s or speeds > 140 km/h)
          2. Multipath / Signal Jammers (accuracy > 60m, staleness > 25s)
          3. Abuse Bots / Cancellers (cancellation > 60%, unverified arrivals > 45%)
    """
    print(f"[+] Generating {n_samples:,} synthetic telemetry episodes (seed={random_seed})...")
    np.random.seed(random_seed)
    
    n_anom = int(n_samples * contamination)
    n_norm = n_samples - n_anom
    
    # 1. Normal Drivers (92%)
    norm_speed = np.clip(np.random.normal(36.0, 9.5, n_norm), 10.0, 60.0)
    norm_acc_var = np.clip(np.random.normal(1.2, 0.45, n_norm), 0.2, 3.5)
    norm_horiz_acc = np.random.uniform(3.0, 14.8, n_norm)
    norm_ping_stale = np.random.uniform(0.5, 4.8, n_norm)
    norm_teleport = np.random.uniform(0.0, 0.01, n_norm)
    norm_cancel = np.random.uniform(0.01, 0.078, n_norm)
    norm_unverified = np.random.uniform(0.0, 0.04, n_norm)
    
    df_norm = pd.DataFrame({
        'speed_kmh': norm_speed,
        'acceleration_variance': norm_acc_var,
        'horizontal_accuracy_meters': norm_horiz_acc,
        'ping_staleness_seconds': norm_ping_stale,
        'teleport_jump_ratio': norm_teleport,
        'historical_cancellation_rate': norm_cancel,
        'unverified_claim_ratio': norm_unverified,
        'is_anomaly': 0,
        'archetype': 'normal_driver'
    })
    
    # 2. Malicious / Anomalous Drivers (8%)
    n_spoofer = n_anom // 3
    n_jammer = n_anom // 3
    n_bot = n_anom - (n_spoofer + n_jammer)
    
    # 2a. GPS Teleportation / Spoofers: instant jumps > 500m in 1s or speeds > 140 km/h
    spoofer_speed = np.random.uniform(145.0, 230.0, n_spoofer)
    spoofer_acc_var = np.random.uniform(12.0, 32.0, n_spoofer)
    spoofer_horiz_acc = np.random.uniform(22.0, 75.0, n_spoofer)
    spoofer_ping_stale = np.random.uniform(1.0, 12.0, n_spoofer)
    spoofer_teleport = np.random.uniform(0.40, 0.95, n_spoofer)
    spoofer_cancel = np.random.uniform(0.15, 0.45, n_spoofer)
    spoofer_unverified = np.random.uniform(0.20, 0.65, n_spoofer)
    
    df_spoofer = pd.DataFrame({
        'speed_kmh': spoofer_speed,
        'acceleration_variance': spoofer_acc_var,
        'horizontal_accuracy_meters': spoofer_horiz_acc,
        'ping_staleness_seconds': spoofer_ping_stale,
        'teleport_jump_ratio': spoofer_teleport,
        'historical_cancellation_rate': spoofer_cancel,
        'unverified_claim_ratio': spoofer_unverified,
        'is_anomaly': 1,
        'archetype': 'teleport_spoofer'
    })
    
    # 2b. Multipath / Signal Jammers: accuracy > 60m, staleness > 25s
    jammer_speed = np.random.uniform(5.0, 80.0, n_jammer)
    jammer_acc_var = np.random.uniform(6.0, 18.0, n_jammer)
    jammer_horiz_acc = np.random.uniform(62.0, 160.0, n_jammer)
    jammer_ping_stale = np.random.uniform(26.0, 85.0, n_jammer)
    jammer_teleport = np.random.uniform(0.15, 0.55, n_jammer)
    jammer_cancel = np.random.uniform(0.08, 0.35, n_jammer)
    jammer_unverified = np.random.uniform(0.08, 0.30, n_jammer)
    
    df_jammer = pd.DataFrame({
        'speed_kmh': jammer_speed,
        'acceleration_variance': jammer_acc_var,
        'horizontal_accuracy_meters': jammer_horiz_acc,
        'ping_staleness_seconds': jammer_ping_stale,
        'teleport_jump_ratio': jammer_teleport,
        'historical_cancellation_rate': jammer_cancel,
        'unverified_claim_ratio': jammer_unverified,
        'is_anomaly': 1,
        'archetype': 'signal_jammer'
    })
    
    # 2c. Abuse Bots / Cancellers: cancellation > 60%, unverified arrivals > 45%
    bot_speed = np.random.uniform(0.0, 32.0, n_bot)
    bot_acc_var = np.random.uniform(0.1, 1.0, n_bot)
    bot_horiz_acc = np.random.uniform(5.0, 22.0, n_bot)
    bot_ping_stale = np.random.uniform(1.0, 6.5, n_bot)
    bot_teleport = np.random.uniform(0.0, 0.08, n_bot)
    bot_cancel = np.random.uniform(0.65, 0.98, n_bot)
    bot_unverified = np.random.uniform(0.45, 0.95, n_bot)
    
    df_bot = pd.DataFrame({
        'speed_kmh': bot_speed,
        'acceleration_variance': bot_acc_var,
        'horizontal_accuracy_meters': bot_horiz_acc,
        'ping_staleness_seconds': bot_ping_stale,
        'teleport_jump_ratio': bot_teleport,
        'historical_cancellation_rate': bot_cancel,
        'unverified_claim_ratio': bot_unverified,
        'is_anomaly': 1,
        'archetype': 'abuse_bot'
    })
    
    df = pd.concat([df_norm, df_spoofer, df_jammer, df_bot], ignore_index=True)
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    
    print(f"[✓] Generated dataset: {len(df):,} total rows (Normal: {n_norm:,}, Anomalous: {n_anom:,})")
    return df

def train_and_evaluate(df, contamination=0.08, n_estimators=120, random_seed=42):
    """
    Trains Isolation Forest and evaluates Precision, Recall, and F1.
    """
    print(f"\n[+] Training Isolation Forest (n_estimators={n_estimators}, contamination={contamination})...")
    X = df[FEATURE_COLUMNS]
    y_true = df['is_anomaly'].values
    
    iso_model = IsolationForest(
        contamination=contamination,
        n_estimators=n_estimators,
        random_state=random_seed,
        n_jobs=-1
    )
    
    t0 = time.perf_counter()
    iso_model.fit(X)
    train_duration_sec = time.perf_counter() - t0
    print(f"[✓] Model trained in {train_duration_sec:.2f}s")
    
    # In scikit-learn IsolationForest: -1 is outlier (anomaly), 1 is inlier (normal)
    raw_preds = iso_model.predict(X)
    y_pred = (raw_preds == -1).astype(int)
    
    offset_threshold = float(iso_model.offset_)
    
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    acc = float(accuracy_score(y_true, y_pred))
    
    print("\n--- Isolation Forest Anomaly Detection Metrics ---")
    print(f"  Precision (Anomaly): {prec:.4f}")
    print(f"  Recall (Anomaly):    {rec:.4f}")
    print(f"  F1 Score:            {f1:.4f} (Target: >= 0.90)")
    print(f"  Accuracy:            {acc:.4f}")
    print(f"  Decision Offset:     {offset_threshold:.4f}")
    print("\nDetailed Classification Breakdown:")
    print(classification_report(y_true, y_pred, target_names=['Normal Driver', 'Malicious Anomaly']))
    
    if f1 < 0.90:
        raise ValueError(f"Model F1 score ({f1:.4f}) did not satisfy quality gate (>= 0.90)")
        
    return iso_model, {
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "accuracy": round(acc, 4),
        "decision_threshold": round(offset_threshold, 6),
        "train_duration_sec": round(train_duration_sec, 3)
    }

def export_metadata(df, metrics, output_path):
    """
    Exports decision thresholds, normalizers, and heuristic rules to JSON.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    # Calculate feature quantiles and statistics for runtime validation
    feature_stats = {}
    for col in FEATURE_COLUMNS:
        norm_vals = df[df['is_anomaly'] == 0][col]
        anom_vals = df[df['is_anomaly'] == 1][col]
        
        feature_stats[col] = {
            "mean": round(float(df[col].mean()), 4),
            "std": round(float(df[col].std()), 4),
            "min": round(float(df[col].min()), 4),
            "max": round(float(df[col].max()), 4),
            "p50": round(float(df[col].quantile(0.50)), 4),
            "p95": round(float(df[col].quantile(0.95)), 4),
            "p99": round(float(df[col].quantile(0.99)), 4),
            "normal_mean": round(float(norm_vals.mean()), 4),
            "normal_p95": round(float(norm_vals.quantile(0.95)), 4),
            "anom_mean": round(float(anom_vals.mean()), 4)
        }
    
    metadata = {
        "model_name": "ParkLah Driver Telemetry & Abuse Guard (Isolation Forest)",
        "model_version": "isolation_forest_v1",
        "exported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_training_episodes": len(df),
        "contamination_rate": 0.08,
        "n_estimators": 120,
        "feature_columns": FEATURE_COLUMNS,
        "decision_threshold": metrics["decision_threshold"],
        "metrics": metrics,
        "heuristic_guard_rules": {
            "max_safe_speed_kmh": 140.0,
            "max_position_delta_mps": 40.0,
            "max_horizontal_accuracy_meters": 50.0,
            "max_ping_staleness_seconds": 25.0,
            "max_cancellation_rate": 0.60,
            "max_teleport_jump_ratio": 0.10,
            "max_unverified_claim_ratio": 0.25
        },
        "feature_statistics": feature_stats,
        "quality_gate": {
            "passed": bool(metrics["f1_score"] >= 0.90),
            "target_metric": "f1_score >= 0.90",
            "evaluated_f1": metrics["f1_score"]
        }
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\n[✓] Saved fraud model metadata to: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Train ParkLah Fraud & Telemetry Isolation Forest Model")
    parser.add_argument("--samples", type=int, default=12000, help="Number of synthetic episodes to generate.")
    parser.add_argument("--contamination", type=float, default=0.08, help="Expected anomaly proportion.")
    parser.add_argument("--estimators", type=int, default=120, help="Number of trees in Isolation Forest.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    parser.add_argument("--meta-out", type=str, default="scripts/ml/fraud_model_metadata.json", help="Path to export metadata JSON.")
    parser.add_argument("--data-out", type=str, default="", help="Optional path to save synthetic dataset CSV.")
    args = parser.parse_args()
    
    df = generate_synthetic_telemetry(
        n_samples=args.samples,
        contamination=args.contamination,
        random_seed=args.seed
    )
    
    if args.data_out:
        os.makedirs(os.path.dirname(os.path.abspath(args.data_out)), exist_ok=True)
        df.to_csv(args.data_out, index=False)
        print(f"[✓] Saved synthetic dataset to {args.data_out}")
        
    iso_model, metrics = train_and_evaluate(
        df=df,
        contamination=args.contamination,
        n_estimators=args.estimators,
        random_seed=args.seed
    )
    
    export_metadata(df, metrics, args.meta_out)
    print("\n[✓] Task 1.1 Completed Successfully: Isolation Forest trained and exported.")

if __name__ == "__main__":
    main()
