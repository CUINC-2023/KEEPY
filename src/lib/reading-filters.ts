import { useCallback, useEffect, useState } from "react";
import { useLocalTest } from "./local-test-client";
export function useReadingFilters() {
  const actor = useLocalTest().summary?.user.id;
  const [view, setView] = useState({ actor: "", group: "all", status: "all" });
  useEffect(() => {
    if (!actor) {
      setView({ actor: "", group: "all", status: "all" });
      return;
    }
    let next = { group: "all", status: "all" };
    try {
      const raw = JSON.parse(sessionStorage.getItem("keepy-reading-view-v1:" + actor) ?? "null");
      if (
        raw &&
        typeof raw.group === "string" &&
        raw.group.length < 100 &&
        ["all", "read", "unread"].includes(raw.status)
      )
        next = { group: raw.group, status: raw.status };
    } catch {
      /* Browser preferences are optional; private server data is unchanged. */
    }
    setView({ actor, ...next });
  }, [actor]);
  const current = view.actor === actor ? view : { actor: actor ?? "", group: "all", status: "all" };
  const change = useCallback(
    (group: string, status: string) => {
      if (!actor) return;
      setView({ actor, group, status });
      try {
        sessionStorage.setItem("keepy-reading-view-v1:" + actor, JSON.stringify({ group, status }));
      } catch {
        /* Browser preferences are optional; private server data is unchanged. */
      }
    },
    [actor],
  );
  return { ...current, change };
}
