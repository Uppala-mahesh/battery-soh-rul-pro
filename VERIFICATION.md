# Voltwise Verification Record

## Automated checks

`pnpm check`, `pnpm test`, and `pnpm build` pass. The test suite covers authentication logout, CSV schema validation and quarantine behavior, and secure telemetry ingestion including profile-limit quarantine.

## Scenario and model-state checks

The dashboard scenario selector changes the synthetic telemetry seed and refreshes the derived SoH, RUL, driver, and exposure surfaces without changing the trained artifact metadata. The Model Notes workbench displays the packaged `file2.csv` provenance, chronological holdout metrics, baseline comparison, uncertainty band, feature-engineering assumptions, and a drift-watch state when test R² is below the review threshold. The Load dataset control accepts a future CSV and returns schema, unit-assumption, and quarantined-row feedback through the validated API path.

## Vision-review state checks

The Safety Center workbench presents the human-review boundary for visible swelling/deformation, leakage/corrosion, discoloration or thermal damage, connector/cable anomaly, occlusion/low confidence, and no visible anomaly. Vision/model result procedures create review alerts when findings or confidence cross configured thresholds. No visual result is treated as an automatic authorization to continue using a battery.

## Responsive visual checks

The cockpit has been captured at desktop and narrow viewport sizes. The sidebar, briefing surface, metric strip, charts, safety note, operator workbench, evidence grid, upload control, and model notes remain readable and preserve the safety hierarchy. Reduced-motion users receive the same information without requiring motion.

## Known integration boundary

Continuous image capture still requires a camera gateway and scheduler credentials. A real trained computer-vision model requires representative labeled images and a selected inference runtime. The current adapter intentionally preserves a human-review state instead of pretending that a generic visual classifier is certified for battery safety.

## Software-only gateway verification

On 2026-08-09, `scripts/simulate_gateway.mjs` was run against the actual local route `/api/ingest/telemetry` with `VOLTWISE_PROFILE_ID=1`. The route returned HTTP `404` with `{ "error": "unknown-profile" }`. This is an expected safe rejection because the database contains no approved real battery profile; the service did not accept telemetry against an invented profile. The result proves that the simulator reaches the real ingestion route, the device payload is parsed far enough to reach profile validation, and the profile prerequisite is enforced. A `202 accepted` run is intentionally deferred until the ECE teammate supplies a verified profile.

The existing Vitest suite additionally verifies the device-token contract and profile-limit quarantine. Model evidence is verified from the CSV artifact and the manual evaluator path; live heartbeat/model/alert persistence remains profile-dependent.
