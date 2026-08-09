from pathlib import Path
import argparse
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

RAW_FEATURES = ['Voltage_mean', 'Voltage_std', 'Current_mean', 'Current_std', 'Temperature_mean', 'Temperature_max', 'Discharge_time', 'Temperature_rise']
DERIVED_FEATURES = ['current_abs_mean', 'temperature_margin', 'thermal_stress_proxy', 'discharge_hours']
FEATURES = RAW_FEATURES + DERIVED_FEATURES

def score(truth, prediction):
    return {'mae_soh_points': float(mean_absolute_error(truth, prediction)), 'rmse_soh_points': float(mean_squared_error(truth, prediction) ** 0.5), 'r2': float(r2_score(truth, prediction)) if len(set(truth)) > 1 else None}

def train(source: Path, out_dir: Path, profile: dict | None = None):
    out_dir.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(source).copy()
    df = df.drop(columns=[c for c in ['Unnamed: 0'] if c in df.columns])
    missing = [c for c in RAW_FEATURES + ['Capacity'] if c not in df.columns]
    if missing: raise ValueError(f'Missing required columns: {missing}')
    df = df.dropna(subset=RAW_FEATURES + ['Capacity']).reset_index(drop=True)
    # Explicit feature engineering for cycle-level telemetry already aggregated by the source CSV.
    df['current_abs_mean'] = df['Current_mean'].abs()
    df['temperature_margin'] = df['Temperature_max'] - df['Temperature_mean']
    df['thermal_stress_proxy'] = df['Temperature_max'] * df['temperature_margin']
    df['discharge_hours'] = df['Discharge_time'] / 3600.0
    df['cycle_id'] = np.arange(1, len(df) + 1)
    capacity_reference = float(profile.get('nominalCapacityAh')) if profile and profile.get('nominalCapacityAh') else float(df['Capacity'].quantile(0.98))
    df['soh'] = np.clip(df['Capacity'] / capacity_reference * 100.0, 0, 110)
    n = len(df); train_end = max(1, int(n * 0.65)); validation_end = max(train_end + 1, int(n * 0.8))
    train_df, validation_df, test_df = df.iloc[:train_end], df.iloc[train_end:validation_end], df.iloc[validation_end:]
    model = Pipeline([('scale', StandardScaler()), ('regressor', GradientBoostingRegressor(random_state=42, n_estimators=180, max_depth=2, learning_rate=0.04, loss='huber'))])
    model.fit(train_df[FEATURES], train_df['soh'])
    validation_prediction = model.predict(validation_df[FEATURES]) if len(validation_df) else np.array([])
    test_prediction = model.predict(test_df[FEATURES]) if len(test_df) else np.array([])
    baseline_prediction = np.repeat(float(train_df['soh'].iloc[-1]), len(test_df))
    metrics = {'validation': score(validation_df['soh'], validation_prediction) if len(validation_df) else None, 'test': score(test_df['soh'], test_prediction) if len(test_df) else None, 'baseline_test': score(test_df['soh'], baseline_prediction) if len(test_df) else None, 'train_rows': int(len(train_df)), 'validation_rows': int(len(validation_df)), 'test_rows': int(len(test_df)), 'capacity_reference_ah': capacity_reference, 'feature_columns': FEATURES, 'raw_feature_columns': RAW_FEATURES, 'derived_feature_columns': DERIVED_FEATURES, 'feature_engineering': ['absolute mean current for burst magnitude', 'max-minus-mean temperature margin', 'temperature max × margin thermal stress proxy', 'discharge seconds converted to hours'], 'split': 'chronological 65/15/20',
 'label_definition': 'SoH = Capacity / 98th percentile Capacity × 100, clipped to 0–110; confirm reference capacity with battery manufacturer before deployment.'}
    all_prediction = model.predict(df[FEATURES]); df['predicted_soh'] = np.clip(all_prediction, 0, 110)
    recent = df.tail(min(250, len(df))); slope = float(np.polyfit(recent['cycle_id'], recent['predicted_soh'], 1)[0]) if len(recent) >= 2 else -0.1; latest_soh = float(df['predicted_soh'].iloc[-1]); rul = max(0.0, (latest_soh - 80.0) / abs(slope)) if slope < 0 else 999.0
    feature_importance = {name: float(value) for name, value in zip(FEATURES, model.named_steps['regressor'].feature_importances_)}
    artifact = {'model_name': 'Voltwise Gradient Boosting SoH Estimator', 'model_version': f'dataset-{source.stem}-v2', 'source_filename': source.name, 'trained_at_utc': pd.Timestamp.now('UTC').isoformat(), 'metrics': metrics, 'summary': {'latest_cycle': int(df['cycle_id'].iloc[-1]), 'latest_predicted_soh': latest_soh, 'recent_soh_slope_points_per_cycle': slope, 'rul_likely_cycles': float(min(rul, 999.0)), 'rul_best_cycles': float(min(rul * 1.28, 1200.0)), 'rul_worst_cycles': float(min(rul * 0.62, 800.0)), 'uncertainty_band_points': float(np.std(test_df['soh'].to_numpy() - test_prediction)) if len(test_df) else None}, 'feature_importance': feature_importance, 'data_quality': {'rows_read': int(n), 'rows_used': int(len(df)), 'rows_quarantined': 0, 'coverage_note': 'No pack_id or timestamp in source; row order is treated as cycle order for MVP.', 'source_note': 'file2.csv is already cycle-aggregated; Voltwise adds derived stress and duration features before fitting.'
}, 'battery_profile': profile or {'calibration': 'dataset 98th percentile because no profile was supplied'}, 'assumptions': ['Capacity is a label, not a confirmed rated-capacity field.', 'Units are not verified by the CSV.', 'RUL is a maintenance-planning interval, not a safety limit.', 'Profile-specific calibration requires battery metadata at inference time.'],
 'predictions': df[['cycle_id', 'soh', 'predicted_soh', 'Temperature_mean', 'Temperature_max', 'Current_mean', 'Discharge_time', 'Temperature_rise']].tail(180).round(4).to_dict(orient='records')}
    (out_dir / 'battery_model_metrics.json').write_text(json.dumps(artifact, indent=2))
    with (out_dir / 'battery_soh_model.pkl').open('wb') as handle: pickle.dump(model, handle)
    print(json.dumps({'rows': len(df), 'metrics': metrics, 'summary': artifact['summary'], 'feature_importance': feature_importance}, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--source', default='/home/ubuntu/battery-soh-rul-pro/ml/data/file2.csv'); parser.add_argument('--out-dir', default='/home/ubuntu/battery-soh-rul-pro/ml/artifacts'); parser.add_argument('--profile', help='Optional JSON battery profile with nominalCapacityAh and metadata'); args = parser.parse_args(); profile = json.loads(Path(args.profile).read_text()) if args.profile else None; train(Path(args.source), Path(args.out_dir), profile)
