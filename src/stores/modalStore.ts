import { create } from 'zustand';
import { StockTicker, ViewTab } from "../types";

export interface ShareTarget {
  tab?: ViewTab;
  subTab?: string;
  title?: string;
  description?: string;
  url?: string;
  stock?: StockTicker | null;
  badge?: string;
  category?: string;
}

interface ModalState {
  isShareModalOpen: boolean;
  setIsShareModalOpen: (is: boolean) => void;
  shareStock: StockTicker | null;
  setShareStock: (stock: StockTicker | null) => void;
  shareTarget: ShareTarget | null;
  setShareTarget: (target: ShareTarget | null) => void;
  isAiCopilotOpen: boolean;
  setIsAiCopilotOpen: (is: boolean) => void;
  isBrandLinktreeOpen: boolean;
  setIsBrandLinktreeOpen: (is: boolean) => void;
  isImageScannerOpen: boolean;
  setIsImageScannerOpen: (is: boolean) => void;
  isGroundingSearchOpen: boolean;
  setIsGroundingSearchOpen: (is: boolean) => void;
  isMusicPlayerOpen: boolean;
  setIsMusicPlayerOpen: (is: boolean) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (is: boolean) => void;
  isDisclaimerOpen: boolean;
  setIsDisclaimerOpen: (is: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (is: boolean) => void;
  isDataStatusOpen: boolean;
  setIsDataStatusOpen: (is: boolean) => void;
  isProSubscriptionOpen: boolean;
  setIsProSubscriptionOpen: (is: boolean) => void;
  isBrokerageModalOpen: boolean;
  setIsBrokerageModalOpen: (is: boolean) => void;
  brokerageStock: StockTicker | null;
  setBrokerageStock: (stock: StockTicker | null) => void;
  isBloombergTerminalOpen: boolean;
  setIsBloombergTerminalOpen: (is: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (is: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isMissionHubOpen: boolean;
  setIsMissionHubOpen: (is: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (isOnboardingOpen) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isShareModalOpen: false,
  setIsShareModalOpen: (isShareModalOpen) => set({ isShareModalOpen }),
  shareStock: null,
  setShareStock: (shareStock) => set({ shareStock }),
  shareTarget: null,
  setShareTarget: (shareTarget) => set({ shareTarget }),
  isAiCopilotOpen: false,
  setIsAiCopilotOpen: (isAiCopilotOpen) => set({ isAiCopilotOpen }),
  isBrandLinktreeOpen: false,
  setIsBrandLinktreeOpen: (isBrandLinktreeOpen) => set({ isBrandLinktreeOpen }),
  isImageScannerOpen: false,
  setIsImageScannerOpen: (isImageScannerOpen) => set({ isImageScannerOpen }),
  isGroundingSearchOpen: false,
  setIsGroundingSearchOpen: (isGroundingSearchOpen) => set({ isGroundingSearchOpen }),
  isMusicPlayerOpen: false,
  setIsMusicPlayerOpen: (isMusicPlayerOpen) => set({ isMusicPlayerOpen }),
  isAuthOpen: false,
  setIsAuthOpen: (isAuthOpen) => set({ isAuthOpen }),
  isDisclaimerOpen: false,
  setIsDisclaimerOpen: (isDisclaimerOpen) => set({ isDisclaimerOpen }),
  isCommandPaletteOpen: false,
  setIsCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
  isDataStatusOpen: false,
  setIsDataStatusOpen: (isDataStatusOpen) => set({ isDataStatusOpen }),
  isProSubscriptionOpen: false,
  setIsProSubscriptionOpen: (isProSubscriptionOpen) => set({ isProSubscriptionOpen }),
  isBrokerageModalOpen: false,
  setIsBrokerageModalOpen: (isBrokerageModalOpen) => set({ isBrokerageModalOpen }),
  brokerageStock: null,
  setBrokerageStock: (brokerageStock) => set({ brokerageStock }),
  isBloombergTerminalOpen: false,
  setIsBloombergTerminalOpen: (isBloombergTerminalOpen) => set({ isBloombergTerminalOpen }),
  isSearchOpen: false,
  setIsSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  isMissionHubOpen: false,
  setIsMissionHubOpen: (isMissionHubOpen) => set({ isMissionHubOpen }),
  isOnboardingOpen: false,
  setIsOnboardingOpen: (isOnboardingOpen) => set({ isOnboardingOpen }),
}));
