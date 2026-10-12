export function taskRows(
  packages,
  { q = "", creator = "", status = "all", sort = "submitted" } = {},
  locale = "zh-TW",
) {
  const needle = q.trim().normalize("NFKC").toLocaleLowerCase();
  return packages
    .filter(({ data: p }) => {
      const v = p.revisions.find((r) => r.revision === p.draftRevision)?.value;
      return (
        !!v &&
        (!needle ||
          [p.id, v.copy.title[locale]]
            .join(" ")
            .normalize("NFKC")
            .toLocaleLowerCase()
            .includes(needle)) &&
        (!creator || p.creatorId === creator) &&
        (status === "all" ||
          (status === "published"
            ? p.published
            : ["upcoming", "expired"].includes(status)
              ? (p.published ? p.schedule.publicPeriod : p.schedule.draftPeriod) === status
              : p.status === status))
      );
    })
    .sort((a, b) => {
      const key = sort === "deadline" ? "nextBoundary" : "submittedAt",
        date = (p) => Date.parse(p.data.schedule[key] ?? "") || Infinity;
      return date(a) - date(b) || a.data.id.localeCompare(b.data.id);
    });
}
