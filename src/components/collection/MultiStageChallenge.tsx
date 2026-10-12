import { useState } from "react";
import type { CollectionMe, CollectionCatalogue } from "@/lib/collection-store";
import { refreshCollectionMe } from "@/lib/collection-store";
import { discoveryCommand, retryDiscoveryCommand } from "@/lib/discovery-store";
import { previewMultiStage } from "@/lib/multi-stage-challenge.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { Button } from "@/components/ui/button";
export function MultiStageChallenge({
  me,
  catalogue,
}: {
  me: CollectionMe;
  catalogue: CollectionCatalogue;
}) {
  const t = useDiscoveryText(),
    value = previewMultiStage(me, catalogue),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!value) return null;
  const save = async (retry = false) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (retry) await retryDiscoveryCommand("/collection/profile");
      else
        await discoveryCommand("/collection/profile", {
          expectedVersion: me.profile.version,
          data: { ...me.profile.data, journeyPaused: !value.paused },
        });
      await refreshCollectionMe();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      id="collection-multi-stage-challenge"
      data-multi-stage-challenge
      className="panel space-y-4 p-5"
    >
      <h2 className="text-xl font-bold">
        {t("多階段私人挑戰 · 無獎預覽", "Multi-stage private challenge · no-reward preview")}
      </h2>
      <p>
        {t(
          "選擇目前公開目標→曾取得其中不同款式→完成目前公開分母。前置階段須符合；重複卡不推進。來源或公開範圍失效即重算，不保存正式完成事件。",
          "Choose current public goals → acquire distinct designs within them → complete the current public denominator. Prerequisites must be met; duplicates do not advance progress. Invalid sources or visibility changes trigger recomputation, without official completion events.",
        )}
      </p>
      <p role="status">
        {value.paused
          ? t(
              "已暫停私人導覽，續作後依當前來源重算。",
              "Private guidance paused; resuming recomputes current sources.",
            )
          : t("私人導覽啟用", "Private guidance active")}{" "}
        · {value.ruleVersion}
      </p>
      <ol className="space-y-2">
        {value.stages.map((s, n) => (
          <li key={s.id}>
            {n + 1}.{" "}
            {s.id === "select"
              ? t("保存合法卡冊目標", "Save eligible album goals")
              : s.id === "acquire"
                ? t("取得目標的不同款式", "Acquire distinct goal designs")
                : t("回顧目前完成卡冊", "Revisit currently completed albums")}{" "}
            ·{" "}
            {s.met
              ? t("目前來源符合", "Current sources meet this stage")
              : s.prerequisite && !value.stages.find((p) => p.id === s.prerequisite)?.met
                ? t("前置階段尚未符合", "Prerequisite not met")
                : t("目前來源未符合", "Current sources do not meet this stage")}
          </li>
        ))}
      </ol>
      <p className="text-sm">
        {t(
          "條件可能因下架、隱藏或目標調整而失效；不是抽卡保證或新成就。暫停偏好保存在本機SQLite，只供本人，不是雲端同步。",
          "Conditions can become invalid after withdrawal, hiding or changed goals; this is not a draw guarantee or new achievement. Pause preferences are saved in local SQLite for you only, without cloud sync.",
        )}
      </p>
      <Button disabled={busy} onClick={() => void save()}>
        {value.paused
          ? t("續作私人挑戰", "Resume private challenge")
          : t("暫停私人挑戰", "Pause private challenge")}
      </Button>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <p>
            {t(
              "衝突請重讀來源；回應丟失只確認原key，不新增重複操作。",
              "Reload sources after a conflict; confirm a lost response with the original key, without a new operation.",
            )}
          </p>
          <Button disabled={busy} onClick={() => void save(true)}>
            {t("確認原操作", "Confirm original operation")}
          </Button>
        </div>
      )}
    </section>
  );
}
