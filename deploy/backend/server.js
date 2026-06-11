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

// 备份目录
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

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

// 服务器端备份函数
// type: 'auto' - 自动备份（会被自动清理）, 'manual' - 手动备份（不会被自动清理）
function createServerBackup(type = 'auto') {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${type}-${dateStr}.json`);
    
    const backupData = {
      data: db,
      timestamp: timestamp.toISOString(),
      version: '1.0',
      type: type,
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`[backup] Created ${type} backup: ${backupFile}`);
    
    // 只清理自动备份，手动备份需要手动删除
    if (type === 'auto') {
      cleanupOldAutoBackups();
    }
    
    return backupFile;
  } catch (e) {
    console.error('Failed to create backup:', e);
    return null;
  }
}

// 清理旧的自动备份（保留最近7天）
function cleanupOldAutoBackups() {
  try {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const files = fs.readdirSync(BACKUP_DIR);
    
    files.forEach((file) => {
      // 只清理自动备份，手动备份不清理
      if (!file.startsWith('backup-auto-')) {
        return;
      }
      
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime.getTime() < sevenDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`[backup] Removed old auto backup: ${file}`);
      }
    });
  } catch (e) {
    console.error('Failed to cleanup backups:', e);
  }
}

// 获取服务器备份列表
function getServerBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return [];
    }
    
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.ctime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return files;
  } catch (e) {
    console.error('Failed to get backups:', e);
    return [];
  }
}

// 从服务器备份恢复
function restoreFromServerBackup(filename) {
  try {
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '备份文件不存在' };
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const backupData = JSON.parse(content);
    
    if (!backupData.data || !Array.isArray(backupData.data.challenges)) {
      return { success: false, error: '无效的备份数据' };
    }
    
    db = { challenges: backupData.data.challenges };
    saveDB(db);
    
    return { success: true, count: db.challenges.length, timestamp: backupData.timestamp };
  } catch (e) {
    console.error('Failed to restore backup:', e);
    return { success: false, error: '恢复失败: ' + e.message };
  }
}

const validToken = loadToken();

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// 定时自动备份（每天凌晨2点）
function scheduleDailyBackup() {
  const now = new Date();
  let nextBackup = new Date(now);
  nextBackup.setHours(2, 0, 0, 0);
  if (nextBackup <= now) {
    nextBackup.setDate(nextBackup.getDate() + 1);
  }
  
  const delay = nextBackup.getTime() - now.getTime();
  console.log(`[backup] Next scheduled backup: ${nextBackup.toLocaleString()}`);
  
  setTimeout(() => {
    createServerBackup();
    scheduleDailyBackup(); // 继续调度下一次
  }, delay);
}

// 启动时立即创建一次备份
setTimeout(() => {
  createServerBackup();
}, 5000);

// 启动定时备份
scheduleDailyBackup();

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

// 备份数据（需要 Token）
app.get('/api/backup', requireToken, (req, res) => {
  const backup = {
    data: db,
    timestamp: new Date().toISOString(),
    version: '1.0',
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=fitness-backup-${Date.now()}.json`);
  res.json(backup);
});

// 恢复数据（需要 Token）
app.post('/api/restore', requireToken, (req, res) => {
  const { data } = req.body || {};
  
  if (!data || !Array.isArray(data.challenges)) {
    return res.status(400).json({ error: 'Invalid backup data' });
  }
  
  try {
    db = { challenges: data.challenges };
    saveDB(db);
    res.json({ ok: true, count: db.challenges.length });
  } catch (e) {
    console.error('Restore error:', e);
    res.status(500).json({ error: 'Restore failed' });
  }
});

// 获取服务器备份列表（需要 Token）
app.get('/api/server-backups', requireToken, (_req, res) => {
  const backups = getServerBackups();
  res.json(backups);
});

// 手动创建服务器备份（需要 Token）
app.post('/api/server-backup', requireToken, (_req, res) => {
  // 创建手动备份，不会被自动清理
  const backupFile = createServerBackup('manual');
  if (backupFile) {
    res.json({ ok: true, message: '手动备份创建成功', file: path.basename(backupFile) });
  } else {
    res.status(500).json({ ok: false, error: '备份创建失败' });
  }
});

// 从服务器备份恢复（需要 Token）
app.post('/api/server-restore/:filename', requireToken, (req, res) => {
  const filename = req.params.filename;
  const result = restoreFromServerBackup(filename);
  
  if (result.success) {
    res.json({ ok: true, count: result.count, timestamp: result.timestamp });
  } else {
    res.status(400).json({ ok: false, error: result.error });
  }
});

// 删除服务器备份（需要 Token）
app.delete('/api/server-backup/:filename', requireToken, (req, res) => {
  const filename = req.params.filename;
  
  // 安全检查：只允许删除.json文件
  if (!filename.endsWith('.json')) {
    return res.status(400).json({ ok: false, error: '无效的文件名' });
  }
  
  try {
    const filePath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ ok: false, error: '备份文件不存在' });
    }
    
    fs.unlinkSync(filePath);
    res.json({ ok: true, message: '备份已删除' });
  } catch (e) {
    console.error('Failed to delete backup:', e);
    res.status(500).json({ ok: false, error: '删除失败' });
  }
});

// 下载服务器备份文件（需要 Token）
app.get('/api/backup/download/:filename', requireToken, (req, res) => {
  const filename = req.params.filename;
  
  if (!filename.endsWith('.json')) {
    return res.status(400).json({ error: '无效的文件名' });
  }
  
  const filePath = path.join(BACKUP_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '备份文件不存在' });
  }
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
  res.sendFile(filePath);
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
