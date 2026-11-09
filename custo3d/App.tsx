import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, BackHandler, Easing, Keyboard, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProductFormPage } from './src/screens/ProductFormPage';
import { ProductsScreen } from './src/screens/ProductsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SpoolFormPage } from './src/screens/SpoolFormPage';
import { SpoolsScreen } from './src/screens/SpoolsScreen';
import { store, useStore } from './src/store/appStore';
import { colors, space, typo } from './src/theme';
import { useReduceMotion } from './src/ui/motion';
import { TabBar } from './src/ui/TabBar';
import type { TabKey } from './src/ui/TabBar';

type Route = { kind: 'spool'; id?: string } | { kind: 'product'; id?: string };

function Root() {
  const ready = useStore((s) => s.ready);
  const readError = useStore((s) => s.readError);
  const [tab, setTab] = useState<TabKey>('spools');
  const [route, setRoute] = useState<Route | null>(null);
  const { width } = useWindowDimensions();
  const reduce = useReduceMotion();

  // Transição das páginas de formulário: um único valor animado na thread nativa.
  const progress = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  const reduceRef = useRef(reduce);
  const routeRef = useRef<Route | null>(null);
  const tabRef = useRef<TabKey>(tab);
  useEffect(() => {
    reduceRef.current = reduce;
    routeRef.current = route;
    tabRef.current = tab;
  });

  useEffect(() => {
    void store.load();
  }, []);

  const openRoute = useCallback(
    (r: Route) => {
      closing.current = false;
      progress.setValue(0);
      setRoute(r);
    },
    [progress],
  );

  const closeRoute = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    Keyboard.dismiss();
    if (reduceRef.current) {
      setRoute(null);
      closing.current = false;
      return;
    }
    Animated.timing(progress, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setRoute(null);
      closing.current = false;
    });
  }, [progress]);

  useEffect(() => {
    if (!route) return;
    if (reduce) {
      progress.setValue(1);
      return;
    }
    const anim = Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [route, reduce, progress]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (routeRef.current) {
        closeRoute();
        return true;
      }
      if (tabRef.current !== 'spools') {
        setTab('spools');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [closeRoute]);

  const addSpool = useCallback(() => openRoute({ kind: 'spool' }), [openRoute]);
  const editSpool = useCallback((id: string) => openRoute({ kind: 'spool', id }), [openRoute]);
  const addProduct = useCallback(() => openRoute({ kind: 'product' }), [openRoute]);
  const editProduct = useCallback((id: string) => openRoute({ kind: 'product', id }), [openRoute]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.fill}>
        {tab === 'spools' && <SpoolsScreen onAdd={addSpool} onEdit={editSpool} />}
        {tab === 'products' && <ProductsScreen onAdd={addProduct} onEdit={editProduct} onAddSpool={addSpool} />}
        {tab === 'settings' && <SettingsScreen />}
      </View>

      {readError ? (
        <View style={styles.banner}>
          <Text style={[typo.caption, { color: colors.danger }]}>
            Não foi possível ler os dados guardados. As alterações não serão gravadas até reiniciares a app.
          </Text>
        </View>
      ) : null}

      <TabBar active={tab} onChange={setTab} />

      {route ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }]}
          />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.page,
              { transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [width, 0] }) }] },
            ]}
          >
            {route.kind === 'spool' ? (
              <SpoolFormPage spoolId={route.id} onClose={closeRoute} />
            ) : (
              <ProductFormPage productId={route.id} onClose={closeRoute} />
            )}
          </Animated.View>
        </>
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Root />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  page: { backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  banner: { paddingHorizontal: space.xl, paddingVertical: space.sm, backgroundColor: colors.surface },
});
