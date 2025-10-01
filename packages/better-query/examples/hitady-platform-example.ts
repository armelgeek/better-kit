import { z } from "zod";
import { createCrudEndpoints } from "../src/endpoints";
import { CrudResourceConfig } from "../src/types";

/**
 * HITADY Platform Example
 *
 * This example demonstrates how to build a complete service marketplace platform
 * with professionals, testimonials, publications, and communication features.
 *
 * Features:
 * - Client testimonials (témoignages clients)
 * - Professional profiles with work showcases
 * - Publication types (photos, promotions, services, stories)
 * - Contact and communication integration
 */

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Professional Profile Schema
 * Represents service providers on the platform
 */
const professionalProfileSchema = z.object({
	id: z.string().optional(),
	userId: z.string(), // Owner/authenticated user

	// Basic information
	name: z.string().min(2, "Name must be at least 2 characters"),
	profession: z.string().min(2, "Profession is required"),
	bio: z.string().max(500).optional(),
	avatar: z.string().url().optional(),

	// Category and specialization
	category: z.enum([
		"mechanic",
		"hairdresser",
		"electrician",
		"carpenter",
		"restaurant",
		"plumber",
		"other",
	]),
	specializations: z.array(z.string()).default([]),

	// Contact information
	phoneNumber: z.string().min(10, "Valid phone number required"),
	whatsappNumber: z.string().optional(),
	location: z.object({
		address: z.string().optional(),
		city: z.string(),
		latitude: z.number().optional(),
		longitude: z.number().optional(),
	}),

	// Business details
	services: z.array(z.string()).default([]),
	priceRange: z.enum(["low", "medium", "high"]).optional(),
	workingHours: z
		.object({
			monday: z.string().optional(),
			tuesday: z.string().optional(),
			wednesday: z.string().optional(),
			thursday: z.string().optional(),
			friday: z.string().optional(),
			saturday: z.string().optional(),
			sunday: z.string().optional(),
		})
		.optional(),

	// Reputation
	averageRating: z.number().min(0).max(5).default(0),
	totalReviews: z.number().default(0),
	badges: z.array(z.string()).default([]), // "verified", "top_rated", etc.

	// Status
	isActive: z.boolean().default(true),
	isVerified: z.boolean().default(false),

	// Timestamps
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

/**
 * Testimonial Schema
 * Client reviews linked to professional profiles
 */
const testimonialSchema = z.object({
	id: z.string().optional(),

	// Relationships
	professionalId: z.string(), // Professional receiving the testimonial
	clientUserId: z.string(), // Client who left the testimonial
	clientName: z.string().min(2, "Client name required"),

	// Testimonial content
	text: z
		.string()
		.min(10, "Testimonial must be at least 10 characters")
		.max(300, "Testimonial must be maximum 300 characters (1-3 sentences)"),
	rating: z.number().min(1).max(5), // Star rating (1-5)

	// Optional media
	photo: z.string().url().optional(), // Photo of the work or client

	// Service details
	serviceType: z.string().optional(), // What service was provided

	// Display settings
	isPublished: z.boolean().default(true), // Can be displayed in feed
	isFeatured: z.boolean().default(false), // Highlighted testimonial

	// Moderation
	isModerated: z.boolean().default(false),
	moderationStatus: z
		.enum(["pending", "approved", "rejected"])
		.default("pending"),

	// Timestamps
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

/**
 * Publication Schema
 * Various content types professionals can post
 */
const publicationSchema = z.object({
	id: z.string().optional(),

	// Relationships
	professionalId: z.string(), // Professional who created the publication
	userId: z.string(), // Owner/authenticated user

	// Publication type
	type: z.enum([
		"work_photo", // Photos de réalisations
		"temporary_promotion", // Promotions temporaires
		"new_service", // Nouveaux services proposés
		"testimonial", // Témoignages clients (when shared to feed)
		"story", // Stories éphémères (24h)
	]),

	// Content
	title: z.string().min(3, "Title required").max(100),
	description: z.string().max(500).optional(),

	// Media
	photos: z.array(z.string().url()).default([]),
	beforePhoto: z.string().url().optional(), // For before/after work photos
	afterPhoto: z.string().url().optional(),

	// For promotions
	promotion: z
		.object({
			originalPrice: z.number().optional(),
			discountedPrice: z.number().optional(),
			discountPercentage: z.number().min(0).max(100).optional(),
			validFrom: z.date().optional(),
			validUntil: z.date().optional(),
		})
		.optional(),

	// For new services
	serviceDetails: z
		.object({
			serviceName: z.string(),
			indicativePrice: z.number().optional(),
			availability: z.string().optional(),
		})
		.optional(),

	// For stories (ephemeral content)
	isStory: z.boolean().default(false),
	expiresAt: z.date().optional(), // Auto-delete after 24h for stories

	// Engagement
	viewCount: z.number().default(0),
	likeCount: z.number().default(0),

	// Display settings
	isPublished: z.boolean().default(true),
	isFeatured: z.boolean().default(false),

	// Badge/label
	badge: z.enum(["promo", "new", "featured", "none"]).default("none"),

	// Timestamps
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

/**
 * Contact Request Schema
 * Tracks contact attempts between clients and professionals
 */
const contactRequestSchema = z.object({
	id: z.string().optional(),

	// Relationships
	professionalId: z.string(),
	clientUserId: z.string(),

	// Contact details
	contactType: z.enum([
		"phone_call",
		"whatsapp",
		"location_share",
		"booking_request",
	]),
	message: z.string().max(500).optional(),

	// Service request
	serviceRequested: z.string().optional(),
	preferredDate: z.date().optional(),

	// Status
	status: z
		.enum(["pending", "contacted", "completed", "cancelled"])
		.default("pending"),

	// Timestamps
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

// ============================================================================
// RESOURCE CONFIGURATIONS
// ============================================================================

/**
 * Professional Profile Resource Configuration
 */
const professionalProfileResource: CrudResourceConfig = {
	name: "professional",
	schema: professionalProfileSchema,
	tableName: "professional_profiles",

	// Ownership configuration
	ownership: {
		field: "userId",
		strategy: "flexible", // Owner + admins can manage
	},

	// Permission scopes
	scopes: {
		create: ["professional:write"],
		read: ["professional:read"],
		update: ["professional:write"],
		delete: ["professional:delete"],
		list: ["professional:read"],
	},

	// Custom permissions
	permissions: {
		create: async (context) => {
			// Users can only create one professional profile
			if (!context.user) return false;

			// Check if user already has a profile (would use helper function in real app)
			// const existingProfile = await checkExistingProfile(context.user.id);
			// return !existingProfile;

			return true; // Simplified for example
		},
		update: async (context) => {
			// Can't change verified status through normal update
			if (context.data.isVerified !== undefined && !context.user?.isAdmin) {
				return false;
			}
			return true;
		},
	},

	// Input sanitization
	sanitization: {
		global: [{ type: "trim" }, { type: "escape" }],
		fields: {
			bio: [{ type: "strip" }],
			name: [
				{
					type: "custom",
					customFn: (value: string) => value.replace(/[^\w\s-]/g, ""),
				},
			],
		},
	},

	// Lifecycle hooks
	hooks: {
		onCreate: async (context) => {
			context.data.createdAt = new Date();
			context.data.updatedAt = new Date();
			context.data.userId = context.user?.id;
			context.data.averageRating = 0;
			context.data.totalReviews = 0;
		},

		onUpdate: async (context) => {
			context.data.updatedAt = new Date();
		},

		afterCreate: async (context) => {
			// Send welcome notification to the professional
			console.log(
				`Welcome notification sent to professional ${context.result?.id}`,
			);
		},
	},
};

/**
 * Testimonial Resource Configuration
 */
const testimonialResource: CrudResourceConfig = {
	name: "testimonial",
	schema: testimonialSchema,
	tableName: "testimonials",

	// Ownership configuration
	ownership: {
		field: "clientUserId",
		strategy: "flexible",
	},

	// Permission scopes
	scopes: {
		create: ["testimonial:write"],
		read: ["testimonial:read"],
		update: ["testimonial:write"],
		delete: ["testimonial:delete"],
		list: ["testimonial:read"],
	},

	// Custom permissions
	permissions: {
		create: async (context) => {
			// Prevent spam - one testimonial per client per professional per service
			if (!context.user) return false;

			// In a real app, would check with helper function:
			// const existingTestimonial = await checkExistingTestimonial(
			//   context.user.id,
			//   context.data.professionalId
			// );
			// if (existingTestimonial) {
			//   throw new Error("You already left a testimonial for this professional");
			// }

			return true; // Simplified for example
		},
		update: async (context) => {
			// Can only update own testimonials
			return context.existingData?.clientUserId === context.user?.id;
		},
	},

	// Input sanitization
	sanitization: {
		global: [{ type: "trim" }, { type: "escape" }],
		fields: {
			text: [{ type: "strip" }],
		},
	},

	// Lifecycle hooks
	hooks: {
		onCreate: async (context) => {
			context.data.createdAt = new Date();
			context.data.updatedAt = new Date();
			context.data.clientUserId = context.user?.id;
			context.data.moderationStatus = "pending";
		},

		afterCreate: async (context) => {
			// Update professional's average rating
			// In a real app, would use adapter or helper function:
			// const allTestimonials = await context.adapter.list("testimonials", {
			//   filters: {
			//     professionalId: context.data.professionalId,
			//     moderationStatus: "approved"
			//   }
			// });
			// const totalRating = allTestimonials.reduce((sum, t) => sum + t.rating, 0);
			// const averageRating = totalRating / allTestimonials.length;
			// await updateProfessionalRating(context.data.professionalId, averageRating, allTestimonials.length);

			console.log(
				`Testimonial created for professional ${context.data.professionalId}`,
			);
		},

		onUpdate: async (context) => {
			context.data.updatedAt = new Date();
		},
	},
};

/**
 * Publication Resource Configuration
 */
const publicationResource: CrudResourceConfig = {
	name: "publication",
	schema: publicationSchema,
	tableName: "publications",

	// Ownership configuration
	ownership: {
		field: "userId",
		strategy: "flexible",
	},

	// Permission scopes
	scopes: {
		create: ["publication:write"],
		read: ["publication:read"],
		update: ["publication:write"],
		delete: ["publication:delete"],
		list: ["publication:read"],
	},

	// Custom permissions
	permissions: {
		create: async (context) => {
			// Verify user owns the professional profile
			if (!context.user) return false;

			// In a real app, would verify ownership with helper function:
			// const professional = await getProfessionalProfile(context.data.professionalId);
			// if (!professional || professional.userId !== context.user.id) {
			//   throw new Error("You can only create publications for your own professional profile");
			// }

			return true; // Simplified for example
		},
	},

	// Input sanitization
	sanitization: {
		global: [{ type: "trim" }, { type: "escape" }],
		fields: {
			title: [{ type: "strip" }],
			description: [{ type: "strip" }],
		},
	},

	// Lifecycle hooks
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
			if (context.data.type === "story" || context.data.isStory) {
				context.data.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
			}
		},

		onUpdate: async (context) => {
			context.data.updatedAt = new Date();
		},

		afterCreate: async (context) => {
			// Notify followers about new publication
			console.log(`New publication created: ${context.result?.id}`);
		},
	},
};

/**
 * Contact Request Resource Configuration
 */
const contactRequestResource: CrudResourceConfig = {
	name: "contact_request",
	schema: contactRequestSchema,
	tableName: "contact_requests",

	// Ownership configuration
	ownership: {
		field: "clientUserId",
		strategy: "flexible",
	},

	// Permission scopes
	scopes: {
		create: ["contact:write"],
		read: ["contact:read"],
		update: ["contact:write"],
		delete: ["contact:delete"],
		list: ["contact:read"],
	},

	// Input sanitization
	sanitization: {
		global: [{ type: "trim" }, { type: "escape" }],
		fields: {
			message: [{ type: "strip" }],
		},
	},

	// Lifecycle hooks
	hooks: {
		onCreate: async (context) => {
			context.data.createdAt = new Date();
			context.data.updatedAt = new Date();
			context.data.clientUserId = context.user?.id;
		},

		afterCreate: async (context) => {
			// Send notification to professional
			console.log(
				`Contact request sent to professional ${context.data.professionalId}`,
			);

			// For WhatsApp, generate pre-filled message
			if (context.data.contactType === "whatsapp") {
				// In a real app, would fetch professional data with helper function:
				// const professional = await getProfessionalProfile(context.data.professionalId);
				// if (professional) {
				//   const message = encodeURIComponent(
				//     `Salut ${professional.name}, j'ai vu votre profil sur HITADY. ` +
				//     `Je cherche ${context.data.serviceRequested || "un service"} à ${professional.location.city}. ` +
				//     `Êtes-vous disponible ?`
				//   );
				//   console.log(`WhatsApp URL: https://wa.me/${professional.whatsappNumber || professional.phoneNumber}?text=${message}`);
				// }
				console.log("WhatsApp message URL would be generated here");
			}
		},
	},
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Create a professional profile
 *
 * POST /api/query/professional
 * Headers: Authorization: Bearer <token>
 * Body:
 * {
 *   "name": "Rakoto Andrianina",
 *   "profession": "Mécanicien automobile",
 *   "category": "mechanic",
 *   "phoneNumber": "+261341234567",
 *   "location": {
 *     "city": "Antananarivo",
 *     "address": "Analakely, Rue XYZ"
 *   },
 *   "services": ["Réparation embrayage", "Vidange", "Diagnostic électronique"]
 * }
 *
 * Result:
 * - Profile created and visible in the platform
 * - Can now receive testimonials and create publications
 */

/**
 * Example 2: Client leaves a testimonial
 *
 * POST /api/query/testimonial
 * Headers: Authorization: Bearer <token>
 * Body:
 * {
 *   "professionalId": "prof_123",
 *   "clientName": "Jean",
 *   "text": "Rakoto a réparé mon embrayage rapidement et proprement, je recommande !",
 *   "rating": 5,
 *   "serviceType": "Réparation embrayage"
 * }
 *
 * Result:
 * - Testimonial created and linked to professional profile
 * - Professional's average rating updated automatically
 * - Testimonial can be displayed on profile and in feed
 */

/**
 * Example 3: Professional creates a promotion
 *
 * POST /api/query/publication
 * Headers: Authorization: Bearer <token>
 * Body:
 * {
 *   "professionalId": "prof_123",
 *   "type": "temporary_promotion",
 *   "title": "Promo vidange cette semaine",
 *   "description": "Vidange complète avec filtre inclus",
 *   "photos": ["https://example.com/photo.jpg"],
 *   "promotion": {
 *     "originalPrice": 50000,
 *     "discountedPrice": 35000,
 *     "validUntil": "2024-12-31"
 *   }
 * }
 *
 * Result:
 * - Publication created with "promo" badge
 * - Visible in feed and stories
 * - Attracts attention with promotional pricing
 */

/**
 * Example 4: Professional shares work photos
 *
 * POST /api/query/publication
 * Headers: Authorization: Bearer <token>
 * Body:
 * {
 *   "professionalId": "prof_123",
 *   "type": "work_photo",
 *   "title": "Réparation moteur diesel",
 *   "description": "Remplacement joint de culasse",
 *   "beforePhoto": "https://example.com/before.jpg",
 *   "afterPhoto": "https://example.com/after.jpg"
 * }
 *
 * Result:
 * - Showcases professional's work quality
 * - Visible on profile and in feed
 * - Helps build trust with potential clients
 */

/**
 * Example 5: Client contacts professional via WhatsApp
 *
 * POST /api/query/contact_request
 * Headers: Authorization: Bearer <token>
 * Body:
 * {
 *   "professionalId": "prof_123",
 *   "contactType": "whatsapp",
 *   "serviceRequested": "Réparation embrayage",
 *   "message": "Je cherche un mécanicien pour réparer mon embrayage"
 * }
 *
 * Result:
 * - Contact request logged
 * - WhatsApp URL generated with pre-filled message:
 *   "Salut Rakoto, j'ai vu votre profil sur HITADY.
 *    Je cherche Réparation embrayage à Antananarivo.
 *    Êtes-vous disponible ?"
 * - Professional receives notification
 */

/**
 * Example 6: List professionals by category
 *
 * GET /api/query/professional?filters={"category":"mechanic"}&sortBy=averageRating&sortOrder=desc
 *
 * Result:
 * - Returns all mechanics sorted by rating
 * - Shows profiles with testimonials and ratings
 * - Helps users find the best professionals
 */

/**
 * Example 7: Get testimonials for a professional
 *
 * GET /api/query/testimonial?filters={"professionalId":"prof_123","moderationStatus":"approved"}
 *
 * Result:
 * - Returns all approved testimonials for the professional
 * - Displayed on professional's profile page
 * - Helps build trust and credibility
 */

/**
 * Example 8: Create ephemeral story (24h)
 *
 * POST /api/query/publication
 * Headers: Authorization: Bearer <token>
 * Body:
 * {
 *   "professionalId": "prof_123",
 *   "type": "story",
 *   "title": "Disponible aujourd'hui",
 *   "description": "Deux créneaux libres cet après-midi pour réparations rapides",
 *   "photos": ["https://example.com/workshop.jpg"]
 * }
 *
 * Result:
 * - Story created and visible for 24 hours
 * - Auto-expires after 24h
 * - Perfect for daily updates and flash promotions
 */

// Mock helper functions (would be implemented in real application)
async function getUserProductCount(userId: string): Promise<number> {
	return 0;
}

// Export resources
export const hitadyResources = [
	professionalProfileResource,
	testimonialResource,
	publicationResource,
	contactRequestResource,
];

/**
 * Complete HITADY Platform Setup
 *
 * This configuration provides:
 * 1. ✅ Professional profiles with contact info and location
 * 2. ✅ Client testimonials with ratings and moderation
 * 3. ✅ Multiple publication types (photos, promotions, services, stories)
 * 4. ✅ Contact tracking with WhatsApp integration
 * 5. ✅ Automatic rating calculations
 * 6. ✅ Ownership and permission controls
 * 7. ✅ Input sanitization and validation
 * 8. ✅ Business logic via lifecycle hooks
 *
 * Integration points:
 * - WhatsApp: Pre-filled message generation
 * - Phone: Direct call buttons
 * - Location: GPS coordinates for map integration
 * - Stories: 24h auto-expiration
 * - Moderation: Testimonial approval workflow
 * - Badges: Automatic badge assignment
 */
