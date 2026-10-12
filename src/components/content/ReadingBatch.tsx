import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { localTestState, localSessionGeneration } from "@/lib/local-test-client";
import {
  organizeReading,
  hasPendingDiscovery,
  READING_COMMAND,
  refreshReading,
} from "@/lib/discovery-store";
export function ReadingBatch({
  ids,
  pageIds,
  scope,
  version,
  groups,
  change,
}: {
  ids: string[];
  pageIds: string[];
  scope: string;
  version: number;
  groups: { id: string; name: string }[];
  change: (ids: string[]) => void;
}) {
  const t = useDiscoveryText(),
    [target, setTarget] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<{ scope: string; text: string } | null>(null),
    [confirm, setConfirm] = useState<{
      scope: string;
      actor: string | undefined;
      input: Record<string, unknown>;
      summary: string;
    } | null>(null);
  const locked = busy || hasPendingDiscovery(READING_COMMAND);
  const prepare = (action: "bulk-state" | "bulk-group", state?: string) =>
    setConfirm({
      scope,
      actor: localTestState().summary?.user.id,
      input: {
        action,
        articleIds: [...ids],
        expectedVersion: version,
        ...(action === "bulk-state"
          ? { state }
          : { groupId: groups.some((g) => g.id === target) ? target : "" }),
      },
      summary:
        action === "bulk-state"
          ? t(
              state === "read" ? "設為已讀" : "設為待讀",
              state === "read" ? "Mark read" : "Mark unread",
            )
          : t("移至分組：", "Move to group: ") +
            (groups.find((g) => g.id === target)?.name ?? t("未分組", "Ungrouped")),
    });
  const command = confirm?.scope === scope ? confirm : null;
  return (
    <section data-reading-batch className="panel space-y-3 p-4">
      <p>
        {t(
          "每頁最多20項，只整理目前選取的本頁項目。",
          "Up to 20 entries per page; only selected entries on this page are changed.",
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={locked || !pageIds.length}
          onClick={() => change(ids.length === pageIds.length ? [] : pageIds)}
        >
          {t("選取／取消本頁", "Select / clear this page")}
        </Button>
        <span role="status">
          {t("已選", "Selected")} {ids.length}
        </span>
        <Button disabled={locked || !ids.length} onClick={() => prepare("bulk-state", "unread")}>
          {t("批次待讀", "Mark selected unread")}
        </Button>
        <Button disabled={locked || !ids.length} onClick={() => prepare("bulk-state", "read")}>
          {t("批次已讀", "Mark selected read")}
        </Button>
        <label>
          {t("目的分組", "Destination group")}
          <select
            aria-label="Batch destination group"
            className="rounded-lg border bg-background p-2"
            disabled={locked}
            value={groups.some((g) => g.id === target) ? target : ""}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="">{t("未分組", "Ungrouped")}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <Button disabled={locked || !ids.length} onClick={() => prepare("bulk-group")}>
          {t("批次移組", "Move selected")}
        </Button>
      </div>
      {error?.scope === scope && (
        <div role="alert">
          <p>{error.text}</p>
          <p>
            {t(
              "409：重新讀取、重新選取並確認；回應丟失：使用上方原操作確認，勿建立新請求。",
              "409: reload, select again and confirm. Lost response: confirm the original operation above; do not create another request.",
            )}
          </p>
          <Button variant="outline" disabled={locked} onClick={() => void refreshReading()}>
            {t("重新讀取閱讀清單", "Reload reading list")}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={!!command}
        title={t("確認閱讀批次整理？", "Confirm reading changes?")}
        description={command ? `${command.summary} · ${ids.length} · v${version}` : ""}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!command || locked) return;
          const epoch = localSessionGeneration();
          const active = () =>
            epoch === localSessionGeneration() &&
            localTestState().summary?.user.id === command.actor;
          setConfirm(null);
          setBusy(true);
          setError(null);
          try {
            await organizeReading(command.input);
            if (active()) change([]);
          } catch (e) {
            if (active()) setError({ scope, text: String(e) });
          } finally {
            if (active()) setBusy(false);
          }
        }}
      />
    </section>
  );
}
