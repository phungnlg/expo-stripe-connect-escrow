import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useEscrow } from '@/store/escrow';
import { C } from '@/lib/theme';
import { Card, Pill, Btn, Row } from '@/lib/ui';

const STEPS = ['HELD', 'SHIPPED', 'RELEASED'];

function Track({ status }: { status: string }) {
  const idx = status === 'REFUNDED' ? -1 : STEPS.indexOf(status);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
      {STEPS.map((s, i) => {
        const done = idx >= 0 && i <= idx;
        const color = status === 'REFUNDED' ? C.refunded : done ? C.released : C.line;
        return (
          <View key={s} style={{ flex: i < STEPS.length - 1 ? 1 : 0, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: color }} />
            {i < STEPS.length - 1 && <View style={{ flex: 1, height: 2, backgroundColor: i < idx ? C.released : C.line }} />}
          </View>
        );
      })}
    </View>
  );
}

export default function Orders() {
  const { orders, loadOrders, release } = useEscrow();
  useFocusEffect(useCallback(() => { loadOrders(); }, []));

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {orders.length === 0 && <Text style={{ color: C.sub, marginTop: 20 }}>No orders yet. Buy something from the Shop tab.</Text>}
      {orders.map((o) => (
        <Card key={o.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 26 }}>{o.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 15, fontWeight: '700' }}>{o.title}</Text>
              <Text style={{ color: C.sub, fontSize: 12 }}>{o.designerName}</Text>
            </View>
            <Pill status={o.status} />
          </View>

          <Track status={o.status} />

          <View style={{ marginTop: 12 }}>
            <Row k="Paid" v={o.amount} />
            <Row k="Held in escrow" v={o.status === 'RELEASED' ? '$0.00' : o.net} />
            <Row k="Payment intent" v={o.paymentIntentId} />
            {o.transferId && <Row k="Transfer" v={o.transferId} />}
          </View>

          {o.status === 'SHIPPED' && (
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <Btn label="Confirm delivery & release funds" onPress={() => release(o.id)} />
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}
