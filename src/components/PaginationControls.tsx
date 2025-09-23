import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

// Interfaz para los datos de paginación
export interface PaginationData {
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

// Props del componente
interface PaginationControlsProps {
    paginationData: PaginationData;
    onPageChange: (page: number) => void;
    loading?: boolean;
    theme?: 'light' | 'dark';
    variant?: 'default' | 'minimal' | 'modern';
    showInfo?: boolean;
    showFirstLast?: boolean;
    maxVisiblePages?: number;
    disabled?: boolean;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
                                                                   paginationData,
                                                                   onPageChange,
                                                                   loading = false,
                                                                   theme = 'light',
                                                                   variant = 'modern',
                                                                   showInfo = true,
                                                                   showFirstLast = true,
                                                                   maxVisiblePages = 5,
                                                                   disabled = false,
                                                               }) => {
    // Validar que tenemos datos de paginación válidos
    if (!paginationData || !paginationData.current_page || !paginationData.last_page) {
        return null;
    }

    const {
        current_page,
        last_page,
        from,
        to,
        total,
        next_page_url,
        prev_page_url,
    } = paginationData;

    // No mostrar si solo hay una página
    if (last_page <= 1) return null;

    const canGoPrev = current_page > 1 && !disabled && !loading;
    const canGoNext = current_page < last_page && !disabled && !loading;

    // Generar páginas visibles
    const getVisiblePages = (): (number | string)[] => {
        const pages: (number | string)[] = [];
        const halfVisible = Math.floor(maxVisiblePages / 2);

        let startPage = Math.max(1, current_page - halfVisible);
        let endPage = Math.min(last_page, current_page + halfVisible);

        // Ajustar si estamos cerca del inicio o final
        if (current_page <= halfVisible) {
            endPage = Math.min(last_page, maxVisiblePages);
        }
        if (current_page >= last_page - halfVisible) {
            startPage = Math.max(1, last_page - maxVisiblePages + 1);
        }

        // Agregar primera página y puntos suspensivos si es necesario
        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) pages.push('...');
        }

        // Agregar páginas visibles
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        // Agregar puntos suspensivos y última página si es necesario
        if (endPage < last_page) {
            if (endPage < last_page - 1) pages.push('...');
            pages.push(last_page);
        }

        return pages;
    };

    const handlePagePress = (page: number) => {
        if (!disabled && !loading && page !== current_page) {
            onPageChange(page);
        }
    };

    // Estilos dinámicos basados en tema
    const themeStyles = theme === 'dark' ? darkThemes : lightThemes;
    const variantStyles = variant === 'minimal' ? minimalStyles :
        variant === 'modern' ? modernStyles : defaultStyles;

    const renderPageButton = (page: number | string, index: number) => {
        const isEllipsis = page === '...';
        const isCurrentPage = page === current_page;
        const isDisabled = disabled || loading || isEllipsis;

        if (isEllipsis) {
            return (
                <View key={`ellipsis-${index}`} style={[styles.pageButton, styles.ellipsisButton]}>
                    <Text style={[styles.pageButtonText, themeStyles.ellipsisText]}>...</Text>
                </View>
            );
        }

        return (
            <TouchableOpacity
                key={`page-${page}`}
                style={[
                    styles.pageButton,
                    variantStyles.pageButton,
                    isCurrentPage ? [variantStyles.activePageButton, themeStyles.activePageButton] : themeStyles.pageButton,
                    isDisabled && styles.disabledButton,
                ]}
                onPress={() => handlePagePress(page as number)}
                disabled={isDisabled}
                activeOpacity={0.7}
            >
                <Text
                    style={[
                        styles.pageButtonText,
                        variantStyles.pageButtonText,
                        isCurrentPage ? [variantStyles.activePageButtonText, themeStyles.activePageButtonText] : themeStyles.pageButtonText,
                    ]}
                >
                    {page}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderNavigationButton = (
        direction: 'first' | 'prev' | 'next' | 'last',
        onPress: () => void,
        canNavigate: boolean,
        icon: string
    ) => {
        const isDisabled = !canNavigate || disabled || loading;

        return (
            <TouchableOpacity
                style={[
                    styles.navButton,
                    variantStyles.navButton,
                    themeStyles.navButton,
                    isDisabled && [styles.disabledButton, themeStyles.disabledButton],
                ]}
                onPress={onPress}
                disabled={isDisabled}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={icon as any}
                    size={16}
                    color={isDisabled ? themeStyles.disabledText.color : themeStyles.navButtonText.color}
                />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, themeStyles.container]}>
            {/* Información de paginación */}
            {showInfo && (
                <View style={styles.infoContainer}>
                    <View style={[styles.infoCard, variantStyles.infoCard, themeStyles.infoCard]}>
                        <View style={styles.infoRow}>
                            <Ionicons name="document-text-outline" size={16} color={themeStyles.infoText.color} />
                            <Text style={[styles.infoText, themeStyles.infoText]}>
                                Mostrando {from.toLocaleString()}-{to.toLocaleString()} de {total.toLocaleString()} resultados
                            </Text>
                        </View>
                        <View style={styles.pageIndicator}>
                            <Text style={[styles.pageIndicatorText, themeStyles.pageIndicatorText]}>
                                Página {current_page} de {last_page}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Controles de navegación */}
            <View style={[styles.controlsContainer, variantStyles.controlsContainer]}>
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={[styles.loadingText, themeStyles.loadingText]}>Cargando...</Text>
                    </View>
                )}

                <View style={styles.navigationContainer}>
                    {/* Botones de navegación rápida */}
                    {showFirstLast && (
                        <>
                            {renderNavigationButton('first', () => handlePagePress(1), canGoPrev, 'play-back')}
                            {renderNavigationButton('prev', () => handlePagePress(current_page - 1), canGoPrev, 'chevron-back')}
                        </>
                    )}

                    {/* Páginas */}
                    <View style={styles.pagesContainer}>
                        {getVisiblePages().map((page, index) => renderPageButton(page, index))}
                    </View>

                    {/* Botones de navegación rápida */}
                    {showFirstLast && (
                        <>
                            {renderNavigationButton('next', () => handlePagePress(current_page + 1), canGoNext, 'chevron-forward')}
                            {renderNavigationButton('last', () => handlePagePress(last_page), canGoNext, 'play-forward')}
                        </>
                    )}
                </View>

                {/* Indicador de progreso */}
                <View style={[styles.progressContainer, themeStyles.progressContainer]}>
                    <View
                        style={[
                            styles.progressBar,
                            variantStyles.progressBar,
                            themeStyles.progressBar,
                            { width: `${(current_page / last_page) * 100}%` }
                        ]}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    infoContainer: {
        marginBottom: 16,
    },
    infoCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    pageIndicator: {
        alignItems: 'center',
    },
    pageIndicatorText: {
        fontSize: 12,
        fontWeight: '600',
    },
    controlsContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        flexDirection: 'row',
        borderRadius: 16,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    navigationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    pagesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
    },
    pageButton: {
        minWidth: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 2,
        borderRadius: 8,
    },
    ellipsisButton: {
        backgroundColor: 'transparent',
    },
    pageButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    navButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 4,
    },
    disabledButton: {
        opacity: 0.4,
    },
    progressContainer: {
        height: 4,
        borderRadius: 2,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
});

// Estilos para tema claro
const lightThemes = StyleSheet.create({
    container: {
        backgroundColor: '#F8F9FA',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoText: {
        color: '#374151',
    },
    pageIndicatorText: {
        color: '#6B7280',
    },
    pageButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    activePageButton: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    pageButtonText: {
        color: '#374151',
    },
    activePageButtonText: {
        color: '#FFFFFF',
    },
    ellipsisText: {
        color: '#9CA3AF',
    },
    navButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    navButtonText: {
        color: '#374151',
    },
    disabledButton: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    disabledText: {
        color: '#9CA3AF',
    },
    loadingText: {
        color: '#6B7280',
    },
    progressContainer: {
        backgroundColor: '#E5E7EB',
    },
    progressBar: {
        backgroundColor: '#007AFF',
    },
});

// Estilos para tema oscuro
const darkThemes = StyleSheet.create({
    container: {
        backgroundColor: '#111827',
    },
    infoCard: {
        backgroundColor: '#1F2937',
        borderColor: '#374151',
    },
    infoText: {
        color: '#E5E7EB',
    },
    pageIndicatorText: {
        color: '#9CA3AF',
    },
    pageButton: {
        backgroundColor: '#1F2937',
        borderWidth: 1,
        borderColor: '#374151',
    },
    activePageButton: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    pageButtonText: {
        color: '#E5E7EB',
    },
    activePageButtonText: {
        color: '#FFFFFF',
    },
    ellipsisText: {
        color: '#6B7280',
    },
    navButton: {
        backgroundColor: '#1F2937',
        borderWidth: 1,
        borderColor: '#374151',
    },
    navButtonText: {
        color: '#E5E7EB',
    },
    disabledButton: {
        backgroundColor: '#111827',
        borderColor: '#374151',
    },
    disabledText: {
        color: '#6B7280',
    },
    loadingText: {
        color: '#9CA3AF',
    },
    progressContainer: {
        backgroundColor: '#374151',
    },
    progressBar: {
        backgroundColor: '#007AFF',
    },
});

// Variantes de estilo
const defaultStyles = StyleSheet.create({
    pageButton: {},
    activePageButton: {},
    pageButtonText: {},
    activePageButtonText: {},
    navButton: {},
    infoCard: {},
    controlsContainer: {
        backgroundColor: 'transparent',
    },
    progressBar: {},
});

const minimalStyles = StyleSheet.create({
    pageButton: {
        borderRadius: 4,
        minWidth: 32,
        height: 32,
    },
    activePageButton: {},
    pageButtonText: {
        fontSize: 13,
    },
    activePageButtonText: {},
    navButton: {
        width: 32,
        height: 32,
        borderRadius: 4,
    },
    infoCard: {
        padding: 12,
        borderRadius: 8,
    },
    controlsContainer: {
        backgroundColor: 'transparent',
    },
    progressBar: {},
});

const modernStyles = StyleSheet.create({
    pageButton: {
        borderRadius: 12,
        minWidth: 44,
        height: 44,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    activePageButton: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    pageButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    activePageButtonText: {
        fontWeight: '800',
    },
    navButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoCard: {
        borderRadius: 16,
    },
    controlsContainer: {
        backgroundColor: 'transparent',
    },
    progressBar: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
});

export default PaginationControls;