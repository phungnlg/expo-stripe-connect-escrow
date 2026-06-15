/**
 * Escrow marketplace backend (mock-Stripe, in-memory).
 *
 * Order state machine:
 *   PENDING -> (checkout)        -> HELD       funds in platform balance (escrow)
 *   HELD    -> (designer ships)  -> SHIPPED
 *   SHIPPED -> (buyer confirms)  -> RELEASED   Transfer to designer, fee kept
 *   HELD/SHIPPED -> (dispute)    -> REFUNDED   buyer refunded, no transfer
 */
import express from 'express';
import { mockStripe } from './mockStripe.mjs';

const app = express();
app.use(express.json());

const PLATFORM_FEE_BPS = 1200; // 12% commission (commission-led marketplace)

// ---- in-memory stores ------------------------------------------------------
const designers = new Map();
const items = new Map();
const orders = new Map();

function seedDesigner(id, name, handle, onboarded) {
  const account = mockStripe.accounts.create();
  if (onboarded) {
    account.charges_enabled = true;
    account.payouts_enabled = true;
    account.details_submitted = true;
  }
  designers.set(id, { id, name, handle, account, payouts: [] });
}

seedDesigner('d1', 'Mara Okonkwo', '@marastudio', true);
seedDesigner('d2', 'Lior Bennett', '@liorthread', true);
seedDesigner('d3', 'Yuki Tanaka', '@yukiwear', false);

const catalogue = [
  { designerId: 'd1', title: 'Hand-dyed Silk Scarf', priceCents: 8900, emoji: '🧣' },
  { designerId: 'd1', title: 'Linen Wrap Coat', priceCents: 24800, emoji: '🧥' },
  { designerId: 'd2', title: 'Recycled Denim Jacket', priceCents: 15600, emoji: '👖' },
  { designerId: 'd2', title: 'Knit Wool Beanie', priceCents: 4200, emoji: '🧢' },
  { designerId: 'd3', title: 'Pleated Midi Skirt', priceCents: 11200, emoji: '👗' },
];
catalogue.forEach((c, i) => {
  const id = `i${i + 1}`;
  items.set(id, { id, ...c });
});

const money = (c) => `$${(c / 100).toFixed(2)}`;
const now = () => new Date(Date.UTC(2026, 5, 15, 10, 0, 0)).toISOString();

// ---- consumer: catalogue ---------------------------------------------------
app.get('/items', (_req, res) => {
  res.json(
    [...items.values()].map((it) => {
      const d = designers.get(it.designerId);
      return { ...it, designerName: d.name, designerHandle: d.handle, price: money(it.priceCents) };
    }),
  );
});

// ---- consumer: checkout -> escrow HOLD -------------------------------------
// Real: paymentIntents.create with NO transfer_data -> funds sit on platform balance.
app.post('/checkout', (req, res) => {
  const item = items.get(req.body.itemId);
  if (!item) return res.status(404).json({ error: 'item not found' });

  const amount = item.priceCents;
  const fee = Math.round((amount * PLATFORM_FEE_BPS) / 10000);
  const pi = mockStripe.paymentIntents.create(amount);

  const order = {
    id: pi.id.replace('pi', 'ord'),
    itemId: item.id,
    designerId: item.designerId,
    amountCents: amount,
    feeCents: fee,
    netCents: amount - fee,
    status: 'HELD',
    paymentIntentId: pi.id,
    transferId: undefined,
    refundId: undefined,
    history: [
      { status: 'PAID', at: now() },
      { status: 'HELD', at: now() },
    ],
  };
  orders.set(order.id, order);
  res.json(serializeOrder(order));
});

// ---- designer: mark shipped ------------------------------------------------
app.post('/orders/:id/ship', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  if (order.status !== 'HELD') return res.status(409).json({ error: `cannot ship from ${order.status}` });
  order.status = 'SHIPPED';
  order.history.push({ status: 'SHIPPED', at: now() });
  res.json(serializeOrder(order));
});

// ---- buyer/admin: confirm delivery -> RELEASE escrow -----------------------
// Real: transfers.create({ amount: net, destination: acct, source_transaction: charge })
app.post('/orders/:id/release', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  if (order.status !== 'SHIPPED' && order.status !== 'HELD')
    return res.status(409).json({ error: `cannot release from ${order.status}` });

  const designer = designers.get(order.designerId);
  if (!designer.account.payouts_enabled)
    return res.status(409).json({ error: 'designer onboarding incomplete' });

  const transfer = mockStripe.transfers.create(order.netCents, designer.account.id, order.paymentIntentId);
  order.status = 'RELEASED';
  order.transferId = transfer.id;
  order.history.push({ status: 'RELEASED', at: now() });
  designer.payouts.push({ orderId: order.id, amount: order.netCents, transferId: transfer.id });
  res.json(serializeOrder(order));
});

// ---- admin: dispute -> REFUND ----------------------------------------------
app.post('/orders/:id/refund', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'order not found' });
  if (order.status === 'RELEASED') return res.status(409).json({ error: 'already released, cannot refund' });

  const refund = mockStripe.refunds.create(order.paymentIntentId, order.amountCents);
  order.status = 'REFUNDED';
  order.refundId = refund.id;
  order.history.push({ status: 'REFUNDED', at: now() });
  res.json(serializeOrder(order));
});

// ---- orders list -----------------------------------------------------------
app.get('/orders', (_req, res) => {
  res.json([...orders.values()].map(serializeOrder));
});

// ---- designer dashboard ----------------------------------------------------
app.get('/designers/:id', (req, res) => {
  const d = designers.get(req.params.id);
  if (!d) return res.status(404).json({ error: 'designer not found' });
  const held = [...orders.values()]
    .filter((o) => o.designerId === d.id && (o.status === 'HELD' || o.status === 'SHIPPED'))
    .reduce((s, o) => s + o.netCents, 0);
  const paid = d.payouts.reduce((s, p) => s + p.amount, 0);
  res.json({
    id: d.id,
    name: d.name,
    handle: d.handle,
    accountId: d.account.id,
    payoutsEnabled: d.account.payouts_enabled,
    pendingEscrow: money(held),
    pendingEscrowCents: held,
    paidOut: money(paid),
    payouts: d.payouts.map((p) => ({ ...p, amountLabel: money(p.amount) })),
  });
});

// ---- designer onboarding (AccountLink) -------------------------------------
app.post('/designers/:id/onboard', (req, res) => {
  const d = designers.get(req.params.id);
  if (!d) return res.status(404).json({ error: 'designer not found' });
  const link = mockStripe.accountLinks.create(d.account.id);
  // simulate the designer completing Stripe-hosted onboarding
  d.account.charges_enabled = true;
  d.account.payouts_enabled = true;
  d.account.details_submitted = true;
  res.json({ onboardingUrl: link.url, payoutsEnabled: true });
});

function serializeOrder(o) {
  const item = items.get(o.itemId);
  const designer = designers.get(o.designerId);
  return {
    id: o.id,
    title: item.title,
    emoji: item.emoji,
    designerName: designer.name,
    amount: money(o.amountCents),
    fee: money(o.feeCents),
    net: money(o.netCents),
    status: o.status,
    paymentIntentId: o.paymentIntentId,
    transferId: o.transferId,
    refundId: o.refundId,
    history: o.history,
  };
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4242;
app.listen(PORT, () => console.log(`escrow backend on :${PORT}`));
