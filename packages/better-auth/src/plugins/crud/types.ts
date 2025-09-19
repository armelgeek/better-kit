import { ZodSchema, z } from "zod";
import { AuthEndpoint } from "../../api/call";
import { FieldAttribute } from "../../db/field";
import { Plugin } from "../../types/plugins";

export interface CrudResourceConfig {
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
		create?: (user: any, data: any) => Promise<boolean> | boolean;
		read?: (user: any, id?: string) => Promise<boolean> | boolean;
		update?: (user: any, id?: string, data?: any) => Promise<boolean> | boolean;
		delete?: (user: any, id?: string) => Promise<boolean> | boolean;
		list?: (user: any) => Promise<boolean> | boolean;
	};
}

export interface CrudOptions {
	resources: CrudResourceConfig[];
	basePath?: string;
	requireAuth?: boolean;
}

export interface CrudPlugin extends Plugin {
	id: "crud";
	endpoints: Record<string, AuthEndpoint>;
	schema: {
		[resourceName: string]: {
			fields: {
				[field: string]: FieldAttribute;
			};
		};
	};
}

export type CrudOperation = "create" | "read" | "update" | "delete" | "list";

export interface CrudContext<T = any> {
	user?: any;
	resource: string;
	operation: CrudOperation;
	data?: T;
	id?: string;
}
