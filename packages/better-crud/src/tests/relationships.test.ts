import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { z } from "zod";
import { adiemus } from "../crud";
import { belongsTo, hasMany, belongsToMany } from "../schemas/relationships";

// Define test schemas since we no longer have predefined ones
const testUserSchema = z.object({
	id: z.string().optional(),
	email: z.string().email("Valid email is required"),
	name: z.string().min(1, "Name is required"),
	role: z.enum(["user", "admin"]).default("user"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const testProductSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Product name is required"),
	description: z.string().optional(),
	price: z.number().min(0, "Price must be positive"),
	categoryId: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const testCategorySchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Category name is required"),
	description: z.string().optional(),
	parentId: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

const testReviewSchema = z.object({
	id: z.string().optional(),
	productId: z.string(),
	userId: z.string(),
	rating: z.number().int().min(1).max(5),
	title: z.string().min(1, "Review title is required"),
	content: z.string().min(1, "Review content is required"),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

describe("CRUD Relationship Management", () => {
	let crud: any;

	beforeAll(async () => {
		// Create CRUD instance with relationships
		crud = adiemus({
			database: {
				provider: "sqlite",
				url: "sqlite::memory:",
				autoMigrate: true,
			},
			resources: [
				{
					name: "user",
					schema: testUserSchema,
					relationships: {
						// Define user relationships using helper functions
						reviews: hasMany("review", "userId"),
					},
				},
				{
					name: "category",
					schema: testCategorySchema,
					relationships: {
						// Define category relationships using helper functions
						parent: belongsTo("category", "parentId"),
						children: hasMany("category", "parentId"),
						products: hasMany("product", "categoryId"),
					},
				},
				{
					name: "product",
					schema: testProductSchema,
					relationships: {
						// Define product relationships using helper functions
						category: belongsTo("category", "categoryId"),
						reviews: hasMany("review", "productId"),
					},
				},
				{
					name: "review",
					schema: testReviewSchema,
					relationships: {
						product: belongsTo("product", "productId"),
						user: belongsTo("user", "userId"),
					},
				},
			],
		});

		// Wait a bit for database initialization
		await new Promise((resolve) => setTimeout(resolve, 100));
	});

	describe("Basic Relationship Configuration", () => {
		it("should register relationships correctly", () => {
			expect(crud.context.relationships.get("product")).toBeDefined();
			expect(crud.context.relationships.get("category")).toBeDefined();
			expect(crud.context.relationships.get("review")).toBeDefined();
			expect(crud.context.relationships.get("user")).toBeDefined();
		});

		it("should validate relationship configurations", () => {
			const productRelations = crud.context.relationships.get("product");
			expect(productRelations.category).toBeDefined();
			expect(productRelations.category.type).toBe("belongsTo");
			expect(productRelations.category.target).toBe("category");
			expect(productRelations.category.foreignKey).toBe("categoryId");

			expect(productRelations.reviews).toBeDefined();
			expect(productRelations.reviews.type).toBe("hasMany");
			expect(productRelations.reviews.target).toBe("review");
		});
	});

	describe("Schema Generation with References", () => {
		it("should generate schema with proper field references", () => {
			const productSchema = crud.context.schemas.get("product");
			expect(productSchema).toBeDefined();
			expect(productSchema.fields.categoryId).toBeDefined();
			expect(productSchema.fields.categoryId.type).toBe("string");

			const reviewSchema = crud.context.schemas.get("review");
			expect(reviewSchema).toBeDefined();
			expect(reviewSchema.fields.productId).toBeDefined();
			expect(reviewSchema.fields.productId.type).toBe("string");
			expect(reviewSchema.fields.userId).toBeDefined();
			expect(reviewSchema.fields.userId.type).toBe("string");
		});
	});

	describe("Direct Adapter Operations", () => {
		it("should create and fetch records with adapter", async () => {
			const adapter = crud.context.adapter;

			// Create a user
			const user = await adapter.create({
				model: "user",
				data: {
					id: "user-1",
					email: "john@example.com",
					name: "John Doe",
					role: "user",
				},
			});

			expect(user.id).toBe("user-1");
			expect(user.email).toBe("john@example.com");

			// Create a category
			const category = await adapter.create({
				model: "category",
				data: {
					id: "cat-1",
					name: "Electronics",
					slug: "electronics",
					description: "Electronic devices and gadgets",
				},
			});

			expect(category.id).toBe("cat-1");
			expect(category.name).toBe("Electronics");

			// Create a product with category reference
			const product = await adapter.create({
				model: "product",
				data: {
					id: "prod-1",
					name: "iPhone 15",
					description: "Latest iPhone model",
					price: 999,
					categoryId: "cat-1",
					sku: "IPHONE15",
					stock: 10,
				},
			});

			expect(product.id).toBe("prod-1");
			expect(product.categoryId).toBe("cat-1");

			// Create a review for the product
			const review = await adapter.create({
				model: "review",
				data: {
					id: "rev-1",
					productId: "prod-1",
					userId: "user-1",
					rating: 5,
					title: "Great phone!",
					content: "Love the new features and camera quality.",
				},
			});

			expect(review.id).toBe("rev-1");
			expect(review.productId).toBe("prod-1");
			expect(review.userId).toBe("user-1");
		});

		it("should fetch records with included relationships", async () => {
			const adapter = crud.context.adapter;

			// Fetch product with category relationship
			const productWithCategory = await adapter.findFirst({
				model: "product",
				where: [{ field: "id", value: "prod-1" }],
				include: { include: ["category"] },
			});

			expect(productWithCategory.id).toBe("prod-1");
			expect(productWithCategory.category).toBeDefined();
			expect(productWithCategory.category.name).toBe("Electronics");

			// Fetch product with reviews relationship
			const productWithReviews = await adapter.findFirst({
				model: "product",
				where: [{ field: "id", value: "prod-1" }],
				include: { include: ["reviews"] },
			});

			expect(productWithReviews.id).toBe("prod-1");
			expect(productWithReviews.reviews).toBeDefined();
			expect(Array.isArray(productWithReviews.reviews)).toBe(true);
			expect(productWithReviews.reviews.length).toBe(1);
			expect(productWithReviews.reviews[0].title).toBe("Great phone!");
		});

		it("should handle multiple includes", async () => {
			const adapter = crud.context.adapter;

			// Fetch product with both category and reviews
			const productWithAll = await adapter.findFirst({
				model: "product",
				where: [{ field: "id", value: "prod-1" }],
				include: { include: ["category", "reviews"] },
			});

			expect(productWithAll.id).toBe("prod-1");
			expect(productWithAll.category).toBeDefined();
			expect(productWithAll.category.name).toBe("Electronics");
			expect(productWithAll.reviews).toBeDefined();
			expect(Array.isArray(productWithAll.reviews)).toBe(true);
			expect(productWithAll.reviews.length).toBe(1);
		});

		it("should handle nested includes with select", async () => {
			const adapter = crud.context.adapter;

			// Fetch review with nested product->category relationship
			const reviewWithNested = await adapter.findFirst({
				model: "review",
				where: [{ field: "id", value: "rev-1" }],
				include: {
					select: {
						product: {
							include: ["category"]
						},
						user: true
					}
				},
			});

			expect(reviewWithNested.id).toBe("rev-1");
			expect(reviewWithNested.product).toBeDefined();
			expect(reviewWithNested.product.category).toBeDefined();
			expect(reviewWithNested.product.category.name).toBe("Electronics");
			expect(reviewWithNested.user).toBeDefined();
			expect(reviewWithNested.user.name).toBe("John Doe");
		});
	});

	describe("Self-Referencing Relationships", () => {
		it("should handle parent-child category relationships", async () => {
			const adapter = crud.context.adapter;

			// Create parent category
			const parentCategory = await adapter.create({
				model: "category",
				data: {
					id: "parent-cat",
					name: "Computing",
					slug: "computing",
					description: "All computing devices",
				},
			});

			// Create child category
			const childCategory = await adapter.create({
				model: "category",
				data: {
					id: "child-cat",
					name: "Laptops",
					slug: "laptops",
					description: "Laptop computers",
					parentId: "parent-cat",
				},
			});

			// Fetch parent with children
			const parentWithChildren = await adapter.findFirst({
				model: "category",
				where: [{ field: "id", value: "parent-cat" }],
				include: { include: ["children"] },
			});

			expect(parentWithChildren.children).toBeDefined();
			expect(Array.isArray(parentWithChildren.children)).toBe(true);
			expect(parentWithChildren.children.length).toBe(1);
			expect(parentWithChildren.children[0].name).toBe("Laptops");

			// Fetch child with parent
			const childWithParent = await adapter.findFirst({
				model: "category",
				where: [{ field: "id", value: "child-cat" }],
				include: { include: ["parent"] },
			});

			expect(childWithParent.parent).toBeDefined();
			expect(childWithParent.parent.name).toBe("Computing");
		});
	});

	describe("List Operations with Relationships", () => {
		it("should fetch lists with included relationships", async () => {
			const adapter = crud.context.adapter;

			// Fetch all products with categories
			const productsWithCategory = await adapter.findMany({
				model: "product",
				include: { include: ["category"] },
			});

			expect(productsWithCategory.length).toBeGreaterThan(0);
			const firstProduct = productsWithCategory[0];
			expect(firstProduct.category).toBeDefined();
			expect(firstProduct.category.name).toBeDefined();

			// Fetch all products with reviews
			const productsWithReviews = await adapter.findMany({
				model: "product",
				include: { include: ["reviews"] },
			});

			expect(productsWithReviews.length).toBeGreaterThan(0);
			const firstProductWithReviews = productsWithReviews[0];
			expect(firstProductWithReviews.reviews).toBeDefined();
			expect(Array.isArray(firstProductWithReviews.reviews)).toBe(true);
		});
	});
});