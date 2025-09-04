import { create } from 'zustand';

interface MobileCardState {
  expandedCardId: string | null;
  expandCard: (cardId: string) => void;
  collapseCard: () => void;
  isExpanded: (cardId: string) => boolean;
  toggleCard: (cardId: string) => void;
}

export const useMobileCardStore = create<MobileCardState>((set, get) => ({
  expandedCardId: null,
  
  expandCard: (cardId: string) => {
    set({ expandedCardId: cardId });
  },
  
  collapseCard: () => {
    set({ expandedCardId: null });
  },
  
  isExpanded: (cardId: string) => {
    return get().expandedCardId === cardId;
  },
  
  toggleCard: (cardId: string) => {
    const { expandedCardId } = get();
    if (expandedCardId === cardId) {
      set({ expandedCardId: null });
    } else {
      set({ expandedCardId: cardId });
    }
  },
}));