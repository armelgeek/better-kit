// Adapter générique (mock en mémoire pour l'exemple)
export class DBAdapter<T extends { id: string }> {
	private data: T[] = [];

	constructor(private table: string) {}

	async create(item: T): Promise<T> {
		this.data.push(item);
		return item;
	}

	async findById(id: string): Promise<T | undefined> {
		return this.data.find((item) => item.id === id);
	}

	async update(id: string, update: Partial<T>): Promise<T | undefined> {
		const idx = this.data.findIndex((item) => item.id === id);
		if (idx === -1) return undefined;
		this.data[idx] = { ...this.data[idx], ...update };
		return this.data[idx];
	}

	async delete(id: string): Promise<boolean> {
		const idx = this.data.findIndex((item) => item.id === id);
		if (idx === -1) return false;
		this.data.splice(idx, 1);
		return true;
	}

	async findMany(): Promise<T[]> {
		return this.data;
	}
}
