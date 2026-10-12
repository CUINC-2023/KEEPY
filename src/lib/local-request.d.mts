export const LOCAL_REQUEST_TIMEOUT_MS: number;
export function localRequestSignal(caller?: AbortSignal, milliseconds?: number): AbortSignal;
export function localTimeoutError(signal: AbortSignal): (Error & { code: string }) | null;
