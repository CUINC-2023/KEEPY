import { usePlayerUiText } from "@/lib/player-ui-text";
import { useDemoPlayer } from "@/lib/demo-player-store";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { GRADES, POOL_KIND_LABEL, type Pool } from "@/data/mock";
import { poolAlbumProgress } from "@/data/player";
import { AlbumTile } from "@/components/album/AlbumTile";
import { PoolCover, PoolStatusTag } from "@/components/ui/pool-cover";
import { Progress } from "@/components/ui/progress";
import { RarityBadge } from "@/components/ui/rarity-badge";
import { StatusTag } from "@/components/ui/status-tag";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCardGrid } from "@/components/ui/skeleton-block";
import { KEEPY_SAMPLE_POOL_ID, KEEPY_SAMPLE_NOTE } from "@/data/keepy-sample";

type Own = "all" | "owned" | "missing";
type Flag = "all" | "upgradable" | "dupes" | "new";

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const tx = usePlayerUiText();
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[11px] text-muted-foreground">
      {tx(label)}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {tx(o.label)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** 卡冊共用詳情範本（含未上架卡面示例）。 */
export function AlbumDetailTemplate({ pool, loading }: { pool: Pool; loading: boolean }) {
  const tx = usePlayerUiText();
  const { album, progress: sharedProgress } = useDemoPlayer();
  const cards = album.filter((c) => c.poolId === pool.id);
  const progress =
    sharedProgress.find((p) => p.poolId === pool.id) ?? poolAlbumProgress(pool.id, []);
  const [goddess, setGoddess] = useState("all");
  const [grade, setGrade] = useState("all");
  const [own, setOwn] = useState<Own>("all");
  const [flag, setFlag] = useState<Flag>("all");

  const list = cards.filter((c) => {
    if (goddess !== "all" && c.goddessId !== goddess) return false;
    if (grade !== "all" && c.grade !== grade) return false;
    if (own === "owned" && !c.owned) return false;
    if (own === "missing" && c.owned) return false;
    if (flag === "upgradable" && !(c.owned && c.growthPct >= 100)) return false;
    if (flag === "dupes" && !(c.owned && c.dupes > 0)) return false;
    if (flag === "new" && !c.isNew) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="panel overflow-hidden p-3">
        <PoolCover pool={pool} />
        <div className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black sm:text-2xl">
              {pool.name}
              {tx("卡冊")}
            </h1>
            {pool.id === KEEPY_SAMPLE_POOL_ID ? (
              <StatusTag tone="gold" label={tx("範例／非正式上架")} />
            ) : (
              <PoolStatusTag status={pool.status} />
            )}
            <StatusTag tone="info" label={tx(POOL_KIND_LABEL[pool.kind])} />
            <span className="demo-chip">{tx("Mock 進度")}</span>
            {pool.id === KEEPY_SAMPLE_POOL_ID && (
              <span className="text-xs font-bold text-gold">{tx("範例／非正式上架")}</span>
            )}
          </div>
          <p className="mt-3 text-3xl font-black text-gold-gradient tabular-nums">
            {pool.id === KEEPY_SAMPLE_POOL_ID
              ? tx("3 張卡面範例（未上架）")
              : `${progress.owned} / ${progress.total}`}
          </p>
          {pool.id !== KEEPY_SAMPLE_POOL_ID && (
            <Progress
              value={progress.owned}
              max={Math.max(1, progress.total)}
              className="mt-2"
              showLabel
              label={tx(`完成率 ${progress.pct}%`)}
              tone="gold"
            />
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Meta label={tx("最高已取得等級")} value={progress.topGrade ?? "—"} />
            <Meta label={tx("新卡")} value={tx(`${progress.newCount} 張`)} />
            {pool.id !== KEEPY_SAMPLE_POOL_ID && (
              <Meta label={tx("可升級")} value={tx(`${progress.upgradableCount} 張`)} />
            )}
            <Meta label={tx("最後取得")} value={progress.lastObtainedAt ?? "—"} />
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              to="/app/album"
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              {tx("← 卡冊總覽")}
            </Link>
            <Link
              to="/pools/$poolId"
              params={{ poolId: pool.id }}
              className="text-xs font-bold text-primary hover:underline"
            >
              {tx("卡池詳情 →")}
            </Link>
            {pool.status === "live" && (
              <Link
                to="/app/draw/$poolId"
                params={{ poolId: pool.id }}
                className="text-xs font-bold text-gold hover:underline"
              >
                {tx("前往抽卡（Demo）→")}
              </Link>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {pool.id === KEEPY_SAMPLE_POOL_ID
              ? KEEPY_SAMPLE_NOTE
              : tx(
                  "成長規則：同女神、同等級、同一卡牌每張重複卡增加 10% 成長值，累積 10 張／100% 可直接升一級。",
                )}
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="panel p-4 sm:p-5">
          <p className="text-sm font-black">{tx("各等級完成度")}</p>
          <div className="mt-3 space-y-2">
            {progress.byGrade.map((g) => (
              <div key={g.grade} className="flex items-center gap-3">
                <div className="w-12 shrink-0">
                  <RarityBadge rarity={g.grade} />
                </div>
                <Progress
                  value={g.owned}
                  max={g.total}
                  className="flex-1"
                  tone={g.owned === g.total ? "gold" : "violet"}
                />
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {g.owned}/{g.total}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-4 sm:p-5">
          <p className="text-sm font-black">
            {pool.id === KEEPY_SAMPLE_POOL_ID ? tx("虛構卡面示例完成度") : tx("女神完成度")}
          </p>
          <div className="mt-3 space-y-2">
            {progress.byGoddess.map((g) => (
              <div key={g.goddessId} className="flex items-center gap-3">
                <span className="w-16 shrink-0 truncate text-xs font-bold">{g.name}</span>
                <Progress
                  value={g.owned}
                  max={g.total}
                  className="flex-1"
                  tone={g.owned === g.total ? "gold" : "violet"}
                />
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {g.owned}/{g.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
        <Select
          label={tx("女神")}
          value={goddess}
          onChange={setGoddess}
          options={[
            { value: "all", label: tx("全部女神") },
            ...progress.byGoddess.map((g) => ({ value: g.goddessId, label: g.name })),
          ]}
        />
        <Select
          label={tx("等級")}
          value={grade}
          onChange={setGrade}
          options={[
            { value: "all", label: tx("全部等級") },
            ...GRADES.map((g) => ({ value: g, label: g })),
          ]}
        />
        <Select
          label={tx("取得狀態")}
          value={own}
          onChange={(v) => setOwn(v as Own)}
          options={[
            { value: "all", label: tx("全部") },
            { value: "owned", label: tx("已取得") },
            { value: "missing", label: tx("未取得") },
          ]}
        />
        <Select
          label={tx("特殊條件")}
          value={flag}
          onChange={(v) => setFlag(v as Flag)}
          options={[
            { value: "all", label: tx("不限") },
            { value: "new", label: tx("新卡") },
            { value: "upgradable", label: tx("可升級") },
            { value: "dupes", label: tx("有重複卡") },
          ]}
        />
      </div>

      {loading ? (
        <SkeletonCardGrid count={10} />
      ) : list.length === 0 ? (
        <EmptyState title={tx("沒有符合條件的卡牌")} description={tx("試著放寬篩選條件。")} />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {tx("共")}
            {list.length}
            {tx("張卡牌")}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {list.map((c) => (
              <AlbumTile key={c.id} card={c} poolStatus={pool.status} poolName={pool.name} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const tx = usePlayerUiText();
  return (
    <div className="rounded-xl bg-muted/40 p-2.5">
      <p className="text-[11px] text-muted-foreground">{tx(label)}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
