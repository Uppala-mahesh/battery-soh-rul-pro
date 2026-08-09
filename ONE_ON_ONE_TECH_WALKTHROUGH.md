# Voltwise One-on-One Technology Walkthrough

## Start with the simplest explanation

Voltwise is a web application that helps an operator understand whether a battery is aging normally or needs attention. A battery produces electrical energy. A BMS, or Battery Management System, protects the battery by monitoring limits such as voltage and temperature. Voltwise does not replace the BMS. It is an analytics and decision-support layer placed above approved battery telemetry.

The application asks four practical questions. First, how healthy is the battery now? That is **State of Health, or SoH**. Second, how much useful life may remain before a planning threshold such as 80% SoH? That is **Remaining Useful Life, or RUL**. Third, what conditions are associated with aging? Voltwise looks at temperature exposure, discharge duration/depth proxies, current bursts, and cycle behavior. Fourth, should a person review the situation? Voltwise creates uncertainty-aware alerts rather than giving unsafe operating instructions.

## What the main terms mean

| Term | Beginner explanation |
|---|---|
| Battery | A device that stores and releases electrical energy through electrochemical reactions. |
| Cell | One electrochemical unit. Packs contain many cells connected together. |
| Pack | A complete battery assembly made from cells, wiring, sensors, and usually a BMS. |
| BMS | The protection and monitoring system that enforces battery limits. |
| SOC | State of Charge: how full the battery is now, similar to a fuel gauge. |
| SoH | State of Health: current usable capability compared with a healthy reference. |
| RUL | Remaining Useful Life: an estimate of cycles or time until a defined planning threshold. |
| Telemetry | Measurements collected over time, such as voltage, current, temperature, SOC, and cycle ID. |
| Feature | A model input derived from raw data, such as mean temperature or thermal-stress proxy. |
| Label | The answer used during supervised training. In this dataset, measured Capacity is used to derive SoH. |

## How the data becomes a prediction

The supplied CSV contains cycle-level battery measurements and a Capacity column. The project first validates the file. It checks that required fields exist, values are numeric where expected, identifiers are usable, and undocumented units are clearly flagged. Invalid rows can be quarantined instead of silently entering the model.

The training script then creates features. It keeps raw aggregate measurements such as mean and standard-deviation voltage, mean and standard-deviation current, mean and maximum temperature, discharge time, and temperature rise. It also derives absolute mean current, temperature margin, a thermal-stress proxy, and discharge duration in hours.

The label is calculated as Capacity divided by a reference capacity, multiplied by 100. For the current MVP, the reference is the dataset’s 98th-percentile capacity because no confirmed manufacturer-rated capacity was supplied. This is an assumption and must be replaced with a verified battery profile before real deployment.

The data is divided chronologically: earlier cycles are used for training, the next section for validation, and later cycles for testing. This prevents future information from leaking into the past. A Gradient Boosting regression model is trained and compared with a simple baseline. The result is saved as a versioned artifact with metrics, feature columns, assumptions, feature importance, predictions, and uncertainty information.

## What the current model evidence says

The current model version is `dataset-file2-v2`, trained from 1,407 rows. It uses 914 training rows, 211 validation rows, and 282 chronological test rows. Test SoH MAE is approximately 25.31 percentage points, compared with approximately 40.58 for the baseline. The model improves on the baseline, but this error is still large. Therefore, the honest statement is that the model demonstrates a functioning research pipeline and planning signal, not a precise or certified battery-health measurement.

## Technology stack

| Layer | Technology | Why it is used |
|---|---|---|
| Frontend | React 19 + TypeScript | Builds the interactive dashboard with type safety. |
| Styling | Tailwind CSS 4 + custom CSS | Creates the Voltwise visual system and responsive cockpit layout. |
| UI components | shadcn-style components and Radix UI primitives | Provides accessible buttons, panels, dialogs, and interaction patterns. |
| Icons | Lucide React | Provides consistent interface icons. |
| Charts | Recharts | Renders SoH trends, confidence bands, telemetry views, and feature evidence. |
| Frontend routing | Wouter | Handles the application route structure. |
| Backend | Node.js + Express | Runs the server and API boundary. |
| API contract | tRPC 11 | Connects frontend and backend with typed procedures instead of untyped REST calls. |
| Authentication | Manus OAuth/session framework | Provides authenticated operator access. |
| Database | MySQL/TiDB through Drizzle ORM | Stores profiles, telemetry, model runs, inspections, and alerts. |
| Validation | Zod + server-side checks | Validates API payloads and uploaded CSV structure. |
| Model training | Python 3 + pandas + NumPy + scikit-learn | Loads CSV data, engineers features, trains the regression model, and calculates metrics. |
| Model artifact | Pickle plus JSON metrics | Stores the reusable model and dashboard-ready evidence. |
| File storage | S3-compatible project storage | Intended for evidence images and larger uploaded files. |
| Testing | Vitest + TypeScript checks | Tests procedures, validation logic, and compile correctness. |
| Deployment | Managed Manus web hosting; persistent runtime planned for always-on use | Hosts the dashboard and backend. |
| Visualization/design | Generated Voltwise assets and Instrument Greenroom design system | Makes the product feel like a battery intelligence cockpit rather than a generic dashboard. |

## Architecture in one sentence

The safe flow is: **battery and BMS → approved isolated sensor gateway → validated telemetry payload → secure ingestion → profile-aware quarantine and database → feature engineering → SoH/RUL model → uncertainty and alerts → Voltwise dashboard**.

The reason for the gateway is safety and separation. A browser should never be connected directly to a battery. The gateway is responsible for reading approved signals, adding timestamps and identifiers, buffering short network outages, and sending data using the ingestion credential. The BMS remains the authority for protection.

## What is implemented versus planned

The implemented MVP includes the dashboard, uploaded-CSV validation, feature-engineered chronological model training, model evidence, uncertainty and drift notes, battery-profile validation procedures, secure ingestion procedures, heartbeat logic, safety alerts, manual image intake, human-review states, an Alert Queue, operations documentation, and a hardware contract.

The following require the physical project environment: selecting the exact isolated gateway, confirming the battery profile, storing the real ingestion secret, validating the gateway with a safe test source, observing a live pack under qualified supervision, enabling a persistent always-on runtime, and scheduling camera capture. Do not claim those steps are complete unless they actually happen.

## How to present the AI claim

Say: “The AI component is a supervised machine-learning regression pipeline trained on labeled battery-cycle data. We derive battery-stress features, evaluate chronologically, compare against a baseline, expose feature importance and uncertainty, and use the output to support SoH/RUL planning.”

Do not say: “The AI guarantees when the battery will fail.” The correct wording is: “The model estimates a likely health trajectory and a range of remaining useful life, subject to data quality, battery profile, chemistry, and operating conditions.”

## A short demo script

Begin on the Overview screen. Point to estimated SoH, likely RUL, mean thermal load, and model confidence. Explain that the confidence and range are as important as the headline number.

Open Model Notes. Show that the model was trained on the uploaded CSV, explain the label and chronological split, and point out that the test error means the result is a planning signal rather than a guarantee.

Open Telemetry Lab. Explain the future sensor payload: pack ID, profile ID, timestamp, cycle ID, voltage, current, temperature, and SOC. Explain that out-of-profile values are quarantined and become review alerts.

Open Safety Center and Alert Queue. Explain that image evidence and abnormal telemetry are human-review workflows. Finish with the safety boundary: the BMS remains in control and Voltwise never instructs an operator to bypass protection or exceed manufacturer limits.

## Curator questions and answers

**Why did you choose this stack?** React and TypeScript provide an interactive, maintainable UI. tRPC provides a typed connection between the dashboard and backend. Drizzle provides typed database access. Python and scikit-learn are practical for reproducible tabular battery modeling. Recharts makes the model evidence understandable to non-technical operators.

**Why not use deep learning?** The MVP dataset is tabular and relatively limited. A transparent Gradient Boosting model is easier to validate and explain. Deep learning may be explored later after collecting larger, more representative time-series and image datasets.

**Why is battery metadata important?** Chemistry, rated capacity, voltage limits, current limits, thermal limits, age, pack topology, and prior cycles determine how measurements should be interpreted. A profile allows range validation and more appropriate calibration.

**What is novel?** The project combines model output with evidence and safety workflow: battery-profile validation, quarantine of suspicious data, uncertainty, drift visibility, RUL bands, feature attribution, human-reviewed image intake, and an operator-focused dashboard.

**What is the largest limitation?** The supplied CSV does not fully confirm chemistry, units, pack identity, timestamps, or manufacturer-rated capacity. The model needs field validation on representative data from the target battery before deployment.

**Is the system safe?** It is designed with safety boundaries, but it is not a certified safety system. Live wiring and gateway selection require qualified electronics review. The safest evaluation path is to begin with a playback file, simulator, approved low-voltage source, or sensor fixture.

## Final sentence to memorize

“Voltwise does not replace the BMS; it adds an explainable evidence layer that helps operators see battery aging earlier, understand the drivers, quantify uncertainty, and decide when human review is needed.”
