import { supabase } from './supabase';

export const PROGRESS_CHANGED_EVENT = 'vnme-progress-changed';

const CLOUD_SYNC_PROVIDER = (import.meta.env.VITE_CLOUD_SYNC_PROVIDER || 'supabase').toLowerCase();
const CLOUD_SYNC_DUAL_WRITE = import.meta.env.VITE_CLOUD_SYNC_DUAL_WRITE === 'true';
const API_SYNC_PRIMARY = CLOUD_SYNC_PROVIDER === 'api';

const SYNC_KEYS = [
  'vietnamy_dong',
  'vietnamy_progress',
  'vnme_hearts',
  'vnme_streak',
  'vnme_user_profile',
  'vnme_srs',
  'vnme_word_grades',
  'vnme_saved_words',
  'vnme_custom_decks',
  'vnme_dict_saved_words',
  'vnme_dict_decks',
  'vnme_onboarding_completed',
  'vnme_tutorial_completed',
  'vnme_app_language',
  'vnme_settings',
];

let debounceTimer = null;

export function notifyProgressChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PROGRESS_CHANGED_EVENT));
}

function safeParse(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readLocalProfile() {
  return safeParse(localStorage.getItem('vnme_user_profile'), {});
}

function normalizeSavedList(key) {
  const value = safeParse(localStorage.getItem(key), []);
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(item => String(item).trim()).filter(Boolean))];
}

function collectSavedWordRows(userId) {
  const lessonWords = normalizeSavedList('vnme_saved_words').map(wordId => ({
    user_id: userId,
    word_id: wordId,
    source: 'lesson',
    metadata: {},
  }));
  const dictionaryWords = normalizeSavedList('vnme_dict_saved_words').map(wordId => ({
    user_id: userId,
    word_id: wordId,
    source: 'dictionary',
    metadata: {},
  }));
  return [...lessonWords, ...dictionaryWords];
}

function collectLocalData() {
  const data = {};
  for (const key of SYNC_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) data[key] = val;
  }
  return data;
}

async function getCloudAccessToken() {
  if (!supabase) return '';
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || '';
}

async function cloudApi(path, options = {}) {
  const token = await getCloudAccessToken();
  if (!token) throw new Error('Cloud sync requires an authenticated session.');
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Cloud sync API failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  return response.json();
}

async function bestEffortCloudApi(path, options) {
  try {
    return await cloudApi(path, options);
  } catch (err) {
    console.warn('Neon dual-write sync failed:', err?.message || err);
    return null;
  }
}

function applySavedWordRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return false;
  const lessonWords = rows.filter(row => row.source === 'lesson').map(row => row.word_id || row.wordId).filter(Boolean);
  const dictionaryWords = rows.filter(row => row.source === 'dictionary').map(row => row.word_id || row.wordId).filter(Boolean);
  if (lessonWords.length > 0) localStorage.setItem('vnme_saved_words', JSON.stringify([...new Set(lessonWords)]));
  if (dictionaryWords.length > 0) localStorage.setItem('vnme_dict_saved_words', JSON.stringify([...new Set(dictionaryWords)]));
  return lessonWords.length > 0 || dictionaryWords.length > 0;
}

export function getProfileFromAuthUser(user, cloudProfile = null) {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: cloudProfile?.email || user.email || '',
    fullName: cloudProfile?.full_name || metadata.full_name || metadata.name || '',
    avatarUrl: cloudProfile?.avatar_url || metadata.avatar_url || '',
    uiLanguage: cloudProfile?.ui_language || 'en',
    dialect: cloudProfile?.dialect || 'north',
    onboardingCompleted: Boolean(cloudProfile?.onboarding_completed),
  };
}

export async function ensureUserProfile(user) {
  if (API_SYNC_PRIMARY && user?.id) {
    const localProfile = readLocalProfile();
    const metadata = user.user_metadata || {};
    const payload = {
      email: user.email || '',
      full_name: (localProfile.name && localProfile.name !== 'Bạn') ? localProfile.name : (metadata.full_name || metadata.name || ''),
      avatar_url: metadata.avatar_url || '',
      ui_language: localStorage.getItem('vnme_app_language') || localProfile.nativeLang || 'en',
      dialect: localProfile.dialect || 'north',
      onboarding_completed: localStorage.getItem('vnme_onboarding_completed') === 'true',
    };
    try {
      const result = await cloudApi('/api/sync/profile', {
        method: 'PUT',
        body: JSON.stringify({ profile: payload }),
      });
      return getProfileFromAuthUser(user, result.profile);
    } catch (err) {
      console.error('Failed to create API user profile:', err);
      return getProfileFromAuthUser(user);
    }
  }

  if (!supabase || !user?.id) return getProfileFromAuthUser(user);
  const localProfile = readLocalProfile();
  const metadata = user.user_metadata || {};
  const localName = localProfile.name && localProfile.name !== 'Bạn' ? localProfile.name : '';
  const payload = {
    id: user.id,
    email: user.email || '',
    full_name: localName || metadata.full_name || metadata.name || '',
    avatar_url: metadata.avatar_url || '',
    ui_language: localStorage.getItem('vnme_app_language') || localProfile.nativeLang || 'en',
    dialect: localProfile.dialect || 'north',
    onboarding_completed: localStorage.getItem('vnme_onboarding_completed') === 'true',
  };

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to create user profile:', error.message);
      return getProfileFromAuthUser(user);
    }
    if (CLOUD_SYNC_DUAL_WRITE) {
      bestEffortCloudApi('/api/sync/profile', {
        method: 'PUT',
        body: JSON.stringify({ profile: payload }),
      });
    }
    return getProfileFromAuthUser(user, data);
  } catch (err) {
    console.error('Failed to create user profile:', err);
    return getProfileFromAuthUser(user);
  }
}

export async function saveUserProfileToCloud(userId, userProfile = {}) {
  if (!userId) return;
  try {
    const payload = {
      id: userId,
      ui_language: userProfile.nativeLang || localStorage.getItem('vnme_app_language') || 'en',
      dialect: userProfile.dialect || 'north',
      onboarding_completed: localStorage.getItem('vnme_onboarding_completed') === 'true',
    };
    if (userProfile.name && userProfile.name !== 'Bạn') {
      payload.full_name = userProfile.name;
    }
    if (API_SYNC_PRIMARY) {
      await cloudApi('/api/sync/profile', {
        method: 'PUT',
        body: JSON.stringify({ profile: payload }),
      });
      return;
    }
    if (!supabase) return;
    await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (CLOUD_SYNC_DUAL_WRITE) {
      bestEffortCloudApi('/api/sync/profile', {
        method: 'PUT',
        body: JSON.stringify({ profile: payload }),
      });
    }
  } catch (err) {
    console.error('Failed to save profile to cloud:', err);
  }
}

export async function syncSavedWordsToCloud(userId) {
  if (!userId) return;
  try {
    const rows = collectSavedWordRows(userId);
    if (API_SYNC_PRIMARY) {
      await cloudApi('/api/sync/saved-words', {
        method: 'PUT',
        body: JSON.stringify({ rows }),
      });
      return;
    }
    if (!supabase) return;
    const sources = ['lesson', 'dictionary'];
    const { error: deleteError } = await supabase
      .from('saved_words')
      .delete()
      .eq('user_id', userId)
      .in('source', sources);

    if (deleteError) {
      console.error('Failed to clear saved words in cloud:', deleteError.message);
      return;
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('saved_words').insert(rows);
      if (insertError) console.error('Failed to save saved words to cloud:', insertError.message);
    }
    if (CLOUD_SYNC_DUAL_WRITE) {
      bestEffortCloudApi('/api/sync/saved-words', {
        method: 'PUT',
        body: JSON.stringify({ rows }),
      });
    }
  } catch (err) {
    console.error('Failed to sync saved words to cloud:', err);
  }
}

export async function loadSavedWordsFromCloud(userId) {
  if (!userId) return false;
  try {
    if (API_SYNC_PRIMARY) {
      const result = await cloudApi('/api/sync/saved-words');
      return applySavedWordRows(result.rows);
    }
    if (!supabase) return false;
    const { data, error } = await supabase
      .from('saved_words')
      .select('word_id, source')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to load saved words from cloud:', error.message);
      return false;
    }
    if (!Array.isArray(data) || data.length === 0) return false;

    return applySavedWordRows(data);
  } catch (err) {
    console.error('Failed to load saved words from cloud:', err);
    return false;
  }
}

export async function saveProgressToCloud(userId) {
  if (!userId) return;
  try {
    const data = collectLocalData();
    const savedWords = collectSavedWordRows(userId);
    if (API_SYNC_PRIMARY) {
      await cloudApi('/api/sync/progress', {
        method: 'PUT',
        body: JSON.stringify({ data, savedWords }),
      });
      return;
    }
    if (!supabase) return;
    await supabase.from('user_progress').upsert({
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    });
    await syncSavedWordsToCloud(userId);
    if (CLOUD_SYNC_DUAL_WRITE) {
      bestEffortCloudApi('/api/sync/progress', {
        method: 'PUT',
        body: JSON.stringify({ data, savedWords }),
      });
    }
  } catch (err) {
    console.error('Failed to save progress to cloud:', err);
  }
}

export function debouncedSaveProgress(userId) {
  if (!userId || (!supabase && !API_SYNC_PRIMARY)) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => saveProgressToCloud(userId), 2000);
}

export async function loadProgressFromCloud(userId) {
  if (!userId) return false;
  try {
    if (API_SYNC_PRIMARY) {
      const result = await cloudApi('/api/sync/progress');
      if (result?.data) {
        for (const [key, val] of Object.entries(result.data)) {
          if (SYNC_KEYS.includes(key) && val !== null && val !== undefined) {
            localStorage.setItem(key, val);
          }
        }
      }
      applySavedWordRows(result?.savedWords);
      return Boolean(result?.data || result?.savedWords?.length);
    }
    if (!supabase) return false;
    const { data, error } = await supabase
      .from('user_progress')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to load progress from cloud:', error.message);
      return false;
    }

    if (!data?.data) {
      await loadSavedWordsFromCloud(userId);
      return false;
    }

    const cloudData = data.data;
    for (const [key, val] of Object.entries(cloudData)) {
      if (SYNC_KEYS.includes(key) && val !== null && val !== undefined) {
        localStorage.setItem(key, val);
      }
    }
    if (!cloudData.vnme_app_language && cloudData.vietnamy_language) {
      localStorage.setItem('vnme_app_language', cloudData.vietnamy_language);
    }
    await loadSavedWordsFromCloud(userId);
    return true;
  } catch (err) {
    console.error('Failed to load progress from cloud:', err);
    return false;
  }
}
