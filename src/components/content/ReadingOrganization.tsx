import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDiscoveryText } from "@/lib/discovery-copy";
import { useLocalTest, localTestState } from "@/lib/local-test-client";
import {
  useReadingList,
  organizeReading,
  hasPendingDiscovery,
  READING_COMMAND,
  refreshReading,
} from "@/lib/discovery-store";
export function useReadingFilters() {
  const actor = useLocalTest().summary?.user.id;
  const [view, setView] = useState({ actor: "", group: "all", status: "all" });
  useEffect(() => {
    if (!actor) {
      setView({ actor: "", group: "all", status: "all" });
      return;
    }
    let next = { group: "all", status: "all" };
    try {
      const raw = JSON.parse(sessionStorage.getItem("keepy-reading-view-v1:" + actor) ?? "null");
      if (
        raw &&
        typeof raw.group === "string" &&
        raw.group.length < 100 &&
        ["all", "read", "unread"].includes(raw.status)
      )
        next = raw;
    } catch {
      /* Browser preferences are optional; private server data is unchanged. */
    }
    setView({ actor, ...next });
  }, [actor]);
  const current = view.actor === actor ? view : { actor: actor ?? "", group: "all", status: "all" };
  const change = (group: string, status: string) => {
    if (!actor) return;
    setView({ actor, group, status });
    try {
      sessionStorage.setItem("keepy-reading-view-v1:" + actor, JSON.stringify({ group, status }));
    } catch {
      /* Browser preferences are optional; private server data is unchanged. */
    }
  };
  return { ...current, change };
}
export function ReadingOrganization({
  group,
  status,
  change,
}: {
  group: string;
  status: string;
  change: (group: string, status: string) => void;
}) {
  const r = useReadingList(false),
    local = useLocalTest(),
    actor = local.summary?.user.id,
    t = useDiscoveryText(),
    [name, setName] = useState(""),
    [rename, setRename] = useState<Record<string, string>>({}),
    [deleting, setDeleting] = useState<{ id: string; version: number } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setName("");
    setRename({});
    setDeleting(null);
    setError("");
    setBusy(false);
  }, [actor]);
  const pending = hasPendingDiscovery(READING_COMMAND);
  if (!r.reading || r.error) return null;
  const groups = r.reading.groups;
  const send = async (input: Record<string, unknown>) => {
    if (busy || pending) return;
    setBusy(true);
    setError("");
    try {
      await organizeReading(input);
      if (localTestState().summary?.user.id === actor) {
        setName("");
        setRename({});
        setDeleting(null);
      }
    } catch (e) {
      if (localTestState().summary?.user.id === actor) setError(String(e));
    } finally {
      if (localTestState().summary?.user.id === actor) setBusy(false);
    }
  };
  return (
    <section className="panel space-y-3 p-4" data-reading-organization>
      <h2 className="font-bold">{t("本人閱讀整理", "Organize your reading")}</h2>
      <p>
        {t(
          "已讀僅由你明確操作保存；不記錄閱讀時間或進度。一篇一組，最多20組、每名稱40字。整理條件僅此裝置sessionStorage，不放公開網址。",
          "Read status is saved only by your explicit action; no reading time or progress is tracked. One group per article, up to 20 groups and 40 characters per name. Filters stay in this device’s sessionStorage, outside public URLs.",
        )}
      </p>
      <div className="flex flex-wrap gap-3">
        <label>
          {t("分組條件", "Group filter")}
          <select
            aria-label="Reading group filter"
            className="block max-w-full rounded border bg-background p-2"
            value={group}
            onChange={(e) => change(e.target.value, status)}
          >
            <option value="all">{t("全部分組", "All groups")}</option>
            <option value="">{t("未分組", "Ungrouped")}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("待讀條件", "Read status filter")}
          <select
            aria-label="Reading state filter"
            className="block rounded border bg-background p-2"
            value={status}
            onChange={(e) => change(group, e.target.value)}
          >
            <option value="all">{t("全部狀態", "All states")}</option>
            <option value="unread">{t("待讀", "Unread")}</option>
            <option value="read">{t("已讀", "Read")}</option>
          </select>
        </label>
      </div>
      <label>
        {t("新分組名稱", "New group name")}
        <input
          aria-label="New reading group"
          className="block w-full rounded border bg-background p-2"
          maxLength={40}
          value={name}
          disabled={busy || pending}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <Button
        disabled={busy || pending || !name.trim()}
        onClick={() =>
          void send({ action: "group-create", name, expectedVersion: r.reading!.version })
        }
      >
        {t("建立閱讀分組", "Create reading group")}
      </Button>
      {groups.map((g) => (
        <div key={g.id} data-reading-group className="flex flex-wrap gap-2">
          <label className="min-w-0 flex-1">
            {t("分組名称", "Group name")}
            <input
              aria-label={"Rename reading group " + g.id}
              className="block w-full rounded border bg-background p-2"
              maxLength={40}
              value={rename[g.id] ?? g.name}
              disabled={busy || pending}
              onChange={(e) => setRename({ ...rename, [g.id]: e.target.value })}
            />
          </label>
          <Button
            disabled={busy || pending || !(rename[g.id] ?? g.name).trim()}
            onClick={() =>
              void send({
                action: "group-rename",
                groupId: g.id,
                name: rename[g.id] ?? g.name,
                expectedVersion: r.reading!.version,
              })
            }
          >
            {t("改名", "Rename")}
          </Button>
          <Button
            variant="outline"
            disabled={busy || pending}
            onClick={() => setDeleting({ id: g.id, version: r.reading!.version })}
          >
            {t("刪除分組", "Delete group")}
          </Button>
        </div>
      ))}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button onClick={() => void refreshReading()}>
            {t("重新讀取閱讀清單", "Reload reading list")}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={!!deleting}
        title={t("刪除閱讀分組？", "Delete reading group?")}
        description={t(
          "只將文章移回未分組，不刪除文章或稍後閱讀。",
          "Articles become ungrouped; no article or saved entry is deleted.",
        )}
        confirmLabel={t("確認刪除分組", "Confirm group deletion")}
        cancelLabel={t("取消", "Cancel")}
        tone="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting)
            void send({
              action: "group-delete",
              groupId: deleting.id,
              expectedVersion: deleting.version,
            });
        }}
      />
    </section>
  );
}
export function ReadingItemOrganization({
  articleId,
  state,
  groupId,
  version,
}: {
  articleId: string;
  state: string;
  groupId: string;
  version: number;
}) {
  const r = useReadingList(false),
    local = useLocalTest(),
    actor = local.summary?.user.id,
    t = useDiscoveryText(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setError("");
    setBusy(false);
  }, [actor]);
  const pending = hasPendingDiscovery(READING_COMMAND);
  const send = async (next: Record<string, unknown>) => {
    if (busy || pending) return;
    setBusy(true);
    try {
      await organizeReading({
        action: "item-update",
        articleId,
        state,
        groupId,
        expectedVersion: version,
        ...next,
      });
    } catch (e) {
      if (localTestState().summary?.user.id === actor) setError(String(e));
    } finally {
      if (localTestState().summary?.user.id === actor) setBusy(false);
    }
  };
  return (
    <div data-reading-item-organization className="space-y-2">
      <Button
        disabled={busy || pending}
        aria-pressed={state === "read"}
        onClick={() => void send({ state: state === "read" ? "unread" : "read" })}
      >
        {t(
          state === "read" ? "標為待讀" : "標為已讀",
          state === "read" ? "Mark unread" : "Mark read",
        )}
      </Button>
      <label>
        {t("本人分組", "Your group")}
        <select
          aria-label="Reading item group"
          className="block max-w-full rounded border bg-background p-2"
          value={groupId}
          disabled={busy || pending}
          onChange={(e) => void send({ groupId: e.target.value })}
        >
          <option value="">{t("未分組", "Ungrouped")}</option>
          {r.reading?.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
