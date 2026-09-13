import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../config/apiConfig';

const STORAGE_KEYS = {
  pickup: 'LOCAL_PICKUP_RECORDS',
};

export const cargoService = {
  async fetchRecords(docType) {
    const url = ENDPOINTS[docType];
    let sheetRecords = [];

    if (url) {
      try {
        const response = await fetch(`${url}?t=${Date.now()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        const text = await response.text();
        let json = JSON.parse(text);

        if (Array.isArray(json)) {
          sheetRecords = json;
        }
      } catch (err) {
        console.warn(`Fetch warning for ${docType}, relying on cache:`, err);
      }
    }

    let localRecords = [];
    try {
      const localData = await AsyncStorage.getItem(STORAGE_KEYS[docType] || `LOCAL_${docType.toUpperCase()}`);
      if (localData) localRecords = JSON.parse(localData);
    } catch (e) {
      console.error('AsyncStorage read error:', e);
    }

    const combined = [...localRecords];
    sheetRecords.forEach((s) => {
      const id = s.pickupId || s.pickupNo;
      if (id && !combined.some((c) => (c.pickupId || c.pickupNo) === id)) {
        combined.push(s);
      }
    });

    return combined;
  },

  async saveRecord(docType, fullRecordList) {
    const storageKey = STORAGE_KEYS[docType] || `LOCAL_${docType.toUpperCase()}`;

    // 1. Guaranteed Local Save First
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(fullRecordList));
    } catch (e) {
      console.error('AsyncStorage write error:', e);
    }

    // 2. Post to Google Apps Script Backend matching exact site action: "sync"
    const url = ENDPOINTS[docType];
    if (!url) return { success: true, localOnly: true };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'sync',
          data: fullRecordList,
        }),
      });

      const resText = await response.text();
      return { success: true, response: resText };
    } catch (error) {
      console.error(`Sync error for ${docType}:`, error);
      return { success: true, warning: 'Saved locally.' };
    }
  },
};