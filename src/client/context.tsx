import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { BoardData, Id } from "./types";
import type { ColorKey } from "./colors";

export interface BoardContextValue {
  board: BoardData;
  isAgent: boolean;
  loading: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
  refresh: () => Promise<void>;
  /** Set when the board sits behind a login (Firebase mode) */
  signOut?: () => void;
  addList: (title: string, color?: ColorKey) => Promise<void>;
  renameList: (id: Id, title: string) => Promise<void>;
  setListColor: (id: Id, color: ColorKey) => Promise<void>;
  deleteList: (id: Id) => Promise<void>;
  addCard: (listId: Id, title: string, description?: string) => Promise<void>;
  editCard: (cardId: Id, title: string, description: string) => Promise<void>;
  /** `null` removes the card's color */
  setCardColor: (cardId: Id, color: ColorKey | null) => Promise<void>;
  deleteCard: (cardId: Id) => Promise<void>;
  /** Move a card to `index` among the target list's other cards */
  moveCard: (cardId: Id, targetListId: Id, index: number) => Promise<void>;
}

export const BoardContext = createContext<BoardContextValue>(null!);

export function useBoard() {
  return useContext(BoardContext);
}
