import { describe, expect, it } from "vitest";
import { validateVoltwiseCsv } from "./dataset";

const header = "Voltage_mean,Voltage_std,Current_mean,Current_std,Temperature_mean,Temperature_max,Discharge_time,Temperature_rise,Capacity";

describe("validateVoltwiseCsv", () => {
  it("accepts a valid labeled cycle upload and reports missing identity assumptions", () => {
    const report = validateVoltwiseCsv(`${header}\n3.4,0.2,-1.1,0.4,33,41,6500,15,1.8`, "cycles.csv");
    expect(report.ok).toBe(true);
    expect(report.rows).toBe(1);
    expect(report.quarantinedRows).toBe(0);
    expect(report.unitAssumptions.some((item) => item.includes("pack"))).toBe(true);
  });
  it("rejects missing required fields and quarantines malformed rows", () => {
    const report = validateVoltwiseCsv("Voltage_mean,Capacity\nnot-a-number,1.8", "bad.csv");
    expect(report.ok).toBe(false);
    expect(report.missingRequired).toContain("Temperature_mean");
    expect(report.quarantinedRows).toBe(0);
  });
  it("quarantines invalid numeric rows when the schema exists", () => {
    const report = validateVoltwiseCsv(`${header}\n3.4,0.2,-1.1,0.4,33,41,6500,15,1.8\n3.4,0.2,bad,0.4,33,41,6500,15,1.7`, "mixed.csv");
    expect(report.ok).toBe(false);
    expect(report.quarantinedRows).toBe(1);
    expect(report.invalidRows[0]?.reasons[0]).toContain("Current_mean");
  });
});
