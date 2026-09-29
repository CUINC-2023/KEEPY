import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeMark } from "@/components/player/BadgeMark";
import { Progress } from "@/components/ui/progress";
import { TextStatus } from "@/components/public/PublicPage";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";
import { useToast } from "@/components/ui/toast";
import {
  DEFAULT_SHOWCASE_IDS,
  SHOWCASE_MAX,
  readShowcaseIds,
  writeShowcaseIds,
} from "@/data/showcase-badges";
import { TOP100_STATUS, TOP100_TARGET } from "@/data/leaderboard";
import { ACHIEVEMENTS, COMPLETED_ACHIEVEMENTS, TOTAL_ACHIEVEMENT_POINTS, type Achievement } from "@/data/player-profile";

export const Route = createFileRoute("/app/achievements")({
  head: () => ({
    meta: [
      { title: "成就與徽章 — CU 女神卡" },
      { name: "description", content: "玩家成就與徽章總覽，可篩選分類／狀態並設定展示徽章（Local Mock）。" },
      { property: "og:title", content: "成就與徽章 — CU 女神卡" },
      { property: "og:description", content: "玩家成就與徽章總覽，可篩選分類／狀態並設定展示徽章（Local Mock）。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AchievementsPage,
});

/** 成就列：直接引用共用成就資料來源；排行成就附加與排行榜同源的名次說明。 */
type Row = Achievement & { rankNote?: string };

const ROWS: Row[] = ACHIEVEMENTS.map((a) =>
  a.id === "a-pool-top100"
    ? {
        ...a,
        rankNote: TOP100_STATUS.best
          ? `目前${TOP100_STATUS.best.poolName}第 ${TOP100_STATUS.best.rank} 名／目標前 ${TOP100_TARGET} 名（與排行榜同一份 Demo 名單；不受顯示排名開關影響）`
          : `尚未列入任何卡池榜／目標前 ${TOP100_TARGET} 名`,
      }
    : a,
);

const CATEGORY_TABS = ["全部", "收藏進度", "卡池完成", "指定卡牌", "卡牌成長", "創作者收藏", "季度限定", "排行榜", "實體典藏", "隱藏"];
const STATE_TABS = ["全部", "已完成", "進行中", "未解鎖", "隱藏"] as const;
type StateTab = (typeof STATE_TABS)[number];

const TOTAL_POINTS = TOTAL_ACHIEVEMENT_POINTS;
const COMPLETED_COUNT = COMPLETED_ACHIEVEMENTS.length;
const TOTAL_COUNT = ROWS.length;

/** 只有「已完成且具有徽章」的成就可設定展示。 */
const ELIGIBLE = ROWS.filter((r) => r.state === "已完成" && r.badge && !r.hidden);
const DEFAULT_SHOWCASE = [...DEFAULT_SHOWCASE_IDS];

/** 與公開收藏頁共用的讀取：key 不存在／格式錯誤才回預設；有效空陣列維持空。 */
function loadShowcase(): string[] {
  return readShowcaseIds();
}

function StateTag({ row }: { row: Row }) {
  if (row.state === "已完成") return <TextStatus tone="gold">已完成</TextStatus>;
  if (row.state === "進行中") return <TextStatus tone="live">進行中</TextStatus>;
  if (row.hidden) return <TextStatus>隱藏・未解鎖</TextStatus>;
  return <TextStatus>未解鎖</TextStatus>;
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
        active
          ? "border-primary/60 bg-primary/15 text-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {active ? <span aria-hidden="true">✓ </span> : null}
      {label}
    </button>
  );
}

function AchievementsPage() {
  const [state, setState] = useDemoState();
  const { push } = useToast();

  const [category, setCategory] = useState("全部");
  const [stateTab, setStateTab] = useState<StateTab>("全部");

  const [showcase, setShowcase] = useState<string[]>(DEFAULT_SHOWCASE);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setShowcase(loadShowcase());
  }, []);

  const persist = (ids: string[]) => {
    setShowcase(ids);
    writeShowcaseIds(ids);
  };

  const rows = useMemo(
    () =>
      ROWS.filter((r) => {
        const catOk = category === "全部" || (category === "隱藏" ? !!r.hidden : r.category === category);
        const stOk =
          stateTab === "全部" ||
          (stateTab === "隱藏" ? !!r.hidden : r.state === stateTab && !r.hidden);
        return catOk && stOk;
      }),
    [category, stateTab],
  );

  const filtered = category !== "全部" || stateTab !== "全部";
  const clearFilters = () => {
    setCategory("全部");
    setStateTab("全部");
  };

  const toggleBadge = (row: Row) => {
    const on = showcase.includes(row.id);
    if (on) {
      const next = showcase.filter((id) => id !== row.id);
      persist(next);
      setNotice(`已取消展示「${row.badge}」，目前 ${next.length} / ${SHOWCASE_MAX} 枚。`);
      return;
    }
    if (showcase.length >= SHOWCASE_MAX) {
      const msg = `展示徽章最多 ${SHOWCASE_MAX} 枚，請先取消一枚再新增。`;
      setNotice(msg);
      push({ title: "已達展示上限", description: msg });
      return;
    }
    const next = [...showcase, row.id];
    persist(next);
    setNotice(`已設為展示「${row.badge}」，目前 ${next.length} / ${SHOWCASE_MAX} 枚。`);
  };

  const resetShowcase = () => {
    persist(DEFAULT_SHOWCASE);
    setNotice(`已恢復 Demo 預設 ${DEFAULT_SHOWCASE.length} 枚展示徽章。`);
    push({ title: "已恢復 Demo 預設", description: "只影響此瀏覽器，不代表帳號同步或正式公開頁。", tone: "gold" });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">成就與徽章</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="demo-chip">Local Mock</span>
            <span>本頁為示範資料；展示徽章只保存在此瀏覽器。</span>
          </p>
        </div>
        <Link to="/app" className="text-sm font-semibold text-gold underline-offset-4 hover:underline">
          ← 返回玩家首頁
        </Link>
      </div>

      <StateSwitcher state={state} onChange={setState} />

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="目前沒有成就資料" emptyDescription="成就資料尚未取得，此為無資料示範狀態。" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="panel p-4">
              <p className="text-[11px] text-muted-foreground">總成就點數</p>
              <p className="mt-1 text-xl font-black text-gold tabular-nums">{TOTAL_POINTS}</p>
            </div>
            <div className="panel p-4">
              <p className="text-[11px] text-muted-foreground">已完成</p>
              <p className="mt-1 text-xl font-black tabular-nums">{COMPLETED_COUNT} / {TOTAL_COUNT}</p>
            </div>
            <div className="panel p-4">
              <p className="text-[11px] text-muted-foreground">展示中徽章</p>
              <p className="mt-1 text-xl font-black tabular-nums">{showcase.length} / {SHOWCASE_MAX}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">可展示徽章 {ELIGIBLE.length} 枚</p>
            </div>
          </div>

          {/* 展示徽章管理（僅本機偏好） */}
          <section className="panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black">展示徽章管理</h2>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  目前已選 {showcase.length} / 上限 {SHOWCASE_MAX} 枚 · 可展示徽章 {ELIGIBLE.length} 枚（已完成且具有徽章）
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/app/preview/collector"
                  className="rounded-xl border border-gold/50 px-3 py-2 text-xs font-semibold text-gold underline-offset-4 hover:underline"
                >
                  預覽公開收藏頁 →
                </Link>
                <button
                  type="button"
                  onClick={resetShowcase}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  恢復 Demo 預設
                </button>
              </div>
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              公開頁建議展示 3–8 枚；目前已選 {showcase.length} 枚，已完成可選 {ELIGIBLE.length} 枚
              {showcase.length < Math.min(ELIGIBLE.length, SHOWCASE_MAX)
                ? `，還可再選至少 1 枚。`
                : showcase.length >= SHOWCASE_MAX
                  ? `，已達上限，如需更換請先取消一枚。`
                  : `，已選完所有可展示徽章。`}
              {" "}設定只保存在此瀏覽器（本機偏好），不代表帳號同步；公開收藏頁的展示徽章區會讀取同一份設定。
            </p>

            <p aria-live="polite" className="mt-2 min-h-4 text-[11px] font-semibold text-gold">
              {notice}
            </p>

            <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
              {ROWS.filter((r) => r.badge).map((row) => {
                const eligible = row.state === "已完成" && !row.hidden;
                const on = showcase.includes(row.id);
                const reason =
                  row.state === "進行中" ? "成就進行中，完成後才可設為展示。" : "尚未解鎖，無法設為展示。";
                return (
                  <li key={row.id} className="panel flex flex-col items-center gap-2 p-3 text-center">
                    <BadgeMark label={row.badge!} className="h-14 w-14" />
                    <p className="text-[11px] font-semibold">{row.badge}</p>
                    <p className="text-[10px] text-muted-foreground">{row.title}</p>
                    {eligible ? (
                      <>
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={`${on ? "取消展示" : "設為展示"}徽章 ${row.badge}`}
                          onClick={() => toggleBadge(row)}
                          className={`w-full rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors ${
                            on
                              ? "border-gold/60 bg-gold/15 text-foreground"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {on ? "✓ 展示中（取消展示）" : "設為展示"}
                        </button>
                        <span className="text-[10px] text-muted-foreground">{on ? "已在展示清單" : "未展示"}</span>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled
                          aria-label={`無法設定徽章 ${row.badge}：${reason}`}
                          className="w-full cursor-not-allowed rounded-xl border border-dashed border-border px-2 py-2 text-[11px] font-bold text-muted-foreground opacity-70"
                        >
                          無法設定展示
                        </button>
                        <span className="text-[10px] text-muted-foreground">{reason}</span>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 分類篩選（單選） */}
          <div className="panel p-3">
            <p className="mb-2 text-[11px] font-semibold text-muted-foreground">分類（單選）</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_TABS.map((c) => (
                <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
              ))}
            </div>
          </div>

          {/* 狀態篩選（單選） */}
          <div className="panel p-3">
            <p className="mb-2 text-[11px] font-semibold text-muted-foreground">狀態（單選）</p>
            <div className="flex flex-wrap gap-1.5">
              {STATE_TABS.map((s) => (
                <FilterChip key={s} label={s} active={stateTab === s} onClick={() => setStateTab(s)} />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              目前顯示 {rows.length} / {TOTAL_COUNT} 項 · 分類：{category}｜狀態：{stateTab}（分類與狀態為 AND 組合）
            </p>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!filtered}
              className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              清除篩選
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="panel p-8 text-center">
              <p className="text-2xl">◇</p>
              <p className="mt-2 text-sm font-black">沒有符合此篩選的成就</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                「{category}」與「{stateTab}」同時成立的成就目前為 0 項，請調整條件。
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 rounded-xl border border-border px-4 py-2 text-xs font-bold hover:text-foreground"
              >
                清除篩選
              </button>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {rows.map((row) => (
                <article key={row.id} className="panel flex gap-4 p-4">
                  {row.badge ? (
                    <BadgeMark label={row.badge} className="h-16 w-16 shrink-0" />
                  ) : (
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-dashed border-border text-lg text-muted-foreground">？</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-sm font-black">{row.title}</h2>
                      <StateTag row={row} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      分類：{row.category}
                      {row.state !== "已完成" && row.points > 0 ? <span className="ml-2">獎勵：{row.points} 點</span> : null}
                      {showcase.includes(row.id) ? <span className="ml-2 text-gold">展示中</span> : null}
                    </p>

                    {row.hidden ? (
                      <p className="mt-2 text-xs text-muted-foreground">條件保密，完成後將自動公開。（Demo）</p>
                    ) : row.state === "已完成" ? (
                      <>
                        <Progress className="mt-3" value={100} tone="gold" />
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          完成 {row.completedAt}（Demo）<span className="ml-2">{row.rarity}</span>
                        </p>
                      </>
                    ) : row.rankNote ? (
                      <>
                        <Progress className="mt-3" value={22} tone="gold" />
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {row.rankNote}
                          <span className="ml-2">{row.rarity}</span>
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">排行榜成就以名次距離示意，不以數量進度顯示。</p>
                      </>
                    ) : (
                      <>
                        <Progress className="mt-3" value={Math.round(((row.current ?? 0) / (row.target ?? 1)) * 100)} tone="gold" />
                        <p className="mt-2 text-[11px] tabular-nums text-muted-foreground">
                          {row.current} / {row.target}
                          <span className="ml-2">{row.rarity}</span>
                        </p>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            本頁為 Local Mock；展示徽章保存於瀏覽器 localStorage（pf-achievement-showcase），公開收藏頁會讀取同一份設定；成就規則後台為後續批次（Demo／待定）。
          </p>
        </>
      )}
    </div>
  );
}
