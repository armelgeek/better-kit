import { CrudContext, IncludeOptions, RelationshipConfig } from "../types";

/**
 * Utility class for managing relationships
 */
export class RelationshipManager {
	constructor(private context: CrudContext) {}

	/**
	 * Get relationship context (public accessor)
	 */
	get relationshipContext(): CrudContext {
		return this.context;
	}

	/**
	 * Register relationships from resource configurations
	 */
	registerRelationships(
		resourceName: string,
		relationships: Record<string, RelationshipConfig>,
	) {
		this.context.relationships.set(resourceName, relationships);
	}

	/**
	 * Get relationships for a resource
	 */
	getRelationships(resourceName: string): Record<string, RelationshipConfig> {
		return this.context.relationships.get(resourceName) || {};
	}

	/**
	 * Resolve includes for a query
	 */
	resolveIncludes(
		resourceName: string,
		include?: IncludeOptions,
	): ResolvedInclude[] {
		if (!include) return [];

		const relationships = this.getRelationships(resourceName);
		const resolved: ResolvedInclude[] = [];

		// Handle simple include array
		if (include.include) {
			for (const relationName of include.include) {
				const relation = relationships[relationName];
				if (relation) {
					resolved.push({
						relationName,
						relation,
						nested: [],
						maxDepth: include.maxDepth || relation.maxDepth || 3,
					});
				}
			}
		}

		// Handle advanced select object
		if (include.select) {
			for (const [relationName, selectOptions] of Object.entries(
				include.select,
			)) {
				const relation = relationships[relationName];
				if (relation) {
					let nested: ResolvedInclude[] = [];

					if (
						selectOptions !== true &&
						selectOptions !== false &&
						typeof selectOptions === "object" &&
						selectOptions !== null
					) {
						nested = this.resolveIncludes(
							relation.target,
							selectOptions as IncludeOptions,
						);
					}

					resolved.push({
						relationName,
						relation,
						nested,
						maxDepth: include.maxDepth || relation.maxDepth || 3,
					});
				}
			}
		}

		return resolved;
	}

	/**
	 * Validate relationship configuration
	 */
	validateRelationship(
		resourceName: string,
		relationName: string,
		config: RelationshipConfig,
	): string[] {
		const errors: string[] = [];

		// Check if target resource exists
		if (!this.context.schemas.has(config.target)) {
			errors.push(
				`Target resource '${config.target}' does not exist for relationship '${relationName}'`,
			);
		}

		// Validate foreign key references
		const sourceSchema = this.context.schemas.get(resourceName);
		const targetSchema = this.context.schemas.get(config.target);

		if (sourceSchema && targetSchema) {
			switch (config.type) {
				case "belongsTo":
					if (config.foreignKey && !sourceSchema.fields[config.foreignKey]) {
						errors.push(
							`Foreign key '${config.foreignKey}' not found in source model '${resourceName}'`,
						);
					}
					break;
				case "hasOne":
				case "hasMany":
					if (config.targetKey && !targetSchema.fields[config.targetKey]) {
						errors.push(
							`Target key '${config.targetKey}' not found in target model '${config.target}'`,
						);
					}
					break;
				case "belongsToMany":
					if (!config.through) {
						errors.push(
							`Junction table 'through' is required for many-to-many relationship '${relationName}'`,
						);
					}
					// We should validate junction table exists, but for now we'll skip this
					break;
			}
		}

		return errors;
	}

	/**
	 * Generate SQL joins for includes
	 */
	generateJoins(
		resourceName: string,
		includes: ResolvedInclude[],
		tableAlias = "main",
	): JoinClause[] {
		const joins: JoinClause[] = [];

		for (const include of includes) {
			const { relationName, relation } = include;
			const joinAlias = `${tableAlias}_${relationName}`;

			switch (relation.type) {
				case "belongsTo":
					joins.push({
						type: "LEFT JOIN",
						table: relation.target,
						alias: joinAlias,
						condition: `${tableAlias}.${
							relation.foreignKey || `${relation.target}Id`
						} = ${joinAlias}.${relation.targetKey || "id"}`,
					});
					break;
				case "hasOne":
				case "hasMany":
					joins.push({
						type: "LEFT JOIN",
						table: relation.target,
						alias: joinAlias,
						condition: `${tableAlias}.${
							relation.targetKey || "id"
						} = ${joinAlias}.${relation.foreignKey || `${resourceName}Id`}`,
					});
					break;
				case "belongsToMany":
					if (relation.through) {
						const throughAlias = `${tableAlias}_${relationName}_junction`;
						joins.push({
							type: "LEFT JOIN",
							table: relation.through,
							alias: throughAlias,
							condition: `${tableAlias}.${
								relation.targetKey || "id"
							} = ${throughAlias}.${relation.sourceKey || `${resourceName}Id`}`,
						});
						joins.push({
							type: "LEFT JOIN",
							table: relation.target,
							alias: joinAlias,
							condition: `${throughAlias}.${
								relation.targetForeignKey || `${relation.target}Id`
							} = ${joinAlias}.id`,
						});
					}
					break;
			}

			// Add nested joins if any
			if (include.nested.length > 0) {
				const nestedJoins = this.generateJoins(
					relation.target,
					include.nested,
					joinAlias,
				);
				joins.push(...nestedJoins);
			}
		}

		return joins;
	}

	/**
	 * Transform flat result with joins into nested structure
	 */
	transformJoinedResults(
		results: any[],
		includes: ResolvedInclude[],
		resourceName: string,
	): any[] {
		if (!includes.length) return results;

		const groupedResults = new Map<string, any>();

		for (const row of results) {
			const mainId = row.id;

			if (!groupedResults.has(mainId)) {
				// Initialize main object
				const mainObj = this.extractMainFields(row, resourceName);
				groupedResults.set(mainId, mainObj);
			}

			const mainObj = groupedResults.get(mainId);

			// Process relationships
			for (const include of includes) {
				this.attachRelatedData(mainObj, row, include, "main");
			}
		}

		return Array.from(groupedResults.values());
	}

	private extractMainFields(row: any, resourceName: string): any {
		const schema = this.context.schemas.get(resourceName);
		if (!schema) return row;

		const mainObj: any = {};
		for (const fieldName of Object.keys(schema.fields)) {
			if (row[fieldName] !== undefined) {
				mainObj[fieldName] = row[fieldName];
			}
		}
		return mainObj;
	}

	private attachRelatedData(
		mainObj: any,
		row: any,
		include: ResolvedInclude,
		tablePrefix: string,
	): void {
		const { relationName, relation } = include;
		const relationPrefix = `${tablePrefix}_${relationName}`;

		// Extract related fields
		const relatedData = this.extractRelatedFields(
			row,
			relation.target,
			relationPrefix,
		);

		if (relatedData && Object.keys(relatedData).length > 0) {
			if (relation.type === "hasMany" || relation.type === "belongsToMany") {
				if (!mainObj[relationName]) {
					mainObj[relationName] = [];
				}

				// Check if this related record already exists
				const existingIndex = mainObj[relationName].findIndex(
					(item: any) => item.id === relatedData.id,
				);
				if (existingIndex === -1) {
					mainObj[relationName].push(relatedData);
				}
			} else {
				mainObj[relationName] = relatedData;
			}
		}
	}

	private extractRelatedFields(
		row: any,
		targetModel: string,
		prefix: string,
	): any | null {
		const schema = this.context.schemas.get(targetModel);
		if (!schema) return null;

		const relatedObj: any = {};
		let hasData = false;

		for (const fieldName of Object.keys(schema.fields)) {
			const key = `${prefix}_${fieldName}`;
			if (row[key] !== undefined && row[key] !== null) {
				relatedObj[fieldName] = row[key];
				hasData = true;
			}
		}

		return hasData ? relatedObj : null;
	}

	/**
	 * Get all junction tables that need to be created for many-to-many relationships
	 */
	getRequiredJunctionTables(): Array<{
		tableName: string;
		sourceKey: string;
		targetKey: string;
		sourceTable: string;
		targetTable: string;
	}> {
		const junctionTables: Array<{
			tableName: string;
			sourceKey: string;
			targetKey: string;
			sourceTable: string;
			targetTable: string;
		}> = [];
		const processedTables = new Set<string>();

		for (const [
			resourceName,
			relationships,
		] of this.context.relationships.entries()) {
			for (const [relationName, config] of Object.entries(relationships)) {
				if (
					config.type === "belongsToMany" &&
					config.through &&
					config.sourceKey &&
					config.targetForeignKey
				) {
					// Avoid duplicate junction tables (same table from different sides of relationship)
					if (!processedTables.has(config.through)) {
						junctionTables.push({
							tableName: config.through,
							sourceKey: config.sourceKey,
							targetKey: config.targetForeignKey,
							sourceTable: resourceName,
							targetTable: config.target,
						});
						processedTables.add(config.through);
					}
				}
			}
		}

		return junctionTables;
	}
}

export interface ResolvedInclude {
	relationName: string;
	relation: RelationshipConfig;
	nested: ResolvedInclude[];
	maxDepth: number;
}

export interface JoinClause {
	type: "LEFT JOIN" | "INNER JOIN" | "RIGHT JOIN";
	table: string;
	alias: string;
	condition: string;
}
