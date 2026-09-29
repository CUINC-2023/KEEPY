import { createFileRoute, Link } from "@tanstack/react-router";
import { PLAYER, TBD_ITEMS } from "@/data/player";
import { usePlayerSettings, type PlayerSettings } from "@/lib/player-store";
import { StatePlaceholder, StateSwitcher, useDemoState } from "@/components/ui/state-demo";
import { useToast } from "@/components/ui/toast";

export const Route = createFileRoute("/app/settings/")({
  head: () => ({
    meta: [
      { title: "玩家設定 — CU 女神卡" },
      { name: "description", content: "基本資料、Reduce Motion、通知與隱私設定的介面原型。" },
      { property: "og:title", content: "玩家設定 — CU 女神卡" },
      { property: "og:description", content: "玩家設定原型，包含動畫、通知與隱私選項。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function Toggle({
  label,
  desc,
  field,
}: {
  label: string;
  desc: string;
  field: keyof PlayerSettings;
}) {
  const { settings, update } = usePlayerSettings();
  const value = Boolean(settings[field]);
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-border/60 py-3 last:border-0">
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        <span className="block text-[11px] leading-relaxed text-muted-foreground">{desc}</span>
      </span>
      <button
        type="button"
        onClick={() => update(field, !value as never)}
        aria-pressed={value}
        className={`mt-1 h-6 w-11 shrink-0 rounded-full border transition-colors ${
          value ? "border-primary bg-primary/70" : "border-border bg-muted"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-foreground transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </label>
  );
}

function SettingsPage() {
  const [state, setState] = useDemoState();
  const { settings, update } = usePlayerSettings();
  const { push } = useToast();

  return (
    <div className="space-y-5">
      <StateSwitcher state={state} onChange={setState} />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-black sm:text-2xl">玩家設定</h1>
        <span className="demo-chip">設定不會被儲存</span>
      </div>

      {state !== "ok" ? (
        <StatePlaceholder state={state} emptyTitle="無法載入設定" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="panel p-4 sm:p-5">
            <p className="text-sm font-black">基本資料</p>
            <label className="mt-3 block text-[11px] text-muted-foreground">
              暱稱
              <input
                value={settings.nickname}
                onChange={(e) => update("nickname", e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-semibold text-foreground"
              />
            </label>
            <label className="mt-3 block text-[11px] text-muted-foreground">
              個人簡介
              <textarea
                value={settings.bio}
                onChange={(e) => update("bio", e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-foreground"
              />
            </label>
            <p className="mt-3 text-[11px] text-muted-foreground">
              等級 Lv.{PLAYER.level}・卡牌總數 {PLAYER.totalCards} 張（Mock）
            </p>
            <button
              onClick={() => push({ title: "已儲存（Demo）", description: "原型不會寫入任何資料。" })}
              className="mt-3 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              儲存變更（Demo）
            </button>
          </div>

          <div className="panel p-4 sm:p-5">
            <p className="text-sm font-black">顯示與動畫</p>
            <div className="mt-2">
              <Toggle label="Reduce Motion" desc="減少動畫與轉場效果，抽卡與合成結果將直接顯示。" field="reduceMotion" />
              <Toggle label="略過抽卡動畫" desc="每次抽卡自動顯示完整結果，不播放逐張翻牌動畫。" field="skipDrawAnimation" />
            </div>
          </div>

          <div className="panel p-4 sm:p-5">
            <p className="text-sm font-black">通知</p>
            <div className="mt-2">
              <Toggle label="新卡池開放通知" desc="卡池開始與即將結束時提醒我。" field="notifyNewPool" />
              <Toggle label="女神動態通知" desc="追蹤的女神有新卡牌或公告時通知我。" field="notifyGoddessUpdate" />
              <Toggle label="行銷訊息" desc="接收活動與優惠資訊（Demo）。" field="notifyMarketing" />
            </div>
          </div>

          <div className="panel p-4 sm:p-5">
            <p className="text-sm font-black">隱私</p>
            <div className="mt-2">
              <Toggle label="公開我的卡冊" desc="其他玩家可查看我的收藏進度。" field="publicAlbum" />
              <Toggle label="公開排行榜暱稱" desc="在公開排行榜顯示我的暱稱。" field="publicRanking" />
            </div>
            <Link
              to="/app/settings/privacy"
              className="mt-3 inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:border-primary/50"
            >
              管理公開頁與展示內容
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="panel p-4 sm:p-5 lg:col-span-2">
            <p className="text-sm font-black">尚待決策（Demo／待定）</p>
            <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {TBD_ITEMS.map((t) => (
                <li key={t}>・{t}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
