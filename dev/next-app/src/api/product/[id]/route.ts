import { DBAdapter } from "@/db/adapter";
import { Product, productSchema } from "@/models/product";
import { NextRequest, NextResponse } from "next/server";

const db = new DBAdapter<Product>("product");

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } },
) {
	const product = await db.findById(params.id);
	if (!product)
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	return NextResponse.json(product);
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: { id: string } },
) {
	const body = await req.json();
	const update = productSchema.partial().parse(body);
	const updated = await db.update(params.id, update);
	if (!updated)
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	return NextResponse.json(updated);
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } },
) {
	const ok = await db.delete(params.id);
	if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
	return NextResponse.json({ success: true });
}
