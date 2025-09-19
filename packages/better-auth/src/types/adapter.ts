import { Session } from "../adapters/schema";
import { FieldAttribute } from "../db";

/**
 * Adapter where clause
 */
export type Where = {
	operator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte"; //eq by default
	value: string;
	field: string;
	connector?: "AND" | "OR"; //AND by default
};

/**
 * Adapter Interface
 */
export interface Adapter {
	create: <T, R = T>(data: {
		model: string;
		data: T;
		select?: string[];
	}) => Promise<R>;
	findOne: <T>(data: {
		model: string;
		where: Where[];
		select?: string[];
	}) => Promise<T | null>;
	findMany: <T>(data: {
		model: string;
		where?: Where[];
	}) => Promise<T[]>;
	update: <T>(data: {
		model: string;
		where: Where[];
		update: Record<string, any>;
	}) => Promise<T>;
	delete: <T>(data: { model: string; where: Where[] }) => Promise<void>;
	/**
	 * adapter specific configuration
	 */
	config?: {
		/**
		 * the format of the date fields
		 */
		dateFormat?: "number" | "date";
		/**
		 * if the adapter will throw an error when a
		 * record already exists. If this is set to
		 * false, there will be a check if the record
		 * exists or not before creating a new one.
		 */
		failsOnRecordExist?: boolean;
	};
	createSchema?: (
		data: {
			model: string;
			fields: Record<string, FieldAttribute>;
		}[],
	) => Promise<void>;
}

export interface SessionAdapter {
	create: (data: {
		userId: string;
		expiresAt: Date;
	}) => Promise<Session>;
	findOne: (data: { userId: string }) => Promise<Session | null>;
	update: (data: Session) => Promise<Session>;
	delete: (data: { sessionId: string }) => Promise<void>;
}
