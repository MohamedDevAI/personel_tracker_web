import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HabitModal from '../components/life_os/habits/HabitModal';
import { Habit } from '../interface/habit.interface';

describe('HabitModal Frequency & Specific Days', () => {
  it('renders only Daily, Weekdays (Sun - Thu), and Specific Days options', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <HabitModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    // Verify frequency options
    const select = screen.getByDisplayValue('Daily') as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((opt) => opt.value);

    expect(optionValues).toEqual([
      'Daily',
      'Weekdays (Sun - Thu)',
      'Specific Days',
    ]);

    // Ensure removed options are not present
    expect(screen.queryByText(/Mon-Fri/i)).toBeNull();
    expect(screen.queryByText(/3x per week/i)).toBeNull();
    expect(screen.queryByText(/Weekly/i)).toBeNull();
  });

  it('displays the timeline preview when Weekdays (Sun - Thu) is selected', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <HabitModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    const select = screen.getByDisplayValue('Daily');
    fireEvent.change(select, { target: { value: 'Weekdays (Sun - Thu)' } });

    expect(screen.getByText('Timeline: Sunday – Thursday')).toBeDefined();
    expect(
      screen.getByText('Habit is active on Sunday, Monday, Tuesday, Wednesday, and Thursday.')
    ).toBeDefined();
  });

  it('displays day picker pills when Specific Days is selected and saves selected days', () => {
    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <HabitModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    // Set title
    const titleInput = screen.getByPlaceholderText(/Daily Coding/i);
    fireEvent.change(titleInput, { target: { value: 'Read Quran' } });

    // Switch to Specific Days
    const select = screen.getByDisplayValue('Daily');
    fireEvent.change(select, { target: { value: 'Specific Days' } });

    expect(screen.getAllByText(/Specific Days of the Week/i).length).toBeGreaterThan(0);

    // Click "Fri-Sat" preset
    const weekendBtn = screen.getByRole('button', { name: 'Fri–Sat' });
    fireEvent.click(weekendBtn);

    // Save
    const saveBtn = screen.getByRole('button', { name: /Create Habit/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith({
      title: 'Read Quran',
      category: 'Productivity',
      targetFrequency: 'Specific Days (Fri, Sat)',
      targetDays: ['Fri', 'Sat'],
    });
  });

  it('pre-populates existing habit with Specific Days and targetDays', () => {
    const existingHabit: Habit = {
      id: 'h-1',
      title: 'Gym Workout',
      category: 'Health',
      streak: 5,
      targetFrequency: 'Specific Days (Sun, Tue, Thu)',
      targetDays: ['Sun', 'Tue', 'Thu'],
      completedToday: false,
      history: [1, 1, 0, 1, 0, 1, 0],
    };

    const handleClose = vi.fn();
    const handleSave = vi.fn();

    render(
      <HabitModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        editingHabit={existingHabit}
      />
    );

    expect(screen.getByDisplayValue('Gym Workout')).toBeDefined();
    expect(screen.getByDisplayValue('Health')).toBeDefined();
    expect(screen.getByDisplayValue('Specific Days of the Week')).toBeDefined();
    expect(screen.getByText(/Active on/i)).toBeDefined();
    expect(screen.getByText('Sun, Tue, Thu')).toBeDefined();
  });
});
