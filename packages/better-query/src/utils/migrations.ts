import { ZodSchema, ZodObject, ZodRawShape } from "zod";
import { FieldAttribute } from "../types";
import { QueryAdapter } from "../types/adapter";
import { zodSchemaToFields } from "../utils/schema";

/**
 * Schema migration utilities for handling breaking changes
 */

export interface SchemaVersion {
	version: string;
	schema: ZodSchema;
	migrations?: Migration[];
	description?: string;
	createdAt?: Date;
}

export interface Migration {
	id: string;
	version: string;
	type: 'add_field' | 'remove_field' | 'rename_field' | 'change_type' | 'custom';
	description: string;
	up: (adapter: QueryAdapter) => Promise<void>;
	down: (adapter: QueryAdapter) => Promise<void>;
}

export interface SchemaChange {
	type: 'added' | 'removed' | 'modified';
	field: string;
	oldType?: string;
	newType?: string;
	breaking: boolean;
	migration?: Migration;
}

export class SchemaMigrationManager {
	private versions: Map<string, SchemaVersion> = new Map();
	private currentVersion: string = '1.0.0';
	
	/**
	 * Register a schema version
	 */
	registerVersion(resource: string, version: SchemaVersion): void {
		const key = `${resource}:${version.version}`;
		this.versions.set(key, version);
	}
	
	/**
	 * Compare two schemas and detect changes
	 */
	compareSchemas(
		resource: string,
		oldSchema: ZodSchema,
		newSchema: ZodSchema,
		oldVersion: string = '1.0.0',
		newVersion: string = '1.1.0'
	): SchemaChange[] {
		const oldFields = zodSchemaToFields(oldSchema);
		const newFields = zodSchemaToFields(newSchema);
		
		const changes: SchemaChange[] = [];
		
		// Check for removed fields (breaking change)
		for (const fieldName in oldFields) {
			if (!(fieldName in newFields)) {
				const oldField = oldFields[fieldName];
				if (oldField) {
					changes.push({
						type: 'removed',
						field: fieldName,
						oldType: oldField.type,
						breaking: true,
						migration: this.createFieldRemovalMigration(resource, fieldName, oldField)
					});
				}
			}
		}
		
		// Check for added fields (non-breaking if optional)
		for (const fieldName in newFields) {
			if (!(fieldName in oldFields)) {
				const newField = newFields[fieldName];
				if (newField) {
					const isBreaking = newField.required === true;
					changes.push({
						type: 'added',
						field: fieldName,
						newType: newField.type,
						breaking: isBreaking,
						migration: isBreaking ? this.createFieldAdditionMigration(resource, fieldName, newField) : undefined
					});
				}
			}
		}
		
		// Check for modified fields (potentially breaking)
		for (const fieldName in newFields) {
			if (fieldName in oldFields) {
				const oldField = oldFields[fieldName];
				const newField = newFields[fieldName];
				
				if (oldField && newField && oldField.type !== newField.type) {
					changes.push({
						type: 'modified',
						field: fieldName,
						oldType: oldField.type,
						newType: newField.type,
						breaking: this.isTypeChangeBreaking(oldField.type, newField.type),
						migration: this.createFieldTypeChangeMigration(resource, fieldName, oldField, newField)
					});
				}
				
				// Check for required changes
				if (oldField && newField && oldField.required === false && newField.required === true) {
					changes.push({
						type: 'modified',
						field: `${fieldName}:required`,
						breaking: true,
						migration: this.createRequiredFieldMigration(resource, fieldName, newField)
					});
				}
			}
		}
		
		return changes;
	}
	
	/**
	 * Generate migration for field removal
	 */
	private createFieldRemovalMigration(resource: string, fieldName: string, field: FieldAttribute): Migration {
		return {
			id: `remove_${resource}_${fieldName}_${Date.now()}`,
			version: this.currentVersion,
			type: 'remove_field',
			description: `Remove field '${fieldName}' from ${resource}`,
			up: async (adapter: QueryAdapter) => {
				// Remove column from table
				if ('dropColumn' in adapter) {
					await (adapter as any).dropColumn(resource, fieldName);
				}
			},
			down: async (adapter: QueryAdapter) => {
				// Add column back to table
				if ('addColumn' in adapter) {
					await (adapter as any).addColumn(resource, fieldName, field);
				}
			}
		};
	}
	
	/**
	 * Generate migration for field addition
	 */
	private createFieldAdditionMigration(resource: string, fieldName: string, field: FieldAttribute): Migration {
		return {
			id: `add_${resource}_${fieldName}_${Date.now()}`,
			version: this.currentVersion,
			type: 'add_field',
			description: `Add field '${fieldName}' to ${resource}`,
			up: async (adapter: QueryAdapter) => {
				// Add column to table
				if ('addColumn' in adapter) {
					await (adapter as any).addColumn(resource, fieldName, field);
				}
			},
			down: async (adapter: QueryAdapter) => {
				// Remove column from table
				if ('dropColumn' in adapter) {
					await (adapter as any).dropColumn(resource, fieldName);
				}
			}
		};
	}
	
	/**
	 * Generate migration for field type change
	 */
	private createFieldTypeChangeMigration(
		resource: string,
		fieldName: string,
		oldField: FieldAttribute,
		newField: FieldAttribute
	): Migration {
		return {
			id: `change_${resource}_${fieldName}_${oldField.type}_to_${newField.type}_${Date.now()}`,
			version: this.currentVersion,
			type: 'change_type',
			description: `Change field '${fieldName}' type from ${oldField.type} to ${newField.type} in ${resource}`,
			up: async (adapter: QueryAdapter) => {
				// Change column type
				if ('changeColumnType' in adapter) {
					await (adapter as any).changeColumnType(resource, fieldName, newField);
				}
			},
			down: async (adapter: QueryAdapter) => {
				// Revert column type
				if ('changeColumnType' in adapter) {
					await (adapter as any).changeColumnType(resource, fieldName, oldField);
				}
			}
		};
	}
	
	/**
	 * Generate migration for making field required
	 */
	private createRequiredFieldMigration(resource: string, fieldName: string, field: FieldAttribute): Migration {
		return {
			id: `require_${resource}_${fieldName}_${Date.now()}`,
			version: this.currentVersion,
			type: 'custom',
			description: `Make field '${fieldName}' required in ${resource}`,
			up: async (adapter: QueryAdapter) => {
				// First, update NULL values to default value
				if (field.default !== undefined) {
					if ('updateNullValues' in adapter) {
						await (adapter as any).updateNullValues(resource, fieldName, field.default);
					}
				}
				
				// Then, make column NOT NULL
				if ('makeColumnRequired' in adapter) {
					await (adapter as any).makeColumnRequired(resource, fieldName);
				}
			},
			down: async (adapter: QueryAdapter) => {
				// Make column optional again
				if ('makeColumnOptional' in adapter) {
					await (adapter as any).makeColumnOptional(resource, fieldName);
				}
			}
		};
	}
	
	/**
	 * Check if a type change is breaking
	 */
	private isTypeChangeBreaking(oldType: string, newType: string): boolean {
		// Define non-breaking type changes
		const nonBreakingChanges = [
			['string', 'text'], // varchar to text
			['number', 'decimal'], // int to decimal
			['boolean', 'string'], // bool to string (with proper migration)
		];
		
		return !nonBreakingChanges.some(([from, to]) => 
			oldType === from && newType === to
		);
	}
	
	/**
	 * Apply migrations
	 */
	async applyMigrations(adapter: QueryAdapter, migrations: Migration[]): Promise<void> {
		for (const migration of migrations) {
			try {
				await migration.up(adapter);
				console.log(`Applied migration: ${migration.description}`);
			} catch (error) {
				console.error(`Failed to apply migration ${migration.id}:`, error);
				throw error;
			}
		}
	}
	
	/**
	 * Rollback migrations
	 */
	async rollbackMigrations(adapter: QueryAdapter, migrations: Migration[]): Promise<void> {
		// Apply in reverse order
		for (const migration of migrations.reverse()) {
			try {
				await migration.down(adapter);
				console.log(`Rolled back migration: ${migration.description}`);
			} catch (error) {
				console.error(`Failed to rollback migration ${migration.id}:`, error);
				throw error;
			}
		}
	}
	
	/**
	 * Generate breaking changes report
	 */
	generateBreakingChangesReport(changes: SchemaChange[]): string {
		const breakingChanges = changes.filter(c => c.breaking);
		
		if (breakingChanges.length === 0) {
			return "No breaking changes detected.";
		}
		
		let report = "⚠️  BREAKING CHANGES DETECTED:\n\n";
		
		for (const change of breakingChanges) {
			switch (change.type) {
				case 'removed':
					report += `❌ Field '${change.field}' has been removed\n`;
					report += `   This will cause existing queries using this field to fail.\n\n`;
					break;
				case 'added':
					report += `➕ Field '${change.field}' has been added as required\n`;
					report += `   Existing records will need to be updated with a value for this field.\n\n`;
					break;
				case 'modified':
					if (change.field.includes(':required')) {
						const fieldName = change.field.split(':')[0];
						report += `🔒 Field '${fieldName}' is now required\n`;
						report += `   Existing records with NULL values will cause errors.\n\n`;
					} else {
						report += `🔄 Field '${change.field}' type changed from ${change.oldType} to ${change.newType}\n`;
						report += `   Data transformation may be required.\n\n`;
					}
					break;
			}
		}
		
		report += "Please review these changes carefully and ensure proper migration strategy.";
		
		return report;
	}
}

/**
 * Schema versioning helper
 */
export function withSchemaVersion<T extends ZodRawShape>(
	version: string,
	schema: ZodObject<T>,
	migrations?: Migration[]
): SchemaVersion {
	return {
		version,
		schema,
		migrations,
		createdAt: new Date()
	};
}

/**
 * Create migration from schema comparison
 */
export function createSchemaMigration(
	resource: string,
	fromSchema: ZodSchema,
	toSchema: ZodSchema,
	fromVersion: string = '1.0.0',
	toVersion: string = '1.1.0'
): { changes: SchemaChange[]; migrations: Migration[]; report: string } {
	const manager = new SchemaMigrationManager();
	const changes = manager.compareSchemas(resource, fromSchema, toSchema, fromVersion, toVersion);
	const migrations = changes.filter(c => c.migration).map(c => c.migration!);
	const report = manager.generateBreakingChangesReport(changes);
	
	return { changes, migrations, report };
}

// Export the migration manager
export default SchemaMigrationManager;