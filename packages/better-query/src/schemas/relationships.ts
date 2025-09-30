import { z } from "zod";
import { RelationshipConfig } from "../types";

/**
 * Helper functions for creating common relationship configurations
 * Users can use these to define relationships for their custom schemas
 */

/**
 * Create a belongsTo relationship configuration
 */
export function belongsTo(
	target: string,
	foreignKey: string,
	targetKey = "id",
): RelationshipConfig {
	return {
		type: "belongsTo",
		target,
		foreignKey,
		targetKey,
	};
}

/**
 * Create a hasMany relationship configuration
 */
export function hasMany(
	target: string,
	foreignKey: string,
	targetKey = "id",
): RelationshipConfig {
	return {
		type: "hasMany",
		target,
		foreignKey,
		targetKey,
	};
}

/**
 * Create a belongsToMany relationship configuration
 */
export function belongsToMany(
	target: string,
	through: string,
	sourceKey: string,
	targetForeignKey: string,
): RelationshipConfig {
	return {
		type: "belongsToMany",
		target,
		through,
		sourceKey,
		targetForeignKey,
	};
}
