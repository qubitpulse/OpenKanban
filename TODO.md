# TODO

## UI — next up

### Richer entry when creating cards and lists
- [x] **Card description at creation (human mode).** "Add description" link under
      the title expands a description box (`list-footer.tsx`).
- [x] **Keyboard flow.** Enter adds, Shift+Enter is a new line in the description,
      Esc closes; the form stays open for entering several cards in a row.
- [x] **"Add list" column** at the end of the board (`add-list-column.tsx`),
      alongside the toolbar button. Stays open to add several lists in a row.
- [ ] **Choose list color at creation.** Waits on color persistence (below).

### Colors via the "…" menu
- [ ] **Card background color.** Add a color swatch row to the card's "…" menu
      (`card-menu.tsx`).
- [ ] **List color selector.** List headers only have a delete "×" today; replace it
      with a "…" menu holding Rename / Color / Delete. Colors currently rotate by
      index (`LIST_COLORS` in `list.tsx`), so they shift when lists change.
- [ ] Both need persistence: a `color` column on `lists` and `cards` plus the API
      fields. Server work is shelved for now; if needed, store colors in
      `localStorage` keyed by id as a stopgap, then migrate.

## UI — backlog
- [ ] **Touch drag and drop.** HTML5 drag events don't work reliably on phones or
      tablets. Add a pointer-events engine behind the same `useDragState` interface
      (`hooks/use-drag.ts`); drop index and move logic in `move.ts` stay as they are.
- [ ] **Reorder lists** by dragging headers (the README lists it; not implemented).
      Needs a server endpoint.
- [ ] **Agent mode:** the Delete button wraps under Move/Edit in 300px cards, and
      list header heights differ between columns.

## Server / hosting (shelved)
- [ ] Deploy to Cloudflare (assets config, real D1 database, Cloudflare Access).
- [ ] Make `moveCard` atomic with `DB.batch()` and close gaps in the source list.
- [ ] Multi-board support with share links; live updates (polling or Durable Objects).
