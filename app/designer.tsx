import { useState, useCallback } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useEscrow } from '@/store/escrow';
import { C } from '@/lib/theme';
import { Card, Btn, Row, Pill } from '@/lib/ui';

const DESIGNERS = [
  { id: 'd1', name: 'Mara Okonkwo' },
  { id: 'd3', name: 'Yuki Tanaka' },
];

export default function DesignerStudio() {
  const { designer, loadDesigner, onboard, orders, loadOrders, ship, busy } = useEscrow();
  const [active, setActive] = useState('d1');

  useFocusEffect(
    useCallback(() => {
      loadDesigner(active);
      loadOrders();
    }, [active]),
  );

  const myHeld = orders.filter((o) => o.designerName === designer?.name && o.status === 'HELD');

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {DESIGNERS.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => setActive(d.id)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: active === d.id ? C.accentSoft : C.card, borderWidth: 1, borderColor: active === d.id ? C.accent : C.line }}>
            <Text style={{ color: active === d.id ? C.text : C.sub, fontWeight: '700', fontSize: 13 }}>{d.name}</Text>
          </Pressable>
        ))}
      </View>

      {!designer ? null : (
        <>
          <Card>
            <Text style={{ color: C.text, fontSize: 17, fontWeight: '800' }}>{designer.name}</Text>
            <Text style={{ color: C.sub, fontSize: 13, marginBottom: 10 }}>{designer.handle} · Stripe Connect Express</Text>

            {designer.payoutsEnabled ? (
              <>
                <Row k="Connected account" v={designer.accountId} />
                <Row k="Payouts" v="Enabled ✓" strong />
                <View style={{ height: 1, backgroundColor: C.line, marginVertical: 10 }} />
                <Row k="Pending in escrow" v={designer.pendingEscrow} strong />
                <Row k="Paid out to date" v={designer.paidOut} strong />
              </>
            ) : (
              <View style={{ gap: 12 }}>
                <Text style={{ color: C.sub, fontSize: 13, lineHeight: 18 }}>
                  Onboarding incomplete. Connect a Stripe Express account to receive escrow payouts. The platform cannot release funds to you until this is done.
                </Text>
                <Btn label={busy ? 'Opening Stripe…' : 'Connect with Stripe'} onPress={() => onboard(designer.id)} disabled={busy} />
              </View>
            )}
          </Card>

          {designer.payoutsEnabled && (
            <>
              <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginTop: 4 }}>Awaiting fulfilment</Text>
              {myHeld.length === 0 && <Text style={{ color: C.sub, fontSize: 13 }}>No held orders to ship.</Text>}
              {myHeld.map((o) => (
                <Card key={o.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 24 }}>{o.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: C.text, fontWeight: '700' }}>{o.title}</Text>
                      <Text style={{ color: C.sub, fontSize: 12 }}>Net payout {o.net} after 12% fee</Text>
                    </View>
                    <Pill status={o.status} />
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 12 }}>
                    <Btn label="Mark as shipped" onPress={() => ship(o.id)} />
                  </View>
                </Card>
              ))}

              {designer.payouts.length > 0 && (
                <>
                  <Text style={{ color: C.text, fontWeight: '800', fontSize: 15, marginTop: 4 }}>Payout history</Text>
                  {designer.payouts.map((p) => (
                    <Card key={p.transferId}>
                      <Row k="Transfer" v={p.transferId} />
                      <Row k="Amount" v={p.amountLabel} strong />
                    </Card>
                  ))}
                </>
              )}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
