import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, TextInput, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AppIcon } from '@/components/AppIcon';
import { useState, useRef } from 'react';

type CategoryItem = {
    id: string;
    title: string;
    icon: React.ComponentProps<typeof AppIcon>['name'];
    iconBg: string;
    count?: number;
    route?: string;
};

export default function ExamDetailScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const router = useRouter();

    // Get all exams and find by name
    const exams = useQuery(api.exams.getExamsWithLiveCounts);
    const exam = exams?.find(e => e.name.toLowerCase().replace(/\s+/g, '-') === slug);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchInputRef = useRef<TextInput>(null);

    if (!exams) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (!exam) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Exam not found</Text>
            </View>
        );
    }

    const categories: CategoryItem[] = [
        {
            id: 'study',
            title: 'Study',
            icon: 'book',
            iconBg: '#007AFF',
            count: exam.active_question_count,
            route: `/exam/${slug}/questions`,
        },
        {
            id: 'flashcards',
            title: 'Flashcards',
            icon: 'layers',
            iconBg: '#34C759',
            count: 0,
            route: `/exam/${slug}/flashcards`,
        },
        {
            id: 'library',
            title: 'Library',
            icon: 'library',
            iconBg: '#FF9500',
            count: exam.hy_notes_count,
            route: `/exam/${slug}/library`,
        },
        {
            id: 'rapid',
            title: 'Rapid Review',
            icon: 'flash',
            iconBg: '#FFCC00',
            count: exam.hy_notes_count,
            route: `/exam/${slug}/rapid-review`,
        },
        {
            id: 'mock',
            title: 'Mock Exam',
            icon: 'document-text',
            iconBg: '#5856D6',
            count: 0,
            route: `/exam/${slug}/mock-exam`,
        },
        {
            id: 'analysis',
            title: 'Analysis',
            icon: 'bar-chart',
            iconBg: '#AF52DE',
            count: 0,
            route: `/exam/${slug}/analysis`,
        },
        {
            id: 'review',
            title: 'Review',
            icon: 'checkmark-circle',
            iconBg: '#FF3B30',
            count: 0,
            route: `/exam/${slug}/review`,
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <View style={styles.backButtonCircle}>
                        <AppIcon name="home" size={22} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <Text style={styles.title}>{exam.name}</Text>

                {/* Grid - 2 columns, icon + label left, count top-right (reference design) */}
                <View style={styles.grid}>
                    {categories.map((item) => (
                        <View key={item.id} style={styles.cardWrapper}>
                            <TouchableOpacity
                                style={styles.card}
                                activeOpacity={0.5}
                                onPress={() => {
                                    if (item.route) router.push(item.route as any);
                                }}
                            >
                                {/* Top row: icon left, count top-right */}
                                <View style={styles.cardTopRow}>
                                    <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                                        <AppIcon name={item.icon} size={20} color="#FFFFFF" />
                                    </View>
                                    {item.count !== undefined && (
                                        <Text style={styles.cardCount}>{item.count}</Text>
                                    )}
                                </View>
                                {/* Label below icon */}
                                <Text style={styles.cardTitle} numberOfLines={1}>
                                    {item.title}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Bottom Search Bar - inline on all platforms */}
            <View style={styles.bottomBar}>
                {!isSearchFocused && (
                    <TouchableOpacity style={styles.layersButton}>
                        <AppIcon name="layers-outline" size={22} color="#B3B3B3" />
                    </TouchableOpacity>
                )}

                <View style={[styles.searchContainer, isSearchFocused && styles.searchContainerFocused]}>
                    <AppIcon name="search" size={20} color={isSearchFocused ? '#FFFFFF' : '#B3B3B3'} style={styles.searchIcon} />
                    <TextInput
                        ref={searchInputRef}
                        style={[styles.searchInput, Platform.OS === 'web' && styles.searchInputWebFocus]}
                        placeholder="Search..."
                        placeholderTextColor="#B3B3B3"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <AppIcon name="close-circle" size={18} color="#B3B3B3" />
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
                        <AppIcon name="add" size={24} color="#B3B3B3" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 17,
        textAlign: 'center',
        marginTop: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    backButton: {
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    backButtonCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2C2C2E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSpacer: {
        width: 44,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    title: {
        fontSize: 34,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
        letterSpacing: 0.37,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    cardWrapper: {
        width: '50%',
        padding: 6,
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 13,
        padding: 16,
        minHeight: 100,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '400',
        color: '#FFFFFF',
        letterSpacing: -0.08,
    },
    cardCount: {
        fontSize: 17,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.72)',
        letterSpacing: 0.35,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 12,
        backgroundColor: '#1A1A1A',
        gap: 12,
    },
    layersButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#282828',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#282828',
        borderRadius: 24,
        paddingHorizontal: 16,
        height: 48,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        height: '100%',
    },
    searchInputWebFocus: {
        outlineStyle: 'none',
        outlineWidth: 0,
        outlineColor: 'transparent',
    },
    searchContainerFocused: {
        backgroundColor: '#3A3A3C',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    cancelButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
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
    },
});
