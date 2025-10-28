import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StatusBar,
    Alert,
    useColorScheme,
    Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../../../components/BackButton';
import PaginationControls from '../../../components/PaginationControls';
import ClienteCard from '../../../components/Cliente/ClienteCard';
import SearchBar from '../../../components/SearchBarComponet';
import { useClientes } from '../../../hooks/cliente/useClientes';
import { Cliente } from '../../../types/cliente/cliente';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useError } from '../../../context/ErrorContext';
import { useTheme } from '../../../context/ThemeContext';

const { width } = Dimensions.get('window');

type RootStackParamList = {
    ClienteList: undefined;
    DetalleCliente: { id: number };
    CrearCliente: undefined;
    EditarCliente: { id: number };
};

export default function ClienteList() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { isDark, colors } = useTheme();

    const {
        clientes,
        pagination,
        loading,
        paginationLoading,
        refreshing,
        error,
        searchText,
        setSearchText,
        isSearching,
        page,
        setPage,
        fetchClientes,
        onRefresh,
        changePage,
        removeCliente,
        addCliente,
        updateCliente,
    } = useClientes();
    const { showError } = useError();

    // Los datos se cargan automáticamente en useClientes hook
    // No se necesita useFocusEffect adicional

    const goToCreate = useCallback(() => navigation.navigate('CrearCliente'), [navigation]);
    const goToDetail = useCallback((id: number) => navigation.navigate('DetalleCliente', { id }), [navigation]);

    const handleDelete = useCallback(
        (id: number, name: string) => {
            Alert.alert(
                'Confirmar eliminación',
                `¿Estás seguro de que deseas eliminar a ${name}? Esta acción no se puede deshacer.`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                const ok = await removeCliente(id);
                                if (ok) {
                                    Alert.alert('Éxito', 'Cliente eliminado correctamente.');
                                }
                            } catch (error) {
                                // El error se maneja automáticamente por el sistema global
                                // Error log removed
                            }
                        },
                    },
                ]
            );
        },
        [removeCliente]
    );

    const handleSearch = useCallback((text: string) => {
        setSearchText(text);
        const filters = text.trim() ? `name|like|${text.trim()}` : undefined;
        fetchClientes(1, true, filters);
    }, [setSearchText, fetchClientes]);

    const clearSearch = useCallback(() => {
        setSearchText('');
        fetchClientes(1);
    }, [setSearchText, fetchClientes]);

    const statsData = useMemo(() => {
        const total = pagination?.total ?? clientes.length ?? 0;
        const active = clientes.filter(c => c.name && c.status === 'active').length;
        const inactive = clientes.filter(c => c.name && c.status === 'inactive').length;

        return { total, active, inactive };
    }, [pagination, clientes]);

    const renderHeader = useMemo(() => {
        return (
            <View style={[styles.header, isDark && { backgroundColor: '#1F2937' }]}>
                <View style={styles.headerTop}>
                    <BackButton color={isDark ? '#fff' : '#000'} />
                </View>

                <View style={styles.titleSection}>
                    <Text style={[styles.title, isDark && { color: '#fff' }]}>
                        Clientes
                    </Text>
                    <Text style={[styles.subtitle, isDark && { color: '#D1D5DB' }]}>
                        {searchText ? `Resultados para "${searchText}"` : 'Gestiona tus clientes'}
                    </Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <SearchBar
                        placeholder="Buscar clientes por nombre..."
                        value={searchText}
                        onSearch={handleSearch}
                        onClear={clearSearch}
                        loading={isSearching}
                        debounceMs={300}
                    />
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statsCard, styles.statsCardMain]}>
                        <Ionicons name="people" size={24} color="#3B82F6" />
                        <View style={styles.statsContent}>
                            <Text style={styles.statNumber}>{statsData.total}</Text>
                            <Text style={styles.statLabel}>
                                {searchText ? 'Encontrados' : 'Total clientes'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={[styles.statsCard, styles.statsCardSmall]}>
                            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
                            <View style={styles.statsContent}>
                                <Text style={[styles.statNumber, styles.statNumberSmall]}>{statsData.active}</Text>
                                <Text style={[styles.statLabel, styles.statLabelSmall]}>Activos</Text>
                            </View>
                        </View>

                        <View style={[styles.statsCard, styles.statsCardSmall]}>
                            <View style={[styles.statusIndicator, { backgroundColor: '#EF4444' }]} />
                            <View style={styles.statsContent}>
                                <Text style={[styles.statNumber, styles.statNumberSmall]}>{statsData.inactive}</Text>
                                <Text style={[styles.statLabel, styles.statLabelSmall]}>Inactivos</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        );
    }, [isDark, searchText, statsData, handleSearch, clearSearch, isSearching]);

    const renderEmpty = useCallback(() => {
        if (loading) return null;

        const isSearchEmpty = searchText && clientes.length === 0;

        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                    <Ionicons
                        name={isSearchEmpty ? "search" : "people-outline"}
                        size={64}
                        color="#D1D5DB"
                    />
                </View>

                <Text style={styles.emptyTitle}>
                    {isSearchEmpty ? 'Sin resultados' : 'No hay clientes'}
                </Text>

                <Text style={styles.emptySubtitle}>
                    {isSearchEmpty
                        ? `No encontramos clientes que coincidan con "${searchText}"`
                        : 'Comienza agregando el primer cliente de tu empresa'}
                </Text>

                {!searchText ? (
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={goToCreate}
                        accessibilityRole="button"
                    >
                        <Ionicons name="add" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.emptyButtonText}>Crear primer cliente</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.clearSearchButton}
                        onPress={clearSearch}
                        accessibilityRole="button"
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                        <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }, [loading, searchText, clientes.length, goToCreate, clearSearch]);

    const renderFooter = useCallback(() => {
        if (!pagination || clientes.length === 0) return null;
        return (
            <View style={styles.paginationWrapper}>
                <PaginationControls
                    paginationData={pagination}
                    onPageChange={(p) => changePage(p)}
                    loading={paginationLoading}
                    theme={isDark ? 'dark' : 'light'}
                    variant="modern"
                    showInfo
                    showFirstLast
                    maxVisiblePages={5}
                />
            </View>
        );
    }, [pagination, changePage, paginationLoading, clientes.length, isDark]);

    const renderClienteItem = useCallback(({ item }: { item: Cliente }) => (
        <ClienteCard
            cliente={item}
            onPress={goToDetail}
            onDelete={handleDelete}
        />
    ), [goToDetail, handleDelete]);

    // Loading state
    if (loading && !refreshing && clientes.length === 0) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                {renderHeader}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={[styles.loadingText, isDark && { color: '#D1D5DB' }]}>
                        {isSearching ? 'Buscando clientes...' : 'Cargando clientes...'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                {renderHeader}
                <View style={styles.errorContainer}>
                    <View style={styles.errorIcon}>
                        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    </View>
                    <Text style={[styles.errorTitle, isDark && { color: '#fff' }]}>
                        Oops! Algo salió mal
                    </Text>
                    <Text style={[styles.errorMessage, isDark && { color: '#D1D5DB' }]}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={() => fetchClientes(1)}
                        style={styles.retryButton}
                        accessibilityRole="button"
                        accessibilityLabel="Reintentar carga"
                    >
                        <Ionicons name="refresh" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Main render
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="dark-content" />
            <FlatList
                data={clientes}
                keyExtractor={(item: Cliente) => `cliente_${item.id}`}
                renderItem={renderClienteItem}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                contentContainerStyle={[
                    styles.listContent,
                    clientes.length === 0 && { flex: 1 }
                ]}
                onRefresh={onRefresh}
                refreshing={refreshing}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                windowSize={7}
                removeClippedSubviews
                accessibilityLabel="Lista de clientes"
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />

            {/* Floating Action Button */}
            <View style={styles.fabContainer} pointerEvents="box-none">
                <TouchableOpacity
                    style={[styles.fab, isDark && { backgroundColor: '#3B82F6' }]}
                    onPress={goToCreate}
                    accessibilityLabel="Crear cliente"
                    accessibilityRole="button"
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={28} color="#ffffff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    header: {
        paddingTop: 12,
        paddingBottom: 16,
        backgroundColor: 'transparent',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    headerCreateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        elevation: 2,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerCreateButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    titleSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4,
        lineHeight: 22,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    statsContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    statsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    statsCardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        marginBottom: 12,
        gap: 16,
    },
    statsContent: {
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statsCardSmall: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        lineHeight: 32,
    },
    statNumberSmall: {
        fontSize: 20,
        lineHeight: 24,
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 2,
    },
    statLabelSmall: {
        fontSize: 12,
        marginTop: 0,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    listContent: {
        paddingBottom: 140,
        paddingHorizontal: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#F3F4F6',
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        maxWidth: width * 0.8,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    emptyButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    clearSearchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    clearSearchText: {
        color: '#3B82F6',
        fontWeight: '700',
        fontSize: 16,
    },
    paginationWrapper: {
        paddingVertical: 20,
        paddingHorizontal: 4,
    },
    fabContainer: {
        position: 'absolute',
        right: 20,
        bottom: 32,
    },
    fab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    errorIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#FECACA',
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    retryButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
});