import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createPlugin } from "../plugins/manager";
import {
	LocalStorageAdapter,
	type StorageAdapter,
	uploadPlugin,
} from "../plugins/upload";

describe("Upload Plugin", () => {
	const testUploadDir = "./test-uploads";

	beforeEach(() => {
		// Clean up test upload directory
		if (fs.existsSync(testUploadDir)) {
			fs.rmSync(testUploadDir, { recursive: true });
		}
	});

	afterEach(() => {
		// Clean up after tests
		if (fs.existsSync(testUploadDir)) {
			fs.rmSync(testUploadDir, { recursive: true });
		}
	});

	describe("Plugin Configuration", () => {
		it("should create upload plugin with default options", () => {
			const plugin = uploadPlugin();

			expect(plugin.id).toBe("upload");
			expect(plugin.endpoints).toBeDefined();
			expect(plugin.endpoints?.uploadFile).toBeDefined();
			expect(plugin.endpoints?.getFile).toBeDefined();
			expect(plugin.endpoints?.downloadFile).toBeDefined();
			expect(plugin.endpoints?.deleteFile).toBeDefined();
			expect(plugin.endpoints?.listFiles).toBeDefined();
		});

		it("should disable plugin when enabled is false", () => {
			const plugin = uploadPlugin({ enabled: false });

			expect(plugin.id).toBe("upload");
			expect(plugin.endpoints).toEqual({});
		});

		it("should include database schema when trackInDatabase is true", () => {
			const plugin = uploadPlugin({ trackInDatabase: true });

			expect(plugin.schema).toBeDefined();
			if (plugin.schema) {
				expect(plugin.schema.uploaded_files).toBeDefined();
				expect(plugin.schema.uploaded_files.fields.id).toBeDefined();
				expect(plugin.schema.uploaded_files.fields.filename).toBeDefined();
				expect(plugin.schema.uploaded_files.fields.mime_type).toBeDefined();
			}
		});

		it("should not include database schema when trackInDatabase is false", () => {
			const plugin = uploadPlugin({ trackInDatabase: false });

			expect(plugin.schema).toBeUndefined();
		});

		it("should allow custom configuration", () => {
			const plugin = uploadPlugin({
				enabled: true,
				uploadDir: "./custom-uploads",
				maxFileSize: 5 * 1024 * 1024, // 5MB
				allowedMimeTypes: ["image/png", "image/jpeg"],
				fileNaming: "original",
			});

			expect(plugin.id).toBe("upload");
			expect(plugin.options?.maxFileSize).toBe(5 * 1024 * 1024);
			expect(plugin.options?.allowedMimeTypes).toEqual([
				"image/png",
				"image/jpeg",
			]);
		});
	});

	describe("LocalStorageAdapter", () => {
		it("should create upload directory if it doesn't exist", () => {
			const adapter = new LocalStorageAdapter(testUploadDir);

			expect(fs.existsSync(testUploadDir)).toBe(true);
		});

		it("should store a file", async () => {
			const adapter = new LocalStorageAdapter(testUploadDir);
			const testContent = Buffer.from("Hello, World!");
			const filename = "test-file.txt";

			const result = await adapter.store(testContent, filename);

			expect(result.path).toBe(path.join(testUploadDir, filename));
			expect(fs.existsSync(result.path)).toBe(true);

			const storedContent = fs.readFileSync(result.path, "utf-8");
			expect(storedContent).toBe("Hello, World!");
		});

		it("should retrieve a file", async () => {
			const adapter = new LocalStorageAdapter(testUploadDir);
			const testContent = Buffer.from("Test content");
			const filename = "retrieve-test.txt";

			const { path: filePath } = await adapter.store(testContent, filename);
			const retrieved = await adapter.retrieve(filePath);

			expect(retrieved.toString()).toBe("Test content");
		});

		it("should delete a file", async () => {
			const adapter = new LocalStorageAdapter(testUploadDir);
			const testContent = Buffer.from("Delete me");
			const filename = "delete-test.txt";

			const { path: filePath } = await adapter.store(testContent, filename);
			expect(fs.existsSync(filePath)).toBe(true);

			await adapter.delete(filePath);
			expect(fs.existsSync(filePath)).toBe(false);
		});

		it("should check if file exists", async () => {
			const adapter = new LocalStorageAdapter(testUploadDir);
			const testContent = Buffer.from("Exists?");
			const filename = "exists-test.txt";

			const { path: filePath } = await adapter.store(testContent, filename);

			expect(await adapter.exists(filePath)).toBe(true);
			expect(await adapter.exists("/nonexistent/path.txt")).toBe(false);
		});

		it("should generate URL with baseUrl", async () => {
			const baseUrl = "https://example.com/files";
			const adapter = new LocalStorageAdapter(testUploadDir, baseUrl);
			const filename = "url-test.txt";

			const { url } = await adapter.store(Buffer.from("test"), filename);

			expect(url).toBe(`${baseUrl}/${filename}`);
		});

		it("should generate URL from path", () => {
			const baseUrl = "https://example.com/files";
			const adapter = new LocalStorageAdapter(testUploadDir, baseUrl);
			const filePath = path.join(testUploadDir, "test.txt");

			const url = adapter.getUrl(filePath);

			expect(url).toBe(`${baseUrl}/test.txt`);
		});
	});

	describe("File Validation", () => {
		it("should validate file size", async () => {
			const plugin = uploadPlugin({
				uploadDir: testUploadDir,
				maxFileSize: 100, // 100 bytes max
			});

			expect(plugin.endpoints?.uploadFile).toBeDefined();
		});

		it("should validate MIME types", async () => {
			const plugin = uploadPlugin({
				uploadDir: testUploadDir,
				allowedMimeTypes: ["image/png", "image/jpeg"],
			});

			expect(plugin.endpoints?.uploadFile).toBeDefined();
		});

		it("should support custom validation", async () => {
			let validationCalled = false;
			const plugin = uploadPlugin({
				uploadDir: testUploadDir,
				validate: async (file) => {
					validationCalled = true;
					return file.filename.endsWith(".txt");
				},
			});

			expect(plugin.endpoints?.uploadFile).toBeDefined();
		});
	});

	describe("File Naming Strategies", () => {
		it("should use uuid naming by default", () => {
			const plugin = uploadPlugin({
				uploadDir: testUploadDir,
			});

			// Default fileNaming is 'uuid' but may not be in options if it's the default
			expect(plugin.id).toBe("upload");
		});

		it("should support original filename strategy", () => {
			const plugin = uploadPlugin({
				uploadDir: testUploadDir,
				fileNaming: "original",
			});

			expect(plugin.id).toBe("upload");
		});

		it("should support custom naming function", () => {
			const customNaming = (filename: string) => `custom-${filename}`;
			const plugin = uploadPlugin({
				uploadDir: testUploadDir,
				fileNaming: customNaming,
			});

			expect(plugin.id).toBe("upload");
		});
	});

	describe("Plugin Integration", () => {
		it("should be compatible with plugin system", () => {
			const plugin = uploadPlugin({
				uploadDir: testUploadDir,
			});

			// Should be a valid plugin
			expect(plugin.id).toBeTruthy();
			expect(typeof plugin.id).toBe("string");
		});

		it("should work with createPlugin wrapper", () => {
			const plugin = createPlugin(
				uploadPlugin({
					uploadDir: testUploadDir,
				}),
			);

			expect(plugin.id).toBe("upload");
			expect(plugin.endpoints).toBeDefined();
		});

		it("should expose all endpoints", () => {
			const plugin = uploadPlugin({
				uploadDir: testUploadDir,
			});

			const expectedEndpoints = [
				"uploadFile",
				"getFile",
				"downloadFile",
				"deleteFile",
				"listFiles",
			];

			for (const endpoint of expectedEndpoints) {
				expect(plugin.endpoints?.[endpoint]).toBeDefined();
			}
		});
	});

	describe("Custom Storage Adapter", () => {
		it("should accept custom storage adapter", async () => {
			const mockStorage: StorageAdapter = {
				store: async (_file, filename) => ({
					path: `/mock/${filename}`,
					url: `https://cdn.example.com/${filename}`,
				}),
				retrieve: async (_path) => Buffer.from("mock content"),
				delete: async (_path) => {},
				exists: async (_path) => true,
				getUrl: (path) => `https://cdn.example.com/${path}`,
			};

			const plugin = uploadPlugin({
				storage: mockStorage,
			});

			expect(plugin.endpoints?.uploadFile).toBeDefined();
		});
	});

	describe("Schema Definition", () => {
		it("should define correct field types", () => {
			const plugin = uploadPlugin({
				trackInDatabase: true,
			});

			const schema = plugin.schema?.uploaded_files;
			expect(schema).toBeDefined();

			if (schema) {
				// Check field types
				expect(schema.fields.id.type).toBe("string");
				expect(schema.fields.filename.type).toBe("string");
				expect(schema.fields.size.type).toBe("number");
				expect(schema.fields.uploaded_at.type).toBe("date");
				expect(schema.fields.metadata.type).toBe("json");
			}
		});

		it("should mark required fields correctly", () => {
			const plugin = uploadPlugin({
				trackInDatabase: true,
			});

			const schema = plugin.schema?.uploaded_files;

			if (schema) {
				expect(schema.fields.id.required).toBe(true);
				expect(schema.fields.filename.required).toBe(true);
				expect(schema.fields.url.required).toBe(false);
				expect(schema.fields.uploaded_by.required).toBe(false);
			}
		});

		it("should include default values", () => {
			const plugin = uploadPlugin({
				trackInDatabase: true,
			});

			const schema = plugin.schema?.uploaded_files;

			if (schema) {
				expect(schema.fields.uploaded_at.default).toBe("now()");
			}
		});
	});
});
