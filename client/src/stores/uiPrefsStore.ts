import { create } from "zustand";

type RoomsQuickEntryMode = "button" | "chips";

type UiPrefsState = {
  roomsQuickEntry: RoomsQuickEntryMode;  // default in calm mode
  setRoomsQuickEntry: (m: RoomsQuickEntryMode) => void;
};

export const useUiPrefsStore = create<UiPrefsState>((set) => ({
  roomsQuickEntry: "button",
  setRoomsQuickEntry: (m) => set({ roomsQuickEntry: m }),
}));