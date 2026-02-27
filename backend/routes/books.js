const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/covers'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, keyword, category, status } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = `SELECT b.*, c.name as category_name 
             FROM books b 
             LEFT JOIN categories c ON b.category_id = c.id 
             WHERE 1=1`;
  let countSql = 'SELECT COUNT(*) as total FROM books WHERE 1=1';
  const params = [];
  const countParams = [];

  if (keyword) {
    sql += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)';
    countSql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword, likeKeyword);
    countParams.push(likeKeyword, likeKeyword, likeKeyword);
  }

  if (category) {
    sql += ' AND b.category_id = ?';
    countSql += ' AND category_id = ?';
    params.push(category);
    countParams.push(category);
  }

  if (status === 'available') {
    sql += ' AND b.available_copies > 0';
    countSql += ' AND available_copies > 0';
  } else if (status === 'unavailable') {
    sql += ' AND b.available_copies = 0';
    countSql += ' AND available_copies = 0';
  }

  sql += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const books = db.prepare(sql).all(...params);
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({
    data: books,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.get('/:id', (req, res) => {
  const book = db.prepare(`
    SELECT b.*, c.name as category_name 
    FROM books b 
    LEFT JOIN categories c ON b.category_id = c.id 
    WHERE b.id = ?
  `).get(req.params.id);

  if (!book) {
    return res.status(404).json({ error: '图书不存在' });
  }

  res.json(book);
});

router.post('/', authMiddleware, adminMiddleware, upload.single('cover'), (req, res) => {
  const { 
    isbn, title, author, publisher, publish_date, 
    category_id, total_copies, location, description 
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: '书名不能为空' });
  }

  const cover_image = req.file ? `/uploads/covers/${req.file.filename}` : null;
  const copies = total_copies ? parseInt(total_copies) : 1;

  try {
    const stmt = db.prepare(`
      INSERT INTO books (isbn, title, author, publisher, publish_date, category_id, 
                         total_copies, available_copies, location, description, cover_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(isbn, title, author, publisher, publish_date, category_id, 
                            copies, copies, location, description, cover_image);

    res.status(201).json({ 
      message: '图书添加成功',
      id: result.lastInsertRowid 
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'ISBN已存在' });
    }
    throw error;
  }
});

router.put('/:id', authMiddleware, adminMiddleware, upload.single('cover'), (req, res) => {
  const { id } = req.params;
  const { 
    isbn, title, author, publisher, publish_date, 
    category_id, total_copies, location, description 
  } = req.body;

  const existingBook = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
  if (!existingBook) {
    return res.status(404).json({ error: '图书不存在' });
  }

  const cover_image = req.file ? `/uploads/covers/${req.file.filename}` : existingBook.cover_image;
  
  const newTotal = total_copies ? parseInt(total_copies) : existingBook.total_copies;
  const diff = newTotal - existingBook.total_copies;
  const newAvailable = Math.max(0, existingBook.available_copies + diff);

  try {
    const stmt = db.prepare(`
      UPDATE books SET isbn = ?, title = ?, author = ?, publisher = ?, publish_date = ?,
                       category_id = ?, total_copies = ?, available_copies = ?, 
                       location = ?, description = ?, cover_image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(isbn, title, author, publisher, publish_date, category_id, 
             newTotal, newAvailable, location, description, cover_image, id);

    res.json({ message: '图书更新成功' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'ISBN已存在' });
    }
    throw error;
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  const borrowCount = db.prepare('SELECT COUNT(*) as count FROM borrow_records WHERE book_id = ? AND status = ?').get(id, 'borrowed');
  
  if (borrowCount.count > 0) {
    return res.status(400).json({ error: '该图书有未归还的借阅记录，无法删除' });
  }

  db.prepare('DELETE FROM books WHERE id = ?').run(id);
  res.json({ message: '图书删除成功' });
});

router.get('/category/list', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(categories);
});

module.exports = router;
