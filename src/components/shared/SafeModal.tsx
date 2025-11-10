// src/components/shared/SafeModal.tsx
// Componente wrapper para modales que respeta SafeAreaView correctamente
import React from 'react';
import { Modal, ModalProps, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeModalProps extends ModalProps {
    children: React.ReactNode;
    safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
}

/**
 * Modal wrapper que respeta SafeAreaView correctamente
 * Evita que el contenido del modal invada la barra de estado o notches
 * 
 * @example
 * <SafeModal visible={visible} onRequestClose={onClose}>
 *   <View style={styles.content}>
 *     <Text>Contenido del modal</Text>
 *   </View>
 * </SafeModal>
 */
export default function SafeModal({
    children,
    safeAreaEdges = ['top', 'left', 'right'],
    presentationStyle = 'pageSheet',
    ...modalProps
}: SafeModalProps) {
    return (
        <Modal
            {...modalProps}
            presentationStyle={presentationStyle}
            animationType={modalProps.animationType || 'slide'}
        >
            <SafeAreaView style={styles.container} edges={safeAreaEdges}>
                {children}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

