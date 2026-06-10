import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '159357';
const PORT = Number(process.env.PORT) || 3000;

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

// 健康检查
app.get('/api/health', (_req, res) => res.json({ ok: true, count: db.challenges.length }));

// 图片上传
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// 列表 + 创建
app.get('/api/challenges', (_req, res) => res.json(db.challenges));

app.post('/api/challenges', (req, res) => {
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

app.put('/api/challenges/:id', (req, res) => {
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

app.delete('/api/challenges/:id', (req, res) => {
  const idx = db.challenges.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const deleted = db.challenges.splice(idx, 1)[0];
  saveDB(db);
  res.json({ ok: true, deleted });
});

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
});
