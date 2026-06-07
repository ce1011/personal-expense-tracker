# Trip Session Travel Mode Design

## Goal

Add a Trip Session travel mode to the existing personal expense tracker so the user can track a short solo trip, such as a Taiwan 3-day 2-night trip, without splitting travel data into a separate app or database. The feature should let travel transactions live inside the same ledger as day-to-day transactions while still giving the user a travel-focused context, summary, and workflow.

## Product Direction

The selected product shape is a shared-ledger model with an optional trip context layered on top of existing transactions.

Travel mode should feel like a focused lens over the current app rather than a full second product. The user can create a trip, switch the app into that trip, and immediately see travel-only totals, recent items, and daily progress. When no trip is active, the app should continue behaving like the current general-purpose expense tracker.

This approach keeps the experience lightweight for short trips while creating enough structure for future travel features.

## Scope

The MVP includes:

- Creating, editing, and completing a trip session.
- Associating expenses, incomes, and savings with an optional `trip_id`.
- Switching the app between normal mode and a selected trip context.
- Showing a trip-aware dashboard when a trip is active.
- Filtering and viewing transactions by trip.
- Summarizing trip spending by day across the trip date range.

The MVP excludes:

- Multi-person shared expenses or bill splitting.
- A separate travel-only category system.
- Itinerary planning, packing lists, or travel notes as standalone modules.
- Complex foreign-exchange settlement workflows beyond the app's existing currency handling.

## Data Model

Add a new top-level `trips` collection to the local app data model. A trip record should include:

- `trip_id`
- `name`
- `destination`
- `start_date`
- `end_date`
- `budget_amount`
- `budget_currency`
- `status`
- `notes`
- `created_at`
- `updated_at`

`status` should support:

- `planned`
- `active`
- `completed`

Existing transaction records should gain an optional `trip_id?: string` field:

- `expenses`
- `incomes`
- `savings`

This keeps backward compatibility simple:

- Existing transactions remain valid with no `trip_id`.
- Non-trip transactions continue appearing in normal mode.
- Travel transactions become queryable through shared selectors instead of a parallel storage model.

The app settings model should also gain an `active_trip_id?: string` value so the chosen trip context can persist across app reloads.

## Behavioral Rules

Trip mode is a UI context, not a hard partition of the database.

When `active_trip_id` is unset:

- Dashboard and transaction views behave as they do today.
- All transactions remain available through existing filters.

When `active_trip_id` is set:

- Dashboard should show trip-specific summaries instead of general cycle summaries.
- Quick add and full transaction forms should default new entries to that trip.
- Transactions view should default to the active trip context.
- Resetting ordinary page filters should not clear the active trip context.

Transactions linked to a trip may fall outside the trip date range. This is intentional so the user can record pre-trip costs such as flights or hotels booked before departure. The app may highlight this condition in the UI, but it should not block saving the record.

Completed trips should remain viewable and selectable for history, but the UI may visually distinguish them from planned or active trips.

## Route And UI Structure

The existing route-based structure should remain intact. Travel mode should extend current views instead of introducing a separate app shell.

### App Shell

Add a Trip Switcher to the shell so the user can switch between:

- Normal mode
- A specific trip session

The switcher should be globally visible enough that users understand when the app is filtered to a trip context.

### Dashboard

Dashboard should support two states:

- Normal mode: current financial summary behavior remains unchanged.
- Trip mode: show a trip-focused summary.

Trip dashboard should include:

- Trip name and date range
- Total trip budget
- Total spent
- Remaining budget
- Average daily spend remaining or available
- Recent trip transactions
- Daily spending breakdown for each trip day

The trip dashboard should prioritize rapid travel decision-making over the existing pay-cycle framing.

### Transactions

Transactions view should gain trip-aware filtering in addition to the current search, kind, category, and date filters.

Recommended trip filter options:

- All transactions
- Unassigned transactions
- Specific trip

If an active trip context exists, the page should open in that context by default. Users may still explicitly change the trip filter without destroying the global active trip selection unless they intentionally switch modes through the shell.

### Transaction Form

The form for creating or editing transactions should gain an optional trip selector.

Expected behavior:

- In normal mode, the trip selector defaults to no trip.
- In active trip mode, the trip selector defaults to the active trip.
- Users can remove or change trip assignment manually.

This should apply consistently to expenses, incomes, and savings so the trip context remains coherent across all transaction kinds.

### Trips Management

Add a lightweight Trips management view for:

- Listing trips
- Creating a trip
- Editing trip details
- Marking a trip completed

This page does not need advanced analytics in the MVP. Its primary job is to manage trip records and make mode switching understandable.

## Derived Data And Selectors

The app data layer should gain trip-aware derived selectors rather than scattering trip logic across views.

Expected derived outputs include:

- `activeTrip`
- `tripTransactions`
- `tripExpenses`
- `tripIncomes`
- `tripSavings`
- `tripSpentTotal`
- `tripRemainingBudget`
- `tripDailyBreakdown`
- `unassignedTransactions`

These selectors should centralize filtering and summary rules so UI components stay declarative and existing financial logic remains easier to maintain.

## Daily Trip Summary

Trip daily summary should group relevant trip transactions by calendar day across the trip's `start_date` through `end_date`.

For a 3-day 2-night trip, the user should be able to scan Day 1, Day 2, and Day 3 quickly.

Each day summary should support:

- Date label
- Total spending for that day
- Transaction count
- Transaction list or link to filtered list
- Optional top category for that day if easy to derive

If a trip has no transactions on a given day within its range, the day should still appear with an empty state so the timeline stays stable and easy to understand.

## Error Handling

Trip creation and editing should validate:

- Required name
- Valid date range
- Non-negative budget amount
- Supported status value

Transaction forms should validate that any selected `trip_id` refers to an existing trip. If a trip is deleted in the future, either deletion must be blocked while records still reference it or the product should require reassignment first. For the MVP, the safer option is to avoid hard deletion and rely on status changes instead.

If `active_trip_id` points to a missing or invalid trip during load, the app should clear the active trip context and continue in normal mode rather than failing globally.

## Migration And Compatibility

This feature must preserve existing local data.

Compatibility rules:

- Existing databases should continue loading with no trip records.
- Existing transactions with no `trip_id` should remain valid and visible.
- Backup export/import should expand to include the `trips` collection and optional transaction `trip_id` fields.

Restore validation should treat `trips` as a required top-level collection only after the app schema officially adds it. Older backups without `trips` need an explicit migration decision during implementation. The preferred MVP approach is to treat missing `trips` in older backups as an empty array during import so historical backups stay usable.

## Testing And Verification

Implementation verification should cover:

- Creating, editing, and completing a trip.
- Switching between normal mode and trip mode.
- Creating transactions with and without trip assignment.
- Preserving behavior for legacy non-trip transactions.
- Trip dashboard totals and remaining budget calculations.
- Daily trip grouping across the trip date range.
- Backup/restore compatibility with the new `trips` collection.

Recommended automated tests:

- Trip selector and filtering helpers.
- Trip daily grouping logic.
- Persistence validation for optional `trip_id` fields.
- Import behavior for older backups without a `trips` collection.

Manual verification should confirm that normal budget-cycle workflows still work when no trip is selected and that entering a trip context feels intentional rather than confusing.

## Future Extensions

This design leaves room for later additions without changing the core model:

- Trip recap and post-trip summary cards
- Travel-specific quick category suggestions
- Pre-trip versus in-trip cost segmentation
- Richer multi-currency presentation
- Archived trip browsing improvements
