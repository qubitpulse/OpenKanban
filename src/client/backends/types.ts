import type { BoardData, Id } from "../types";
import type { ColorKey } from "../colors";

/** Where the board is stored: the Hono API (local dev) or Firestore (hosted) */
export interface Backend {
  /** Calls `onBoard` with the full board now and after every change. Returns an unsubscribe function. */
  subscribe(onBoard: (board: BoardData) => void, onError: (err: Error) => void): () => void;
  /** Re-send the latest board to the subscriber, e.g. to undo an optimistic update */
  refresh(): Promise<void>;
  addList(title: string, color?: ColorKey): Promise<void>;
  updateList(id: Id, fields: { title?: string; color?: ColorKey }): Promise<void>;
  deleteList(id: Id): Promise<void>;
  addCard(listId: Id, title: string, description: string): Promise<void>;
  /** `color: null` removes the card's color */
  updateCard(id: Id, fields: { title?: string; description?: string; color?: ColorKey | null }): Promise<void>;
  deleteCard(id: Id): Promise<void>;
  /** Put the card at `position` in the target list, shifting cards at or after it down */
  moveCard(id: Id, targetListId: Id, position: number): Promise<void>;
}
