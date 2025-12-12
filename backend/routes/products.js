// backend/routes/products.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

module.exports = function(productStore, reviewStore, upload, authMiddleware, userStore) {
    
    // 获取所有商品
    router.get('/', async (req, res) => {
        try {
            const { category, featured, sellerId } = req.query;
            let products = await productStore.get();
            
            if (category) {
                products = products.filter(p => p.category === category);
            }
            
            if (featured === 'true') {
                products = products.filter(p => p.isFeatured);
            }
            
            if (sellerId) {
                products = products.filter(p => p.sellerId === sellerId);
            }
            
            res.json(products);
        } catch (error) {
            console.error('获取商品错误:', error);
            res.status(500).json({ message: '获取商品失败' });
        }
    });
    
    // 获取单个商品
    router.get('/:id', async (req, res) => {
        try {
            const product = await productStore.find(p => p.id === req.params.id);
            if (!product) {
                return res.status(404).json({ message: '商品不存在' });
            }
            res.json(product);
        } catch (error) {
            console.error('获取商品详情错误:', error);
            res.status(500).json({ message: '获取商品详情失败' });
        }
    });
    
    // 获取商品评论
    router.get('/:id/reviews', async (req, res) => {
        try {
            const reviews = await reviewStore.filter(r => r.productId === req.params.id);
            res.json(reviews);
        } catch (error) {
            console.error('获取评论错误:', error);
            res.status(500).json({ message: '获取评论失败' });
        }
    });
    
    // 发表评论
    router.post('/:id/reviews', async (req, res) => {
        try {
            const { rating, comment } = req.body;
            const userId = req.userId;
            
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ message: '请提供有效的评分（1-5）' });
            }
            
            const review = {
                id: uuidv4(),
                productId: req.params.id,
                userId,
                userName: req.user.name,
                rating: parseInt(rating),
                comment: comment || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await reviewStore.push(review);
            
            // 更新商品评分
            const productReviews = await reviewStore.filter(r => r.productId === req.params.id);
            const averageRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
            
            await productStore.update(req.params.id, {
                averageRating,
                reviewCount: productReviews.length
            });
            
            res.json({
                message: '评论发表成功',
                review
            });
        } catch (error) {
            console.error('发表评论错误:', error);
            res.status(500).json({ message: '发表评论失败' });
        }
    });
    
    // 商家上架商品
    router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
        try {
            const { name, description, price, stock, category, specifications } = req.body;
            const sellerId = req.userId;
            
            if (!name || !price || !stock) {
                return res.status(400).json({ message: '请填写商品名称、价格和库存' });
            }
            
            // 获取用户信息
            const user = await userStore.find(u => u.id === sellerId);
            if (!user) {
                return res.status(404).json({ message: '用户不存在' });
            }
            
            // 解析规格
            let specsObj = {};
            if (specifications) {
                try {
                    specsObj = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
                } catch {
                    specsObj = {};
                }
            }
            
            // 处理图片
            let images = [];
            if (req.file) {
                images.push({
                    url: `/uploads/${req.file.filename}`,
                    alt: name
                });
            } else {
                images.push({
                    url: 'images/微信图片_20251206235409.png',
                    alt: name
                });
            }
            
            const product = {
                id: uuidv4(),
                name,
                description: description || '',
                price: parseFloat(price),
                originalPrice: parseFloat(price) * 1.3,
                category: category || 'electronics',
                images,
                stock: parseInt(stock),
                specifications: specsObj,
                sellerId,
                sellerName: user.companyName || user.name,
                status: 'published',
                salesCount: 0,
                averageRating: 0,
                reviewCount: 0,
                tags: [],
                isFeatured: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const savedProduct = await productStore.push(product);
            console.log('商品上架成功:', savedProduct.name, '商家:', user.name);
            res.json({
                message: '商品上架成功',
                product: savedProduct
            });
        } catch (error) {
            console.error('上架商品错误:', error);
            res.status(500).json({ message: '上架商品失败' });
        }
    });
    
    // 更新商品信息
    router.put('/:id', authMiddleware, async (req, res) => {
        try {
            const { name, price, stock, description } = req.body;
            const productId = req.params.id;
            
            const product = await productStore.find(p => p.id === productId);
            if (!product) {
                return res.status(404).json({ message: '商品不存在' });
            }
            
            if (product.sellerId !== req.userId) {
                return res.status(403).json({ message: '无权操作此商品' });
            }
            
            const updates = {};
            if (name !== undefined) updates.name = name;
            if (price !== undefined) updates.price = parseFloat(price);
            if (stock !== undefined) updates.stock = parseInt(stock);
            if (description !== undefined) updates.description = description;
            
            const updatedProduct = await productStore.update(productId, updates);
            res.json({
                message: '商品更新成功',
                product: updatedProduct
            });
        } catch (error) {
            console.error('更新商品错误:', error);
            res.status(500).json({ message: '更新商品失败' });
        }
    });
    
    // 更新商品状态
    router.put('/:id/status', authMiddleware, async (req, res) => {
        try {
            const { status } = req.body;
            const productId = req.params.id;
            
            const product = await productStore.find(p => p.id === productId);
            if (!product) {
                return res.status(404).json({ message: '商品不存在' });
            }
            
            if (product.sellerId !== req.userId) {
                return res.status(403).json({ message: '无权操作此商品' });
            }
            
            const updatedProduct = await productStore.update(productId, { status });
            res.json({
                message: `商品已${status === 'published' ? '上架' : '下架'}`,
                product: updatedProduct
            });
        } catch (error) {
            console.error('更新商品状态错误:', error);
            res.status(500).json({ message: '更新商品状态失败' });
        }
    });
    
    return router;
};