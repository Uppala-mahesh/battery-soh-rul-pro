# Voltwise Battery Model Pipeline

This directory contains the reproducible training path for the uploaded `file2.csv` dataset. The dataset contains 1,407 labeled cycle-level records with aggregate features including voltage mean and standard deviation, current mean and standard deviation, mean and maximum temperature, discharge time, temperature rise, and measured `Capacity`.

The training script uses a chronological 80/20 split. It defines a planning SoH label as `Capacity / 98th-percentile Capacity × 100`, clipped to 0–110. This is a dataset calibration convention, not a manufacturer-certified rated capacity. Before connecting a real pack, replace or confirm the reference capacity using the pack datasheet and a controlled baseline test.

Run the pipeline from the project root with:

```bash
python3 ml/train_battery_model.py
```

The script writes `ml/artifacts/battery_model_metrics.json` and `ml/artifacts/battery_soh_model.pkl`. The dashboard imports the JSON metrics artifact to show the dataset-backed model version, holdout rows, SoH projection, RUL planning band, and holdout error. The pickle artifact is for controlled Python-side inference and is not itself a safety-certified decision engine.

The current dataset does not include an explicit pack identifier, timestamp, SOC, cycle depth, or manufacturer battery profile. The row order is therefore treated as chronological cycle order only for this MVP. Future uploads should include `pack_id`, `cycle_id`, `timestamp`, chemistry, nominal capacity, nominal voltage, safe voltage limits, rated current, thermal limits, SOC, and discharge depth. Rows with missing fields, invalid units, or profile-limit violations must be quarantined rather than silently accepted.

The model output is for maintenance planning and early review. It must not override the battery management system, charger protections, manufacturer limits, thermal protections, or qualified engineering review. Never use this project to bypass a BMS or continue operating a battery that shows swelling, leakage, smoke, uncontrolled heating, or other visible hazards.
