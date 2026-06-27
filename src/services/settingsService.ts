import { AppSettings } from '../types';
import { authService } from './authService.ts';

const STORAGE_KEY_PREFIX = 'futamap_settings_';

const getDefaultSettingsForChurch = (churchId: string): AppSettings => {
  if (churchId === 'rccg') {
    return {
      mapName: "RCCG Area",
      churchName: "Redeemed Christian Church of God",
      themeColor: "#16a34a",
      logoName: "RCCG Admin"
    };
  } else if (churchId === 'winners') {
    return {
      mapName: "Winners Cell",
      churchName: "Winners Chapel International",
      themeColor: "#dc2626",
      logoName: "Winners Admin"
    };
  } else {
    return {
      mapName: "Celebration Group",
      churchName: "Celebration Church International",
      themeColor: "#2563eb",
      logoName: "CCI Admin"
    };
  }
};

export const settingsService = {
  getSettings(chosenChurchId?: string): AppSettings {
    const activeChurchId = chosenChurchId || authService.getCurrentSession()?.churchId || 'futamap';
    const key = `${STORAGE_KEY_PREFIX}${activeChurchId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing settings", e);
      }
    }
    return getDefaultSettingsForChurch(activeChurchId);
  },

  async fetchSettings(churchId: string): Promise<AppSettings> {
    try {
      const res = await fetch(`/api/settings/${churchId}`);
      if (res.ok) {
        const data = await res.json();
        const key = `${STORAGE_KEY_PREFIX}${churchId}`;
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch settings from backend:', err);
    }
    return this.getSettings(churchId);
  },

  async saveSettings(settings: AppSettings, chosenChurchId?: string): Promise<AppSettings> {
    const activeChurchId = chosenChurchId || authService.getCurrentSession()?.churchId || 'futamap';
    const key = `${STORAGE_KEY_PREFIX}${activeChurchId}`;
    
    // Save locally
    localStorage.setItem(key, JSON.stringify(settings));

    // Save to server
    try {
      await fetch(`/api/settings/${activeChurchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    } catch (err) {
      console.error('Failed to post settings:', err);
    }

    return settings;
  }
};
