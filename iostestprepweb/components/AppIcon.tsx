import React from 'react';
import { Platform, Text, StyleSheet, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconProps = React.ComponentProps<typeof Ionicons>;
type IoniconName = IoniconProps['name'];

const WEB_FALLBACK_GLYPHS: Partial<Record<IoniconName, string>> = {
  search: '🔍',
  'close-circle': '✕',
  add: '+',
  heart: '♥',
  'heart-outline': '♡',
  home: '⌂',
  layers: '⧉',
  'layers-outline': '⧉',
  book: '📖',
  library: '📚',
  flash: '⚡',
  'document-text': '📄',
  'bar-chart': '📊',
  'checkmark-circle': '✅',
};

/**
 * Web-safe wrapper around Ionicons.
 *
 * On web we render a simple Text glyph fallback to avoid passing
 * React Native style arrays into DOM `style` props (which can crash React DOM).
 */
export function AppIcon({ name, size = 16, color, style, ...rest }: IoniconProps) {
  if (Platform.OS === 'web') {
    const glyph = WEB_FALLBACK_GLYPHS[name] ?? '•';
    const baseStyle: TextStyle = { fontSize: Number(size), color };

    // Use StyleSheet.flatten to properly handle style arrays/objects
    const flattenedStyle = StyleSheet.flatten([baseStyle, style]);

    return (
      <Text style={flattenedStyle}>
        {glyph}
      </Text>
    );
  }

  return <Ionicons name={name} size={size} color={color} style={style} {...rest} />;
}

