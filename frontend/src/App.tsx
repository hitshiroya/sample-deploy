import { useState, useEffect, useCallback } from "react";
import type { Note, NoteCreate } from "./api/notes";
import { getNotes, createNote, updateNote, deleteNote } from "./api/notes";
import NoteList from "./components/NoteList";
import NoteForm from "./components/NoteForm";
import NoteModal from "./components/NoteModal";

type HealthStatus = "ok" | "degraded" | "unknown";

function useHealthCheck(intervalMs = 30000) {
  const [health, setHealth] = useState<HealthStatus>("unknown");

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data.status === "ok" ? "ok" : "degraded");
    } catch {
      setHealth("degraded");
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, intervalMs);
    return () => clearInterval(id);
  }, [check, intervalMs]);

  return health;
}

type ModalMode = "create" | "edit" | "delete" | null;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const health = useHealthCheck();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNotes = useCallback(async () => {
    setFetching(true);
    try {
      const data = await getNotes();
      setNotes(data);
    } catch {
      setError("Failed to load notes. Is the backend running?");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreate = async (data: NoteCreate) => {
    setLoading(true);
    try {
      const created = await createNote(data);
      setNotes((prev) => [created, ...prev]);
      setSelectedNote(created);
      setModalMode(null);
    } catch {
      setError("Failed to create note.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: NoteCreate) => {
    if (!editTarget) return;
    setLoading(true);
    try {
      const updated = await updateNote(editTarget.id, { title: data.title, content: data.content });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      if (selectedNote?.id === updated.id) setSelectedNote(updated);
      setModalMode(null);
      setEditTarget(null);
    } catch {
      setError("Failed to update note.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteNote(deleteTarget.id);
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      if (selectedNote?.id === deleteTarget.id) setSelectedNote(null);
      setModalMode(null);
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete note.");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (note: Note) => {
    setEditTarget(note);
    setModalMode("edit");
  };

  const openDelete = (note: Note) => {
    setDeleteTarget(note);
    setModalMode("delete");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
    setDeleteTarget(null);
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <svg className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h1 className="text-xl font-bold text-gray-900">Notes</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className={`h-2 w-2 rounded-full ${
                health === "ok"
                  ? "bg-green-500"
                  : health === "degraded"
                  ? "bg-red-500"
                  : "bg-gray-300 animate-pulse"
              }`}
            />
            <span>
              {health === "ok" ? "API healthy" : health === "degraded" ? "API down" : "Checking…"}
            </span>
          </div>
          <button
            onClick={() => setModalMode("create")}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Note
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-auto mt-4 max-w-7xl px-6">
          <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <main className="mx-auto max-w-7xl px-6 py-6 flex gap-6 h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 flex flex-col gap-4 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Note count */}
          <p className="text-xs text-gray-400 px-1">
            {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
          </p>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-1">
            {fetching ? (
              <div className="flex justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : (
              <NoteList
                notes={filteredNotes}
                selectedNote={selectedNote}
                onSelect={setSelectedNote}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            )}
          </div>
        </aside>

        {/* Note detail pane */}
        <section className="flex-1 overflow-y-auto">
          {selectedNote ? (
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-8 min-h-full">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{selectedNote.title}</h2>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(selectedNote)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => openDelete(selectedNote)}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex gap-4 mb-6 text-xs text-gray-400">
                <span>Created: {formatDate(selectedNote.created_at)}</span>
                <span>Updated: {formatDate(selectedNote.updated_at)}</span>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedNote.content || <span className="italic text-gray-400">No content.</span>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="h-16 w-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400">Select a note to read it</p>
              <p className="text-gray-300 text-sm mt-1">or create a new one</p>
            </div>
          )}
        </section>
      </main>

      {/* Create modal */}
      {modalMode === "create" && (
        <NoteModal title="New Note" onClose={closeModal}>
          <NoteForm onSubmit={handleCreate} onCancel={closeModal} loading={loading} />
        </NoteModal>
      )}

      {/* Edit modal */}
      {modalMode === "edit" && editTarget && (
        <NoteModal title="Edit Note" onClose={closeModal}>
          <NoteForm initialNote={editTarget} onSubmit={handleUpdate} onCancel={closeModal} loading={loading} />
        </NoteModal>
      )}

      {/* Delete confirmation modal */}
      {modalMode === "delete" && deleteTarget && (
        <NoteModal title="Delete Note" onClose={closeModal}>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">"{deleteTarget.title}"</span>? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </NoteModal>
      )}
    </div>
  );
}
