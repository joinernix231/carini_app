// src/components/Tecnico/TecnicoSearchBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Animated,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
    value: string;
    onChangeText: (t: string) => void;
    onSubmit: () => void;
    onClear: () => void;
    isSearching?: boolean;
    placeholder?: string;
};

export default function TecnicoSearchBar({
                                             value,
                                             onChangeText,
                                             onSubmit,
                                             onClear,
                                             isSearching = false,
                                             placeholder = "Buscar por nombre, email o teléfono..."
                                         }: Props) {
    const [isFocused, setIsFocused] = useState(false);
    const animatedBorder = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        Animated.timing(animatedBorder, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, animatedBorder]);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const handleClear = () => {
        onClear();
        inputRef.current?.focus();
    };

    const handleSubmit = () => {
        Keyboard.dismiss();
        onSubmit();
    };

    const borderColor = animatedBorder.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E5E7EB', '#3B82F6'],
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.searchContainer,
                    {
                        borderColor,
                    },
                ]}
            >
                <View style={styles.inputWrapper}>
                    {/* Search Icon */}
                    <View style={styles.searchIconContainer}>
                        <Ionicons
                            name="search"
                            size={20}
                            color={isFocused ? '#3B82F6' : '#9CA3AF'}
                        />
                    </View>

                    {/* Text Input */}
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder={placeholder}
                        placeholderTextColor="#9CA3AF"
                        value={value}
                        onChangeText={onChangeText}
                        returnKeyType="search"
                        onSubmitEditing={handleSubmit}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        autoCapitalize="none"
                        autoCorrect={false}
                        accessibilityLabel="Buscar técnicos"
                        accessibilityHint="Escribe para buscar técnicos por nombre, email o teléfono"
                    />

                    {/* Right Actions */}
                    <View style={styles.actionsContainer}>
                        {isSearching ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator
                                    size="small"
                                    color="#3B82F6"
                                />
                            </View>
                        ) : value.length > 0 ? (
                            <TouchableOpacity
                                onPress={handleClear}
                                style={styles.clearButton}
                                accessibilityLabel="Limpiar búsqueda"
                                accessibilityRole="button"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>
                        ) : null}

                        {/* Search Button - visible when there's text */}
                        {value.length > 0 && !isSearching && (
                            <TouchableOpacity
                                onPress={handleSubmit}
                                style={styles.searchButton}
                                accessibilityLabel="Ejecutar búsqueda"
                                accessibilityRole="button"
                            >
                                <Ionicons
                                    name="arrow-forward"
                                    size={16}
                                    color="#ffffff"
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    searchIconContainer: {
        marginRight: 12,
        padding: 4,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
        lineHeight: 20,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingContainer: {
        padding: 4,
    },
    clearButton: {
        padding: 4,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
    },
    searchButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});