import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import BackButton from '../BackButton';

interface ClienteHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    icon: keyof typeof MaterialIcons.glyphMap;
    onPress: () => void;
  };
}

const ClienteHeader: React.FC<ClienteHeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  rightAction
}) => {
  return (
    <View style={styles.container}>
      {showBackButton && (
        <BackButton 
          style={styles.backButton} 
          color="#000" 
          size={24} 
          onPress={onBackPress}
        />
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {rightAction && (
        <TouchableOpacity 
          style={styles.rightAction}
          onPress={rightAction.onPress}
        >
          <MaterialIcons 
            name={rightAction.icon} 
            size={24} 
            color="#0077b6" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  rightAction: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
  },
});

export default ClienteHeader;


