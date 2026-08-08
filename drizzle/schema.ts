import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, double, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const batteryProfiles = mysqlTable("battery_profiles", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  packId: varchar("packId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  chemistry: varchar("chemistry", { length: 64 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 120 }),
  model: varchar("model", { length: 120 }),
  nominalCapacityAh: decimal("nominalCapacityAh", { precision: 12, scale: 3 }).notNull(),
  nominalVoltage: decimal("nominalVoltage", { precision: 8, scale: 3 }).notNull(),
  minVoltage: decimal("minVoltage", { precision: 8, scale: 3 }),
  maxVoltage: decimal("maxVoltage", { precision: 8, scale: 3 }),
  ratedCurrentA: decimal("ratedCurrentA", { precision: 12, scale: 3 }),
  thermalLimitC: decimal("thermalLimitC", { precision: 8, scale: 3 }),
  installationDate: timestamp("installationDate"),
  priorCycles: int("priorCycles").default(0).notNull(),
  topology: varchar("topology", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt"),
});

export const telemetryReadings = mysqlTable("telemetry_readings", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  recordedAt: timestamp("recordedAt").notNull(),
  cycleId: int("cycleId"),
  voltage: double("voltage").notNull(),
  current: double("current").notNull(),
  temperatureC: double("temperatureC").notNull(),
  soc: double("soc"),
  depthOfDischarge: double("depthOfDischarge"),
  internalResistanceProxy: double("internalResistanceProxy"),
  source: varchar("source", { length: 32 }).default("gateway").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const modelRuns = mysqlTable("model_runs", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  modelName: varchar("modelName", { length: 120 }).notNull(),
  modelVersion: varchar("modelVersion", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["queued", "running", "completed", "failed"]).default("queued").notNull(),
  datasetName: varchar("datasetName", { length: 160 }),
  metrics: json("metrics"),
  assumptions: text("assumptions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const visionInspections = mysqlTable("vision_inspections", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 255 }),
  status: mysqlEnum("status", ["queued", "review", "clear", "escalate", "failed"]).default("queued").notNull(),
  findings: json("findings"),
  confidence: double("confidence"),
  capturedAt: timestamp("capturedAt").notNull(),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const safetyAlerts = mysqlTable("safety_alerts", {
  id: int("id").autoincrement().primaryKey(),
  profileId: int("profileId").notNull(),
  source: mysqlEnum("source", ["telemetry", "vision", "model", "system"]).notNull(),
  severity: mysqlEnum("severity", ["info", "watch", "urgent"]).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"]).default("open").notNull(),
  evidence: json("evidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type BatteryProfile = typeof batteryProfiles.$inferSelect;
export type InsertBatteryProfile = typeof batteryProfiles.$inferInsert;
export type TelemetryReading = typeof telemetryReadings.$inferSelect;
export type InsertTelemetryReading = typeof telemetryReadings.$inferInsert;
export type ModelRun = typeof modelRuns.$inferSelect;
export type VisionInspection = typeof visionInspections.$inferSelect;
export type SafetyAlert = typeof safetyAlerts.$inferSelect;
