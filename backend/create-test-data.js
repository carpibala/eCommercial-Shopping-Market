// create-test-data.js - 完整版本
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

console.log('🚀 测试数据脚本开始...');

async function createTestData() {
  const baseURL = 'http://localhost:3003/api';
  
  console.log('📡 目标地址:', baseURL);
  console.log('-' .repeat(50));
  
  // 1. 首先测试服务器连接
  try {
    console.log('🔍 测试服务器连接...');
    const testResponse = await axios.get(baseURL + '/products', {
      timeout: 3000
    });
    console.log('✅ 服务器连接成功！');
    console.log(`📊 当前商品数量: ${testResponse.data.length}`);
  } catch (error) {
    console.error('❌ 连接服务器失败！');
    console.log('可能的原因：');
    console.log('  1. 服务器未运行 - 请运行: node server.js');
    console.log('  2. 端口错误 - 请检查 server.js 中的 PORT');
    console.log('  3. API 路由不存在 - 检查 /api/products 路由');
    console.log(`错误详情: ${error.message}`);
    process.exit(1);
  }
  
  // 2. 测试商品数据
  const products = [
    {
      id: uuidv4(),
      name: "RGB机械键盘 87键",
      price: 899.00,
      stock: 30,
      category: "keyboards",
      description: "全彩RGB背光，青轴手感，PBT键帽，支持宏编程",
      sellerId: "seller-test-id",
      images: [{ url: "https://via.placeholder.com/400x300/222/00FFFF?text=机械键盘" }],
      status: "published",
      salesCount: 156,
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      name: "电竞游戏鼠标 Pro版",
      price: 399.00,
      stock: 45,
      category: "mouses",
      description: "16000DPI，6个可编程按键，RGB灯效，超轻设计",
      sellerId: "seller-test-id",
      images: [{ url: "https://via.placeholder.com/400x300/222/00FFFF?text=游戏鼠标" }],
      status: "published",
      salesCount: 89,
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  console.log(`\n📦 准备创建 ${products.length} 个商品...`);
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let failCount = 0;
  
  // 3. 逐个创建商品
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    try {
      console.log(`[${i + 1}/${products.length}] 创建: ${product.name}`);
      console.log(`   价格: ¥${product.price} | 库存: ${product.stock}`);
      
      const response = await axios.post(baseURL + '/products', product, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✅ 创建成功`);
      successCount++;
      
    } catch (error) {
      console.error(`   ❌ 创建失败`);
      
      if (error.response) {
        // 服务器返回了错误
        console.log(`       状态码: ${error.response.status}`);
        if (error.response.data) {
          console.log(`       错误信息: ${JSON.stringify(error.response.data)}`);
        }
      } else if (error.request) {
        // 请求已发送但无响应
        console.log(`       网络错误: 服务器未响应`);
        console.log(`       请检查: 
          1. 服务器是否仍在运行
          2. API 路由是否正确`);
      } else {
        // 其他错误
        console.log(`       错误: ${error.message}`);
      }
      
      failCount++;
    }
    
    console.log('   ' + '-'.repeat(40));
  }
  
  // 4. 显示结果
  console.log('=' .repeat(60));
  console.log('📊 创建结果:');
  console.log(`   ✅ 成功: ${successCount} 个`);
  console.log(`   ❌ 失败: ${failCount} 个`);
  console.log('=' .repeat(60));
  
  // 5. 验证最终结果
  if (successCount > 0) {
    console.log('\n🔍 验证最终数据...');
    try {
      const finalCheck = await axios.get(baseURL + '/products');
      console.log(`🎉 完成！当前共有 ${finalCheck.data.length} 个商品`);
      console.log(`🛒 访问: http://localhost:3003/api/products`);
      
      // 显示创建的商品
      console.log('\n📋 创建的商品列表:');
      finalCheck.data.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} - ¥${item.price}`);
      });
      
    } catch (error) {
      console.log(`⚠️  验证失败: ${error.message}`);
    }
  } else {
    console.log('\n😞 没有成功创建任何商品');
    console.log('请检查:');
    console.log('  1. 服务器是否支持 POST /api/products');
    console.log('  2. 商品数据结构是否正确');
    console.log('  3. 查看 server.js 中的路由配置');
  }
  
  console.log('\n✨ 脚本执行完毕');
}

// 执行
createTestData().catch(error => {
  console.error('💥 脚本执行出错:', error.message);
  process.exit(1);
});