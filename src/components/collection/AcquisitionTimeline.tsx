import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { CollectionMe } from "@/lib/collection-store";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useDiscoveryText } from "@/lib/discovery-copy";

export function AcquisitionTimeline({ me }: { me: CollectionMe }) {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    [source, setSource] = useState("all");
  const rows = (me.recent ?? []).filter((e) => source === "all" || e.source === source);
  const days = [
    ...new Set(
      rows.map((e) => new Date(e.at).toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" })),
    ),
  ];
  return (
    <section data-acquisition-timeline className="space-y-3">
      <h3 className="font-bold">{t("私人取得年表", "Private acquisition timeline")}</h3>
      <p className="text-sm text-muted-foreground">
        {t(
          "僅目前公開款式的最近10筆合法取得，非完整歷史；時間依台北分段。篩選不改取得來源或持卡。",
          "The latest 10 valid acquisitions of currently public designs, not a complete history. Grouped in Taipei time; filtering does not alter sources or holdings.",
        )}
      </p>
      <label>
        {t("紀錄來源", "Record source")}{" "}
        <select
          aria-label="Acquisition source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="all">{t("全部", "All")}</option>
          {[...new Set((me.recent ?? []).map((e) => e.source))].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {!rows.length && (
        <p>{t("此範圍沒有可顯示紀錄。", "No displayable records in this range.")}</p>
      )}
      {days.map((day) => (
        <section key={day} className="space-y-2">
          <h4 className="font-bold">{day}</h4>
          <ol className="space-y-2">
            {rows
              .filter(
                (e) =>
                  new Date(e.at).toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" }) === day,
              )
              .map((e, n) => {
                const card = me.acquiredCards.find((c) => c.cardId === e.cardId);
                return card ? (
                  <li key={e.at + ":" + e.cardId + ":" + n} className="break-words">
                    <time dateTime={e.at}>
                      {new Date(e.at).toLocaleTimeString(locale, { timeZone: "Asia/Taipei" })}
                    </time>{" "}
                    · {card.name} · {e.source} ·{" "}
                    <Link
                      className="text-primary underline"
                      to="/app/album/$poolId"
                      params={{ poolId: card.poolId }}
                    >
                      {t("本人卡冊", "Your album")}
                    </Link>
                  </li>
                ) : null;
              })}
          </ol>
        </section>
      ))}
      {me.awards.filter((a) => a.type === "series").length > 0 && (
        <details>
          <summary>{t("已有卡冊里程碑紀錄", "Existing album milestone records")}</summary>
          <ul>
            {me.awards
              .filter((a) => a.type === "series")
              .map((a) => (
                <li key={a.id}>
                  {a.title[locale]} ·{" "}
                  <time dateTime={a.recordedAt}>
                    {new Date(a.recordedAt).toLocaleString(locale, { timeZone: "Asia/Taipei" })}
                  </time>{" "}
                  · v{a.ruleVersion}
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}
