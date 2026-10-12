import { useEffect, useRef } from "react";
// Viewport restoration only; never a source of content or private data.
export function usePublicReturnPosition(
  focus: string | undefined,
  ready: boolean,
  context: string,
) {
  const restored = useRef("");
  useEffect(() => {
    if (!focus) {
      restored.current = "";
      return;
    }
    if (!ready || restored.current === context) return;
    const entry = [...document.querySelectorAll<HTMLElement>("[data-content-id]")].find(
      (el) => el.dataset["contentId"] === focus,
    );
    if (entry) {
      entry.focus({ preventScroll: true });
      entry.scrollIntoView({ block: "center" });
      restored.current = context;
    }
  }, [focus, ready, context]);
}
