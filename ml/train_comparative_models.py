from __future__ import annotations

import argparse
import json
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

RAW_FEATURES = ['Voltage_mean', 'Voltage_std', 'Current_mean', 'Current_std', 'Temperature_mean', 'Temperature_max', 'Discharge_time', 'Temperature_rise']
DERIVED_FEATURES = ['current_abs_mean', 'temperature_margin', 'thermal_stress_proxy', 'discharge_hours']
FEATURES = RAW_FEATURES + DERIVED_FEATURES


def add_features(frame: pd.DataFrame, source: str) -> pd.DataFrame:
    frame = frame.copy()
    frame = frame.drop(columns=[column for column in ['Unnamed: 0'] if column in frame.columns])
    missing = [column for column in RAW_FEATURES + ['Capacity'] if column not in frame.columns]
    if missing:
        raise ValueError(f'{source} missing required columns: {missing}')
    frame = frame.dropna(subset=RAW_FEATURES + ['Capacity']).reset_index(drop=True)
    frame['current_abs_mean'] = frame['Current_mean'].abs()
    frame['temperature_margin'] = frame['Temperature_max'] - frame['Temperature_mean']
    frame['thermal_stress_proxy'] = frame['Temperature_max'] * frame['temperature_margin']
    frame['discharge_hours'] = frame['Discharge_time'] / 3600.0
    if 'source_dataset' not in frame.columns:
        frame['source_dataset'] = source
    if 'battery_id' not in frame.columns:
        frame['battery_id'] = source
    if 'cycle_id' not in frame.columns:
        frame['cycle_id'] = np.arange(1, len(frame) + 1)
    reference = frame.groupby('source_dataset')['Capacity'].transform(lambda values: values.quantile(0.98))
    frame['soh'] = np.clip(frame['Capacity'] / reference * 100.0, 0, 110)
    return frame


def model() -> Pipeline:
    return Pipeline([
        ('scale', StandardScaler()),
        ('regressor', GradientBoostingRegressor(random_state=42, n_estimators=180, max_depth=2, learning_rate=0.04, loss='huber')),
    ])


def score(truth: pd.Series, prediction: np.ndarray) -> dict:
    if len(truth) == 0:
        return None
    return {
        'rows': int(len(truth)),
        'mae_soh_points': float(mean_absolute_error(truth, prediction)),
        'rmse_soh_points': float(mean_squared_error(truth, prediction) ** 0.5),
        'r2': float(r2_score(truth, prediction)) if len(set(truth)) > 1 else None,
    }


def chronological_split(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    ordered = frame.sort_values(['battery_id', 'cycle_id']).reset_index(drop=True)
    n = len(ordered)
    train_end = max(1, int(n * 0.65))
    validation_end = max(train_end + 1, int(n * 0.8))
    return ordered.iloc[:train_end], ordered.iloc[train_end:validation_end], ordered.iloc[validation_end:]


def source_aware_split(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    pieces = []
    for _, source_frame in frame.groupby('source_dataset', sort=True):
        pieces.append(chronological_split(source_frame))
    return tuple(pd.concat([piece[index] for piece in pieces], ignore_index=True) for index in range(3))


def evaluate_dataset(frame: pd.DataFrame, name: str) -> dict:
    train, validation, test = source_aware_split(frame) if name == 'combined' else chronological_split(frame)
    estimator = model()
    estimator.fit(train[FEATURES], train['soh'])
    validation_pred = estimator.predict(validation[FEATURES]) if len(validation) else np.array([])
    test_pred = estimator.predict(test[FEATURES]) if len(test) else np.array([])
    baseline = np.repeat(float(train['soh'].iloc[-1]), len(test))
    return {
        'dataset': name,
        'rows': int(len(frame)),
        'batteries': int(frame['battery_id'].nunique()),
        'capacity_reference_ah_by_source': {source: float(group['Capacity'].quantile(0.98)) for source, group in frame.groupby('source_dataset')},
        'train': score(train['soh'], estimator.predict(train[FEATURES])),
        'validation': score(validation['soh'], validation_pred),
        'test': score(test['soh'], test_pred),
        'baseline_test': score(test['soh'], baseline),
        'split': 'chronological 65/15/20 after sorting by battery_id and cycle_id',
        'model': 'GradientBoostingRegressor with StandardScaler and Huber loss',
    }, estimator, test.assign(predicted_soh=np.clip(test_pred, 0, 110))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--user-source', default='ml/data/file2.csv')
    parser.add_argument('--nasa-source', default='ml/data/nasa_discharge_cycles.csv')
    parser.add_argument('--out-dir', default='ml/artifacts')
    args = parser.parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    user = add_features(pd.read_csv(args.user_source), 'User-provided file2.csv')
    nasa = add_features(pd.read_csv(args.nasa_source), 'NASA PCoE Battery Data Set')
    combined = pd.concat([user, nasa], ignore_index=True)

    results = {}
    predictions = []
    for name, frame in [('user_file2', user), ('nasa_pcoe', nasa), ('combined', combined)]:
        evaluation, estimator, test_rows = evaluate_dataset(frame, name)
        results[name] = evaluation
        test_rows = test_rows[['source_dataset', 'battery_id', 'cycle_id', 'soh', 'predicted_soh']]
        test_rows['evaluation_dataset'] = name
        predictions.append(test_rows)
        with (out_dir / f'{name}_battery_soh_model.pkl').open('wb') as handle:
            pickle.dump(estimator, handle)

    artifact = {
        'model_name': 'Voltwise Comparative SoH/RUL Training Evidence',
        'model_version': 'user-file2-plus-nasa-pcoe-v1',
        'sources': {
            'user_file2': {'filename': Path(args.user_source).name, 'rows': int(len(user)), 'label': 'Capacity from user-provided CSV'},
            'nasa_pcoe': {'filename': Path(args.nasa_source).name, 'rows': int(len(nasa)), 'label': 'NASA discharge-cycle Capacity'},
        },
        'results': results,
        'feature_columns': FEATURES,
        'feature_engineering': ['absolute current magnitude', 'temperature margin', 'thermal stress proxy', 'discharge seconds converted to hours'],
        'label_definition': 'Within each source dataset, SoH = Capacity / source 98th-percentile Capacity × 100, clipped to 0–110.',
        'interpretation': 'The combined result demonstrates training on broader data, while per-source results show whether performance is consistent. Different cells, protocols, and units mean this is not proof of universal battery generalization.',
        'rul_definition': 'RUL is a planning projection toward 80% SoH based on the recent predicted-health slope; it is not a failure date or safety limit.',
        'safety': 'The estimator supports monitoring and maintenance planning. It must not replace the BMS, electrical protection, qualified review, or manufacturer limits.',
    }
    (out_dir / 'comparative_metrics.json').write_text(json.dumps(artifact, indent=2))
    pd.concat(predictions, ignore_index=True).to_csv(out_dir / 'comparative_test_predictions.csv', index=False)
    print(json.dumps(artifact, indent=2))


if __name__ == '__main__':
    main()
