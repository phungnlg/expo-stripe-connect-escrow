import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Pressable, Alert } from 'react-native';
import { useEscrow } from '@/store/escrow';
import { C } from '@/lib/theme';
import { Card, Btn } from '@/lib/ui';
import type { Item } from '@/lib/api';

export default function Shop() {
  const { items, loadItems, checkout, busy } = useEscrow();
  const [selected, setSelected] = useState<Item | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const buy = async (item: Item) => {
    const order = await checkout(item.id);
    setSelected(null);
    if (order) Alert.alert('Payment held in escrow', `${order.amount} captured to the platform balance. Funds release to ${order.designerName} only after you confirm delivery.`);
  };

  return (
    <ScrollView style={{ backgroundColor: C.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ color: C.sub, fontSize: 13, lineHeight: 18 }}>
        Commission-led fashion marketplace. Every purchase is captured into escrow and held until delivery is confirmed.
      </Text>

      {items.map((it) => (
        <Pressable key={it.id} onPress={() => setSelected(selected?.id === it.id ? null : it)}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28 }}>{it.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>{it.title}</Text>
                <Text style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>{it.designerName} · {it.designerHandle}</Text>
              </View>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>{it.price}</Text>
            </View>

            {selected?.id === it.id && (
              <View style={{ marginTop: 14, gap: 10 }}>
                <View style={{ height: 1, backgroundColor: C.line }} />
                <Text style={{ color: C.sub, fontSize: 12 }}>
                  Buyer is charged now. The platform holds the funds. The designer is paid out (minus 12% commission) on delivery confirmation.
                </Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Btn label="Cancel" kind="ghost" onPress={() => setSelected(null)} />
                  <Btn label={busy ? 'Processing…' : `Pay ${it.price} into escrow`} onPress={() => buy(it)} disabled={busy} />
                </View>
              </View>
            )}
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}
