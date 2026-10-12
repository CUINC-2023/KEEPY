import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { localApi, localSessionGeneration, localTestState } from "@/lib/local-test-client";
import { isPlayProjection } from "@/lib/play-contract.mjs";
import {
  discoveryCommand,
  retryDiscoveryCommand,
  hasPendingDiscovery,
} from "@/lib/discovery-store";
export interface PlayProof {
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
  settings: { version: number; data: { schema: 1; lastMode: string; difficulty: string } };
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
    <div className="space-y-2" data-play-save>
      <Button disabled={busy || saved || pending} onClick={() => void save()}>
        {t("保存本人遊玩摘要", "Save my play summary")}
      </Button>
      {pending && (
        <Button disabled={busy} variant="outline" onClick={() => void save(true)}>
          {t("確認原遊玩操作", "Confirm original play operation")}
        </Button>
      )}
      <p role="status">{message}</p>
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
    [clear, setClear] = useState(false);
  const pending = hasPendingDiscovery("/play/commands");
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
  const command = async (action: "settings" | "clear", data: unknown, replay = false) => {
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
    <section className="panel space-y-3 p-4" data-private-play-records>
      <h2 className="text-xl font-bold">
        {t("私人遊玩紀錄（本機SQLite）", "Private play records (local SQLite)")}
      </h2>
      <p>
        {t(
          "三玩法近期摘要與同規則、同難度個人最佳；與正式XP、成就與排行榜分開，不是雲端同步。來源失效的紀錄不再投影。",
          "Recent summaries and personal bests for the same rule and difficulty, separate from official XP, achievements and rankings. No cloud sync; records with unavailable sources are not projected.",
        )}
      </p>
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
          {["all", "memory", "knowledge", "observation"].map((id) => (
            <option key={id} value={id}>
              {id}
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
          <label>
            {t("本人下次玩法偏好", "Your next-play preference")}{" "}
            <select
              aria-label="Saved play mode"
              value={snapshot.settings.data.lastMode}
              disabled={busy || pending}
              onChange={(e) =>
                void command("settings", { ...snapshot.settings.data, lastMode: e.target.value })
              }
            >
              {["memory", "knowledge", "observation"].map((id) => (
                <option key={id}>{id}</option>
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
                  {r.at} · {r.mode} / {r.difficulty} · {r.correct}/{r.total}{" "}
                  {r.moves !== null ? " · " + r.moves : ""} · {r.ruleVersion}
                </li>
              ))}
            </ol>
          ) : (
            <p>{t("目前沒有合法本人遊玩紀錄。", "No currently eligible personal play records.")}</p>
          )}
          <details>
            <summary>{t("同規則個人最佳", "Personal bests under the same rules")}</summary>
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
