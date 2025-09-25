import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Dimensions,
    TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import BackButton from '../../../components/BackButton';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { useSmartNavigation } from '../../../hooks/useSmartNavigation';
import { useAuth } from '../../../context/AuthContext';
import { getEquiposVinculados } from '../../../services/EquipoClienteService';

const { width } = Dimensions.get('window');

// Tipos
type Equipo = {
    id: number;
    serial: string;
    device: {
        id: number;
        model: string;
        brand: string;
        serial: string;
        type: string;
        manufactured_at: string;
    };
    address: string;
};

type RootStackParamList = {
    MisEquipos: { refresh?: boolean } | undefined;
    SolicitarMantenimiento: undefined;
    Historial: undefined;
    Productos: undefined;
    DetalleEquipo: { deviceId: number };
    AgregarEquipo: undefined;
};

type MisEquiposRouteProp = RouteProp<RootStackParamList, 'MisEquipos'>;

// Función para obtener el icono según el tipo de equipo
const getEquipmentIcon = (type: string) => {
    const typeMap: { [key: string]: keyof typeof MaterialIcons.glyphMap } = {
        'lavadora': 'local-laundry-service',
        'secadora': 'dry-cleaning',
        'default': 'devices'
    };
    return typeMap[type.toLowerCase()] || typeMap['default'];
};

// Función para obtener el color según el tipo
const getEquipmentColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
        'lavadora': '#4FC3F7',
        'secadora': '#FF8A65',
        'default': '#9C27B0'
    };
    return colorMap[type.toLowerCase()] || colorMap['default'];
};

// Componente mejorado para cada equipo
const EquipoCard = ({ item, onPress }: { item: Equipo; onPress: () => void }) => {
    const equipmentColor = getEquipmentColor(item.device.type);
    const equipmentIcon = getEquipmentIcon(item.device.type);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: equipmentColor }]}>
                    <MaterialIcons name={equipmentIcon} size={28} color="#fff" />
                </View>
                <View style={styles.equipmentInfo}>
                    <Text style={styles.cardTitle}>{item.device.model}</Text>
                    <Text style={styles.brandText}>{item.device.brand}</Text>
                </View>
                <View style={styles.statusContainer}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Activo</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <MaterialIcons name="confirmation-number" size={16} color="#666" />
                    <Text style={styles.infoText}>Serial: {item.serial}</Text>
                </View>
                <View style={styles.infoRow}>
                    <MaterialIcons name="location-on" size={16} color="#666" />
                    <Text style={styles.infoText}>{item.address}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.verDetalleContainer}>
                    <Text style={styles.verDetalleText}>Ver detalle</Text>
                    <MaterialIcons name="arrow-forward" size={16} color="#0077b6" />
                </View>
            </View>
        </TouchableOpacity>
    );
};

// Componente de estado vacío
const EmptyState = ({ onAddEquipment }: { onAddEquipment: () => void }) => (
    <View style={styles.emptyContainer}>
        <MaterialIcons name="devices" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No hay equipos registrados</Text>
        <Text style={styles.emptySubtitle}>
            Aún no tienes equipos vinculados. Agrega tu primer equipo para comenzar.
        </Text>
        <TouchableOpacity
            style={styles.emptyButton}
            onPress={onAddEquipment}
            activeOpacity={0.8}
        >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.emptyButtonText}>Agregar Equipo</Text>
        </TouchableOpacity>
    </View>
);

export default function MisEquipos() {
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [filteredEquipos, setFilteredEquipos] = useState<Equipo[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { token } = useAuth();
    const { navigate } = useSmartNavigation();
    const route = useRoute<MisEquiposRouteProp>();

    // Fetch equipos function
    const fetchEquipos = useCallback(async () => {
        try {
            if (!token) {
                setLoading(false);
                return;
            }

            const data = await getEquiposVinculados(token);
            setEquipos(data);
            setFilteredEquipos(data);
        } catch (error: any) {
            console.error('Error fetching equipos', error);
            Alert.alert('Error', 'No se pudieron cargar los equipos.');
            setEquipos([]);
            setFilteredEquipos([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    // useFocusEffect para cargar datos cuando la pantalla recibe foco
    useFocusEffect(
        useCallback(() => {
            fetchEquipos();
        }, [fetchEquipos])
    );

    // useEffect para detectar el parámetro refresh
    useEffect(() => {
        if (route.params?.refresh) {
            // Refrescar la lista
            fetchEquipos();
        }
    }, [route.params?.refresh, fetchEquipos]);

    // Filter equipos based on search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEquipos(equipos);
        } else {
            const filtered = equipos.filter(equipo =>
                equipo.device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                equipo.device.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                equipo.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
                equipo.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredEquipos(filtered);
        }
    }, [searchQuery, equipos]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchEquipos();
    }, [fetchEquipos]);

    const goToAddEquipment = useCallback(() => {
        navigate('AgregarEquipo');
    }, [navigate]);

    const goToEquipmentDetail = useCallback((deviceId: number) => {
        navigate('DetalleEquipo', { deviceId });
    }, [navigate]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0077b6" />
                    <Text style={styles.loadingText}>Cargando equipos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <BackButton style={{ marginTop: 8 }} color="#000" size={24} />
                <Text style={styles.title}>Mis Equipos</Text>
                <Text style={styles.subtitle}>
                    {equipos.length} {equipos.length === 1 ? 'equipo registrado' : 'equipos registrados'}
                </Text>
            </View>

            {/* Search Bar */}
            {equipos.length > 0 && (
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar equipos..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialIcons name="clear" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Equipment List */}
            {equipos.length === 0 ? (
                <EmptyState onAddEquipment={goToAddEquipment} />
            ) : filteredEquipos.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="search-off" size={80} color="#ccc" />
                    <Text style={styles.emptyTitle}>Sin resultados</Text>
                    <Text style={styles.emptySubtitle}>
                        No se encontraron equipos que coincidan con "{searchQuery}"
                    </Text>
                    <TouchableOpacity
                        style={styles.clearSearchButton}
                        onPress={() => setSearchQuery('')}
                    >
                        <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredEquipos}
                    renderItem={({ item }) => (
                        <EquipoCard
                            item={item}
                            onPress={() => goToEquipmentDetail(item.id)}
                        />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#0077b6"
                            colors={["#0077b6"]}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                />
            )}

            {/* FAB to add new device */}
            <TouchableOpacity
                style={styles.fab}
                onPress={goToAddEquipment}
                activeOpacity={0.9}
            >
                <MaterialIcons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

// Estilos
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 5,
        marginTop: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 15,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 90, // Espacio para el FAB
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    equipmentInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 2,
    },
    brandText: {
        fontSize: 14,
        color: '#7f8c8d',
        fontWeight: '500',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#27ae60',
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#27ae60',
        fontWeight: '600',
    },
    cardBody: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    verDetalleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verDetalleText: {
        color: '#0077b6',
        fontWeight: 'bold',
        marginRight: 5,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    emptyButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    clearSearchButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#0077b6',
    },
    clearSearchText: {
        color: '#0077b6',
        fontWeight: '700',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
});