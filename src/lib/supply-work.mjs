export function supplyWorkRows(packages, query = "", filter = "all") {
  const q = typeof query === "string" ? query.slice(0, 200).trim().toLocaleLowerCase() : "";
  const status = ["all", "draft", "submitted", "returned", "approved", "published"].includes(filter)
    ? filter
    : "all";
  return packages.filter(({ data: p }) => {
    const value = p.revisions.find((r) => r.revision === p.draftRevision)?.value;
    return (
      (status === "all" || (status === "published" ? p.published : p.status === status)) &&
      [p.id, value?.copy.title["zh-TW"], value?.copy.title.en].some(
        (text) => typeof text === "string" && text.toLocaleLowerCase().includes(q),
      )
    );
  });
}
