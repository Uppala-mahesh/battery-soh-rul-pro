import type { Express, Request, Response } from "express";
import { z } from "zod";
import { createSafetyAlert, getProfile, insertTelemetry, markProfileSeen } from "./db";

export function isValidIngestToken(token: string | undefined) {
  const configured = process.env.VOLTWISE_INGEST_TOKEN;
  return Boolean(configured && token && token === configured);
}

const telemetryPacket = z.object({
  profileId: z.number().int().positive(), recordedAt: z.coerce.date().optional(), cycleId: z.number().int().nonnegative().optional(), voltage: z.number().finite(), current: z.number().finite(), temperatureC: z.number().finite(), soc: z.number().min(0).max(100).optional(), depthOfDischarge: z.number().min(0).max(100).optional(), internalResistanceProxy: z.number().nonnegative().optional(), source: z.string().max(32).default("gateway"),
});

export function evaluateProfileLimits(profile: { minVoltage: string | number | null; maxVoltage: string | number | null; ratedCurrentA: string | number | null; thermalLimitC: string | number | null }, packet: { voltage: number; current: number; temperatureC: number }) {
  const numeric = (value: string | number | null | undefined) => value == null ? undefined : Number(value);
  const minVoltage = numeric(profile.minVoltage); const maxVoltage = numeric(profile.maxVoltage); const ratedCurrent = numeric(profile.ratedCurrentA); const thermalLimit = numeric(profile.thermalLimitC);
  const violations: string[] = [];
  if (minVoltage !== undefined && packet.voltage < minVoltage) violations.push(`voltage below profile minimum (${minVoltage}V)`);
  if (maxVoltage !== undefined && packet.voltage > maxVoltage) violations.push(`voltage above profile maximum (${maxVoltage}V)`);
  if (ratedCurrent !== undefined && Math.abs(packet.current) > ratedCurrent * 1.15) violations.push(`current exceeds 115% of rated current (${ratedCurrent}A)`);
  if (thermalLimit !== undefined && packet.temperatureC > thermalLimit) violations.push(`temperature exceeds configured limit (${thermalLimit}°C)`);
  return violations;
}

export function registerMonitoringRoutes(app: Express) {
  app.post("/api/ingest/telemetry", async (req: Request, res: Response) => {
    if (!isValidIngestToken(req.header("x-voltwise-device-key"))) return res.status(401).json({ error: "invalid-device-key" });
    const parsed = telemetryPacket.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid-telemetry", issues: parsed.error.issues });
    const packet = parsed.data;
    try {
      const profile = await getProfile(packet.profileId);
      if (!profile) return res.status(404).json({ error: "unknown-profile" });
      const violations = evaluateProfileLimits(profile, packet);
      const recordedAt = packet.recordedAt ?? new Date();
      if (violations.length) {
        await createSafetyAlert({ profileId: packet.profileId, source: "telemetry", severity: violations.some((v) => v.includes("temperature") || v.includes("voltage")) ? "urgent" : "watch", title: "Telemetry quarantined outside battery profile", description: "The reading was not accepted into the normal telemetry stream. Review the reading and the manufacturer's operating limits before any intervention.", status: "open", evidence: { violations, reading: packet } });
        return res.status(422).json({ accepted: false, quarantined: true, profileId: packet.profileId, violations, recordedAt });
      }
      await insertTelemetry({ ...packet, recordedAt });
      await markProfileSeen(packet.profileId, recordedAt);
      return res.status(202).json({ accepted: true, profileId: packet.profileId, violations: [], recordedAt });
    } catch (error) {
      console.error("[Voltwise] telemetry ingest failed", error);
      return res.status(503).json({ error: "telemetry-unavailable" });
    }
  });
  app.get("/api/monitoring/health", (_req, res) => res.json({ ok: true, service: "voltwise-monitoring", timestamp: new Date().toISOString() }));
}
