import React from 'react';
import { TouchableOpacity as RNTouchableOpacity, Platform, StyleSheet, type TouchableOpacityProps } from 'react-native';

/**
 * Web-safe wrapper around TouchableOpacity.
 * On web, flattens style arrays to avoid React DOM errors.
 */
export function TouchableOpacity({ style, ...props }: TouchableOpacityProps) {
    if (Platform.OS === 'web' && style) {
        // Flatten style arrays for web
        const flattenedStyle = StyleSheet.flatten(style);
        return <RNTouchableOpacity style={flattenedStyle} {...props} />;
    }

    return <RNTouchableOpacity style={style} {...props} />;
}
