import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { Destination } from '../../types';
import { apiService } from '../../services/ApiService';

interface DestinationSearchBarProps {
  onSelectDestination: (dest: Destination) => void;
  onClear?: () => void;
}

export const DestinationSearchBar: React.FC<DestinationSearchBarProps> = ({
  onSelectDestination,
  onClear,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length > 1) {
      setIsLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await apiService.searchDestination(text.trim());
          const mapped: Destination[] = (results || []).map((r: any) => ({
            name: r.name,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
          }));
          setSuggestions(mapped);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const handleSelect = (dest: Destination) => {
    setQuery(dest.name);
    setSuggestions([]);
    setIsFocused(false);
    onSelectDestination(dest);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsLoading(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (onClear) onClear();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Where do you want to park? (e.g. Mid Valley)"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          onFocus={() => setIsFocused(true)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isFocused && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.suggestionIcon}>📍</Text>
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionTitle}>{item.name}</Text>
                  <Text style={styles.suggestionSubtitle}>
                    {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    width: '100%',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceWhite,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  clearBtn: {
    padding: 6,
  },
  clearText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
  dropdown: {
    backgroundColor: Colors.surfaceWhite,
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  suggestionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
