import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    useColorScheme,
    ActivityIndicator,
    Animated,
    Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
    placeholder?: string;
    value: string;
    onSearch: (text: string) => void;
    onClear?: () => void;
    loading?: boolean;
    autoFocus?: boolean;
    debounceMs?: number;
    disabled?: boolean;
    style?: any;
}

const SearchBar: React.FC<SearchBarProps> = ({
                                                 placeholder = 'Buscar...',
                                                 value,
                                                 onSearch,
                                                 onClear,
                                                 loading = false,
                                                 autoFocus = false,
                                                 debounceMs = 500,
                                                 disabled = false,
                                                 style,
                                             }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [localValue, setLocalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    const focusAnim = React.useRef(new Animated.Value(0)).current;

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Animate focus state
    useEffect(() => {
        Animated.timing(focusAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, focusAnim]);

    // Debounced search
    const handleTextChange = useCallback((text: string) => {
        setLocalValue(text);

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        const timer = setTimeout(() => {
            onSearch(text);
        }, debounceMs);

        setDebounceTimer(timer);
    }, [onSearch, debounceMs, debounceTimer]);

    const handleClear = useCallback(() => {
        setLocalValue('');
        onSearch('');
        if (onClear) {
            onClear();
        }
        Keyboard.dismiss();
    }, [onSearch, onClear]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
    }, []);

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
        };
    }, [debounceTimer]);

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [isDark ? '#374151' : '#E5E7EB', '#3B82F6'],
    });

    const backgroundColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [
            isDark ? '#1F2937' : '#F9FAFB',
            isDark ? '#1F2937' : '#FFFFFF'
        ],
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    borderColor,
                    backgroundColor,
                },
                disabled && styles.disabled,
                style,
            ]}
        >
            <Ionicons
                name="search"
                size={20}
                color={isFocused ? '#3B82F6' : (isDark ? '#9CA3AF' : '#6B7280')}
                style={styles.searchIcon}
            />

            <TextInput
                style={[
                    styles.input,
                    { color: isDark ? '#F9FAFB' : '#1F2937' },
                ]}
                placeholder={placeholder}
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={localValue}
                onChangeText={handleTextChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoFocus={autoFocus}
                editable={!disabled}
                selectTextOnFocus
                returnKeyType="search"
                blurOnSubmit
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="never" // We'll handle this manually
            />

            {/* Loading indicator or clear button */}
            <View style={styles.rightContainer}>
                {loading ? (
                    <ActivityIndicator
                        size="small"
                        color="#3B82F6"
                        style={styles.loader}
                    />
                ) : localValue.length > 0 ? (
                    <TouchableOpacity
                        onPress={handleClear}
                        style={styles.clearButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel="Limpiar búsqueda"
                    >
                        <Ionicons
                            name="close-circle"
                            size={20}
                            color={isDark ? '#6B7280' : '#9CA3AF'}
                        />
                    </TouchableOpacity>
                ) : null}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 52,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    disabled: {
        opacity: 0.6,
    },
    searchIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    rightContainer: {
        marginLeft: 8,
        minWidth: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loader: {
        width: 20,
        height: 20,
    },
    clearButton: {
        padding: 2,
        borderRadius: 12,
    },
});

export default SearchBar;