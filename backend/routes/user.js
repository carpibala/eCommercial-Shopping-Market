// routes/user.js
const express = require('express');
const router = express.Router();

module.exports = function(userStore, productStore, reviewStore) {

  // 获取当前用户信息（含购物车）
  router.get('/me', async (req, res) => {
    const user = await userStore.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // 添加到购物车
  router.post('/cart', async (req, res) => {
    const { productId, quantity = 1, specs } = req.body;
    const product = await productStore.find(p => p.id === productId);
    if (!product) return res.status(404).json({ message: '商品不存在' });

    const user = await userStore.find(u => u.id === req.userId);
    const existIdx = user.cart.findIndex(i => i.productId === productId && JSON.stringify(i.specs) === JSON.stringify(specs));

    if (existIdx > -1) {
      user.cart[existIdx].quantity += quantity;
    } else {
      user.cart.push({
        productId,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || '',
        specs: specs || {},
        quantity
      });
    }

    await userStore.update(req.userId, { cart: user.cart });
    res.json({ message: '已加入购物车' });
  });

  // 获取购物车
  router.get('/cart', async (req, res) => {
    const user = await userStore.find(u => u.id === req.userId);
    res.json(user.cart || []);
  });

  // 更新购物车（数量、选中状态）
  router.put('/cart', async (req, res) => {
    const { cart } = req.body;
    await userStore.update(req.userId, { cart });
    res.json({ message: '更新成功' });
  });

  // 清空购物车（下单后会用到）
  router.delete('/cart', async (req, res) => {
    await userStore.update(req.userId, { cart: [] });
    res.json({ message: '已清空' });
  });

  return router;
};