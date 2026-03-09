import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('habittracker.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📋',
      color TEXT DEFAULT '#4A90E2',
      frequency TEXT DEFAULT '{"type":"daily"}',
      reminderTime TEXT,
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
  `);
};

export const addHabit = (habit: { name: string; icon: string; color: string; frequency: string; reminderTime?: string }) => {
  const result = db.runSync(
    'INSERT INTO habits (name, icon, color, frequency, reminderTime) VALUES (?, ?, ?, ?, ?)',
    [habit.name, habit.icon, habit.color, habit.frequency, habit.reminderTime || null]
  );
  return result.lastInsertRowId;
};

export const getHabits = () => {
  return db.getAllSync('SELECT * FROM habits WHERE isActive = 1 ORDER BY createdAt DESC') as any[];
};

export const deleteHabit = (id: number) => {
  db.runSync('UPDATE habits SET isActive = 0 WHERE id = ?', [id]);
};

export const updateHabit = (id: number, habit: { name?: string; icon?: string; color?: string; frequency?: string; reminderTime?: string }) => {
  const fields = [];
  const values = [];
  
  if (habit.name !== undefined) {
    fields.push('name = ?');
    values.push(habit.name);
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
  if (habit.reminderTime !== undefined) {
    fields.push('reminderTime = ?');
    values.push(habit.reminderTime);
  }
  
  if (fields.length === 0) return;
  
  values.push(id);
  db.runSync(`UPDATE habits SET ${fields.join(', ')} WHERE id = ?`, values);
};

export const checkin = (data: { habitId: number; note?: string; photos?: string[]; location?: string }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const timestamp = today.getTime();

  const result = db.runSync(
    'INSERT INTO checkins (habitId, checkinDate, note, photos, location) VALUES (?, ?, ?, ?, ?)',
    [data.habitId, timestamp, data.note || null, data.photos ? JSON.stringify(data.photos) : null, data.location || null]
  );
  return result.lastInsertRowId;
};

export const getCheckinsByDate = (date: Date) => {
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
  ) as any[];
};

export const getCheckinsByHabit = (habitId: number) => {
  return db.getAllSync(
    'SELECT * FROM checkins WHERE habitId = ? ORDER BY checkinDate DESC',
    [habitId]
  ) as any[];
};

export const getAllCheckins = () => {
  return db.getAllSync(
    `SELECT c.*, h.name as habitName, h.icon as habitIcon, h.color as habitColor 
     FROM checkins c 
     JOIN habits h ON c.habitId = h.id 
     ORDER BY c.checkinDate DESC, c.createdAt DESC`
  ) as any[];
};

export const getStreak = (habitId: number) => {
  const checkins = db.getAllSync(
    'SELECT checkinDate FROM checkins WHERE habitId = ? ORDER BY checkinDate DESC',
    [habitId]
  ) as any[];
  
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
};

export const isCheckedInToday = (habitId: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const timestamp = today.getTime();
  
  const result = db.getAllSync(
    'SELECT id FROM checkins WHERE habitId = ? AND checkinDate = ?',
    [habitId, timestamp]
  ) as any[];
  
  return result.length > 0;
};

export const deleteCheckin = (id: number) => {
  db.runSync('DELETE FROM checkins WHERE id = ?', [id]);
};

export const clearAllData = () => {
  db.runSync('DELETE FROM checkins');
  db.runSync('DELETE FROM habits');
  db.runSync('DELETE FROM challenges');
};

// Challenge Functions
export const createChallenge = (challenge: { habitId: number; title: string; description?: string; targetDays: number; startDate: number }) => {
  const result = db.runSync(
    'INSERT INTO challenges (habitId, title, description, targetDays, startDate) VALUES (?, ?, ?, ?, ?)',
    [challenge.habitId, challenge.title, challenge.description || null, challenge.targetDays, challenge.startDate]
  );
  return result.lastInsertRowId;
};

export const getChallenges = () => {
  return db.getAllSync(`
    SELECT c.*, h.name as habitName, h.icon as habitIcon, h.color as habitColor 
    FROM challenges c 
    JOIN habits h ON c.habitId = h.id 
    WHERE c.status = 'active' AND h.isActive = 1
    ORDER BY c.createdAt DESC
  `) as any[];
};

export const getAllChallenges = () => {
  return db.getAllSync(`
    SELECT c.*, h.name as habitName, h.icon as habitIcon, h.color as habitColor 
    FROM challenges c 
    JOIN habits h ON c.habitId = h.id 
    WHERE h.isActive = 1
    ORDER BY c.createdAt DESC
  `) as any[];
};

export const updateChallengeProgress = (challengeId: number, completedDays: number) => {
  const challenge = db.getFirstSync('SELECT * FROM challenges WHERE id = ?', [challengeId]) as any;
  if (!challenge) return;

  const targetDays = challenge.targetDays;
  const status = completedDays >= targetDays ? 'completed' : 'active';

  db.runSync(
    'UPDATE challenges SET completedDays = ?, status = ?, endDate = ? WHERE id = ?',
    [completedDays, status, status === 'completed' ? Date.now() : null, challengeId]
  );
};

export const completeChallenge = (challengeId: number) => {
  db.runSync(
    'UPDATE challenges SET status = ?, endDate = ? WHERE id = ?',
    ['completed', Date.now(), challengeId]
  );
};

export const deleteChallenge = (id: number) => {
  db.runSync('UPDATE challenges SET status = ? WHERE id = ?', ['deleted', id]);
};

// Backup/Restore Functions
export const exportData = () => {
  const habits = db.getAllSync('SELECT * FROM habits') as any[];
  const checkins = db.getAllSync('SELECT * FROM checkins') as any[];
  const challenges = db.getAllSync('SELECT * FROM challenges') as any[];

  return {
    version: 1,
    exportDate: new Date().toISOString(),
    habits,
    checkins,
    challenges,
  };
};

export const importData = (data: {
  version: number;
  habits: any[];
  checkins: any[];
  challenges: any[];
}) => {
  // Clear existing data
  db.runSync('DELETE FROM checkins');
  db.runSync('DELETE FROM habits');
  db.runSync('DELETE FROM challenges');

  // Import habits
  for (const habit of data.habits) {
    db.runSync(
      'INSERT INTO habits (id, name, icon, color, frequency, reminderTime, createdAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [habit.id, habit.name, habit.icon, habit.color, habit.frequency, habit.reminderTime, habit.createdAt, habit.isActive]
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

export const shouldCheckInToday = (habit: any, date: Date = new Date()): boolean => {
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
