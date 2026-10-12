import { DiscoveryCreator } from "@/components/content/DiscoveryContent";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { GODDESSES } from "@/data/mock";
import { EmptyState } from "@/components/ui/empty-state";

import { normalizeExploreSearch } from "@/lib/explore-search.mjs";
export const Route = createFileRoute("/goddesses/$goddessId")({
  validateSearch: normalizeExploreSearch,
  loader: ({ params }) => {
    const g = GODDESSES.find((x) => x.id === params.goddessId);
    if (!g) throw notFound();
    return { name: g.name, title: g.title, intro: g.intro };
  },
  head: () => ({
    meta: [
      { title: "KEEPY · Sample creator · Local Test" },
      {
        name: "description",
        content: "Fictional creator profile for local testing; not a real collaboration.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: () => (
    <EmptyState
      icon="✦"
      title="找不到這位女神"
      description="檔案可能已下架或連結有誤。"
      action={
        <Link
          to="/goddesses"
          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
        >
          回到女神列表
        </Link>
      }
    />
  ),
  component: GoddessPublicPage,
});

function GoddessPublicPage() {
  const { goddessId } = Route.useParams();
  return <DiscoveryCreator creatorId={goddessId} />;
}
