// src/screens/Administrador/Tecnico/TecnicoList.tsx
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
import TecnicoCard from '../../../components/Tecnico/TecnicoCard';
import { useTecnicos } from '../../../hooks/tecnico/useTecnicos';
import { Tecnico } from '../../../types/tecnico/tecnico';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useError } from '../../../context/ErrorContext';


const { width } = Dimensions.get('window');

type RootStackParamList = {
    TecnicoList: undefined;
    DetalleTecnico: { id: number };
    CrearTecnico: undefined;
};

export default function TecnicoListScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const {
        tecnicos,
        pagination,
        loading,
        paginationLoading,
        refreshing,
        error,
        searchText,
        setSearchText,
        isSearching,
        page,
        fetchTecnicos,
        onRefresh,
        changePage,
        removeTecnico,
    } = useTecnicos();
    const { showError } = useError();

   

    const goToCreate = useCallback(() => navigation.navigate('CrearTecnico'), [navigation]);
    const goToDetail = useCallback((id: number) => navigation.navigate('DetalleTecnico', { id }), [navigation]);

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
                                const ok = await removeTecnico(id);
                                if (ok) {
                                    Alert.alert('Éxito', 'Técnico eliminado correctamente.');
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
        [removeTecnico]
    );

    const statsData = useMemo(() => {
        const total = pagination?.total ?? tecnicos.length ?? 0;
        const active = tecnicos.filter(t => (t.user?.name || t.name) && t.status === 'active').length;
        const inactive = tecnicos.filter(t => (t.user?.name || t.name) && t.status === 'inactive').length;

        return { total, active, inactive };
    }, [pagination, tecnicos]);

    const renderHeader = useMemo(() => {
        return (
            <View style={[styles.header, isDark && { backgroundColor: '#1F2937' }]}>
                <View style={styles.headerTop}>
                    <BackButton color={isDark ? '#fff' : '#000'} />
                </View>

                <View style={styles.titleSection}>
                    <Text style={[styles.title, isDark && { color: '#fff' }]}>
                        Técnicos
                    </Text>
                    <Text style={[styles.subtitle, isDark && { color: '#D1D5DB' }]}>
                        {searchText ? `Resultados para "${searchText}"` : 'Gestiona tus tecnicos'}
                    </Text>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statsCard, styles.statsCardMain]}>
                        <Ionicons name="people" size={24} color="#3B82F6" />
                        <View style={styles.statsContent}>
                            <Text style={styles.statNumber}>{statsData.total}</Text>
                            <Text style={styles.statLabel}>
                                {searchText ? 'Encontrados' : 'Total técnicos'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }, [isDark, searchText, statsData, setSearchText, isSearching, fetchTecnicos, goToCreate]);

    const renderEmpty = useCallback(() => {
        if (loading) return null;

        const isSearchEmpty = searchText && tecnicos.length === 0;

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
                    {isSearchEmpty ? 'Sin resultados' : 'No hay técnicos'}
                </Text>

                <Text style={styles.emptySubtitle}>
                    {isSearchEmpty
                        ? `No encontramos técnicos que coincidan con "${searchText}"`
                        : 'Comienza agregando el primer técnico de tu equipo'}
                </Text>

                {!searchText ? (
                    <TouchableOpacity
                        style={styles.emptyButton}
                        onPress={goToCreate}
                        accessibilityRole="button"
                    >
                        <Ionicons name="add" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.emptyButtonText}>Crear primer técnico</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.clearSearchButton}
                        onPress={() => setSearchText('')}
                        accessibilityRole="button"
                    >
                        <Ionicons name="close-circle-outline" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                        <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }, [loading, searchText, tecnicos.length, goToCreate, setSearchText]);

    const renderFooter = useCallback(() => {
        if (!pagination) return null;
        return (
            <View style={styles.paginationWrapper}>
                <PaginationControls
                    paginationData={pagination}
                    onPageChange={(p) => changePage(p)}
                    loading={paginationLoading}
                    theme="light"
                    variant="modern"
                    showInfo
                    showFirstLast
                    maxVisiblePages={5}
                />
            </View>
        );
    }, [pagination, changePage, paginationLoading]);

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                {renderHeader}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={[styles.loadingText, isDark && { color: '#D1D5DB' }]}>
                        {isSearching ? 'Buscando técnicos...' : 'Cargando técnicos...'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                {renderHeader}
                <View style={styles.errorContainer}>
                    <View style={styles.errorIcon}>
                        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    </View>
                    <Text style={styles.errorTitle}>Oops! Algo salió mal</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchTecnicos(1)} style={styles.retryButton}>
                        <Ionicons name="refresh" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F8FAFC' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <FlatList
                data={tecnicos}
                keyExtractor={(item: Tecnico) => `tecnico_${item.id}`}
                renderItem={({ item }) => (
                    <TecnicoCard item={item} onPress={goToDetail} onDelete={handleDelete} />
                )}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.listContent}
                onRefresh={onRefresh}
                refreshing={refreshing}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                windowSize={7}
                removeClippedSubviews
                accessibilityLabel="Lista de técnicos"
                showsVerticalScrollIndicator={false}
            />

            {/* Enhanced FAB */}
            <View style={styles.fabContainer} pointerEvents="box-none">
                <TouchableOpacity
                    style={styles.fab}
                    onPress={goToCreate}
                    accessibilityLabel="Crear técnico"
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