import { Session, User } from "better-auth";
import { IUser } from "../index";

declare module "better-auth" {
	interface User extends IUser {}
}
