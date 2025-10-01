/**
 * HITADY Platform Usage Example
 *
 * This file demonstrates how to set up and use the HITADY platform resources
 * in a real application.
 */

import { z } from "zod";
import { adiemus, createResource } from "../src";

// Import the HITADY resources (in real app, would import from the example)
// For this demo, we'll define simplified versions

// Professional Profile Schema
const professionalSchema = z.object({
	id: z.string().optional(),
	userId: z.string(),
	name: z.string().min(2),
	profession: z.string(),
	category: z.enum([
		"mechanic",
		"hairdresser",
		"electrician",
		"carpenter",
		"restaurant",
		"plumber",
		"other",
	]),
	phoneNumber: z.string(),
	location: z.object({
		city: z.string(),
		latitude: z.number().optional(),
		longitude: z.number().optional(),
	}),
	averageRating: z.number().default(0),
	totalReviews: z.number().default(0),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

// Testimonial Schema
const testimonialSchema = z.object({
	id: z.string().optional(),
	professionalId: z.string(),
	clientUserId: z.string(),
	clientName: z.string(),
	text: z.string().min(10).max(300),
	rating: z.number().min(1).max(5),
	photo: z.string().url().optional(),
	moderationStatus: z
		.enum(["pending", "approved", "rejected"])
		.default("pending"),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

// Publication Schema
const publicationSchema = z.object({
	id: z.string().optional(),
	professionalId: z.string(),
	userId: z.string(),
	type: z.enum([
		"work_photo",
		"temporary_promotion",
		"new_service",
		"testimonial",
		"story",
	]),
	title: z.string().min(3).max(100),
	description: z.string().max(500).optional(),
	photos: z.array(z.string().url()).default([]),
	badge: z.enum(["promo", "new", "featured", "none"]).default("none"),
	expiresAt: z.date().optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

// Create resources
const professionalResource = createResource({
	name: "professional",
	schema: professionalSchema,
	permissions: {
		create: () => true,
		read: () => true,
		update: () => true,
		delete: () => true,
		list: () => true,
	},
	hooks: {
		onCreate: async (context) => {
			context.data.createdAt = new Date();
			context.data.updatedAt = new Date();
			context.data.userId = context.user?.id;
			context.data.averageRating = 0;
			context.data.totalReviews = 0;
		},
	},
});

const testimonialResource = createResource({
	name: "testimonial",
	schema: testimonialSchema,
	permissions: {
		create: () => true,
		read: () => true,
		update: () => true,
		delete: () => true,
		list: () => true,
	},
	hooks: {
		onCreate: async (context) => {
			context.data.createdAt = new Date();
			context.data.updatedAt = new Date();
			context.data.clientUserId = context.user?.id;
			context.data.moderationStatus = "pending";
		},
	},
});

const publicationResource = createResource({
	name: "publication",
	schema: publicationSchema,
	permissions: {
		create: () => true,
		read: () => true,
		update: () => true,
		delete: () => true,
		list: () => true,
	},
	hooks: {
		onCreate: async (context) => {
			context.data.createdAt = new Date();
			context.data.updatedAt = new Date();
			context.data.userId = context.user?.id;

			// Auto-set badge based on type
			if (context.data.type === "temporary_promotion") {
				context.data.badge = "promo";
			} else if (context.data.type === "new_service") {
				context.data.badge = "new";
			}

			// Set expiration for stories (24 hours)
			if (context.data.type === "story") {
				context.data.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
			}
		},
	},
});

// Initialize HITADY query instance
export const hitadyQuery = adiemus({
	resources: [professionalResource, testimonialResource, publicationResource],
	database: {
		provider: "sqlite",
		url: "sqlite::memory:",
		autoMigrate: true,
	},
});

/**
 * Usage examples:
 *
 * 1. Next.js App Router:
 *
 * // app/api/query/[...all]/route.ts
 * import { hitadyQuery } from "@/lib/hitady-query";
 * export const { GET, POST, PUT, DELETE } = hitadyQuery.handler;
 *
 *
 * 2. Express:
 *
 * import express from "express";
 * import { hitadyQuery } from "./lib/hitady-query";
 *
 * const app = express();
 * app.use("/api/query", hitadyQuery.handler);
 *
 *
 * 3. Hono:
 *
 * import { Hono } from "hono";
 * import { hitadyQuery } from "./lib/hitady-query";
 *
 * const app = new Hono();
 * app.route("/api/query", hitadyQuery.handler);
 *
 *
 * 4. Client usage:
 *
 * import { createCrudClient } from "better-query/client";
 *
 * const client = createCrudClient({
 *   baseURL: "/api/query",
 * });
 *
 * // Create a professional
 * const professional = await client.professional.create({
 *   name: "Rakoto",
 *   profession: "Mécanicien",
 *   category: "mechanic",
 *   phoneNumber: "+261341234567",
 *   location: { city: "Antananarivo" }
 * });
 *
 * // Leave a testimonial
 * const testimonial = await client.testimonial.create({
 *   professionalId: professional.id,
 *   clientName: "Jean",
 *   text: "Excellent service, je recommande !",
 *   rating: 5
 * });
 *
 * // Create a promotion
 * const promo = await client.publication.create({
 *   professionalId: professional.id,
 *   type: "temporary_promotion",
 *   title: "Promo cette semaine",
 *   description: "Réduction de 20% sur tous les services"
 * });
 *
 * // List professionals by category
 * const mechanics = await client.professional.list({
 *   filters: { category: "mechanic" },
 *   sortBy: "averageRating",
 *   sortOrder: "desc"
 * });
 */

export default hitadyQuery;
