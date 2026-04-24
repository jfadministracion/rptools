import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  decimal,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role and distributorId for RPtools.
 */
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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Distributor account - represents a Royale Prestige distributor
 */
export const distributors = mysqlTable("distributors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the distributor account
  companyName: varchar("companyName", { length: 255 }).notNull(),
  hyciteUsername: varchar("hyciteUsername", { length: 255 }).notNull(),
  hyciteEmail: varchar("hyciteEmail", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Distributor = typeof distributors.$inferSelect;
export type InsertDistributor = typeof distributors.$inferInsert;

/**
 * Team members - collaborators added by a distributor
 * Role: admin_cuentas (account administrator)
 */
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  distributorId: int("distributorId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["admin_cuentas"]).notNull(),
  permissions: json("permissions"), // Array of permission strings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * HyCite connection - tracks authentication state with HyCite backoffice
 */
export const hyciteConnections = mysqlTable("hycite_connections", {
  id: int("id").autoincrement().primaryKey(),
  distributorId: int("distributorId").notNull(),
  connectionMode: mysqlEnum("connectionMode", ["manual", "automatic"]).notNull(),
  sessionToken: text("sessionToken"), // Encrypted session cookie/token
  lastConnected: timestamp("lastConnected"),
  status: mysqlEnum("status", ["connected", "disconnected", "expired"]).default("disconnected").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HyCiteConnection = typeof hyciteConnections.$inferSelect;
export type InsertHyCiteConnection = typeof hyciteConnections.$inferInsert;

/**
 * Email credentials for automatic OTP retrieval
 * Stored securely (encrypted in production)
 */
export const emailCredentials = mysqlTable("email_credentials", {
  id: int("id").autoincrement().primaryKey(),
  distributorId: int("distributorId").notNull(),
  emailProvider: mysqlEnum("emailProvider", ["gmail", "outlook", "other"]).notNull(),
  encryptedAccessToken: text("encryptedAccessToken"), // OAuth token or app password
  encryptedRefreshToken: text("encryptedRefreshToken"), // For OAuth refresh
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCredential = typeof emailCredentials.$inferSelect;
export type InsertEmailCredential = typeof emailCredentials.$inferInsert;

/**
 * Data snapshots - stores extracted data from HyCite
 * Each row represents a point-in-time snapshot of data
 */
export const dataSnapshots = mysqlTable("data_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  distributorId: int("distributorId").notNull(),
  dataType: mysqlEnum("dataType", ["sales", "orders", "metrics"]).notNull(),
  jsonData: json("jsonData").notNull(), // Raw extracted data
  extractedAt: timestamp("extractedAt").notNull(), // When data was extracted from HyCite
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataSnapshot = typeof dataSnapshots.$inferSelect;
export type InsertDataSnapshot = typeof dataSnapshots.$inferInsert;

/**
 * Sync logs - tracks synchronization history
 */
export const syncLogs = mysqlTable("sync_logs", {
  id: int("id").autoincrement().primaryKey(),
  distributorId: int("distributorId").notNull(),
  dataType: mysqlEnum("dataType", ["sales", "orders", "metrics"]).notNull(),
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  errorMessage: text("errorMessage"),
  recordsProcessed: int("recordsProcessed").default(0),
  syncedAt: timestamp("syncedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = typeof syncLogs.$inferInsert;

/**
 * Google Sheets configuration - stores sync settings for each distributor
 */
export const googleSheetsConfig = mysqlTable("google_sheets_config", {
  id: int("id").autoincrement().primaryKey(),
  distributorId: int("distributorId").notNull(),
  sheetId: varchar("sheetId", { length: 255 }).notNull(), // Google Sheets ID
  sheetName: varchar("sheetName", { length: 255 }).default("RPtools Data"),
  encryptedAccessToken: text("encryptedAccessToken"), // OAuth access token
  encryptedRefreshToken: text("encryptedRefreshToken"), // OAuth refresh token
  syncEnabled: boolean("syncEnabled").default(false),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoogleSheetsConfig = typeof googleSheetsConfig.$inferSelect;
export type InsertGoogleSheetsConfig = typeof googleSheetsConfig.$inferInsert;
