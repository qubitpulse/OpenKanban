import type { ColorKey } from "./colors";

/** Numeric in D1, a document id string in Firestore */
export type Id = number | string;

export interface Card {
  id: Id;
  list_id: Id;
  title: string;
  description: string;
  position: number;
  color: ColorKey | null;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: Id;
  title: string;
  position: number;
  color: ColorKey | null;
  created_at: string;
  cards: Card[];
}

export type BoardData = List[];
