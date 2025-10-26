import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../../components/BackButton';

// Placeholder de datos hasta integrar servicio real
type RejectedMaintenance = {
  id: number;
  description: string | null;
  created_at: string;
};

export default function MantenimientosRechazadosScreen() {
  const [items, setItems] = useState<RejectedMaintenance[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: integrar servicio real (status: 'rejected')
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const renderItem = ({ item }: { item: RejectedMaintenance }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="block" size={20} color="#E53935" />
        <Text style={styles.cardTitle}>Cotización rechazada</Text>
      </View>
      <Text style={styles.cardText}>{item.description || 'Sin descripción'}</Text>
      <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E53935" />

      <LinearGradient
        colors={['#E53935', '#D32F2F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.backButtonContainer}>
              <BackButton color="#fff" />
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Rechazados</Text>
              <Text style={styles.headerSubtitle}>Cotizaciones rechazadas</Text>
            </View>
            <View style={styles.badgeContainer}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalText}>{items.length}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: '#E5393510' }] }>
            <MaterialIcons name="block" size={72} color="#E53935" />
          </View>
          <Text style={styles.emptyTitle}>Sin rechazados</Text>
          <Text style={styles.emptyText}>Aquí verás los mantenimientos cuya cotización fue rechazada.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#E53935"]}
              tintColor="#E53935"
            />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA'
  },
  headerGradient: {
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  backButtonContainer: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  badgeContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 56,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  totalText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  listContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 8,
    paddingBottom: 32 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 32 
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333', 
    marginBottom: 8 
  },
  emptyText: { 
    fontSize: 15, 
    color: '#666', 
    textAlign: 'center', 
    lineHeight: 22 
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E53935',
  },
  cardText: {
    fontSize: 14,
    color: '#555',
  },
  cardDate: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
});


