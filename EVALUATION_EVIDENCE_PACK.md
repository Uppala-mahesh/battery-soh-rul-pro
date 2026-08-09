# Voltwise Evaluation Evidence Pack

## 1. System claim

Voltwise is an explainable battery-health analytics MVP. It estimates battery State of Health and Remaining Useful Life from cycle-level telemetry and supports safety-aware human review. It is not a BMS replacement, a certified safety device, or a guarantee of failure timing.

## 2. Actual trained-data evidence

The current artifact is `dataset-file2-v2`, trained from `file2.csv` with 1,407 rows. The chronological split is 65% training (914 rows), 15% validation (211 rows), and 20% test (282 rows). The label is derived as `Capacity / 98th-percentile Capacity × 100`, clipped to 0–110. The source is already cycle-aggregated; Voltwise adds absolute mean current, temperature margin, thermal-stress proxy, and discharge duration in hours.

| Measure | Validation | Test | Baseline test |
|---|---:|---:|---:|
| SoH MAE, percentage points | 15.76 | 25.31 | 40.58 |
| SoH RMSE, percentage points | 24.89 | 31.99 | 43.94 |
| R² | 0.590 | 0.328 | -0.269 |

The model improves on the simple baseline in this dataset, but the test error is still large enough that the result should be presented as a planning signal with uncertainty, not an exact health measurement. The source has no confirmed pack ID or timestamp; row order is treated as cycle order for this MVP. Units also require confirmation before field deployment.

## 3. Controlled telemetry demonstration procedure

The controlled demo is **procedure-ready but hardware-blocked** until the ECE teammate confirms the battery, BMS, interface, isolation, and gateway. Do not claim that a live battery test was completed unless it actually was.

First, use a safe playback file, simulator, approved low-voltage test source, or sensor fixture. Send valid packets with a known pack ID and profile ID. Confirm that the service accepts valid numeric telemetry, updates the last-seen heartbeat, stores the event, produces a model-ready feature record, and updates the dashboard state.

Next, send deliberately invalid or out-of-profile values in the test environment. Confirm that the service quarantines them, does not treat them as normal model data, and creates an alert. Test a missing field, malformed numeric value, stale timestamp, wrong profile ID, and temporary gateway disconnect. Save the request payloads, response status, alert record, and dashboard screenshots as evidence.

The acceptance result for the software-only demo is: valid packet accepted; invalid packet rejected or quarantined; alert created; no unsafe operational recommendation shown; uncertainty and assumptions visible. The live-pack acceptance result remains pending qualified hardware review.

## 4. Safety review

The BMS remains the protection authority. The gateway must not bypass the BMS. The web application must never be connected directly to battery power or unknown connector pins. The gateway must use an approved isolated interface or approved sensors with appropriate ratings. The chemistry, voltage limits, capacity, current limits, connector pinout, and measurement reference must be verified before field observation.

Out-of-profile telemetry is quarantined. Vision findings are human-review states. RUL is a maintenance-planning interval, not a safety limit. Any suspected swelling, leakage, thermal damage, smoke, unusual odor, or other physical hazard requires stopping the demonstration and following qualified battery-safety procedures.

## 5. Architecture evidence

The companion file `VOLTWISE_ARCHITECTURE.mmd` shows the complete flow: battery and BMS, isolated gateway, secure ingestion, validation/quarantine, database, feature engineering, SoH/RUL model, vision adapter, alert queue, and operator cockpit.

## 6. Limitations to state openly

The supplied dataset does not confirm battery chemistry, rated-capacity reference, units, pack identity, or timestamps. The first model therefore demonstrates the pipeline rather than universal battery performance. Profile-specific calibration and representative data from the target battery are required. Scheduled camera capture, production computer-vision inference, persistent alert acknowledgment, and always-on runtime still require deployment configuration and hardware integration.

## 7. Submission conclusion

Voltwise is strongest as an evidence-first, explainable decision-support system. Its competition contribution is the combination of battery-profile validation, quarantine of unsafe telemetry, transparent model evidence, uncertainty-aware RUL bands, human-reviewed vision intake, and a safety-centered operator workflow.
