import { useLocalTest } from "@/lib/local-test-client";
import { useState } from "react";
import { ALBUM } from "@/data/player";
import { POOLS } from "@/data/mock";
import { usePlayerCopy } from "@/lib/player-copy";
import {
  useOperations,
  updateOperations,
  operationId,
  operationTime,
} from "@/lib/operations-store";
import {
  DEMO_ACCOUNTS,
  DEFAULT_TERMS,
  savePartner,
  createContract,
  transitionContract,
  bindCard,
  listingIssues,
  snapshotPool,
  revenueExample,
  withdrawalBlocked,
  requestReview,
  type OpsTerms,
} from "@/lib/operations-model";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function OperationsPage({ creator = false }: { creator?: boolean }) {
  const local = useLocalTest();
  const t = usePlayerCopy();
  const { state, storageFailed } = useOperations();
  const [tab, setTab] = useState("partners"),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(""),
    [name, setName] = useState(""),
    [account, setAccount] = useState(""),
    [active, setActive] = useState(true),
    [coop, setCoop] = useState<"active" | "stopped">("active"),
    [reason, setReason] = useState("");
  const [terms, setTerms] = useState<OpsTerms>(DEFAULT_TERMS),
    [text, setText] = useState(""),
    [contract, setContract] = useState(""),
    [card, setCard] = useState(ALBUM[0]!.id),
    [artwork, setArtwork] = useState(true),
    [visibility, setVisibility] = useState<"normal" | "grayscale" | "hidden">("normal"),
    [pool, setPool] = useState("p-uniform"),
    [message, setMessage] = useState(""),
    [preview, setPreview] = useState(false),
    [creatorAccount, setCreatorAccount] = useState("demo-approved-a"),
    [request, setRequest] = useState("");
  const partnerId = selected || state.partners[0]?.id || "";
  const action = async (fn: Parameters<typeof updateOperations>[0]) => {
    try {
      setMessage(
        (await updateOperations(fn))
          ? t("本機示意已保存", "Local operation saved")
          : t(
              "未套用：請檢查必填資料、流程狀態或重複操作",
              "Not applied: check required fields, workflow state or duplicate operation",
            ),
      );
      setRequest("");
    } catch (error) {
      setMessage(String(error));
    }
  };
  const patch = <K extends keyof OpsTerms>(key: K, value: OpsTerms[K]) =>
    setTerms((v) => ({ ...v, [key]: value }));
  const statusLabel = (value: string) =>
    ({
      draft: t("草稿", "Draft"),
      pending: t("待確認", "Pending"),
      agreed: t("已模擬同意", "Agreed in demo"),
      returned: t("已退回", "Returned"),
      all: t("全部", "All"),
      active: t("合作中", "Active"),
      stopped: t("合作停止", "Stopped"),
      buyout: t("買斷", "Buyout"),
      share: t("分潤", "Revenue share"),
      mixed: t("混合", "Mixed"),
    })[value] ?? value;
  const issueLabel = (issue: string) => {
    const parts = issue.split(":");
    const code = parts.pop()!;
    const names =
      {
        pool: t("找不到卡池", "Pool not found"),
        cards: t("尚未關聯任何卡牌", "No cards linked"),
        relations: t("缺合作對象或合約關聯", "Missing partner or contract relation"),
        rarity: t("稀有度缺漏或無效", "Rarity missing or invalid"),
        visibility: t("可見狀態缺漏或無效", "Visibility missing or invalid"),
        artwork: t("缺卡面素材", "Artwork missing"),
        consent: t("合約尚未完成模擬同意", "Contract has not completed demo consent"),
        license: t("授權資料不足或期限無效", "License information missing or term invalid"),
        payee: t("收款對象關聯有誤", "Payee relation invalid"),
        "share-account-or-basis": t(
          "分潤需有效帳號、核准資格與報酬基礎",
          "Sharing requires active account, approval and compensation basis",
        ),
        "cooperation-review": t(
          "合作停止，須審查授權與續售",
          "Cooperation stopped; license and continued-sale review required",
        ),
      }[code] ?? code;
    const card = ALBUM.find((c) => c.id === parts.join(":"));
    return (card ? card.name + " · " : "") + names;
  };
  const now = operationTime();
  const partners = state.partners.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "all" || p.cooperation === status),
  );
  const creatorPartners = state.partners.filter(
    (p) => p.accountId === (local.enabled ? state.partners[0]?.accountId : creatorAccount),
  );
  const selectPartner = (id: string) => {
    const p = state.partners.find((p) => p.id === id);
    setSelected(id);
    setName(p?.name ?? "");
    setAccount(p?.accountId ?? "");
    setActive(p?.accountActive ?? true);
    setCoop(p?.cooperation ?? "active");
    setReason(p?.restrictionReason ?? "");
  };
  const field = "w-full rounded-lg border border-border bg-background p-3 text-sm";
  const partnerSelect = (
    <select
      aria-label={t("合作對象", "Partner")}
      className={field}
      value={partnerId}
      onChange={(e) => selectPartner(e.target.value)}
    >
      <option value="">{t("選擇合作對象", "Choose partner")}</option>
      {state.partners.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} · {p.id}
        </option>
      ))}
    </select>
  );
  const contractSelect = (
    <select
      aria-label={t("合約版本", "Contract version")}
      className={field}
      value={contract}
      onChange={(e) => setContract(e.target.value)}
    >
      <option value="">{t("選擇合約版本", "Choose contract version")}</option>
      {state.contracts.map((c) => (
        <option key={c.id} value={c.id}>
          {state.partners.find((p) => p.id === c.partnerId)?.name} · v{c.version} ·{" "}
          {statusLabel(c.status)}
        </option>
      ))}
    </select>
  );
  if (
    local.enabled &&
    !local.loading &&
    !["official", ...(creator ? ["creator"] : [])].includes(local.summary?.user.role ?? "")
  )
    return (
      <div role="alert">syntheticLocalTest · Current server role does not allow this page.</div>
    );
  return (
    <div className="space-y-5">
      {local.enabled && (
        <p>
          syntheticLocalTest · Server cooperation snapshots. Consent and review requests use
          synthetic SQLite versions; revenue settlement remains incomplete.
        </p>
      )}
      <header className="space-y-2">
        <h1 className="text-2xl font-black">
          {creator
            ? t("合作與合約（示意）", "Cooperation & contracts (demo)")
            : t("合作營運管理（示意）", "Collaboration operations (demo)")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {local.enabled
            ? "syntheticLocalTest: SQLite consent and review workflow, enforced current roles and ownership; no valid electronic signing, legal commitment or real withdrawal."
            : t(
                "Local Mock：同意僅測試流程，不是有效電子簽約。收益為計算範例，沒有真實提領或上架；帳號選擇是示意，伺服器權限尚未接入。",
                "Local Mock: consent tests the workflow, not valid electronic signing. Revenue is a calculation example, with no real withdrawals or publication. Account selection is a fixture; server permissions are not connected.",
              )}
        </p>
      </header>
      {storageFailed && (
        <p role="alert">
          {t(
            "儲存不可用，資料只保留於記憶體",
            "Storage unavailable; changes remain in memory only",
          )}
        </p>
      )}
      {message && (
        <p role="status" className="panel p-3 text-sm">
          {message}
        </p>
      )}
      {creator ? (
        <>
          <label className="block space-y-2">
            {t("示意帳號檢視", "Demo account view")}
            <select
              className={field}
              disabled={local.enabled}
              value={local.enabled ? (state.partners[0]?.accountId ?? "") : creatorAccount}
              onChange={(e) => setCreatorAccount(e.target.value)}
            >
              {DEMO_ACCOUNTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.id}
                </option>
              ))}
            </select>
          </label>
          {!creatorPartners.length && (
            <p>
              {t("沒有連結此示意帳號的合作資料", "No collaboration linked to this demo account")}
            </p>
          )}
          {creatorPartners.map((p) => (
            <section key={p.id} className="panel space-y-3 p-4" data-testid="creator-partner">
              <h2 className="font-bold">
                {p.name} · {p.id}
              </h2>
              <p>
                {t("合作狀態", "Cooperation")}: {p.cooperation} · {t("帳號啟用", "Account active")}:{" "}
                {String(p.accountActive)}
              </p>
              <p className="text-sm">
                {withdrawalBlocked(p)
                  ? t("提領限制：", "Withdrawal blocked: ") +
                    (p.restrictionReason ||
                      t("帳號連結或資格尚未完成", "Account linking or approval incomplete"))
                  : t(
                      "示意資格正常；真實提領未開放",
                      "Demo eligibility ready; real withdrawals unavailable",
                    )}
              </p>
              <p className="text-sm">
                {t(
                  "既有持卡與收益紀錄保留；供抽與印製依有效授權另行檢查",
                  "Owned cards and revenue records are retained; ongoing draws and printing require valid license checks",
                )}
              </p>
              <ul className="space-y-2">
                {state.bindings
                  .filter((b) => b.partnerId === p.id)
                  .map((b) => (
                    <li key={b.cardId}>
                      {ALBUM.find((c) => c.id === b.cardId)?.name} · {b.cardId} ·{" "}
                      {t("合約", "Contract")}: {b.contractId}
                    </li>
                  ))}
              </ul>
              {state.contracts
                .filter((c) => c.partnerId === p.id)
                .map((c) => (
                  <article key={c.id} className="rounded-lg border border-border p-3">
                    <p>
                      v{c.version} · {c.status} · {statusLabel(c.terms.remuneration)} ·{" "}
                      {c.terms.rate}%
                    </p>
                    <p>
                      {t("唯一收款人", "Single payee")}: {c.terms.payeeId}
                    </p>
                    <p className="break-words text-sm">{c.text}</p>
                    <p className="text-xs">
                      {c.confirmedAt || t("尚未模擬確認", "Not yet confirmed in demo")}
                    </p>
                    {c.status === "pending" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          onClick={() =>
                            action((s) =>
                              transitionContract(s, c.id, "agreed", operationId(), operationTime()),
                            )
                          }
                        >
                          {t("模擬同意", "Simulate agreement")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            action((s) =>
                              transitionContract(
                                s,
                                c.id,
                                "returned",
                                operationId(),
                                operationTime(),
                                t("創作者要求修訂（示意）", "Creator requests revision (demo)"),
                              ),
                            )
                          }
                        >
                          {t("模擬退回", "Simulate return")}
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              {state.revenue
                .filter((r) => r.partnerId === p.id)
                .map((r) => (
                  <p className="text-sm" key={r.id}>
                    {t("示意收益", "Example revenue")}: NT${r.base} × {r.rate}% = NT${r.amount} ·{" "}
                    {t("合約快照", "Contract snapshot")}: {r.contractId}
                  </p>
                ))}
              <label className="block">
                {t("限制原因處理申請（示意）", "Restriction review request (demo)")}
                <input
                  className={field}
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                />
              </label>
              <Button
                variant="outline"
                disabled={!request.trim()}
                onClick={() =>
                  action((s) => requestReview(s, p.id, request, operationId(), operationTime()))
                }
              >
                {t("保存處理申請", "Save review request")}
              </Button>
              {state.requests
                .filter((r) => r.partnerId === p.id)
                .map((r) => (
                  <p className="text-xs" key={r.id}>
                    {r.at} · {r.status} · {r.note}
                  </p>
                ))}
            </section>
          ))}
        </>
      ) : (
        <>
          <nav className="flex flex-wrap gap-2" aria-label={t("營運模組", "Operations modules")}>
            {[
              ["partners", "合作對象", "Partners"],
              ["cards", "卡牌", "Cards"],
              ["contracts", "合約版本", "Contracts"],
              ["listing", "上架檢查", "Listing checks"],
              ["audit", "操作紀錄", "Audit"],
            ].map(([key, zh, en]) => (
              <Button
                key={key}
                variant={tab === key ? "default" : "outline"}
                onClick={() => setTab(key!)}
              >
                {t(zh!, en!)}
              </Button>
            ))}
            <Link to="/admin/content" className="rounded-lg border border-border p-3 text-sm">
              {t("內容／FAQ", "Content / FAQ")}
            </Link>
          </nav>
          {tab === "partners" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  aria-label={t("搜尋合作對象", "Search partners")}
                  placeholder={t("搜尋合作對象", "Search partners")}
                  className={field}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  aria-label={t("合作狀態篩選", "Cooperation filter")}
                  className={field}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {["all", "active", "stopped"].map((v) => (
                    <option key={v} value={v}>
                      {statusLabel(v)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {partners.map((p) => (
                  <button
                    className="panel break-words p-4 text-left"
                    key={p.id}
                    onClick={() => selectPartner(p.id)}
                    data-testid="partner-row"
                  >
                    <strong>{p.name}</strong>
                    <p className="text-xs">
                      {p.id} · {p.accountId || t("無帳號（可買斷）", "No account (buyout allowed)")}{" "}
                      · {p.cooperation}
                    </p>
                  </button>
                ))}
              </div>
              <form
                className="panel space-y-3 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const id = selected || operationId();
                  action((s) =>
                    savePartner(
                      s,
                      {
                        id,
                        name: name.trim(),
                        accountId: account,
                        accountActive: active,
                        cooperation: coop,
                        restrictionReason: reason,
                      },
                      operationId(),
                      operationTime(),
                    ),
                  );
                  setSelected(id);
                }}
              >
                <h2 className="font-bold">{t("合作對象草稿", "Partner draft")}</h2>
                <label className="block">
                  {t("名稱", "Name")}
                  <input
                    required
                    maxLength={100}
                    className={field}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="partner-name"
                  />
                </label>
                <label className="block">
                  {t("連結帳號（買斷可留空）", "Linked account (optional for buyout)")}
                  <select
                    className={field}
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    data-testid="partner-account"
                  >
                    <option value="">{t("無帳號", "No account")}</option>
                    {DEMO_ACCOUNTS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ·{" "}
                        {a.approved
                          ? t("已核准示意資格", "Approved demo creator")
                          : t("待審", "Pending")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  {t("帳號啟用（獨立於合作狀態）", "Account active (separate from cooperation)")}
                </label>
                <label className="block">
                  {t("合作狀態", "Cooperation")}
                  <select
                    className={field}
                    value={coop}
                    onChange={(e) => setCoop(e.target.value as "active" | "stopped")}
                  >
                    <option value="active">{statusLabel("active")}</option>
                    <option value="stopped">{statusLabel("stopped")}</option>
                  </select>
                </label>
                <label className="block">
                  {t("限制／停用原因", "Restriction / deactivation reason")}
                  <input
                    className={field}
                    required={!active || coop === "stopped"}
                    maxLength={1000}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    data-testid="restriction-reason"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button>{t("保存合作對象", "Save partner")}</Button>
                  <Button type="button" variant="outline" onClick={() => selectPartner("")}>
                    {t("新增對象", "New partner")}
                  </Button>
                </div>
              </form>
            </>
          )}
          {tab === "contracts" && (
            <>
              <form
                className="panel space-y-3 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  action((s) =>
                    createContract(
                      s,
                      partnerId,
                      { ...terms, payeeId: partnerId },
                      text,
                      operationId(),
                      operationTime(),
                    ),
                  );
                }}
              >
                <h2 className="font-bold">{t("新增合約版本草稿", "New contract version draft")}</h2>
                {partnerSelect}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    {t("授權期限", "License term")}
                    <select
                      className={field}
                      value={terms.term}
                      onChange={(e) => patch("term", e.target.value as OpsTerms["term"])}
                    >
                      <option value="fixed">{t("固定期限", "Fixed term")}</option>
                      <option value="perpetual">
                        {t("永久（只指期限）", "Perpetual (term only)")}
                      </option>
                    </select>
                  </label>
                  <label>
                    {t("報酬方式", "Remuneration")}
                    <select
                      className={field}
                      value={terms.remuneration}
                      onChange={(e) =>
                        patch("remuneration", e.target.value as OpsTerms["remuneration"])
                      }
                      data-testid="remuneration"
                    >
                      <option value="buyout">{statusLabel("buyout")}</option>
                      <option value="share">{statusLabel("share")}</option>
                      <option value="mixed">{statusLabel("mixed")}</option>
                    </select>
                  </label>
                  <label>
                    {t("開始", "Start")}
                    <input
                      type="date"
                      required
                      className={field}
                      value={terms.start}
                      onChange={(e) => patch("start", e.target.value)}
                    />
                  </label>
                  <label>
                    {t("結束（固定期限）", "End (fixed term)")}
                    <input
                      type="date"
                      required={terms.term === "fixed"}
                      disabled={terms.term === "perpetual"}
                      className={field}
                      value={terms.end}
                      onChange={(e) => patch("end", e.target.value)}
                    />
                  </label>
                </div>
                <label className="block">
                  {t("授權範圍", "License scope")}
                  <input
                    required
                    className={field}
                    maxLength={1000}
                    value={terms.scope}
                    onChange={(e) => patch("scope", e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-3">
                  <label>
                    <input
                      type="checkbox"
                      checked={terms.display}
                      onChange={(e) => patch("display", e.target.checked)}
                    />
                    {t("平台公開展示", "Public display")}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={terms.print}
                      onChange={(e) => patch("print", e.target.checked)}
                    />
                    {t("實體印製（獨立授權）", "Physical printing (separate right)")}
                  </label>
                </div>
                <label className="block">
                  {t(
                    "授權證據（示意說明，不上傳檔案）",
                    "License evidence (demo description, no upload)",
                  )}
                  <input
                    className={field}
                    maxLength={1000}
                    value={terms.evidence}
                    onChange={(e) => patch("evidence", e.target.value)}
                    data-testid="license-evidence"
                  />
                </label>
                <label className="block">
                  {t("測試比例 %（非正式報酬）", "Test rate % (not final compensation)")}
                  <input
                    className={field}
                    type="number"
                    min={0}
                    max={100}
                    step="any"
                    value={terms.rate}
                    onChange={(e) => patch("rate", Number(e.target.value))}
                  />
                </label>
                <label className="block">
                  {t("示意分潤計算基礎", "Example revenue basis")}
                  <input
                    className={field}
                    maxLength={1000}
                    value={terms.basis}
                    onChange={(e) => patch("basis", e.target.value)}
                  />
                </label>
                <p>
                  {t("唯一收款對象 ID", "Single payee partner ID")}: {partnerId || "—"}
                </p>
                <label className="block">
                  {t("合約內容快照", "Contract text snapshot")}
                  <textarea
                    required
                    className={field}
                    maxLength={10000}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    data-testid="contract-text"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={!partnerId}>
                    {t("建立新版本草稿", "Create draft version")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setPreview(!preview)}>
                    {t("预覽草稿", "Preview draft")}
                  </Button>
                </div>
                {preview && <pre className="whitespace-pre-wrap break-words text-xs">{text}</pre>}
              </form>
              {state.contracts.map((c) => (
                <article className="panel space-y-2 p-4" key={c.id} data-testid="contract-row">
                  <h3 className="font-bold">
                    {state.partners.find((p) => p.id === c.partnerId)?.name} · v{c.version} ·{" "}
                    {c.status}
                  </h3>
                  <p className="break-words text-sm">{c.text}</p>
                  <p className="text-xs">
                    {c.id} · {c.createdAt} · {c.confirmedAt}
                  </p>
                  <p className="text-xs">
                    {c.terms.term} · {c.terms.remuneration} · {c.terms.rate}% ·{" "}
                    {t("唯一收款人", "Single payee")}: {c.terms.payeeId}
                  </p>
                  <p className="break-words text-xs">
                    {c.terms.scope} · {c.terms.evidence} · {c.terms.basis}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {c.status === "draft" && (
                      <Button
                        onClick={() =>
                          action((s) =>
                            transitionContract(s, c.id, "pending", operationId(), operationTime()),
                          )
                        }
                      >
                        {t("送交模擬確認", "Submit for demo confirmation")}
                      </Button>
                    )}
                    {c.status === "pending" && (
                      <>
                        <Button
                          onClick={() =>
                            action((s) =>
                              transitionContract(s, c.id, "agreed", operationId(), operationTime()),
                            )
                          }
                        >
                          {t("代合作方模擬同意", "Simulate partner agreement")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            action((s) =>
                              transitionContract(
                                s,
                                c.id,
                                "returned",
                                operationId(),
                                operationTime(),
                                "Revision requested (demo)",
                              ),
                            )
                          }
                        >
                          {t("模擬退回", "Simulate return")}
                        </Button>
                      </>
                    )}
                    {c.status === "agreed" && c.terms.remuneration !== "buyout" && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          action((s) => revenueExample(s, c.id, operationId(), operationTime()))
                        }
                      >
                        {t("保存收益範例", "Save revenue example")}
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </>
          )}
          {tab === "cards" && (
            <section className="panel space-y-3 p-4">
              <h2 className="font-bold">
                {t("卡牌關聯與顯示草稿", "Card relations and visibility draft")}
              </h2>
              <select
                className={field}
                aria-label={t("卡牌", "Card")}
                value={card}
                onChange={(e) => setCard(e.target.value)}
              >
                {ALBUM.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.poolName} · {c.grade} · {c.name} · {c.id}
                  </option>
                ))}
              </select>
              {contractSelect}
              <label>
                <input
                  type="checkbox"
                  checked={artwork}
                  onChange={(e) => setArtwork(e.target.checked)}
                />
                {t("卡面示意素材已備齊", "Demo artwork ready")}
              </label>
              <select
                className={field}
                aria-label={t("顯示規則", "Visibility rule")}
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as typeof visibility)}
              >
                <option>normal</option>
                <option>grayscale</option>
                <option>hidden</option>
              </select>
              <Button
                disabled={!contract}
                onClick={() =>
                  action((s) =>
                    bindCard(
                      s,
                      card,
                      contract,
                      artwork,
                      visibility,
                      operationId(),
                      operationTime(),
                    ),
                  )
                }
              >
                {t("保存卡牌草稿關聯", "Save card draft relation")}
              </Button>
              <p className="text-xs">
                {t(
                  "此為營運草稿；不改寫已持有卡或公開卡面規則，需經上架版本檢查。",
                  "This operations draft does not rewrite owned cards or public artwork rules; a listing version check is required.",
                )}
              </p>
              {state.bindings.map((b) => (
                <p key={b.cardId} className="break-words text-xs">
                  {b.cardId} · {b.partnerId} · {b.contractId} · {b.visibility} · {String(b.artwork)}
                </p>
              ))}
            </section>
          )}
          {tab === "listing" && (
            <section className="panel space-y-3 p-4">
              <h2 className="font-bold">
                {t("卡池上架檢查（只預覽）", "Pool listing check (preview only)")}
              </h2>
              <select
                className={field}
                value={pool}
                aria-label={t("卡池", "Pool")}
                onChange={(e) => setPool(e.target.value)}
              >
                {POOLS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {contractSelect}
              <Button
                variant="outline"
                disabled={!contract}
                onClick={() =>
                  action((s) =>
                    ALBUM.filter(
                      (c) => c.poolId === pool && !s.bindings.some((b) => b.cardId === c.id),
                    ).reduce(
                      (next, c) =>
                        bindCard(
                          next,
                          c.id,
                          contract,
                          artwork,
                          visibility,
                          operationId(),
                          operationTime(),
                        ),
                      s,
                    ),
                  )
                }
              >
                {t(
                  "為未關聯卡牌建立草稿（不覆寫其他創作者）",
                  "Bind unlinked cards as drafts (preserve other creators)",
                )}
              </Button>
              <p className="text-xs">
                {t(
                  "每張卡須有卡面、等級、顯示規則、授權證據及已模擬同意的合約；分潤另需帳號與創作者資格。",
                  "Each card needs artwork, grade, visibility, license evidence and an agreed demo contract; sharing also needs an account and creator approval.",
                )}
              </p>
              <ul className="space-y-1 break-words text-xs" data-testid="listing-issues">
                {listingIssues(state, pool, now).map((issue) => (
                  <li key={issue}>{issueLabel(issue)}</li>
                ))}
              </ul>
              {!listingIssues(state, pool, now).length && (
                <p data-testid="listing-ready">
                  {t("示意檢查通過（不代表已上架）", "Demo checks passed (not published)")}
                </p>
              )}
              <Button
                disabled={!!listingIssues(state, pool, now).length}
                onClick={() =>
                  action((s) =>
                    snapshotPool(
                      s,
                      pool,
                      JSON.stringify(POOLS.find((p) => p.id === pool)),
                      operationId(),
                      operationTime(),
                    ),
                  )
                }
              >
                {t("保存上架預覽版本", "Save listing preview version")}
              </Button>
              {state.poolVersions
                .filter((v) => v.poolId === pool)
                .map((v) => (
                  <details key={v.id} className="rounded border border-border p-3">
                    <summary>
                      v{v.number} · {v.at} · {v.bindings.length} {t("卡牌", "cards")}
                    </summary>
                    <pre className="whitespace-pre-wrap break-words text-xs">
                      {JSON.stringify(v, null, 2)}
                    </pre>
                  </details>
                ))}
            </section>
          )}
          {tab === "audit" && (
            <section className="panel space-y-3 p-4">
              <h2 className="font-bold">
                {t("示意操作紀錄與處理申請", "Demo audit and review requests")}
              </h2>
              {[...state.audit].reverse().map((a) => (
                <p key={a.id} className="break-words text-xs">
                  {a.at} · {a.action} · {a.target} · {a.note}
                </p>
              ))}
              {state.requests.map((r) => (
                <p key={r.id} className="break-words text-xs">
                  {r.partnerId} · {r.status} · {r.note}
                </p>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
