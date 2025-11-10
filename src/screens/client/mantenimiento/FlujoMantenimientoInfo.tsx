import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { ClienteStackParamList } from '../../../types/navigation';

type FlujoMantenimientoInfoRouteProp = RouteProp<ClienteStackParamList, 'FlujoMantenimientoInfo'>;

const CARINI_PHONE = '3104856772';

export default function FlujoMantenimientoInfo() {
  const navigation = useNavigation();
  const route = useRoute<FlujoMantenimientoInfoRouteProp>();
  const { navigate } = useSmartNavigation();
  const equipoId = route.params?.equipoId;

  const handleCallCarini = () => {
    Linking.openURL(`tel:${CARINI_PHONE}`);
  };

  const handleContinue = () => {
    navigate('CrearMantenimiento', equipoId ? { equipoId } : undefined);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proceso de Mantenimiento</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner Principal */}
        <View style={styles.mainBanner}>
          <View style={styles.mainBannerIconContainer}>
            <Ionicons name="information-circle" size={48} color="#007AFF" />
          </View>
          <Text style={styles.mainBannerTitle}>¿Cómo funciona el proceso?</Text>
          <Text style={styles.mainBannerSubtitle}>
            Conoce todos los pasos que seguirá tu solicitud de mantenimiento
          </Text>
        </View>

        {/* Pasos del Flujo */}
        <View style={styles.stepsSection}>
          <Text style={styles.sectionTitle}>Pasos del Proceso</Text>

          <View style={styles.stepsContainer}>
            {/* Paso 1 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepNumber, styles.stepNumberActive]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Crear Solicitud</Text>
                <Text style={styles.stepDescription}>
                  Completa el formulario con los equipos que necesitan mantenimiento y los detalles necesarios
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            {/* Paso 2 */}
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Ionicons name="document-text" size={20} color="#666" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Revisión y Cotización</Text>
                <Text style={styles.stepDescription}>
                  El coordinador revisará tu solicitud y preparará una cotización con el valor del mantenimiento
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            {/* Paso 3 - Pago */}
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Ionicons name="card" size={20} color="#666" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Proceso de Pago</Text>
                <View style={styles.paymentInfoBox}>
                  <Text style={styles.paymentInfoTitle}>Si tu mantenimiento requiere pago:</Text>
                  <Text style={styles.paymentInfoText}>
                    • Deberás subir un soporte de pago (comprobante, transferencia, etc.)
                  </Text>
                  <Text style={styles.paymentInfoText}>
                    • El coordinador verificará el pago
                  </Text>
                  <Text style={styles.paymentInfoText}>
                    • Una vez verificado, se procederá con la asignación del técnico
                  </Text>
                </View>
                <View style={styles.noPaymentInfoBox}>
                  <Text style={styles.noPaymentInfoTitle}>Si tu mantenimiento NO requiere pago:</Text>
                  <Text style={styles.noPaymentInfoText}>
                    • El coordinador asignará directamente el técnico sin necesidad de pago
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.stepConnector} />

            {/* Paso 4 */}
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Ionicons name="calendar" size={20} color="#666" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Confirmar Fecha</Text>
                <Text style={styles.stepDescription}>
                  Recibirás una fecha y hora propuesta para el mantenimiento que deberás confirmar
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            {/* Paso 5 */}
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Ionicons name="person" size={20} color="#666" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Asignación de Técnico</Text>
                <Text style={styles.stepDescription}>
                  Se asignará un técnico especializado para realizar el mantenimiento en tu equipo
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            {/* Paso 6 */}
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Ionicons name="build" size={20} color="#666" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Realización del Mantenimiento</Text>
                <Text style={styles.stepDescription}>
                  El técnico realizará el mantenimiento en la fecha y hora acordadas
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            {/* Paso 7 */}
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Ionicons name="checkmark-circle" size={20} color="#666" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Finalización</Text>
                <Text style={styles.stepDescription}>
                  El mantenimiento se completará y podrás verificar el resultado en la aplicación
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sección de Ayuda */}
        <View style={styles.helpSection}>
          <View style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Ionicons name="help-circle" size={28} color="#FF9500" />
              <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
            </View>
            <Text style={styles.helpDescription}>
              Si tienes dudas sobre el proceso o necesitas asistencia, puedes contactarnos directamente
            </Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallCarini}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.callButtonText}>Llamar a Carini</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Botón de Continuar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Entendido, continuar</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  mainBanner: {
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B8D9F5',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mainBannerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  mainBannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainBannerSubtitle: {
    fontSize: 16,
    color: '#4A90E2',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
  },
  stepsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  stepNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  stepNumberActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  stepNumberText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 21,
    marginBottom: 4,
  },
  paymentInfoBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  paymentInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F57C00',
    marginBottom: 8,
  },
  paymentInfoText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
    marginBottom: 4,
  },
  noPaymentInfoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  noPaymentInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  noPaymentInfoText: {
    fontSize: 14,
    color: '#1B5E20',
    lineHeight: 20,
  },
  helpSection: {
    marginBottom: 20,
  },
  helpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF9500',
    marginLeft: 12,
  },
  helpDescription: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 20,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  callButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

