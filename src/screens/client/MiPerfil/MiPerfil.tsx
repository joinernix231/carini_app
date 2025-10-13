import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import UserProfileModal from '../../../components/UserProfileModal';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MiPerfil() {
  const { token } = useAuth();
  const navigation = useNavigation();

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#005a8d" />
      <View style={styles.content}>
        <UserProfileModal
          visible={true}
          onClose={handleClose}
          token={token || ''}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
});