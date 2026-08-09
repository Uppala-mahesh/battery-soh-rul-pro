const endpoint = process.env.VOLTWISE_INGEST_URL ?? "http://localhost:3000/api/ingest/telemetry";
const token = process.env.VOLTWISE_INGEST_TOKEN ?? "demo-token-not-for-production";
const profileId = Number(process.env.VOLTWISE_PROFILE_ID ?? "");
if (!Number.isInteger(profileId) || profileId <= 0) {
  console.error("Set VOLTWISE_PROFILE_ID to an existing approved battery profile before sending telemetry.");
  process.exit(2);
}

const payload = {
  packId: "demo-pack-01",
  profileId,
  timestamp: Date.now(),
  cycleId: 1408,
  voltage: 48.2,
  current: -3.4,
  temperatureC: 31.5,
  soc: 72,
};

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-voltwise-device-key": token,
  },
  body: JSON.stringify(payload),
});

const body = await response.text();
console.log(JSON.stringify({ endpoint, status: response.status, response: body }, null, 2));
if (!response.ok) process.exitCode = 1;
