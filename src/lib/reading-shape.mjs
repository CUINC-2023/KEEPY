export function readingShape(value) {
  const groups = Array.isArray(value?.groups) ? value.groups : [];
  return {
    groups,
    items: (value?.items ?? []).map((i) => ({
      ...i,
      state: i.state === "read" ? "read" : "unread",
      groupId: groups.some((g) => g.id === i.groupId) ? i.groupId : "",
    })),
  };
}
