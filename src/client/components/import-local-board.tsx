import { useState } from "preact/hooks";
import { api } from "../api";
import { useBoard } from "../context";
import type { BoardData } from "../types";

/**
 * Dev-only (`pnpm run dev:firebase` with `pnpm run dev` running): copies the
 * local D1 board into an empty Firestore board. Never part of a production build.
 */
export function ImportLocalBoard() {
  const { board, loading, setError } = useBoard();
  const [busy, setBusy] = useState(false);
  if (loading || board.length > 0) return null;

  const handleImport = async () => {
    setBusy(true);
    try {
      const data = await api<{ lists: BoardData }>("GET", "/api/lists");
      const { importBoard } = await import("../backends/firebase");
      await importBoard(data.lists || []);
    } catch (err) {
      setError("Import failed: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      class="btn"
      onClick={handleImport}
      disabled={busy}
      title="Copies the board from the local dev server (pnpm run dev) into Firestore"
    >
      {busy ? "Importing…" : "Import local board"}
    </button>
  );
}
