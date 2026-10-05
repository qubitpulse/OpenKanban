import { useState, useCallback, useEffect, useRef } from "preact/hooks";
import { planMove } from "../move";
import type { BoardData, Id } from "../types";
import type { ColorKey } from "../colors";
import type { Backend } from "../backends/types";
import type { BoardContextValue } from "../context";

export function useBoardState(isAgent: boolean, backend: Backend, signOut?: () => void): BoardContextValue {
  const [board, setBoard] = useState<BoardData>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => {
    return backend.subscribe(
      (next) => {
        boardRef.current = next;
        setBoard(next);
        setLoading(false);
      },
      (err) => {
        setError("Failed to load board: " + err.message);
        setLoading(false);
      },
    );
  }, [backend]);

  const refresh = useCallback(() => backend.refresh(), [backend]);

  // Creates run one at a time: a new list or card gets max(position) + 1,
  // so several entered in quick succession could otherwise get the same
  // position.
  const createQueue = useRef<Promise<unknown>>(Promise.resolve());
  const enqueueCreate = useCallback((create: () => Promise<void>) => {
    const run = createQueue.current.then(create);
    createQueue.current = run.catch(() => {});
    return run;
  }, []);

  // Show a change immediately, then sync with the backend (which also
  // reverts the board if the request fails)
  const optimistic = useCallback(async (next: BoardData, request: () => Promise<void>) => {
    boardRef.current = next;
    setBoard(next);
    try {
      await request();
    } catch (err) {
      await backend.refresh();
      throw err;
    }
  }, [backend]);

  const addList = useCallback(
    (title: string, color?: ColorKey) => enqueueCreate(() => backend.addList(title, color)),
    [backend, enqueueCreate],
  );

  const renameList = useCallback((id: Id, title: string) => backend.updateList(id, { title }), [backend]);

  const setListColor = useCallback(
    (id: Id, color: ColorKey) =>
      optimistic(
        boardRef.current.map((l) => (l.id === id ? { ...l, color } : l)),
        () => backend.updateList(id, { color }),
      ),
    [backend, optimistic],
  );

  const deleteList = useCallback((id: Id) => backend.deleteList(id), [backend]);

  const addCard = useCallback(
    (listId: Id, title: string, description?: string) =>
      enqueueCreate(() => backend.addCard(listId, title, description || "")),
    [backend, enqueueCreate],
  );

  const editCard = useCallback(
    (cardId: Id, title: string, description: string) => backend.updateCard(cardId, { title, description }),
    [backend],
  );

  const setCardColor = useCallback(
    (cardId: Id, color: ColorKey | null) =>
      optimistic(
        boardRef.current.map((l) => ({
          ...l,
          cards: l.cards.map((c) => (c.id === cardId ? { ...c, color } : c)),
        })),
        () => backend.updateCard(cardId, { color }),
      ),
    [backend, optimistic],
  );

  const deleteCard = useCallback((cardId: Id) => backend.deleteCard(cardId), [backend]);

  const moveCard = useCallback(async (cardId: Id, targetListId: Id, index: number) => {
    const plan = planMove(boardRef.current, cardId, targetListId, index);
    if (!plan) return;
    await optimistic(plan.board, () => backend.moveCard(cardId, targetListId, plan.position));
  }, [backend, optimistic]);

  return {
    board, isAgent, loading, error, setError, refresh, signOut,
    addList, renameList, setListColor, deleteList,
    addCard, editCard, setCardColor, deleteCard, moveCard,
  };
}
