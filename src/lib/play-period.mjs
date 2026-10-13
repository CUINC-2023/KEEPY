/** Strict private-query timestamp, independent of asset/history time policies. */
export function validPlayPeriodTime(v) {
  if (typeof v !== "string" || v.length > 40) return false;
  if (v === "") return true;
  const m =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-](\d{2}):(\d{2}))$/.exec(
      v,
    );
  if (!m) return false;
  const [y, mo, day, h, min, sec] = m.slice(1, 7).map(Number),
    leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0),
    days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    y >= 1 &&
    mo >= 1 &&
    mo <= 12 &&
    day >= 1 &&
    day <= days[mo - 1] &&
    h <= 23 &&
    min <= 59 &&
    sec <= 59 &&
    (m[7] === "Z" ||
      (Number(m[8]) <= 14 && Number(m[9]) <= 59 && (Number(m[8]) !== 14 || Number(m[9]) === 0))) &&
    Number.isFinite(Date.parse(v))
  );
}
