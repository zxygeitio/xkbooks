const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads/covers');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

require('./database');

const usersRouter = require('./routes/users');
const booksRouter = require('./routes/books');
const borrowRouter = require('./routes/borrow');
const categoriesRouter = require('./routes/categories');
const statisticsRouter = require('./routes/statistics');

app.use('/api/auth', usersRouter);
app.use('/api/books', booksRouter);
app.use('/api/borrow', borrowRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/statistics', statisticsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
