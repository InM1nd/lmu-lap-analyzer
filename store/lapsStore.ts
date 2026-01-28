import { create } from 'zustand';
import { LapData } from '@/lib/types';

interface LapsState {
  laps: LapData[];
  filename: string | null;
  loading: boolean;
  error: string | null;
  trackName: string | null;
  carName: string | null;
  setLaps: (laps: LapData[]) => void;
  setFilename: (name: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMetadata: (track: string, car: string) => void;
  reset: () => void;
}

export const useLapsStore = create<LapsState>((set) => ({
  laps: [],
  filename: null,
  loading: false,
  error: null,
  trackName: null,
  carName: null,
  setLaps: (laps) => set({ laps }),
  setFilename: (name) => set({ filename: name }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setMetadata: (track, car) => set({ trackName: track, carName: car }),
  reset: () => set({
    laps: [],
    filename: null,
    loading: false,
    error: null,
    trackName: null,
    carName: null
  }),
}));
