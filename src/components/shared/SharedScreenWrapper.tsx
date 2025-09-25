import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

interface SharedScreenWrapperProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function SharedScreenWrapper({ 
  children, 
  title, 
  showBackButton = true,
  onBackPress 
}: SharedScreenWrapperProps) {
  const { user } = useAuth();
  
  const getRoleIcon = () => {
    switch (user?.role) {
      case 'coordinador':
        return 'admin-panel-settings';
      case 'administrador':
        return 'supervisor-account';
      default:
        return 'person';
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'coordinador':
        return '#FF7043';
      case 'administrador':
        return '#0077b6';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con información del rol */}
      <View style={[styles.header, { backgroundColor: getRoleColor() }]}>
        <View style={styles.headerContent}>
          <MaterialIcons 
            name={getRoleIcon()} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.headerText}>
            {user?.role === 'coordinador' ? 'Coordinador' : 'Administrador'}
          </Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      {/* Contenido de la pantalla */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
});
