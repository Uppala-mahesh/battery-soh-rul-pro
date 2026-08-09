# Voltwise Hardware-to-Evaluation Plan

## What is still needed

The software is ready to receive a compatible telemetry stream, but hardware cannot be selected safely without the battery’s chemistry, voltage, current, BMS interface, and connector documentation. Do not select a gateway from a connector shape or wire color.

## Step 1: identify the battery

Record the exact chemistry, nominal voltage, maximum voltage, capacity in Ah, maximum continuous current, BMS manufacturer/model, communication interface, and connector pinout. Photograph the battery label and BMS label/manual. Your ECE teammate should verify the values and identify whether the BMS already exposes voltage, current, temperature, SOC, cycle count, and fault flags.

## Step 2: select the gateway class

The gateway is a small device between the battery/BMS and Voltwise. The preferred path is to read telemetry from an existing BMS interface such as CAN, RS485, UART, or Bluetooth rather than measuring a live high-energy pack directly. If analog measurements are unavoidable, the ECE teammate must select appropriately rated isolated voltage/current/temperature sensors and an isolated interface.

Possible gateway classes are a Raspberry Pi with an approved isolated CAN/RS485 interface, an ESP32 with an approved isolated transceiver for a low-risk prototype, or an industrial IoT gateway for a more robust demonstration. The correct option depends on the battery interface and electrical ratings. The gateway must timestamp readings, assign a pack ID, validate numeric values, buffer brief network outages, and send HTTPS or MQTT-to-HTTPS data to Voltwise.

## Step 3: create the battery profile

Create one Voltwise profile only after the values are confirmed: pack ID, chemistry, manufacturer/model, nominal capacity, nominal voltage, minimum/maximum voltage, rated current, thermal limit, topology, installation date, prior cycle count, and notes. Profile limits are used to quarantine suspicious telemetry; they are not a replacement for manufacturer limits or BMS protection.

## Step 4: configure the ingestion secret

`VOLTWISE_INGEST_TOKEN` is the password-like credential that proves a gateway is allowed to submit telemetry. Store it only in the server/gateway environment. Never place it in React/browser code, screenshots, CSV files, or a public repository. The gateway sends it as the server expects; the dashboard never needs to display it.

## Step 5: controlled test before a live pack

First test the gateway without a live high-energy battery. Use an approved low-voltage bench source, simulator, BMS playback file, or a sensor test fixture selected by the ECE teammate. Verify known voltage/current/temperature values, timestamps, packet IDs, disconnect behavior, invalid values, profile-limit quarantine, heartbeat updates, model output, and alert creation. Save screenshots and a small test log.

Only after the ECE teammate verifies the wiring, ratings, isolation, fuse/protection, connector pinout, and measurement reference should a controlled pack observation be attempted. Do not charge, discharge, open, probe, or modify a battery for this software demonstration without qualified supervision.

## Step 6: always-on runtime

The always-on service consists of the Voltwise server, database, telemetry ingestion route, persistent worker or scheduler, and camera workflow. Configure health checks, logs, restart behavior, database backups, gateway heartbeat monitoring, and alert escalation. Start with telemetry only. Add scheduled camera capture later after selecting a camera, storage path, capture interval, retention policy, and human-review process.

## Step 7: evaluation evidence

The evaluation package should contain the architecture diagram, battery profile, data dictionary, CSV validation report, chronological split explanation, model metrics, baseline comparison, feature importance, uncertainty and drift notes, controlled gateway test log, screenshot of the dashboard, safety statement, and a limitations slide. State clearly which parts use the supplied dataset, which parts are backend adapters, and which parts require live hardware.

## The exact information needed from the ECE teammate

Ask for the battery label, BMS manual/model, chemistry, nominal/max voltage, capacity, current rating, interface type, connector pinout, wiring diagram, approved measurement method, isolation requirement, and safe test procedure. Once those are known, the gateway and profile can be selected without guessing.
