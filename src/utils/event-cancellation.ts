// Match only the two already-published November 18 storm cancellation notices.
export const isStormCancelledEvent = (event: { data: { start: string; slug: string } }): boolean =>
  event.data.start.startsWith('2026-11-18') &&
  ['space-coast-devs-monthly-meetup', 'november-space-coast-devs-meetup'].includes(event.data.slug);
