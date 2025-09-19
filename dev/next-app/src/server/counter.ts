// Minimal mock for counter functionality
let counter = { count: 0 };

export async function getCounter() {
	return counter;
}

export async function setCounter(input: { value: number }) {
	counter.count = input.value;
	return { success: true, value: input.value };
}
