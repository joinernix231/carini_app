// src/components/SkeletonLoading.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  children?: React.ReactNode;
}

// Componente base de skeleton con animación
export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style,
  children 
}: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#f0f0f0', '#e0e0e0'],
  });

  if (children) {
    return (
      <Animated.View style={[styles.container, { backgroundColor }, style]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

// Skeleton para cards de lista
export function SkeletonCard() {
  return (
    <View style={styles.cardContainer}>
      <Skeleton width={60} height={60} borderRadius={30} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={16} style={styles.cardTitle} />
        <Skeleton width="50%" height={14} style={styles.cardSubtitle} />
        <Skeleton width="30%" height={12} style={styles.cardMeta} />
      </View>
    </View>
  );
}

// Skeleton para listas
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

// Skeleton para dashboard
export function SkeletonDashboard() {
  return (
    <View style={styles.dashboardContainer}>
      {/* Header */}
      <View style={styles.dashboardHeader}>
        <Skeleton width={120} height={24} style={styles.dashboardTitle} />
        <Skeleton width={80} height={16} style={styles.dashboardSubtitle} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={index} style={styles.statCard}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <Skeleton width="80%" height={16} style={styles.statValue} />
            <Skeleton width="60%" height={12} style={styles.statLabel} />
          </View>
        ))}
      </View>

      {/* Content List */}
      <View style={styles.contentContainer}>
        <Skeleton width={100} height={20} style={styles.sectionTitle} />
        <SkeletonList count={3} />
      </View>
    </View>
  );
}

// Skeleton para formularios
export function SkeletonForm() {
  return (
    <View style={styles.formContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.formField}>
          <Skeleton width="30%" height={14} style={styles.fieldLabel} />
          <Skeleton width="100%" height={48} borderRadius={8} />
        </View>
      ))}
      <View style={styles.formActions}>
        <Skeleton width="45%" height={48} borderRadius={8} />
        <Skeleton width="45%" height={48} borderRadius={8} />
      </View>
    </View>
  );
}

// Skeleton para detalles
export function SkeletonDetail() {
  return (
    <View style={styles.detailContainer}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <Skeleton width={80} height={80} borderRadius={40} />
        <View style={styles.detailInfo}>
          <Skeleton width="70%" height={20} style={styles.detailTitle} />
          <Skeleton width="50%" height={16} style={styles.detailSubtitle} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.detailContent}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} style={styles.detailRow}>
            <Skeleton width="30%" height={14} />
            <Skeleton width="60%" height={14} />
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.detailActions}>
        <Skeleton width="100%" height={48} borderRadius={8} />
      </View>
    </View>
  );
}

// Skeleton para tablas
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <View style={styles.tableContainer}>
      {/* Header */}
      <View style={styles.tableHeader}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} width="20%" height={16} style={styles.tableHeaderCell} />
        ))}
      </View>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width="20%" height={14} style={styles.tableCell} />
          ))}
        </View>
      ))}
    </View>
  );
}

// Hook para mostrar skeleton mientras carga
export function useSkeletonLoading(loading: boolean, delay = 0) {
  const [showSkeleton, setShowSkeleton] = React.useState(loading);

  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
    } else {
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [loading, delay]);

  return showSkeleton;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  skeleton: {
    backgroundColor: '#f0f0f0',
  },
  
  // Card styles
  cardContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardSubtitle: {
    marginBottom: 4,
  },
  cardMeta: {
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },

  // Dashboard styles
  dashboardContainer: {
    flex: 1,
    padding: 16,
  },
  dashboardHeader: {
    marginBottom: 24,
  },
  dashboardTitle: {
    marginBottom: 8,
  },
  dashboardSubtitle: {
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 16,
  },

  // Form styles
  formContainer: {
    padding: 16,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },

  // Detail styles
  detailContainer: {
    flex: 1,
    padding: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailInfo: {
    flex: 1,
    marginLeft: 16,
  },
  detailTitle: {
    marginBottom: 8,
  },
  detailSubtitle: {
    marginBottom: 8,
  },
  detailContent: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailActions: {
    marginTop: 24,
  },

  // Table styles
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    flex: 1,
    marginRight: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    marginRight: 8,
  },
});
