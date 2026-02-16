
import AsyncStorage from '@react-native-async-storage/async-storage';

const GITHUB_TOKEN_KEY = '@indigo_habits_github_token';
const GITHUB_REPO_KEY = '@indigo_habits_github_repo';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

interface GitHubFile {
  path: string;
  content: string;
  message: string;
  sha?: string;
}

/**
 * Save GitHub configuration to local storage
 */
export async function saveGitHubConfig(config: GitHubConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(GITHUB_TOKEN_KEY, config.token);
    await AsyncStorage.setItem(GITHUB_REPO_KEY, JSON.stringify({ owner: config.owner, repo: config.repo }));
    console.log('GitHub configuration saved successfully');
  } catch (error) {
    console.error('Failed to save GitHub configuration:', error);
    throw error;
  }
}

/**
 * Load GitHub configuration from local storage
 */
export async function loadGitHubConfig(): Promise<GitHubConfig | null> {
  try {
    const token = await AsyncStorage.getItem(GITHUB_TOKEN_KEY);
    const repoData = await AsyncStorage.getItem(GITHUB_REPO_KEY);
    
    if (!token || !repoData) {
      return null;
    }
    
    const { owner, repo } = JSON.parse(repoData);
    return { token, owner, repo };
  } catch (error) {
    console.error('Failed to load GitHub configuration:', error);
    return null;
  }
}

/**
 * Clear GitHub configuration from local storage
 */
export async function clearGitHubConfig(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GITHUB_TOKEN_KEY);
    await AsyncStorage.removeItem(GITHUB_REPO_KEY);
    console.log('GitHub configuration cleared');
  } catch (error) {
    console.error('Failed to clear GitHub configuration:', error);
    throw error;
  }
}

/**
 * Get file content from GitHub repository
 */
export async function getGitHubFile(config: GitHubConfig, path: string): Promise<any> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
  
  console.log('Fetching file from GitHub:', path);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('GitHub API error:', response.status, errorText);
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Create or update a file in GitHub repository
 */
export async function pushToGitHub(config: GitHubConfig, file: GitHubFile): Promise<any> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${file.path}`;
  
  console.log('Pushing file to GitHub:', file.path);
  
  // Encode content to base64
  const base64Content = btoa(unescape(encodeURIComponent(file.content)));
  
  const body: any = {
    message: file.message,
    content: base64Content,
  };
  
  // If sha is provided, we're updating an existing file
  if (file.sha) {
    body.sha = file.sha;
  }
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('GitHub API error:', response.status, errorText);
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('File pushed successfully:', file.path);
  return result;
}

/**
 * Delete a file from GitHub repository
 */
export async function deleteFromGitHub(config: GitHubConfig, path: string, message: string, sha: string): Promise<any> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
  
  console.log('Deleting file from GitHub:', path);
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sha,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('GitHub API error:', response.status, errorText);
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('File deleted successfully:', path);
  return result;
}

/**
 * Get repository information
 */
export async function getRepositoryInfo(config: GitHubConfig): Promise<any> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}`;
  
  console.log('Fetching repository info');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('GitHub API error:', response.status, errorText);
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * List files in a directory
 */
export async function listGitHubFiles(config: GitHubConfig, path: string = ''): Promise<any[]> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`;
  
  console.log('Listing files from GitHub:', path || 'root');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('GitHub API error:', response.status, errorText);
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Create a new repository
 */
export async function createRepository(token: string, name: string, description: string, isPrivate: boolean = true): Promise<any> {
  const url = 'https://api.github.com/user/repos';
  
  console.log('Creating new repository:', name);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      private: isPrivate,
      auto_init: true,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('GitHub API error:', response.status, errorText);
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  console.log('Repository created successfully:', name);
  return result;
}

/**
 * Get authenticated user information
 */
export async function getAuthenticatedUser(token: string): Promise<any> {
  const url = 'https://api.github.com/user';
  
  console.log('Fetching authenticated user info');
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('GitHub API error:', response.status, errorText);
    throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Export journal entries to GitHub as markdown files
 */
export async function exportJournalsToGitHub(config: GitHubConfig, entries: any[]): Promise<void> {
  console.log('Exporting journal entries to GitHub:', entries.length);
  
  for (const entry of entries) {
    const dateStr = new Date(entry.date).toISOString().split('T')[0];
    const fileName = `journals/${dateStr}-${entry.id}.md`;
    
    let content = `# Journal Entry - ${dateStr}\n\n`;
    
    if (entry.affirmationText) {
      content += `## Affirmation\n${entry.affirmationText}\n\n`;
    }
    
    content += `## Entry\n${entry.content}\n\n`;
    
    if (entry.photoUri) {
      content += `## Photo\n![Journal Photo](${entry.photoUri})\n\n`;
    }
    
    content += `---\n*Created: ${new Date(entry.createdAt).toLocaleString()}*\n`;
    
    try {
      // Try to get existing file to update it
      let sha;
      try {
        const existingFile = await getGitHubFile(config, fileName);
        sha = existingFile.sha;
      } catch (error) {
        console.log('File does not exist, creating new file:', fileName);
      }
      
      await pushToGitHub(config, {
        path: fileName,
        content,
        message: `Update journal entry for ${dateStr}`,
        sha,
      });
    } catch (error) {
      console.error('Failed to export journal entry:', entry.id, error);
      throw error;
    }
  }
  
  console.log('All journal entries exported successfully');
}
