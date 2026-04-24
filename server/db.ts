import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, distributors, teamMembers, Distributor, TeamMember } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new distributor account
 */
export async function createDistributor(input: {
  userId: number;
  companyName: string;
  hyciteUsername: string;
  hyciteEmail: string;
}): Promise<Distributor> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(distributors).values(input);
  const distributorId = (result as any).insertId;

  const created = await db.select().from(distributors).where(eq(distributors.id, distributorId)).limit(1);
  if (!created.length) throw new Error("Failed to create distributor");

  return created[0];
}

/**
 * Get distributor by user ID
 */
export async function getDistributorByUserId(userId: number): Promise<Distributor | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(distributors).where(eq(distributors.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get distributor by ID
 */
export async function getDistributorById(distributorId: number): Promise<Distributor | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(distributors).where(eq(distributors.id, distributorId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Add a team member to a distributor account
 */
export async function addTeamMember(input: {
  distributorId: number;
  userId: number;
  role: "admin_cuentas";
  permissions?: string[];
}): Promise<TeamMember> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(teamMembers).values({
    distributorId: input.distributorId,
    userId: input.userId,
    role: input.role,
    permissions: input.permissions ? JSON.stringify(input.permissions) : null,
  });

  const memberId = (result as any).insertId;
  const created = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId)).limit(1);
  if (!created.length) throw new Error("Failed to add team member");

  return created[0];
}

/**
 * Get team members for a distributor
 */
export async function getTeamMembers(distributorId: number): Promise<TeamMember[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(teamMembers).where(eq(teamMembers.distributorId, distributorId));
}

/**
 * Get team member by ID
 */
export async function getTeamMemberById(teamMemberId: number): Promise<TeamMember | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(teamMembers).where(eq(teamMembers.id, teamMemberId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Check if user is a team member of a distributor
 */
export async function isTeamMember(distributorId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(teamMembers)
    .where(
      eq(teamMembers.distributorId, distributorId) && eq(teamMembers.userId, userId)
    )
    .limit(1);

  return result.length > 0;
}
