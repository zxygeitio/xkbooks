const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware');

router.get('/overview', authMiddleware, adminMiddleware, (req, res) => {
  const totalBooks = db.prepare('SELECT SUM(total_copies) as total FROM books').get();
  const availableBooks = db.prepare('SELECT SUM(available_copies) as total FROM books').get();
  const totalUsers = db.prepare('SELECT COUNT(*) as total FROM users WHERE role = ?').get('user');
  const activeBorrows = db.prepare('SELECT COUNT(*) as total FROM borrow_records WHERE status = ?').get('borrowed');
  const overdueBorrows = db.prepare(`
    SELECT COUNT(*) as total FROM borrow_records 
    WHERE status = 'borrowed' AND due_date < datetime('now')
  `).get();

  res.json({
    totalBooks: totalBooks.total || 0,
    availableBooks: availableBooks.total || 0,
    borrowedBooks: (totalBooks.total || 0) - (availableBooks.total || 0),
    totalUsers: totalUsers.total,
    activeBorrows: activeBorrows.total,
    overdueBorrows: overdueBorrows.total
  });
});

router.get('/category-stats', (req, res) => {
  const stats = db.prepare(`
    SELECT c.name as category, 
           COUNT(b.id) as book_count,
           SUM(b.total_copies) as total_copies,
           SUM(b.available_copies) as available_copies
    FROM categories c
    LEFT JOIN books b ON c.id = b.category_id
    GROUP BY c.id
    ORDER BY book_count DESC
  `).all();

  res.json(stats);
});

router.get('/borrow-trend', authMiddleware, adminMiddleware, (req, res) => {
  const { days = 30 } = req.query;
  
  const trend = db.prepare(`
    SELECT date(borrow_date) as date, COUNT(*) as count
    FROM borrow_records
    WHERE borrow_date >= date('now', '-' || ? || ' days')
    GROUP BY date(borrow_date)
    ORDER BY date
  `).all(days);

  res.json(trend);
});

router.get('/popular-books', (req, res) => {
  const { limit = 10 } = req.query;
  
  const books = db.prepare(`
    SELECT b.id, b.title, b.author, COUNT(br.id) as borrow_count
    FROM books b
    LEFT JOIN borrow_records br ON b.id = br.book_id
    GROUP BY b.id
    ORDER BY borrow_count DESC
    LIMIT ?
  `).all(parseInt(limit));

  res.json(books);
});

router.get('/active-users', authMiddleware, adminMiddleware, (req, res) => {
  const { limit = 10 } = req.query;
  
  const users = db.prepare(`
    SELECT u.id, u.username, u.name, COUNT(br.id) as borrow_count
    FROM users u
    LEFT JOIN borrow_records br ON u.id = br.user_id
    WHERE u.role = 'user'
    GROUP BY u.id
    ORDER BY borrow_count DESC
    LIMIT ?
  `).all(parseInt(limit));

  res.json(users);
});

router.get('/overdue-list', authMiddleware, adminMiddleware, (req, res) => {
  const records = db.prepare(`
    SELECT br.*, b.title, b.author, b.isbn, u.username, u.name as user_name, u.phone, u.email
    FROM borrow_records br
    LEFT JOIN books b ON br.book_id = b.id
    LEFT JOIN users u ON br.user_id = u.id
    WHERE br.status = 'borrowed' AND br.due_date < datetime('now')
    ORDER BY br.due_date ASC
  `).all();

  res.json(records);
});

module.exports = router;
