import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { goddessOf } from "@/data/player";
import { GRADES, POOLS } from "@/data/mock";
import {
  CARD_SHOWCASE_MAX,
  CARD_SHOWCASE_MIN,
  DEFAULT_CARD_SHOWCASE_IDS,
  SHOWCASE_POOL,
  readCardShowcaseIds,
  showcaseCardById,
  writeCardShowcaseIds,
} from "@/data/showcase-cards";
import { Button } from "@/components/ui/button";
import { CardFrame } from "@/components/ui/card-frame";
import { BadgeMark } from "@/components/player/BadgeMark";
import { TextStatus } from "@/components/public/PublicPage";
import { useToast } from "@/components/ui/toast";
import { DEFAULT_SHOWCASE_IDS, SHOWCASE_MAX, readShowcaseIds, showcaseBadgeById } from "@/data/showcase-badges";
import {
  BIO_MAX,
  DEFAULT_PUBLIC_PROFILE,
  DISPLAY_NAME_MAX,
  bioError,
  displayNameError,
  readPublicProfile,
  writePublicProfile,
  type PublicProfileSettings,
} from "@/data/public-profile-settings";

export const Route = createFileRoute("/app/settings/privacy")({
  head: () => ({
    meta: [
      { title: "公開頁與隱私設定 — KEEPY 創作者收藏卡平台" },
      { name: "description", content: "設定公開收藏頁的顯示名稱、介紹與展示區塊，設定只保存在此瀏覽器。" },
      { property: "og:title", content: "公開頁與隱私設定 — KEEPY 創作者收藏卡平台" },
      { property: "og:description", content: "管理公開收藏頁展示內容的 Local Mock 設定頁。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacySettings,
});


const TOGGLES = [
  { key: "isPublic", label: "公開個人頁", desc: "關閉後公開收藏頁只顯示「此收藏頁未公開」，不會顯示任何個人內容。" },
  { key: "showRanking", label: "顯示排名", desc: "公開頁是否顯示總榜與代表性卡池榜名次。" },
  { key: "showCollectionStats", label: "顯示卡冊與卡牌數量", desc: "公開頁是否顯示完成卡冊、總卡牌數、不重複卡數與當季進度。" },
  { key: "showRecentAchievements", label: "顯示近期成就", desc: "公開頁是否顯示最近取得的成就（不含未完成條件與隱藏成就）。" },
  { key: "showPhysicalCollection", label: "顯示實體典藏紀錄", desc: "只顯示公開典藏紀錄，永不含收件資料或地址。" },
] as const;

function move<T>(list: T[], index: number, delta: number) {
  const next = list.slice();
  const target = index + delta;
  if (target < 0 || target >= next.length) return next;
  const a = next[index]!;
  const b = next[target]!;
  next[index] = b;
  next[target] = a;
  return next;
}

function sameSettings(a: PublicProfileSettings, b: PublicProfileSettings) {
  return (
    a.isPublic === b.isPublic &&
    a.displayName.trim() === b.displayName.trim() &&
    a.bio.trim() === b.bio.trim() &&
    a.showRanking === b.showRanking &&
    a.showCollectionStats === b.showCollectionStats &&
    a.showRecentAchievements === b.showRecentAchievements &&
    a.showPhysicalCollection === b.showPhysicalCollection
  );
}

function PrivacySettings() {
  const { push } = useToast();
  const [saved, setSaved] = useState<PublicProfileSettings>(DEFAULT_PUBLIC_PROFILE);
  const [form, setForm] = useState<PublicProfileSettings>(DEFAULT_PUBLIC_PROFILE);
  const [badgeIds, setBadgeIds] = useState<string[]>([...DEFAULT_SHOWCASE_IDS]);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const stored = readPublicProfile();
    setSaved(stored);
    setForm(stored);
    setBadgeIds(readShowcaseIds());
  }, []);

  const set = <K extends keyof PublicProfileSettings>(k: K, v: PublicProfileSettings[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const nameError = displayNameError(form.displayName);
  const introError = bioError(form.bio);
  const dirty = !sameSettings(form, saved);
  const canSave = dirty && !nameError && !introError;

  const badges = badgeIds
    .map((id) => showcaseBadgeById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));


  const handleSave = () => {
    if (!canSave) return;
    const next: PublicProfileSettings = { ...form, displayName: form.displayName.trim(), bio: form.bio.trim() };
    writePublicProfile(next);
    setSaved(next);
    setForm(next);
    setStatus("已儲存到此瀏覽器：公開收藏頁會立即套用這些設定。");
    push({ title: "設定已儲存（此瀏覽器）", description: "僅保存在本機 localStorage，不會同步到伺服器或帳號。" });
  };

  const handleCancel = () => {
    setForm(saved);
    setStatus("已還原為上次儲存的內容。");
  };

  const handleReset = () => {
    writePublicProfile(DEFAULT_PUBLIC_PROFILE);
    setSaved(DEFAULT_PUBLIC_PROFILE);
    setForm(DEFAULT_PUBLIC_PROFILE);
    setStatus("已恢復 Demo 預設並儲存到此瀏覽器。");
    push({ title: "已恢復 Demo 預設", description: "公開頁顯示內容回到預設 Demo 狀態。" });
  };

  return (
    <div className="space-y-5 overflow-x-clip">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-black sm:text-2xl">公開頁與隱私設定</h1>
        <span className="demo-chip">Local Mock · 只保存在此瀏覽器</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        本頁設定會保存在此瀏覽器（localStorage），並同步到公開收藏頁預覽；不會上傳、不會同步到伺服器或帳號。本頁不收集真實姓名、Email、電話、地址或社群帳號。
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline"><Link to="/app">返回玩家首頁</Link></Button>
        <Button asChild size="sm" variant="outline"><Link to="/app/preview/collector">本人預覽公開頁</Link></Button>
      </div>

      <section className="panel p-4 sm:p-5">
        <p className="text-sm font-black">公開身分資料</p>
        <label className="mt-3 block text-[11px] text-muted-foreground" htmlFor="pf-display-name">
          公開顯示名稱（1–{DISPLAY_NAME_MAX} 字）
        </label>
        <input
          id="pf-display-name"
          value={form.displayName}
          maxLength={DISPLAY_NAME_MAX + 10}
          aria-invalid={Boolean(nameError)}
          aria-describedby="pf-display-name-help"
          onChange={(e) => set("displayName", e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-semibold text-foreground"
        />
        <p id="pf-display-name-help" className={`mt-1 text-[11px] ${nameError ? "font-bold text-destructive" : "text-muted-foreground"}`}>
          {nameError ?? `${form.displayName.trim().length} / ${DISPLAY_NAME_MAX} 字`}
        </p>

        <label className="mt-4 block text-[11px] text-muted-foreground" htmlFor="pf-bio">
          收藏家介紹（0–{BIO_MAX} 字）
        </label>
        <textarea
          id="pf-bio"
          rows={3}
          value={form.bio}
          aria-invalid={Boolean(introError)}
          aria-describedby="pf-bio-help"
          onChange={(e) => set("bio", e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
        />
        <p id="pf-bio-help" className={`mt-1 text-[11px] ${introError ? "font-bold text-destructive" : "text-muted-foreground"}`}>
          {introError ?? `${form.bio.trim().length} / ${BIO_MAX} 字`}
        </p>
      </section>

      <section className="panel p-4 sm:p-5">
        <p className="text-sm font-black">公開設定</p>
        <div className="mt-2">
          {TOGGLES.map((item) => {
            const value = form[item.key];
            return (
              <div key={item.key} className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-0">
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{item.label}</span>
                  <span className="block text-[11px] leading-relaxed text-muted-foreground">{item.desc}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">{value ? "公開" : "不公開"}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={value}
                    aria-label={`${item.label}：${value ? "公開" : "不公開"}`}
                    title={item.label}
                    onClick={() => set(item.key, !value)}
                    className={`h-6 w-11 rounded-full border transition-colors ${value ? "border-primary bg-primary/70" : "border-border bg-muted"}`}
                  >
                    <span className={`block h-5 w-5 rounded-full bg-foreground transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
        {!form.isPublic ? (
          <p role="status" className="mt-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-[11px] font-bold">
            公開個人頁目前關閉：儲存後公開收藏頁會進入「此收藏頁未公開」狀態，不顯示名稱、介紹、徽章、卡牌、排名、統計、成就與典藏紀錄。你仍可先編輯以下欄位再儲存。
          </p>
        ) : null}
        <p className="mt-3 text-[11px] text-muted-foreground">本頁不提供消費金額、點數、抽卡紀錄、收件資料或地址的任何公開設定。</p>
      </section>

      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} disabled={!canSave} aria-disabled={!canSave}>儲存設定</Button>
          <Button variant="outline" onClick={handleCancel} disabled={!dirty} aria-disabled={!dirty}>取消變更／還原已儲存內容</Button>
          <Button variant="outline" onClick={handleReset}>恢復 Demo 預設</Button>
        </div>
        <p role="status" aria-live="polite" className="mt-3 text-[11px] text-muted-foreground">
          {dirty
            ? nameError || introError
              ? "有未儲存變更，但目前欄位不符合規則，儲存按鈕已停用。"
              : "有未儲存變更，尚未套用到公開收藏頁。"
            : status || "目前沒有未儲存變更。"}
        </p>
      </section>

      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <p className="text-sm font-black">展示徽章</p>
          <TextStatus tone="gold">已選 {badges.length} / 上限 {SHOWCASE_MAX} 枚</TextStatus>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          徽章展示只在「成就與徽章」頁設定（來源：pf-achievement-showcase），本頁僅顯示目前摘要。
        </p>
        {badges.length === 0 ? (
          <p className="mt-3 text-xs font-bold">目前未選任何展示徽章；公開頁會顯示「這位收藏家尚未展示徽章」。</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-3" aria-label="目前展示徽章摘要">
            {badges.map((item) => (
              <li key={item.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <BadgeMark label={item.badge} className="h-10 w-10" />
                <span className="text-[11px] font-bold">{item.badge}</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          to="/app/achievements"
          className="mt-3 inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:border-primary/50"
        >
          管理展示徽章
          <span aria-hidden>→</span>
        </Link>
      </section>

      <ShowcaseCardsSection />
    </div>
  );
}

const GRADE_OPTIONS = ["全部稀有度", ...GRADES] as const;
const POOL_OPTIONS = [{ id: "all", name: "全部卡池" }, ...POOLS.map((p) => ({ id: p.id, name: p.name }))];
const PAGE_SIZE = 12;

function sameIds(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

function ShowcaseCardsSection() {
  const { push } = useToast();
  const [saved, setSaved] = useState<string[]>([...DEFAULT_CARD_SHOWCASE_IDS]);
  const [picked, setPicked] = useState<string[]>([...DEFAULT_CARD_SHOWCASE_IDS]);
  const [keyword, setKeyword] = useState("");
  const [grade, setGrade] = useState<string>("全部稀有度");
  const [pool, setPool] = useState<string>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const stored = readCardShowcaseIds();
    setSaved(stored);
    setPicked(stored);
  }, []);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [keyword, grade, pool]);

  const kw = keyword.trim().toLowerCase();
  const matched = SHOWCASE_POOL.filter((card) => {
    if (grade !== "全部稀有度" && card.grade !== grade) return false;
    if (pool !== "all" && card.poolId !== pool) return false;
    if (!kw) return true;
    return (
      card.name.toLowerCase().includes(kw) ||
      goddessOf(card).name.toLowerCase().includes(kw)
    );
  });
  const visible = matched.slice(0, limit);

  const atMax = picked.length >= CARD_SHOWCASE_MAX;
  const atMin = picked.length <= CARD_SHOWCASE_MIN;
  const dirty = !sameIds(picked, saved);
  const canSave = dirty && picked.length >= CARD_SHOWCASE_MIN && picked.length <= CARD_SHOWCASE_MAX;
  const filtered = Boolean(kw) || grade !== "全部稀有度" || pool !== "all";

  const add = (id: string) => {
    if (picked.includes(id) || picked.length >= CARD_SHOWCASE_MAX) return;
    setPicked((list) => [...list, id]);
    setStatus(`已加入展示卡，目前 ${picked.length + 1} / ${CARD_SHOWCASE_MAX} 張（尚未儲存）。`);
  };
  const remove = (id: string) => {
    if (picked.length <= CARD_SHOWCASE_MIN) return;
    setPicked((list) => list.filter((x) => x !== id));
    setStatus(`已移除展示卡，目前 ${picked.length - 1} / ${CARD_SHOWCASE_MAX} 張（尚未儲存）。`);
  };

  const handleSave = () => {
    if (!canSave) return;
    writeCardShowcaseIds(picked);
    setSaved(picked);
    setStatus("展示卡已儲存到此瀏覽器：公開收藏頁會依此順序顯示。");
    push({ title: "展示卡已儲存（此瀏覽器）", description: "僅保存在本機 localStorage，不會同步到伺服器或帳號。" });
  };
  const handleCancel = () => {
    setPicked(saved);
    setStatus("已還原為上次儲存的展示卡。");
  };
  const handleReset = () => {
    writeCardShowcaseIds([...DEFAULT_CARD_SHOWCASE_IDS]);
    setSaved([...DEFAULT_CARD_SHOWCASE_IDS]);
    setPicked([...DEFAULT_CARD_SHOWCASE_IDS]);
    setStatus("已恢復 Demo 展示卡並儲存到此瀏覽器。");
    push({ title: "已恢復 Demo 展示卡", description: "公開收藏頁展示卡回到預設六張。" });
  };

  return (
    <section id="showcase-cards" className="panel scroll-mt-20 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-sm font-black">展示卡</p>
        <TextStatus tone={canSave || !dirty ? "gold" : "default"}>
          已選 {picked.length} / {CARD_SHOWCASE_MIN}–{CARD_SHOWCASE_MAX} 張
        </TextStatus>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        展示卡會保存在此瀏覽器（pf-card-showcase-v1）並同步到公開收藏頁；不會同步到伺服器或帳號。此區塊與上方「儲存設定」互相獨立。
      </p>

      <p className="mt-4 text-xs font-bold">
        已選展示卡（依序顯示）{dirty ? " · 有未儲存變更" : " · 與已儲存內容相同"}
      </p>
      <ol className="mt-2 space-y-2" aria-label="已選展示卡順序">
        {picked.map((id, index) => {
          const card = showcaseCardById(id);
          const name = card?.name ?? id;
          return (
            <li key={id} className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2">
              <span className="min-w-0 truncate text-xs font-bold">
                {index + 1}. {name}
                {card ? <span className="ml-2 font-normal text-muted-foreground">{card.grade}</span> : null}
              </span>
              <span className="flex shrink-0 gap-1">
                <Button size="sm" variant="outline" disabled={index === 0} aria-disabled={index === 0} onClick={() => setPicked((l) => move(l, index, -1))} aria-label={`將 ${name} 上移`}>上移</Button>
                <Button size="sm" variant="outline" disabled={index === picked.length - 1} aria-disabled={index === picked.length - 1} onClick={() => setPicked((l) => move(l, index, 1))} aria-label={`將 ${name} 下移`}>下移</Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={atMin}
                  aria-disabled={atMin}
                  title={atMin ? `至少需保留 ${CARD_SHOWCASE_MIN} 張展示卡` : undefined}
                  onClick={() => remove(id)}
                  aria-label={`移除展示卡 ${name}`}
                >
                  移除
                </Button>
              </span>
            </li>
          );
        })}
      </ol>
      {atMin ? (
        <p className="mt-2 text-[11px] font-bold">已達下限：至少需保留 {CARD_SHOWCASE_MIN} 張展示卡，移除按鈕已停用。</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button onClick={handleSave} disabled={!canSave} aria-disabled={!canSave}>儲存展示卡</Button>
        <Button variant="outline" onClick={handleCancel} disabled={!dirty} aria-disabled={!dirty}>取消展示卡變更</Button>
        <Button variant="outline" onClick={handleReset}>恢復 Demo 展示卡</Button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 text-[11px] text-muted-foreground">
        {dirty ? status || "有未儲存的展示卡變更，尚未套用到公開收藏頁。" : status || "目前沒有未儲存的展示卡變更。"}
      </p>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-bold">選擇展示卡</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <span className="block">
            <label className="block text-[11px] text-muted-foreground" htmlFor="pf-card-search">搜尋卡名或女神名稱</label>
            <input
              id="pf-card-search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="例如：夜澄"
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
            />
          </span>
          <span className="block">
            <label className="block text-[11px] text-muted-foreground" htmlFor="pf-card-grade">稀有度</label>
            <select
              id="pf-card-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-semibold text-foreground"
            >
              {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </span>
          <span className="block">
            <label className="block text-[11px] text-muted-foreground" htmlFor="pf-card-pool">卡池</label>
            <select
              id="pf-card-pool"
              value={pool}
              onChange={(e) => setPool(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-semibold text-foreground"
            >
              {POOL_OPTIONS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <TextStatus>目前符合 {matched.length} 張 · 顯示 {visible.length} 張</TextStatus>
          <Button size="sm" variant="outline" disabled={!filtered} aria-disabled={!filtered} onClick={() => { setKeyword(""); setGrade("全部稀有度"); setPool("all"); }}>清除條件</Button>
        </div>

        {matched.length === 0 ? (
          <p className="mt-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs font-bold">沒有符合條件的持有卡，請調整搜尋或篩選條件。</p>
        ) : (
          <>
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6" aria-label="可選展示卡結果">
              {visible.map((card) => {
                const isPicked = picked.includes(card.id);
                const blocked = !isPicked && atMax;
                return (
                  <li key={card.id} className="min-w-0">
                    <CardFrame goddess={goddessOf(card)} grade={card.grade} cardName={card.name} />
                    <span className="mt-2 block truncate text-[11px] font-bold">{card.name}</span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">{card.grade} · {goddessOf(card).name}</span>
                    {isPicked ? (
                      <span className="mt-1 block text-[10px] font-bold text-gold">已選為展示卡</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 w-full"
                        disabled={blocked}
                        aria-disabled={blocked}
                        title={blocked ? `已達展示卡上限 ${CARD_SHOWCASE_MAX} 張，請先移除再加入` : undefined}
                        onClick={() => add(card.id)}
                        aria-label={`加入展示卡 ${card.name}`}
                      >
                        加入
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            {atMax ? (
              <p className="mt-3 text-[11px] font-bold">已達上限：最多 {CARD_SHOWCASE_MAX} 張展示卡，其他「加入」按鈕已停用。</p>
            ) : null}
            {visible.length < matched.length ? (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                載入更多（剩餘 {matched.length - visible.length} 張）
              </Button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
