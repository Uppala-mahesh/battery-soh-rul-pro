# Voltwise: Emergency Submission Cheat Sheet

## Say this first

“Voltwise is an explainable battery-health monitoring system. It uses battery telemetry and historical degradation data to estimate State of Health, predict Remaining Useful Life as a range, identify degradation drivers, and create safety-aware review alerts. The goal is to help operators plan inspection and replacement earlier instead of discovering battery aging too late.”

## Battery basics

A battery stores electrical energy using electrochemical cells. A Battery Management System, or BMS, monitors and protects the pack. Voltwise does not replace the BMS. It is an analytics layer that reads approved telemetry such as voltage, current, temperature, SOC, cycle number, and time.

**SOC** means how much charge is available now, like a fuel gauge. **SoH** means how healthy the battery is compared with a healthy reference. In this project, SoH is based mainly on measured capacity compared with a reference capacity. **RUL** means the estimated remaining cycles until a stated planning threshold, such as 80% SoH. RUL is an estimate with uncertainty, not a guarantee.

## How the project works

The uploaded CSV contains battery-cycle data and a measured Capacity label. The pipeline validates the CSV, removes or quarantines invalid rows, derives battery features, and trains a tabular machine-learning model. The data is split chronologically so earlier cycles are used for training and later cycles are used for testing. This is more realistic for time-series degradation than randomly mixing future and past cycles.

The model produces SoH predictions, degradation trends, feature importance, uncertainty, and a best/likely/worst RUL band. The dashboard explains the result using temperature exposure, deep-cycle behavior, current bursts, confidence, data coverage, and drift warnings.

The system also contains a secure telemetry-ingestion contract. A future gateway can send `packId`, `profileId`, `timestamp`, `cycleId`, `voltage`, `current`, `temperature`, and `soc`. Voltwise checks the reading against the battery profile. Out-of-range readings are quarantined and create an alert instead of silently entering normal data.

## What is built now

The MVP includes a polished Voltwise dashboard, real uploaded-CSV validation, feature-engineered chronological model training, SoH/RUL outputs, uncertainty and drift evidence, battery-profile validation, authenticated ingestion procedures, heartbeat logic, safety alerts, manual image intake, human-review states, Safety Center, Alert Queue, operations documentation, and a hardware connection contract.

## What is not yet complete

The project is not yet an unattended certified safety system. A real battery still requires an approved isolated sensor gateway, an exact battery profile, controlled electrical testing, an authenticated deployment, and review by an ECE-qualified teammate. The camera workflow is currently a manual image-intake and review adapter; scheduled camera capture and a production computer-vision model require hardware, labeled images, storage, and a scheduler.

## 60-second pitch

“Battery failures are difficult to anticipate because degradation depends on temperature, current, cycle depth, and battery history. Voltwise converts this telemetry into an explainable health signal. It estimates SoH, gives an uncertainty-aware RUL range, identifies the conditions contributing to degradation, validates readings against a battery profile, and creates safety review alerts. We trained the first model from the supplied labeled battery CSV using feature engineering and chronological evaluation. Our key design choice is transparency: we show confidence, data coverage, drift warnings, and assumptions instead of presenting a black-box number. This is an evaluation-ready MVP and planning aid, not a replacement for the BMS or certified engineering controls.”

## Three-minute demo

Start on Overview. Point to the SoH, RUL likely value, confidence, and thermal-load cards. Say that the number is an estimate and that the range matters more than false precision.

Open Model Notes. Explain the uploaded CSV, the Capacity label, derived features, chronological train/validation/test split, baseline comparison, and uncertainty. Say that a real production model must be retrained on representative data from the target chemistry and pack.

Open Telemetry Lab. Explain the future gateway payload. Emphasize that profile-aware validation prevents out-of-range telemetry from silently contaminating the health model.

Open Safety Center. Explain that images can be staged for human review for swelling, leakage/corrosion, thermal damage, connector anomalies, or low-confidence images. Do not claim automatic certified vision safety.

Open Alert Queue. Explain that telemetry, model, and inspection findings can become review items. Finish by stating the next deployment step: connect one controlled gateway using the documented contract and validate it against known measurements before observing a live pack.

## Curator answers

**Is it AI?** Yes. It uses a supervised tabular machine-learning pipeline trained from labeled battery data, with explicit feature engineering and chronological evaluation. It is not claiming that one model works for every chemistry.

**Why do you need battery details?** Chemistry, nominal capacity, voltage limits, current rating, thermal limits, age, topology, and prior cycles affect how readings should be interpreted. The profile improves validation and calibration.

**Can it guarantee battery failure?** No. It estimates degradation and highlights review conditions. It cannot guarantee failure prediction or certify safety.

**What happens to unsafe data?** It is quarantined and generates an urgent or watch alert. The system never recommends bypassing the BMS or exceeding manufacturer limits.

**Why is RUL a range?** Because future temperature, load, usage, and degradation are uncertain. A best/likely/worst range is more honest than one exact cycle number.

**What is the biggest limitation?** The first model is trained on the supplied dataset and needs controlled field validation for the exact battery chemistry and pack design.

**What is the next step?** Connect a compatible isolated gateway through a qualified ECE teammate, create the real battery profile, test with a safe non-hazardous source, then run a controlled live demonstration.

## One sentence to remember

“Voltwise does not replace the BMS; it adds an explainable evidence layer that helps operators understand battery aging earlier and decide when human review is needed.”

## Safety sentence

“Never connect a battery directly to the laptop or web app, never guess a connector pinout, and never bypass the BMS; live wiring must be designed and checked by a qualified electronics teammate.”
