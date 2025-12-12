// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();
const PORT = 3003;
const JWT_SECRET = 'shopping_site_secret_2024_v2'; // 生产建议放环境变量

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// 提供静态文件服务（前端页面）
app.use(express.static(path.join(__dirname, '..')));

// 数据目录
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// 确保目录
async function ensureDataDir() {
  try { await fs.access(DATA_DIR); } catch { await fs.mkdir(DATA_DIR); }
}

// 简易 JSON 数据库操作类
class Store {
  constructor(filePath, defaultValue = []) {
    this.filePath = filePath;
    this.defaultValue = defaultValue;
  }
  async get() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.writeFile(this.filePath, JSON.stringify(this.defaultValue, null, 2));
        return this.defaultValue;
      }
      throw err;
    }
  }
  async save(data) {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }
  async find(cb) {
    const arr = await this.get();
    return arr.find(cb);
  }
  async filter(cb) {
    const arr = await this.get();
    return arr.filter(cb);
  }
  async push(item) {
    const arr = await this.get();
    arr.push(item);
    await this.save(arr);
    return item;
  }
  async update(id, updates) {
    return this.get().then(arr => {
      const idx = arr.findIndex(x => x.id === id);
      if (idx === -1) throw new Error('Not found');
      arr[idx] = { ...arr[idx], ...updates, updatedAt: new Date().toISOString() };
      return this.save(arr).then(() => arr[idx]);
    });
  }
}

// 创建 Store 实例
const userStore = new Store(USERS_FILE, []);
const productStore = new Store(PRODUCTS_FILE, []);
const orderStore = new Store(ORDERS_FILE, []);
const reviewStore = new Store(REVIEWS_FILE, []);

// JWT 验证中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: '未登录' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.role = payload.role;
    next();
  } catch (err) {
    res.status(401).json({ message: '登录已过期' });
  }
}

// 上传配置
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('只允许图片'));
  }
});

// 路由
app.use('/api/auth', require('./routes/auth')(userStore));
app.use('/api/products', require('./routes/products')(productStore, reviewStore, upload, authMiddleware, userStore));
app.use('/api/orders', authMiddleware, require('./routes/order')(userStore, productStore, orderStore));
app.use('/api/user', authMiddleware, require('./routes/user')(userStore, productStore, reviewStore));

// 根路径重定向到首页
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

// 反馈API
app.post('/api/feedback', async (req, res) => {
    const { name, email, content } = req.body;
    const feedbacks = await new Store(path.join(DATA_DIR, 'feedbacks.json'), []).get();
    feedbacks.push({
        id: Date.now(),
        name,
        email,
        content,
        createdAt: new Date().toISOString()
    });
    await new Store(path.join(DATA_DIR, 'feedbacks.json')).save(feedbacks);
    res.json({ message: '反馈已提交，感谢支持！' });
});

// 启动
async function start() {
  await ensureDataDir();
  // 初始化默认数据（只在第一次运行时）
  const users = await userStore.get();
  if (users.length === 0) {
    // 创建一个测试买家
    const hash = await bcrypt.hash('123456', 10);
    await userStore.push({
      id: uuidv4(),
      name: '测试买家',
      email: 'buyer@test.com',
      password: hash,
      role: 'user',
      cart: [],
      favorites: [],
      createdAt: new Date().toISOString()
    });
    // 创建一个测试商家
    await userStore.push({
      id: uuidv4(),
      name: '极速科技',
      email: 'seller@test.com',
      password: hash,
      role: 'seller',
      companyName: '极速科技有限公司',
      createdAt: new Date().toISOString()
    });
  }

  app.listen(PORT, () => {
    console.log(`后端运行：http://localhost:${PORT}`);
    console.log(`图片访问：http://localhost:${PORT}/uploads/xxx.jpg`);
  });
}

start().catch(console.error);