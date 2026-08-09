# Voltwise Upgrade Checklist

## Architecture and safety
- [x] Confirm sensor transport and payload contract for voltage, current, temperature, SOC, timestamp, cycle_id, pack_id, and battery profile ID.
- [x] Define battery onboarding profile: chemistry, nominal capacity, nominal/max/min voltage, rated current, thermal limits, manufacturer, model, installation date, prior cycles, and pack topology.
- [x] Choose the runtime path for real-time ingestion, scheduled image capture, model training, and persistent storage: dedicated always-on service, persistent worker, database, scheduled vision jobs, and alert queue.
- [x] Confirm managed always-on hosting versus a local/owned machine before enabling continuous runtime; managed hosting is 1 vCPU / 512 MB and usage-based, up to about $37.50/month at full utilization before the $10 monthly credit.
- [x] Document non-negotiable safety boundaries: no BMS bypass instructions, no unsafe operating recommendations, human review for anomalies.

## Backend and data workflows
- [x] Upgrade the static project with a backend, database schema, secure secrets, and authenticated operator access.
- [x] Add telemetry ingestion endpoint and validation for live sensor packets, including profile-aware range checks and last-seen heartbeat.
- [x] Add telemetry history, anomaly events, model-run persistence, and an operator alert queue.

## Machine learning
- [x] Add dataset upload and schema validation for labeled battery-cycle data.
- [x] Implement a reproducible training pipeline with train/validation/test split, feature engineering, baseline model, metrics, model versioning, and profile-specific calibration.
- [x] Implement SoH prediction, near-term projection, RUL interval estimation, and feature attribution.
- [x] Display uncertainty, data coverage, drift warnings, and assumptions in the UI.

## Computer vision
- [x] Add manual camera/image intake and a clearly labeled inspection review workflow; scheduled capture and device heartbeat remain deployment prerequisites.
- [x] Define a safe inspection label set: visible swelling/deformation, leakage/corrosion, discoloration/thermal damage, connector/cable anomaly, occlusion/low confidence, and no visible anomaly.
- [x] Implement image inference integration or a clearly labeled inspection adapter with confidence and human-review state.
- [x] Store inspection results, evidence image references, and escalation events.

## Product experience
- [x] Add workbench sections for live telemetry, model training, vision inspections, alert queue, and model notes; routes can be split later without changing the contracts.
- [x] Add backend heartbeat/last-seen status, session-local alert acknowledgment, and an operator audit-trail contract; production persistence requires connecting an authenticated profile in deployment.
- [x] Preserve the Voltwise Instrument Greenroom visual system and safety disclaimer.

## Validation and delivery
- [x] Test ingestion validation, scenario switching, model-run states, vision review states, and responsive UI.
- [x] Run TypeScript, production build, and visual verification checks.
- [x] Document what is implemented, what requires credentials/hardware, and how to connect a battery sensor safely.

## Gap remediation discovered during validation
- [x] Implement profile-aware telemetry validation using battery profile voltage, current, and thermal limits before accepting packets.
- [x] Persist and expose device/profile last-seen heartbeat timestamps for live monitoring status.
- [x] Create anomaly detection and event persistence from telemetry rule violations and model outputs.
- [x] Build an MVP operator alert queue UI with acknowledgment states and the safety_alerts server contract; the current UI clearly labels session-local acknowledgment until a profile is connected.
- [x] Generate alerts automatically from telemetry, inspection, and model workflows.

## Uploaded dataset integration
- [x] Inspect `/home/ubuntu/upload/file2.csv` for columns, row count, missingness, units, duplicate timestamps, and battery/pack identifiers.
- [x] Map the CSV fields to Voltwise telemetry and SoH/RUL labels without guessing undocumented units.
- [x] Add reproducible CSV validation and feature-engineering code that can run on this dataset and future uploads.
- [x] Add a real training/evaluation path using the uploaded data, including split discipline, metrics, model version, and uncertainty.
- [x] Connect dataset-backed outputs to the dashboard and model-run state.
- [x] Document the dataset assumptions, rejected rows, hardware connection contract, and safety boundaries.

## CSV integration gap remediation
- [x] Implement a real dataset upload flow in the UI and backend with schema validation, error reporting, and invalid-row quarantine.
- [x] Replace hardcoded local-path scripts with reusable import utilities that accept future uploads and produce validation reports.
- [x] Add explicit CSV-to-Voltwise field mapping with confirmed/unknown units and missing identifier handling.
- [x] Extend training to train/validation/test splits, baseline comparison, and profile-specific calibration using battery metadata when available.
- [x] Add explicit artifact-backed uncertainty, data coverage, assumptions, and drift-warning UI.
- [x] Persist training/run requests into modelRuns and expose the backend procedure; the current dashboard also ships the verified artifact for deterministic offline viewing.

## Final evidence gaps
- [x] Add explicit feature-engineering steps or document that file2.csv is already feature-engineered, and include that provenance in the model artifact.
- [x] Add focused verification evidence for scenario switching, model-run states, vision review states, and responsive UI behavior.
- [x] Write a project-level setup and operations guide covering implemented modules, required secrets/hardware, safe sensor connection contract, and runtime/deployment prerequisites.
