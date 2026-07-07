/**
 * Calendar dates in this system are UTC-midnight Dates (Prisma @db.Date),
 * interpreted as Malaysia time (UTC+8) calendar days.
 */

/** Today as a UTC-midnight Date for the current Malaysia (UTC+8) calendar day. */
export function todayMYT(): Date {
  const isoDay = new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);
  return new Date(`${isoDay}T00:00:00.000Z`);
}
