import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  writeBatch,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { nextListColor } from "../colors";
import type { BoardData, Card, List } from "../types";
import type { Backend } from "./types";

// Web config is public by design: access is enforced by firestore.rules
const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

export function onUserChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOut() {
  return firebaseSignOut(auth);
}

/** Readable message for a failed sign-in */
export function signInErrorMessage(err: unknown): string {
  const code = (err as { code?: string }).code ?? "";
  if (code === "auth/too-many-requests") return "Too many attempts. Try again in a few minutes.";
  if (code === "auth/network-request-failed") return "Network error. Check your connection.";
  return "Incorrect email or password.";
}

type ListDoc = Omit<List, "id" | "cards">;
type CardDoc = Omit<Card, "id">;

const now = () => new Date().toISOString();

/**
 * Board stored in two top-level collections, `lists` and `cards`, with the
 * same fields as the D1 tables. Live: changes from other tabs and devices
 * arrive through onSnapshot.
 */
export function createFirebaseBackend(): Backend {
  const listsRef = collection(db, "lists");
  const cardsRef = collection(db, "cards");
  let lists: List[] = [];
  let cards: Card[] = [];
  let board: BoardData = [];
  let onBoard: ((board: BoardData) => void) | null = null;

  const rebuild = () => {
    const byList = new Map<string, Card[]>();
    for (const card of [...cards].sort((a, b) => a.position - b.position)) {
      const key = String(card.list_id);
      if (!byList.has(key)) byList.set(key, []);
      byList.get(key)!.push(card);
    }
    board = [...lists]
      .sort((a, b) => a.position - b.position)
      .map((l) => ({ ...l, cards: byList.get(String(l.id)) ?? [] }));
    onBoard?.(board);
  };

  const nextPosition = (items: { position: number }[]) =>
    items.reduce((max, item) => Math.max(max, item.position), -1) + 1;

  return {
    subscribe(callback, onError) {
      onBoard = callback;
      let listsLoaded = false;
      let cardsLoaded = false;
      const fail = (err: Error) => onError(err);
      const stopLists = onSnapshot(listsRef, (snap) => {
        lists = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ListDoc), cards: [] }));
        listsLoaded = true;
        if (cardsLoaded) rebuild();
      }, fail);
      const stopCards = onSnapshot(cardsRef, (snap) => {
        cards = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CardDoc) }));
        cardsLoaded = true;
        if (listsLoaded) rebuild();
      }, fail);
      return () => {
        onBoard = null;
        stopLists();
        stopCards();
      };
    },

    async refresh() {
      onBoard?.(board);
    },

    async addList(title, color) {
      const batch = writeBatch(db);
      batch.set(doc(listsRef), {
        title,
        position: nextPosition(lists),
        color: color ?? nextListColor(lists.length),
        created_at: now(),
      } satisfies ListDoc);
      await batch.commit();
    },

    async updateList(id, fields) {
      await updateDoc(doc(listsRef, String(id)), fields);
    },

    async deleteList(id) {
      // The list and its cards go together, or not at all
      const batch = writeBatch(db);
      batch.delete(doc(listsRef, String(id)));
      for (const card of cards) {
        if (String(card.list_id) === String(id)) batch.delete(doc(cardsRef, String(card.id)));
      }
      await batch.commit();
    },

    async addCard(listId, title, description) {
      const batch = writeBatch(db);
      batch.set(doc(cardsRef), {
        list_id: listId,
        title,
        description,
        position: nextPosition(cards.filter((c) => String(c.list_id) === String(listId))),
        color: null,
        created_at: now(),
        updated_at: now(),
      } satisfies CardDoc);
      await batch.commit();
    },

    async updateCard(id, fields) {
      await updateDoc(doc(cardsRef, String(id)), { ...fields, updated_at: now() });
    },

    async deleteCard(id) {
      await deleteDoc(doc(cardsRef, String(id)));
    },

    async moveCard(id, targetListId, position) {
      // Same "shift everything at or after it down" as the D1 API, in one batch
      const batch = writeBatch(db);
      for (const card of cards) {
        if (String(card.list_id) === String(targetListId) && card.id !== id && card.position >= position) {
          batch.update(doc(cardsRef, String(card.id)), { position: card.position + 1 });
        }
      }
      batch.update(doc(cardsRef, String(id)), { list_id: targetListId, position, updated_at: now() });
      await batch.commit();
    },
  };
}

/**
 * Copy a board (e.g. the local D1 one) into Firestore, keeping its ids.
 * Only used from the dev-only import button.
 */
export async function importBoard(source: BoardData) {
  const listsRef = collection(db, "lists");
  const cardsRef = collection(db, "cards");
  const batch = writeBatch(db);
  for (const list of source) {
    const listId = String(list.id);
    batch.set(doc(listsRef, listId), {
      title: list.title,
      position: list.position,
      color: list.color ?? nextListColor(source.indexOf(list)),
      created_at: list.created_at,
    } satisfies ListDoc);
    for (const card of list.cards) {
      batch.set(doc(cardsRef, String(card.id)), {
        list_id: listId,
        title: card.title,
        description: card.description ?? "",
        position: card.position,
        color: card.color ?? null,
        created_at: card.created_at,
        updated_at: card.updated_at,
      } satisfies CardDoc);
    }
  }
  await batch.commit();
}
