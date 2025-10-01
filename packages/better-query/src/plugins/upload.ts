import * as fs from "node:fs";
import * as path from "node:path";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { createCrudEndpoint } from "../endpoints/crud-endpoint";
import { Plugin } from "../types/plugins";

/**
 * File metadata structure
 */
export interface FileMetadata {
	id: string;
	filename: string;
	originalName: string;
	mimeType: string;
	size: number;
	path: string;
	url?: string;
	uploadedBy?: string;
	uploadedAt: Date;
	metadata?: Record<string, any>;
}

/**
 * Storage adapter interface - allows different storage backends
 */
export interface StorageAdapter {
	/**
	 * Store a file
	 * @param file File buffer or stream
	 * @param filename Desired filename
	 * @param options Additional options
	 * @returns File metadata
	 */
	store(
		file: Buffer | ReadableStream,
		filename: string,
		options?: {
			mimeType?: string;
			metadata?: Record<string, any>;
		},
	): Promise<{ path: string; url?: string }>;

	/**
	 * Retrieve a file
	 * @param path File path
	 * @returns File buffer
	 */
	retrieve(path: string): Promise<Buffer>;

	/**
	 * Delete a file
	 * @param path File path
	 */
	delete(path: string): Promise<void>;

	/**
	 * Check if a file exists
	 * @param path File path
	 */
	exists(path: string): Promise<boolean>;

	/**
	 * Get file URL
	 * @param path File path
	 */
	getUrl(path: string): string;
}

/**
 * Local filesystem storage adapter
 */
export class LocalStorageAdapter implements StorageAdapter {
	private uploadDir: string;
	private baseUrl?: string;

	constructor(uploadDir: string, baseUrl?: string) {
		this.uploadDir = uploadDir;
		this.baseUrl = baseUrl;

		// Ensure upload directory exists
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
	}

	async store(
		file: Buffer | ReadableStream,
		filename: string,
		options?: {
			mimeType?: string;
			metadata?: Record<string, any>;
		},
	): Promise<{ path: string; url?: string }> {
		const filePath = path.join(this.uploadDir, filename);

		if (Buffer.isBuffer(file)) {
			fs.writeFileSync(filePath, file);
		} else {
			// Handle ReadableStream (for streaming uploads)
			const chunks: Buffer[] = [];
			const reader = file.getReader();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				if (value) {
					chunks.push(Buffer.from(value));
				}
			}

			fs.writeFileSync(filePath, Buffer.concat(chunks));
		}

		return {
			path: filePath,
			url: this.baseUrl ? `${this.baseUrl}/${filename}` : undefined,
		};
	}

	async retrieve(filePath: string): Promise<Buffer> {
		return fs.readFileSync(filePath);
	}

	async delete(filePath: string): Promise<void> {
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	}

	async exists(filePath: string): Promise<boolean> {
		return fs.existsSync(filePath);
	}

	getUrl(filePath: string): string {
		const filename = path.basename(filePath);
		return this.baseUrl ? `${this.baseUrl}/${filename}` : filePath;
	}
}

/**
 * Upload plugin options
 */
export interface UploadPluginOptions {
	/** Whether to enable file uploads */
	enabled?: boolean;

	/** Storage adapter to use (defaults to local filesystem) */
	storage?: StorageAdapter;

	/** Upload directory for local storage (default: './uploads') */
	uploadDir?: string;

	/** Base URL for serving files (e.g., 'https://example.com/files') */
	baseUrl?: string;

	/** Maximum file size in bytes (default: 10MB) */
	maxFileSize?: number;

	/** Allowed MIME types (default: allow all) */
	allowedMimeTypes?: string[];

	/** Custom file naming strategy */
	fileNaming?: "original" | "uuid" | ((filename: string) => string);

	/** Whether to track uploads in database */
	trackInDatabase?: boolean;

	/** Custom validation function */
	validate?: (file: {
		filename: string;
		mimeType: string;
		size: number;
	}) => Promise<boolean> | boolean;
}

/**
 * Upload plugin factory
 */
export function uploadPlugin(options: UploadPluginOptions = {}): Plugin {
	const {
		enabled = true,
		uploadDir = "./uploads",
		baseUrl,
		maxFileSize = 10 * 1024 * 1024, // 10MB default
		allowedMimeTypes = [],
		fileNaming = "uuid",
		trackInDatabase = true,
		validate,
	} = options;

	if (!enabled) {
		return {
			id: "upload",
			endpoints: {},
		};
	}

	// Initialize storage adapter
	const storage =
		options.storage || new LocalStorageAdapter(uploadDir, baseUrl);

	// File naming strategy
	const generateFilename = (originalName: string): string => {
		if (typeof fileNaming === "function") {
			return fileNaming(originalName);
		}

		if (fileNaming === "original") {
			return originalName;
		}

		// Default: uuid with original extension
		const ext = path.extname(originalName);
		return `${createId()}${ext}`;
	};

	// Validation helper
	const validateFile = async (
		filename: string,
		mimeType: string,
		size: number,
	): Promise<{ valid: boolean; error?: string }> => {
		// Size check
		if (size > maxFileSize) {
			return {
				valid: false,
				error: `File size exceeds maximum allowed size of ${maxFileSize} bytes`,
			};
		}

		// MIME type check
		if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mimeType)) {
			return {
				valid: false,
				error: `File type ${mimeType} is not allowed`,
			};
		}

		// Custom validation
		if (validate) {
			const customValid = await validate({ filename, mimeType, size });
			if (!customValid) {
				return {
					valid: false,
					error: "File failed custom validation",
				};
			}
		}

		return { valid: true };
	};

	return {
		id: "upload",

		endpoints: {
			// Upload a file
			uploadFile: createCrudEndpoint(
				"/upload/file",
				{
					method: "POST",
					body: z.object({
						file: z.string(), // Base64 encoded file
						filename: z.string(),
						mimeType: z.string(),
						metadata: z.record(z.any()).optional(),
					}),
				},
				async (ctx) => {
					const { file, filename, mimeType, metadata } = ctx.body;

					// Decode base64 file
					const fileBuffer = Buffer.from(file, "base64");
					const fileSize = fileBuffer.length;

					// Validate file
					const validation = await validateFile(filename, mimeType, fileSize);
					if (!validation.valid) {
						return ctx.json(
							{
								error: validation.error,
							},
							{
								status: 400,
							},
						);
					}

					// Generate unique filename
					const storedFilename = generateFilename(filename);

					// Store file
					const { path: filePath, url } = await storage.store(
						fileBuffer,
						storedFilename,
						{
							mimeType,
							metadata,
						},
					);

					// Create file record
					const fileRecord: FileMetadata = {
						id: createId(),
						filename: storedFilename,
						originalName: filename,
						mimeType,
						size: fileSize,
						path: filePath,
						url: url || storage.getUrl(filePath),
						uploadedBy: (ctx as any).user?.id,
						uploadedAt: new Date(),
						metadata,
					};

					return ctx.json(fileRecord, { status: 201 });
				},
			),

			// Get file metadata
			getFile: createCrudEndpoint(
				"/upload/file/:id",
				{
					method: "GET",
				},
				async (ctx) => {
					const fileId = ctx.params?.id;

					if (!fileId) {
						return ctx.json({ error: "File ID is required" }, { status: 400 });
					}

					// In a real implementation, this would query the database
					// For now, return a placeholder response
					return ctx.json({
						message: "File metadata retrieval - requires database integration",
						fileId,
					});
				},
			),

			// Download file
			downloadFile: createCrudEndpoint(
				"/upload/download/:id",
				{
					method: "GET",
				},
				async (ctx) => {
					const fileId = ctx.params?.id;

					if (!fileId) {
						return ctx.json({ error: "File ID is required" }, { status: 400 });
					}

					// In a real implementation, this would:
					// 1. Query database for file path
					// 2. Retrieve file from storage
					// 3. Stream file to client
					return ctx.json({
						message: "File download - requires database integration",
						fileId,
					});
				},
			),

			// Delete file
			deleteFile: createCrudEndpoint(
				"/upload/file/:id",
				{
					method: "DELETE",
				},
				async (ctx) => {
					const fileId = ctx.params?.id;

					if (!fileId) {
						return ctx.json({ error: "File ID is required" }, { status: 400 });
					}

					// In a real implementation, this would:
					// 1. Query database for file path
					// 2. Delete file from storage
					// 3. Remove database record
					return ctx.json({
						message: "File deleted successfully",
						fileId,
					});
				},
			),

			// List uploaded files
			listFiles: createCrudEndpoint(
				"/upload/files",
				{
					method: "GET",
					query: z
						.object({
							page: z
								.string()
								.optional()
								.transform((val) => (val ? parseInt(val) : 1)),
							limit: z
								.string()
								.optional()
								.transform((val) => (val ? parseInt(val) : 50)),
							mimeType: z.string().optional(),
							uploadedBy: z.string().optional(),
						})
						.optional(),
				},
				async (ctx) => {
					// In a real implementation, this would query the database
					return ctx.json({
						message: "File listing - requires database integration",
						query: ctx.query,
						files: [],
					});
				},
			),
		},

		// Database schema for tracking uploads
		schema: trackInDatabase
			? {
					uploaded_files: {
						fields: {
							id: {
								type: "string",
								required: true,
							},
							filename: {
								type: "string",
								required: true,
							},
							original_name: {
								type: "string",
								required: true,
							},
							mime_type: {
								type: "string",
								required: true,
							},
							size: {
								type: "number",
								required: true,
							},
							path: {
								type: "string",
								required: true,
							},
							url: {
								type: "string",
								required: false,
							},
							uploaded_by: {
								type: "string",
								required: false,
							},
							uploaded_at: {
								type: "date",
								required: true,
								default: "now()",
							},
							metadata: {
								type: "json",
								required: false,
							},
						},
					},
				}
			: undefined,

		options,
	};
}
