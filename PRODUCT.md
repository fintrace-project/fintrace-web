# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Responsive and mobile-first. A PWA and then a native app are planned after the pilot (M7); until one exists, the design language is the web's.

## Users

**Today:** one person, the owner, keeping a personal ledger. The phone is the real daily-use device, because fintrace replaces a Telegram bot used for the same job.

**After the MVP, when fintrace goes public, in this order:**

1. **Meticulous self-trackers** log every expense by hand, often across several accounts and currencies, and care that the figures are exact.
2. **Switchers from other finance apps** have years of history elsewhere and want to bring it with them.
3. **Households sharing a ledger** keep shared workspaces. Not possible today: a workspace has one owner, and anyone else gets a 404. Sharing is a future direction, not a current capability.

## Product Purpose

fintrace keeps accounts, operations and transfers in one ledger, and works out every balance and total, so its user knows where their money went and where it is.

It succeeds first by replacing the bot as a working daily tool (pilot deadline 2027-01-01), then by opening to the public without the MVP having foreclosed that. The web UI is the pilot's only UI and is meant to be excellent.

## Positioning

**Figures you can trust.** Balances are never stored: each is computed from the user's own history and anchored to values observed at the bank. Nothing is quietly adjusted. A correction is a revision on the record, and transfers never count as income or expense.

## Operating Context

- **Entering operations:** mostly on a phone, in short sessions, by hand. Adding, editing, deleting or repeating an operation is the most frequent job.
- **Reading the ledger:** the workspace overview, the workspace feed, and each account's feed.
- **Reconciling:** comparing a computed balance with what the bank shows, and recording the observed figure as an anchor.
- **Starting out:** a new workspace either starts empty or imports a history. The first manually entered operation permanently closes import for that workspace, and the UI has to say so.
- **Reviewing:** statistics and charts, on phone and desktop. Not built yet; they arrive with M3 and M4.2.

## Capabilities and Constraints

**Built:** workspaces with their lifecycle (new, importing, active, archived, deleted), import, accounts, both feeds, operations and transfers across currencies. The category tree and anchors on the account's card are next.

**Product rules the interface must respect:**

- Core computes every figure. The client formats what it receives, with two display-only exceptions: feed totals summed from what is on screen, and the rate implied while typing a transfer's two amounts.
- An archived workspace is read-only everywhere. Deletion of a workspace is terminal, with no restore.
- Import is allowed only into a new workspace, once.
- A transfer is one action over two linked entries; it is created, edited and deleted as a pair.
- Timestamps are floating local wall-clock values with no zone. Back-dating is normal.
- Accounts are archived, categories soft-deleted and operations cancelled; only the most recent balance anchor can be removed.
- Four system categories are immutable, and categories move only within their own income or expense branch.

**Terminology:** workspace, account, operation (income or expense), transfer (source and target), category, anchor, feed.

**Technical limits:** no server-side rendering; about 200 kB gzipped JavaScript in the first load, about 50 kB for each lazy chunk, first paint within 2.5 s on the phone profile; no token in JavaScript. The stack is pinned in `CLAUDE.md`, and a library outside it needs the owner's agreement.

**Language:** English only for the MVP, with every user-visible string in `src/core/i18n/en.yml`, so a translation is a new file. Layouts must tolerate longer text.

**Undecided:** how sharing would work for households, public pricing or licensing, and whether a public landing page replaces today's `/welcome` (a static page beside the SPA is the recorded option).

## Brand Commitments

The name is **fintrace**, written lowercase. The third-party app the importer reads is only ever called MOK in prose.

No logo or brand identity exists; `public/favicon.svg` is the scaffold's default.

## Evidence on Hand

- Synthetic dumps in `fintrace-tests` (`dumps/<format>/<size>/`) are the only data to show publicly. Real dumps hold real financial history and never appear in a screenshot, fixture or demo.
- The importer's output matches the source app on the real dump, a statement the owner has checked by hand.
- There are no customers, testimonials, press or benchmarks. Do not invent any.

## Product Principles

1. **A figure is either right or visibly wrong.** Never show a number the system cannot stand behind, and never smooth over a difference; surface it so it can be reconciled.
2. **Daily entry is the product's heartbeat.** If logging an operation on a phone gets slower, trust in the ledger's completeness falls with it.
3. **Say irreversible things before they happen.** Closing import, deleting a workspace and archiving have consequences a user cannot undo or may not expect.
4. **Precision scales with the user.** The first audience tolerates density and wants exactness; switchers need first-run and import to carry them there.
5. **The client stays dumb.** Aggregation, conversion and tree rollup belong to Core, so a new view must not need new arithmetic on the client.

## Accessibility & Inclusion

**WCAG 2.2 AA** is the required standard. Also, from the repository's existing rules: touch targets of about 44 px, no hover-only controls, translatable `aria-label`s, and one finger must be able to scroll the page over a chart.
