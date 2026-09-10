#!/usr/bin/env python3
"""
scripts/ml/generate_synthetic_matches.py
ParkLah P2P Parking Matchmaking - Physics & Behavior Synthetic Dataset Generator
Generates 150,000 realistic match candidate episodes across Klang Valley commercial hubs.
"""

import os
import argparse
import numpy as np
import pandas as pd

def generate_synthetic_dataset(num_episodes=150000, random_seed=42):
    print(f"[+] Generating {num_episodes:,} synthetic match episodes with seed {random_seed}...")
    np.random.seed(random_seed)

    # 1. Geographic Hub Archetypes (Klang Valley Hotspots)
    hubs = [
        {"name": "Bangsar Telawi", "lat": 3.1319, "lng": 101.6710, "traffic_mult": 1.25},
        {"name": "SS15 Subang", "lat": 3.0754, "lng": 101.5898, "traffic_mult": 1.35},
        {"name": "Bukit Bintang", "lat": 3.1466, "lng": 101.7115, "traffic_mult": 1.40},
        {"name": "Mid Valley", "lat": 3.1177, "lng": 101.6774, "traffic_mult": 1.20},
        {"name": "Damansara Uptown", "lat": 3.1352, "lng": 101.6219, "traffic_mult": 1.15}
    ]

    records = []

    for i in range(num_episodes):
        if (i + 1) % 50000 == 0:
            print(f"    Processed {i + 1:,} / {num_episodes:,} records...")

        hub = np.random.choice(hubs)
        hour = int(np.random.randint(7, 23))
        dow = int(np.random.randint(0, 7))
        is_rush = 1 if (dow < 5 and ((7 <= hour <= 9) or (17 <= hour <= 19))) else 0
        is_weekend = 1 if dow >= 5 else 0

        # Leaver departure countdown (60s to 300s)
        leaver_countdown = int(np.random.choice([120, 180, 240, 300], p=[0.15, 0.45, 0.30, 0.10]))

        # Candidate Searcher Archetype Selection
        archetype = np.random.choice(['punctual', 'hesitant', 'distracted', 'canceler'], p=[0.45, 0.25, 0.18, 0.12])

        # Spatial generation (Euclidean distance 80m to 1400m)
        euclid_dist = float(np.random.uniform(80, 1400))
        # Detour ratio (non-linear with road complexity)
        detour_ratio = float(np.random.lognormal(mean=0.25, sigma=0.20))
        detour_ratio = max(1.02, min(detour_ratio, 3.8))
        road_dist = euclid_dist * detour_ratio

        # Kinematics & Traffic Speed
        base_speed = float(np.random.normal(30, 10))
        if archetype == 'hesitant':
            base_speed *= 0.65
        if is_rush:
            base_speed *= (0.70 / hub['traffic_mult'])
        speed_kmh = max(5.0, min(base_speed, 70.0))
        speed_ms = speed_kmh / 3.6

        road_eta = float((road_dist / speed_ms) + np.random.uniform(10, 40)) # delay at traffic lights
        abs_eta_diff = abs(road_eta - leaver_countdown)
        signed_slack = road_eta - leaver_countdown

        # Heading divergence
        if archetype == 'punctual':
            heading_diff = abs(float(np.random.normal(15, 8)))
        elif archetype == 'hesitant':
            heading_diff = abs(float(np.random.normal(45, 20)))
        else:
            heading_diff = abs(float(np.random.normal(60, 35)))
        heading_diff = min(180.0, heading_diff)

        # Telemetry accuracy & staleness
        gps_acc = float(np.random.gamma(shape=3.0, scale=2.5))
        gps_acc = min(45.0, gps_acc)

        ping_stale = float(np.random.exponential(scale=3.5))
        if archetype == 'distracted':
            ping_stale += float(np.random.uniform(5, 15))
        ping_stale = min(25.0, ping_stale)

        # Driver history features
        if archetype == 'punctual':
            rating = float(np.random.uniform(4.6, 5.0))
            hist_accept = float(np.random.uniform(0.85, 0.98))
            hist_comp = float(np.random.uniform(0.90, 0.99))
            hist_cancel = float(np.random.uniform(0.01, 0.05))
        elif archetype == 'canceler':
            rating = float(np.random.uniform(3.0, 4.1))
            hist_accept = float(np.random.uniform(0.70, 0.90))
            hist_comp = float(np.random.uniform(0.50, 0.70))
            hist_cancel = float(np.random.uniform(0.30, 0.50))
        else:
            rating = float(np.random.uniform(3.8, 4.7))
            hist_accept = float(np.random.uniform(0.65, 0.88))
            hist_comp = float(np.random.uniform(0.75, 0.90))
            hist_cancel = float(np.random.uniform(0.05, 0.15))

        lifetime_matches = int(np.random.exponential(scale=25))

        # Spot Context
        spot_type = int(np.random.choice([0, 1, 2], p=[0.60, 0.25, 0.15])) # Street, Open, Multilevel
        has_landmark = 1 if np.random.rand() > 0.35 else 0
        note_length = len("Near Lot 42 facing main road") if has_landmark else 0
        veh_compat = int(np.random.choice([1, 2], p=[0.70, 0.30])) # Equal or smaller car
        spot_to_dest = float(np.random.uniform(30, 450))

        # Calculate Latent Log-Odds & Ground Truth Label
        z = (2.20
             - 0.0012 * road_dist
             - 0.0140 * abs_eta_diff
             - 1.1000 * (detour_ratio - 1.0)
             - 0.0180 * heading_diff
             - 0.0350 * ping_stale
             - 0.0250 * (gps_acc - 5.0)
             + 1.2000 * (rating - 3.5)
             + 1.7000 * hist_comp
             - 1.6000 * hist_cancel
             - 0.7500 * is_rush * max(0.0, signed_slack / 60.0)
             + 0.4000 * has_landmark
             + np.random.normal(0, 0.30))

        p_success = 1.0 / (1.0 + np.exp(-z))
        target_success = 1 if np.random.rand() < p_success else 0

        records.append({
            'road_distance_meters': round(road_dist, 1),
            'euclid_distance_meters': round(euclid_dist, 1),
            'detour_ratio': round(detour_ratio, 3),
            'spot_to_dest_distance_meters': round(spot_to_dest, 1),
            'road_eta_seconds': round(road_eta, 1),
            'leaver_countdown_seconds': float(leaver_countdown),
            'abs_eta_countdown_diff': round(abs_eta_diff, 1),
            'signed_time_slack': round(signed_slack, 1),
            'hour_of_day': hour,
            'day_of_week': dow,
            'is_rush_hour': is_rush,
            'is_weekend': is_weekend,
            'current_speed_kmh': round(speed_kmh, 1),
            'heading_bearing_diff_deg': round(heading_diff, 1),
            'heading_dest_diff_deg': round(abs(float(np.random.normal(25, 15))), 1),
            'gps_accuracy_meters': round(gps_acc, 2),
            'ping_staleness_seconds': round(ping_stale, 2),
            'driver_reliability_rating': round(rating, 2),
            'historical_acceptance_rate': round(hist_accept, 3),
            'historical_completion_rate': round(hist_comp, 3),
            'historical_cancellation_rate': round(hist_cancel, 3),
            'lifetime_matches_count': lifetime_matches,
            'spot_type_enum': spot_type,
            'vehicle_size_compatibility': veh_compat,
            'has_landmark_note': has_landmark,
            'landmark_note_length': note_length,
            'match_success': target_success
        })

    df = pd.DataFrame(records)
    print(f"[+] Dataset shape: {df.shape}")
    print(f"[+] Positive match rate (Success=1): {df['match_success'].mean() * 100:.2f}%")
    return df

def main():
    parser = argparse.ArgumentParser(description="Generate synthetic match dataset for ParkLah.")
    parser.add_argument("--samples", type=int, default=150000, help="Number of records to generate.")
    parser.add_argument("--output", type=str, default="data/synthetic_matches.csv", help="Output CSV path.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    df = generate_synthetic_dataset(num_episodes=args.samples, random_seed=args.seed)
    df.to_csv(args.output, index=False)
    print(f"[✓] Saved synthetic dataset to: {args.output}")

if __name__ == "__main__":
    main()
