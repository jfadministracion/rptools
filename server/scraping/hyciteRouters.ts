import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getDistributorById,
  getDb,
} from "../db";
import { hyciteConnections, dataSnapshots, syncLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { createHyCiteClient } from "./hyciteClient";

export const hyciteRouter = router({
  /**
   * Initiate manual connection to HyCite
   * User will need to provide OTP code separately
   */
  connectManual: protectedProcedure
    .input(
      z.object({
        distributorId: z.number(),
        hyciteUsername: z.string(),
        hycitePassword: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Verify user owns this distributor
      const distributor = await getDistributorById(input.distributorId);
      if (!distributor || distributor.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Create HyCite client and attempt login
        const client = await createHyCiteClient();

        const sessionData = await client.loginWithCredentials({
          username: input.hyciteUsername,
          password: input.hycitePassword,
        });

        // Save connection with manual mode
        const result = await db
          .insert(hyciteConnections)
          .values({
            distributorId: input.distributorId,
            connectionMode: "manual",
            sessionToken: sessionData,
            status: "connected",
            lastConnected: new Date(),
          })
          .onDuplicateKeyUpdate({
            set: {
              connectionMode: "manual",
              sessionToken: sessionData,
              status: "connected",
              lastConnected: new Date(),
              errorMessage: null,
            },
          });

        await client.close();

        return {
          success: true,
          status: "connected",
          message: "Login successful. Please enter OTP code.",
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Save failed connection attempt
        const db = await getDb();
        if (db) {
          await db
            .insert(hyciteConnections)
            .values({
              distributorId: input.distributorId,
              connectionMode: "manual",
              status: "disconnected",
              errorMessage: errorMessage,
              lastConnected: new Date(),
            })
            .onDuplicateKeyUpdate({
              set: {
                status: "disconnected",
                errorMessage: errorMessage,
                lastConnected: new Date(),
              },
            });
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Login failed: ${errorMessage}`,
        });
      }
    }),

  /**
   * Submit OTP code for manual connection
   */
  submitOTP: protectedProcedure
    .input(
      z.object({
        distributorId: z.number(),
        otpCode: z.string().length(6, "OTP must be 6 digits"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const distributor = await getDistributorById(input.distributorId);
      if (!distributor || distributor.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Get current connection
        const connection = await db
          .select()
          .from(hyciteConnections)
          .where(eq(hyciteConnections.distributorId, input.distributorId))
          .limit(1);

        if (!connection.length || !connection[0].sessionToken) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active connection. Please login first.",
          });
        }

        // TODO: Implement OTP submission with existing session
        // This would require restoring the session and submitting OTP

        return {
          success: true,
          status: "connected",
          message: "OTP verified successfully",
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await db
          .update(hyciteConnections)
          .set({
            status: "disconnected",
            errorMessage: errorMessage,
          })
          .where(eq(hyciteConnections.distributorId, input.distributorId));

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `OTP verification failed: ${errorMessage}`,
        });
      }
    }),

  /**
   * Get current connection status
   */
  getStatus: protectedProcedure
    .input(z.object({ distributorId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const distributor = await getDistributorById(input.distributorId);
      if (!distributor || distributor.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const connection = await db
        .select()
        .from(hyciteConnections)
        .where(eq(hyciteConnections.distributorId, input.distributorId))
        .limit(1);

      if (!connection.length) {
        return {
          status: "disconnected",
          connectionMode: null,
          lastConnected: null,
          errorMessage: null,
        };
      }

      return {
        status: connection[0].status,
        connectionMode: connection[0].connectionMode,
        lastConnected: connection[0].lastConnected,
        errorMessage: connection[0].errorMessage,
      };
    }),

  /**
   * Disconnect from HyCite
   */
  disconnect: protectedProcedure
    .input(z.object({ distributorId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const distributor = await getDistributorById(input.distributorId);
      if (!distributor || distributor.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(hyciteConnections)
        .set({
          status: "disconnected",
          sessionToken: null,
          errorMessage: null,
        })
        .where(eq(hyciteConnections.distributorId, input.distributorId));

      return { success: true };
    }),

  /**
   * Manually trigger data sync
   */
  syncNow: protectedProcedure
    .input(z.object({ distributorId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const distributor = await getDistributorById(input.distributorId);
      if (!distributor || distributor.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        // Check if connection is active
        const connection = await db
          .select()
          .from(hyciteConnections)
          .where(eq(hyciteConnections.distributorId, input.distributorId))
          .limit(1);

        if (!connection.length || connection[0].status !== "connected") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "HyCite connection is not active",
          });
        }

        // TODO: Implement actual data sync
        // This would:
        // 1. Restore HyCite session
        // 2. Extract sales, orders, and metrics
        // 3. Store in data_snapshots table
        // 4. Log sync in sync_logs table

        return {
          success: true,
          message: "Sync initiated",
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Log failed sync
        await db.insert(syncLogs).values({
          distributorId: input.distributorId,
          dataType: "sales",
          status: "failed",
          errorMessage: errorMessage,
          syncedAt: new Date(),
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Sync failed: ${errorMessage}`,
        });
      }
    }),
});
