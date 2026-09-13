import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../../services/api';
import { useDeleteConfirmation } from '../../../hooks/useDeleteConfirmation';
import ConfirmDeleteModal from '../../common/ConfirmDeleteModal';
import type { TaskItem, TaskPriority } from '../../../types';
import TasksKpiCards from './TasksKpiCards';
import TasksToolbar, { TaskStatusFilter, TaskViewMode } from './TasksToolbar';
import TasksKanbanBoard from './TasksKanbanBoard';
import TaskMatrixSheet from './TaskMatrixSheet';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import './tasks.css';

export default function TasksView() {
  const queryClient = useQueryClient();

  // Queries
  const { data: tasks = [] } = useQuery<TaskItem[]>({
    queryKey: ['tasks'],
    queryFn: api.getTasks,
  });

  // Mutations
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.toggleTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; category: string; priority: TaskPriority; dueDate: string }) => api.createTask(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<TaskViewMode>('board'); // Default to Kanban Board!

  const deleteConfirm = useDeleteConfirmation<string>();

  // Filtering
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCat = (t.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'PENDING') return !t.completed;
      if (statusFilter === 'COMPLETED') return t.completed;
      if (statusFilter === 'HIGH_PRIORITY') return t.priority === 'HIGH';

      return true;
    });
  }, [tasks, searchQuery, selectedCategory, statusFilter]);

  // Handlers
  const handleToggle = (id: string, currentlyDone: boolean) => {
    toggleMutation.mutate(id);
    if (!currentlyDone) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.65 } });
    }
  };

  const handleCreate = (data: { title: string; category: string; priority: TaskPriority; dueDate: string }) => {
    createMutation.mutate(data);
  };

  const handleDeleteConfirm = () => {
    deleteConfirm.execute((id: string) => deleteMutation.mutate(id));
  };

  return (
    <div className="tasks-view-container">
      {/* 1. KPI Cards Header */}
      <TasksKpiCards tasks={tasks} />

      {/* 2. Toolbar & Filters & View Switcher */}
      <TasksToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAddModal={() => setShowAddModal(true)}
      />

      {/* 3. Content Views (Kanban Board vs Sheet vs List) */}
      {filteredTasks.length > 0 ? (
        viewMode === 'board' ? (
          <TasksKanbanBoard
            tasks={filteredTasks}
            onToggle={handleToggle}
            onDelete={(id) => deleteConfirm.confirm(id, 'Daily Task')}
          />
        ) : viewMode === 'sheet' ? (
          <TaskMatrixSheet
            tasks={filteredTasks}
            onToggle={handleToggle}
            onDelete={(id) => deleteConfirm.confirm(id, 'Daily Task')}
          />
        ) : (
          <div className="glass-panel" style={{ padding: 20, borderRadius: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={(id) => deleteConfirm.confirm(id, task.title)}
                />
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="tasks-empty-state-panel">
          <div className="tasks-empty-icon">
            <CheckSquare size={28} />
          </div>
          <h3 className="habits-empty-title">No Daily Tasks Found</h3>
          <p className="habits-empty-sub">
            {searchQuery || statusFilter !== 'ALL' || selectedCategory !== 'ALL'
              ? 'No daily tasks match your active filter parameters. Try clearing your search term or active filters.'
              : 'You have no daily action items right now. Add a new task to stay on top of your execution.'}
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ marginTop: 8 }}>
            <Plus size={16} /> Create First Task
          </button>
        </div>
      )}

      {/* Modal: Add Task */}
      <TaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreate}
      />

      {/* Modal: Delete Confirmation */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Daily Task"
        message={`Are you sure you want to delete "${deleteConfirm.itemName}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={deleteConfirm.cancel}
      />
    </div>
  );
}
