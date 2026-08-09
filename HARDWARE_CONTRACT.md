# Voltwise Hardware and Runtime Contract

## Battery onboarding profile

Each monitored pack is onboarded with `packId`, chemistry, manufacturer/model, nominal capacity in Ah, nominal voltage, optional minimum and maximum voltage, rated current, thermal limit in °C, prior cycle count, topology, installation date, and operator notes. Profile limits are used for validation; packets outside them are quarantined and create an urgent review alert.

## Sensor payload

The preferred gateway payload is JSON over HTTPS or MQTT-to-gateway translation:

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

Units are volts, amperes, degrees Celsius, percent SOC, Unix milliseconds, and integer cycle identity. The gateway authenticates with `VOLTWISE_INGEST_TOKEN`; it must never expose that token in browser code. A missing profile, invalid numeric value, stale heartbeat, or out-of-profile reading is not silently accepted as normal telemetry.

## Camera boundary

A camera gateway may submit still images through the inspection adapter. The current MVP supports manual image intake and human-review states. Scheduled capture requires a persistent camera process, a configured interval, device heartbeat, and approved inference runtime; it is intentionally not represented as certified automatic safety control.

## Runtime decision

The target deployment is managed always-on hosting with a persistent worker and database-backed service. The estimated reference runtime is 1 vCPU / 512 MB, usage-based, up to approximately $37.50/month at full utilization before the $10 monthly credit. Hardware connectivity, camera networking, and credentials remain deployment-specific.
