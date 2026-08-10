from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.io import loadmat


def scalar(value):
    array = np.asarray(value).reshape(-1)
    return float(array[0]) if len(array) else np.nan


def as_array(value):
    return np.asarray(value, dtype=float).reshape(-1)


def extract_battery(path: Path) -> list[dict]:
    mat = loadmat(path, squeeze_me=True, struct_as_record=False)
    key = path.stem
    battery = mat.get(key)
    if battery is None:
        candidates = [value for name, value in mat.items() if not name.startswith('__')]
        battery = candidates[0] if candidates else None
    if battery is None or not hasattr(battery, 'cycle'):
        return []

    cycles = np.asarray(battery.cycle, dtype=object).reshape(-1)
    rows: list[dict] = []
    discharge_number = 0
    for cycle in cycles:
        if getattr(cycle, 'type', '') != 'discharge':
            continue
        data = getattr(cycle, 'data', None)
        if data is None:
            continue
        required = ['Voltage_measured', 'Current_measured', 'Temperature_measured', 'Time', 'Capacity']
        if any(not hasattr(data, field) for field in required):
            continue
        voltage = as_array(data.Voltage_measured)
        current = as_array(data.Current_measured)
        temperature = as_array(data.Temperature_measured)
        elapsed = as_array(data.Time)
        capacity = scalar(data.Capacity)
        if not all(len(values) for values in [voltage, current, temperature, elapsed]) or not np.isfinite(capacity):
            continue
        count = min(len(voltage), len(current), len(temperature), len(elapsed))
        voltage, current, temperature, elapsed = [values[:count] for values in [voltage, current, temperature, elapsed]]
        discharge_number += 1
        rows.append({
            'Voltage_mean': float(np.nanmean(voltage)),
            'Voltage_std': float(np.nanstd(voltage)),
            'Current_mean': float(np.nanmean(current)),
            'Current_std': float(np.nanstd(current)),
            'Temperature_mean': float(np.nanmean(temperature)),
            'Temperature_max': float(np.nanmax(temperature)),
            'Discharge_time': float(np.nanmax(elapsed) - np.nanmin(elapsed)),
            'Temperature_rise': float(np.nanmax(temperature) - np.nanmin(temperature)),
            'Capacity': float(capacity),
            'cycle_id': discharge_number,
            'battery_id': path.stem,
            'source_dataset': 'NASA PCoE Battery Data Set',
            'source_file': path.name,
            'ambient_temperature': float(getattr(cycle, 'ambient_temperature', np.nan)),
        })
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--input-dir', default='ml/data/nasa_extracted')
    parser.add_argument('--output', default='ml/data/nasa_discharge_cycles.csv')
    parser.add_argument('--manifest', default='ml/data/nasa_manifest.json')
    args = parser.parse_args()

    files = sorted(Path(args.input_dir).rglob('*.mat'))
    unique: dict[str, Path] = {}
    for path in files:
        unique.setdefault(path.stem, path)

    rows: list[dict] = []
    file_reports = []
    for path in unique.values():
        extracted = extract_battery(path)
        rows.extend(extracted)
        file_reports.append({'file': str(path), 'battery_id': path.stem, 'discharge_rows': len(extracted)})

    frame = pd.DataFrame(rows)
    if frame.empty:
        raise RuntimeError('No discharge cycles were extracted from NASA MAT files.')
    frame = frame.replace([np.inf, -np.inf], np.nan).dropna(subset=['Capacity']).reset_index(drop=True)
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(args.output, index=False)
    manifest = {
        'source': 'NASA PCoE Battery Data Set',
        'official_download': 'https://phm-datasets.s3.amazonaws.com/NASA/5.+Battery+Data+Set.zip',
        'citation': 'B. Saha and K. Goebel (2007), Battery Data Set, NASA Prognostics Data Repository, NASA Ames Research Center.',
        'mat_files_discovered': len(files),
        'unique_batteries_used': len(unique),
        'rows_extracted': len(frame),
        'battery_ids': sorted(frame['battery_id'].unique().tolist()),
        'feature_mapping': 'Discharge-cycle time-series arrays are aggregated into the Voltwise cycle-level feature contract; NASA Capacity is the health label.',
        'files': file_reports,
        'caution': 'NASA and user data are retained with source provenance and should be compared across datasets before any combined model is claimed as generalizable.',
    }
    Path(args.manifest).write_text(json.dumps(manifest, indent=2))
    print(json.dumps({'rows': len(frame), 'batteries': len(unique), 'output': args.output, 'manifest': args.manifest}, indent=2))


if __name__ == '__main__':
    main()
