import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Equipo } from '../../types/equipo/equipo';

const { width } = Dimensions.get('window');

type Props = {
    equipo: Equipo;
    onPress: (id: number) => void;
    onEdit?: (equipo: Equipo) => void;
    onDelete: (id: number, name: string) => void;
};

function EquipoCardComponent({ equipo, onPress, onEdit, onDelete }: Props) {
    const getInitials = (brand: string | undefined, model: string | undefined) => {
        const brandInitial = brand ? brand.charAt(0).toUpperCase() : 'E';
        const modelInitial = model ? model.charAt(0).toUpperCase() : 'Q';
        return `${brandInitial}${modelInitial}`;
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

    const statusConfig = getStatusConfig(equipo.status || 'active');

    return (
        <TouchableOpacity
            onPress={() => onPress(equipo.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Ver Equipo ${equipo.serial}`}
            style={styles.card}
        >
            {/* Header con Avatar y Información Principal */}
            <View style={styles.headerSection}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                                {getInitials(equipo.brand, equipo.model)}
                            </Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                </View>

                <View style={styles.nameSection}>
                    <Text style={styles.equipoName} numberOfLines={1}>
                        {equipo.model || equipo.brand}
                    </Text>

                    {/* Badge de tipo de equipo */}
                    <View style={styles.statusContainer}>
                        {equipo.type && (
                            <View style={styles.typeBadge}>
                                <Ionicons name="hardware-chip-outline" size={12} color="#059669" />
                                <Text style={styles.typeText}>
                                    {equipo.type}
                                </Text>
                            </View>
                        )}

                        <View style={styles.availableBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#059669" />
                            <Text style={styles.availableText}>
                                Disponible
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Información del Equipo */}
            <View style={styles.infoSection}>
                {equipo.description && (
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                            <Text style={styles.infoText} numberOfLines={2}>
                                {equipo.description}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Línea separadora */}
            <View style={styles.divider} />

            {/* Botones de acción */}
            <View style={styles.actionsSection}>
                {onEdit && (
                    <TouchableOpacity
                        onPress={() => onEdit(equipo)}
                        style={[styles.actionButton, styles.primaryButton]}
                        accessibilityLabel={`Editar Equipo ${equipo.brand} ${equipo.model}`}
                        accessibilityRole="button"
                    >
                        <Ionicons name="pencil" size={20} color="#ffffff" />
                        <Text style={[styles.actionButtonText, { color: '#ffffff' }]}>Editar</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={() => onDelete(equipo.id, `${equipo.brand} ${equipo.model}` || 'Equipo')}
                    style={styles.actionButton}
                    accessibilityLabel={`Eliminar Equipo ${equipo.brand} ${equipo.model}`}
                    accessibilityRole="button"
                >
                    <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Eliminar</Text>
                </TouchableOpacity>
            </View>

            {/* Indicador visual de interacción */}
            <View style={styles.interactionIndicator} />
        </TouchableOpacity>
    );
}

export default React.memo(EquipoCardComponent, (prev, next) =>
    prev.equipo.id === next.equipo.id &&
    prev.equipo.serial === next.equipo.serial &&
    prev.equipo.status === next.equipo.status &&
    prev.equipo.brand === next.equipo.brand &&
    prev.equipo.model === next.equipo.model
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
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
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
    equipoName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    equipoSerial: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
    },
    availableBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 25,
        backgroundColor: '#ECFDF5',
        gap: 6,
    },
    availableText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 25,
        backgroundColor: '#ECFDF5',
        gap: 6,
    },
    typeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#059669',
    },

    // Info Section
    infoSection: {
        paddingHorizontal: 24,
        paddingBottom: 20,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        gap: 12,
    },
    infoText: {
        fontSize: 15,
        color: '#6B7280',
        flex: 1,
        fontWeight: '500',
        lineHeight: 20,
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
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },

    // Interaction Indicator
    interactionIndicator: {
        height: 4,
        backgroundColor: '#059669',
        marginHorizontal: 24,
        borderRadius: 2,
        opacity: 0,
    },
});