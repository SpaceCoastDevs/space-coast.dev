# Space Coast Devs

!['Space Coast Devs Banner'](/src/assets/images/space-coast-devs-meetup-header-v2.png)

## About Us

Space Coast Devs (formerly Space Coast Tech Club) is a place for developers, designers, scientists, IT professionals, and technologists to learn and share knowledge about technology. We host meetups and other events to facilitate community members to connect with one another. We also have a Discord server where the community can chat and ask questions. We welcome people of all skill levels and backgrounds.

If you are in the Space Coast area, we would love to have you join us!

## Meetups

https://space-coast.dev/meetups

## Discord

https://space-coast.dev/discord

## Event imports

The weekly refresh runs `pnpm run filter:events` after importing both months and before opening the refresh PR. When an organizer confirms a cancellation and the listing should be removed, delete only the matching generated record and, for Meetup, add its exact occurrence ID to `scripts/filter-events.ts` so the next import cannot restore it. Do not exclude an entire recurring series. Run the regression with `node --import tsx --test tests/event-filter.test.ts`.

## Event calendar identity

The feed and individual ICS downloads share provider-qualified occurrence UIDs
(Meetup event ID, Eventbrite ticket ID, or Luma event path). Dates, titles, and
presentation slugs are not identity. The feed uses the importer's optional
`sourceIdentity` field when available and still recognizes legacy provider URLs
with the same IDs. Manual events and reused/ambiguous provider
IDs have entries in `src/data/event-calendar-identities.json`: the key is the
Astro content record ID (relative path without `.json`), and the value is immutable.
Preserve the value and move the key when renaming or moving a record; a new
independent occurrence needs a new value. Rescheduling without a file rename
requires no identity change. Updating a provider URL to a different event ID also
requires an override if it is still the same occurrence.

Overrides are separate from generated event JSON because the weekly EvntHndlr
import overwrites those files. They were seeded once from original record keys,
not computed from future filenames. They preserve independent listings without
changing RSVP links or deciding which potentially duplicated listing to remove.
For ambiguous provider IDs, an importer-created renamed record cannot automatically
be identified as a reschedule; maintainers must move the override key, retaining
its value. Review imports for this case instead of treating the new path as proof
of a new occurrence.

Run `pnpm test:calendar` after event imports/edits. It checks the entire collection
for UID collisions as well as rescheduling and provider namespace regressions.
After building, `pnpm test:calendar:built` verifies generated feed/download parity.
Unknown providers fail without an override rather than silently using mutable
dates/titles. Both ICS routes use the same UID helper.

This corrects previously shared UIDs. Existing subscribers may need to remove
stale entries or re-add the feed once; calendar-client migration behavior varies.
