export interface ITiming {
	now(): number
	setTimeout(handler: () => void, timeout: number): number
	clearTimeout(handle: number)
}

export const timingDefault: ITiming = {
	now: Date.now,
	setTimeout,
	clearTimeout,
}