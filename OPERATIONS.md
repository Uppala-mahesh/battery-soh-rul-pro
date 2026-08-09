# Voltwise Operations Guide

## What is implemented

Voltwise currently includes the Instrument Greenroom operator dashboard, battery profile persistence, secure telemetry ingestion using `VOLTWISE_INGEST_TOKEN`, profile-aware packet quarantine, heartbeat persistence, telemetry anomaly alerts, model and vision result adapters, CSV upload preview with schema validation and invalid-row reporting, a reproducible Python training pipeline, trained SoH/RUL artifacts from `file2.csv`, and artifact-backed model notes with uncertainty, coverage assumptions, and drift warnings.

The uploaded dataset is packaged at `ml/data/file2.csv`. The trained metrics are available at `ml/artifacts/battery_model_metrics.json`, and the Python estimator is available at `ml/artifacts/battery_soh_model.pkl`. The dashboard imports the metrics artifact so the current build visibly reflects the uploaded dataset rather than only synthetic scenarios.

## Reproduce the dataset run

From the project root, run:

```bash
python3 ml/train_battery_model.py --source ml/data/file2.csv --out-dir ml/artifacts
pnpm check
pnpm test
pnpm build
```

The optional profile calibration flag accepts a JSON file containing at least `nominalCapacityAh`, plus chemistry, nominal voltage, voltage limits, rated current, thermal limit, manufacturer, model, installation date, and topology metadata when available:

```bash
python3 ml/train_battery_model.py --source ml/data/file2.csv --profile battery-profile.json --out-dir ml/artifacts
```

The CSV currently has 1,407 cycle-level rows and no pack identifier or timestamp. Its `Capacity` column is treated as a label. SoH is calibrated against the 98th percentile capacity unless a trusted profile nominal capacity is supplied. Units must be confirmed against the battery datasheet before using real hardware.

## Sensor connection contract

A gateway should submit JSON packets to the monitoring ingestion endpoint using the project’s configured ingest token. Each packet should include `packId`, `profileId`, `timestamp` in UTC milliseconds, `cycleId`, voltage, current, temperature, SOC when available, and optional discharge depth. The gateway must preserve the BMS and hardware protections. Voltwise is an observer and planning system; it must never be used to bypass a BMS, suppress an alarm, or continue operation after visible swelling, leakage, smoke, uncontrolled heating, or other hazardous signs.

Before connecting a physical battery, confirm the sensor electrical isolation, voltage/current measurement range, polarity, sampling interval, pack topology, connector rating, enclosure, and thermal placement with a qualified engineer. Start with a non-energized wiring review and manufacturer-approved instrumentation. Do not attach unknown probes to a live high-energy pack.

## Credentials and runtime

The full-stack service uses the preconfigured database, OAuth, storage, and notification environment variables. The physical gateway requires `VOLTWISE_INGEST_TOKEN`. Continuous monitoring additionally requires a persistent always-on runtime and a gateway/camera device that can remain connected. The managed persistent reference is 1 vCPU / 512 MB, usage-based, up to approximately $37.50/month at full utilization before the monthly credit. The runtime choice must be confirmed before enabling continuous production monitoring.

## Computer vision boundary

The vision workflow is designed for periodic image evidence and human review. Its safe label set should include visible swelling/deformation, leakage/corrosion, discoloration or thermal damage, connector/cable anomaly, occlusion or low confidence, and no visible anomaly. A low-confidence or hazardous finding should create an alert and request qualified review; it must not produce an instruction to keep using the pack.

## Validation status

The current project passes TypeScript checks, six Vitest tests covering auth, CSV validation, and secure ingestion, and the production build. The dashboard has been visually checked at desktop and narrow responsive sizes. The model’s current chronological holdout MAE is approximately 25.3 SoH points with R² approximately 0.33, so this artifact is useful for a competition MVP and maintenance-planning demonstration but is not a certified safety or replacement decision system.
