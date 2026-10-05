import { api } from "../api";
import type { BoardData } from "../types";
import type { Backend } from "./types";

/** The Hono + D1 API in src/server (proxied to Wrangler in local dev) */
export function createHttpBackend(): Backend {
  let onBoard: ((board: BoardData) => void) | null = null;
  let onError: ((err: Error) => void) | null = null;

  const refresh = async () => {
    try {
      const data = await api<{ lists: BoardData }>("GET", "/api/lists");
      onBoard?.(data.lists || []);
    } catch (err) {
      onError?.(err as Error);
    }
  };

  // Every change refetches the board, as the server is the source of truth
  const thenRefresh = async (request: Promise<unknown>) => {
    try {
      await request;
    } finally {
      await refresh();
    }
  };

  return {
    subscribe(board, error) {
      onBoard = board;
      onError = error;
      refresh();
      return () => {
        onBoard = null;
        onError = null;
      };
    },
    refresh,
    addList: (title, color) => thenRefresh(api("POST", "/api/lists", { title, color })),
    updateList: (id, fields) => thenRefresh(api("PUT", `/api/lists/${id}`, fields)),
    deleteList: (id) => thenRefresh(api("DELETE", `/api/lists/${id}`)),
    addCard: (listId, title, description) =>
      thenRefresh(api("POST", "/api/cards", { list_id: listId, title, description })),
    updateCard: (id, fields) => thenRefresh(api("PUT", `/api/cards/${id}`, fields)),
    deleteCard: (id) => thenRefresh(api("DELETE", `/api/cards/${id}`)),
    moveCard: (id, targetListId, position) =>
      thenRefresh(api("POST", `/api/cards/${id}/move`, { target_list_id: targetListId, position })),
  };
}
