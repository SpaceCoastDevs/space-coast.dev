import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isStormCancelledEvent } from '../src/utils/event-cancellation';

test('only the two published November 18 storm cancellations are labeled', () => {
  for (const slug of ['space-coast-devs-monthly-meetup', 'november-space-coast-devs-meetup']) {
    assert.equal(isStormCancelledEvent({ data: { start: '2026-11-18T18:00:00-05:00', slug } }), true);
    assert.equal(isStormCancelledEvent({ data: { start: '2026-12-16T18:00:00-05:00', slug } }), false);
    assert.equal(isStormCancelledEvent({ data: { start: '2026-10-21T18:00:00-04:00', slug } }), false);
  }
  assert.equal(
    isStormCancelledEvent({ data: { start: '2026-11-18T18:30:00-05:00', slug: 'hack-the-box-meetup-17' } }),
    false
  );
});
