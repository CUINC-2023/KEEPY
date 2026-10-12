import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { QaHint } from "@/components/content/QaHint";
import { PublicPage } from "@/components/public/PublicPage";
import { CardFrame } from "@/components/ui/card-frame";
import { cardCount } from "@/lib/demo-player-model";
import { goddessOf } from "@/data/player";
import { usePlayerCopy } from "@/lib/player-copy";
import { demoPhysicalEligible, previewPhysical, useDemoPlayer } from "@/lib/demo-player-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

export const Route = createFileRoute("/physical-collection")({
  head: () => ({ meta: [{ title: "Physical preview / 實體卡預覽 — KEEPY" }] }),
  component: PhysicalCollectionPage,
});
function PhysicalCollectionPage() {
  const t = usePlayerCopy();
  const { album, state } = useDemoPlayer();
  const [filter, setFilter] = useState<"eligible" | "pending" | "history">("eligible");
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const card = album.find((c) => c.id === selected);
  const eligible = album.filter(demoPhysicalEligible);
  const rows =
    filter === "history"
      ? album.filter((c) => state.physical.includes(c.id))
      : filter === "pending"
        ? album.filter((c) => c.owned && !demoPhysicalEligible(c))
        : eligible;
  const open = (id: string) => {
    setQuantity(String(state.physicalQuantities[id] ?? 1));
    setSelected(id);
    setStep(1);
    setAgreed(false);
    setError(false);
  };
  return (
    <PublicPage
      title={t("實體卡申請預覽", "Physical card request preview")}
      description={t(
        "正式资格尚待核定。本版只示範選卡、確認、送出與完成畫面，不建立訂單、不付款、不收地址、不寄送。",
        "Eligibility awaits approval. Preview card selection, review and completion without an order, payment, address collection or shipping.",
      )}
    >
      <QaHint id="physical" />
      <p className="panel p-4 text-xs font-bold text-gold">
        {t(
          "本機示意條件：已取得 SSR 以上卡牌。此条件非正式兌換資格；預覽不消耗卡牌、名額或編配流水號。",
          "Demo condition: own an SSR-or-higher card. This is not approved eligibility. Previews consume no cards or stock and allocate no edition serial.",
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {(["eligible", "pending", "history"] as const).map((key) => (
          <Button
            key={key}
            variant={filter === key ? "secondary" : "outline"}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {key === "eligible"
              ? t("可預覽", "Preview eligible")
              : key === "pending"
                ? t("條件未達", "Not eligible in demo")
                : t("預覽紀錄", "Preview history")}
          </Button>
        ))}
      </div>
      {!rows.length ? (
        <EmptyState
          title={t("目前沒有符合條件的卡牌", "No matching cards")}
          description={t(
            "先完成示意抽卡，再回來查看。正式资格仍待核定。",
            "Complete a demo draw and check again. Production eligibility is pending.",
          )}
          action={
            <Link
              to="/app/draw/$poolId"
              params={{ poolId: "p-uniform" }}
              className="font-bold text-primary underline"
            >
              {t("前往示意抽卡", "Go to demo draw")}
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((c) => (
            <article key={c.id} data-card-id={c.id} className="panel min-w-0 space-y-3 p-3">
              <CardFrame goddess={goddessOf(c)} grade={c.grade} cardName={c.name} />
              <h2 className="break-words text-sm font-black">{c.name}</h2>
              <p className="text-xs text-muted-foreground">
                {c.poolName} · {c.grade}
              </p>
              <p className="text-xs" data-testid="physical-owned">
                {t("示意持有數量", "Demo copies owned")}: {cardCount(c)}
              </p>
              {state.physical.includes(c.id) && (
                <p className="text-xs" data-testid="physical-saved-quantity">
                  {t("已保存預覽數量", "Saved preview quantity")}:{" "}
                  {state.physicalQuantities[c.id] ?? 1}
                </p>
              )}
              {filter === "pending" ? (
                <p className="text-xs text-gold">
                  {t("未達示意條件，正式資格待核定", "Demo condition unmet; approval pending")}
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {state.physical.includes(c.id)
                      ? t("已完成預覽・未建立訂單", "Preview completed · no order")
                      : t("符合示意條件・待正式核定", "Demo condition met · approval pending")}
                  </p>
                  <Button
                    variant="outline"
                    className="h-auto min-h-11 w-full whitespace-normal"
                    onClick={() => open(c.id)}
                  >
                    {t("申請流程預覽", "Preview request")}
                  </Button>
                </>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="panel p-5">
          <h2 className="font-black">{t("台灣配送（示意）", "Taiwan shipping (preview)")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              "地址、運費與寄送時程待定，本版不收集地址。",
              "Address entry, shipping fees and timelines are pending. No address is collected.",
            )}
          </p>
        </div>
        <div className="panel p-5">
          <h2 className="font-black">{t("海外配送", "International shipping")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("後續另行安排，尚未開放。", "To be arranged separately; not available.")}
          </p>
        </div>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(value) => {
          if (!value) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl">
          <DialogTitle>
            {step === 3
              ? t("申請預覽完成", "Request preview completed")
              : t("實體卡申請預覽", "Physical card request preview")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "示意流程，不是有效申請或寄送訂單。",
              "This demo is not a valid application or shipping order.",
            )}
          </DialogDescription>
          <ol className="flex gap-3 text-xs" aria-label={t("預覽步驟", "Preview steps")}>
            {[t("選卡", "Card"), t("確認", "Review"), t("完成", "Done")].map((label, i) => (
              <li
                key={label}
                aria-current={step === i + 1 ? "step" : undefined}
                className={step === i + 1 ? "font-black text-gold" : "text-muted-foreground"}
              >
                {i + 1}. {label}
              </li>
            ))}
          </ol>
          {card && (
            <>
              <div className="rounded-xl border border-border p-3 text-xs">
                <p className="font-bold">
                  {card.name} · {card.grade}
                </p>
                <p className="mt-1 text-muted-foreground">{card.poolName}</p>
                <p className="mt-1 text-gold">
                  {t(
                    "資格／費用／Edition／流水號：待核定",
                    "Eligibility / fees / edition / serial: pending",
                  )}
                </p>
              </div>
              <p className="text-xs" data-testid="physical-quantity-summary">
                {t("示意持有數量", "Demo copies owned")}: {cardCount(card)} ·{" "}
                {t("預覽數量", "Preview quantity")}: {quantity}
              </p>
              {step === 1 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "持有數量只用於示意资格，预览不消耗卡牌。",
                      "Ownership is used only for demo eligibility. Previewing consumes no cards.",
                    )}
                  </p>
                  <label className="space-y-2 text-sm" htmlFor="physical-quantity">
                    {t("預覽數量（測試設定）", "Preview quantity (test setting)")}
                    <input
                      id="physical-quantity"
                      type="number"
                      min={1}
                      max={cardCount(card)}
                      step={1}
                      value={quantity}
                      disabled={state.physical.includes(card.id)}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background p-3"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "測試範圍為 1 至目前持有數量；正式門檻與兌換數量待核定。已保存的預覽數量不覆寫。",
                      "Test range is 1 to current copies owned; production thresholds and quantities are pending. Saved preview quantities are preserved.",
                    )}
                  </p>
                  <Button
                    disabled={
                      !Number.isSafeInteger(Number(quantity)) ||
                      Number(quantity) < 1 ||
                      (!state.physical.includes(card.id) && Number(quantity) > cardCount(card))
                    }
                    onClick={() => setStep(2)}
                  >
                    {t("下一步：確認預覽", "Next: review preview")}
                  </Button>
                </>
              )}
              {step === 2 && (
                <>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    {t(
                      "我了解這只是預覽，未建立訂單、未付款、未安排寄送。",
                      "I understand this is a preview with no order, payment or shipment.",
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      {t("上一步", "Back")}
                    </Button>
                    <Button
                      disabled={!agreed || !demoPhysicalEligible(card)}
                      onClick={async () => {
                        try {
                          if (await previewPhysical(card.id, Number(quantity))) setStep(3);
                          else setError(true);
                        } catch {
                          setError(true);
                        }
                      }}
                    >
                      {t("完成申請預覽", "Complete preview")}
                    </Button>
                  </div>
                  {error && (
                    <p role="alert" className="text-xs text-gold">
                      {t(
                        "卡牌狀態已異動，請關閉並重新選卡。",
                        "Card state changed. Close and select a card again.",
                      )}
                    </p>
                  )}
                </>
              )}
              {step === 3 && (
                <>
                  <p role="status" className="text-sm font-bold text-gold">
                    {t(
                      "本機預覽紀錄已保存。沒有扣點、消耗卡牌或安排寄送。",
                      "Local preview saved. No KP charged, cards consumed or shipping arranged.",
                    )}
                  </p>
                  <Button
                    onClick={() => {
                      setSelected(null);
                      setFilter("history");
                    }}
                  >
                    {t("查看預覽紀錄", "View preview history")}
                  </Button>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </PublicPage>
  );
}
