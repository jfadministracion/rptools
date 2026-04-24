import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { hyciteRouter } from "./scraping/hyciteRouters";
import { z } from "zod";
import {
  createDistributor,
  getDistributorByUserId,
  getDistributorById,
  addTeamMember,
  getTeamMembers,
  isTeamMember,
} from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  hycite: hyciteRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Distributor management procedures
   */
  distributors: router({
    /**
     * Register as a distributor
     */
    register: protectedProcedure
      .input(
        z.object({
          companyName: z.string().min(1, "Company name is required"),
          hyciteUsername: z.string().min(1, "HyCite username is required"),
          hyciteEmail: z.string().email("Invalid email"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Check if user already has a distributor account
        const existing = await getDistributorByUserId(ctx.user.id);
        if (existing) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User already has a distributor account",
          });
        }

        const distributor = await createDistributor({
          userId: ctx.user.id,
          companyName: input.companyName,
          hyciteUsername: input.hyciteUsername,
          hyciteEmail: input.hyciteEmail,
        });

        return distributor;
      }),

    /**
     * Get current user's distributor account
     */
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const distributor = await getDistributorByUserId(ctx.user.id);
      return distributor || null;
    }),

    /**
     * Get distributor by ID
     */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        const distributor = await getDistributorById(input.id);
        if (!distributor) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Check access: only owner or team member can view
        const isOwner = distributor.userId === ctx.user.id;
        const isMember = await isTeamMember(distributor.id, ctx.user.id);

        if (!isOwner && !isMember) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return distributor;
      }),
  }),

  /**
   * Team management procedures
   */
  team: router({
    /**
     * Add a team member to a distributor account
     */
    addMember: protectedProcedure
      .input(
        z.object({
          distributorId: z.number(),
          userEmail: z.string().email(),
          role: z.literal("admin_cuentas"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify user is the distributor owner
        const distributor = await getDistributorById(input.distributorId);
        if (!distributor) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (distributor.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only distributor owner can add team members" });
        }

        // TODO: In production, look up user by email and verify they exist
        // For now, we'll need to get the user ID from the frontend
        throw new TRPCError({
          code: "NOT_IMPLEMENTED",
          message: "Team member addition requires user lookup implementation",
        });
      }),

    /**
     * List team members for a distributor
     */
    listMembers: protectedProcedure
      .input(z.object({ distributorId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify access
        const distributor = await getDistributorById(input.distributorId);
        if (!distributor) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const isOwner = distributor.userId === ctx.user.id;
        const isMember = await isTeamMember(distributor.id, ctx.user.id);

        if (!isOwner && !isMember) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return await getTeamMembers(input.distributorId);
      }),

    /**
     * Remove a team member
     */
    removeMember: protectedProcedure
      .input(z.object({ distributorId: z.number(), memberId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify user is distributor owner
        const distributor = await getDistributorById(input.distributorId);
        if (!distributor) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (distributor.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // TODO: Implement member removal
        throw new TRPCError({
          code: "NOT_IMPLEMENTED",
          message: "Member removal not yet implemented",
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
