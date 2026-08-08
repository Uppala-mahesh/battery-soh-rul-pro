import { describe, expect, it } from "vitest";
import { evaluateProfileLimits, isValidIngestToken } from "./monitoring";

describe("Voltwise device ingestion secret", () => {
  it("accepts the configured token and rejects missing or incorrect tokens", () => {
    const original = process.env.VOLTWISE_INGEST_TOKEN;
    process.env.VOLTWISE_INGEST_TOKEN = "test-device-token";
    expect(isValidIngestToken("test-device-token")).toBe(true);
    expect(isValidIngestToken("wrong-token")).toBe(false);
    expect(isValidIngestToken(undefined)).toBe(false);
    process.env.VOLTWISE_INGEST_TOKEN = original;
  });

  it("flags profile-limit violations for quarantine", () => {
    const violations = evaluateProfileLimits({ minVoltage: "3.0", maxVoltage: "4.2", ratedCurrentA: "10", thermalLimitC: "45" }, { voltage: 4.25, current: 12, temperatureC: 48 });
    expect(violations).toHaveLength(3);
  });
});
