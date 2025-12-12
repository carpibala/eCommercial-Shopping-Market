    // jQuery购物车
    $(document).ready(function() {
    
    // ----------------------------------------------------
    // 1. 购物车数据存储（本地模拟）
    // ----------------------------------------------------
    
    // 模拟的购物车数据，实际项目中应从后端 API 或 localStorage 加载
    let cartItems = [
        { id: 101, name: '极光机械键盘', specs: '颜色：电光蓝；轴体：茶轴', price: 999.00, quantity: 1, image: 'https://via.placeholder.com/80x80/222222/FFFFFF?text=ProductA', selected: true },
        { id: 102, name: '超频游戏鼠标', specs: 'DPI：16000；配色：暗夜黑', price: 299.00, quantity: 2, image: 'https://via.placeholder.com/80x80/222222/FFFFFF?text=ProductB', selected: false }
    ];

    // ----------------------------------------------------
    // 2. 加载与渲染逻辑
    // ----------------------------------------------------
    
    function loadCartData() {
        // 实际：可以尝试从 localStorage 或通过 AJAX 从后端加载数据
        // 简化：我们使用上面定义的 'cartItems' 数组
        
        if ($('#cartItemListContainer').length) {
            renderCartItems(cartItems);
            updateSummary();
        }
    }

    function renderCartItems(items) {
        const $container = $('#cartItemListContainer');
        $container.empty(); // 清空现有内容

        if (items.length === 0) {
            $container.html('<p style="text-align: center; padding: 50px; color: #999;">您的购物车空空如也，快去购物吧！</p>');
            return;
        }

        items.forEach(item => {
            const subtotal = (item.price * item.quantity).toFixed(2);
            const itemHtml = `
                <div class="cart-item" data-id="${item.id}" data-price="${item.price}">
                    <span class="col-checkbox">
                        <input type="checkbox" data-id="${item.id}" class="item-checkbox" ${item.selected ? 'checked' : ''}>
                    </span>
                    <div class="col-info">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="item-details">
                            <p class="item-name">${item.name}</p>
                            <p class="item-specs">${item.specs}</p>
                        </div>
                    </div>
                    <span class="col-price">¥ ${item.price.toFixed(2)}</span>
                    <div class="col-quantity">
                        <button class="quantity-minus" data-id="${item.id}">-</button>
                        <input type="text" value="${item.quantity}" class="quantity-input" readonly data-id="${item.id}">
                        <button class="quantity-plus" data-id="${item.id}">+</button>
                    </div>
                    <span class="col-subtotal item-subtotal" data-id="${item.id}">¥ ${subtotal}</span>
                    <span class="col-action">
                        <a href="#" class="item-remove" data-id="${item.id}">删除</a> | 
                        <a href="#" class="item-favorite">移入收藏</a>
                    </span>
                </div>
            `;
            $container.append(itemHtml);
        });
    }

    // ----------------------------------------------------
    // 3. 计算总计逻辑
    // ----------------------------------------------------

    function updateSummary() {
        let totalCount = 0;
        let finalTotal = 0;

        // 只计算被选中的商品
        const selectedItems = cartItems.filter(item => item.selected);

        selectedItems.forEach(item => {
            const subtotal = item.price * item.quantity;
            totalCount += item.quantity;
            finalTotal += subtotal;
        });

        // 更新 HTML 摘要区域
        const totalText = finalTotal.toFixed(2);
        
        $('.summary-row:first-child span:first-child').text(`商品总数 (${selectedItems.length})`); // 更新商品种类数
        $('.summary-row:first-child span:last-child').text(`¥ ${finalTotal.toFixed(2)}`); // 更新商品总额 (未折扣)
        $('#finalTotal').text(`¥ ${totalText}`); // 更新最终总计

        // 更新导航栏购物车数量（假设导航栏有 #cartCount 元素）
        // $('#cartCount').text(`购物车 (${totalCount})`); 
    }

    // ----------------------------------------------------
    // 4. 事件处理逻辑
    // ----------------------------------------------------

    // A. 数量增减事件
    $(document).on('click', '.quantity-plus, .quantity-minus', function(e) {
        e.preventDefault();
        const itemId = $(this).data('id');
        const $input = $(`.quantity-input[data-id="${itemId}"]`);
        let currentValue = parseInt($input.val());
        
        const item = cartItems.find(i => i.id === itemId);
        if (!item) return;

        if ($(this).hasClass('quantity-plus')) {
            item.quantity++;
        } else if (item.quantity > 1) {
            item.quantity--;
        }
        
        // 更新前端显示
        $input.val(item.quantity);
        $(`.item-subtotal[data-id="${itemId}"]`).text(`¥ ${(item.price * item.quantity).toFixed(2)}`);
        
        // 重新计算并更新总计
        updateSummary();
    });

    // B. 删除商品事件
    $(document).on('click', '.item-remove', function(e) {
        e.preventDefault();
        const itemId = $(this).data('id');
        
        if (confirm('确定要从购物车中删除此商品吗？')) {
            // 从数组中移除商品
            cartItems = cartItems.filter(item => item.id !== itemId);
            
            // 重新渲染列表和更新总计
            renderCartItems(cartItems);
            updateSummary();
            
            // 实际项目：还需要发送 AJAX 请求通知后端删除
        }
    });

    // C. 复选框选择事件 (包括全选)
    $(document).on('change', '.item-checkbox', function() {
        const itemId = $(this).data('id');
        const isChecked = $(this).prop('checked');
        
        // 更新数组中的选中状态
        const item = cartItems.find(i => i.id === itemId);
        if (item) {
            item.selected = isChecked;
        }

        // 检查是否所有商品都被选中，并更新“全选”状态
        const allSelected = cartItems.every(item => item.selected);
        $('#selectAll').prop('checked', allSelected);
        
        updateSummary();
    });

    // D. 全选事件
    $('#selectAll').on('change', function() {
        const isChecked = $(this).prop('checked');
        
        // 更新数组和所有复选框的状态
        cartItems.forEach(item => {
            item.selected = isChecked;
        });
        $('.item-checkbox').prop('checked', isChecked);
        
        updateSummary();
    });
    
    // E. 结算按钮事件 (Placeholder)
    $('#checkoutButton').on('click', function() {
        const itemsToCheckout = cartItems.filter(item => item.selected);
        if (itemsToCheckout.length === 0) {
            alert('请选择至少一件商品进行结算！');
            return;
        }
        
        // 实际项目：发送 AJAX POST 请求到 /api/order
        console.log('准备结算的商品:', itemsToCheckout);
        alert('正在跳转到结算页面...');
        window.location.href = 'checkout.html';
    });


    // ----------------------------------------------------
    // 初始化购物车页面
    // ----------------------------------------------------
    loadCartData();
}); 
});
});
    //结算页面
// script.js (添加到文件中)

$(document).ready(function() {
    
    // ----------------------------------------------------
    // 结算页逻辑
    // ----------------------------------------------------
    
    // A. 支付方式切换
    $('.payment-option').on('click', function() {
        // 移除所有激活状态
        $('.payment-option').removeClass('active');
        // 激活被点击的选项
        $(this).addClass('active');
        // 标记隐藏的 radio 按钮
        $(this).find('input[type="radio"]').prop('checked', true);
    });

    // B. 订单提交
    $('#placeOrderButton').on('click', function() {
        // 禁用按钮防止重复点击
        const $btn = $(this);
        $btn.prop('disabled', true).text('正在处理...');

        // 1. 收集订单数据（地址、支付方式、配送方式、备注、商品列表）
        const orderData = {
            // 假设地址信息是从 addressForm 或 savedAddresses 中获取的
            address: { 
                name: $('#recipientName').val(),
                phone: $('#recipientPhone').val(),
                detail: $('#recipientAddress').val()
            },
            paymentMethod: $('input[name="paymentMethod"]:checked').val(),
            deliveryMethod: $('#deliveryMethod').val(),
            notes: $('#orderNotes').val(),
            // 实际项目：从 localStorage 或 AJAX 获取购物车数据
            items: [ /* 购物车商品列表 */ ], 
            total: parseFloat($('#checkoutTotal').text().replace('¥ ', ''))
        };

        // 2. 发送 AJAX 请求到后端
        $.ajax({
            url: '/api/place-order', 
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(orderData),
            success: function(response) {
                alert(`订单创建成功！订单号: ${response.orderId}。即将跳转到支付平台...`);
                // 成功后跳转到支付页面或订单详情
                // window.location.href = `/order-confirmation.html?id=${response.orderId}`;
            },
            error: function(xhr) {
                alert('订单提交失败，请检查填写信息或稍后重试。');
                $btn.prop('disabled', false).text('提交订单并支付'); // 恢复按钮
            }
        });
    });

    // C. 页面初始化时的总价计算 (模拟)
    function initializeCheckout() {
        // 实际项目：这里应根据购物车页面传来的数据或 AJAX 获取的数据来填充和计算
        const subtotal = 1597.00;
        const discount = 150.00;
        const shipping = 0.00; // 初始为标准快递
        const finalTotal = (subtotal - discount + shipping).toFixed(2);
        
        // 假设填充数据
        $('#checkoutTotal').text(`¥ ${finalTotal}`);
        $('.summary-subtotal span:last-child').text(`¥ ${subtotal.toFixed(2)}`);
        $('.summary-details .discount').text(`- ¥ ${discount.toFixed(2)}`);
    }

    // 配送方式切换 (影响总价)
    $('#deliveryMethod').on('change', function() {
        const value = $(this).val();
        let shippingFee = 0;
        if (value === 'express') {
            shippingFee = 20.00;
        }

        // 重新计算总价并更新UI
        const currentTotal = parseFloat($('#checkoutTotal').text().replace('¥ ', ''));
        const newTotal = currentTotal + shippingFee; // 这里逻辑需要更严谨，实际应该基于 base total
        
        $('.summary-details .fee').text(`¥ ${shippingFee.toFixed(2)}`);
        // 简化处理：每次切换配送方式，重新计算一次总价
        initializeCheckout(); 
        
        // 实际：需要从一个基础总价重新计算。
    });
    
    // 首次加载页面时执行初始化
    initializeCheckout();
});

