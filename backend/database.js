const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'library.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    name TEXT,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn TEXT UNIQUE,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT,
    publish_date DATE,
    category_id INTEGER,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    location TEXT,
    description TEXT,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS borrow_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME NOT NULL,
    return_date DATETIME,
    status TEXT DEFAULT 'borrowed',
    fine_amount REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

const initAdmin = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?');
const adminCount = initAdmin.get('admin');

if (adminCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  const insertAdmin = db.prepare('INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)');
  insertAdmin.run('admin', hashedPassword, 'admin', '系统管理员', 'admin@library.com');
}

const initCategories = db.prepare('SELECT COUNT(*) as count FROM categories');
const categoryCount = initCategories.get();

if (categoryCount.count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  const defaultCategories = [
    ['文学', '文学类图书'],
    ['科技', '科技类图书'],
    ['历史', '历史类图书'],
    ['艺术', '艺术类图书'],
    ['经济', '经济管理类图书'],
    ['教育', '教育学习类图书'],
    ['计算机', '计算机技术类图书'],
    ['其他', '其他类型图书']
  ];
  defaultCategories.forEach(([name, desc]) => insertCategory.run(name, desc));
}

const initSettings = db.prepare('SELECT COUNT(*) as count FROM system_settings');
const settingsCount = initSettings.get();

if (settingsCount.count === 0) {
  const insertSetting = db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)');
  insertSetting.run('borrow_days', '30');
  insertSetting.run('max_borrow_books', '5');
  insertSetting.run('fine_per_day', '0.5');
}

module.exports = db;
