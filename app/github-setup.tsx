
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import {
  saveGitHubConfig,
  loadGitHubConfig,
  clearGitHubConfig,
  getAuthenticatedUser,
  getRepositoryInfo,
  createRepository,
} from '@/utils/github';

export default function GitHubSetupScreen() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    loadExistingConfig();
  }, []);

  const loadExistingConfig = async () => {
    try {
      const config = await loadGitHubConfig();
      if (config) {
        setToken(config.token);
        setOwner(config.owner);
        setRepo(config.repo);
        setIsConfigured(true);
        
        const user = await getAuthenticatedUser(config.token);
        setUserInfo(user);
      }
    } catch (error) {
      console.error('Failed to load GitHub config:', error);
    }
  };

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      showAlert('Error', 'Please enter a GitHub token');
      return;
    }

    setLoading(true);
    try {
      const user = await getAuthenticatedUser(token);
      setUserInfo(user);
      setOwner(user.login);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Success', `Connected as ${user.login}`);
    } catch (error) {
      console.error('Token verification failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Error', 'Invalid GitHub token. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepository = async () => {
    if (!token.trim()) {
      showAlert('Error', 'Please verify your GitHub token first');
      return;
    }

    const repoName = 'indigo-habits-backup';
    setLoading(true);
    try {
      const newRepo = await createRepository(
        token,
        repoName,
        'Backup of Indigo Habits journal entries and data',
        true
      );
      
      setRepo(newRepo.name);
      setOwner(newRepo.owner.login);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Success', `Repository "${repoName}" created successfully!`);
    } catch (error) {
      console.error('Repository creation failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Error', 'Failed to create repository. It may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRepository = async () => {
    if (!token.trim() || !owner.trim() || !repo.trim()) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const repoInfo = await getRepositoryInfo({ token, owner, repo });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Success', `Repository verified: ${repoInfo.full_name}`);
    } catch (error) {
      console.error('Repository verification failed:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Error', 'Repository not found. Please check owner and repo name.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!token.trim() || !owner.trim() || !repo.trim()) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await saveGitHubConfig({ token, owner, repo });
      setIsConfigured(true);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Success', 'GitHub configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save config:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Error', 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleClearConfig = async () => {
    try {
      await clearGitHubConfig();
      setToken('');
      setOwner('');
      setRepo('');
      setIsConfigured(false);
      setUserInfo(null);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Success', 'GitHub configuration cleared');
    } catch (error) {
      console.error('Failed to clear config:', error);
      showAlert('Error', 'Failed to clear configuration');
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const statusColor = isConfigured ? '#10B981' : '#6B7280';
  const statusText = isConfigured ? 'Connected' : 'Not Connected';

  return (
    <>
      <Stack.Screen
        options={{
          title: 'GitHub Setup',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.container}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <IconSymbol
                ios_icon_name="link"
                android_material_icon_name="link"
                size={24}
                color={statusColor}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
            
            {userInfo && (
              <View style={styles.userInfo}>
                <Text style={styles.userInfoText}>
                  Connected as: {userInfo.login}
                </Text>
                {userInfo.name && (
                  <Text style={styles.userInfoText}>
                    Name: {userInfo.name}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Instructions Button */}
          <TouchableOpacity
            style={styles.instructionsButton}
            onPress={() => setShowInstructions(true)}
          >
            <IconSymbol
              ios_icon_name="info.circle"
              android_material_icon_name="info"
              size={20}
              color="#4F46E5"
            />
            <Text style={styles.instructionsButtonText}>
              How to get a GitHub token
            </Text>
          </TouchableOpacity>

          {/* Token Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>GitHub Personal Access Token</Text>
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={setToken}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyToken}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify Token</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Repository Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Repository Owner</Text>
            <TextInput
              style={styles.input}
              value={owner}
              onChangeText={setOwner}
              placeholder="your-username"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Repository Name</Text>
            <TextInput
              style={styles.input}
              value={repo}
              onChangeText={setRepo}
              placeholder="indigo-habits-backup"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateRepository}
            disabled={loading || !token}
          >
            <IconSymbol
              ios_icon_name="plus.circle"
              android_material_icon_name="add-circle"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.createButtonText}>Create New Repository</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.verifyRepoButton}
            onPress={handleVerifyRepository}
            disabled={loading}
          >
            <Text style={styles.verifyRepoButtonText}>Verify Repository</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveConfig}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>Save Configuration</Text>
          </TouchableOpacity>

          {isConfigured && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearConfig}
            >
              <Text style={styles.clearButtonText}>Clear Configuration</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Instructions Modal */}
      <Modal
        visible={showInstructions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How to Get a GitHub Token</Text>
              <TouchableOpacity onPress={() => setShowInstructions(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color="#1F2937"
                />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.instructionStep}>1. Go to GitHub.com and sign in</Text>
              <Text style={styles.instructionStep}>
                2. Click your profile picture → Settings
              </Text>
              <Text style={styles.instructionStep}>
                3. Scroll down and click "Developer settings"
              </Text>
              <Text style={styles.instructionStep}>
                4. Click "Personal access tokens" → "Tokens (classic)"
              </Text>
              <Text style={styles.instructionStep}>
                5. Click "Generate new token" → "Generate new token (classic)"
              </Text>
              <Text style={styles.instructionStep}>
                6. Give it a name like "Indigo Habits"
              </Text>
              <Text style={styles.instructionStep}>
                7. Select scopes: "repo" (full control of private repositories)
              </Text>
              <Text style={styles.instructionStep}>
                8. Click "Generate token" at the bottom
              </Text>
              <Text style={styles.instructionStep}>
                9. Copy the token (starts with "ghp_") and paste it above
              </Text>
              
              <Text style={styles.warningText}>
                ⚠️ Important: Save your token somewhere safe! GitHub only shows it once.
              </Text>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.modalCloseButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  userInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  instructionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  instructionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  verifyButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifyRepoButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyRepoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalScroll: {
    maxHeight: 400,
  },
  instructionStep: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  warningText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    lineHeight: 20,
  },
  modalCloseButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
