import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import {
  useLocalTest,
  localApi,
  localSessionGeneration,
  localTestState,
} from "@/lib/local-test-client";
import { useLocalHead, useParticipation } from "@/lib/content-store";
import { discoveryCommand, retryDiscoveryCommand } from "@/lib/discovery-store";
import { refreshCollectionMe } from "@/lib/collection-store";
import {
  sendParticipation,
  retryParticipation,
  refreshParticipation,
  refreshParticipationMe,
  type ParticipationAdmin,
  type RoundValue,
  type ActivityValue,
} from "@/lib/participation-store";
function feedbackScope(actor: string | undefined) {
  const epoch = localSessionGeneration();
  return () =>
    !!actor &&
    epoch === localSessionGeneration() &&
    localTestState().enabled &&
    localTestState().summary?.user.id === actor;
}
export function ParticipationNotice() {
  const t = useDiscoveryText();
  return (
    <p className="text-sm text-muted-foreground">
      {t(
        "本機測試 · 示意企劃與帳號。票選是企劃參考，不承諾合作或上架。任務及活動不發放正式 KP 或卡牌。",
        "Local Test · Sample concepts and synthetic accounts. Voting informs planning, without collaboration or release promises. Tasks and activities issue no real KP or cards.",
      )}
    </p>
  );
}
function Status() {
  const d = useParticipation(),
    t = useDiscoveryText();
  return d.error || d.meError ? (
    <div role="alert" className="panel p-4">
      <p>{t("參與資料暫時無法載入。", "Participation unavailable.")}</p>
      <Button
        onClick={() => {
          void refreshParticipation();
          void refreshParticipationMe();
        }}
      >
        {t("重試", "Retry")}
      </Button>
    </div>
  ) : !d.loaded ? (
    <p role="status">{t("載入中…", "Loading…")}</p>
  ) : null;
}
function Period({ startAt, endAt }: { startAt: string; endAt: string }) {
  const t = useDiscoveryText();
  return (
    <p className="text-xs text-muted-foreground">
      {t("期間（含開始，不含結束）", "Period (start included, end excluded)")}:{" "}
      <time dateTime={startAt}>{startAt}</time> → <time dateTime={endAt}>{endAt}</time>
    </p>
  );
}
function State({ value }: { value: string }) {
  const t = useDiscoveryText();
  return (
    <span className="demo-chip">
      {value === "open"
        ? t("進行中", "Open")
        : value === "upcoming"
          ? t("即將開始", "Upcoming")
          : t("已結束", "Ended")}
    </span>
  );
}
function RoundPanel({
  round,
}: {
  round: NonNullable<ReturnType<typeof useParticipation>["data"]>["rounds"][number];
}) {
  const d = useParticipation(),
    { locale } = useLocale(),
    t = useDiscoveryText();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [name, setName] = useState(""),
    [url, setUrl] = useState(""),
    [reason, setReason] = useState("");
  useEffect(() => {
    setName("");
    setUrl("");
    setReason("");
    setMessage("");
    setBusy(false);
  }, [d.me?.actorId]);
  const mine = d.me?.votes.filter((v) => v.round_id === round.id) ?? [],
    rec = d.me?.recommendations.find((r) => r.round_id === round.id);
  const action = async (body: unknown) => {
    if (busy || !d.me) return;
    const current = feedbackScope(d.me.actorId);
    setBusy(true);
    setMessage("");
    try {
      await sendParticipation(body);
      if (!current()) return;
      setMessage(
        t("已記錄；本輪額度以保存資料為準。", "Recorded; your saved round quota applies."),
      );
    } catch (e) {
      if (current()) setMessage(String(e));
    } finally {
      if (current()) setBusy(false);
    }
  };
  return (
    <article className="panel space-y-4 p-4" data-round-id={round.id}>
      <State value={round.state} />
      <h2 className="text-xl font-bold">{round.title[locale]}</h2>
      <p>{round.summary[locale]}</p>
      <Period {...round} />
      <p>
        {t("每帳號本輪額度", "Per-account round limit")}: {round.limit}
      </p>
      {round.kind === "theme" ? (
        <div className="space-y-2">
          {round.options.map((o) => (
            <Button
              className="mr-2"
              key={o.id}
              aria-pressed={mine.some((v) => v.option_id === o.id)}
              disabled={!d.me || busy || round.state !== "open" || mine.length >= round.limit}
              onClick={() => void action({ action: "vote", roundId: round.id, optionId: o.id })}
            >
              {o.title[locale]} {mine.some((v) => v.option_id === o.id) && t("（已投）", "(voted)")}
            </Button>
          ))}
        </div>
      ) : rec ? (
        <div className="space-y-2">
          <p>
            {t("本人推薦", "My recommendation")}: {rec.name}
          </p>
          <p>
            {rec.status === "pending"
              ? t("待官方審核", "Awaiting official review")
              : rec.status === "approved"
                ? t("已核准作企劃參考", "Approved for planning")
                : t("未通過審核", "Rejected")}
          </p>
          <p className="break-words">{rec.reviewNote}</p>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void action({ action: "recommend", roundId: round.id, name, url, reason });
          }}
        >
          <fieldset disabled={!d.me || busy || round.state !== "open"} className="space-y-3">
            <label className="block">
              {t("公開創作者名稱", "Public creator name")}
              <input
                aria-label="Recommendation name"
                className="block w-full rounded border p-2"
                maxLength={100}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="block">
              {t("公開來源連結（選填 HTTPS）", "Public source link (optional HTTPS)")}
              <input
                aria-label="Recommendation URL"
                className="block w-full rounded border p-2"
                type="url"
                maxLength={500}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
            <label className="block">
              {t("推薦理由，不含私人聯絡資料", "Reason, without private contact details")}
              <textarea
                aria-label="Recommendation reason"
                className="block w-full rounded border p-2"
                maxLength={1500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <Button type="submit">{t("送交官方審核", "Submit for official review")}</Button>
          </fieldset>
        </form>
      )}
      {!d.me && (
        <p>
          {t("參與前請先選擇本機測試帳號。", "Select a Local Test account before participating.")}
        </p>
      )}
      {round.resultsPublished ? (
        <div>
          <h3 className="font-semibold">
            {t("公開結果（測試資料）", "Published results (test data)")}
          </h3>
          <p>{round.result[locale]}</p>
          {round.counts.map((c) => (
            <p key={c.optionId}>
              {round.options.find((o) => o.id === c.optionId)?.title[locale]}: {c.count}
            </p>
          ))}
          {round.recommendations.map((r, i) => (
            <p key={i}>
              {r.name}{" "}
              {r.url && (
                <a className="underline" href={r.url} target="_blank" rel="noopener noreferrer">
                  {t("公開來源", "Public source")}
                </a>
              )}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-xs">
          {t(
            "結果於輪次結束及官方發布後顯示。",
            "Results appear after the round ends and the official publishes them.",
          )}
        </p>
      )}
      <p role="status">{message}</p>
      {message && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            if (busy || !d.me) return;
            const current = feedbackScope(d.me.actorId);
            setBusy(true);
            try {
              await retryParticipation();
              if (current()) setMessage(t("已確認結果", "Result confirmed"));
            } catch (e) {
              if (current()) setMessage(String(e));
            } finally {
              if (current()) setBusy(false);
            }
          }}
        >
          {t("重試待確認操作", "Retry unconfirmed operation")}
        </Button>
      )}
    </article>
  );
}
export function VotingPage() {
  const d = useParticipation(),
    t = useDiscoveryText();
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">
        {t(
          "下一季參與：主題票選與創作者推薦",
          "Next season: theme votes & creator recommendations",
        )}
      </h1>
      <ParticipationNotice />
      <Status />
      {d.loaded && !d.error && !d.data?.rounds.length && (
        <p>{t("尚無公開輪次。", "No published rounds.")}</p>
      )}
      {d.data?.rounds.map((r) => (
        <RoundPanel key={r.id} round={r} />
      ))}
    </div>
  );
}
function ActivityPanel({
  activity,
  detail = false,
}: {
  activity: NonNullable<ReturnType<typeof useParticipation>["data"]>["activities"][number];
  detail?: boolean;
}) {
  const d = useParticipation(),
    { locale } = useLocale(),
    t = useDiscoveryText(),
    local = useLocalTest();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    setMessage("");
    setBusy(false);
  }, [d.me?.actorId]);
  const claimed = d.me?.claims.find((c) => c.activityId === activity.id),
    readiness = d.me?.activityEligibility.find((a) => a.activityId === activity.id),
    ready = readiness?.conditionMet,
    eligible = readiness?.eligible;
  return (
    <article className="panel space-y-4 p-4" data-activity-id={activity.id}>
      <State value={activity.state} />
      {detail ? (
        <h1 className="text-2xl font-bold">{activity.title[locale]}</h1>
      ) : (
        <h2 className="text-xl font-bold">
          <Link to="/activities/$activityId" params={{ activityId: activity.id }}>
            {activity.title[locale]}
          </Link>
        </h2>
      )}
      <p>{activity.summary[locale]}</p>
      <Period {...activity} />
      <p>
        {t("資格", "Eligibility")}:{" "}
        {activity.eligibility === "account"
          ? t("已登入測試帳號", "Signed-in test account")
          : t("會員測試帳號", "Test member")}
      </p>
      <p>{activity.instructions[locale]}</p>
      <p>
        {t("獎勵", "Reward")}:{" "}
        {activity.rewardKind === "none"
          ? t("不提供資產獎勵", "No asset rewards")
          : t("待核定，不發放資產", "Unapproved; no assets issued")}
      </p>
      <p>
        {t("參與紀錄期限", "Participation record deadline")}:{" "}
        <time dateTime={activity.claimUntil}>{activity.claimUntil}</time>
      </p>
      <p>
        {t(
          "需在活動期間完成條件，由伺服器判斷。",
          "Conditions must be met during the activity period; the server validates them.",
        )}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link className="underline" to="/app/album">
          {t("查看卡冊", "View album")}
        </Link>
        <Link className="underline" to="/app/tasks">
          {t("查看本人任務", "View my tasks")}
        </Link>
        <Link
          className="underline"
          to="/app/collection"
          hash="collection-multi-stage-challenge"
          data-activity-challenge-link
        >
          {t("本人多階段無獎挑戰預覽", "Your multi-stage no-reward challenge preview")}
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        {t(
          "私人挑戰是目前收藏來源的閱讀預覽，不代表活動參與或完成。活動仍依上述期間、既有條件與來源版本判斷；到期不延長、不發新獎勵。",
          "Private challenges preview current collection sources; they do not count as activity participation or completion. Activities retain the stated periods, existing conditions and source versions. Expiry is not extended and no new rewards are issued.",
        )}
      </p>
      {claimed ? (
        <p role="status">
          {t("已記錄參與；未發放 KP 或卡牌。", "Participation recorded; no KP or cards issued.")} ·{" "}
          {t("規則版本", "Rules version")} {claimed.ruleVersion}
        </p>
      ) : (
        <Button
          disabled={!d.me || busy || !eligible || !ready || !readiness?.claimOpen}
          onClick={async () => {
            if (busy || !d.me) return;
            const current = feedbackScope(d.me.actorId);
            setBusy(true);
            try {
              await sendParticipation({ action: "claim", activityId: activity.id });
              if (!current()) return;
              await refreshCollectionMe();
              if (current()) setMessage(t("參與已記錄", "Participation recorded"));
            } catch (e) {
              if (current()) setMessage(String(e));
            } finally {
              if (current()) setBusy(false);
            }
          }}
        >
          {t("記錄活動參與（不發放資產）", "Record participation (no asset rewards)")}
        </Button>
      )}
      <p role="status">{message}</p>
      {message && (
        <Button
          disabled={busy}
          variant="outline"
          onClick={async () => {
            if (busy || !d.me) return;
            const current = feedbackScope(d.me.actorId);
            setBusy(true);
            try {
              await retryParticipation();
              if (!current()) return;
              await refreshCollectionMe();
              if (current()) setMessage(t("已確認結果", "Result confirmed"));
            } catch (e) {
              if (current()) setMessage(String(e));
            } finally {
              if (current()) setBusy(false);
            }
          }}
        >
          {t("重試待確認操作", "Retry unconfirmed operation")}
        </Button>
      )}
      {activity.state === "ended" && (
        <p>
          {t("結果", "Result")}: {activity.result[locale] || t("尚未公布。", "Not published yet.")}
        </p>
      )}
    </article>
  );
}
export function ActivitiesPage() {
  const d = useParticipation(),
    t = useDiscoveryText(),
    [filter, setFilter] = useState("all");
  const rows = d.data?.activities.filter((a) => filter === "all" || a.state === filter) ?? [];
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">{t("活動專區", "Activities")}</h1>
      <ParticipationNotice />
      <Status />
      <label>
        {t("狀態", "Status")}
        <select
          className="ml-2 rounded border p-2"
          aria-label="Activity status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["all", "open", "upcoming", "ended"].map((v, i) => (
            <option key={v} value={v}>
              {t(
                ["全部", "進行中", "即將開始", "已結束"][i]!,
                ["All", "Open", "Upcoming", "Ended"][i]!,
              )}
            </option>
          ))}
        </select>
      </label>
      {d.loaded && !d.error && !rows.length && (
        <p>{t("沒有符合條件的公開活動。", "No matching published activities.")}</p>
      )}
      {rows.map((a) => (
        <ActivityPanel activity={a} key={a.id} />
      ))}
    </div>
  );
}
export function ActivityDetail({ id }: { id: string }) {
  const d = useParticipation(),
    { locale } = useLocale(),
    t = useDiscoveryText(),
    a = d.data?.activities.find((x) => x.id === id);
  useLocalHead(
    (a?.title[locale] ?? t("活動不可用", "Activity unavailable")) + " — KEEPY",
    a?.summary[locale] ?? "Local Test",
  );
  return (
    <div className="space-y-6 p-4 md:p-8">
      <ParticipationNotice />
      <Status />
      {a ? (
        <ActivityPanel activity={a} detail />
      ) : (
        d.loaded &&
        !d.error && (
          <h1>{t("活動尚未發布或已下架。", "This activity is unpublished or withdrawn.")}</h1>
        )
      )}
    </div>
  );
}
export function TasksPage() {
  const d = useParticipation(),
    { locale } = useLocale(),
    t = useDiscoveryText();
  const target = (id: string) =>
    id === "profile"
      ? "/app/settings/privacy"
      : id === "first"
        ? "/pools"
        : id === "album"
          ? "/app/album"
          : "/wish-pools";
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">{t("我的探索任務", "My discovery tasks")}</h1>
      <ParticipationNotice />
      <Status />
      {!d.me ? (
        <p>{t("請先登入本機測試帳號。", "Select a Local Test account first.")}</p>
      ) : (
        d.data?.tasks
          .filter((t) => t.enabled)
          .map((task) => {
            const done = d.me!.tasks.find((t) => t.id === task.id);
            return (
              <article key={task.id} className="panel space-y-3 p-4">
                <h2>{task.title[locale]}</h2>
                <p>
                  {done
                    ? t("已完成，未發放資產", "Completed; no assets issued")
                    : t("尚未完成", "Not completed")}
                </p>
                {done && (
                  <p className="text-xs">
                    {done.completedAt} · {t("規則版本", "Rules version")} {done.ruleVersion}
                  </p>
                )}
                <Link className="underline" to={target(task.id)}>
                  {t("前往相關頁面", "Open related page")}
                </Link>
              </article>
            );
          })
      )}
      <Button variant="outline" onClick={() => void refreshParticipationMe()}>
        {t("刷新任務紀錄", "Refresh task records")}
      </Button>
    </div>
  );
}
const defaultRound: RoundValue = {
  kind: "theme",
  title: { "zh-TW": "新測試票選", en: "New test round" },
  summary: { "zh-TW": "企劃參考，不承諾上架。", en: "Planning reference; no release promise." },
  startAt: "2026-10-01T00:00:00Z",
  endAt: "2026-11-01T00:00:00Z",
  limit: 1,
  options: [
    { id: "opt-a", title: { "zh-TW": "主題 A", en: "Theme A" } },
    { id: "opt-b", title: { "zh-TW": "主題 B", en: "Theme B" } },
  ],
  resultsPublished: false,
  result: { "zh-TW": "", en: "" },
};
const defaultActivity: ActivityValue = {
  title: { "zh-TW": "新測試活動", en: "New test activity" },
  summary: { "zh-TW": "未提供資產獎勵。", en: "No asset rewards." },
  startAt: defaultRound.startAt,
  endAt: defaultRound.endAt,
  claimUntil: "2026-11-08T00:00:00Z",
  eligibility: "account",
  condition: "album",
  instructions: {
    "zh-TW": "活動期間查看卡冊後記錄參與。",
    en: "View your album during the period and record participation.",
  },
  rewardKind: "none",
  result: { "zh-TW": "", en: "" },
};
export function ParticipationAdminPage() {
  const local = useLocalTest(),
    t = useDiscoveryText(),
    { locale } = useLocale();
  const [doc, setDoc] = useState<ParticipationAdmin | null>(null),
    [kind, setKind] = useState<"round" | "activity">("round"),
    [id, setId] = useState("theme-local-020"),
    [value, setValue] = useState<RoundValue | ActivityValue>(defaultRound),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const official = local.enabled && local.summary?.user.role === "official";
  const load = async () => {
    setDoc(null);
    try {
      const d = await localApi<ParticipationAdmin>("/admin/participation");
      setDoc(d);
      return d;
    } catch (e) {
      setMessage(String(e));
      return null;
    }
  };
  useEffect(() => {
    setDoc(null);
    setMessage("");
    setReviewNotes({});
    if (official) void load();
  }, [official, local.summary?.user.id]);
  const rows = doc ? (kind === "round" ? doc.data.rounds : doc.data.activities) : [];
  const selected = rows.find((r) => r.id === id);
  const choose = (nextKind: "round" | "activity", nextId: string) => {
    setKind(nextKind);
    setId(nextId);
    const rows = nextKind === "round" ? doc?.data.rounds : doc?.data.activities;
    setValue(
      structuredClone(
        rows?.find((r) => r.id === nextId)?.draft ??
          (nextKind === "round" ? defaultRound : defaultActivity),
      ),
    );
    setMessage("");
  };
  useEffect(() => {
    if (doc) {
      const r = kind === "round" ? doc.data.rounds : doc.data.activities;
      setValue(
        structuredClone(
          r.find((x) => x.id === id)?.draft ?? (kind === "round" ? defaultRound : defaultActivity),
        ),
      );
    }
  }, [doc, kind, id]);
  const send = async (body: unknown) => {
    setBusy(true);
    try {
      await discoveryCommand("/admin/participation/commands", body);
      await load();
      await refreshParticipation();
      await refreshParticipationMe();
      setMessage(t("已保存新版本", "New version saved"));
    } catch (e) {
      setMessage(String(e));
    } finally {
      setBusy(false);
    }
  };
  if (!official)
    return (
      <div className="p-6">
        <h1>{t("參與營運管理", "Participation management")}</h1>
        <p>
          {t(
            "需要目前有效的本機 official 帳號。",
            "An active Local Test official account is required.",
          )}
        </p>
      </div>
    );
  const change = (key: string, v: unknown) => setValue({ ...value, [key]: v });
  const round = value as RoundValue,
    activity = value as ActivityValue;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold">
        {t("票選、活動與任務管理", "Votes, activities & tasks management")}
      </h1>
      <ParticipationNotice />
      <p role="status">{message}</p>
      <Button disabled={busy} onClick={() => void load()}>
        {t("重新載入", "Reload")}
      </Button>
      {message && (
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await retryDiscoveryCommand("/admin/participation/commands");
              await load();
              await refreshParticipation();
              setMessage(t("已確認保存結果", "Saved result confirmed"));
            } catch (e) {
              setMessage(String(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("重試待確認保存", "Retry unconfirmed save")}
        </Button>
      )}
      {doc && (
        <>
          <p>
            {t("文件版本", "Document version")}: {doc.version}
          </p>
          <fieldset className="panel space-y-4 p-4" disabled={busy}>
            <label>
              {t("管理類型", "Manage type")}
              <select
                aria-label="Participation kind"
                className="ml-2 rounded border p-2"
                value={kind}
                onChange={(e) => {
                  const k = e.target.value as "round" | "activity";
                  choose(
                    k,
                    (k === "round" ? doc.data.rounds : doc.data.activities)[0]?.id ?? "new",
                  );
                }}
              >
                <option value="round">{t("票選／推薦", "Votes / recommendations")}</option>
                <option value="activity">{t("活動", "Activities")}</option>
              </select>
            </label>
            <label className="block">
              {t("項目", "Item")}
              <select
                aria-label="Participation item"
                className="ml-2 rounded border p-2"
                value={selected ? id : "new"}
                onChange={(e) => choose(kind, e.target.value)}
              >
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.draft.title[locale]} · {r.status}
                  </option>
                ))}
                <option value="new">{t("新增", "New")}</option>
              </select>
            </label>
            {!selected && (
              <label className="block">
                {t("新項目 ID（local- 開頭）", "New item ID (starts local-)")}
                <input
                  aria-label="Participation new ID"
                  className="block w-full rounded border p-2"
                  value={id === "new" ? "" : id}
                  onChange={(e) => setId(e.target.value)}
                />
              </label>
            )}
            {kind === "round" && (
              <label className="block">
                {t("輪次類型", "Round type")}
                <select
                  aria-label="Round type"
                  value={round.kind}
                  onChange={(e) =>
                    setValue({
                      ...round,
                      kind: e.target.value as "theme" | "creator",
                      limit: 1,
                      options: e.target.value === "creator" ? [] : defaultRound.options,
                    })
                  }
                >
                  <option value="theme">{t("主題票選", "Theme vote")}</option>
                  <option value="creator">{t("創作者推薦", "Creator recommendation")}</option>
                </select>
              </label>
            )}
            {(["title", "summary", "result"] as const).map((key) =>
              (["zh-TW", "en"] as const).map((lang) => (
                <label className="block" key={key + lang}>
                  {t(
                    key === "title" ? "標題" : key === "summary" ? "說明" : "結果說明",
                    key === "title" ? "Title" : key === "summary" ? "Summary" : "Result",
                  )}{" "}
                  · {lang}
                  <textarea
                    aria-label={key + " " + lang}
                    className="block w-full rounded border p-2"
                    value={value[key][lang]}
                    maxLength={key === "title" ? 150 : 2000}
                    onChange={(e) => change(key, { ...value[key], [lang]: e.target.value })}
                  />
                </label>
              )),
            )}
            {["startAt", "endAt", ...(kind === "activity" ? ["claimUntil"] : [])].map((key) => (
              <label className="block" key={key}>
                {t(
                  key === "startAt" ? "開始時間" : key === "endAt" ? "結束時間" : "參與紀錄期限",
                  key === "startAt" ? "Starts" : key === "endAt" ? "Ends" : "Record deadline",
                )}{" "}
                (ISO + timezone)
                <input
                  aria-label={key}
                  className="block w-full rounded border p-2"
                  value={(value as unknown as Record<string, string>)[key]}
                  onChange={(e) => change(key, e.target.value)}
                />
              </label>
            ))}
            {kind === "round" ? (
              <>
                <label className="block">
                  {t("每帳號本輪額度", "Per-account round limit")}
                  <input
                    aria-label="Round limit"
                    type="number"
                    min={1}
                    max={5}
                    disabled={round.kind === "creator"}
                    value={round.limit}
                    onChange={(e) => change("limit", Number(e.target.value))}
                  />
                </label>
                {round.kind === "theme" && (
                  <fieldset className="space-y-3">
                    <legend>
                      {t("候選選項（已有投票後不得改）", "Options (locked after voting)")}
                    </legend>
                    {round.options.map((o, i) => (
                      <div key={i}>
                        <input
                          aria-label={"Option ID " + i}
                          className="rounded border p-2"
                          value={o.id}
                          onChange={(e) =>
                            change(
                              "options",
                              round.options.map((x, j) =>
                                i === j ? { ...x, id: e.target.value } : x,
                              ),
                            )
                          }
                        />
                        {(["zh-TW", "en"] as const).map((lang) => (
                          <label key={lang} className="block">
                            {lang}
                            <input
                              aria-label={"Option " + i + " " + lang}
                              className="block w-full rounded border p-2"
                              value={o.title[lang]}
                              onChange={(e) =>
                                change(
                                  "options",
                                  round.options.map((x, j) =>
                                    i === j
                                      ? { ...x, title: { ...x.title, [lang]: e.target.value } }
                                      : x,
                                  ),
                                )
                              }
                            />
                          </label>
                        ))}
                        <Button
                          variant="outline"
                          disabled={round.options.length <= 2}
                          onClick={() =>
                            change(
                              "options",
                              round.options.filter((_, j) => i !== j),
                            )
                          }
                        >
                          {t("移除選項", "Remove option")}
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      disabled={round.options.length >= 12}
                      onClick={() =>
                        change("options", [
                          ...round.options,
                          {
                            id: "opt-" + crypto.randomUUID().slice(0, 8),
                            title: { "zh-TW": "新選項", en: "New option" },
                          },
                        ])
                      }
                    >
                      {t("新增選項", "Add option")}
                    </Button>
                  </fieldset>
                )}
                <label className="block">
                  <input
                    type="checkbox"
                    checked={round.resultsPublished}
                    onChange={(e) => change("resultsPublished", e.target.checked)}
                  />
                  {t(
                    "結束後公開結果（進行中仍不顯示票數）",
                    "Publish results after the round ends (no live counts)",
                  )}
                </label>
              </>
            ) : (
              <>
                <label className="block">
                  {t("參與资格", "Eligibility")}
                  <select
                    value={activity.eligibility}
                    onChange={(e) => change("eligibility", e.target.value)}
                  >
                    <option value="account">{t("已登入帳號", "Signed-in account")}</option>
                    <option value="member">{t("會員角色", "Member role")}</option>
                  </select>
                </label>
                <label className="block">
                  {t("完成條件", "Required condition")}
                  <select
                    aria-label="Activity condition"
                    value={activity.condition}
                    onChange={(e) => change("condition", e.target.value)}
                  >
                    {doc.data.tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title[locale]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  {t("獎勵狀態", "Reward status")}
                  <select
                    aria-label="Reward status"
                    value={activity.rewardKind}
                    onChange={(e) => change("rewardKind", e.target.value)}
                  >
                    <option value="none">{t("不發資產", "No assets")}</option>
                    <option value="pending">
                      {t("待核定，不發資產", "Unapproved; no assets")}
                    </option>
                  </select>
                </label>
                {(["zh-TW", "en"] as const).map((lang) => (
                  <label className="block" key={lang}>
                    {t("參與方式", "Instructions")} · {lang}
                    <textarea
                      className="block w-full rounded border p-2"
                      value={activity.instructions[lang]}
                      onChange={(e) =>
                        change("instructions", { ...activity.instructions, [lang]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  void send({ action: "save", expectedVersion: doc.version, kind, id, value })
                }
              >
                {t("保存草稿", "Save draft")}
              </Button>
              <Button
                disabled={!selected}
                onClick={() =>
                  void send({
                    action: "publish",
                    expectedVersion: doc.version,
                    kind,
                    id,
                    value: null,
                  })
                }
              >
                {t("發布已保存草稿", "Publish saved draft")}
              </Button>
              <Button
                variant="outline"
                disabled={!selected}
                onClick={() =>
                  void send({
                    action: "withdraw",
                    expectedVersion: doc.version,
                    kind,
                    id,
                    value: null,
                  })
                }
              >
                {t("下架", "Withdraw")}
              </Button>
            </div>
            <p>
              {t(
                "草稿不影響公開版。已有參與後修改條件需另開新項目；既有紀錄保留。",
                "Drafts do not alter published content. Create a new item to change conditions after participation; historical records remain.",
              )}
            </p>
            <section className="panel space-y-2 p-3">
              <h2>{t("草稿預覽（未發布）", "Draft preview (unpublished)")}</h2>
              <p>{value.title[locale]}</p>
              <p className="whitespace-pre-wrap">{value.summary[locale]}</p>
              <Period {...value} />
            </section>
          </fieldset>
          <section className="panel space-y-4 p-4">
            <h2>{t("推薦審核", "Recommendation review")}</h2>
            {!doc.recommendations.length && <p>{t("尚無推薦。", "No recommendations yet.")}</p>}
            {doc.recommendations.map((r) => (
              <article key={r.id} className="space-y-2 border-b pb-3" data-recommendation-id={r.id}>
                <p>
                  {r.name} · {r.status}
                </p>
                <p className="break-words">{r.reason}</p>
                {r.url && (
                  <a
                    className="break-all underline"
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {r.url}
                  </a>
                )}
                <p>{r.reviewNote}</p>
                {r.status === "pending" && (
                  <>
                    <label className="block">
                      {t("審核理由", "Review reason")}
                      <textarea
                        aria-label={"Review " + r.id}
                        className="block w-full rounded border p-2"
                        maxLength={1000}
                        value={reviewNotes[r.id] ?? ""}
                        onChange={(e) => setReviewNotes({ ...reviewNotes, [r.id]: e.target.value })}
                      />
                    </label>
                    {["approved", "rejected"].map((status) => (
                      <Button
                        className="mr-2"
                        disabled={busy || !reviewNotes[r.id]?.trim()}
                        key={status}
                        onClick={() =>
                          void send({
                            action: "review",
                            id: r.id,
                            expectedVersion: r.version,
                            status,
                            note: reviewNotes[r.id] ?? "",
                          })
                        }
                      >
                        {status === "approved"
                          ? t("核准企劃參考", "Approve for planning")
                          : t("退回", "Reject")}
                      </Button>
                    ))}
                  </>
                )}
              </article>
            ))}
          </section>
          <TaskAdmin doc={doc} busy={busy} send={send} />
        </>
      )}
    </div>
  );
}
function TaskAdmin({
  doc,
  busy,
  send,
}: {
  doc: ParticipationAdmin;
  busy: boolean;
  send: (body: unknown) => Promise<void>;
}) {
  const t = useDiscoveryText();
  const [tasks, setTasks] = useState(doc.data.tasks);
  useEffect(() => setTasks(doc.data.tasks), [doc]);
  return (
    <section className="panel space-y-4 p-4">
      <h2>{t("初期任務設定（不發資產）", "Starter task rules (no assets)")}</h2>
      {tasks.map((task, i) => (
        <fieldset key={task.id} disabled={busy}>
          <label>
            <input
              type="checkbox"
              checked={task.enabled}
              onChange={(e) =>
                setTasks(tasks.map((x, j) => (i === j ? { ...x, enabled: e.target.checked } : x)))
              }
            />{" "}
            {task.id}
          </label>
          {(["zh-TW", "en"] as const).map((lang) => (
            <label className="block" key={lang}>
              {lang}
              <input
                className="block w-full rounded border p-2"
                value={task.title[lang]}
                onChange={(e) =>
                  setTasks(
                    tasks.map((x, j) =>
                      i === j ? { ...x, title: { ...x.title, [lang]: e.target.value } } : x,
                    ),
                  )
                }
              />
            </label>
          ))}
        </fieldset>
      ))}
      <Button
        disabled={busy}
        onClick={() => void send({ action: "tasks", expectedVersion: doc.version, tasks })}
      >
        {t("保存任務規則", "Save task rules")}
      </Button>
    </section>
  );
}

export function ParticipationHome() {
  const d = useParticipation(),
    t = useDiscoveryText(),
    { locale } = useLocale();
  return (
    <section data-participation-home className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">
          {t("活動與下一季參與", "Activities and next-season participation")}
        </h2>
        <Link to="/activities" className="text-sm text-primary">
          {t("所有活動", "All activities")}
        </Link>
      </div>
      <ParticipationNotice />
      <Status />
      <div className="grid gap-4 md:grid-cols-3">
        {d.data?.activities.slice(0, 3).map((a) => (
          <article key={a.id} className="panel space-y-3 p-5">
            <State value={a.state} />
            <h3 className="font-semibold">{a.title[locale]}</h3>
            <p className="text-sm text-muted-foreground">{a.summary[locale]}</p>
            <Link
              to="/activities/$activityId"
              params={{ activityId: a.id }}
              className="text-sm text-primary"
            >
              {t("查看活動", "View activity")}
            </Link>
          </article>
        ))}
      </div>
      {d.loaded && !d.error && !d.data?.activities.length && (
        <p>{t("目前沒有已發布活動。", "No published activities yet.")}</p>
      )}
      <Link to="/wish-pools" className="inline-block text-sm text-primary">
        {t("參與主題票選與創作者推薦", "Explore theme voting and creator recommendations")}
      </Link>
    </section>
  );
}
