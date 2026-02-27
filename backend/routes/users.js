const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authMiddleware, adminMiddleware, generateToken } = require('../middleware');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user);
  
  res.json({
    message: '登录成功',
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, name, email, phone } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  
  if (existingUser) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const stmt = db.prepare('INSERT INTO users (username, password, name, email, phone) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(username, hashedPassword, name || username, email, phone);

  res.status(201).json({ 
    message: '注册成功',
    userId: result.lastInsertRowid 
  });
});

router.get('/profile', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, name, email, phone, role, created_at FROM users WHERE id = ?').get(req.user.id);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json(user);
});

router.put('/profile', authMiddleware, (req, res) => {
  const { name, email, phone } = req.body;
  
  const stmt = db.prepare('UPDATE users SET name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(name, email, phone, req.user.id);

  res.json({ message: '个人信息更新成功' });
});

router.put('/password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '旧密码和新密码不能为空' });
  }

  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
  
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(400).json({ error: '旧密码错误' });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, req.user.id);

  res.json({ message: '密码修改成功' });
});

router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  const { page = 1, pageSize = 10, keyword, role } = req.query;
  const offset = (page - 1) * pageSize;
  
  let sql = 'SELECT id, username, name, email, phone, role, created_at FROM users WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const params = [];
  const countParams = [];

  if (keyword) {
    sql += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)';
    countSql += ' AND (username LIKE ? OR name LIKE ? OR email LIKE ?)';
    const likeKeyword = `%${keyword}%`;
    params.push(likeKeyword, likeKeyword, likeKeyword);
    countParams.push(likeKeyword, likeKeyword, likeKeyword);
  }

  if (role) {
    sql += ' AND role = ?';
    countSql += ' AND role = ?';
    params.push(role);
    countParams.push(role);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);

  const users = db.prepare(sql).all(...params);
  const { total } = db.prepare(countSql).get(...countParams);

  res.json({
    data: users,
    pagination: {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total
    }
  });
});

router.put('/users/:id/role', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: '无效的角色' });
  }

  db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role, id);
  res.json({ message: '用户角色更新成功' });
});

router.delete('/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: '不能删除自己的账号' });
  }

  const borrowCount = db.prepare('SELECT COUNT(*) as count FROM borrow_records WHERE user_id = ? AND status = ?').get(id, 'borrowed');
  
  if (borrowCount.count > 0) {
    return res.status(400).json({ error: '该用户有未归还的图书，无法删除' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ message: '用户删除成功' });
});

module.exports = router;
