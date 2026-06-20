/**
 * uiStore — ephemeral UI state (NOT persisted).
 * Currently: editMode flag for in-place customization.
 */

import { create } from 'zustand';

interface UIState {
  editMode: boolean;
}

interface UIActions {
  toggleEditMode: () => void;
  setEditMode: (v: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  editMode: false,

  toggleEditMode() {
    set((s) => ({ editMode: !s.editMode }));
  },

  setEditMode(v: boolean) {
    set({ editMode: v });
  },
}));
