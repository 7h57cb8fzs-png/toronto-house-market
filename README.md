# Toronto House Market

Phase 1 implementation for **torontohousemarket.com**.

## Locked Phase 1 flow

1. Buyer pastes a Realtor.ca link, MLS number, or property address.
2. Toronto House Market provides an **Instant Buyer Decision Snapshot before registration**.
3. Snapshot surfaces price context, comparable signals, market activity, listing flags, questions to ask, and a recommended next move.
4. After value is delivered, buyer can **Book a Showing** or **Unlock Full AI Property Brief**.
5. Buyer intake captures name, mobile/email, buyer intent, and automatically keeps the property attached.
6. Cashback is a secondary conversion benefit — **up to $10,000**, kept subtle until after the snapshot.

## Product principles

- “See the home. Understand the deal.”
- “AI for speed. People for judgment.”
- Buyer-first, useful before registration.
- CENTURY 21 Leading Edge Realty Inc., Brokerage is visible for trust.
- IDX is an external listing-data module and does not block the rest of Phase 1.
- Operational rules are configurable rather than hard-coded.

## Backend

Supabase Phase 1 database is provisioned in Canada (`ca-central-1`) with leads, agents, property-analysis sessions, assignments, event history, round-robin state, and editable operational settings.
