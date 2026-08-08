import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "./_core/env";
import { batteryProfiles, InsertBatteryProfile, InsertTelemetryReading, modelRuns, safetyAlerts, telemetryReadings, users, visionInspections, InsertUser } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) { values.role = user.role ?? "admin"; updateSet.role = values.role; }
  values.lastSignedIn ??= new Date(); updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0];
}
export async function listProfiles(ownerId: number) { const db = await getDb(); return db ? db.select().from(batteryProfiles).where(eq(batteryProfiles.ownerId, ownerId)).orderBy(desc(batteryProfiles.updatedAt)) : []; }
export async function createProfile(input: InsertBatteryProfile) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.insert(batteryProfiles).values(input); const rows = await db.select().from(batteryProfiles).where(eq(batteryProfiles.packId, input.packId)).limit(1); return rows[0]; }
export async function getProfile(profileId: number) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(batteryProfiles).where(eq(batteryProfiles.id, profileId)).limit(1); return rows[0]; }
export async function markProfileSeen(profileId: number, seenAt: Date) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(batteryProfiles).set({ lastSeenAt: seenAt }).where(eq(batteryProfiles.id, profileId)); }
export async function insertTelemetry(input: InsertTelemetryReading) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.insert(telemetryReadings).values(input); return input; }
export async function createSafetyAlert(input: typeof safetyAlerts.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.insert(safetyAlerts).values(input); return input; }
export async function recentTelemetry(profileId: number, limit = 200) { const db = await getDb(); return db ? db.select().from(telemetryReadings).where(eq(telemetryReadings.profileId, profileId)).orderBy(desc(telemetryReadings.recordedAt)).limit(limit) : []; }
export async function createModelRun(input: typeof modelRuns.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.insert(modelRuns).values(input); return input; }
export async function createInspection(input: typeof visionInspections.$inferInsert) { const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.insert(visionInspections).values(input); return input; }
export async function openAlerts(profileId: number) { const db = await getDb(); return db ? db.select().from(safetyAlerts).where(eq(safetyAlerts.profileId, profileId)).orderBy(desc(safetyAlerts.createdAt)).limit(50) : []; }
