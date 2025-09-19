import { auth } from "@/lib/crud-auth";
import { NextRequest } from "next/server";

const handler = auth.handler;

export const POST = async (req: NextRequest) => {
	return handler(req);
};

export const PATCH = async (req: NextRequest) => {
	return handler(req);
};

export const DELETE = async (req: NextRequest) => {
	return handler(req);
};

export { handler as GET };

