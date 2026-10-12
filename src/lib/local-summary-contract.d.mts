export function isLocalSummary(value: unknown): boolean;
export function unreadableLocalResponse(status: number): Error & { status?: number };
export function isDefiniteLocalRejection(error: unknown): boolean;
