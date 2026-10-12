export const LOCAL_REQUEST_TIMEOUT_MS = 12000;
/** A request deadline, not an automatic retry or successful-outcome assumption. */
export function localRequestSignal(caller, milliseconds = LOCAL_REQUEST_TIMEOUT_MS) {
  const deadline = AbortSignal.timeout(
    Math.min(LOCAL_REQUEST_TIMEOUT_MS, Math.max(1, milliseconds)),
  );
  return caller ? AbortSignal.any([caller, deadline]) : deadline;
}
export function localTimeoutError(signal) {
  return signal.aborted && signal.reason?.name === "TimeoutError"
    ? Object.assign(
        new Error(
          "Request timed out; read back or confirm the original key / 請求逾時，請重讀或確認原key",
        ),
        { code: "request-timeout" },
      )
    : null;
}
