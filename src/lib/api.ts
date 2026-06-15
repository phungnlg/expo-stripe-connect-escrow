import { Platform } from 'react-native';

// iOS simulator shares the host loopback; Android emulator maps host to 10.0.2.2.
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const BASE = `http://${HOST}:4242`;

async function req<T>(method: string, path: string, body?: unknown): Promise<{ data: T }> {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.error) || `HTTP ${res.status}`);
  return { data: data as T };
}

// Minimal axios-shaped client (get/post -> { data }) backed by fetch, so there
// is no axios/DOMException dependency in the Hermes runtime.
export const api = {
  get: <T = any>(path: string) => req<T>('GET', path),
  post: <T = any>(path: string, body?: unknown) => req<T>('POST', path, body),
};

export type OrderStatus = 'HELD' | 'SHIPPED' | 'RELEASED' | 'REFUNDED';

export interface Item {
  id: string;
  title: string;
  emoji: string;
  price: string;
  designerName: string;
  designerHandle: string;
  designerId: string;
}

export interface Order {
  id: string;
  title: string;
  emoji: string;
  designerName: string;
  amount: string;
  fee: string;
  net: string;
  status: OrderStatus;
  paymentIntentId: string;
  transferId?: string;
  refundId?: string;
  history: { status: string; at: string }[];
}

export interface Designer {
  id: string;
  name: string;
  handle: string;
  accountId: string;
  payoutsEnabled: boolean;
  pendingEscrow: string;
  paidOut: string;
  payouts: { orderId: string; amountLabel: string; transferId: string }[];
}
