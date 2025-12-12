// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = 'shopping_site_secret_2024_v2';

module.exports = function(userStore) {
  const router = express.Router();

  // 注册
  router.post('/register', async (req, res) => {
    try {
      const { name, email, password, role, companyName, license } = req.body;

      // 必填校验
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: '请填写完整信息' });
      }

      // 商家额外校验
      if (role === 'seller' && (!companyName || !license)) {
        return res.status(400).json({ message: '商家需填写公司名和营业执照' });
      }

      // 检查邮箱是否已注册
      const exists = await userStore.find(u => u.email === email);
      if (exists) {
        return res.status(400).json({ message: '该邮箱已被注册' });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户（关键：去掉多余的 { ）
      const user = {
        id: uuidv4(),
        name,
        email,
        password: hashedPassword,
        role, // 'user' 或 'seller'
        companyName: role === 'seller' ? companyName : undefined,
        license: role === 'seller' ? license : undefined,
        cart: [],
        favorites: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await userStore.push(user);

      // 生成 token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // 返回成功（不返回密码！）
      const { password: _, ...safeUser } = user;

      res.json({
        message: '注册成功',
        token,
        user: safeUser
      });

    } catch (error) {
      console.error('注册失败:', error);
      res.status(500).json({ message: '服务器错误，请稍后重试' });
    }
  });

  // 登录
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: '请输入邮箱和密码' });
      }

      const user = await userStore.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ message: '邮箱或密码错误' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message:'邮箱或密码错误' });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...safeUser } = user;

      res.json({
        message: '登录成功',
        token,
        user: safeUser
      });

    } catch (error) {
      console.error('登录失败:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  });

  return router;
};