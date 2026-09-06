# Monitoring task validation

`/monitorear` treats each new watch signal as a review task rather than a passive feed item.

User flow:

1. Review the source evidence.
2. Validate the signal when it matters (`relevant`).
3. Discard it when it does not require follow-up (`irrelevant`).
4. Keep the decision attached to the exact signal in `intelligence_feedback` with audit history.

The default queue only shows new signals without a recorded decision. The history view keeps validated and discarded signals visible with their human decision state.

Supported task keys:

- `brand:<trademark_watch_signal_events.id>`
- `patent:<patent_alert_events.id>`
- `technology:<intelligence_watch_events.id>`

The backend validates ownership before accepting feedback, so a user cannot validate another user's signal by supplying a foreign key.