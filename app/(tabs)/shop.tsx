import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase, Product } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('type', { ascending: true }).order('price', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const handlePurchase = (product: Product) => Alert.alert('Purchase', `Simulating purchase of ${product.name}`);

  const renderProduct = (product: Product) => (
    <Pressable 
      key={product.id} 
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardContent}>
        <Text style={styles.productType}>{product.type.replace('_', ' ').toUpperCase()}</Text>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
      </View>
      <Pressable 
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => handlePurchase(product)}
      >
        <Text style={styles.buttonText}>PURCHASE</Text>
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Shop</Text>
          <Text style={styles.subtitle}>MEMBERSHIPS & PACKS</Text>
        </View>
        {loading ? <ActivityIndicator size="small" color={colors.black} /> : <View style={styles.grid}>{products.map(renderProduct)}</View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  title: { fontSize: 42, fontFamily: fonts.serif, color: colors.black, marginBottom: 8 },
  subtitle: { fontSize: 12, fontFamily: fonts.sans, letterSpacing: 2, color: 'rgba(0,0,0,0.5)' },
  grid: { paddingHorizontal: 24, gap: 16 },
  card: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: { transform: [{ scale: 0.99 }] },
  cardContent: { alignItems: 'center', marginBottom: 24 },
  productType: { fontSize: 10, fontFamily: fonts.sans, letterSpacing: 2, color: 'rgba(0,0,0,0.4)', marginBottom: 12 },
  productName: { fontSize: 24, fontFamily: fonts.serif, color: colors.black, marginBottom: 8, textAlign: 'center' },
  productPrice: { fontSize: 32, fontFamily: fonts.sans, fontWeight: '300', color: colors.black },
  button: {
    backgroundColor: colors.black,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: colors.white, fontSize: 12, fontFamily: fonts.sans, letterSpacing: 1, fontWeight: '600' },
});
