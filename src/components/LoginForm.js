import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('joinernix2@gmail.com');
  const [password, setPassword] = useState('saiz123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, []);

  const validateEmail = (value) => {
    const regex = /\S+@\S+\.\S+/;
    return regex.test(value);
  };

  const validateForm = () => {
    let valid = true;

    if (!validateEmail(email)) {
      setEmailError('Correo inválido');
      valid = false;
    } else {
      setEmailError('');
    }

    if (password.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Error', 'Credenciales inválidas o servidor no responde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Bienvenido a Carini</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="Correo"
          placeholderTextColor="#90e0ef"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) validateForm();
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          cursorColor="#ffffff"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, passwordError ? styles.inputError : null]}
          placeholder="Contraseña"
          placeholderTextColor="#90e0ef"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) validateForm();
          }}
          secureTextEntry={!showPassword}
          cursorColor="#ffffff"
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={22}
            color="#90e0ef"
          />
        </TouchableOpacity>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      </View>

      <TouchableOpacity onPress={() => Alert.alert('Función pendiente')}>
        <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#03045e" />
        ) : (
          <Text style={styles.buttonText}>Ingresar</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 30,
    marginTop: 0,
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 10,
    position: 'relative',
  },
  input: {
    backgroundColor: '#0077b6',
    padding: 14,
    paddingRight: 45,
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#ff4d6d',
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 14,
  },
  errorText: {
    color: '#d90429',
    fontSize: 14,
    fontWeight: 1,
    marginTop: 4,
  },
  forgotPassword: {
    color: '#caf0f8',
    alignSelf: 'flex-end',
    marginBottom: 20,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#caf0f8',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#03045e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
