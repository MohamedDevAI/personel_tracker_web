import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { notesRemindersService } from '../services/notesRemindersService';
import { useRemindersQuery } from './useRemindersQuery';
import { QUERY_KEYS } from './queryKeys';
import { ReminderItem } from '../interface';

let sharedAudioCtx: AudioContext | null = null;

/**
 * Synthesizes a crisp, executive two-tone chime via Web Audio API.
 * Reuses a single AudioContext to prevent exceeding browser context limits and audio leaks.
 */
export function playReminderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
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

const ALERTED_STORAGE_KEY = 'pt_alerted_reminder_ids';

function getInitialAlertedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(ALERTED_STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function persistAlertedId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(ALERTED_STORAGE_KEY);
    const set = new Set<string>(raw ? JSON.parse(raw) : []);
    set.add(id);
    sessionStorage.setItem(ALERTED_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function removeAlertedId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(ALERTED_STORAGE_KEY);
    if (!raw) return;
    const set = new Set<string>(JSON.parse(raw));
    set.delete(id);
    sessionStorage.setItem(ALERTED_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function useGlobalRemindersNotifier() {
  const queryClient = useQueryClient();

  const { data: reminders = [] } = useRemindersQuery();

  const [activeAlert, setActiveAlert] = useState<ReminderItem | null>(null);

  // Keep track of reminders that have already been alerted or dismissed (persisted in sessionStorage)
  const alertedIdsRef = useRef<Set<string>>(getInitialAlertedIds());

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (id: string) => notesRemindersService.toggleReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REMINDERS });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.3 },
        colors: ['#0d9488', '#14b8a6', '#2dd4bf'],
      });
    },
    onError: (err: any) => {
      console.error('Failed to complete reminder:', err);
      alert('Failed to complete reminder: ' + (err.message || 'Unknown error'));
    },
  });

  // Snooze mutation
  const snoozeMutation = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      notesRemindersService.snoozeReminderMinutes(id, minutes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REMINDERS }),
    onError: (err: any) => {
      console.error('Failed to snooze reminder:', err);
      alert('Failed to snooze reminder: ' + (err.message || 'Unknown error'));
    },
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
        persistAlertedId(r.id);
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
      Notification.requestPermission().catch(() => { });
    }
  }, []);

  // Automatically request notification permission on first user interaction anywhere
  useEffect(() => {
    const handleFirstInteraction = () => {
      requestNotificationPermission();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [requestNotificationPermission]);

  const handleComplete = (id: string) => {
    completeMutation.mutate(id);
    setActiveAlert(null);
  };

  const handleSnooze = (id: string, minutes: number = 10) => {
    snoozeMutation.mutate({ id, minutes });
    // Remove from alerted set so it will alert again after snooze time elapses
    alertedIdsRef.current.delete(id);
    removeAlertedId(id);
    setActiveAlert(null);
  };

  const handleDismiss = (id: string) => {
    alertedIdsRef.current.add(id);
    persistAlertedId(id);
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
