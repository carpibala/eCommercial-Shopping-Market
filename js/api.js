// js/api.js  —— 所有页面都必须引入这个文件！！！
const API_BASE = 'http://localhost:3003/api';

// 从 localStorage 读取登录信息
function getAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    return { token, user };
}

// 统一的请求封装（自动带 token，自动处理 401 跳转登录）
async function request(url, options = {}) {
    const { token } = getAuth();

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        },
        ...options
    };

    const res = await fetch(API_BASE + url, config);
    
    // 401 登录过期 → 自动跳登录页
    if (res.status === 401) {
        alert('登录已过期，请重新登录');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        location.href = 'login.html';
        return;
    }

    const data = await res.json();
    if (!res.ok && res.status >= 400) {
        throw new Error(data.message || '请求失败');
    }
    return data;
}

// 导出常用方法
window.API = {
    get: (url) => request(url),
    post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
    put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (url) => request(url, { method: 'DELETE' })
};