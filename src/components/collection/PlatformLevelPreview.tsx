import { useParticipation } from "@/lib/participation-store";
import { previewPlatformLevel } from "@/lib/platform-level-preview.mjs";
import type { CollectionMe } from "@/lib/collection-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { ProgressiveDetails } from "@/components/ui/progressive-details";
export function PlatformLevelPreview({ me }: { me: CollectionMe }) {
  const d = useParticipation(),
    t = useDiscoveryText();
  const value = d.me && d.data && !d.error && !d.meError && previewPlatformLevel(d.me, me, d.data);
  return (
    <section className="panel space-y-3 p-5" data-platform-level-preview>
      <h2 className="text-xl font-bold">
        {t(
          "平台參與 · 獨立本機候選預覽",
          "Platform participation · separate local candidate preview",
        )}
      </h2>
      <p className="text-sm text-muted-foreground">
        {t(
          "每種有效既有任務只計一次，最多4種，不計點擊、登入或儲值。與收藏XP、卡牌成長與管理權限分開，不發獎或授予角色。",
          "Each valid existing task type counts once, capped at four. Clicks, logins and spending do not count. Separate from collection XP, card growth and permissions; no rewards or roles are granted.",
        )}
      </p>
      {d.error || d.meError ? (
        <p role="alert">
          {t(
            "參與來源讀取失敗，預覽已清空。",
            "Participation sources failed to load; the preview is cleared.",
          )}
        </p>
      ) : !value ? (
        <p role="status">{t("等待本人參與來源…", "Waiting for your participation sources…")}</p>
      ) : (
        <>
          <p data-platform-stage>
            {t("預覽階段", "Preview stage")}: {value.stage} / {value.cap}
          </p>
          <p className="text-sm">
            {value.ruleVersion} · {t("參與來源版本", "Participation source version")}:{" "}
            {value.participationVersion}
          </p>
          <details data-platform-source-reasons className="space-y-3 rounded border p-3">
            <summary>
              {t(
                "來源分類、失效原因與規則比較",
                "Source categories, invalidation and rule comparison",
              )}
            </summary>
            <dl className="grid gap-3 sm:grid-cols-2" data-platform-rule-comparison>
              <div>
                <dt>{t("A：既有候選每類一階", "A: existing candidate, one stage per type")}</dt>
                <dd>{value.stage}/4 · platform-preview-v1</dd>
              </div>
              <div>
                <dt>
                  {t("B：兩類一階的比較提案", "B: comparison proposal, one stage per two types")}
                </dt>
                <dd>{Math.floor(value.completed / 2)}/2 · platform-paired-stage-preview-v1</dd>
              </div>
            </dl>
            <p>
              {t(
                "B只供本機核定比較，不保存或取代A；公開摘要仍按本人明確選擇與既有A來源，兩案皆不授權、不發獎。",
                "B is a local approval comparison only; it is not saved and does not replace A. Public summaries retain explicit owner choices and existing A sources. Neither proposal grants permissions or rewards.",
              )}
            </p>

            <p>
              {t(
                "候選階段規則與任務歷史快照版本是不同欄位；保留舊快照，不直接改成目前規則。僅按目前合法事實重算，四類各至多一次，不授予角色。",
                "Candidate-stage rules and historical task snapshot versions are separate fields. Old snapshots are preserved, never rewritten as current rules. Recompute only current eligible facts, each of four types at most once, without role grants.",
              )}
            </p>
            <ul>
              {value.reasons.map((r) => (
                <li key={r.id}>
                  {r.id} ·{" "}
                  {r.code === "no-valid-snapshot"
                    ? t("沒有可核對的本人完成快照", "No verifiable own completion snapshot")
                    : r.code === "not-currently-public"
                      ? t("目前條件未公開或已停用", "Condition not currently public or disabled")
                      : t(
                          "目前合法來源不符合舊完成紀錄的參考條件",
                          "Current eligible sources do not meet the reference condition",
                        )}{" "}
                  · {t("舊快照版本", "Old snapshot version")}: {r.snapshotVersion ?? "—"}
                </li>
              ))}
            </ul>
            {!value.reasons.length && (
              <p>
                {t(
                  "目前四類來源皆符合候選參考條件。",
                  "All four current source types meet candidate reference conditions.",
                )}
              </p>
            )}
          </details>
          <ProgressiveDetails summary={t("有效參與來源明細", "Eligible participation sources")}>
            {!value.sources.length ? (
              <p>
                {t(
                  "目前沒有符合候選條件的完成來源。",
                  "No completed sources meet the candidate conditions yet.",
                )}
              </p>
            ) : (
              <ul className="space-y-2">
                {value.sources.map((s) => (
                  <li key={s.id}>
                    {
                      d.data?.tasks.find((task) => task.id === s.id)?.title[
                        t("zh-TW", "en") as "zh-TW" | "en"
                      ]
                    }{" "}
                    · {t("任務快照版本", "Task snapshot version")} {s.ruleVersion}
                  </li>
                ))}
              </ul>
            )}
          </ProgressiveDetails>
          <p className="text-sm">
            {t(
              "歷史任務快照與目前公開來源共同核對；停用、下架或遮蔽後重算，不改正式等級或歷史紀錄。",
              "Historical task snapshots are checked against current public sources. Disabling, withdrawal or visibility changes trigger recalculation without changing official levels or history.",
            )}
          </p>
        </>
      )}
    </section>
  );
}
