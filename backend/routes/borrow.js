const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware');

router.get('/', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 10, status, userId, bookId } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `SELECT br.*, b.title, b.author, b.isbn, u.username, u.name as user_name
             FROM borrow_records br
             LEFT JOIN books b ON br.book_id = b.id
             LEFT JOIN users u ON br.user_id = u.id
             WHERE 1=1`;
  let countSql = 'SELECT COUNT(*) as total FROM borrow_records WHERE 1=1';
  const params = [];
  const countParams = [];

  if (req.user.role !== 'admin') {
    sql += ' AND br.user_id = ?';
    countSql += ' AND user_id = ?';
    params.push(req.user.id);
    countParams.push(req.user.id);
  } else if (userId) {
    sql += ' AND br.user_id = ?';
    countSql += ' AND user_id = ?';
    params.push(userId);
    countParams.push(userId);
  }

  if (bookId) {
    sql += ' AND br.book_id = ?';
    countSql += ' AND book_id = ?';
    params.push(bookId);
    countParams.push(bookId);
  }

  if (status) {
    sql += ' AND br.status = ?';
    countSql += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }

  sql += ' ORDER BY br.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const records = db.prepare(sql).all(...params);
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({
    data: records,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.post('/borrow', authMiddleware, (req, res) => {
  const { bookId } = req.body;

  if (!bookId) {
    return res.status(400).json({ error: '请选择要借阅的图书' });
  }

  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
  if (!book) {
    return res.status(404).json({ error: '图书不存在' });
  }

  if (book.available_copies <= 0) {
    return res.status(400).json({ error: '该图书已无可借阅副本' });
  }

  const settings = db.prepare("SELECT value FROM system_settings WHERE key = 'borrow_days'").get();
  const borrowDays = parseInt(settings?.value || 30);

  const activeBorrows = db.prepare('SELECT COUNT(*) as count FROM borrow_records WHERE user_id = ? AND status = ?').get(req.user.id, 'borrowed');
  const maxBooksSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'max_borrow_books'").get();
  const maxBooks = parseInt(maxBooksSetting?.value || 5);

  if (activeBorrows.count >= maxBooks) {
    return res.status(400).json({ error: `您已达到最大借阅数量（${maxBooks}本），请先归还部分图书` });
  }

  const existingBorrow = db.prepare('SELECT id FROM borrow_records WHERE user_id = ? AND book_id = ? AND status = ?').get(req.user.id, bookId, 'borrowed');
  if (existingBorrow) {
    return res.status(400).json({ error: '您已借阅该图书，请先归还后再借阅' });
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + borrowDays);

  const insertStmt = db.prepare(`
    INSERT INTO borrow_records (user_id, book_id, due_date)
    VALUES (?, ?, ?)
  `);
  insertStmt.run(req.user.id, bookId, dueDate.toISOString());

  db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(bookId);

  res.status(201).json({ 
    message: '借阅成功',
    dueDate: dueDate.toISOString()
  });
});

router.post('/return', authMiddleware, (req, res) => {
  const { recordId } = req.body;

  if (!recordId) {
    return res.status(400).json({ error: '请提供借阅记录ID' });
  }

  const record = db.prepare(`
    SELECT br.*, b.title 
    FROM borrow_records br
    LEFT JOIN books b ON br.book_id = b.id
    WHERE br.id = ?
  `).get(recordId);

  if (!record) {
    return res.status(404).json({ error: '借阅记录不存在' });
  }

  if (req.user.role !== 'admin' && record.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此借阅记录' });
  }

  if (record.status === 'returned') {
    return res.status(400).json({ error: '该图书已归还' });
  }

  const now = new Date();
  const dueDate = new Date(record.due_date);
  let fineAmount = 0;

  if (now > dueDate) {
    const fineSetting = db.prepare("SELECT value FROM system_settings WHERE key = 'fine_per_day'").get();
    const finePerDay = parseFloat(fineSetting?.value || 0.5);
    const overdueDays = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
    fineAmount = overdueDays * finePerDay;
  }

  const updateStmt = db.prepare(`
    UPDATE borrow_records 
    SET return_date = ?, status = 'returned', fine_amount = ?
    WHERE id = ?
  `);
  updateStmt.run(now.toISOString(), fineAmount, recordId);

  db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(record.book_id);

  res.json({ 
    message: '归还成功',
    fineAmount,
    overdue: fineAmount > 0
  });
});

router.post('/renew', authMiddleware, (req, res) => {
  const { recordId } = req.body;

  if (!recordId) {
    return res.status(400).json({ error: '请提供借阅记录ID' });
  }

  const record = db.prepare('SELECT * FROM borrow_records WHERE id = ?').get(recordId);

  if (!record) {
    return res.status(404).json({ error: '借阅记录不存在' });
  }

  if (req.user.role !== 'admin' && record.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此借阅记录' });
  }

  if (record.status === 'returned') {
    return res.status(400).json({ error: '该图书已归还，无法续借' });
  }

  const settings = db.prepare("SELECT value FROM system_settings WHERE key = 'borrow_days'").get();
  const borrowDays = parseInt(settings?.value || 30);

  const newDueDate = new Date(record.due_date);
  newDueDate.setDate(newDueDate.getDate() + borrowDays);

  db.prepare('UPDATE borrow_records SET due_date = ? WHERE id = ?').run(newDueDate.toISOString(), recordId);

  res.json({ 
    message: '续借成功',
    newDueDate: newDueDate.toISOString()
  });
});

router.get('/overdue', authMiddleware, adminMiddleware, (req, res) => {
  const records = db.prepare(`
    SELECT br.*, b.title, b.author, u.username, u.name as user_name, u.phone
    FROM borrow_records br
    LEFT JOIN books b ON br.book_id = b.id
    LEFT JOIN users u ON br.user_id = u.id
    WHERE br.status = 'borrowed' AND br.due_date < datetime('now')
    ORDER BY br.due_date ASC
  `).all();

  res.json(records);
});

module.exports = router;
