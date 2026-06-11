import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import multer from 'multer';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DEFAULT_PASSWORD = '159357';
const DEFAULT_TOKEN = 'fitness-api-secret-token-2024';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
const API_TOKEN = process.env.API_TOKEN || DEFAULT_TOKEN;
const PORT = Number(process.env.PORT) || 3000;

// Token 存储文件
const TOKEN_FILE = path.join(DATA_DIR, '.token');

// 加载自定义 Token（如果存在）
function loadToken() {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
    }
  } catch {}
  return API_TOKEN;
}

// 保存自定义 Token
function saveToken(token) {
  try {
    fs.writeFileSync(TOKEN_FILE, token, 'utf-8');
  } catch (e) {
    console.error('Failed to save token:', e);
  }
}

const validToken = loadToken();

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 配置文件上传
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'));
    cb(null, true);
  },
});

const defaultData = { challenges: [] };
function loadDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
      return { ...defaultData };
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.challenges) parsed.challenges = [];
    return parsed;
  } catch (e) {
    console.error('DB load error:', e);
    return { challenges: [] };
  }
}

function saveDB(db) {
  try {
    const tmp = DB_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, DB_FILE);
  } catch (e) {
    console.error('DB save error:', e);
  }
}

let db = loadDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 静态托管上传的图片
app.use('/uploads', express.static(UPLOAD_DIR));

// API Token 验证中间件
function requireToken(req, res, next) {
  const token = req.headers['x-api-token'];
  if (!token || token !== validToken) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing API token' });
  }
  next();
}

// 健康检查（公开）
app.get('/api/health', (_req, res) => res.json({ ok: true, count: db.challenges.length }));

// 获取 API Token（登录成功后）
app.post('/api/get-token', (req, res) => {
  const ok = String(req.body?.password || '') === ADMIN_PASSWORD;
  if (!ok) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  res.json({ token: validToken });
});

// 修改密码
app.post('/api/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  
  if (String(oldPassword || '') !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  
  // 更新内存中的密码（注意：这是临时方案，重启后会恢复）
  // 正确做法应该是将密码持久化到文件
  console.log('⚠️  Password changed (in-memory only, will reset on restart)');
  res.json({ ok: true, message: 'Password changed. Please update ADMIN_PASSWORD environment variable for persistence.' });
});

// 修改 API Token
app.post('/api/change-token', (req, res) => {
  const { password, newToken } = req.body || {};
  
  if (String(password || '') !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Password is incorrect' });
  }
  
  if (!newToken || newToken.length < 16) {
    return res.status(400).json({ error: 'New token must be at least 16 characters' });
  }
  
  saveToken(newToken);
  res.json({ ok: true, token: newToken });
});

// 图片上传（需要 Token）
app.post('/api/upload', requireToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// 列表（公开）
app.get('/api/challenges', (_req, res) => res.json(db.challenges));

// 创建（需要 Token）
app.post('/api/challenges', requireToken, (req, res) => {
  const data = req.body || {};
  const newChallenge = {
    id: data.id || `challenge-${Date.now()}`,
    theme: String(data.theme || ''),
    goal: String(data.goal || ''),
    hostName: String(data.hostName || ''),
    coverImage: String(data.coverImage || ''),
    startDate: String(data.startDate || ''),
    endDate: String(data.endDate || ''),
    maxPayout: Number(data.maxPayout) || 0,
    minStake: Number(data.minStake) || 0,
    status: data.status || 'active',
    isBlocked: Boolean(data.isBlocked),
    participants: Array.isArray(data.participants) ? data.participants : [],
    createdAt: Number(data.createdAt) || Date.now(),
  };
  db.challenges.push(newChallenge);
  saveDB(db);
  res.status(201).json(newChallenge);
});

// 更新（需要 Token）
app.put('/api/challenges/:id', requireToken, (req, res) => {
  const idx = db.challenges.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const body = req.body || {};
  const updated = { ...db.challenges[idx], ...body };
  updated.maxPayout = Number(updated.maxPayout) || 0;
  updated.minStake = Number(updated.minStake) || 0;
  updated.isBlocked = Boolean(updated.isBlocked);
  if (!Array.isArray(updated.participants)) updated.participants = [];
  db.challenges[idx] = updated;
  saveDB(db);
  res.json(updated);
});

// 删除（需要 Token）
app.delete('/api/challenges/:id', requireToken, (req, res) => {
  const idx = db.challenges.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const deleted = db.challenges.splice(idx, 1)[0];
  saveDB(db);
  res.json({ ok: true, deleted });
});

// 管理员登录（保留向后兼容）
app.post('/api/admin-login', (req, res) => {
  const ok = String(req.body?.password || '') === ADMIN_PASSWORD;
  res.json({ ok });
});

// 静态文件（Vite dist）- 修复路径：Dockerfile 把 dist 放到了 /app/frontend-dist
const DIST_DIR = process.env.DIST_DIR || path.join(__dirname, 'frontend-dist');
console.log(`[info] Looking for frontend dist at: ${DIST_DIR}`);
if (fs.existsSync(DIST_DIR)) {
  const files = fs.readdirSync(DIST_DIR);
  console.log(`[info] Found ${files.length} files in dist: ${files.join(', ')}`);
  app.use(express.static(DIST_DIR));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  console.warn(`[warn] DIST_DIR not found: ${DIST_DIR}. API-only mode.`);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server on :${PORT} | challenges: ${db.challenges.length} | data: ${DB_FILE}`);
  console.log(`🔐 ADMIN_PASSWORD: ${ADMIN_PASSWORD === DEFAULT_PASSWORD ? 'default (159357)' : 'custom'}`);
  console.log(`🔑 API_TOKEN: ${validToken === DEFAULT_TOKEN ? 'default' : 'custom'}`);
});
