import { usePlayerUiText } from "@/lib/player-ui-text";
import { DemoState } from "./state-demo-shared";

import { SkeletonBlock } from "@/components/ui/skeleton-block";
import { EmptyState } from "@/components/ui/empty-state";

const OPTIONS: { key: DemoState; label: string }[] = [
  { key: "ok", label: "正常" },
  { key: "loading", label: "載入中" },
  { key: "empty", label: "無資料" },
  { key: "error", label: "錯誤" },
  { key: "denied", label: "無權限" },
];

export function StateSwitcher({
  state,
  onChange,
}: {
  state: DemoState;
  onChange: (s: DemoState) => void;
}) {
  const tx = usePlayerUiText();
  return (
    <div className="panel flex flex-wrap items-center gap-2 px-3 py-2.5">
      <span className="demo-chip">Demo</span>
      <span className="text-[11px] text-muted-foreground">{tx("示範狀態")}</span>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              state === o.key
                ? "border-primary/50 bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {tx(o.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 非正常狀態的畫面；state === "ok" 時回傳 null */
export function StatePlaceholder({
  state,
  emptyTitle = "目前沒有資料",
  emptyDescription = "調整篩選條件或稍後再回來看看。",
}: {
  state: DemoState;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const tx = usePlayerUiText();
  if (state === "ok") return null;
  if (state === "loading") {
    return (
      <div className="space-y-3">
        <SkeletonBlock className="h-24" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="aspect-2/3" />
          ))}
        </div>
      </div>
    );
  }
  if (state === "empty") {
    return <EmptyState title={tx(emptyTitle)} description={tx(emptyDescription)} icon="◇" />;
  }
  if (state === "error") {
    return (
      <EmptyState
        icon="！"
        title={tx("資料載入失敗（Demo）")}
        description={tx("這是錯誤狀態示範畫面。原型不會真的重新請求資料。")}
        action={
          <span className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">
            {tx("重新載入（Demo）")}
          </span>
        }
      />
    );
  }
  return (
    <EmptyState
      icon="⌁"
      title={tx("無權限查看（Demo）")}
      description={tx("此區塊需要登入或對應身分權限，此處僅示範無權限狀態。")}
    />
  );
}
