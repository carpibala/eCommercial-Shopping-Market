// backend/routes/order.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

module.exports = function(userStore, productStore, orderStore) {
    
    // 创建订单
    router.post('/place-order', async (req, res) => {
        try {
            const { address, paymentMethod, deliveryMethod, notes } = req.body;
            const userId = req.userId;
            
            if (!address || !paymentMethod) {
                return res.status(400).json({ message: '请填写收货地址和支付方式' });
            }
            
            const user = await userStore.find(u => u.id === req.userId);
            if (!user) {
                return res.status(404).json({ message: '用户不存在' });
            }
            
            // 获取购物车商品（如果没有selected字段，则认为所有商品都被选中）
            const cartItems = (user.cart || []).filter(item => item.selected !== false);
            
            if (cartItems.length === 0) {
                return res.status(400).json({ message: '购物车为空，请先添加商品' });
            }
            
            // 计算总价
            const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const shippingFee = deliveryMethod === 'express' ? 20 : 0;
            const discount = 0;
            const total = subtotal - discount + shippingFee;
            
            // 生成订单号
            const orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
            
            // 创建订单
            const order = {
                id: uuidv4(),
                orderNumber,
                userId,
                userName: user.name,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    specifications: item.specs
                })),
                shippingAddress: address,
                paymentMethod,
                paymentStatus: 'pending',
                amount: {
                    subtotal,
                    shippingFee,
                    discount,
                    total
                },
                deliveryMethod: deliveryMethod || 'standard',
                deliveryStatus: 'pending',
                status: 'pending',
                notes: notes || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await orderStore.push(order);
            
            // 清空购物车（下单成功后清空所有商品）
            await userStore.update(userId, { cart: [] });
            
            res.json({
                message: '订单创建成功',
                orderId: order.id,
                orderNumber: order.orderNumber
            });
        } catch (error) {
            console.error('创建订单错误:', error);
            res.status(500).json({ message: '创建订单失败' });
        }
    });
    
    // 获取用户订单
    router.get('/', async (req, res) => {
        try {
            const userId = req.userId;
            const orders = await orderStore.filter(o => o.userId === userId);
            res.json(orders);
        } catch (error) {
            console.error('获取订单错误:', error);
            res.status(500).json({ message: '获取订单失败' });
        }
    });
    
    return router;
};