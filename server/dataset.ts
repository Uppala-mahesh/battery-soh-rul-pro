const REQUIRED_NUMERIC = ["Voltage_mean", "Voltage_std", "Current_mean", "Current_std", "Temperature_mean", "Temperature_max", "Discharge_time", "Temperature_rise", "Capacity"] as const;
const OPTIONAL_ID_FIELDS = ["pack_id", "battery_id", "cycle_id", "timestamp", "SOC", "DepthOfDischarge"] as const;

function splitCsvLine(line: string) {
  const cells: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < line.length; i += 1) { const char = line[i]; if (char === '"') { quoted = !quoted; continue; } if (char === "," && !quoted) { cells.push(cell.trim()); cell = ""; } else cell += char; }
  cells.push(cell.trim()); return cells;
}

export function validateVoltwiseCsv(content: string, filename = "upload.csv") {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { ok: false, filename, rows: 0, headers: [], missingRequired: [...REQUIRED_NUMERIC], invalidRows: [], quarantinedRows: 0, warnings: ["The CSV must contain a header and at least one data row."], unitAssumptions: [] };
  const headers = splitCsvLine(lines[0]); const index = new Map(headers.map((header, i) => [header, i]));
  const missingRequired = REQUIRED_NUMERIC.filter((field) => !index.has(field));
  const unitAssumptions: string[] = [];
  if (!index.has("timestamp")) unitAssumptions.push("No timestamp field supplied; row order cannot be confirmed as chronological time.");
  if (!index.has("pack_id") && !index.has("battery_id")) unitAssumptions.push("No pack or battery identifier supplied; records are treated as one series.");
  unitAssumptions.push("Voltage, current, temperature, discharge time, and capacity units are not verified by the CSV; confirm them against the sensor and battery datasheet.");
  const invalidRows: Array<{ row: number; reasons: string[] }> = [];
  if (!missingRequired.length) for (let lineNo = 1; lineNo < lines.length; lineNo += 1) { const cells = splitCsvLine(lines[lineNo]); const reasons: string[] = []; for (const field of REQUIRED_NUMERIC) { const raw = cells[index.get(field)!]; if (!raw || !Number.isFinite(Number(raw))) reasons.push(`${field} must be numeric`); } if (reasons.length) invalidRows.push({ row: lineNo + 1, reasons }); }
  return { ok: missingRequired.length === 0 && invalidRows.length === 0, filename, rows: Math.max(0, lines.length - 1), headers, missingRequired, invalidRows: invalidRows.slice(0, 100), quarantinedRows: invalidRows.length, identifierFields: OPTIONAL_ID_FIELDS.filter((field) => index.has(field)), unitAssumptions, warnings: invalidRows.length ? ["Invalid rows are quarantined and excluded from training."] : [] };
}
