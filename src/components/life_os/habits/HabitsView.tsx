import { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { Sparkles, Plus } from 'lucide-react';
import HabitsDateStrip from './HabitsDateStrip';
import AtomicHabitsKpiBar from './AtomicHabitsKpiBar';
import HabitsToolbar, { HabitStatusFilter } from './HabitsToolbar';
import HabitCard from './HabitCard';
import HabitModal from './HabitModal';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';
import { useDeleteConfirmation } from '../../../hooks/useDeleteConfirmation';
import { useHabitsQuery } from '../../../hooks/useHabitsQuery';
import { QUERY_KEYS } from '../../../hooks/queryKeys';
import { api } from '../../../services/api';
import { atomicHabitsStorage } from '../../../services/atomicHabitsStorage';
import { Habit } from '../../../interface/habit.interface';
import { getLocalDateISO } from '../../../utils/dateHelpers';
import './habits.css';

export default function HabitsView() {
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => getLocalDateISO(today), [today]);

  // Top Date Strip state
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth());

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<HabitStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Delete confirmation hook
  const deleteConfirm = useDeleteConfirmation<string>();

  // Fetch habits from query cache / API
  const { data: rawHabits = [] } = useHabitsQuery();

  // Enrich habits with Atomic Habits metadata & completion status for selected date
  const enrichedHabits = useMemo(() => {
    return atomicHabitsStorage.enrichHabits(rawHabits, selectedDate);
  }, [rawHabits, selectedDate]);

  // Daily completion counts for the top date strip (mapping all completed dates)
  const dailyCompletionCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const habit of enrichedHabits) {
      const dates = habit.completedDates || [];
      for (const d of dates) {
        counts[d] = (counts[d] || 0) + 1;
      }
      // If completedToday is marked, ensure today has it counted
      if (habit.completedToday && !dates.includes(todayISO)) {
        counts[todayISO] = (counts[todayISO] || 0) + 1;
      }
    }
    return counts;
  }, [enrichedHabits, todayISO]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  // Toggle habit completion (optimistic update with confetti on complete)
  const toggleMutation = useMutation({
    mutationFn: async ({ id, wasCompleted }: { id: string; wasCompleted: boolean }) => {
      // 1. Update local multi-date completion tracking
      atomicHabitsStorage.toggleDateCompletion(id, selectedDate, enrichedHabits);

      // 2. If it's today, also sync with backend API
      if (selectedDate === todayISO) {
        try {
          await api.toggleHabit(id);
        } catch {
          // If backend is offline, local storage already persisted it
        }
      }
      return { id, wasCompleted };
    },
    onSuccess: ({ wasCompleted }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
      // Trigger confetti reward if toggled to completed (Law 4: Make it Satisfying)
      if (!wasCompleted) {
        confetti({
          particleCount: 50,
          spread: 65,
          origin: { y: 0.72 },
          colors: ['#2dd4bf', '#14b8a6', '#0d9488', '#f97316', '#38bdf8'],
        });
      }
    },
    onError: (err) => {
      console.warn('Toggle habit warning:', err);
    },
  });

  // Create habit mutation
  const createMutation = useMutation({
    mutationFn: async (newHabitData: Partial<Habit>) => {
      let createdHabit: Habit;
      const basePayload = {
        title: newHabitData.title!,
        category: newHabitData.category || 'Productivity',
        targetFrequency: newHabitData.targetFrequency || 'Daily',
      };

      try {
        createdHabit = await api.createHabit(basePayload);
      } catch {
        // Fallback offline habit creation
        createdHabit = {
          id: `habit-${Date.now()}`,
          ...basePayload,
          streak: 0,
          completedToday: false,
          history: [0, 0, 0, 0, 0, 0, 0],
        };
      }

      // Merge atomic metadata
      const fullHabit: Habit = {
        ...createdHabit,
        identity: newHabitData.identity,
        habitStack: newHabitData.habitStack,
        twoMinuteRule: newHabitData.twoMinuteRule,
        timeOfDay: newHabitData.timeOfDay || 'MORNING',
        completedDates: [],
      };

      atomicHabitsStorage.addHabitLocally(fullHabit);
      return fullHabit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
    },
  });

  // Update habit mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<Habit>) => {
      if (!updatedData.id) return;
      // Save atomic metadata locally
      atomicHabitsStorage.saveHabitMeta(updatedData.id, {
        identity: updatedData.identity,
        habitStack: updatedData.habitStack,
        twoMinuteRule: updatedData.twoMinuteRule,
      });

      try {
        await api.updateHabit(updatedData as Habit);
      } catch {
        // Handled via local storage
      }
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
    },
  });

  // Delete habit mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      atomicHabitsStorage.deleteHabitLocally(id);
      try {
        await api.deleteHabit(id);
      } catch {
        // Handled via local storage
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
    },
  });

  // ─── Filtered Habits & Counts ──────────────────────────────────────────────

  const counts = useMemo(() => {
    return {
      all: enrichedHabits.length,
      neverMissTwice: enrichedHabits.filter((h) => h.missedYesterday).length,
    };
  }, [enrichedHabits]);

  const filteredHabits = useMemo(() => {
    return enrichedHabits.filter((habit) => {
      // 1. Category Filter
      if (categoryFilter !== 'ALL' && habit.category !== categoryFilter) {
        return false;
      }

      // 2. Status Filter
      const isDone =
        habit.isCompletedOnSelectedDate !== undefined
          ? habit.isCompletedOnSelectedDate
          : habit.completedToday;

      if (statusFilter === 'COMPLETED' && !isDone) return false;
      if (statusFilter === 'PENDING' && isDone) return false;
      if (statusFilter === 'NEVER_MISS_TWICE' && !habit.missedYesterday) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = habit.title.toLowerCase().includes(q);
        const matchesIdentity = (habit.identity || '').toLowerCase().includes(q);
        const matchesStack = (habit.habitStack || '').toLowerCase().includes(q);
        const matchesCat = (habit.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesIdentity && !matchesStack && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedHabits, categoryFilter, statusFilter, searchQuery]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleChangeMonth = useCallback((year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
  }, []);

  const handleToggleHabit = useCallback(
    (id: string, wasCompleted: boolean) => {
      toggleMutation.mutate({ id, wasCompleted });
    },
    [toggleMutation]
  );

  const handleOpenAddModal = useCallback(() => {
    setEditingHabit(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  }, []);

  const handleSaveHabit = useCallback(
    (habitData: Partial<Habit>) => {
      if (habitData.id) {
        updateMutation.mutate(habitData);
      } else {
        createMutation.mutate(habitData);
      }
    },
    [updateMutation, createMutation]
  );

  const handleDeleteRequest = useCallback(
    (id: string, title: string) => {
      deleteConfirm.confirm(id, title);
    },
    [deleteConfirm]
  );

  const handleConfirmDelete = useCallback(() => {
    deleteConfirm.execute((id) => {
      deleteMutation.mutate(id);
    });
  }, [deleteConfirm, deleteMutation]);

  const handleClearFilters = useCallback(() => {
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
  }, []);

  const handleFilterNeverMissTwice = useCallback(() => {
    setStatusFilter('NEVER_MISS_TWICE');
  }, []);

  const isToday = selectedDate === todayISO;

  return (
    <div className="habits-container">
      {/* 1. Top Calendar Dates Strip Toolbar */}
      <HabitsDateStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        viewYear={viewYear}
        viewMonth={viewMonth}
        onChangeMonth={handleChangeMonth}
        dailyCompletionCounts={dailyCompletionCounts}
      />

      {/* 2. Atomic Habits KPI & Momentum Bar */}
      <AtomicHabitsKpiBar
        habits={enrichedHabits}
        selectedDate={selectedDate}
        isToday={isToday}
        onOpenAddModal={handleOpenAddModal}
        onFilterNeverMissTwice={handleFilterNeverMissTwice}
      />

      {/* 3. Toolbar: Search, Category & Status Filters */}
      <HabitsToolbar
        categoryFilter={categoryFilter}
        onChangeCategory={setCategoryFilter}
        statusFilter={statusFilter}
        onChangeStatus={setStatusFilter}
        searchQuery={searchQuery}
        onChangeSearch={setSearchQuery}
        onClearFilters={handleClearFilters}
        counts={counts}
      />

      {/* 4. Habits Grid or Empty State */}
      {filteredHabits.length > 0 ? (
        <div className="habits-grid">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              selectedDate={selectedDate}
              isToday={isToday}
              onToggle={handleToggleHabit}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      ) : (
        <div className="habits-empty-state">
          <div className="habits-empty-icon">
            <Sparkles size={28} />
          </div>
          <h3 className="habits-empty-title">No Habits Found</h3>
          <p className="habits-empty-desc">
            {searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No habits match your active filters. Try resetting them or search for something else.'
              : 'Start your habit journey by designing your first system based on the 4 Laws of Behavior Change.'}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(searchQuery || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Design First Habit</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Create / Edit Atomic Habit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveHabit}
        editingHabit={editingHabit}
      />

      {/* 6. Confirm Delete Dialog */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Habit"
        message="Are you sure you want to delete this habit and its streak history? This action cannot be undone."
        itemName={deleteConfirm.itemName}
        confirmText="Yes, Delete Habit"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={deleteConfirm.cancel}
      />
    </div>
  );
}
