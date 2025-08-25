import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Importa el LinearGradient de Expo
import AnimatedBubbles from '../components/AnimatedBubbles';
import LoginForm from '../components/LoginForm';

export default function LoginScreen() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const dynamicPadding = isKeyboardVisible ? screenHeight * 0.00001 : screenHeight * 0.10;

  return (
    <LinearGradient
      colors={['#00b4d8', '#0077b6']} // Gradiente entre dos tonos de azul
      style={styles.root}
    >
      <AnimatedBubbles />
      <View style={styles.content}>
        <Image
          source={require('../../assets/logo-c.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.formWrapper, { paddingTop: dynamicPadding }]}>
              <LoginForm />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
  },
  flex: {
    flex: 1,
    width: '100%',
  },
  logo: {
    width: 250,
    height: 250,
    marginTop: 20,
    marginBottom: 0,
    padding: 0
  },
  formWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
});
