export const C = {
  bg: '#0E0F13',
  card: '#191B22',
  card2: '#21242E',
  line: '#2C2F3A',
  text: '#F4F5F7',
  sub: '#9AA0AE',
  accent: '#6C5CE7',
  accentSoft: '#2A2550',
  held: '#E8A13A',
  shipped: '#3A86E8',
  released: '#2FB36B',
  refunded: '#E85A5A',
};

export const statusColor = (s: string) =>
  s === 'HELD' ? C.held : s === 'SHIPPED' ? C.shipped : s === 'RELEASED' ? C.released : C.refunded;

export const statusLabel = (s: string) =>
  s === 'HELD' ? 'In escrow' : s === 'SHIPPED' ? 'Shipped' : s === 'RELEASED' ? 'Released' : 'Refunded';
