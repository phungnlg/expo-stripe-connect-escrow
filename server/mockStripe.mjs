/**
 * Mock Stripe Connect SDK.
 *
 * Mirrors the real `stripe` Node SDK shape for the escrow flow so the mobile
 * app can run with zero secrets on a simulator. Each method documents the real
 * Stripe call it stands in for. Swap this module for `new Stripe(secret)` and
 * the server code in index.mjs is unchanged.
 *
 * Escrow model = "separate charges and transfers":
 *   1. Charge the buyer to the PLATFORM balance (no transfer_data). Funds held.
 *   2. On delivery confirmation, create a Transfer to the connected account
 *      minus the platform application fee. That release is the escrow payout.
 *   3. On dispute/cancel, Refund the buyer. No transfer happens.
 */

let seq = 1000;
const id = (prefix) => `${prefix}_${(seq++).toString(36)}${(seq * 7).toString(36)}`;

export const mockStripe = {
  accounts: {
    // Real: stripe.accounts.create({ type: 'express' })
    create() {
      return {
        id: id('acct'),
        type: 'express',
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
      };
    },
  },

  accountLinks: {
    // Real: stripe.accountLinks.create({ account, refresh_url, return_url, type: 'account_onboarding' })
    create(account) {
      return { url: `https://connect.stripe.com/express/onboarding/${account}`, expires_at: 0 };
    },
  },

  paymentIntents: {
    // Real: stripe.paymentIntents.create({ amount, currency, confirm: true,
    //   payment_method, automatic_payment_methods }) -- NO transfer_data, NO
    //   on_behalf_of, so the full amount settles in the platform balance = escrow.
    create(amount, currency = 'usd') {
      return { id: id('pi'), amount, currency, status: 'succeeded', on_behalf_of: null };
    },
  },

  transfers: {
    // Real: stripe.transfers.create({ amount, currency, destination,
    //   source_transaction }) -- moves the held funds to the designer minus the
    //   platform fee we keep by transferring less than the gross. This is the release.
    create(amount, destination, source_transaction) {
      return { id: id('tr'), amount, destination, source_transaction };
    },
  },

  refunds: {
    // Real: stripe.refunds.create({ payment_intent })
    create(payment_intent, amount) {
      return { id: id('re'), payment_intent, amount, status: 'succeeded' };
    },
  },
};
