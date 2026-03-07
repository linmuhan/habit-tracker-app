import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('habittracker.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📋',
      color TEXT DEFAULT '#4A90E2',
      frequency TEXT DEFAULT 'daily',
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
      createdAt INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checkinDate);
    CREATE INDEX IF NOT EXISTS idx_checkins_habit ON checkins(habitId);
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

export const checkin = (data: { habitId: number; note?: string; photos?: string[] }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const timestamp = today.getTime();
  
  const result = db.runSync(
    'INSERT INTO checkins (habitId, checkinDate, note, photos) VALUES (?, ?, ?, ?)',
    [data.habitId, timestamp, data.note || null, data.photos ? JSON.stringify(data.photos) : null]
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
