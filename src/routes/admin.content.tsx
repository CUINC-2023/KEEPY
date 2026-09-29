import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { POOLS } from "@/data/mock";
import {
  ACTIVITY_STATUSES,
  ANNOUNCEMENT_TAGS,
  CONTENT_STORAGE_KEY,
  DEFAULT_HOME_SECTIONS,
  mergeContent,
  resetOverrides,
  useOverrides,
  writeOverrides,
  type ContentOverrides,
  type HomeSection,
} from "@/lib/content-store";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export const Route = createFileRoute("/admin/content")({
  head: () => ({ meta: [
    { title: "內容管理（後台示範）— PEEKFUTURE 管理後台" },
    { name: "description", content: "編輯公告、活動、首頁區塊、卡池、許願與排行榜展示文案，僅存於此瀏覽器（Local Mock）。" },
    { property: "og:title", content: "內容管理（後台示範）— PEEKFUTURE" },
    { property: "og:description", content: "本機 Demo 內容編輯與前台預覽。" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: ContentAdmin,
});

type Errs = Partial<Record<"annTitle" | "annSummary" | "annBody" | "annDate" | "actTitle" | "actSubtitle" | "actDesc" | "actPeriod" | "hero" | "sections" | "pool" | "wishName" | "wishSummary" | "note", string | undefined>>;
type Tab = "announcements" | "activities" | "home" | "pools" | "wishes" | "leaderboard";
const TABS: { key: Tab; label: string }[] = [
  { key: "announcements", label: "公告" }, { key: "activities", label: "活動" }, { key: "home", label: "首頁區塊" },
  { key: "pools", label: "卡池文案" }, { key: "wishes", label: "許願候選" }, { key: "leaderboard", label: "排行榜說明" },
];

const input = "w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive";

function Field({ label, error, children, id }: { label: string; error?: string | undefined; children: ReactNode; id: string }) {
  return <div className="space-y-1"><label htmlFor={id} className="text-xs font-bold">{label}</label>{children}{error ? <p id={`${id}-err`} className="text-xs font-bold text-destructive">{error}</p> : null}</div>;
}
const req = (v: string, max: number, name: string) => (!v.trim() ? `${name}為必填` : v.length > max ? `${name}最多 ${max} 字` : undefined);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function ContentAdmin() {
  const saved = useOverrides();
  const content = mergeContent(saved);
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("announcements");
  const [annId, setAnnId] = useState(content.announcements[0]!.id);
  const [actId, setActId] = useState(content.activities[0]!.id);
  const [poolId, setPoolId] = useState(POOLS[0]!.id);
  const [wishId, setWishId] = useState(content.wishes[0]!.id);

  // 草稿：以目前已存內容為基準
  const buildDraft = () => {
    const a = content.announcementById(annId)!; const v = content.activityById(actId)!; const w = content.wishes.find((x) => x.id === wishId)!;
    return {
      ann: { title: a.title, summary: a.summary, body: a.body.join("\n\n"), date: a.date, tag: a.tag, visible: a.visible },
      act: { title: v.title, subtitle: v.subtitle, description: (v.description ?? []).join("\n\n"), period: v.period, status: v.status, visible: v.visible },
      hero: content.heroDescription, sections: content.homeSections.map((s) => ({ ...s })),
      pool: content.poolDescription(poolId), wish: { name: w.name, summary: w.summary }, note: content.leaderboardNote,
    };
  };
  const [draft, setDraft] = useState(buildDraft);
  const [errors, setErrors] = useState<Errs>({});
  const savedKey = JSON.stringify(saved);
  // 切換項目或儲存後重建草稿
  useEffect(() => { setDraft(buildDraft()); setErrors({}); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [annId, actId, poolId, wishId, savedKey]);

  const baseline = buildDraft();
  const dirty = JSON.stringify(pickTab(tab, draft)) !== JSON.stringify(pickTab(tab, baseline));

  function validate(): Errs {
    const e: Errs = {};
    if (tab === "announcements") { e.annTitle = req(draft.ann.title, 60, "標題"); e.annSummary = req(draft.ann.summary, 120, "摘要"); e.annBody = req(draft.ann.body, 2000, "內文"); e.annDate = DATE_RE.test(draft.ann.date) && !Number.isNaN(Date.parse(draft.ann.date)) ? undefined : "日期格式須為 YYYY-MM-DD"; }
    if (tab === "activities") { e.actTitle = req(draft.act.title, 60, "標題"); e.actSubtitle = req(draft.act.subtitle, 120, "摘要"); e.actDesc = req(draft.act.description, 2000, "詳情"); e.actPeriod = req(draft.act.period, 40, "活動期間"); }
    if (tab === "home") { e.hero = req(draft.hero, 160, "主視覺說明"); if (!draft.sections.some((s) => s.visible)) e.sections = "至少保留一個顯示中的區塊"; }
    if (tab === "pools") e.pool = req(draft.pool, 200, "卡池說明");
    if (tab === "wishes") { e.wishName = req(draft.wish.name, 40, "候選名稱"); e.wishSummary = req(draft.wish.summary, 160, "候選說明"); }
    if (tab === "leaderboard") e.note = req(draft.note, 200, "排行榜說明");
    return e;
  }

  function save() {
    const e = validate(); setErrors(e);
    const first = Object.entries(e).find(([, v]) => v);
    if (first) { document.getElementById(first[0])?.focus(); push({ title: "尚未儲存", description: "請修正標示的欄位。", tone: "default" }); return; }
    const next: ContentOverrides = structuredClone(saved);
    const paras = (s: string) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (tab === "announcements") next.announcements[annId] = { ...draft.ann, body: paras(draft.ann.body) };
    if (tab === "activities") next.activities[actId] = { ...draft.act, description: paras(draft.act.description) };
    if (tab === "home") next.home = { heroDescription: draft.hero, sections: draft.sections };
    if (tab === "pools") next.pools[poolId] = { description: draft.pool };
    if (tab === "wishes") next.wishes[wishId] = { ...draft.wish };
    if (tab === "leaderboard") next.leaderboard = { note: draft.note };
    writeOverrides(next);
    push({ title: "已儲存於此瀏覽器（Demo）", description: "僅本機預覽，未發佈、不與他人共用。", tone: "gold" });
  }
  function cancel() { setDraft(baseline); setErrors({}); }
  function resetAll() { resetOverrides(); push({ title: "已重設為 Demo 預設值", description: "此瀏覽器的本機內容修改已清除。", tone: "gold" }); }

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const moveSection = (i: number, dir: -1 | 1) => { const s = [...draft.sections]; const j = i + dir; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j]!, s[i]!]; set("sections", s); };
  const aria = (k: string) => ({ id: k, "aria-invalid": Boolean((errors as Record<string, string | undefined>)[k]), "aria-describedby": (errors as Record<string, string | undefined>)[k] ? `${k}-err` : undefined });

  return <div className="space-y-5 overflow-x-clip">
    <header className="space-y-2"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black">內容管理</h1><span className="demo-chip">後台示範／非真實權限</span></div><p className="text-sm text-muted-foreground">修改只儲存在此瀏覽器的本機儲存（{CONTENT_STORAGE_KEY}），不會發佈、不會同步給其他人。榜單只能改說明文字，計分、排名、獎勵與機率不可編輯。詳情頁的瀏覽器分頁標題會跟著本機內容更新，但外部分享預覽仍使用預設內容。</p></header>
    <div role="tablist" aria-label="內容分類" className="flex flex-wrap gap-2">{TABS.map((t) => <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => { if (dirty && !window.confirm("有未儲存的變更，確定切換分類並捨棄？")) return; cancel(); setTab(t.key); }} className={`rounded-md border px-3 py-2 text-sm font-bold ${tab === t.key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{t.label}</button>)}</div>

    <section className="panel space-y-4 p-4 sm:p-6" role="tabpanel">
      {tab === "announcements" && <>
        <Field id="annPick" label="選擇公告"><select id="annPick" className={input} value={annId} onChange={(e) => setAnnId(e.target.value)}>{content.announcements.map((a) => <option key={a.id} value={a.id}>{a.id} · {a.title}{a.visible ? "" : "（隱藏）"}</option>)}</select></Field>
        <Field id="annTitle" label="標題" error={errors.annTitle}><input {...aria("annTitle")} className={input} value={draft.ann.title} onChange={(e) => set("ann", { ...draft.ann, title: e.target.value })} /></Field>
        <Field id="annSummary" label="摘要" error={errors.annSummary}><input {...aria("annSummary")} className={input} value={draft.ann.summary} onChange={(e) => set("ann", { ...draft.ann, summary: e.target.value })} /></Field>
        <Field id="annBody" label="內文（空行分段）" error={errors.annBody}><textarea {...aria("annBody")} rows={6} className={input} value={draft.ann.body} onChange={(e) => set("ann", { ...draft.ann, body: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field id="annDate" label="發布日期（Demo）" error={errors.annDate}><input {...aria("annDate")} className={input} value={draft.ann.date} placeholder="YYYY-MM-DD" onChange={(e) => set("ann", { ...draft.ann, date: e.target.value })} /></Field>
          <Field id="annTag" label="分類"><select id="annTag" className={input} value={draft.ann.tag} onChange={(e) => set("ann", { ...draft.ann, tag: e.target.value })}>{ANNOUNCEMENT_TAGS.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Visible id="annVis" checked={draft.ann.visible} onChange={(v) => set("ann", { ...draft.ann, visible: v })} />
        </div>
        <Preview><Link to="/announcements/$announcementId" params={{ announcementId: annId }} className="text-primary hover:underline">前台單篇預覽 →</Link><Link to="/announcements" className="text-primary hover:underline">公告列表 →</Link><Link to="/" className="text-primary hover:underline">首頁 →</Link></Preview>
      </>}

      {tab === "activities" && <>
        <Field id="actPick" label="選擇活動"><select id="actPick" className={input} value={actId} onChange={(e) => setActId(e.target.value)}>{content.activities.map((a) => <option key={a.id} value={a.id}>{a.title}{a.visible ? "" : "（隱藏）"}</option>)}</select></Field>
        <Field id="actTitle" label="標題" error={errors.actTitle}><input {...aria("actTitle")} className={input} value={draft.act.title} onChange={(e) => set("act", { ...draft.act, title: e.target.value })} /></Field>
        <Field id="actSubtitle" label="摘要" error={errors.actSubtitle}><input {...aria("actSubtitle")} className={input} value={draft.act.subtitle} onChange={(e) => set("act", { ...draft.act, subtitle: e.target.value })} /></Field>
        <Field id="actDesc" label="詳情（空行分段）" error={errors.actDesc}><textarea {...aria("actDesc")} rows={5} className={input} value={draft.act.description} onChange={(e) => set("act", { ...draft.act, description: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field id="actPeriod" label="活動期間（Demo）" error={errors.actPeriod}><input {...aria("actPeriod")} className={input} value={draft.act.period} onChange={(e) => set("act", { ...draft.act, period: e.target.value })} /></Field>
          <Field id="actStatus" label="狀態"><select id="actStatus" className={input} value={draft.act.status} onChange={(e) => set("act", { ...draft.act, status: e.target.value as typeof draft.act.status })}>{ACTIVITY_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Visible id="actVis" checked={draft.act.visible} onChange={(v) => set("act", { ...draft.act, visible: v })} />
        </div>
        <Preview><Link to="/activities/$activityId" params={{ activityId: actId }} className="text-primary hover:underline">前台單篇預覽 →</Link><Link to="/activities" className="text-primary hover:underline">活動列表 →</Link><Link to="/" className="text-primary hover:underline">首頁 →</Link></Preview>
      </>}

      {tab === "home" && <>
        <Field id="hero" label="主視覺說明文案" error={errors.hero}><textarea {...aria("hero")} rows={3} className={input} value={draft.hero} onChange={(e) => set("hero", e.target.value)} /></Field>
        <div><p className="text-xs font-bold">區塊順序與顯示</p>{errors.sections ? <p className="text-xs font-bold text-destructive">{errors.sections}</p> : null}
          <ol id="sections" tabIndex={-1} className="mt-2 divide-y divide-border rounded-md border border-border">{draft.sections.map((s: HomeSection, i) => <li key={s.key} className="flex flex-wrap items-center gap-2 p-2 text-sm"><span className="w-6 font-black text-gold">{i + 1}</span><span className="min-w-0 flex-1">{s.label}</span>
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={s.visible} onChange={(e) => set("sections", draft.sections.map((x) => x.key === s.key ? { ...x, visible: e.target.checked } : x))} />顯示</label>
            <Button size="sm" variant="outline" disabled={i === 0} onClick={() => moveSection(i, -1)} aria-label={`${s.label}上移`}>↑</Button><Button size="sm" variant="outline" disabled={i === draft.sections.length - 1} onClick={() => moveSection(i, 1)} aria-label={`${s.label}下移`}>↓</Button></li>)}</ol>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => set("sections", DEFAULT_HOME_SECTIONS.map((s) => ({ ...s })))}>還原預設順序（需儲存）</Button></div>
        <p className="text-xs text-muted-foreground">主視覺、現在進行中橫條固定於頂部，不可隱藏。</p>
        <Preview><Link to="/" className="text-primary hover:underline">首頁預覽 →</Link></Preview>
      </>}

      {tab === "pools" && <>
        <Field id="poolPick" label="選擇卡池"><select id="poolPick" className={input} value={poolId} onChange={(e) => setPoolId(e.target.value)}>{POOLS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field id="pool" label="卡池說明文案" error={errors.pool}><textarea {...aria("pool")} rows={3} className={input} value={draft.pool} onChange={(e) => set("pool", e.target.value)} /></Field>
        <p className="text-xs text-muted-foreground">只可修改展示文案；名稱、期間、價格、機率與卡牌不可在此編輯。</p>
        <Preview><Link to="/pools/$poolId" params={{ poolId }} className="text-primary hover:underline">卡池詳情預覽 →</Link><Link to="/pools" className="text-primary hover:underline">卡池列表 →</Link></Preview>
      </>}

      {tab === "wishes" && <>
        <Field id="wishPick" label="選擇候選"><select id="wishPick" className={input} value={wishId} onChange={(e) => setWishId(e.target.value)}>{content.wishes.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
        <Field id="wishName" label="候選名稱" error={errors.wishName}><input {...aria("wishName")} className={input} value={draft.wish.name} onChange={(e) => set("wish", { ...draft.wish, name: e.target.value })} /></Field>
        <Field id="wishSummary" label="候選說明" error={errors.wishSummary}><textarea {...aria("wishSummary")} rows={3} className={input} value={draft.wish.summary} onChange={(e) => set("wish", { ...draft.wish, summary: e.target.value })} /></Field>
        <p className="text-xs text-muted-foreground">票數、狀態與截止日不可編輯，也不計票。</p>
        <Preview><Link to="/wish-pools" className="text-primary hover:underline">許願卡池預覽 →</Link><Link to="/" className="text-primary hover:underline">首頁 →</Link></Preview>
      </>}

      {tab === "leaderboard" && <>
        <Field id="note" label="排行榜說明文字" error={errors.note}><textarea {...aria("note")} rows={3} className={input} value={draft.note} onChange={(e) => set("note", e.target.value)} /></Field>
        <p className="text-xs text-muted-foreground">計分公式、排名、獎勵與規則說明區不可編輯。</p>
        <Preview><Link to="/leaderboards" className="text-primary hover:underline">排行榜預覽 →</Link><Link to="/" className="text-primary hover:underline">首頁 →</Link></Preview>
      </>}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button onClick={save}>儲存到此瀏覽器</Button>
        <Button variant="outline" onClick={cancel} disabled={!dirty}>取消未存變更</Button>
        <span className="text-xs text-muted-foreground" aria-live="polite">{dirty ? "有未儲存的變更" : "無未儲存變更"}</span>
        <Button variant="ghost" className="ml-auto" onClick={() => { if (window.confirm("確定清除此瀏覽器所有內容修改，重設為 Demo 預設值？")) resetAll(); }}>重設全部 Demo 預設值</Button>
      </div>
    </section>
  </div>;
}

function pickTab(tab: Tab, d: { ann: unknown; act: unknown; hero: string; sections: unknown; pool: string; wish: unknown; note: string }) {
  return tab === "announcements" ? d.ann : tab === "activities" ? d.act : tab === "home" ? [d.hero, d.sections] : tab === "pools" ? d.pool : tab === "wishes" ? d.wish : d.note;
}
function Visible({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <div className="space-y-1"><span className="text-xs font-bold">前台顯示</span><label htmlFor={id} className="flex min-h-10 items-center gap-2 text-sm"><input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{checked ? "顯示中" : "隱藏"}</label></div>;
}
function Preview({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3 text-sm font-bold"><span className="text-xs font-normal text-muted-foreground">前台預覽（同瀏覽器即時生效）：</span>{children}</div>;
}
