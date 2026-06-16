import type { Note } from "../api/notes";

interface Props {
  note: Note;
  isSelected: boolean;
  onSelect: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NoteCard({ note, isSelected, onSelect, onEdit, onDelete }: Props) {
  return (
    <div
      onClick={() => onSelect(note)}
      className={`group cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${
        isSelected
          ? "border-indigo-500 bg-indigo-50 shadow-md"
          : "border-gray-200 bg-white hover:border-indigo-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 truncate flex-1">{note.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            className="rounded p-1 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
            title="Edit"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note);
            }}
            className="rounded p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {note.content && (
        <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{note.content}</p>
      )}
      <p className="mt-2 text-xs text-gray-400">{formatDate(note.updated_at)}</p>
    </div>
  );
}
