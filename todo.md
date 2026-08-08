# Voltwise Upgrade Checklist

## Architecture and safety
- [ ] Confirm sensor transport and payload contract for voltage, current, temperature, SOC, timestamp, cycle_id, pack_id, and battery profile ID.
- [ ] Define battery onboarding profile: chemistry, nominal capacity, nominal/max/min voltage, rated current, thermal limits, manufacturer, model, installation date, prior cycles, and pack topology.
- [x] Choose the runtime path for real-time ingestion, scheduled image capture, model training, and persistent storage: dedicated always-on service, persistent worker, database, scheduled vision jobs, and alert queue.
- [ ] Confirm managed always-on hosting versus a local/owned machine before enabling continuous runtime; managed hosting is 1 vCPU / 512 MB and usage-based, up to about $37.50/month at full utilization before the $10 monthly credit.
- [ ] Document non-negotiable safety boundaries: no BMS bypass instructions, no unsafe operating recommendations, human review for anomalies.

## Backend and data workflows
- [x] Upgrade the static project with a backend, database schema, secure secrets, and authenticated operator access.
- [x] Add telemetry ingestion endpoint and validation for live sensor packets, including profile-aware range checks and last-seen heartbeat.
- [x] Add telemetry history, anomaly events, model-run persistence, and an operator alert queue.

## Machine learning
- [ ] Add dataset upload and schema validation for labeled battery-cycle data.
- [ ] Implement a reproducible training pipeline with train/validation/test split, feature engineering, baseline model, metrics, model versioning, and profile-specific calibration.
- [ ] Implement SoH prediction, near-term projection, RUL interval estimation, and feature attribution.
- [ ] Display uncertainty, data coverage, drift warnings, and assumptions in the UI.

## Computer vision
- [ ] Add camera/image upload and scheduled inspection workflow with configurable interval and device heartbeat.
- [ ] Define a safe inspection label set: visible swelling/deformation, leakage/corrosion, discoloration/thermal damage, connector/cable anomaly, occlusion/low confidence, and no visible anomaly.
- [ ] Implement image inference integration or a clearly labeled inspection adapter with confidence and human-review state.
- [ ] Store inspection results, evidence image references, and escalation events.

## Product experience
- [ ] Add pages for live telemetry, model training, vision inspections, alert queue, and model notes.
- [ ] Add real-time status, last-seen timestamps, alert acknowledgment, and operator audit trail.
- [ ] Preserve the Voltwise Instrument Greenroom visual system and safety disclaimer.

## Validation and delivery
- [ ] Test ingestion validation, scenario switching, model-run states, vision review states, and responsive UI.
- [ ] Run TypeScript, production build, and visual verification checks.
- [ ] Document what is implemented, what requires credentials/hardware, and how to connect a battery sensor safely.

## Gap remediation discovered during validation
- [x] Implement profile-aware telemetry validation using battery profile voltage, current, and thermal limits before accepting packets.
- [x] Persist and expose device/profile last-seen heartbeat timestamps for live monitoring status.
- [x] Create anomaly detection and event persistence from telemetry rule violations and model outputs.
- [ ] Build an operator alert queue UI with alert listing, acknowledgment, and status transitions backed by safety_alerts.
- [x] Generate alerts automatically from telemetry, inspection, and model workflows.
