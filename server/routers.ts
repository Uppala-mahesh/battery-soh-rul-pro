import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createInspection, createModelRun, createProfile, createSafetyAlert, getDb, listProfiles, openAlerts, recentTelemetry } from "./db";
import { validateVoltwiseCsv } from "./dataset";

const batteryProfileInput = z.object({
  packId: z.string().min(2).max(64), name: z.string().min(2).max(120), chemistry: z.string().min(2).max(64),
  manufacturer: z.string().max(120).optional(), model: z.string().max(120).optional(), nominalCapacityAh: z.number().positive(), nominalVoltage: z.number().positive(),
  minVoltage: z.number().positive().optional(), maxVoltage: z.number().positive().optional(), ratedCurrentA: z.number().positive().optional(), thermalLimitC: z.number().positive().optional(), priorCycles: z.number().int().nonnegative().default(0), topology: z.string().max(64).optional(), notes: z.string().max(4000).optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  dataset: router({
    previewImport: publicProcedure.input(z.object({ filename: z.string().max(160), content: z.string().max(5_000_000) })).mutation(({ input }) => validateVoltwiseCsv(input.content, input.filename)),
  }),
  monitoring: router({
    profiles: protectedProcedure.query(({ ctx }) => listProfiles(ctx.user.id)),
    createProfile: protectedProcedure.input(batteryProfileInput).mutation(({ ctx, input }) => createProfile({ ...input, ownerId: ctx.user.id, nominalCapacityAh: String(input.nominalCapacityAh), nominalVoltage: String(input.nominalVoltage), minVoltage: input.minVoltage ? String(input.minVoltage) : null, maxVoltage: input.maxVoltage ? String(input.maxVoltage) : null, ratedCurrentA: input.ratedCurrentA ? String(input.ratedCurrentA) : null, thermalLimitC: input.thermalLimitC ? String(input.thermalLimitC) : null })),
    telemetry: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), limit: z.number().int().min(1).max(500).default(200) })).query(({ input }) => recentTelemetry(input.profileId, input.limit)),
    startModelRun: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), datasetName: z.string().max(160).optional() })).mutation(({ input }) => createModelRun({ profileId: input.profileId, modelName: "Voltwise Profile-Calibrated Estimator", modelVersion: "0.1.0", status: "queued", datasetName: input.datasetName, assumptions: "Training requires labeled cycle data and remains a planning signal, not a certified safety verdict." })),
    createInspection: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), imageUrl: z.string().url(), imageKey: z.string().max(255).optional() })).mutation(({ input }) => createInspection({ ...input, status: "queued", capturedAt: new Date() })),
    recordVisionResult: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), imageUrl: z.string().url(), imageKey: z.string().max(255).optional(), status: z.enum(["clear", "review", "escalate", "failed"]), findings: z.array(z.string()).default([]), confidence: z.number().min(0).max(1) })).mutation(async ({ input }) => { const result = await createInspection({ profileId: input.profileId, imageUrl: input.imageUrl, imageKey: input.imageKey, status: input.status, findings: input.findings, confidence: input.confidence, capturedAt: new Date() }); if (input.status === "escalate" || input.findings.length > 0 || input.confidence < 0.7) await createSafetyAlert({ profileId: input.profileId, source: "vision", severity: input.status === "escalate" ? "urgent" : "watch", title: "Computer-vision inspection requires review", description: "Visual inference is advisory. A qualified operator must review the evidence image and battery protection system.", status: "open", evidence: { findings: input.findings, confidence: input.confidence, inspection: result } }); return result; }),
    recordModelResult: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), modelRunId: z.number().int().positive().optional(), soh: z.number().min(0).max(100), confidence: z.number().min(0).max(1), rulLikelyCycles: z.number().nonnegative(), warnings: z.array(z.string()).default([]) })).mutation(async ({ input }) => { const result = { ...input, recordedAt: new Date() }; if (input.soh < 80 || input.confidence < 0.65 || input.warnings.length > 0) await createSafetyAlert({ profileId: input.profileId, source: "model", severity: input.soh < 70 ? "urgent" : "watch", title: "Model output requires operator review", description: "The estimator detected a planning threshold, uncertainty, or warning. Do not use this output as a certified safety verdict.", status: "open", evidence: result }); return result; }),
    alerts: protectedProcedure.input(z.object({ profileId: z.number().int().positive() })).query(({ input }) => openAlerts(input.profileId)),
    health: publicProcedure.query(async () => ({ ok: true, databaseConfigured: Boolean(process.env.DATABASE_URL), service: "voltwise-monitoring" })),
  }),
});

export type AppRouter = typeof appRouter;
