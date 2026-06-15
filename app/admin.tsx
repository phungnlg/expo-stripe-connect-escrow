import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useEscrow } from '@/store/escrow';
import { C, statusColor } from '@/lib/theme';
import { Card, Pill, Btn, Row } from '@/lib/ui';

const cents = (s: string) => Math.round(parseFloat(s.replace('$', '')) * 100);

export default function Admin() {
  const { orders, loadOrders, release, refund } = useEscrow();
  useFocusEffect(useCallback(() => { loadOrders(); }, []));

  const held = orders.filter((o) => o.status === 'HELD' || o.status === 'SHIPPED');
  const escrowTotal = held.reduce((s, o) => s + cents(o.net), 0);
  const feeTotal = orders.filter((o) => o.status === 'RELEASED').reduce((s, o) => s + cents(o.fee), 0);

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Text style={{ color: C.sub, fontSize: 13 }}>Platform escrow ledger</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.held, fontSize: 22, fontWeight: '900' }}>${(escrowTotal / 100).toFixed(2)}</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>held on platform</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.released, fontSize: 22, fontWeight: '900' }}>${(feeTotal / 100).toFixed(2)}</Text>
            <Text style={{ color: C.sub, fontSize: 12 }}>commission earned</Text>
          </View>
        </View>
      </Card>

      <Text style={{ color: C.text, fontWeight: '800', fontSize: 15 }}>All orders</Text>
      {orders.map((o) => (
        <Card key={o.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 22 }}>{o.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontWeight: '700', fontSize: 14 }}>{o.title}</Text>
              <Text style={{ color: C.sub, fontSize: 12 }}>{o.id}</Text>
            </View>
            <Pill status={o.status} />
          </View>

          <View style={{ marginTop: 10, borderLeftWidth: 2, borderLeftColor: statusColor(o.status), paddingLeft: 10 }}>
            {o.history.map((h, i) => (
              <Text key={i} style={{ color: C.sub, fontSize: 11, marginVertical: 1 }}>
                {h.status}
              </Text>
            ))}
          </View>

          <View style={{ marginTop: 10 }}>
            <Row k="Gross" v={o.amount} />
            <Row k="Fee (12%)" v={o.fee} />
            <Row k="Net to designer" v={o.net} strong />
          </View>

          {(o.status === 'HELD' || o.status === 'SHIPPED') && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Btn label="Refund buyer" kind="danger" onPress={() => refund(o.id)} />
              <Btn label="Release payout" onPress={() => release(o.id)} />
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}
