import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Coordinador } from "../../types/coordinador/coordinador";

const { width } = Dimensions.get('window');

type Props = {
    item: Coordinador;
    onPress: (id: number) => void;
    onDelete: (id: number, name: string) => void;
};

function CoordinadorCardComponent({ item, onPress, onDelete }: Props) {
    const getInitials = (name: string | undefined) => {
        if (!name) return 'CO';
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

    const statusConfig = getStatusConfig(item.status || '');

    return (
        <TouchableOpacity
            onPress={() => onPress(item.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Ver Coordinador ${item.user?.name || item.name}`}
            style={styles.card}
        >
            {/* Header con Avatar y Nombre */}
            <View style={styles.headerSection}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {getInitials(item.user?.name || item.name)}
                        </Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                </View>

                <View style={styles.nameSection}>
                    <Text style={styles.coordinadorName} numberOfLines={1}>
                        {item.user?.name || item.name || 'Coordinador sin nombre'}
                    </Text>

                    {/* Badge de estado y rol */}
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

                        <View style={styles.roleBadge}>
                            <Ionicons name="people-outline" size={12} color="#7C3AED" />
                            <Text style={styles.roleText}>
                                Coordinador
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Información de Contacto */}
            <View style={styles.contactSection}>
                <View style={styles.contactRow}>
                    <View style={styles.contactItem}>
                        <Ionicons name="mail-outline" size={16} color="#6B7280" />
                        <Text style={styles.contactText} numberOfLines={1}>
                            {item.user?.email || item.email || 'Sin email'}
                        </Text>
                    </View>
                </View>

                {item.phone && (
                    <View style={styles.contactRow}>
                        <View style={styles.contactItem}>
                            <Ionicons name="call-outline" size={16} color="#6B7280" />
                            <Text style={styles.contactText} numberOfLines={1}>
                                {item.phone}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Información adicional del coordinador */}
                <View style={styles.contactRow}>
                    <View style={styles.contactItem}>
                        <Ionicons name="business-outline" size={16} color="#6B7280" />
                        <Text style={styles.contactText} numberOfLines={1}>
                            Gestión y Coordinación
                        </Text>
                    </View>
                </View>
            </View>

            {/* Línea separadora */}
            <View style={styles.divider} />

            {/* Botones de acción */}
            <View style={styles.actionsSection}>
                <TouchableOpacity
                    onPress={() => onDelete(item.id, item.user?.name || item.name || 'Coordinador')}
                    style={styles.actionButton}
                    accessibilityLabel={`Eliminar Coordinador ${item.user?.name || item.name}`}
                    accessibilityRole="button"
                >
                    <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Eliminar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onPress(item.id)}
                    style={[styles.actionButton, styles.primaryButton]}
                    accessibilityLabel={`Ver detalles de ${item.user?.name || item.name}`}
                    accessibilityRole="button"
                >
                    <Ionicons name="eye-outline" size={20} color="#ffffff" />
                    <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Ver detalles</Text>
                </TouchableOpacity>
            </View>

            {/* Indicador visual de interacción */}
            <View style={styles.interactionIndicator} />
        </TouchableOpacity>
    );
}

export default React.memo(CoordinadorCardComponent, (prev, next) =>
    prev.item.id === next.item.id &&
    (prev.item.user?.name || prev.item.name) === (next.item.user?.name || next.item.name) &&
    prev.item.status === next.item.status &&
    (prev.item.user?.email || prev.item.email) === (next.item.user?.email || next.item.email) &&
    prev.item.phone === next.item.phone
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
        backgroundColor: '#7C3AED',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#7C3AED',
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
    coordinadorName: {
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
        flexWrap: 'wrap',
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
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 25,
        backgroundColor: '#F3E8FF',
        gap: 6,
    },
    roleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7C3AED',
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
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },

    // Interaction Indicator
    interactionIndicator: {
        height: 4,
        backgroundColor: '#7C3AED',
        marginHorizontal: 24,
        borderRadius: 2,
        opacity: 0,
    },
});