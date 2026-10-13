import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PLAY_MODES, PLAY_DIFFICULTIES } from "@/lib/collection-play.mjs";
import { useDiscoveryText } from "@/lib/discovery-copy";
import type { PlayPrivate } from "./PlayRecords";
import type { PracticeItem } from "@/lib/play-practice.mjs";
import { practiceRoundCount, practiceStep } from "@/lib/play-practice.mjs";
export function PracticePlan({
  snapshot,
  busy,
  editable,
  onCommand,
  draft,
  onDraft,
}: {
  snapshot: PlayPrivate;
  busy: boolean;
  editable: boolean;
  onCommand: (data: unknown) => void;
  draft: PracticeItem[] | null;
  onDraft: (items: PracticeItem[] | null) => void;
}) {
  const t = useDiscoveryText(),
    saved = snapshot.settings.data.practice,
    items = draft ?? saved?.items ?? [],
    [mode, setMode] = useState("knowledge"),
    [difficulty, setDifficulty] = useState("easy"),
    [rounds, setRounds] = useState(1),
    [hints, setHints] = useState<"none" | "allowed">("none"),
    [confirm, setConfirm] = useState(false),
    dirty = JSON.stringify(items) !== JSON.stringify(saved?.items ?? []);
  const setItems = onDraft;
  const name = (id: string) =>
    ({
      memory: t("記憶配對", "Memory matching"),
      knowledge: t("卡冊知識", "Album knowledge"),
      observation: t("收藏觀察", "Collection observation"),
      puzzle: t("卡牌拼圖", "Card puzzle"),
      sequence: t("順序記憶", "Sequence memory"),
    })[id] ?? id;
  const start = () => onCommand({ items, paused: false, restart: true, cancel: false });
  return (
    <section id="practice-plan" data-practice-plan className="space-y-3 rounded border p-3">
      <h3 className="font-bold">{t("私人練習清單", "Private practice list")}</h3>
      <p>
        {t(
          "最多12項不同玩法／難度組合；題組只用本人持卡的當前公開定義。保存後依順序完成並保存摘要；沒有登入連續獎勵。錯題練習沿本局知識回顧，離頁後沒有原題歷史時不捏造。",
          "Up to 12 distinct mode / difficulty pairs. Questions use current public definitions of your held cards. After saving, complete and save summaries in order; no login streak rewards. Missed-question practice uses the current knowledge review; absent historical questions are not invented after leaving.",
        )}
      </p>
      <p role="status">
        {dirty
          ? t("未保存練習清單", "Unsaved practice list")
          : t("已讀取本機設定", "Local settings loaded")}{" "}
        · v{snapshot.settings.version}
      </p>
      {editable ? (
        <>
          <label>
            {t("玩法", "Mode")}{" "}
            <select
              aria-label="Practice mode"
              disabled={busy}
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              {PLAY_MODES.map((id) => (
                <option key={id} value={id}>
                  {name(id)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("難度", "Difficulty")}{" "}
            <select
              aria-label="Practice difficulty"
              disabled={busy}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {PLAY_DIFFICULTIES.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          {["memory", "puzzle", "sequence"].includes(mode) && (
            <label>
              {t("計入提示條件", "Counted hint policy")}{" "}
              <select
                aria-label="Practice hints"
                disabled={busy}
                value={hints}
                onChange={(e) => setHints(e.target.value as "none" | "allowed")}
              >
                <option value="none">{t("只計無提示结果", "Unassisted results only")}</option>
                <option value="allowed">{t("允許最多3次提示", "Up to 3 hints allowed")}</option>
              </select>
            </label>
          )}
          <p className="text-sm">
            {t(
              "請在原玩法面板選相同難度與提示；清單不改抽卡、素材或正式規則。",
              "Choose the matching difficulty and hints in the existing mode panel. The list changes no draws, material or official rules.",
            )}
          </p>
          <label>
            {t("每項回合數（整份最多30）", "Rounds per item (30 total maximum)")}{" "}
            <select
              aria-label="Practice rounds"
              value={rounds}
              disabled={busy}
              onChange={(e) => setRounds(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <Button
            data-add-practice
            disabled={
              busy ||
              items.length >= 12 ||
              practiceRoundCount(items) + rounds > 30 ||
              items.some(
                (i) =>
                  i.mode === mode &&
                  i.difficulty === difficulty &&
                  i.hints === (["memory", "puzzle", "sequence"].includes(mode) ? hints : undefined),
              )
            }
            onClick={() =>
              setItems([
                ...items,
                {
                  mode,
                  difficulty,
                  ...(rounds > 1 ? { rounds } : {}),
                  ...(["memory", "puzzle", "sequence"].includes(mode) ? { hints } : {}),
                },
              ])
            }
          >
            {t("加入練習草稿", "Add practice draft")}
          </Button>
          <ol>
            {items.map((item, i) => (
              <li
                key={item.mode + item.difficulty + item.hints}
                className="flex flex-wrap gap-2 items-center"
              >
                {i + 1}. {name(item.mode)} / {item.difficulty}
                {item.rounds && ` · ×${item.rounds}`}
                {item.hints &&
                  (item.hints === "none"
                    ? t(" · 無提示結果", " · unassisted result")
                    : t(" · 允許最多3次提示", " · up to 3 hints allowed"))}
                <Button
                  variant="outline"
                  disabled={busy || i === 0}
                  onClick={() => {
                    const next = [...items];
                    [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
                    setItems(next);
                  }}
                >
                  {t("上移", "Move up")}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setItems(items.filter((_, n) => n !== i))}
                >
                  {t("移除草稿項目", "Remove draft item")}
                </Button>
              </li>
            ))}
          </ol>
          <Button
            data-save-practice
            disabled={busy || !dirty || !items.length}
            onClick={() => {
              if (saved?.completed) setConfirm(true);
              else start();
            }}
          >
            {t("保存並開始清單", "Save and start list")}
          </Button>
          <Button variant="outline" disabled={busy || !dirty} onClick={() => setItems(null)}>
            {t("取消練習草稿修改", "Cancel practice draft changes")}
          </Button>
          <ConfirmDialog
            open={confirm}
            title={t("重新安排練習清單？", "Rearrange practice list?")}
            description={t(
              "清單進度重新開始；已保存遊玩紀錄保留。",
              "List progress restarts; saved play records remain.",
            )}
            onConfirm={() => {
              setConfirm(false);
              start();
            }}
            onCancel={() => setConfirm(false)}
          />
        </>
      ) : (
        <Link className="underline text-primary" to="/app/play" hash="practice-plan">
          {t("前往本人練習清單", "Go to your practice list")}
        </Link>
      )}
      {saved ? (
        <div data-practice-progress>
          {!!saved.roundSummaries?.length && (
            <ol data-practice-round-summaries>
              {saved.roundSummaries.map((r) => (
                <li key={r.position}>
                  {r.position}. {name(r.mode)} / {r.difficulty} · {r.correct}/{r.total} ·{" "}
                  {r.ruleVersion}
                </li>
              ))}
            </ol>
          )}
          <p>
            {saved.startedAt} · {saved.ruleVersion} ·{" "}
            {saved.invalidated
              ? t("來源失效，進度已遮蔽。", "Sources unavailable; progress concealed.")
              : `${saved.completed}/${practiceRoundCount(saved.items)}`}
          </p>
          <p>
            {saved.paused
              ? t("清單已暫停。", "List paused.")
              : saved.completed === practiceRoundCount(saved.items)
                ? t("練習完成，回顧私人紀錄。", "Practice complete; review private records.")
                : t(
                    "只計下一個玩法／難度相符的合法保存結果。",
                    "Only an eligible saved result matching the next mode / difficulty advances.",
                  )}
          </p>
          {editable && (
            <>
              <Button
                data-pause-practice
                variant="outline"
                disabled={busy}
                onClick={() =>
                  onCommand({
                    items: saved.items,
                    paused: !saved.paused,
                    restart: false,
                    cancel: false,
                  })
                }
              >
                {t("暫停／繼續清單", "Pause / resume list")}
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  onCommand({ items: [], paused: false, restart: false, cancel: true })
                }
              >
                {t("取消已保存清單（保留紀錄）", "Cancel saved list (keep records)")}
              </Button>
              {!saved.invalidated && saved.completed < practiceRoundCount(saved.items) && (
                <Button
                  data-next-practice
                  variant="outline"
                  onClick={() => {
                    const next = practiceStep(saved.items, saved.completed)!,
                      el = document.getElementById("play-" + next.mode);
                    el?.scrollIntoView({ block: "start", behavior: "auto" });
                    el?.querySelector<HTMLSelectElement>("select")?.focus({ preventScroll: true });
                  }}
                >
                  {t("定位下一玩法，核對清單難度", "Find next mode; check list difficulty")}
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <p>{t("尚未選擇私人練習清單。", "No private practice list selected.")}</p>
      )}
    </section>
  );
}
