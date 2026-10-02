import { useEffect, useState } from "react";
import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { FAQ } from "@/data/faq";
import { useCopy, useLocale } from "@/lib/keepy-i18n";
export const Route = createFileRoute("/faq")({ head: () => ({ meta: [{ title: "常見問題 — KEEPY" }, { name: "description", content: "抽卡、收藏、實體卡與創作者合作常見問題。" }] }), component: FaqPage });
function FaqPage() {
  const { locale } = useLocale(); const t = useCopy(); const { hash } = useLocation();
  const [category, setCategory] = useState<"all" | "player" | "creator">("all");
  const [query, setQuery] = useState(""); const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { if (!hash) return; setCategory("all"); setQuery(""); setOpen(hash); const id = requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "center" })); return () => cancelAnimationFrame(id); }, [hash]);
  const labels = locale === "en" ? { all: "All", search: "Search questions", empty: "No matching questions", clear: "Clear filters", preview: "Preview", more: "View card pools" } : { all: "全部", search: "搜尋問題", empty: "沒有符合的問題", clear: "清除篩選", preview: "預覽版", more: "查看卡池" };
  const rows = FAQ.filter(item => (category === "all" || item.category === category) && `${item.title[locale]} ${item.body[locale]}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div className="mx-auto max-w-4xl space-y-6">
    <header className="space-y-2"><span className="demo-chip">{labels.preview}</span><h1 className="text-3xl font-black">{t("faq")}</h1><p className="text-sm text-muted-foreground">{t("noTransactions")}</p></header>
    <div className="panel space-y-4 p-4"><label className="block space-y-2 text-sm font-bold"><span>{labels.search}</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground" placeholder={locale === "en" ? "Draws, cards, agreements…" : "抽卡、實體卡、合約…"} /></label><div className="flex flex-wrap gap-2" role="group" aria-label={t("faq")}>{(["all", "player", "creator"] as const).map(key => <button key={key} type="button" aria-pressed={category === key} onClick={() => setCategory(key)} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold ${category === key ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{key === "all" ? labels.all : t(key)}</button>)}</div></div>
    <p aria-live="polite" className="text-xs text-muted-foreground">{locale === "en" ? `${rows.length} questions` : `共 ${rows.length} 個問題`}</p>
    <div className="space-y-3">{rows.map(item => <details key={item.id} id={item.id} open={open === item.id} onToggle={event => { if (event.currentTarget.open) setOpen(item.id); else setOpen(current => current === item.id ? null : current); }} className="panel min-w-0 scroll-mt-24 p-4"><summary className="cursor-pointer break-words text-sm font-bold leading-relaxed">{item.title[locale]}</summary><p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{item.body[locale]}</p></details>)}</div>
    {!rows.length && <div className="panel p-5 text-center"><p>{labels.empty}</p><button type="button" onClick={() => { setQuery(""); setCategory("all"); }} className="mt-3 min-h-11 font-bold text-primary">{labels.clear}</button></div>}
    <Link to="/pools" className="inline-block min-h-11 py-3 text-sm font-bold text-primary">{labels.more} →</Link>
  </div>;
}
