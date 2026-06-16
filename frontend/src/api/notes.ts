import axios from "axios";

const api = axios.create({
  baseURL: "",
  headers: { "Content-Type": "application/json" },
});

export interface Note {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteCreate {
  title: string;
  content?: string;
}

export interface NoteUpdate {
  title: string;
  content?: string;
}

export interface NotePatch {
  title?: string;
  content?: string;
}

export const getNotes = (): Promise<Note[]> =>
  api.get("/api/notes").then((r) => r.data);

export const getNote = (id: number): Promise<Note> =>
  api.get(`/api/notes/${id}`).then((r) => r.data);

export const createNote = (data: NoteCreate): Promise<Note> =>
  api.post("/api/notes", data).then((r) => r.data);

export const updateNote = (id: number, data: NoteUpdate): Promise<Note> =>
  api.put(`/api/notes/${id}`, data).then((r) => r.data);

export const patchNote = (id: number, data: NotePatch): Promise<Note> =>
  api.patch(`/api/notes/${id}`, data).then((r) => r.data);

export const deleteNote = (id: number): Promise<void> =>
  api.delete(`/api/notes/${id}`).then(() => undefined);
