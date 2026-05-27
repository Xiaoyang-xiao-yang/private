require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// ─── 中间件 ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── 数据库连接池（带重试，等待 MySQL 就绪）─────────────────
let pool;

async function createPool(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
      });

      // 创建数据库（不存在时）
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
      await conn.query(`USE \`${process.env.DB_NAME}\``);

      // 创建 todos 表（不存在时）
      await conn.query(`
        CREATE TABLE IF NOT EXISTS todos (
          id        INT AUTO_INCREMENT PRIMARY KEY,
          title     VARCHAR(255) NOT NULL,
          completed TINYINT(1)   NOT NULL DEFAULT 0,
          created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.end();

      // 创建连接池（已确保数据库存在）
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10
      });

      console.log('✅ MySQL 连接成功，数据库和表已就绪');
      return;
    } catch (err) {
      console.log(`⏳ 等待 MySQL（第 ${i + 1}/${retries} 次）... ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error('❌ MySQL 连接失败，服务退出');
  process.exit(1);
}

// ─── 路由 ─────────────────────────────────────────────────

// 获取所有待办
app.get('/api/todos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 新增待办
app.post('/api/todos', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: '标题不能为空' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO todos (title) VALUES (?)',
      [title.trim()]
    );
    const [rows] = await pool.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新待办（标题 / 完成状态）
app.put('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  try {
    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push('title = ?'); values.push(title.trim()); }
    if (completed !== undefined) { fields.push('completed = ?'); values.push(completed ? 1 : 0); }
    if (fields.length === 0) return res.status(400).json({ error: '没有可更新的字段' });

    values.push(id);
    await pool.query(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT * FROM todos WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: '待办不存在' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除待办
app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM todos WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: '待办不存在' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 启动 ─────────────────────────────────────────────────
createPool().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 后端服务运行在 http://localhost:${PORT}`);
  });
});
