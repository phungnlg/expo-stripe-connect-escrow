import { create } from 'zustand';
import { api, Item, Order, Designer } from '@/lib/api';

interface EscrowState {
  items: Item[];
  orders: Order[];
  designer: Designer | null;
  busy: boolean;
  error: string | null;
  loadItems: () => Promise<void>;
  loadOrders: () => Promise<void>;
  loadDesigner: (id: string) => Promise<void>;
  checkout: (itemId: string) => Promise<Order | null>;
  ship: (orderId: string) => Promise<void>;
  release: (orderId: string) => Promise<void>;
  refund: (orderId: string) => Promise<void>;
  onboard: (designerId: string) => Promise<void>;
}

const run = async <T,>(set: any, fn: () => Promise<T>): Promise<T | null> => {
  set({ busy: true, error: null });
  try {
    const out = await fn();
    set({ busy: false });
    return out;
  } catch (e: any) {
    set({ busy: false, error: e?.response?.data?.error ?? e.message });
    return null;
  }
};

export const useEscrow = create<EscrowState>((set, get) => ({
  items: [],
  orders: [],
  designer: null,
  busy: false,
  error: null,

  loadItems: async () => {
    await run(set, async () => set({ items: (await api.get('/items')).data }));
  },
  loadOrders: async () => {
    await run(set, async () => set({ orders: (await api.get('/orders')).data }));
  },
  loadDesigner: async (id) => {
    await run(set, async () => set({ designer: (await api.get(`/designers/${id}`)).data }));
  },
  checkout: async (itemId) => {
    const order = await run(set, async () => (await api.post('/checkout', { itemId })).data as Order);
    await get().loadOrders();
    return order;
  },
  ship: async (orderId) => {
    await run(set, async () => api.post(`/orders/${orderId}/ship`));
    await get().loadOrders();
  },
  release: async (orderId) => {
    await run(set, async () => api.post(`/orders/${orderId}/release`));
    await get().loadOrders();
  },
  refund: async (orderId) => {
    await run(set, async () => api.post(`/orders/${orderId}/refund`));
    await get().loadOrders();
  },
  onboard: async (designerId) => {
    await run(set, async () => api.post(`/designers/${designerId}/onboard`));
    await get().loadDesigner(designerId);
  },
}));
