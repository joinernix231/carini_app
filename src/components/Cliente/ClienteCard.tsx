import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Cliente } from '../../types/cliente/cliente';

const { width } = Dimensions.get('window');

type Props = {
    cliente: Cliente;
    onPress: (id: number) => void;
    onEdit?: (cliente: Cliente) => void;
    onDelete: (id: number, name: string) => void;
};

function ClienteCardComponent({ cliente, onPress, onEdit, onDelete }: Props) {
    const getInitials = (name: string | undefined) => {
        if (!name) return 'CL';
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'active':
                return {
                    backgroundColor: '#E8F8F5',
                    color: '#10B981',
                    text: 'Activo',
                    icon: 'checkmark-circle' as const
                };
            case 'inactive':
                return {
                    backgroundColor: '#FEF2F2',
                    color: '#EF4444',
                    text: 'Inactivo',
                    icon: 'close-circle' as const
                };
            default:
                return {
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280',
                    text: 'Desconocido',
                    icon: 'help-circle' as const
                };
        }
    };

    const statusConfig = getStatusConfig(cliente.status || 'active');

    return (
        <TouchableOpacity
            onPress={() => onPress(cliente.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Ver Cliente ${cliente.name}`}
            style={styles.card}
        >
            {/* Header con Avatar y Nombre */}
            <View style={styles.headerSection}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {getInitials(cliente.name)}
                        </Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                </View>

                <View style={styles.nameSection}>
                    <Text style={styles.clienteName} numberOfLines={1}>
                        {cliente.name || 'Cliente sin nombre'}
                    </Text>
                    
                    {/* Badge de estado */}
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.backgroundColor }]}>
                            <Ionicons
                                name={statusConfig.icon}
                                size={14}
                                color={statusConfig.color}
                            />
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {statusConfig.text}
                            </Text>
                        </View>
                        
                        {cliente.client_type && (
                            <View style={styles.typeBadge}>
                                <Text style={styles.typeText}>
                                    {cliente.client_type}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Información de Contacto */}
            <View style={styles.contactSection}>
                <View style={styles.contactRow}>
                    <View style={styles.contactItem}>
                        <Ionicons name="mail-outline" size={16} color="#6B7280" />
                        <Text style={styles.contactText} numberOfLines={1}>
                            {cliente.user?.email || 'Sin email'}
                        </Text>
                    </View>
                </View>

                {cliente.phone && (
                    <View style={styles.contactRow}>
                        <View style={styles.contactItem}>
                            <Ionicons name="call-outline" size={16} color="#6B7280" />
                            <Text style={styles.contactText} numberOfLines={1}>
                                {cliente.phone}
                            </Text>
                        </View>
                    </View>
                )}

                {cliente.identifier && (
                    <View style={styles.contactRow}>
                        <View style={styles.contactItem}>
                            <Ionicons name="card-outline" size={16} color="#6B7280" />
                            <Text style={styles.contactText} numberOfLines={1}>
                                ID: {cliente.identifier}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Línea separadora */}
            <View style={styles.divider} />

            {/* Botones de acción */}
            <View style={styles.actionsSection}>
            

                <TouchableOpacity
                    onPress={() => onDelete(cliente.id, cliente.name || 'Cliente')}
                    style={styles.actionButton}
                    accessibilityLabel={`Eliminar Cliente ${cliente.name}`}
                    accessibilityRole="button"
                >
                    <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Eliminar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onPress(cliente.id)}
                    style={[styles.actionButton, styles.primaryButton]}
                    accessibilityLabel={`Ver detalles de ${cliente.name}`}
                    accessibilityRole="button"
                >
                    <Ionicons name="eye-outline" size={20} color="#ffffff" />
                    <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Ver más</Text>
                </TouchableOpacity>
            </View>

            {/* Indicador visual de interacción */}
            <View style={styles.interactionIndicator} />
        </TouchableOpacity>
    );
}

export default React.memo(ClienteCardComponent, (prev, next) =>
    prev.cliente.id === next.cliente.id &&
    prev.cliente.name === next.cliente.name &&
    prev.cliente.status === next.cliente.status &&
    prev.cliente.email === next.cliente.email &&
    prev.cliente.phone === next.cliente.phone
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginBottom: 20,
        marginHorizontal: 6,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    
    // Header Section
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 20,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
    },
    statusDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 3,
        borderColor: '#ffffff',
    },
    nameSection: {
        flex: 1,
    },
    clienteName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 25,
        gap: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    typeBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 25,
        backgroundColor: '#EFF6FF',
    },
    typeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
    },

    // Contact Section
    contactSection: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        gap: 12,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    contactText: {
        fontSize: 15,
        color: '#6B7280',
        flex: 1,
        fontWeight: '500',
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 24,
        marginBottom: 20,
    },

    // Actions Section
    actionsSection: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 12,
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flex: 1,
        gap: 8,
        minHeight: 48,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },

    // Interaction Indicator
    interactionIndicator: {
        height: 4,
        backgroundColor: '#3B82F6',
        marginHorizontal: 24,
        borderRadius: 2,
        opacity: 0,
    },
});