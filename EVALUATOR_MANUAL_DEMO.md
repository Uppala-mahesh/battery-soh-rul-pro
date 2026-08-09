# Voltwise Manual Prediction Demo

## Purpose

This is the **software-only evaluation path** for Voltwise. It demonstrates how a reviewer can enter one battery-cycle observation and inspect a health estimate without connecting a live battery. It is intentionally labeled as a **CSV-calibrated sensitivity adapter**, not as an uncertified production inference service.

## Demo preset

Use the default form values already shown in **Model Notes**. They are a demonstration preset, not hidden customer data and not a claim about a real connected pack. The fields are cycle number, temperature, current rate, depth of discharge, and cell voltage.

| Manual field | Plain-language meaning | Artifact relationship |
|---|---|---|
| Cycle number | Approximate age of the battery in charge/discharge cycles | Chronological aging proxy |
| Temperature | Representative operating temperature | `Temperature_mean`, `Temperature_max` |
| Current rate | How hard the battery is being charged or discharged relative to its rating | `Current_mean`, `Current_std` and current-stress proxy |
| Depth of discharge | Approximate fraction used in the cycle | Stress/depth proxy for the MVP adapter |
| Cell voltage | Representative cell voltage | `Voltage_mean`, `Voltage_std` |

The trained artifact also uses `Discharge_time`, `Temperature_rise`, `temperature_margin`, `thermal_stress_proxy`, and `discharge_hours`. The manual form exposes the most understandable controls and maps them to the documented relationships; it does **not** claim to reproduce every raw telemetry column from five inputs.

## What to say while demonstrating

> “The source file is `file2.csv`, containing 1,407 cycle-level rows. We define SoH from measured Capacity relative to a dataset reference, add derived stress and duration features, and train a gradient-boosting regression model with a chronological 65/15/20 train-validation-test split. This screen is a transparent evaluation adapter: I enter a cycle, temperature, current rate, depth, and voltage, then the interface shows estimated SoH, a best/likely/worst RUL planning band, uncertainty, drivers, and assumptions.”

> “The result is not a safety command. The model has test error and the dataset lacks verified units, timestamps, and pack identifiers. For deployment, we would calibrate against the actual battery profile, connect through an isolated gateway behind the BMS, and validate on representative cycles.”

## Reproducible flow

First open **Model Notes**. Confirm the evidence panel shows `file2.csv`, the source-row count, chronological split, test MAE, baseline MAE, uncertainty, and the drift/coverage note. Next leave the preset values unchanged and point out the feature-mapping note. Change temperature upward or depth of discharge upward and observe the sensitivity adapter move the health estimate and status toward closer review. Then change voltage or current rate and explain that the model treats these as stress signals, not as permission to operate outside manufacturer limits. Finally open **Safety Center** to show the image evidence remains in human review, and open **Alert Queue** to show the acknowledgment state.

## If asked whether this is hard-coded

Answer directly: “The historical training evidence is real and comes from the uploaded CSV. The manual form is a deterministic, transparent adapter for the competition demo because the live model artifact is trained in Python and the browser does not execute the serialized scikit-learn model. We label that boundary instead of pretending the form is a live production endpoint. The next engineering step is a server-side inference endpoint that loads the versioned artifact and accepts the same validated feature contract.”

## If asked why no hardware is connected

Answer: “The software contract is ready, but a real pack requires chemistry, voltage limits, BMS interface, pinout, and an isolated gateway to be verified by an ECE engineer. We intentionally provide a software-only gateway simulator and do not guess electrical details or bypass the BMS.”

## Evaluation claim

The defensible claim is: **Voltwise is a competition-ready, explainable battery-health analytics MVP with real dataset-backed training evidence and a transparent manual evaluation path.** It is not yet a certified battery safety system or a field-validated RUL predictor for an unknown pack.
