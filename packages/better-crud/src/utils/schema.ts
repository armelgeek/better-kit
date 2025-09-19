import { z, ZodSchema, ZodTypeAny } from "zod";
import { FieldAttribute } from "../types";

/**
 * Convert Zod schema to database field attributes
 */
export function zodSchemaToFields(zodSchema: ZodSchema): Record<string, FieldAttribute> {
	const fields: Record<string, FieldAttribute> = {};
	
	if (zodSchema instanceof z.ZodObject) {
		const shape = zodSchema.shape;
		
		for (const [key, fieldDef] of Object.entries(shape)) {
			fields[key] = inferFieldAttribute(fieldDef as ZodTypeAny);
		}
	}
	
	return fields;
}

/**
 * Infer field attributes from Zod field definition
 */
export function inferFieldAttribute(fieldDef: ZodTypeAny): FieldAttribute {
	let type: FieldAttribute["type"] = "string";
	let required = true;
	let defaultValue: any = undefined;
	let length: number | undefined = undefined;
	
	// Handle optional and nullable fields
	let innerType = fieldDef;
	if (fieldDef instanceof z.ZodOptional) {
		required = false;
		innerType = fieldDef.unwrap();
	}
	if (innerType instanceof z.ZodNullable) {
		required = false;
		innerType = innerType.unwrap();
	}
	if (innerType instanceof z.ZodDefault) {
		defaultValue = innerType._def.defaultValue();
		innerType = innerType.removeDefault();
	}
	
	// Determine the base type
	if (innerType instanceof z.ZodString) {
		type = "string";
		if (innerType._def.checks) {
			for (const check of innerType._def.checks) {
				if (check.kind === "max") {
					length = check.value;
				}
			}
		}
	} else if (innerType instanceof z.ZodNumber) {
		type = "number";
	} else if (innerType instanceof z.ZodBoolean) {
		type = "boolean";
	} else if (innerType instanceof z.ZodDate) {
		type = "date";
	} else if (
		innerType instanceof z.ZodArray ||
		innerType instanceof z.ZodObject ||
		innerType instanceof z.ZodRecord
	) {
		type = "json";
	} else if (innerType instanceof z.ZodEnum) {
		type = "string";
	}
	
	return {
		type,
		required,
		default: defaultValue,
		...(length !== undefined && { length }),
	};
}

/**
 * Generate table name from resource name
 */
export function getTableName(resourceName: string, customTableName?: string): string {
	return customTableName || resourceName;
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
	// Using a simple implementation here - in a real scenario you'd use cuid2 or similar
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Validate data against Zod schema
 */
export function validateData(schema: ZodSchema, data: any) {
	try {
		return {
			success: true,
			data: schema.parse(data),
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof z.ZodError ? error : new Error("Validation failed"),
		};
	}
}

/**
 * Create a simple resource configuration helper
 */
export function createResource(config: {
	name: string;
	schema: ZodSchema;
	tableName?: string;
	endpoints?: {
		create?: boolean;
		read?: boolean;
		update?: boolean;
		delete?: boolean;
		list?: boolean;
	};
	permissions?: {
		create?: (context: any) => Promise<boolean> | boolean;
		read?: (context: any) => Promise<boolean> | boolean;
		update?: (context: any) => Promise<boolean> | boolean;
		delete?: (context: any) => Promise<boolean> | boolean;
		list?: (context: any) => Promise<boolean> | boolean;
	};
}) {
	return {
		...config,
		endpoints: {
			create: true,
			read: true,
			update: true,
			delete: true,
			list: true,
			...config.endpoints,
		},
	};
}