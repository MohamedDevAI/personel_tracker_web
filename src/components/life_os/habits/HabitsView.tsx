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

  // Fetch habits directly from the backend API
  const { data: habits = [] } = useHabitsQuery();

  // Daily completion counts for the top date strip (mapping today's active completions)
  const dailyCompletionCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    if (habits.length > 0) {
      counts[todayISO] = habits.filter((h) => h.completedToday).length;
    }
    return counts;
  }, [habits, todayISO]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  // Toggle habit completion directly via backend API
  const toggleMutation = useMutation({
    mutationFn: ({ id }: { id: string; wasCompleted: boolean }) => api.toggleHabit(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
      // Trigger confetti reward if toggled to completed (Law 4: Make it Satisfying)
      if (!variables.wasCompleted) {
        confetti({
          particleCount: 50,
          spread: 65,
          origin: { y: 0.72 },
          colors: ['#2dd4bf', '#14b8a6', '#0d9488', '#f97316', '#38bdf8'],
        });
      }
    },
    onError: (err: any) => {
      console.error('Failed to toggle habit:', err);
      alert('Failed to toggle habit: ' + (err.message || 'Unknown error'));
    },
  });

  // Create habit mutation directly via backend API
  const createMutation = useMutation({
    mutationFn: (newHabitData: Partial<Habit>) => api.createHabit(newHabitData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
    },
    onError: (err: any) => {
      console.error('Failed to create habit:', err);
      alert('Failed to create habit: ' + (err.message || 'Unknown error'));
    },
  });

  // Update habit mutation directly via backend API
  const updateMutation = useMutation({
    mutationFn: (updatedData: Partial<Habit>) => api.updateHabit(updatedData as Habit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
    },
    onError: (err: any) => {
      console.error('Failed to update habit:', err);
      alert('Failed to update habit: ' + (err.message || 'Unknown error'));
    },
  });

  // Delete habit mutation directly via backend API
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HABITS });
    },
    onError: (err: any) => {
      console.error('Failed to delete habit:', err);
      alert('Failed to delete habit: ' + (err.message || 'Unknown error'));
    },
  });

  // ─── Filtered Habits & Counts ──────────────────────────────────────────────

  const counts = useMemo(() => {
    return {
      all: habits.length,
    };
  }, [habits]);

  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      // 1. Category Filter
      if (categoryFilter !== 'ALL' && habit.category !== categoryFilter) {
        return false;
      }

      // 2. Status Filter
      const isDone = habit.completedToday;

      if (statusFilter === 'COMPLETED' && !isDone) return false;
      if (statusFilter === 'PENDING' && isDone) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (habit.title || '').toLowerCase().includes(q);
        const matchesCat = (habit.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [habits, categoryFilter, statusFilter, searchQuery]);

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
      const cleanData: Partial<Habit> = {
        title: habitData.title,
        category: habitData.category || 'General',
        targetFrequency: habitData.targetFrequency || 'Daily',
        targetDays: habitData.targetDays || [],
      };
      if (habitData.id) {
        cleanData.id = habitData.id;
        cleanData.streak = habitData.streak ?? 0;
        cleanData.completedToday = habitData.completedToday ?? false;
        cleanData.history = habitData.history ?? [0, 0, 0, 0, 0, 0, 0];
        updateMutation.mutate(cleanData);
      } else {
        cleanData.streak = 0;
        cleanData.completedToday = false;
        cleanData.history = [0, 0, 0, 0, 0, 0, 0];
        createMutation.mutate(cleanData);
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
        habits={habits}
        selectedDate={selectedDate}
        isToday={isToday}
        onOpenAddModal={handleOpenAddModal}
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
              : 'No habits in your database yet. Click below to create your first habit.'}
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
              <span>Add New Habit</span>
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
