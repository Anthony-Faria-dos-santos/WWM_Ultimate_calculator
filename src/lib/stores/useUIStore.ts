/**
 * Store UI — sidebar, drawers, modals, onglet mobile actif.
 */
import { create } from 'zustand';
import type { EquipmentSlot } from '@/lib/types/EquipmentSet.types';

export type MobileTab = 'character' | 'equipment' | 'dps' | 'rotation';

interface UIState {
  // Sidebar (desktop)
  sidebarCollapsed: boolean;
  // Drawer équipement
  drawerOpen: boolean;
  drawerSlot: EquipmentSlot | null;
  // Mobile
  activeMobileTab: MobileTab;
  // Modals
  saveModalOpen: boolean;
  shareModalOpen: boolean;
  resetConfirmOpen: boolean;
}

interface UIActions {
  toggleSidebar: () => void;
  openDrawer: (slot: EquipmentSlot) => void;
  closeDrawer: () => void;
  setMobileTab: (tab: MobileTab) => void;
  setSaveModalOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setResetConfirmOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  sidebarCollapsed: false,
  drawerOpen: false,
  drawerSlot: null,
  activeMobileTab: 'character',
  saveModalOpen: false,
  shareModalOpen: false,
  resetConfirmOpen: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  openDrawer: (slot) => set({ drawerOpen: true, drawerSlot: slot }),
  closeDrawer: () => set({ drawerOpen: false, drawerSlot: null }),

  setMobileTab: (tab) => set({ activeMobileTab: tab }),
  setSaveModalOpen: (open) => set({ saveModalOpen: open }),
  setShareModalOpen: (open) => set({ shareModalOpen: open }),
  setResetConfirmOpen: (open) => set({ resetConfirmOpen: open }),
}));
