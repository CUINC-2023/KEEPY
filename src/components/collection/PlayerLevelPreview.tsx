import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { previewPlayerLevel } from "@/lib/player-level-preview.mjs";
import type { CollectionMe, CollectionCatalogue } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";

export function PlayerLevelPreview({
  me,
  catalogue,
}: {
  me: CollectionMe;
  catalogue: CollectionCatalogue;
}) {
  const t = useDiscoveryText();
  const [candidate, setCandidate] = useState<"A" | "B">("A");
  const value = previewPlayerLevel(me, catalogue, candidate);
  if (!value) return null;
  const comparison = (["A", "B"] as const)
    .map((rule) => previewPlayerLevel(me, catalogue, rule))
    .filter((v) => v !== null);
  return (
    <section data-player-level-preview className="panel space-y-4 p-5">
      <Link to="/app/levels" className="text-primary underline">
        {t("查看成長頁", "View growth page")}
      </Link>
      <h2 className="text-xl font-bold">
        {t("玩家等級 · 本機候選預覽", "Player level · local candidate preview")}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t(
          "非正式等級，不發放獎勵、解鎖或權限；不影響卡牌成長、稀有度與資產。僅以本人曾取得、目前可公開的不同款式重算，不計重複卡或儲值。",
          "Not an official level. No rewards, unlocks or permissions; card growth, rarity and assets stay separate. Recomputed from your acquired distinct, currently public designs, excluding duplicates and spending.",
        )}
      </p>
      <label className="flex flex-wrap items-center gap-3">
        {t("候選規則", "Candidate rule")}
        <select
          className="min-h-11 rounded-md border bg-background p-2"
          value={candidate}
          onChange={(e) => setCandidate(e.target.value === "B" ? "B" : "A")}
        >
          <option value="A">{t("A：每款10 XP", "A: 10 XP per design")}</option>
          <option value="B">
            {t("B：每款10 XP＋完成卡冊25 XP", "B: 10 XP per design + 25 XP per completed album")}
          </option>
        </select>
      </label>
      <p data-level-summary>
        {t("預覽等級", "Preview level")} {value.level} · {value.xp} / {value.cap} XP
      </p>
      <details data-level-rule-comparison className="space-y-3 rounded-xl border p-4">
        <summary className="cursor-pointer font-bold">
          {t("核定用候選影響比較（私人）", "Candidate impact comparison for approval (private)")}
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption>
              {t(
                "同一份目前合法來源，不保存候選值",
                "Same current eligible source; candidate values are not saved",
              )}
            </caption>
            <thead>
              <tr>
                {[
                  t("候選版本", "Candidate version"),
                  "XP",
                  t("原始XP", "Raw XP"),
                  t("預覽階段", "Preview stage"),
                  t("超出上限", "Above cap"),
                ].map((h) => (
                  <th key={h} className="p-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((c) => (
                <tr key={c.ruleVersion}>
                  <th className="p-2 break-all">{c.ruleVersion}</th>
                  <td className="p-2">{c.xp}</td>
                  <td className="p-2">{c.rawXP}</td>
                  <td className="p-2">{c.level}</td>
                  <td className="p-2">{c.cappedXP}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {t("B相較A的目前來源差額", "B versus A difference from current sources")}:{" "}
          {(comparison[1]?.rawXP ?? 0) - (comparison[0]?.rawXP ?? 0)} XP ·{" "}
          {t("目錄版本", "Catalogue version")}: {value.catalogueVersion}
        </p>
        <p>
          {t(
            "重複卡不計；款式隱藏後同源重算。上限案例依本候選每100 XP一階、1900 XP上限：0→1階、100→2階、1900→20階、2000→20階並排除100 XP。案例不是本人資產或正式政策。",
            "Duplicates do not count; hidden designs trigger recomputation from the same source. Candidate cap examples (100 XP per stage, 1900 XP cap): 0→stage 1, 100→2, 1900→20, 2000→20 with 100 XP excluded. Examples are neither your assets nor official policy.",
          )}
        </p>
      </details>
      <p>
        {t("不同款式", "Distinct designs")}: {value.designs} · {t("完成卡冊", "Completed albums")}:{" "}
        {value.albums}
      </p>
      <p className="text-sm">
        {value.ruleVersion} · {t("目錄版本", "Catalogue version")} {value.catalogueVersion}
      </p>
      <p className="text-sm">
        {t(
          "每100 XP一階，上限20階；超出預覽上限",
          "One stage per 100 XP, capped at stage 20; XP above the preview cap",
        )}
        : {value.cappedXP}
      </p>
      <details>
        <summary className="min-h-11 cursor-pointer py-3">
          {t("來源明細與補算說明", "Source details and recalculation")}
        </summary>
        <p className="py-3 text-sm">
          {t(
            "依目前公開目錄重算，不補寫事件。下架、遮蔽或規則切換可能改變預覽；不改歷史取得與成就快照。",
            "Recomputed against the current public catalogue without backfilling events. Withdrawal, visibility or candidate changes may affect the preview; acquisition and achievement snapshots stay intact.",
          )}
        </p>
        {!value.sources.length ? (
          <p>{t("目前沒有有效的公開取得來源。", "No valid public acquisition sources yet.")}</p>
        ) : (
          <ul className="space-y-2">
            {value.sources.map((s) => (
              <li key={s.kind + s.id}>
                {s.kind === "design"
                  ? me.acquiredCards.find((c) => c.cardId === s.id)?.name
                  : me.progress.find((p) => p.poolId === s.id)?.title[
                      t("zh-TW", "en") as "zh-TW" | "en"
                    ]}{" "}
                · {s.xp} XP
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
