type Connector = "OR" | "AND";
import type { StatementsPrimitive as Statements, Subset } from "./types";

export class ParsingError extends Error {
	public readonly path: string;
	constructor(message: string, path: string) {
		super(message);
		this.path = path;
	}
}

type ActionsArray = readonly string[];

export class AccessControl<
	TStatements extends Record<string, readonly string[]>,
> {
	private readonly statements: TStatements;
	constructor(private readonly s: TStatements) {
		this.statements = s;
	}
	public newRole<K extends keyof TStatements>(
		statements: Subset<K, TStatements>,
	) {
		return new Role<Subset<K, TStatements>>(statements);
	}
}

export type AuthortizeResponse =
	| { success: false; error: string }
	| { success: true; error?: never };

export class Role<TStatements extends Statements> {
	public readonly statements: TStatements;

	constructor(statements: TStatements) {
		this.statements = statements;
	}

	public authorize<K extends keyof TStatements>(
		request: Subset<K, TStatements>,
		connector?: Connector,
	): AuthortizeResponse {
		for (const [requestedResource, requestedActions] of Object.entries(
			request,
		)) {
			const allowedActions = this.statements[requestedResource];
			if (!allowedActions) {
				return {
					success: false,
					error: `You are not allowed to access resource: ${requestedResource}`,
				};
			}
			const success =
				connector === "OR"
					? (requestedActions as ActionsArray).some((requestedAction) =>
							allowedActions.includes(requestedAction),
						)
					: (requestedActions as ActionsArray).every((requestedAction) =>
							allowedActions.includes(requestedAction),
						);
			if (success) {
				return { success };
			}
			return {
				success: false,
				error: `unauthorized to access resource \"${requestedResource}\"`,
			};
		}
		return {
			success: false,
			error: "Not authorized",
		};
	}

	static fromString<TStatements extends Statements>(s: string) {
		const statements = JSON.parse(s) as TStatements;

		if (typeof statements !== "object") {
			throw new ParsingError("statements is not an object", ".");
		}
		for (const [resource, actions] of Object.entries(statements)) {
			if (typeof resource !== "string") {
				throw new ParsingError("invalid resource identifier", resource);
			}
			if (!Array.isArray(actions)) {
				throw new ParsingError("actions is not an array", resource);
			}
			for (let i = 0; i < actions.length; i++) {
				if (typeof actions[i] !== "string") {
					throw new ParsingError("action is not a string", `${resource}[${i}]`);
				}
			}
		}
		return new Role<TStatements>(statements);
	}

	public toString(): string {
		return JSON.stringify(this.statements);
	}
}
