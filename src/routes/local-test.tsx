import {
  enableLocalTest,
  clearLocalSession,
  localApi,
  localTestState,
  useLocalTest,
} from "@/lib/local-test-client";
import { APP_VERSION } from "@/data/public-hub";
import { LocalOperationGuide } from "@/components/local-test/LocalOperationGuide";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usePlayerCopy } from "@/lib/player-copy";
import { CardFrame } from "@/components/ui/card-frame";
import { GODDESSES } from "@/data/mock";
import { ALBUM } from "@/data/player";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/local-test")({ component: LocalTestPage });
interface LocalCard {
  id: string;
  name: string;
  grade: string;
}
interface Draw {
  mode: "single" | "10plus1";
  id: string;
  requestKey: string;
  cost: number;
  poolVersion: number;
  before: number;
  after: number;
  items: LocalCard[];
}
interface Summary {
  user: { id: string; role: string; balance: number };
  holdings: { card_id: string; count: number }[];
  draws: Draw[];
  ledger: { id: string; amount: number; source: string }[];
}
interface Pool {
  id: string;
  version: number;
  status: string;
}
interface Cooperation {
  version: number;
  data: {
    partners: { id: string; name: string }[];
    contracts: { id: string; text: string; version: number; partnerId: string }[];
  };
}
interface Audit {
  id: string;
  actor: string;
  action: string;
  subject: string;
}
const fixtures = ["member-a", "member-b", "creator-a", "creator-b", "official-a", "official-b"];
function api<T>(path: string, body?: unknown, key?: string): Promise<T> {
  return localApi<T>(path, body, "POST", key);
}
function LocalTestPage() {
  const t = usePlayerCopy(),
    local = useLocalTest();
  const [fixture, setFixture] = useState("member-a"),
    [poolId, setPoolId] = useState("p-uniform");
  const [summary, setSummary] = useState<Summary | null>(null),
    [pools, setPools] = useState<Pool[]>([]);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [lastKey, setLastKey] = useState("");
  const [cooperation, setCooperation] = useState<Cooperation | null>(null),
    [audit, setAudit] = useState<Audit[]>([]);
  const [visibility, setVisibility] = useState("normal"),
    [revokeId, setRevokeId] = useState("official-b");
  const [pending, setPending] = useState<{
    actorId: string;
    poolId: string;
    mode: "single" | "10plus1";
    key: string;
  } | null>(null);
  const clearView = (preservePending = false) => {
    setSummary(null);
    setPools([]);
    setCooperation(null);
    setAudit([]);
    if (!preservePending) {
      setPending(null);
      setLastKey("");
    }
  };
  const currentActorId = local.summary?.user.id;
  useEffect(() => {
    if (!currentActorId) {
      setSummary(null);
      setPools([]);
      setCooperation(null);
      setAudit([]);
    }
  }, [currentActorId]);
  const refresh = async () => {
    clearView(true);
    const saved = await api<Summary>("/me");
    await enableLocalTest();
    const loadedPools = await api<Pool[]>("/pools");
    if (localTestState().summary?.user.id !== saved.user.id)
      throw new Error(
        t("測試身分尚未確認，請重新讀取。", "Test identity not confirmed. Reload saved data."),
      );
    setSummary(saved);
    setFixture(saved.user.id);
    try {
      const request =
        JSON.parse(sessionStorage.getItem("keepy-local-test-request-v1") ?? "null") ?? pending;
      if (
        request?.actorId === saved.user.id &&
        typeof request.poolId === "string" &&
        ["single", "10plus1"].includes(request.mode) &&
        /^[A-Za-z0-9_-]{8,100}$/.test(request.key)
      ) {
        setPending(request);
        setLastKey(request.key);
      } else {
        setPending(null);
        setLastKey("");
      }
    } catch {
      setPending(null);
      setLastKey("");
    }
    setPools(loadedPools);
  };
  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      clearView(true);
      const error = e instanceof Error ? e.message : t("本機 API 不可用", "Local API unavailable");
      if (!(
        e instanceof Error &&
        "status" in e &&
        typeof e.status === "number" &&
        e.status >= 400 &&
        e.status < 500
      ))
        clearLocalSession(error);
      setMessage(error);
    } finally {
      setBusy(false);
    }
  };
  const login = () =>
    act(async () => {
      clearView();
      clearLocalSession();
      await api("/session", { fixtureId: fixture });
      await refresh();
      setCooperation(null);
      setAudit([]);
    });
  const draw = (mode: "single" | "10plus1", replay = false) =>
    act(async () => {
      const actorId = summary?.user.id;
      if (!actorId) return;
      const request = replay ? pending : { actorId, poolId, mode, key: crypto.randomUUID() };
      if (!request || request.actorId !== actorId) return;
      // Retain the exact key/input on an ambiguous timeout so retry cannot reissue a draw.
      setPending(request);
      setLastKey(request.key);
      try {
        sessionStorage.setItem(
          "keepy-local-test-request-v1",
          JSON.stringify({ ...request, actorId: summary?.user.id }),
        );
      } catch {
        /* Retry still works in memory if browser storage is unavailable. */
      }
      await api<Draw>("/draws", { poolId: request.poolId, mode: request.mode }, request.key);
      await refresh();
      setMessage(
        t(
          "本機交易已確認；結果由服務端保存",
          "Local transaction confirmed; server saved the result",
        ),
      );
    });
  const selectedPool = pools.find((p) => p.id === poolId);
  return (
    <div className="mx-auto max-w-5xl space-y-5 break-words">
      <h1 className="text-3xl font-black">KEEPY · Local Test · {APP_VERSION.split("（")[0]}</h1>
      <div className="panel space-y-2 p-4 text-sm">
        <p>
          {t(
            "僅本機 SQLite 與合成帳號。帳號選擇是測試身分入口，不是真實登入或可上線 Auth；未完成跨裝置／雲端登入。",
            "Local SQLite and synthetic accounts only. Account selection issues a test identity, not production Auth. Cloud/cross-device login is not implemented.",
          )}
        </p>
        <p>
          {t(
            "TEST KP 無現金價值。卡牌由既有目錄提供；每張均勻選取僅為測試規則，100／900 成本與保底累計不是正式機率或保底承諾。",
            "TEST KP has no cash value. Existing catalog cards are selected uniformly for testing. Costs 100/900 and pity counts are fixtures, not production odds or guaranteed grades.",
          )}
        </p>
        <p>
          {t(
            "獨立於 0.15／0.16 localStorage；不匯入舊示意持卡或餘額，不收密碼、個資或付款。請用 npm run local:test 啟動本機服務。",
            "Separate from 0.15/0.16 localStorage; no import of demo holdings/balance, passwords, personal data or payments. Start the local service with npm run local:test.",
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0">
          {t("合成帳號", "Synthetic account")}
          <select
            className="ml-2 rounded-lg border border-border bg-background p-2"
            disabled={busy}
            data-testid="local-fixture"
            value={fixture}
            onChange={(e) => setFixture(e.target.value)}
          >
            {fixtures.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <Button disabled={busy} onClick={login}>
          {t("建立測試 Session", "Create test session")}
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => act(refresh)}>
          {t("讀取已保存資料", "Load saved data")}
        </Button>
        {summary && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              act(async () => {
                await api("/logout", {});
                clearLocalSession();
                clearView();
                setSummary(null);
                setCooperation(null);
                setAudit([]);
                setPending(null);
              })
            }
          >
            {t("登出測試 Session", "End test session")}
          </Button>
        )}
      </div>
      {message && (
        <p role="status" className="rounded-lg border border-border p-3 text-sm">
          {message}
        </p>
      )}
      <LocalOperationGuide />
      {summary && (
        <>
          <section className="panel space-y-3 p-4" data-testid="local-summary">
            <h2 className="text-xl font-bold">
              {summary.user.id} · {summary.user.role} · {summary.user.balance.toLocaleString()} TEST
              KP
            </h2>
            <p>
              {t("持卡合計", "Total held cards")}:{" "}
              <span data-testid="local-total">
                {summary.holdings.reduce((n, h) => n + h.count, 0)}
              </span>
            </p>
            <label>
              {t("測試卡池", "Test pool")}
              <select
                data-testid="local-pool"
                className="ml-2 max-w-full rounded-lg border border-border bg-background p-2"
                value={poolId}
                onChange={(e) => {
                  setPoolId(e.target.value);
                  setPending(null);
                  setLastKey("");
                }}
              >
                {pools.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.id} · v{p.version} · {p.status}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy || selectedPool?.status !== "live"}
                onClick={() => void draw("single")}
              >
                {t("單抽（100 TEST KP）", "Single (100 TEST KP)")}
              </Button>
              <Button
                disabled={busy || selectedPool?.status !== "live"}
                onClick={() => void draw("10plus1")}
              >
                {t("10+1（900 TEST KP）", "10+1 (900 TEST KP)")}
              </Button>
              <Button
                variant="outline"
                disabled={busy || !pending}
                onClick={() => void draw(pending?.mode ?? "single", true)}
              >
                {t("重送同一請求", "Retry same request")}
              </Button>
            </div>
            {lastKey && <p className="text-xs">Request ID: {lastKey}</p>}
          </section>
          <section className="space-y-3">
            <h2 className="text-xl font-bold">{t("本機收藏", "Local collection")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {summary.holdings.map((h) => {
                const c = ALBUM.find((c) => c.id === h.card_id);
                return (
                  c && (
                    <div key={h.card_id}>
                      <CardFrame
                        goddess={GODDESSES.find((g) => g.id === c.goddessId)!}
                        grade={c.grade}
                        cardName={c.name}
                      />
                      <p className="mt-1 text-sm">
                        {c.name} × {h.count}
                      </p>
                    </div>
                  )
                );
              })}
            </div>
          </section>
          <section className="panel space-y-2 p-4">
            <h2 className="text-xl font-bold">{t("服務端抽卡歷史", "Server draw history")}</h2>
            {summary.draws.map((d) => (
              <details key={d.id} className="rounded border border-border p-2">
                <summary>
                  {d.mode} · v{d.poolVersion} · {d.items.length} {t("張", "cards")} · {d.cost} TEST
                  KP · {d.before}→{d.after}
                </summary>
                <p className="text-xs">{d.id}</p>
                <ul>
                  {d.items.map((c, i) => (
                    <li key={i}>
                      {c.grade} · {c.name}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </section>
          <section className="panel space-y-2 p-4">
            <h2 className="text-xl font-bold">{t("TEST KP 帳本", "TEST KP ledger")}</h2>
            {summary.ledger.map((l) => (
              <p key={l.id}>
                {l.amount > 0 ? "+" : ""}
                {l.amount} · {l.source}
              </p>
            ))}
          </section>
          {["creator", "official"].includes(summary.user.role) && (
            <section className="panel space-y-3 p-4">
              <Button
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    setCooperation(await api<Cooperation>("/cooperation"));
                  })
                }
              >
                {t("讀取合作版本", "Load cooperation versions")}
              </Button>
              {cooperation && (
                <div>
                  <p>
                    v{cooperation.version} ·{" "}
                    {t(
                      "合成授權／合約，僅流程測試",
                      "Synthetic rights/contracts; workflow testing only",
                    )}
                  </p>
                  {cooperation.data.partners.map((p) => (
                    <p key={p.id}>
                      {p.name} · {p.id}
                    </p>
                  ))}
                  {cooperation.data.contracts.map((c) => (
                    <p key={c.id}>
                      v{c.version} · {c.partnerId} · {c.text}
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}
          {summary.user.role === "official" && (
            <section className="panel space-y-3 p-4">
              <h2 className="text-xl font-bold">
                {t("官方權限測試", "Official permission tests")}
              </h2>
              <label>
                {t("下版可見規則", "Next visibility version")}
                <select
                  className="ml-2 rounded border border-border bg-background p-2"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  {["normal", "grayscale", "hidden"].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <Button
                disabled={busy || !selectedPool}
                onClick={() =>
                  act(async () => {
                    await api(`/admin/pools/${poolId}/versions`, {
                      expectedVersion: selectedPool?.version,
                      visibility,
                    });
                    await refresh();
                  })
                }
              >
                {t("追加規則版本", "Append rule version")}
              </Button>
              <div className="flex flex-wrap gap-2">
                <select
                  className="max-w-full rounded border border-border bg-background p-2"
                  value={revokeId}
                  onChange={(e) => setRevokeId(e.target.value)}
                >
                  {["official-a", "official-b", "creator-a", "creator-b"].map((id) => (
                    <option key={id}>{id}</option>
                  ))}
                </select>
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() =>
                    act(async () => {
                      await api(`/admin/roles/${revokeId}/revoke`, {});
                      await refresh();
                      setMessage(
                        t(
                          "已撤銷角色；舊 Session 的 API 會重新檢查權限",
                          "Role revoked; APIs recheck permissions for existing sessions",
                        ),
                      );
                    })
                  }
                >
                  {t("撤銷測試角色", "Revoke test role")}
                </Button>
              </div>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() =>
                  act(async () => {
                    setAudit(await api<Audit[]>("/admin/audit"));
                  })
                }
              >
                {t("讀取官方稽核", "Load official audit")}
              </Button>
              {audit.map((a) => (
                <p className="text-xs" key={a.id}>
                  {a.actor} · {a.action} · {a.subject}
                </p>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
