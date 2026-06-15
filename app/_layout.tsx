import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { C } from '@/lib/theme';

const icon = (glyph: string) => ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>{glyph}</Text>;

export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: C.bg },
          headerTitleStyle: { color: C.text, fontWeight: '800' },
          headerShadowVisible: false,
          tabBarStyle: { backgroundColor: C.card, borderTopColor: C.line },
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: C.sub,
          sceneStyle: { backgroundColor: C.bg },
        }}>
        <Tabs.Screen name="index" options={{ title: 'Shop', tabBarLabel: 'Shop', tabBarIcon: icon('🛍️') }} />
        <Tabs.Screen name="orders" options={{ title: 'My Orders', tabBarLabel: 'Orders', tabBarIcon: icon('📦') }} />
        <Tabs.Screen name="designer" options={{ title: 'Designer Studio', tabBarLabel: 'Designer', tabBarIcon: icon('✂️') }} />
        <Tabs.Screen name="admin" options={{ title: 'Admin / Escrow', tabBarLabel: 'Admin', tabBarIcon: icon('🛡️') }} />
      </Tabs>
    </SafeAreaProvider>
  );
}
