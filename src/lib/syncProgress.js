import { supabase } from './supabase';

const SYNC_KEYS = [
  'vietnamy_dong',
  'vnme_user_profile',
  'vnme_srs',
  'vnme_word_grades',
  'vnme_saved_words',
  'vnme_custom_decks',
  'vnme_dict_saved_words',
  'vnme_dict_decks',
  'vnme_onboarding_completed',
  'vnme_tutorial_completed',
  'vietnamy_language',
  'vnme_settings',
];

let debounceTimer = null;

function collectLocalData() {
  const data = {};
  for (const key of SYNC_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) data[key] = val;
  }
  return data;
}

export async function saveProgressToCloud(userId) {
  if (!supabase || !userId) return;
  try {
    const data = collectLocalData();
    await supabase.from('user_progress').upsert({
      user_id: userId,
      data,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to save progress to cloud:', err);
  }
}

export function debouncedSaveProgress(userId) {
  if (!supabase || !userId) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => saveProgressToCloud(userId), 2000);
}

export async function loadProgressFromCloud(userId) {
  if (!supabase || !userId) return false;
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('data')
      .eq('user_id', userId)
      .single();

    if (error || !data?.data) return false;

    const cloudData = data.data;
    for (const [key, val] of Object.entries(cloudData)) {
      if (SYNC_KEYS.includes(key) && val !== null && val !== undefined) {
        localStorage.setItem(key, val);
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to load progress from cloud:', err);
    return false;
  }
}
