import { Search, Plus, LayoutGrid, StickyNote as StickyNoteIcon, Bell, Filter } from 'lucide-react';
import type { NoteColor } from '../../../types/notesReminders';

export type NotesViewMode = 'all' | 'notes' | 'reminders';

interface StickyNotesToolbarProps {
  viewMode: NotesViewMode;
  setViewMode: (mode: NotesViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedColor: NoteColor | 'ALL';
  setSelectedColor: (color: NoteColor | 'ALL') => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  availableTags: string[];
  onAddNote: () => void;
  onAddReminder: () => void;
}

const COLOR_OPTIONS: Array<{ key: NoteColor | 'ALL'; label: string; class: string }> = [
  { key: 'ALL', label: 'All Colors', class: 'all' },
  { key: 'yellow', label: 'Yellow', class: 'yellow' },
  { key: 'green', label: 'Green', class: 'green' },
  { key: 'blue', label: 'Blue', class: 'blue' },
  { key: 'purple', label: 'Purple', class: 'purple' },
  { key: 'pink', label: 'Pink', class: 'pink' },
  { key: 'orange', label: 'Orange', class: 'orange' },
  { key: 'slate', label: 'Slate', class: 'slate' },
];

export default function StickyNotesToolbar({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedColor,
  setSelectedColor,
  selectedTag,
  setSelectedTag,
  availableTags,
  onAddNote,
  onAddReminder,
}: StickyNotesToolbarProps) {
  return (
    <div className="notes-toolbar glass-panel">
      {/* ── Left Controls: View Mode & Search ── */}
      <div className="notes-toolbar-left">
        {/* View Toggle */}
        <div className="notes-view-toggle">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`notes-view-btn ${viewMode === 'all' ? 'active' : ''}`}
            title="All-in-One Dashboard"
          >
            <LayoutGrid size={15} />
            <span>All-in-One</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('notes')}
            className={`notes-view-btn ${viewMode === 'notes' ? 'active' : ''}`}
            title="Sticky Notes Board"
          >
            <StickyNoteIcon size={15} />
            <span>Sticky Notes</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('reminders')}
            className={`notes-view-btn ${viewMode === 'reminders' ? 'active' : ''}`}
            title="Reminders Schedule"
          >
            <Bell size={15} />
            <span>Reminders</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="notes-search-box">
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search notes or reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Color Palette Filter (visible when viewing notes or all) */}
        {viewMode !== 'reminders' && (
          <div className="notes-color-filter-bar" title="Filter by note color">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`color-dot-filter ${c.class} ${selectedColor === c.key ? 'active' : ''}`}
                onClick={() => setSelectedColor(c.key)}
                title={c.label}
              />
            ))}
          </div>
        )}

        {/* Tag Filter (if tags exist) */}
        {availableTags.length > 0 && viewMode !== 'reminders' && (
          <div className="filter-select-wrapper" style={{ minWidth: 140 }}>
            <Filter size={13} className="filter-icon" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="borrow-select-filter"
            >
              <option value="ALL">All Tags ({availableTags.length})</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Right Actions: Add Note & Add Reminder ── */}
      <div className="notes-toolbar-right">
        {(viewMode === 'all' || viewMode === 'notes') && (
          <button
            type="button"
            onClick={onAddNote}
            className="notes-action-btn-primary"
          >
            <Plus size={15} />
            <span>Add Sticky Note</span>
          </button>
        )}

        {(viewMode === 'all' || viewMode === 'reminders') && (
          <button
            type="button"
            onClick={onAddReminder}
            className="notes-action-btn-secondary"
          >
            <Plus size={15} />
            <span>Add Reminder</span>
          </button>
        )}
      </div>
    </div>
  );
}
