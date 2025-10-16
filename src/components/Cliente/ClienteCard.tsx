import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Cliente } from '../../types/cliente/cliente';

interface ClienteCardProps {
  cliente: Cliente;
  onPress: (id: number) => void;
  onDelete: (id: number, name: string) => void;
}

const ClienteCard: React.FC<ClienteCardProps> = ({
  cliente,
  onPress,
  onDelete
}) => {
  const handlePress = () => {
    onPress(cliente.id);
  };

  const handleDelete = () => {
    onDelete(cliente.id, cliente.name);
  };

  const getStatusBadge = () => {
    if (cliente.status === 'active') {
      return {
        text: 'Activo',
        color: '#059669',
        backgroundColor: '#D1FAE5'
      };
    } else {
      return {
        text: 'Inactivo',
        color: '#DC2626',
        backgroundColor: '#FEE2E2'
      };
    }
  };

  const badge = getStatusBadge();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="person" size={28} color="#fff" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{cliente.name}</Text>
          <Text style={styles.subtitle}>{cliente.user?.email || 'Sin email'}</Text>
          <Text style={styles.identification}>ID: {cliente.identifier || cliente.id}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>
              {badge.text}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="delete" size={20} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
    marginBottom: 2,
  },
  identification: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  actionsContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
});

export default ClienteCard;