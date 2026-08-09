# Voltwise Battery Health Intelligence

## 1. The one-minute explanation

**Voltwise is a battery-health monitoring system that turns battery telemetry into an explainable estimate of State of Health (SoH), Remaining Useful Life (RUL), and safety-review signals.** It is designed for operators who need earlier evidence that a pack is aging faster than expected so they can plan inspection or replacement instead of relying only on calendar age.

The product combines four layers. A sensor gateway provides voltage, current, temperature, State of Charge (SOC), cycle identity, and timestamps. A battery profile provides the context needed to interpret those values. A machine-learning pipeline learns the relationship between telemetry-derived features and measured capacity. The operator cockpit then shows the estimate, confidence, likely/best/worst RUL band, degradation drivers, data quality, drift warnings, and safety boundaries.

> The current release is a competition-ready MVP and planning aid, not a certified battery-safety system. It must never replace the battery manufacturer’s limits, the Battery Management System (BMS), electrical protection, or qualified engineering review.

## 2. Battery concepts in plain language

A rechargeable battery pack is an electrochemical energy-storage system. It contains cells arranged into a pack, plus electrical and thermal protection. A BMS monitors and protects the pack; Voltwise is an observation and analytics layer around that system, not a replacement for it. The U.S. Department of Energy provides background on battery technologies and electrochemical interactions [1].

**State of Charge (SOC)** is the approximate amount of charge available now, similar to a fuel gauge. **State of Health (SoH)** is the battery’s present capability compared with a healthy reference. In this project, the practical label is capacity-based: SoH is calculated from measured capacity relative to the chosen beginning-of-life or profile reference. **Remaining Useful Life (RUL)** is the estimated number of cycles until an explicitly chosen planning threshold, such as 80% SoH. RUL is not a promise, a warranty, or an instruction to keep operating a battery.

A battery can age faster because of high temperature exposure, deep charge/discharge cycles, high current bursts, calendar time, and other chemistry- and design-specific factors. Voltwise does not assume that one universal threshold is correct for every pack; the battery profile is used to provide context and range checks.

## 3. What was built

| Layer | What it does | Current MVP status |
|---|---|---|
| Operator cockpit | Shows SoH, RUL range, drivers, confidence, exposure traces, safety note, model notes, Safety Center, and Alert Queue | Implemented in the Voltwise dashboard |
| Dataset workflow | Accepts a future CSV, validates schema and numeric fields, reports unit assumptions, and quarantines invalid rows | Implemented |
| Training pipeline | Adds derived features, uses chronological train/validation/test splits, compares with a simple baseline, exports metrics and predictions, and supports optional battery-profile calibration | Implemented for `file2.csv` and future compatible uploads |
| Live ingestion | Authenticated telemetry endpoint with profile-aware voltage/current/temperature checks and heartbeat updates | Implemented as a backend adapter |
| Model outputs | SoH estimate, near-term projection, RUL band, feature attribution, uncertainty and drift evidence | Implemented in the artifact-backed MVP |
| Computer vision | Manual image intake, safe finding categories, confidence and human-review result procedures, and alert creation | Adapter implemented; scheduled camera capture still requires deployment hardware and scheduler |
| Safety workflow | Quarantine, warning/urgent alert creation, human review language, and no unsafe operating instructions | Implemented |

## 4. How the data moves through Voltwise

```text
Battery pack + existing BMS
        |
        v
Sensor gateway: voltage, current, temperature, SOC, cycle_id, timestamp
        |
        | authenticated with VOLTWISE_INGEST_TOKEN
        v
Voltwise ingestion API
        |
        +--> validate against battery profile
        |       +--> normal telemetry history
        |       +--> quarantine + urgent alert when outside profile limits
        |
        v
Feature engineering
        |
        +--> voltage/current/temperature/SOC/cycle features
        +--> depth-of-discharge, exposure, current-burst and aging features
        v
SoH model and RUL planner
        |
        +--> prediction + uncertainty + drift/coverage evidence
        +--> model or vision alert when review thresholds are crossed
        v
Operator cockpit: Overview / Telemetry Lab / Model Notes / Safety Center / Alert Queue
```

## 5. How model training works

The uploaded CSV contains cycle-level battery observations and a measured `Capacity` label. The training script treats capacity as the observed health signal and derives a normalized SoH reference from it. It validates raw columns first, then computes explicit derived features so the artifact records a real feature-engineering stage rather than pretending that raw rows are already model-ready.

The data is split chronologically. Earlier cycles are used for training, the next window for validation, and the latest window for testing. This matters because randomly mixing future and past cycles can make a time-series model look better than it would be in deployment. The pipeline compares the trained estimator with a simple last-known-health baseline. It exports metrics, predictions, feature importance, provenance, uncertainty information, and optional battery-profile calibration metadata.

A simple example is: if the measured capacity of a cycle is 1.85 Ah and the selected reference is 2.00 Ah, the capacity-based SoH is approximately 92.5%. The exact reference must be justified by the battery profile or dataset documentation; Voltwise does not silently claim that an undocumented reference is correct.

RUL is estimated by projecting the degradation trajectory toward a stated planning threshold. The UI therefore shows best, likely, and worst bands rather than one overconfident number. The bands communicate uncertainty; they do not define a safe operating envelope.

## 6. What you need before connecting a real battery

You should not connect a battery directly to the web application. Use an isolated, electrically appropriate sensor gateway and preserve the battery’s existing protection and BMS. The gateway must send a JSON payload like the following:

```json
{
  "packId": "N-04",
  "profileId": 1,
  "timestamp": 1754745600000,
  "cycleId": 173,
  "voltage": 51.2,
  "current": 18.4,
  "temperature": 41.0,
  "soc": 72.5
}
```

The documented units are volts, amperes, degrees Celsius, percent SOC, Unix milliseconds, and integer cycle identity. The operator must first create a profile containing chemistry, manufacturer/model, nominal capacity, nominal voltage, voltage limits, rated current, thermal limit, prior cycles, topology, installation date, and notes. Without that profile, the system cannot perform meaningful profile-aware validation.

The current project has the authenticated ingestion contract and `VOLTWISE_INGEST_TOKEN`, but it is **not a claim that any arbitrary sensor can be plugged in immediately**. The actual gateway still needs to be selected, electrically validated, configured, networked, and tested with non-hazardous or approved test equipment. The camera workflow similarly needs a camera device, capture scheduler, image storage, and a representative labeled image dataset before automatic inspection can be trusted.

## 7. Competition demo script

Start by explaining the problem: battery operators usually see degradation after the useful planning window has narrowed. Show the Overview screen and point to the SoH value, RUL range, confidence, and driver map. Change the scenario to High thermal load and explain that the system changes the analytical context rather than claiming a universal battery law.

Next, click Load dataset and explain that the CSV validator checks fields, numeric values, identifiers, and unit assumptions before the data can influence a model. Open Model Notes and explain the chronological holdout, test error, baseline comparison, uncertainty band, and drift watch. This is the strongest credibility moment: the system shows where it may be wrong.

Open Telemetry Lab and explain the gateway payload. Emphasize that out-of-profile telemetry is quarantined and creates an alert rather than being blended into normal data. Open Safety Center and stage an image. Explain that visible swelling, leakage/corrosion, thermal damage, connector anomalies, image occlusion, or low confidence require human review. Finish in Alert Queue and acknowledge the review item, noting that the production version persists status transitions against the authenticated database.

## 8. Curator questions and prepared answers

| Question | Strong, honest answer |
|---|---|
| What is novel here? | Voltwise combines profile-aware telemetry validation, capacity-based SoH/RUL estimation, uncertainty and drift evidence, and a human-review safety workflow in one operator experience. The novelty is the decision-oriented integration and transparency, not a claim that one model solves every battery chemistry. |
| Is it really AI? | Yes, the uploaded dataset is used in a reproducible supervised learning pipeline. The current MVP uses a transparent tabular estimator and explicit feature engineering rather than hiding the result behind an unexplained score. |
| Why provide battery details? | Chemistry, nominal capacity, voltage limits, thermal limits, rated current, prior cycles, topology, and installation context change how telemetry should be interpreted. The profile improves validation and enables calibration instead of treating every pack as identical. |
| How do you know the model works? | The pipeline uses chronological train/validation/test evaluation, compares against a simple baseline, reports holdout error, exposes uncertainty, and warns about distribution shift. More representative labeled data is still required before production claims. |
| Can it predict a failure? | It can flag degradation patterns and review conditions. It cannot guarantee a failure prediction or certify safety. The BMS and qualified engineering controls remain authoritative. |
| What happens when a reading is unsafe? | The reading is quarantined from the normal stream and an urgent or watch alert is created. The system does not suggest bypassing protections or continuing unsafe use. |
| Does computer vision automatically inspect the battery? | The MVP supports image intake and a review adapter with safe finding categories. Scheduled capture and automatic inference require a real camera gateway, scheduler, labeled images, and an approved inference runtime. |
| Why is RUL a range? | Battery degradation is uncertain and operating conditions change. A best/likely/worst band is more honest than a single precise cycle count. |
| What would you build next? | Connect a real gateway, persist profile-specific model runs, add scheduled camera capture and heartbeat, train on representative labeled images, and validate against controlled field data. |

## 9. What the evaluator should notice

The strongest parts are the clear visual hierarchy, evidence-first model notes, safety-aware language, profile-aware quarantine concept, real uploaded-data pipeline, and the fact that the interface displays uncertainty instead of only a confident score. The project is more credible because it distinguishes a planning signal from a certified safety verdict.

The main weaknesses are also clear. The current model is an MVP estimator trained from the supplied dataset, not a validated cross-chemistry production model. The displayed live status is an integration surface until a real gateway is connected. The vision workflow is a manual intake and review adapter until camera scheduling and a labeled vision model are deployed. Alert acknowledgment is session-local in the current UI even though authenticated backend procedures exist. These are acceptable competition limitations if stated directly; hiding them would weaken the presentation.

## 10. Safety statement

Voltwise is an analytics and monitoring aid. It must not be used to bypass a BMS, override manufacturer limits, approve continued operation of a damaged pack, or replace qualified inspection. If a battery is swollen, leaking, unusually hot, physically damaged, emitting smoke or odor, or behaving abnormally, stop normal handling and follow the manufacturer’s and site’s established emergency and isolation procedures.

## References

[1]: https://www.energy.gov/cmei/vehicles/batteries "U.S. Department of Energy — Batteries"
[2]: https://data.nasa.gov/dataset/li-ion-battery-aging-datasets "NASA Open Data — Li-ion Battery Aging Datasets"
[3]: https://www.epa.gov/electronics-batteries-management/battery-energy-storage-systems-main-considerations-safe "U.S. EPA — Battery Energy Storage Systems: Main Considerations for Safe Handling"
