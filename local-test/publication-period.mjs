// Inclusive start, exclusive end: one server rule for public projection and tasks.
export function publicationPeriod(value, now) {
  if (
    [value.releaseAt, value.withdrawAt].some((date) => date && !Number.isFinite(Date.parse(date)))
  )
    return "invalid";
  if (
    value.releaseAt &&
    value.withdrawAt &&
    Date.parse(value.releaseAt) >= Date.parse(value.withdrawAt)
  )
    return "invalid";
  if (value.withdrawAt && now >= Date.parse(value.withdrawAt)) return "expired";
  if (value.releaseAt && now < Date.parse(value.releaseAt)) return "upcoming";
  return "current";
}
