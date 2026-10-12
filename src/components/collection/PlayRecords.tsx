import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { localApi, localSessionGeneration, localTestState } from "@/lib/local-test-client";
import { isPlayProjection } from "@/lib/play-contract.mjs";
import { PLAY_MODES } from "@/lib/collection-play.mjs";
import {
  discoveryCommand,
  retryDiscoveryCommand,
  hasPendingDiscovery,
} from "@/lib/discovery-store";
export interface PlayProof {
  memoryConfig?: import("@/lib/collection-play.mjs").MemoryConfig;
  mode: string;
  difficulty: string;
  ruleVersion: string;
  seed: number;
  cardIds: string[];
  cardVersions: number[];
  visibilityKey: string;
  events: unknown[];
}
export interface PlayPrivate {
  schema: 1;
  source: "local-SQLite-private-play";
  actorId: string;
  visibilityKey: string;
  settings: {
    version: number;
    data: {
      schema: 1;
      lastMode: string;
      difficulty: string;
      journey?: {
        schema: 1;
        ruleVersion: string;
        modes: string[];
        startedAt: string;
        paused: boolean;
        completed: number;
        invalidated: boolean;
      };
    };
  };
  page: number;
  pages: number;
  total: number;
  rows: {
    id: string;
    at: string;
    mode: string;
    difficulty: string;
    correct: number;
    total: number;
    moves: number | null;
    ruleVersion: string;
    sourceVersion: number;
    memoryConfig?: import("@/lib/collection-play.mjs").MemoryConfig;
    hintsUsed?: number;
  }[];
  best: PlayPrivate["rows"];
  officialXP: false;
  ranking: false;
  rewards: false;
}
export function SavePlayResult({ proof, actor }: { proof: PlayProof; actor: string }) {
  const t = useDiscoveryText(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [saved, setSaved] = useState(false);
  const pending = hasPendingDiscovery("/play/commands");
  const save = async (retry = false) => {
    if (busy) return;
    const epoch = localSessionGeneration(),
      current = () =>
        epoch === localSessionGeneration() && localTestState().summary?.user.id === actor;
    setBusy(true);
    try {
      if (retry) await retryDiscoveryCommand("/play/commands");
      else {
        const me = await localApi<PlayPrivate>("/play/me");
        if (!current()) return;
        if (
          !isPlayProjection(me) ||
          me.actorId !== actor ||
          me.visibilityKey !== proof.visibilityKey
        )
          throw new Error("Play source projection mismatch");
        await discoveryCommand("/play/commands", {
          action: "result",
          expectedVersion: me.settings.version,
          data: proof,
        });
      }
      if (current()) {
        setSaved(!retry);
        setMessage(
          retry
            ? t(
                "原key已確認，請查看紀錄；不代表另存目前新一局。",
                "Original key confirmed; check your records. This does not save a new current round.",
              )
            : t(
                "已保存本人本機紀錄；未發放資產或正式XP。",
                "Saved your local record; no assets or official XP issued.",
              ),
        );
        window.dispatchEvent(new Event("keepy-play-readback"));
      }
    } catch (e) {
      if (current())
        setMessage(
          (e as { status?: number }).status === 409
            ? t(
                "來源／版本已變更，請重讀確認原操作；勿覆蓋或建立新重複請求。",
                "Source/version changed. Read back the original operation; do not overwrite or create a duplicate request.",
              )
            : t(
                "保存結果未確認；請確認原key或重新讀取紀錄，不另建重送。",
                "Save result unconfirmed; confirm the original key or read records, without a new request.",
              ),
        );
    } finally {
      if (current()) setBusy(false);
    }
  };
  return (
    <div className="space-y-2" data-play-save aria-busy={busy}>
      <Button disabled={busy || saved || pending} onClick={() => void save()}>
        {t("保存本人遊玩摘要", "Save my play summary")}
      </Button>
      {pending && (
        <Button disabled={busy} variant="outline" onClick={() => void save(true)}>
          {t("確認原遊玩操作", "Confirm original play operation")}
        </Button>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
export function PlayRecords({
  actor,
  visibilityKey,
  continuePlay = false,
}: {
  actor: string;
  visibilityKey: string;
  continuePlay?: boolean;
}) {
  const t = useDiscoveryText(),
    [snapshot, setSnapshot] = useState<PlayPrivate | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0),
    [page, setPage] = useState(1),
    [mode, setMode] = useState("all"),
    [busy, setBusy] = useState(false),
    [clear, setClear] = useState(false),
    [journeyOrder, setJourneyOrder] = useState("memory,knowledge,observation"),
    [restartJourney, setRestartJourney] = useState(false);
  const pending = hasPendingDiscovery("/play/commands");
  const modeLabel = (id: string) =>
    id === "memory"
      ? t("記憶配對", "Memory matching")
      : id === "knowledge"
        ? t("卡冊知識", "Album knowledge")
        : id === "observation"
          ? t("收藏觀察", "Collection observation")
          : id === "puzzle"
            ? t("卡牌拼圖", "Card puzzle")
            : t("全部", "All");
  useEffect(() => {
    const c = new AbortController(),
      epoch = localSessionGeneration();
    setSnapshot(null);
    setError(false);
    void localApi<PlayPrivate>(
      "/play/me?page=" + page + "&mode=" + mode,
      undefined,
      "GET",
      undefined,
      c.signal,
    )
      .then((v) => {
        if (c.signal.aborted || epoch !== localSessionGeneration()) return;
        if (!isPlayProjection(v) || v.actorId !== actor || v.visibilityKey !== visibilityKey)
          throw new Error("Play source projection mismatch");
        setSnapshot(v);
      })
      .catch(() => {
        if (!c.signal.aborted) setError(true);
      });
    return () => c.abort();
  }, [actor, visibilityKey, page, mode, retry]);
  useEffect(() => {
    const read = () => setRetry((n) => n + 1);
    window.addEventListener("keepy-play-readback", read);
    return () => window.removeEventListener("keepy-play-readback", read);
  }, []);
  const command = async (
    action: "settings" | "clear" | "journey",
    data: unknown,
    replay = false,
  ) => {
    if (!snapshot || busy) return;
    const epoch = localSessionGeneration();
    setBusy(true);
    try {
      if (replay) await retryDiscoveryCommand("/play/commands");
      else
        await discoveryCommand("/play/commands", {
          action,
          expectedVersion: snapshot.settings.version,
          data,
        });
      if (epoch === localSessionGeneration()) {
        setRetry((n) => n + 1);
        setClear(false);
      }
    } catch {
      if (epoch === localSessionGeneration()) {
        setSnapshot(null);
        setError(true);
      }
    } finally {
      if (epoch === localSessionGeneration()) setBusy(false);
    }
  };
  const confirmOriginal = async () => {
    if (busy) return;
    const epoch = localSessionGeneration();
    setBusy(true);
    try {
      await retryDiscoveryCommand("/play/commands");
      if (epoch === localSessionGeneration()) setRetry((n) => n + 1);
    } catch {
      if (epoch === localSessionGeneration()) setError(true);
    } finally {
      if (epoch === localSessionGeneration()) setBusy(false);
    }
  };
  return (
    <section
      className="panel space-y-3 p-4"
      data-private-play-records
      id="play-records"
      aria-busy={busy || (!snapshot && !error)}
    >
      <h2 className="text-xl font-bold">
        {t("私人遊玩紀錄（本機SQLite）", "Private play records (local SQLite)")}
      </h2>
      <p>
        {t(
          "三玩法近期摘要與同規則、同難度個人最佳；與正式XP、成就與排行榜分開，不是雲端同步。來源失效的紀錄不再投影。",
          "Recent summaries and personal bests for the same rule and difficulty, separate from official XP, achievements and rankings. No cloud sync; records with unavailable sources are not projected.",
        )}
      </p>
      {pending && !error && (
        <div role="status" className="space-y-2 rounded border p-3">
          <p>
            {t(
              "原操作仍待確認；重讀成功不會刪除原key。請確認後再開始不同操作。",
              "The original operation is still unconfirmed. A successful read does not discard its key; confirm it before a different operation.",
            )}
          </p>
          <Button disabled={busy} variant="outline" onClick={() => void confirmOriginal()}>
            {t("確認紀錄原操作", "Confirm the original record operation")}
          </Button>
        </div>
      )}
      <label>
        {t("紀錄類型", "Record type")}{" "}
        <select
          value={mode}
          aria-label="Play record type"
          onChange={(e) => {
            setMode(e.target.value);
            setPage(1);
          }}
        >
          {["all", ...PLAY_MODES].map((id) => (
            <option key={id} value={id}>
              {modeLabel(id)}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <div role="alert">
          <p>
            {t(
              "紀錄服務失敗或版本衝突，舊資料已清空，請先重讀；不當成沒有紀錄。",
              "Record service failed or version conflicted. Old data cleared; read back before continuing, not an empty-record result.",
            )}
          </p>
          <Button onClick={() => setRetry((n) => n + 1)}>
            {t("重讀遊玩紀錄", "Reload play records")}
          </Button>
          {pending && (
            <Button disabled={busy} onClick={() => void confirmOriginal()}>
              {t("確認原遊玩操作", "Confirm original play operation")}
            </Button>
          )}
        </div>
      ) : !snapshot ? (
        <p role="status">{t("讀取本人紀錄中…", "Loading your records…")}</p>
      ) : (
        <>
          <section className="rounded border p-3 space-y-3" data-mixed-play-journey>
            <h3 className="font-bold">{t("私人混合遊玩旅程", "Private mixed play journey")}</h3>
            <p>
              {t(
                "版本local-mixed-journey-v1；只計開始後依順序保存的合法結果，不把過去紀錄當新進度。暫停時保存不計階段；無消耗、獎勵或正式XP。",
                "Rule local-mixed-journey-v1 counts only eligible results saved in order after starting. Earlier records do not count; saves while paused do not advance stages. No consumption, rewards or official XP.",
              )}
            </p>
            <label>
              {t("受控階段", "Controlled stages")}{" "}
              <select
                aria-label="Mixed journey order"
                value={journeyOrder}
                disabled={busy || pending}
                onChange={(e) => setJourneyOrder(e.target.value)}
              >
                {[
                  "memory,knowledge,observation",
                  "knowledge,observation",
                  "observation,knowledge,memory",
                ].map((order) => (
                  <option key={order} value={order}>
                    {order.split(",").map(modeLabel).join(" → ")}
                  </option>
                ))}
              </select>
            </label>
            <Button
              data-start-journey
              disabled={busy || pending}
              onClick={() => {
                if (snapshot.settings.data.journey) setRestartJourney(true);
                else
                  void command("journey", {
                    modes: journeyOrder.split(","),
                    paused: false,
                    restart: true,
                  });
              }}
            >
              {t("開始／重新安排旅程", "Start / rearrange journey")}
            </Button>
            {snapshot.settings.data.journey ? (
              <div data-mixed-journey-progress aria-live="polite">
                <p>
                  {snapshot.settings.data.journey.startedAt} ·{" "}
                  {snapshot.settings.data.journey.ruleVersion}
                </p>
                <p>
                  {snapshot.settings.data.journey.invalidated
                    ? t(
                        "旅程来源已失效，進度遮蔽；確認合法來源後重新安排。",
                        "Journey sources unavailable; progress concealed. Check eligible sources before rearranging.",
                      )
                    : `${snapshot.settings.data.journey.completed}/${snapshot.settings.data.journey.modes.length} · ${snapshot.settings.data.journey.modes.map(modeLabel).join(" → ")}`}
                </p>
                <p>
                  {snapshot.settings.data.journey.paused
                    ? t("已暫停，可續作。", "Paused; you can resume.")
                    : snapshot.settings.data.journey.completed ===
                        snapshot.settings.data.journey.modes.length
                      ? t(
                          "旅程完成，回顧私人紀錄；不發獎勵。",
                          "Journey complete. Review private records; no rewards issued.",
                        )
                      : t(
                          "依順序完成下一玩法並保存摘要。",
                          "Complete the next mode in order and save its summary.",
                        )}
                </p>
                <Button
                  data-pause-journey
                  variant="outline"
                  disabled={busy || pending}
                  onClick={() =>
                    void command("journey", {
                      modes: snapshot.settings.data.journey!.modes,
                      paused: !snapshot.settings.data.journey!.paused,
                      restart: false,
                    })
                  }
                >
                  {t("暫停／繼續旅程", "Pause / resume journey")}
                </Button>
                {continuePlay &&
                  !snapshot.settings.data.journey.invalidated &&
                  snapshot.settings.data.journey.completed <
                    snapshot.settings.data.journey.modes.length && (
                    <Button
                      variant="outline"
                      data-next-journey
                      onClick={() => {
                        const el = document.getElementById(
                          "play-" +
                            snapshot.settings.data.journey!.modes[
                              snapshot.settings.data.journey!.completed
                            ],
                        );
                        el?.scrollIntoView({ block: "start", behavior: "auto" });
                        el?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus({
                          preventScroll: true,
                        });
                      }}
                    >
                      {t("定位下一階段（不開始新局）", "Find next stage (does not start a round)")}
                    </Button>
                  )}
              </div>
            ) : (
              <p>
                {t(
                  "尚未選擇旅程；已有紀錄不會自動加入。",
                  "No journey selected; existing records are not added automatically.",
                )}
              </p>
            )}
            <ConfirmDialog
              open={restartJourney}
              onCancel={() => setRestartJourney(false)}
              title={t("重新安排私人旅程？", "Rearrange your private journey?")}
              description={t(
                "旅程進度從零開始；已保存遊玩紀錄保留，不發獎或改資產。",
                "Journey progress restarts at zero. Saved play records remain; no rewards or asset changes.",
              )}
              confirmLabel={t("確認重新安排旅程", "Confirm rearranging journey")}
              onConfirm={() => {
                setRestartJourney(false);
                void command("journey", {
                  modes: journeyOrder.split(","),
                  paused: false,
                  restart: true,
                });
              }}
            />
          </section>
          <label>
            {t("本人下次玩法偏好", "Your next-play preference")}{" "}
            <select
              aria-label="Saved play mode"
              value={snapshot.settings.data.lastMode}
              disabled={busy || pending}
              onChange={(e) =>
                void command("settings", {
                  schema: 1,
                  lastMode: e.target.value,
                  difficulty: snapshot.settings.data.difficulty,
                })
              }
            >
              {["memory", "knowledge", "observation"].map((id) => (
                <option key={id} value={id}>
                  {modeLabel(id)}
                </option>
              ))}
            </select>
          </label>
          {continuePlay ? (
            <Button
              variant="outline"
              disabled={busy || pending}
              data-continue-saved-play
              onClick={() => {
                const target = document.getElementById("play-" + snapshot.settings.data.lastMode);
                target?.scrollIntoView({ block: "start", behavior: "auto" });
                target
                  ?.querySelector<HTMLButtonElement>("button:not([disabled])")
                  ?.focus({ preventScroll: true });
              }}
            >
              {t(
                "定位本人已保存玩法偏好（不開始新局）",
                "Find my saved play preference (does not start a round)",
              )}
            </Button>
          ) : (
            <Link className="text-primary underline" to="/app/play">
              {t("前往本人遊玩中心", "Go to your play centre")}
            </Link>
          )}
          <p>
            v{snapshot.settings.version} ·{" "}
            {t(
              "只保存本機，清除只影響玩法紀錄與偏好。",
              "Local only; clear affects play records and preferences only.",
            )}
          </p>
          {snapshot.rows.length ? (
            <ol>
              {snapshot.rows.map((r) => (
                <li key={r.id}>
                  {r.at} · {modeLabel(r.mode)} / {r.difficulty} · {r.correct}/{r.total}{" "}
                  {r.moves !== null ? " · " + r.moves : ""} · {r.ruleVersion}
                  {r.memoryConfig && (
                    <>
                      {" "}
                      ·{" "}
                      {r.memoryConfig.variant === "practice"
                        ? t("練習模式", "Practice mode")
                        : t("限步模式", "Move-limited mode")}{" "}
                      · {t("提示次數", "Hints used")}: {r.hintsUsed}
                    </>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p>{t("目前沒有合法本人遊玩紀錄。", "No currently eligible personal play records.")}</p>
          )}
          <details>
            <summary>{t("原規則個人最佳", "Personal bests under the original rules")}</summary>
            <p>
              {t(
                "進階模式依版本／上限／提示記錄於近期摘要，不與原規則混比。",
                "Advanced modes retain their version, cap and hints in recent records; they are not compared against the original rules.",
              )}
            </p>
            <ul>
              {snapshot.best.map((r) => (
                <li key={r.id}>
                  {r.mode}/{r.difficulty} · {r.correct}/{r.total} · {r.moves ?? "—"} ·{" "}
                  {r.ruleVersion}
                </li>
              ))}
            </ul>
          </details>
          <nav className="flex gap-3">
            <Button disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>
              {t("上一頁", "Previous")}
            </Button>
            <span>
              {snapshot.page}/{snapshot.pages}
            </span>
            <Button disabled={page >= snapshot.pages} onClick={() => setPage((n) => n + 1)}>
              {t("下一頁", "Next")}
            </Button>
          </nav>
          <Button variant="outline" disabled={busy || pending} onClick={() => setClear(true)}>
            {t("清除本人玩法紀錄與偏好", "Clear my play records and preferences")}
          </Button>
        </>
      )}
      <ConfirmDialog
        open={clear}
        title={t("只清除本人遊玩紀錄？", "Clear only your play records?")}
        description={t(
          "不清除持卡、取得來源、帳本、成就、策展或合約；這是本機私人紀錄清除。",
          "Does not clear holdings, acquisition sources, ledger, achievements, curations or contracts. Only local private play records.",
        )}
        confirmLabel={t("確認清除遊玩紀錄", "Confirm clearing play records")}
        onCancel={() => setClear(false)}
        onConfirm={() => void command("clear", null)}
      />
    </section>
  );
}
