import { create } from 'zustand';

type InventoryView = 'cards' | 'table';

interface AppStoreState {
  mobileSidebarOpen: boolean;
  inventoryView: InventoryView;
  setInventoryView: (value: InventoryView) => void;
  setMobileSidebarOpen: (value: boolean) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  mobileSidebarOpen: false,
  inventoryView: 'table',
  setInventoryView: (value) => set({ inventoryView: value }),
  setMobileSidebarOpen: (value) => set({ mobileSidebarOpen: value }),
}));
