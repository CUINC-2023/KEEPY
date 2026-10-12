import { useState } from "react";

export type DemoState = "ok" | "loading" | "empty" | "error" | "denied";

export function useDemoState() {
  return useState<DemoState>("ok");
}
