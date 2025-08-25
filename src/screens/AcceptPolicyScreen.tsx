import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { height: screenHeight } = Dimensions.get('window');

// @ts-ignore
export default function AcceptPolicyScreen({ navigation }) {
  const { acceptPolicy, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleAccept = async () => {
    if (!scrolledToBottom) {
      Alert.alert(
          'Atención',
          'Por favor, lee todas las políticas desplazándote hasta el final antes de aceptar.',
          [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    Alert.alert(
        'Confirmar aceptación',
        '¿Estás seguro de que has leído y aceptas las políticas de uso y tratamiento de datos?',
        [
          {
            text: 'Cancelar',
            style: 'cancel'
          },
          {
            text: 'Aceptar',
            style: 'default',
            onPress: async () => {
              setLoading(true);
              try {
                // Usa la función acceptPolicy del contexto
                await acceptPolicy();

                // La navegación es automática - AppNavigator detectará el cambio
                setLoading(false);

              } catch (error) {
                console.error('Error al aceptar políticas:', error);
                setLoading(false);
                Alert.alert(
                    'Error',
                    'Hubo un problema al procesar tu solicitud. Por favor, inténtalo nuevamente.',
                    [{ text: 'OK', style: 'default' }]
                );
              }
            }
          }
        ]
    );
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isScrolledToEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    setScrolledToBottom(isScrolledToEnd);
  };

  const PolicySection = ({ title, children }) => (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionContent}>{children}</Text>
      </View>
  );

  return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.wrapper}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Políticas de Uso y{'\n'}Tratamiento de Datos</Text>
            <Text style={styles.subtitle}>CARINI - Sistema de Gestión</Text>
          </View>

          {/* Content */}
          <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              onScroll={handleScroll}
              scrollEventThrottle={16}
          >
            <View style={styles.contentContainer}>
              <PolicySection title="1. Introducción">
                Al usar esta aplicación, usted acepta cumplir con los términos y condiciones aquí establecidos.
                Estas políticas tienen como objetivo proteger la seguridad de su información y garantizar un uso adecuado de la plataforma.
              </PolicySection>

              <PolicySection title="2. Tratamiento de datos personales">
                • La aplicación recolecta datos personales como nombre, correo electrónico, número de contacto y ubicación, únicamente para fines operativos del servicio.{'\n\n'}
                • No compartiremos su información con terceros sin su consentimiento, salvo requerimiento legal.{'\n\n'}
                • Usted tiene derecho a acceder, actualizar o eliminar sus datos enviando una solicitud a nuestro correo de soporte.
              </PolicySection>

              <PolicySection title="3. Uso autorizado de la aplicación">
                • La plataforma debe ser utilizada únicamente para los fines previstos, como gestión de equipos, solicitud de mantenimientos y comunicación con el soporte técnico.{'\n\n'}
                • Está prohibido el uso de la aplicación para actividades fraudulentas, suplantación de identidad o manipulación indebida de la información.
              </PolicySection>

              <PolicySection title="4. Seguridad de la información">
                • Usamos cifrado SSL para la transmisión de datos.{'\n\n'}
                • Realizamos respaldos periódicos para evitar pérdida de información.{'\n\n'}
                • Usted es responsable de mantener la confidencialidad de sus credenciales de acceso.
              </PolicySection>

              <PolicySection title="5. Responsabilidades del usuario">
                • Brindar información veraz y actualizada.{'\n\n'}
                • Reportar fallas o vulnerabilidades de seguridad de manera inmediata.{'\n\n'}
                • Abstenerse de modificar o descompilar el software.
              </PolicySection>

              <PolicySection title="6. Propiedad intelectual">
                • Todos los derechos de diseño, código y contenido pertenecen a la empresa CARINI.{'\n\n'}
                • No se permite su reproducción total o parcial sin autorización.
              </PolicySection>

              <PolicySection title="7. Aceptación">
                Al presionar "Aceptar", usted declara que ha leído y comprendido estas políticas, y consiente el tratamiento de sus datos según lo descrito.
              </PolicySection>

              {/* Scroll indicator */}
              {!scrolledToBottom && (
                  <View style={styles.scrollIndicator}>
                    <Text style={styles.scrollIndicatorText}>
                      👆 Desplázate para leer todas las políticas
                    </Text>
                  </View>
              )}
            </View>
          </ScrollView>

          {/* Footer with button */}
          <View style={styles.footer}>
            <View style={styles.checkContainer}>
              <View style={[styles.checkBox, scrolledToBottom && styles.checkBoxActive]}>
                {scrolledToBottom && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkText}>
                He leído y acepto las políticas de uso y tratamiento de datos
              </Text>
            </View>

            <TouchableOpacity
                style={[
                  styles.button,
                  (!scrolledToBottom || loading) && styles.buttonDisabled
                ]}
                onPress={handleAccept}
                disabled={!scrolledToBottom || loading}
            >
              {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.buttonText}>Procesando...</Text>
                  </View>
              ) : (
                  <Text style={styles.buttonText}>Aceptar y Continuar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  wrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0077b6',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#cce7f0',
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentContainer: {
    padding: 20,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#0077b6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023e8a',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    textAlign: 'justify',
  },
  scrollIndicator: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  scrollIndicatorText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  checkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxActive: {
    backgroundColor: '#0077b6',
    borderColor: '#0077b6',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#0077b6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0077b6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});