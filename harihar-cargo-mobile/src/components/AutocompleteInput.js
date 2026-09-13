import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

export default function AutocompleteInput({
  label,
  value = '',
  onChangeText,
  suggestions = [],
  placeholder,
  keyboardType,
  autoCapitalize,
  onSelectSuggestion,
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = value.trim()
    ? suggestions.filter(
        (item) => item.toLowerCase().includes(value.toLowerCase()) && item.toLowerCase() !== value.toLowerCase()
      )
    : suggestions;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />

      {showDropdown && filtered.length > 0 && (
        <View style={styles.dropdownList}>
          {filtered.slice(0, 4).map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionRow}
              activeOpacity={0.7}
              onPress={() => {
                onChangeText(item);
                if (onSelectSuggestion) onSelectSuggestion(item);
                setShowDropdown(false);
              }}
            >
              <Text style={styles.suggestionText}>📍 {item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', position: 'relative', zIndex: 1000 },
  label: { color: '#94a3b8', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  input: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dropdownList: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc2626',
    marginTop: 2,
    zIndex: 9999,
    elevation: 8,
  },
  suggestionRow: { paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  suggestionText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
});