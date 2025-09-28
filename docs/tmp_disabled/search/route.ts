import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

// Remove force-static for search API since it needs request.url
// export const dynamic = 'force-static';
export const revalidate = false;

export const { GET } = createFromSource(source);
