import { Role } from "./src/access";
import { StatementsPrimitive as Statements } from "./src/types";

export const permissionFromString = (permission?: string) => {
	return Role.fromString<Statements>(permission ?? "");
};
