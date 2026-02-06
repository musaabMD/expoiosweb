import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Platform, ActivityIndicator, Modal, KeyboardAvoidingView } from 'react-native';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { AppIcon } from '@/components/AppIcon';
import { Link, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
    const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
    const exams = useQuery(api.exams.getExamsWithLiveCounts);
    const savedExamIds = useQuery(api.savedExams.getMySavedExamIds) ?? [];
    const currentUser = useQuery(api.users.getCurrentUser);
    const toggleSaved = useMutation(api.savedExams.toggleSaved);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const router = useRouter();
    const isSaved = (examId: string) => savedExamIds.some((id) => id === examId);

    // Filter exams based on search, then put saved exams at top
    const filteredExams = exams?.filter(exam =>
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sortedExams = [...(filteredExams ?? [])].sort((a, b) =>
        (isSaved(a._id) ? 0 : 1) - (isSaved(b._id) ? 0 : 1)
    );

    // Get first letter for avatar
    const getInitial = (name: string) => name.charAt(0).toUpperCase();

    // Get user initial for avatar
    const getUserInitial = () => {
        if (currentUser?.firstName) {
            return currentUser.firstName.charAt(0).toUpperCase();
        }
        if (currentUser?.email) {
            return currentUser.email.charAt(0).toUpperCase();
        }
        return '?';
    };

    // Spotify-style gradient per exam
    const getGradientColors = (name: string): readonly [string, string] => {
        const gradients: readonly (readonly [string, string])[] = [
            ['#5B42F3', '#00DDEB'] as const,
            ['#4776E6', '#8E54E9'] as const,
            ['#11998E', '#38EF7D'] as const,
            ['#F2994A', '#F2C94C'] as const,
            ['#EB3349', '#F45C43'] as const,
            ['#A445B2', '#D41872'] as const,
            ['#FF0844', '#FFB199'] as const,
        ];
        const index = name.charCodeAt(0) % gradients.length;
        return gradients[index];
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!isAuthenticated ? (
                /* Auth Screen */
                <View style={styles.authContainer}>
                    <Text style={styles.authTitle}>Welcome to TestPrep</Text>
                    <Text style={styles.authSubtitle}>Sign in to access your exams</Text>

                    <Link href="/(auth)/sign-in" asChild>
                        <TouchableOpacity style={styles.authButton}>
                            <Text style={styles.authButtonText}>Sign In</Text>
                        </TouchableOpacity>
                    </Link>

                    <Link href="/(auth)/sign-up" asChild>
                        <TouchableOpacity style={StyleSheet.flatten([styles.authButton, styles.authButtonSecondary])}>
                            <Text style={StyleSheet.flatten([styles.authButtonText, styles.authButtonTextSecondary])}>Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            ) : (
                /* Authenticated Content */
                <>
                    {!exams ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                        </View>
                    ) : (
                        <>
                            {/* Header */}
                            <View style={styles.header}>
                                <View>
                                    <Text style={styles.title}>Exams</Text>
                                    <Text style={styles.subtitle}>{exams.length} Available Exams</Text>
                                </View>

                                {/* User Avatar → Profile */}
                                <TouchableOpacity
                                    style={styles.userAvatar}
                                    onPress={() => router.push('/profile')}
                                >
                                    <Text style={styles.userAvatarText}>
                                        {getUserInitial()}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Exam List - saved first, then Spotify style */}
                            <FlatList
                                data={sortedExams}
                                keyExtractor={(item) => item._id}
                                contentContainerStyle={styles.listContainer}
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
                                                <Text style={styles.examSubtitle} numberOfLines={1}>
                                                    {item.active_question_count ?? 0} question{(item.active_question_count ?? 0) !== 1 ? 's' : ''}
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

                            {/* Bottom Search Bar - iOS Style */}
                            <View style={styles.bottomBar}>
                                <TouchableOpacity style={styles.layersButton}>
                                    <AppIcon name="layers-outline" size={22} color="#B3B3B3" />
                                </TouchableOpacity>

                                <View style={styles.searchBar}>
                                    {Platform.OS === 'web' ? (
                                        <>
                                            <AppIcon name="search" size={20} color="#B3B3B3" style={styles.searchIcon} />
                                            <TextInput
                                                style={styles.searchInput}
                                                placeholder="What do you want to play?"
                                                placeholderTextColor="#B3B3B3"
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                            />
                                            {searchQuery.length > 0 && (
                                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                                    <AppIcon name="close-circle" size={18} color="#B3B3B3" />
                                                </TouchableOpacity>
                                            )}
                                        </>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.searchBarTouchable}
                                            onPress={() => setSearchModalVisible(true)}
                                            activeOpacity={0.7}
                                        >
                                            <AppIcon name="search" size={20} color="#B3B3B3" style={styles.searchIcon} />
                                            <Text style={[styles.searchPlaceholderText, !searchQuery.length && styles.searchPlaceholderMuted]}>
                                                {searchQuery || 'What do you want to play?'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TouchableOpacity style={styles.addButton}>
                                    <AppIcon name="add" size={24} color="#B3B3B3" />
                                </TouchableOpacity>
                            </View>

                            {/* Mobile: search modal so input stays above keyboard */}
                            {Platform.OS !== 'web' && (
                                <Modal
                                    visible={searchModalVisible}
                                    animationType="slide"
                                    presentationStyle="pageSheet"
                                    onRequestClose={() => setSearchModalVisible(false)}
                                >
                                    <KeyboardAvoidingView style={styles.modalContainer} behavior="padding">
                                        <View style={styles.modalHeader}>
                                            <TouchableOpacity onPress={() => setSearchModalVisible(false)} style={styles.modalDoneButton}>
                                                <Text style={styles.modalDoneText}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.modalSearchRow}>
                                            <AppIcon name="search" size={22} color="#B3B3B3" style={styles.searchIcon} />
                                            <TextInput
                                                style={styles.searchInputModal}
                                                placeholder="What do you want to play?"
                                                placeholderTextColor="#B3B3B3"
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                                autoFocus
                                                returnKeyType="search"
                                            />
                                            {searchQuery.length > 0 && (
                                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                                    <AppIcon name="close-circle" size={20} color="#B3B3B3" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </KeyboardAvoidingView>
                                </Modal>
                            )}
                        </>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    authTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    authSubtitle: {
        fontSize: 17,
        color: '#8E8E93',
        marginBottom: 40,
    },
    authButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 16,
        width: '80%',
        maxWidth: 300,
    },
    authButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    authButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },
    authButtonTextSecondary: {
        color: '#007AFF',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userAvatarText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
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
        borderRadius: 12,
        overflow: 'hidden',
    },
    examContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    heartButton: {
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    examInfo: {
        flex: 1,
        justifyContent: 'center',
        minWidth: 0,
    },
    examName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    examSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
    },
    separator: {
        height: 12,
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
    },
    layersButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#282828',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
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
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        paddingVertical: 12,
    },
    searchBarTouchable: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchPlaceholderText: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
    },
    searchPlaceholderMuted: {
        color: '#B3B3B3',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 56 : 24,
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    modalDoneButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    modalDoneText: {
        fontSize: 17,
        color: '#007AFF',
        fontWeight: '600',
    },
    modalSearchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#282828',
        borderRadius: 24,
        marginHorizontal: 16,
        paddingHorizontal: 16,
        height: 52,
    },
    searchInputModal: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        paddingVertical: 12,
        marginLeft: 8,
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
