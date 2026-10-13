import { BirthdayContent } from '../types/content.types';
import { birthdayContent } from '../data/content';
import { applyThemeConfig } from './themeApplier';

export const GITHUB_REPO_OWNER = 'Bedant1424';
export const GITHUB_REPO_NAME = 'Love';
export const TOKEN_STORAGE_KEY = 'birthday_admin_github_token';

/**
 * Fetch live content directly from GitHub Pages CDN
 * This ensures that ANY visitor (e.g. Arya on her phone) loads the latest content
 * without depending on localStorage!
 */
export const fetchLiveContent = async (): Promise<BirthdayContent> => {
  try {
    // Cache-busting fetch from GitHub Pages public root
    const url = `${import.meta.env.BASE_URL}content.json?_t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data: BirthdayContent = await response.json();
    if (data && data.recipient && data.greeting) {
      if (data.theme) {
        applyThemeConfig(data.theme);
      }
      return data;
    }
    throw new Error('Malformed content.json');
  } catch {
    // Graceful fallback to bundled content.ts
    if (birthdayContent.theme) {
      applyThemeConfig(birthdayContent.theme);
    }
    return JSON.parse(JSON.stringify(birthdayContent));
  }
};

/**
 * UTF-8 safe base64 encoder for browser
 */
const utf8ToBase64 = (str: string): string => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

/**
 * Directly publish content to GitHub Pages branch via GitHub REST API
 */
export const publishContentToGitHub = async (
  token: string,
  content: BirthdayContent
): Promise<{ success: boolean; message: string }> => {
  if (!token || !token.trim()) {
    throw new Error('GitHub Personal Access Token is required to publish directly.');
  }

  const cleanToken = token.trim();
  const jsonString = JSON.stringify(content, null, 2);
  const base64Content = utf8ToBase64(jsonString);

  const headers = {
    Authorization: `Bearer ${cleanToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Step 1: Check existing SHA on gh-pages branch
  let sha: string | undefined;
  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/content.json?ref=gh-pages`,
      { headers }
    );
    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }
  } catch {
    // If not found, sha remains undefined (creates new file)
  }

  // Step 2: Commit content.json directly to gh-pages branch
  const putRes = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/content.json`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: 'chore: update live website content from admin studio',
        content: base64Content,
        branch: 'gh-pages',
        sha,
      }),
    }
  );

  if (!putRes.ok) {
    const errJson = await putRes.json().catch(() => ({}));
    throw new Error(
      errJson.message || `GitHub API rejected commit with status ${putRes.status}`
    );
  }

  // Step 3: Trigger GitHub Pages CDN rebuild/flush
  try {
    await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/pages/builds`,
      {
        method: 'POST',
        headers,
      }
    );
  } catch {
    // Non-critical if build queueing has rate limit
  }

  return {
    success: true,
    message: 'Changes published directly to the live website on GitHub Pages! 🎉',
  };
};
