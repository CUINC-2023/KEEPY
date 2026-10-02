import { createFileRoute, Link } from "@tanstack/react-router";
import { RECRUITMENTS } from "@/data/public-hub";
import { PublicPage, TextStatus } from "@/components/public/PublicPage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/recruitment")({
  head: () => ({ meta: [
    { title: "卡池募集 — KEEPY 創作者收藏卡平台" }, { name: "description", content: "查看創作者、VTuber、原創角色與聯名 IP 卡池募集資格。" },
    { property: "og:title", content: "卡池募集 — KEEPY 創作者收藏卡平台" }, { property: "og:description", content: "查看卡池募集資格與合作流程。" },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: RecruitmentPage,
});

function RecruitmentPage() {
  return <PublicPage title="卡池募集" description="面向真人創作者、男性、VTuber、原創角色與聯名 IP 的合作資訊；本頁不建立真實送件。">
    <div className="rounded-md border border-gold/30 bg-gold/10 p-4 text-sm leading-relaxed text-gold">送件前須確認肖像權、攝影著作權及第三方角色 IP 授權。此頁僅為資格與流程 Mock，不收集檔案或個資。</div>
    <p className="rounded-md border border-border bg-muted p-4 text-sm font-bold" role="note">目前未開放真實送件：本頁與申請流程皆為示意，不會建立申請、不上傳檔案、不蒐集個資。</p>
    <div className="grid gap-3 md:grid-cols-3">{RECRUITMENTS.map((item) => <article key={item.id} className="panel p-5"><TextStatus tone={item.status === "開放諮詢" ? "live" : "gold"}>{item.status}</TextStatus><h2 className="mt-5 text-lg font-black">{item.title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">資格：{item.eligibility}</p><p className="mt-4 text-xs text-gold">{item.period}</p></article>)}</div>
    <section className="panel p-6"><h2 className="text-lg font-black">合作流程</h2><ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["了解合作與授權", "填寫 Demo 申請", "官方審核與補件", "合約確認後開通身分"].map((step, index) => <li key={step} className="rounded-md border border-border p-4"><span className="text-xs font-black text-gold">STEP {index + 1}</span><p className="mt-2 text-sm font-bold">{step}</p></li>)}</ol><Button asChild className="mt-5"><Link to="/partner">查看申請流程（Demo）</Link></Button></section>
    <section className="panel p-6"><h2 className="text-lg font-black">授權檢查說明</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{[["肖像權", "真人創作者需本人或經紀授權使用肖像。"], ["攝影著作權", "卡面照片需取得攝影師或權利人授權。"], ["角色／IP 授權", "VTuber、原創角色與聯名 IP 需具商用授權。"], ["素材使用範圍", "授權範圍需涵蓋數位卡面與可能的實體典藏。"]].map(([t, d]) => <li key={t} className="rounded-md border border-border p-4"><p className="text-sm font-bold">{t}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{d}</p></li>)}</ul><p className="mt-4 text-xs text-muted-foreground">實際分潤比例依合作合約；審核時程與補件期限待定（Demo）。</p></section>
  </PublicPage>;
}