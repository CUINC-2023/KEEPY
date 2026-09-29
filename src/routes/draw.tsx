import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy entry shares the same fixed Demo draw and 10+1 result flow. */
export const Route = createFileRoute("/draw")({
  beforeLoad: () => { throw redirect({ to: "/app/draw/$poolId", params: { poolId: "p-uniform" } }); },
  head: () => ({ meta: [
    { title: "抽卡 — KEEPY（Demo）" },
    { name: "description", content: "KEEPY 本機固定抽卡示意；不執行真實抽卡或扣點。" },
    { property: "og:title", content: "抽卡 — KEEPY（Demo）" },
    { property: "og:description", content: "本機抽卡示意，十抽送一抽與保底規則皆非正式核定。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});