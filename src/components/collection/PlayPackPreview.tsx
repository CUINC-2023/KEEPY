import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { useLocalTest, localApi, localSessionGeneration } from "@/lib/local-test-client";
import type { PlayContentPack } from "@/lib/play-packs.mjs";
export function PlayPackPreview() {
  const t = useDiscoveryText(),
    { locale } = useLocale(),
    local = useLocalTest(),
    official = local.enabled && local.summary?.user.role === "official",
    scope = String(localSessionGeneration()) + local.summary?.user.id,
    [data, setData] = useState<{
      scope: string;
      packs: (PlayContentPack & { issues: string[] })[];
    } | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0),
    [selected, setSelected] = useState(""),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    [previewed, setPreviewed] = useState(""),
    [previewBusy, setPreviewBusy] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    setData(null);
    setError(false);
    setSelected("");
    setAnswers({});
    setPreviewed("");
    setPreviewBusy(false);
    if (official)
      void localApi<{ packs: (PlayContentPack & { issues: string[] })[] }>(
        "/admin/play/packs",
        undefined,
        "GET",
        undefined,
        c.signal,
      )
        .then((v) => {
          if (!c.signal.aborted) setData({ scope, packs: v.packs });
        })
        .catch(() => {
          if (!c.signal.aborted) setError(true);
        });
    return () => c.abort();
  }, [official, scope, retry]);
  if (!official) return null;
  const packs = data?.scope === scope ? data.packs : [],
    pack = packs.find((p) => p.id === selected);
  return (
    <section data-play-pack-preview className="play-surface panel space-y-4 p-4">
      <h2 className="text-xl font-bold">
        {t(
          "可玩內容包：官方示意題組預覽",
          "Playable content packs: official sample question preview",
        )}
      </h2>
      <p>
        {t(
          "獨立虛構範本，題目指向版號與章節；網站只限本機示意，社群／印製權未確認。檢查不是發布核准，不給本人持卡或正式XP。",
          "Independent fictional templates, with versioned chapter sources. Website use is local-sample-only; social/print rights remain unconfirmed. Checks do not approve publication or grant holdings or official XP.",
        )}
      </p>
      {error ? (
        <div role="alert">
          <p>
            {t(
              "題組來源服務失敗，舊資料清空。",
              "Question source service failed; old data cleared.",
            )}
          </p>
          <Button onClick={() => setRetry((n) => n + 1)}>
            {t("重讀題組", "Reload question packs")}
          </Button>
        </div>
      ) : !data ? (
        <p role="status">{t("讀取官方題組中…", "Loading official packs…")}</p>
      ) : (
        <label>
          {t("題組範本", "Question pack")}{" "}
          <select
            aria-label="Official play pack"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setAnswers({});
            }}
          >
            <option value="">{t("選擇後預覽", "Select to preview")}</option>
            {packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title[locale]}
              </option>
            ))}
          </select>
        </label>
      )}
      {pack && (
        <div data-play-pack-details>
          <Button
            disabled={previewBusy}
            onClick={async () => {
              const epoch = localSessionGeneration();
              setPreviewBusy(true);
              try {
                await localApi(
                  "/admin/play/preview?id=" +
                    encodeURIComponent(pack.id) +
                    "&version=" +
                    pack.version,
                );
                if (epoch === localSessionGeneration()) setPreviewed(pack.id + ":" + pack.version);
              } catch {
                if (epoch === localSessionGeneration()) {
                  setData(null);
                  setError(true);
                }
              } finally {
                if (epoch === localSessionGeneration()) setPreviewBusy(false);
              }
            }}
          >
            {t("核對指定題組版本", "Check the specified question-pack version")}
          </Button>
          {previewed === pack.id + ":" + pack.version && (
            <p role="status">
              {t(
                "此指定版本已核對，未核准發布。",
                "Specified version checked; publication is not approved.",
              )}
            </p>
          )}
          <p>
            {pack.id} · v{pack.version} ·{" "}
            {pack.issues.length
              ? pack.issues.join(" / ")
              : t("必要示意欄位完整（未發布）", "Required sample fields complete (unpublished)")}
          </p>
          <p>{pack.source[locale]}</p>
          {pack.puzzleMaterials && (
            <section data-pack-puzzle-materials className="space-y-3">
              <h3 className="font-bold">
                {t(
                  "拼圖素材示意（不啟用玩家題庫）",
                  "Puzzle material samples (do not activate player banks)",
                )}
              </h3>
              {pack.puzzleMaterials.map((m) => (
                <figure key={m.id} className="max-w-xs space-y-2">
                  <div
                    role="img"
                    aria-label={m.alt[locale]}
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${m.size},minmax(0,1fr))` }}
                  >
                    {Array.from({ length: m.size * m.size }, (_, i) => (
                      <span
                        key={i}
                        aria-hidden="true"
                        className={
                          "aspect-square rounded " + (i % 2 ? "bg-primary/50" : "bg-primary")
                        }
                      />
                    ))}
                  </div>
                  <figcaption>
                    {m.id} · {m.size}×{m.size} · {m.sourceRef.templateId} v{m.sourceRef.version} ·{" "}
                    {t("僅本機示意用途", "Local sample use only")}
                  </figcaption>
                </figure>
              ))}
            </section>
          )}
          {pack.questions.map((q) => (
            <article key={q.id} className="space-y-3 border-t py-4">
              <h3 className="font-bold">{q.prompt[locale]}</h3>
              <p>
                {q.mode} / {q.difficulty} · {q.sourceRef.templateId} v{q.sourceRef.version} /{" "}
                {q.sourceRef.chapter}
              </p>
              {q.material.ref === "geometry-circles" && (
                <div
                  className="flex flex-wrap gap-3"
                  aria-label={t("合法幾何示意素材", "Eligible geometric sample material")}
                >
                  {Array.from({ length: q.material.count }, (_, i) => (
                    <span key={i} aria-hidden="true" className="h-8 w-8 rounded-full bg-primary" />
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {q.options.map((o) => (
                  <Button
                    key={o.id}
                    variant="outline"
                    aria-pressed={answers[q.id] === o.id}
                    onClick={() => setAnswers({ ...answers, [q.id]: o.id })}
                  >
                    {o.label[locale]}
                  </Button>
                ))}
              </div>
              {answers[q.id] && (
                <p role="status">
                  {answers[q.id] === q.answer
                    ? t("此示意答案符合來源。", "This sample answer matches its source.")
                    : t("請核對來源解答。", "Check the source answer.")}{" "}
                  {q.explanation[locale]}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
