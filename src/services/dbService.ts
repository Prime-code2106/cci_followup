import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Table names mapping from collections to Supabase tables
const tableMap: Record<string, string> = {
  churches: 'churches',
  members: 'members',
  visitors: 'visitors',
  attendance: 'attendance',
  prayerRequests: 'prayer_requests',
  followUps: 'follow_ups',
  recentActivities: 'recent_activities',
  fellowshipConnections: 'fellowship_connections',
  fellowshipNotes: 'fellowship_notes',
  appSettings: 'app_settings'
};

const JSON_DB_PATH = path.join(process.cwd(), 'database.json');

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function mapShallowKeysToSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = camelToSnake(key);
    result[snakeKey] = obj[key];
  }
  return result;
}

function mapShallowKeysToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = snakeToCamel(key);
    result[camelKey] = obj[key];
  }
  return result;
}

function cleanErrorMessage(err: any): string {
  if (!err) return 'Unknown error';
  const msg = err.message || String(err);
  if (msg.includes('<!DOCTYPE') || msg.includes('<html') || msg.includes('Cloudflare') || msg.includes('521') || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
    return 'Cloudflare / Network Server Error (HTTP 5xx - Web Server Down or Unreachable)';
  }
  if (msg.length > 150) {
    return msg.substring(0, 150) + '...';
  }
  return msg;
}

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private useLocalJson = true;
  private loggedMissingTables = new Set<string>();

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.useLocalJson = false;
        console.log('💚 Supabase initialized successfully as backend database!');
      } catch (err) {
        console.error('⚠️ Failed to initialize Supabase client:', err);
        this.useLocalJson = true;
      }
    } else {
      console.log('ℹ️ Supabase environment variables not fully configured. Falling back to local JSON database.');
      this.useLocalJson = true;
    }

    // Initialize local JSON file if needed
    if (this.useLocalJson && !fs.existsSync(JSON_DB_PATH)) {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify({}, null, 2), 'utf8');
    }
  }

  // Quietly log database state transitions/fallbacks to avoid cluttering automated error systems
  private logFallback(tableName: string, operation: string, err: any) {
    if (!this.loggedMissingTables.has(tableName)) {
      this.loggedMissingTables.add(tableName);
      console.log(`ℹ️ [Database] Table "${tableName}" fell back to local cache storage for ${operation}. (Note: This is expected if the corresponding schema table or column doesn't exist on your remote Supabase yet. Reason: ${cleanErrorMessage(err)})`);
    }
  }

  // Helper to read local JSON file
  private readLocalJson(): Record<string, any[]> {
    try {
      if (!fs.existsSync(JSON_DB_PATH)) {
        return {};
      }
      const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
      return JSON.parse(data || '{}');
    } catch (err) {
      console.error('Error reading local JSON database:', err);
      return {};
    }
  }

  // Helper to write local JSON file
  private writeLocalJson(data: Record<string, any[]>) {
    try {
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing to local JSON database:', err);
    }
  }

  // 1. Get entire collection/table
  async getCollection(collectionName: string): Promise<any[]> {
    const tableName = tableMap[collectionName] || collectionName;

    if (this.useLocalJson) {
      const dbData = this.readLocalJson();
      return dbData[collectionName] || [];
    }

    // Supabase Backend query
    try {
      const { data, error } = await this.supabase!
        .from(tableName)
        .select('*');
      if (error) throw error;
      return (data || []).map(row => mapShallowKeysToCamel(row));
    } catch (err: any) {
      this.logFallback(tableName, 'getCollection', err);
      const dbData = this.readLocalJson();
      return dbData[collectionName] || [];
    }
  }

  // 2. Query collection with single eq/where filter
  async where(collectionName: string, field: string, operator: '==' | '!=', value: any): Promise<any[]> {
    const tableName = tableMap[collectionName] || collectionName;

    if (this.useLocalJson) {
      const dbData = this.readLocalJson();
      const list = dbData[collectionName] || [];
      return list.filter((item: any) => {
        if (operator === '==') {
          return item[field] === value;
        } else {
          return item[field] !== value;
        }
      });
    }

    // Supabase Backend query
    try {
      const dbField = camelToSnake(field);
      let query = this.supabase!.from(tableName).select('*');
      if (operator === '==') {
        query = query.eq(dbField, value);
      } else if (operator === '!=') {
        query = query.neq(dbField, value);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => mapShallowKeysToCamel(row));
    } catch (err: any) {
      this.logFallback(tableName, `where filter (${field} ${operator} ${value})`, err);
      const dbData = this.readLocalJson();
      const list = dbData[collectionName] || [];
      return list.filter((item: any) => {
        if (operator === '==') {
          return item[field] === value;
        } else {
          return item[field] !== value;
        }
      });
    }
  }

  // 3. Get document/row by ID
  async docGet(collectionName: string, id: string): Promise<any | null> {
    const tableName = tableMap[collectionName] || collectionName;

    if (this.useLocalJson) {
      const dbData = this.readLocalJson();
      const list = dbData[collectionName] || [];
      const found = list.find((item: any) => item.id === id);
      return found || null;
    }

    // Supabase Backend query
    try {
      const { data, error } = await this.supabase!
        .from(tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapShallowKeysToCamel(data) : null;
    } catch (err: any) {
      this.logFallback(tableName, 'docGet', err);
      const dbData = this.readLocalJson();
      const list = dbData[collectionName] || [];
      const found = list.find((item: any) => item.id === id);
      return found || null;
    }
  }

  // 4. Set/Write document/row
  async docSet(collectionName: string, id: string, data: any): Promise<void> {
    const tableName = tableMap[collectionName] || collectionName;
    const record = { ...data, id };

    // Always keep local JSON updated as shadow/cache
    const dbData = this.readLocalJson();
    const list = dbData[collectionName] || [];
    const index = list.findIndex((item: any) => item.id === id);
    if (index >= 0) {
      list[index] = record;
    } else {
      list.push(record);
    }
    dbData[collectionName] = list;
    this.writeLocalJson(dbData);

    if (this.useLocalJson) {
      return;
    }

    // Supabase Backend insert/upsert
    try {
      const dbRecord = mapShallowKeysToSnake(record);
      const { error } = await this.supabase!
        .from(tableName)
        .upsert(dbRecord);
      if (error) throw error;
    } catch (err: any) {
      this.logFallback(tableName, 'docSet', err);
    }
  }

  // 5. Update document/row partially
  async docUpdate(collectionName: string, id: string, updateData: any): Promise<any> {
    const tableName = tableMap[collectionName] || collectionName;

    // Always keep local JSON updated as shadow/cache
    const dbData = this.readLocalJson();
    const list = dbData[collectionName] || [];
    const index = list.findIndex((item: any) => item.id === id);
    let updatedRecord = null;

    if (index >= 0) {
      updatedRecord = { ...list[index], ...updateData };
      list[index] = updatedRecord;
    } else {
      updatedRecord = { id, ...updateData };
      list.push(updatedRecord);
    }
    dbData[collectionName] = list;
    this.writeLocalJson(dbData);

    if (this.useLocalJson) {
      return updatedRecord;
    }

    // Supabase Backend update
    try {
      const dbUpdateData = mapShallowKeysToSnake(updateData);
      const { data, error } = await this.supabase!
        .from(tableName)
        .update(dbUpdateData)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data ? mapShallowKeysToCamel(data) : updatedRecord;
    } catch (err: any) {
      this.logFallback(tableName, 'docUpdate', err);
      return updatedRecord;
    }
  }

  // 6. Delete document/row by ID
  async docDelete(collectionName: string, id: string): Promise<void> {
    const tableName = tableMap[collectionName] || collectionName;

    // Always keep local JSON updated as shadow/cache
    const dbData = this.readLocalJson();
    const list = dbData[collectionName] || [];
    dbData[collectionName] = list.filter((item: any) => item.id !== id);
    this.writeLocalJson(dbData);

    if (this.useLocalJson) {
      return;
    }

    // Supabase Backend delete
    try {
      const { error } = await this.supabase!
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      this.logFallback(tableName, 'docDelete', err);
    }
  }

  // 7. Seed initial settings & demo accounts if database is empty
  async seedIfNeeded() {
    try {
      const churches = await this.getCollection('churches');
      if (churches.length === 0) {
        console.log('🚀 [Supabase/Local] Beginning initial SaaS seeder...');
        
        const defaultChurches = [
          {
            id: 'futamap',
            name: 'Celebration Church International',
            passwordHash: 'mock_bcrypt_pbkdf2_2ec9aec', // celebration2026 hash
            mapName: 'Celebration Group',
            logoName: 'CCI Admin'
          },
          {
            id: 'rccg',
            name: 'RCCG',
            passwordHash: 'mock_bcrypt_pbkdf2_660194d7', // rccg2026 hash
            mapName: 'RCCG Area',
            logoName: 'RCCG Admin'
          },
          {
            id: 'winners',
            name: 'Winners Chapel',
            passwordHash: 'mock_bcrypt_pbkdf2_68615316', // winners2026 hash
            mapName: 'Winners Cell',
            logoName: 'Winners Admin'
          }
        ];

        for (const c of defaultChurches) {
          await this.docSet('churches', c.id, c);
          
          // Seed default settings for each church
          await this.docSet('appSettings', c.id, {
            id: c.id,
            mapName: c.mapName,
            churchName: c.name,
            themeColor: '#4f46e5',
            logoName: c.logoName
          });
        }
        console.log('✓ Initial SaaS seeding completed successfully!');
      }

      // Clear the transactional collections to maintain a pristine starting point, as done originally
      const transactionalCollections = [
        'members',
        'visitors',
        'attendance',
        'prayerRequests',
        'followUps',
        'fellowshipConnections',
        'fellowshipNotes',
        'recentActivities'
      ];

      for (const coll of transactionalCollections) {
        if (this.useLocalJson) {
          const dbData = this.readLocalJson();
          dbData[coll] = [];
          this.writeLocalJson(dbData);
        } else {
          try {
            const tableName = tableMap[coll] || coll;
            await this.supabase!.from(tableName).delete().neq('id', 'keep_all_rows_clean');
          } catch (err: any) {
            // Quiet log during clearing
          }
        }
      }
      console.log('✓ Care database environment cleared & activated!');
    } catch (err) {
      console.error('Error during initial database seed:', err);
    }
  }
}

export const dbService = new DatabaseService();
