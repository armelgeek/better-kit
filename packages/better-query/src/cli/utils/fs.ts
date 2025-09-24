import fs from "fs/promises";

export async function fileExists(path: string): Promise<boolean> {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
}

export async function ensureDir(dirPath: string): Promise<void> {
	try {
		await fs.mkdir(dirPath, { recursive: true });
	} catch {
		// Directory already exists or other error, ignore
	}
}

export async function copyFile(src: string, dest: string): Promise<void> {
	const content = await fs.readFile(src, "utf8");
	await fs.writeFile(dest, content, "utf8");
}

export async function writeFile(path: string, content: string): Promise<void> {
	await fs.writeFile(path, content, "utf8");
}