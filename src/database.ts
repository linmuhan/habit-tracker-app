import * as SQLite from 'expo-sqlite';
import { Habit, HabitInput, Checkin, CheckinInput, Challenge, ChallengeInput, Setting } from './types';
import { safeDbOperationSync, ValidationError } from './utils/errorHandler';

const db = SQLite.openDatabaseSync('habittracker.db');

export const initDatabase = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT DEFAULT '📋',
        color TEXT DEFAULT '#4A90E2',
        frequency TEXT DEFAULT '{"type":"daily"}',
        reminderTime TEXT,
        reminderEnabled INTEGER DEFAULT 0,
        category TEXT DEFAULT '其他',
        createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        isActive INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habitId INTEGER NOT NULL,
        checkinDate INTEGER NOT NULL,
        note TEXT,
        photos TEXT,
        location TEXT,
        createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checkinDate);
      CREATE INDEX IF NOT EXISTS idx_checkins_habit ON checkins(habitId);

      CREATE TABLE IF NOT EXISTS challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habitId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        targetDays INTEGER NOT NULL,
        startDate INTEGER NOT NULL,
        endDate INTEGER,
        status TEXT DEFAULT 'active',
        completedDays INTEGER DEFAULT 0,
        createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_challenges_habit ON challenges(habitId);
      CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.error('[Database] Failed to initialize database:', error);
    throw new Error('数据库初始化失败');
  }
};

export const addHabit = (habit: HabitInput): number => {
  // 验证输入
  if (!habit.name || habit.name.trim() === '') {
    throw new ValidationError('习惯名称不能为空', 'name');
  }
  
  return safeDbOperationSync(
    () => {
      const result = db.runSync(
        'INSERT INTO habits (name, icon, color, frequency, category, reminderEnabled, reminderTime) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          habit.name.trim(),
          habit.icon,
          habit.color,
          habit.frequency,
          habit.category || '其他',
          habit.reminderEnabled || 0,
          habit.reminderTime || null,
        ]
      );
      return result.lastInsertRowId as number;
    },
    -1,
    '添加习惯失败'
  );
};

export const getHabits = (): Habit[] => {
  return safeDbOperationSync(
    () => db.getAllSync('SELECT * FROM habits WHERE isActive = 1 ORDER BY createdAt DESC') as Habit[],
    [],
    '获取习惯列表失败'
  );
};

export const deleteHabit = (id: number): boolean => {
  return safeDbOperationSync(
    () => {
      db.runSync('UPDATE habits SET isActive = 0 WHERE id = ?', [id]);
      return true;
    },
    false,
    '删除习惯失败'
  );
};

export const updateHabit = (id: number, habit: Partial<HabitInput>): boolean => {
  return safeDbOperationSync(
    () => {
      const fields: string[] = [];
      const values: any[] = [];
      
      if (habit.name !== undefined) {
        if (habit.name.trim() === '') {
          throw new ValidationError('习惯名称不能为空', 'name');
        }
        fields.push('name = ?');
        values.push(habit.name.trim());
      }
      if (habit.icon !== undefined) {
        fields.push('icon = ?');
        values.push(habit.icon);
      }
      if (habit.color !== undefined) {
        fields.push('color = ?');
        values.push(habit.color);
      }
      if (habit.frequency !== undefined) {
        fields.push('frequency = ?');
        values.push(habit.frequency);
      }
      if (habit.category !== undefined) {
        fields.push('category = ?');
        values.push(habit.category);
      }
      if (habit.reminderEnabled !== undefined) {
        fields.push('reminderEnabled = ?');
        values.push(habit.reminderEnabled);
      }
      if (habit.reminderTime !== undefined) {
        fields.push('reminderTime = ?');
        values.push(habit.reminderTime);
      }
      
      if (fields.length === 0) return false;
      
      values.push(id);
      db.runSync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, values);
      return true;
    },
    false,
    '更新习惯失败'
  );
};

export const checkin = (data: { habitId: number; note?: string; photos?: string[]; location?: string }): number => {
  return safeDbOperationSync(
    () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const timestamp = today.getTime();

      const result = db.runSync(
        'INSERT INTO checkins (habitId, checkinDate, note, photos, location) VALUES (?, ?, ?, ?, ?)',
        [data.habitId, timestamp, data.note || null, data.photos ? JSON.stringify(data.photos) : null, data.location || null]
      );
      return result.lastInsertRowId as number;
    },
    -1,
    '打卡失败'
  );
};

export const getCheckinsByDate = (date: Date): (Checkin & { habitName: string; habitIcon: string; habitColor: string })[] => {
  return safeDbOperationSync(
    () => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const timestamp = startOfDay.getTime();
      
      return db.getAllSync(
        `SELECT c.*, h.name as habitName, h.icon as habitIcon, h.color as habitColor 
         FROM checkins c 
         JOIN habits h ON c.habitId = h.id 
         WHERE c.checkinDate = ? 
         ORDER BY c.createdAt DESC`,
        [timestamp]
      ) as (Checkin & { habitName: string; habitIcon: string; habitColor: string })[];
    },
    [],
    '获取打卡记录失败'
  );
};

export const getCheckinsByHabit = (habitId: number): Checkin[] => {
  return safeDbOperationSync(
    () => db.getAllSync(
      'SELECT * FROM checkins WHERE habitId = ? ORDER BY checkinDate DESC',
      [habitId]
    ) as Checkin[],
    [],
    '获取习惯打卡记录失败'
  );
};

export const getAllCheckins = (): (Checkin & { habitName: string; habitIcon: string; habitColor: string })[] => {
  return safeDbOperationSync(
    () => db.getAllSync(
      `SELECT c.*, h.name as habitName, h.icon as habitIcon, h.color as habitColor 
       FROM checkins c 
       JOIN habits h ON c.habitId = h.id 
       ORDER BY c.checkinDate DESC, c.createdAt DESC`
    ) as (Checkin & { habitName: string; habitIcon: string; habitColor: string })[],
    [],
    '获取所有打卡记录失败'
  );
};

export const getStreak = (habitId: number): number => {
  return safeDbOperationSync(
    () => {
      const checkins = db.getAllSync(
        'SELECT checkinDate FROM checkins WHERE habitId = ? ORDER BY checkinDate DESC',
        [habitId]
      ) as { checkinDate: number }[];
      
      if (checkins.length === 0) return 0;
      
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < checkins.length; i++) {
        const checkinDate = new Date(checkins[i].checkinDate);
        checkinDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((today.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === i || (i === 0 && diffDays === 1)) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    },
    0,
    '获取连续打卡天数失败'
  );
};

export const isCheckedInToday = (habitId: number): boolean => {
  return safeDbOperationSync(
    () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const timestamp = today.getTime();
      
      const result = db.getAllSync(
        'SELECT id FROM checkins WHERE habitId = ? AND checkinDate = ?',
        [habitId, timestamp]
      ) as { id: number }[];
      
      return result.length > 0;
    },
    false,
    '检查今日打卡状态失败'
  );
};

export const deleteCheckin = (id: number): boolean => {
  return safeDbOperationSync(
    () => {
      db.runSync('DELETE FROM checkins WHERE id = ?', [id]);
      return true;
    },
    false,
    '删除打卡记录失败'
  );
};

export const clearAllData = (): boolean => {
  return safeDbOperationSync(
    () => {
      db.runSync('DELETE FROM checkins');
      db.runSync('DELETE FROM habits');
      db.runSync('DELETE FROM challenges');
      return true;
    },
    false,
    '清空数据失败'
  );
};

// Challenge Functions
export const createChallenge = (challenge: ChallengeInput): number => {
  return safeDbOperationSync(
    () => {
      const result = db.runSync(
        'INSERT INTO challenges (habitId, title, description, targetDays, startDate) VALUES (?, ?, ?, ?, ?)',
        [challenge.habitId, challenge.title, challenge.description || null, challenge.targetDays, challenge.startDate]
      );
      return result.lastInsertRowId as number;
    },
    -1,
    '创建挑战失败'
  );
};

export const getChallenges = (): (Challenge & { habitName: string; habitIcon: string; habitColor: string })[] => {
  return safeDbOperationSync(
    () => db.getAllSync(`
      SELECT c.*, h.name as habitName, h.icon as habitIcon, h.color as habitColor 
      FROM challenges c 
      JOIN habits h ON c.habitId = h.id 
      WHERE c.status = 'active' AND h.isActive = 1
      ORDER BY c.createdAt DESC
    `) as (Challenge & { habitName: string; habitIcon: string; habitColor: string })[],
    [],
    '获取挑战列表失败'
  );
};

export const getAllChallenges = (): (Challenge & { habitName: string; habitIcon: string; habitColor: string })[] => {
  return safeDbOperationSync(
    () => db.getAllSync(`
      SELECT c.*, h.name as habitName, h.icon as habitIcon, h.color as habitColor 
      FROM challenges c 
      JOIN habits h ON c.habitId = h.id 
      WHERE h.isActive = 1
      ORDER BY c.createdAt DESC
    `) as (Challenge & { habitName: string; habitIcon: string; habitColor: string })[],
    [],
    '获取所有挑战失败'
  );
};

export const updateChallengeProgress = (challengeId: number, completedDays: number): boolean => {
  return safeDbOperationSync(
    () => {
      const challenge = db.getFirstSync('SELECT * FROM challenges WHERE id = ?', [challengeId]) as Challenge | null;
      if (!challenge) return false;

      const targetDays = challenge.targetDays;
      const status = completedDays >= targetDays ? 'completed' : 'active';

      db.runSync(
        'UPDATE challenges SET completedDays = ?, status = ?, endDate = ? WHERE id = ?',
        [completedDays, status, status === 'completed' ? Date.now() : null, challengeId]
      );
      return true;
    },
    false,
    '更新挑战进度失败'
  );
};

export const completeChallenge = (challengeId: number): boolean => {
  return safeDbOperationSync(
    () => {
      db.runSync(
        'UPDATE challenges SET status = ?, endDate = ? WHERE id = ?',
        ['completed', Date.now(), challengeId]
      );
      return true;
    },
    false,
    '完成挑战失败'
  );
};

export const deleteChallenge = (id: number): boolean => {
  return safeDbOperationSync(
    () => {
      db.runSync('UPDATE challenges SET status = ? WHERE id = ?', ['deleted', id]);
      return true;
    },
    false,
    '删除挑战失败'
  );
};

// Backup/Restore Functions
export interface BackupData {
  version: number;
  exportDate: string;
  habits: Habit[];
  checkins: Checkin[];
  challenges: Challenge[];
}

export const exportData = (): BackupData => {
  return safeDbOperationSync(
    () => {
      const habits = db.getAllSync('SELECT * FROM habits') as Habit[];
      const checkins = db.getAllSync('SELECT * FROM checkins') as Checkin[];
      const challenges = db.getAllSync('SELECT * FROM challenges') as Challenge[];

      return {
        version: 1,
        exportDate: new Date().toISOString(),
        habits,
        checkins,
        challenges,
      };
    },
    { version: 1, exportDate: new Date().toISOString(), habits: [], checkins: [], challenges: [] },
    '导出数据失败'
  );
};

export const importData = (data: BackupData): boolean => {
  return safeDbOperationSync(
    () => {
      // Clear existing data
      db.runSync('DELETE FROM checkins');
      db.runSync('DELETE FROM habits');
      db.runSync('DELETE FROM challenges');

      // Import habits
      for (const habit of data.habits) {
        db.runSync(
          'INSERT INTO habits (id, name, icon, color, frequency, reminderTime, reminderEnabled, category, createdAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [habit.id, habit.name, habit.icon, habit.color, habit.frequency, habit.reminderTime, habit.reminderEnabled, habit.category, habit.createdAt, habit.isActive]
        );
      }

      // Import checkins
      for (const checkin of data.checkins) {
        db.runSync(
          'INSERT INTO checkins (id, habitId, checkinDate, note, photos, location, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [checkin.id, checkin.habitId, checkin.checkinDate, checkin.note, checkin.photos, checkin.location, checkin.createdAt]
        );
      }

      // Import challenges
      for (const challenge of data.challenges) {
        db.runSync(
          'INSERT INTO challenges (id, habitId, title, description, targetDays, startDate, endDate, status, completedDays, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [challenge.id, challenge.habitId, challenge.title, challenge.description, challenge.targetDays, challenge.startDate, challenge.endDate, challenge.status, challenge.completedDays, challenge.createdAt]
        );
      }
      return true;
    },
    false,
    '导入数据失败'
  );
};

// Frequency helper functions
export type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'monthly';

export interface FrequencyConfig {
  type: FrequencyType;
  days?: number[]; // For weekly: 0-6 (Sun-Sat), for monthly: 1-31
  times?: number; // For "X times per week/month"
}

export const parseFrequency = (frequency: string): FrequencyConfig => {
  try {
    return JSON.parse(frequency);
  } catch {
    // Legacy support for old format
    return { type: frequency as FrequencyType };
  }
};

export const shouldCheckInToday = (habit: Habit, date: Date = new Date()): boolean => {
  const freq = parseFrequency(habit.frequency);
  const dayOfWeek = date.getDay(); // 0-6
  const dayOfMonth = date.getDate(); // 1-31

  switch (freq.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'weekly':
      if (freq.days && freq.days.length > 0) {
        return freq.days.includes(dayOfWeek);
      }
      return true;
    case 'monthly':
      if (freq.days && freq.days.length > 0) {
        return freq.days.includes(dayOfMonth);
      }
      return true;
    default:
      return true;
  }
};

export const getFrequencyLabel = (frequency: string): string => {
  const freq = parseFrequency(frequency);
  const daysMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  switch (freq.type) {
    case 'daily':
      return '每天';
    case 'weekdays':
      return '工作日';
    case 'weekends':
      return '周末';
    case 'weekly':
      if (freq.days && freq.days.length > 0) {
        if (freq.days.length === 7) return '每天';
        return freq.days.map(d => daysMap[d]).join('、');
      }
      return '每周';
    case 'monthly':
      if (freq.days && freq.days.length > 0) {
        return `每月 ${freq.days.join('、')} 号`;
      }
      return '每月';
    default:
      return '每天';
  }
};

// Settings Functions
export const getSetting = (key: string, defaultValue?: string): string | undefined => {
  return safeDbOperationSync(
    () => {
      const result = db.getFirstSync('SELECT value FROM settings WHERE key = ?', [key]) as Setting | null;
      return result ? result.value : defaultValue;
    },
    defaultValue,
    '获取设置失败'
  );
};

export const setSetting = (key: string, value: string): boolean => {
  return safeDbOperationSync(
    () => {
      db.runSync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      );
      return true;
    },
    false,
    '保存设置失败'
  );
};

// Category management
export const getCategories = (): string[] => {
  return safeDbOperationSync(
    () => {
      const habits = db.getAllSync('SELECT DISTINCT category FROM habits WHERE isActive = 1') as { category: string }[];
      const categories = habits.map(h => h.category).filter(Boolean);
      return ['全部', ...new Set(categories)];
    },
    ['全部'],
    '获取分类失败'
  );
};

export const getHabitsByCategory = (category: string): Habit[] => {
  if (category === '全部') {
    return getHabits();
  }
  return safeDbOperationSync(
    () => db.getAllSync('SELECT * FROM habits WHERE isActive = 1 AND category = ? ORDER BY createdAt DESC', [category]) as Habit[],
    [],
    '获取分类习惯失败'
  );
};
