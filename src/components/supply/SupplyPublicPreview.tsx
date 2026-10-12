import { useEffect, useRef, useState } from "react";
import { DiscoveryEntry } from "@/components/content/DiscoveryContent";
import type { DiscoveryItem } from "@/lib/content-store";
import { localApi, localTestState } from "@/lib/local-test-client";
import type { SupplyValue } from "@/lib/supply-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import { Button } from "@/components/ui/button";
interface Preview {
  actorId: string;
  serverTime: string;
  source: { documentVersion: number; revision: number | null; kind: string };
  period: string;
  issues: string[];
  items: DiscoveryItem[];
  publicationEligible: boolean;
  impact: {
    publishedRevision: number | null;
    reasons: string[];
    entries: { id: string; kind: string; change: string; fields: string[]; href: string }[];
  };
}
export function SupplyPublicPreview({
  actor,
  official,
  id,
  version,
  revision,
  value,
  dirty,
}: {
  actor: string | undefined;
  official: boolean;
  id: string;
  version: number;
  revision: string;
  value: SupplyValue;
  dirty: boolean;
}) {
  const t = useDiscoveryText(),
    { locale } = useLocale();
  const working = !official && revision === "working";
  const body = {
    id,
    expectedVersion: version,
    revision: working ? null : Number(revision),
    value: working ? value : null,
  };
  const stamp = JSON.stringify([actor, official, body]);
  const latest = useRef(stamp);
  latest.current = stamp;
  const generation = useRef(0),
    [result, setResult] = useState<{ stamp: string; data: Preview } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState("");
  const data = result?.stamp === stamp && result.data.actorId === actor ? result.data : null;
  useEffect(() => {
    generation.current++;
    setResult(null);
    setError("");
    setBusy(false);
  }, [stamp]);
  const load = async () => {
    const run = ++generation.current;
    setResult(null);
    setError("");
    setBusy(true);
    try {
      const response = await localApi<Preview>(
        official ? "/admin/supply/preview" : "/supply/preview",
        body,
      );
      if (
        run === generation.current &&
        latest.current === stamp &&
        localTestState().summary?.user.id === actor &&
        response.actorId === actor
      ) {
        setResult({ stamp, data: response });
        setSelected(response.items[0]?.id ?? "");
      }
    } catch (e) {
      if (run === generation.current && latest.current === stamp) setError(String(e));
    } finally {
      if (run === generation.current) setBusy(false);
    }
  };
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  useEffect(() => {
    if (!data) return;
    const ends = data.items.map((i) => Date.parse(i.withdrawAt)).filter(Number.isFinite);
    const remaining = ends.length
      ? Math.max(1, Math.min(...ends) - Date.parse(data.serverTime) + 1)
      : 30000;
    const timer = window.setTimeout(
      () => {
        setResult(null);
        void load();
      },
      Math.min(30000, remaining),
    );
    return () => clearTimeout(timer);
    // The stamp captures the exact actor/input; every read clears prior results before retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, stamp]);
  const item = data?.items.find((i) => i.id === selected) ?? data?.items[0];
  return (
    <section className="panel space-y-3 p-4" data-supply-public-preview>
      <h2 className="font-semibold">{t("整包公開呈現預覽", "Package publication preview")}</h2>
      <p>
        {working && dirty
          ? t(
              "本人未保存草稿，只作私人預覽；不送審、不提供官方讀取。",
              "Own unsaved draft, private preview only; not submitted or available to officials.",
            )
          : working
            ? t(
                "本人目前編輯的私人預覽，並非發布。",
                "Private preview of your current editor; not publication.",
              )
            : t(
                "服務端已保存指定版本的私人預覽。",
                "Private preview of the specified server-saved revision.",
              )}
      </p>
      <p className="text-sm text-muted-foreground">
        {t(
          "使用服務端當前時間與正式投影；不改公開內容、不授予素材或抽卡權利。來源修改會清除預覽；已開啟時每30秒及期限邊界重新確認。",
          "Uses current server time and the publication projection. It does not change public content or grant material/draw rights. Editing clears preview; open previews recheck every 30 seconds and at expiry.",
        )}
      </p>
      <Button variant="outline" disabled={busy} onClick={() => void load()}>
        {busy
          ? t("讀取預覽中…", "Loading preview…")
          : t("讀取／重試整包預覽", "Read / retry package preview")}
      </Button>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <section
            data-season-package-preview
            className="space-y-3 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-background p-4"
          >
            <h3 className="font-bold">
              {t(
                "賽季內容包 · 指定來源閱讀預覽",
                "Season content package · specified-source reading preview",
              )}
            </h3>
            <p className="text-sm">
              {t("來源保存版本", "Source document version")}: {data.source.documentVersion} ·{" "}
              {t("指定內容版", "Content revision")}:{" "}
              {data.source.revision ?? t("本人未保存", "Own unsaved draft")} · {data.period}
            </p>
            <p>
              {t(
                "依服務端當前合法投影整理主題故事與文章順序；到期、撤下或缺權利的內容不補造。預覽不是賽季結算、復刻、獎勵、正式素材授權或發布承諾。",
                "Theme stories and article order follow the current server-authorized projection. Expired, withdrawn or unauthorized content is not invented. Preview grants no season settlement, rerun policy, reward, formal material rights or publication promise.",
              )}
            </p>
            {data.items.length ? (
              <ol className="space-y-3">
                {data.items.map((entry) => (
                  <li key={entry.id} className="break-words">
                    <h4 className="font-bold">{entry.copy.title[locale]}</h4>
                    <p>{entry.copy.summary[locale]}</p>
                    <p className="text-xs">
                      {t("公開起迄（台北時間）", "Publication period (Taipei time)")}:{" "}
                      {[entry.releaseAt, entry.withdrawAt]
                        .map((at) =>
                          Number.isFinite(Date.parse(at))
                            ? new Date(at).toLocaleString(locale, { timeZone: "Asia/Taipei" })
                            : t("尚未設定", "Not set"),
                        )
                        .join(" → ")}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>
                {t(
                  "此指定來源目前沒有可見內容，不以舊快照替代。",
                  "No currently visible content from this source; old snapshots are not substituted.",
                )}
              </p>
            )}
          </section>
          <section data-publication-impact className="space-y-2 rounded-lg border p-3">
            <h3 className="font-bold">{t("指定版公開影響", "Specified revision impact")}</h3>
            <p>
              {t("目前公開保存版", "Current published revision")} v
              {data.impact.publishedRevision ?? "—"} →{" "}
              {data.source.revision === null
                ? t("本人未保存預覽", "Own unsaved preview")
                : "v" + data.source.revision}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(
                "比較當前可見投影，並非發布承諾；到期與隱藏項不列入口。讀取不更動發布快照。",
                "Compares currently visible projections, not a publication promise. Expired and hidden entries have no entrance. Reading preserves publication snapshots.",
              )}
            </p>
            {data.impact.reasons.length > 0 && (
              <ul>
                {data.impact.reasons.map((reason) => (
                  <li key={reason}>
                    {t(
                      {
                        upcoming: "尚未公開",
                        expired: "內容已到期",
                        invalid: "期間無效",
                        requirements: "必要缺項／素材示意用途尚未確認",
                        approval: "需指定保存版核准／重新審核",
                        "public-visibility": "公開範圍遮蔽",
                      }[reason] ?? reason,
                      reason,
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!data.impact.entries.length ? (
              <p>
                {t("目前沒有可見的公開入口。", "There are no currently visible public entrances.")}
              </p>
            ) : (
              <ul className="space-y-2">
                {data.impact.entries.map((entry) => (
                  <li key={entry.id} className="break-words">
                    <span>
                      {entry.kind} · {entry.id} ·{" "}
                      {t(
                        {
                          added: "新增",
                          removed: "不再呈現",
                          changed: "修改",
                          unchanged: "無欄位差異",
                        }[entry.change] ?? entry.change,
                        entry.change,
                      )}
                    </span>
                    {entry.fields.length > 0 && (
                      <p className="text-sm">{entry.fields.join(" · ")}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {entry.href} · /explore ·{" "}
                      {t(
                        "首頁關聯入口以當前發布來源為準。",
                        "Home links follow the current published source.",
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p role="status">
            {t("期間／指定保存版本", "Period / specified saved revision")}:{" "}
            {t(
              {
                current: "目前期間",
                upcoming: "尚未到公開期間",
                expired: "內容已到期",
                invalid: "期間無效",
              }[data.period] ?? data.period,
              data.period,
            )}{" "}
            · {data.source.revision === null ? t("未保存", "Unsaved") : "v" + data.source.revision}{" "}
            ·{" "}
            {data.publicationEligible
              ? t(
                  "內容核准版本符合發布檢查，仍需官方發布。",
                  "Approved content revision meets publication checks; official publication still required.",
                )
              : t(
                  "尚非可直接發布版本；預覽不代表核准。",
                  "Not a publishable approved revision; preview is not approval.",
                )}
          </p>
          {data.issues.length > 0 && (
            <ul data-preview-issues>
              {data.issues.map((issue) => (
                <li key={issue}>
                  {t("必要缺項", "Required missing item")}: {issue}
                </li>
              ))}
            </ul>
          )}
          {!data.items.length ? (
            <p data-preview-empty>
              {t(
                "目前規則下沒有可公開呈現的項目；請確認期間、缺項與公開範圍。",
                "No items can be publicly presented under current rules. Check the period, missing requirements and visibility.",
              )}
            </p>
          ) : (
            <>
              <nav
                aria-label={t("整包預覽項目", "Package preview entries")}
                className="flex flex-wrap gap-2"
                data-preview-entries
              >
                {data.items.map((i) => (
                  <Button
                    key={i.id}
                    variant="outline"
                    aria-pressed={i.id === item?.id}
                    onClick={() => setSelected(i.id)}
                  >
                    {t(
                      { series: "系列", creator: "創作者", article: "文章", home: "首頁" }[i.kind],
                      i.kind,
                    )}{" "}
                    · {i.copy.title[locale]}
                  </Button>
                ))}
              </nav>
              {item && (
                <DiscoveryEntry
                  item={item}
                  detail
                  previewItems={data.items}
                  onPreviewNavigate={(i) => setSelected(i.id)}
                />
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
