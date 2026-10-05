# TODO

## UI — next up

### Richer entry when creating cards and lists
- [x] **Card description at creation (human mode).** "Add description" link under
      the title expands a description box (`list-footer.tsx`).
- [x] **Keyboard flow.** Enter adds, Shift+Enter is a new line in the description,
      Esc closes; the form stays open for entering several cards in a row.
- [x] **"Add list" column** at the end of the board (`add-list-column.tsx`),
      alongside the toolbar button. Stays open to add several lists in a row.
- [x] **Choose list color at creation.** Swatch row in both add-list forms; defaults
      to the next palette color.

### Colors via the "…" menu
- [x] **Card background color.** Swatch row (with "No color") in the card's "…"
      menu; agent mode gets a color dropdown.
- [x] **List color selector.** "…" menu on list headers (`list-menu.tsx`) holding
      Rename / Color / Delete.
- [x] Persistence: `color` column on `lists` and `cards` (palette keys from
      `colors.ts`). The server adds the columns to older databases on the first API
      request and gives uncolored lists their old rotation color.

## UI — backlog
- [ ] **Touch drag and drop.** HTML5 drag events don't work reliably on phones or
      tablets. Add a pointer-events engine behind the same `useDragState` interface
      (`hooks/use-drag.ts`); drop index and move logic in `move.ts` stay as they are.
- [ ] **Reorder lists** by dragging headers (the README lists it; not implemented).
      Needs a server endpoint.
- [ ] **Agent mode:** the Delete button wraps under Move/Edit in 300px cards, and
      list header heights differ between columns.

## Hosting (Firebase, fork only — keep out of upstream PRs)
- [x] Firebase Hosting + Firestore + login gate at https://closed-kanban.web.app
      (`pnpm run deploy`). Firestore rules allow only the board account's UID.
- [x] Firestore moves are atomic (batched writes).
- [ ] Per-person accounts if the board is shared more widely (rules: list of UIDs).

## Server (D1 API, local dev / upstream)
- [ ] Make `moveCard` atomic with `DB.batch()` and close gaps in the source list.
- [ ] Multi-board support with share links. (Live updates: done in Firebase mode.)
