import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Platform, ActivityIndicator, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useRef } from 'react';
import { AppIcon } from '@/components/AppIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const exams = useQuery(api.exams.getExamsWithLiveCounts);
  const savedExamIds = useQuery(api.savedExams.getMySavedExamIds) ?? [];
  const toggleSaved = useMutation(api.savedExams.toggleSaved);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const isSaved = (examId: string) => savedExamIds.some((id) => id === examId);

  // Filter exams based on search, then put saved exams at top
  const filteredExams = exams?.filter(exam =>
    exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  const sortedExams = [...filteredExams].sort((a, b) =>
    (isSaved(a._id) ? 0 : 1) - (isSaved(b._id) ? 0 : 1)
  );

  // Generate gradient colors based on exam name (Spotify-style)
  const getGradientColors = (name: string): readonly [string, string] => {
    const gradients: readonly (readonly [string, string])[] = [
      ['#5B42F3', '#00DDEB'] as const, // Purple to Cyan
      ['#4776E6', '#8E54E9'] as const, // Blue to Purple
      ['#11998E', '#38EF7D'] as const, // Teal to Green
      ['#F2994A', '#F2C94C'] as const, // Orange to Yellow
      ['#EB3349', '#F45C43'] as const, // Red to Orange
      ['#A445B2', '#D41872'] as const, // Purple to Pink
      ['#FF0844', '#FFB199'] as const, // Pink to Peach
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  // Same as web: first letter for thumbnail (avoids iOS "Unimplement" / icon mismatch)
  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  if (!exams) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Exams</Text>
        <Text style={styles.subtitle}>{exams.length} Available Exams</Text>
      </View>

      {/* Exam List - saved first, same thumb as web (iOS: solid color fallback) */}
      <FlatList
        data={sortedExams}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.examItem}>
            <TouchableOpacity
              style={styles.examContent}
              activeOpacity={0.7}
              onPress={() => router.push(`/exam/${item.name.toLowerCase().replace(/\s+/g, '-')}`)}
            >
              {Platform.OS === 'android' ? (
                <LinearGradient
                  colors={getGradientColors(item.name) as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{getInitial(item.name)}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.avatar, { backgroundColor: getGradientColors(item.name)[0] }]}>
                  <Text style={styles.avatarText}>{getInitial(item.name)}</Text>
                </View>
              )}

              <View style={styles.examInfo}>
                <Text style={styles.examName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.examDescription} numberOfLines={1}>
                  {item.active_question_count || 0} question{item.active_question_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heartButton}
              onPress={() => toggleSaved({ examId: item._id })}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <AppIcon
                name={isSaved(item._id) ? 'heart' : 'heart-outline'}
                size={22}
                color={isSaved(item._id) ? '#FF375F' : '#8E8E93'}
              />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Search Bar - inline on all platforms */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
          <AppIcon name="search" size={20} color={isSearchFocused ? '#FFFFFF' : '#B3B3B3'} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search exams..."
            placeholderTextColor="#B3B3B3"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
            enablesReturnKeyAutomatically
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AppIcon name="close-circle" size={20} color="#B3B3B3" />
            </TouchableOpacity>
          )}
        </View>

        {isSearchFocused ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSearchQuery('');
              setIsSearchFocused(false);
              Keyboard.dismiss();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addButton}>
            <AppIcon name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  examItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    overflow: 'hidden',
  },
  examContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  examInfo: {
    flex: 1,
    minWidth: 0,
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  examDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  heartButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 8,
  },
  searchContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    backgroundColor: '#1A1A1A',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 12,
  },
  searchBarFocused: {
    backgroundColor: '#3A3A3C',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

