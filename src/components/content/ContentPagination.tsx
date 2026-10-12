import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
export function ContentPagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  const t = useDiscoveryText();
  if (pages < 2) return null;
  return (
    <nav
      aria-label={t("清單分頁", "List pagination")}
      className="flex flex-wrap items-center gap-3"
    >
      <Button
        className="min-h-11"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        {t("上一頁", "Previous page")}
      </Button>
      <span role="status" aria-atomic="true" className="text-sm tabular-nums">
        {t("頁", "Page")} {page} / {pages}
      </span>
      <Button
        className="min-h-11"
        variant="outline"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        {t("下一頁", "Next page")}
      </Button>
    </nav>
  );
}
