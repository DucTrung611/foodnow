import { create } from 'zustand';

/**
 * Client-only checkout draft — the cart's actual contents are server state
 * (GET /cart via useCart), never mirrored here. This only holds UI-local
 * state that doesn't survive a round trip to the API.
 */
type CartDraftStep = 'cart' | 'address' | 'payment';

type CartDraftState = {
  checkoutStep: CartDraftStep;
  promotionCodeInput: string;
  setCheckoutStep: (step: CartDraftStep) => void;
  setPromotionCodeInput: (code: string) => void;
  reset: () => void;
};

export const useCartDraftStore = create<CartDraftState>((set) => ({
  checkoutStep: 'cart',
  promotionCodeInput: '',
  setCheckoutStep: (checkoutStep) => set({ checkoutStep }),
  setPromotionCodeInput: (promotionCodeInput) => set({ promotionCodeInput }),
  reset: () => set({ checkoutStep: 'cart', promotionCodeInput: '' }),
}));
