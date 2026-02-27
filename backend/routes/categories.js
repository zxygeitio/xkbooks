const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware, adminMiddleware } = require('../middleware');

router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(b.id) as book_count
    FROM categories c
    LEFT JOIN books b ON c.id = b.category_id
    GROUP BY c.id
    ORDER BY c.name
  `).all();
  
  res.json(categories);
});

router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: '分类名称不能为空' });
  }

  try {
    const stmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    const result = stmt.run(name, description);
    
    res.status(201).json({ 
      message: '分类添加成功',
      id: result.lastInsertRowid 
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '分类名称已存在' });
    }
    throw error;
  }
});

router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: '分类名称不能为空' });
  }

  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '分类不存在' });
  }

  try {
    db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name, description, id);
    res.json({ message: '分类更新成功' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '分类名称已存在' });
    }
    throw error;
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books WHERE category_id = ?').get(id);
  
  if (bookCount.count > 0) {
    return res.status(400).json({ error: '该分类下有图书，无法删除' });
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: '分类删除成功' });
});

module.exports = router;
