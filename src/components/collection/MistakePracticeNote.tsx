import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCollection, refreshCollectionMe, type CollectionMe } from "@/lib/collection-store";
import { isCollectionProjection } from "@/lib/collection-contract.mjs";
import { localApi, localSessionGeneration, localTestState } from "@/lib/local-test-client";
import { discoveryCommand, hasPendingDiscovery } from "@/lib/discovery-store";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocale } from "@/lib/keepy-i18n-shared";
import type { MistakesProjection } from "@/lib/play-review.mjs";

/** Explicit self-reflection, saved as an existing private note, never as a scored play result. */
export function MistakePracticeNote({
  row,
  answer,
}: {
  row: MistakesProjection["rows"][number];
  answer: string;
}) {
  const d = useCollection(),
    t = useDiscoveryText(),
    { locale } = useLocale();
  const [id] = useState(() => "note-" + crypto.randomUUID());
  const [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  const [attempted, setAttempted] = useState(false),
    [error, setError] = useState("");
  const original = useRef<unknown>(null);
  const actor = d.me?.actorId,
    pending = hasPendingDiscovery("/collection/profile");
  async function save(replay = false) {
    if (busy || !actor || (pending && !replay)) return;
    const epoch = localSessionGeneration(),
      current = () =>
        epoch === localSessionGeneration() && localTestState().summary?.user.id === actor;
    setBusy(true);
    setError("");
    try {
      if (replay) {
        if (!attempted || !original.current) return;
        // The existing command store rejects another pending body and reuses this body's key.
        await discoveryCommand("/collection/profile", original.current);
      } else {
        const me = await localApi<CollectionMe>("/collection/me");
        if (!current()) return;
        if (
          !isCollectionProjection(me, "owner") ||
          me.actorId !== actor ||
          me.visibilityKey !== d.me?.visibilityKey ||
          !me.cards.some((c) => c.cardId === row.question.cardId)
        )
          throw Error("Source changed");
        const notes = me.profile.data.notes ?? [];
        if (notes.some((note) => note.id === id)) {
          setSaved(true);
          return;
        }
        if (notes.length >= 30) throw Error("Private note limit reached");
        const text = [
          t("重練自評（非正式計分）", "Practice self-reflection (not scored)"),
          answer === row.question.answer ? t("答對", "Correct") : t("仍需複習", "Review again"),
          row.ruleVersion,
          row.question.prompt[locale],
          row.question.explanation[locale],
        ]
          .join(" · ")
          .slice(0, 1000);
        setAttempted(true);
        original.current = {
          expectedVersion: me.profile.version,
          data: {
            ...me.profile.data,
            notes: [
              ...notes,
              {
                schema: 1,
                id,
                kind: "card",
                subjectId: row.question.cardId,
                category: "practice",
                tags: ["review"],
                text,
              },
            ],
          },
        };
        await discoveryCommand("/collection/profile", original.current);
      }
      if (!current()) return;
      setSaved(true);
      await refreshCollectionMe();
    } catch {
      if (current())
        setError(
          t(
            "未確認／衝突或筆記已達30則。先重讀；有原key待確認時不要新增請求。",
            "Unconfirmed / conflict or 30-note limit. Read back first; confirm pending original keys without a new request.",
          ),
        );
    } finally {
      if (current()) setBusy(false);
    }
  }
  return (
    <section className="space-y-2" data-mistake-note>
      <p className="text-xs text-muted-foreground">
        {t(
          "可明確保存為本人既有私人筆記；這是重練自評，不改逐題快照、正式玩法結果、XP或排行。",
          "Explicitly save to your existing private notes. This is self-reflection, not a change to question snapshots, scored results, XP or rankings.",
        )}
      </p>
      <Button disabled={busy || saved || pending} onClick={() => void save()}>
        {saved
          ? t("已保存私人重練筆記", "Private practice note saved")
          : t("保存本題重練為私人筆記", "Save this practice as a private note")}
      </Button>
      {error && <p role="alert">{error}</p>}
      {(error || pending) && (
        <Button variant="outline" disabled={busy} onClick={() => void refreshCollectionMe()}>
          {t("重讀本人筆記來源", "Reload your note sources")}
        </Button>
      )}
      {pending && attempted && (
        <Button disabled={busy} onClick={() => void save(true)}>
          {t("確認原筆記操作", "Confirm original note operation")}
        </Button>
      )}
      <Link to="/app/notes" className="inline-block text-primary underline">
        {t("查看本人練習筆記", "View your practice notes")}
      </Link>
    </section>
  );
}
