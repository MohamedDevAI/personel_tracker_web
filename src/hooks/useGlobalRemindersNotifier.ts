import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { notesRemindersService } from '../services/notesRemindersService';
import type { ReminderItem } from '../types/notesReminders';

/**
 * Synthesizes a crisp, executive two-tone chime via Web Audio API.
 * 100% self-contained, no external audio files required.
 */
export function playReminderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 880 Hz (A5 - Harmonic)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.14);
    gain2.gain.setValueAtTime(0.25, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.55);
  } catch (err) {
    // AudioContext might be blocked until first user interaction; ignore silently
    console.debug('Chime audio blocked by browser policy:', err);
  }
}

export function useGlobalRemindersNotifier() {
  const queryClient = useQueryClient();

  const { data: reminders = [] } = useQuery<ReminderItem[]>({
    queryKey: ['reminders'],
    queryFn: () => notesRemindersService.getReminders(),
  });

  const [activeAlert, setActiveAlert] = useState<ReminderItem | null>(null);

  // Keep track of reminders that have already been alerted or dismissed
  const alertedIdsRef = useRef<Set<string>>(new Set());

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (id: string) => notesRemindersService.toggleReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.3 },
        colors: ['#10b981', '#34d399', '#6ee7b7'],
      });
    },
  });

  // Snooze mutation
  const snoozeMutation = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      notesRemindersService.snoozeReminderMinutes(id, minutes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  });

  // Check reminders against current clock
  const checkReminders = useCallback(() => {
    const now = new Date();

    for (const r of reminders) {
      if (r.isCompleted) continue;
      if (alertedIdsRef.current.has(r.id)) continue;

      // Parse target due timestamp
      const dueTime = r.dueTime || '09:00';
      const [dueHours, dueMinutes] = dueTime.split(':').map(Number);
      const targetDate = new Date(`${r.dueDate}T00:00:00`);
      targetDate.setHours(dueHours || 0, dueMinutes || 0, 0, 0);

      // If target time is past or now
      if (targetDate.getTime() <= now.getTime()) {
        alertedIdsRef.current.add(r.id);
        setActiveAlert(r);
        playReminderChime();

        // Native browser Notification if permitted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🔔 Reminder: ${r.title}`, {
              body: r.description || `Priority: ${r.priority} • Due now`,
              icon: '/favicon.ico',
            });
          } catch (e) {
            console.debug('Browser notification failed', e);
          }
        }
        break; // Show one active modal alert at a time to prevent modal stacking
      }
    }
  }, [reminders]);

  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 12000); // Check every 12 seconds
    return () => clearInterval(interval);
  }, [checkReminders]);

  // Request browser notification permission once on interaction if default
  const requestNotificationPermission = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
    setActiveAlert(null);
  };

  const handleSnooze = (id: string, minutes: number = 10) => {
    snoozeMutation.mutate({ id, minutes });
    // Remove from alerted set so it will alert again after snooze time elapses
    alertedIdsRef.current.delete(id);
    setActiveAlert(null);
  };

  const handleDismiss = (id: string) => {
    alertedIdsRef.current.add(id);
    setActiveAlert(null);
  };

  return {
    activeAlert,
    handleComplete,
    handleSnooze,
    handleDismiss,
    requestNotificationPermission,
    reminders,
  };
}
