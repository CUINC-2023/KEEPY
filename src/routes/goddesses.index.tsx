import { useDiscoveryText } from "@/lib/discovery-copy";
import { useDiscovery } from "@/lib/content-store";
import {
  DiscoveryEntry,
  DiscoveryStatus,
  DiscoveryNotice,
} from "@/components/content/DiscoveryContent";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/goddesses/")({
  head: () => ({
    meta: [
      { title: "女神列表 — KEEPY" },
      { name: "description", content: "本機測試：所有創作者介紹皆為示意，不代表真實合作。" },
      { property: "og:title", content: "女神列表 — KEEPY" },
      { property: "og:description", content: "本機測試：所有創作者介紹皆為示意，不代表真實合作。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GoddessesPage,
});

function GoddessesPage() {
  const data = useDiscovery(),
    t = useDiscoveryText();
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <h1 className="text-3xl font-black">{t("發現創作者", "Discover creators")}</h1>
      <DiscoveryNotice />
      <DiscoveryStatus />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items
          .filter((i) => i.kind === "creator")
          .map((i) => (
            <DiscoveryEntry key={i.id} item={i} />
          ))}
      </div>
    </div>
  );
}
