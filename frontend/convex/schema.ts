import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    profileImage: v.optional(v.string()),
    createdAt: v.number(),
  }),
  
  sessions: defineTable({
    userId: v.id("users"),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    videoUrl: v.optional(v.string()),
    metadata: v.optional(v.object({
      shotsDetected: v.number(),
      duration: v.number(),
    })),
  }).index("by_user", ["userId"]),
  
  shotAnalyses: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    timestamp: v.number(),
    videoSegmentUrl: v.string(),
    instantFeedback: v.object({
      detected: v.boolean(),
      confidence: v.number(),
    }),
    analysis: v.optional(v.object({
      overallScore: v.number(),
      technique: v.object({
        stance: v.number(),
        grip: v.number(),
        followThrough: v.number(),
      }),
      feedback: v.array(v.object({
        type: v.union(v.literal("strength"), v.literal("improvement")),
        category: v.string(),
        message: v.string(),
        priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      })),
      geminiResponse: v.optional(v.string()),
    })),
  }).index("by_session", ["sessionId"]).index("by_user", ["userId"]),
});