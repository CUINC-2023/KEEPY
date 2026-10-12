import { useEffect } from "react";
export function usePlayRoundLifecycle(actor: string, mode: string, active: boolean) {
  useEffect(() => {
    const send = (value: boolean) =>
      window.dispatchEvent(
        new CustomEvent("keepy-play-round-state", { detail: { actor, mode, active: value } }),
      );
    send(active);
    return () => {
      send(false);
    };
  }, [actor, mode, active]);
}
