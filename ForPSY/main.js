import * as THREE from 'three';

/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
// 1. 场景、相机、渲染器 初始化
/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050515);

const camera = new THREE.PerspectiveCamera(
    64,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
);
camera.position.set(-28, -3, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
// 2. 实心圆润的粒子爱心（颠倒后尖端向下，连接树顶）
/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
function createHeart(size = 1.5) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const color = new THREE.Color('#edcad1');
    const particleCount = 3000; // 增加粒子数量实现实心效果（原800→3000）
    const edgeSoftness = 0.3;   // 边缘柔和度（值越大边缘越模糊）

    // 爱心公式 + 内部填充逻辑
    for (let i = 0; i < particleCount; i++) {
        // 1. 基础爱心曲线参数
        const t = Math.random() * Math.PI * 2;
        const baseX = 16 * Math.pow(Math.sin(t), 3);
        const baseY = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        
        // 2. 内部填充：随机生成爱心内部点（核心优化）
        const scale = 0.3 + Math.random() * 0.7; // 0.3-1.0 缩放比例，确保内部充满
        let x = baseX * scale;
        let y = baseY * scale;
        
        // 3. 边缘圆润处理：减少边缘突变，增加柔和过渡
        if (Math.random() < edgeSoftness) {
            x += (Math.random() - 0.5) * 1.2;
            y += (Math.random() - 0.5) * 1.2;
        } else {
            x += (Math.random() - 0.5) * 0.4; // 内部粒子偏移更小，更密集
            y += (Math.random() - 0.5) * 0.4;
        }
        
        // 4. 整体缩放与方向保持（尖端向下）
        x = x * size / 16;
        y = y * size / 16;
        
        // 5. Z轴轻微偏移增强立体感（比原来更小，避免过于松散）
        const z = (Math.random() - 0.5) * 0.3 * size;

        positions.push(x, y, z);
        
        // 6. 颜色渐变：中心亮边缘稍暗，增强实心感
        const brightness = 0.9 - (scale * 0.3) + Math.random() * 0.2;
        colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // 粒子大小优化：根据爱心大小动态调整，边缘粒子稍小
    const material = new THREE.PointsMaterial({
        size: 0.07 * size, // 粒子稍小但密度更高，实现更细腻的填充
        vertexColors: true,
        transparent: true,
        opacity: 0.98, // 提高不透明度增强实心感
        depthWrite: false
    });

    const heart = new THREE.Points(geometry, material);
    heart.position.y = 14.8 - (size * 0.8); // 保持与树顶连接
    return heart;
}


/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
// 3. 圣诞树本体（粉白相间）
/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
function createLayeredTree() {
    const pickColor = () => Math.random() < 0.6 ? '#f194a4' : '#FFFFFF';

    const layers = [
        { radius: 0.5,  height: 2,   count: 100, y: 14.8 },
        { radius: 1.79, height: 3.5, count: 300, y: 12   },
        { radius: 3,    height: 2.8, count: 500, y: 9    },
        { radius: 4.5,  height: 3,   count: 700, y: 6    },
        { radius: 6,    height: 3.5, count: 900, y: 3    },
        { radius: 7.5,  height: 4,   count: 1100, y: 0   },
        { radius: 9,    height: 4.5, count: 1300, y: -3  }
    ];

    const treeGeometry = new THREE.BufferGeometry();
    const allPoints = [];
    const allColors  = [];
    const color = new THREE.Color();

    layers.forEach(layer => {
        const { radius, height, count, y } = layer;

        for (let i = 0; i < count; i++) {
            const t     = i / count;
            const theta = t * 3 * Math.PI * 2;
            const r     = radius * (0.5 + Math.random() * 0.5);
            let x = r * Math.cos(theta);
            let z = r * Math.sin(theta);
            x += (Math.random() - 0.5) * 0.8;
            z += (Math.random() - 0.5) * 0.8;
            const yPos = y + (Math.random() - 0.5) * height;
            allPoints.push(x, yPos, z);

            color.set(pickColor());
            allColors.push(color.r, color.g, color.b);
        }

        const twigCount = 30 + Math.floor(Math.random() * 21);
        for (let i = 0; i < twigCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const baseR = radius + 0.2;
            const extend = 0.8 + Math.random() * 1.2;
            const x = (baseR + extend) * Math.cos(angle) + (Math.random() - 0.5) * 0.4;
            const z = (baseR + extend) * Math.sin(angle) + (Math.random() - 0.5) * 0.4;
            const yPos = y + (Math.random() - 0.5) * height * 0.6;
            allPoints.push(x, yPos, z);

            color.set(pickColor());
            allColors.push(color.r, color.g, color.b);
        }
    });

    const trunkHeight = 8;
    const trunkRadius = 1;
    const trunkCount = 500;
    for (let i = 0; i < trunkCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r   = trunkRadius * (0.5 + Math.random() * 0.5);
        const x   = r * Math.cos(theta);
        const z   = r * Math.sin(theta);
        const y   = -3 - Math.random() * trunkHeight;
        allPoints.push(x, y, z);

        color.set(pickColor());
        allColors.push(color.r, color.g, color.b);
    }

    treeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(allPoints, 3));
    treeGeometry.setAttribute('color',    new THREE.Float32BufferAttribute(allColors,  3));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false
    });
    return new THREE.Points(treeGeometry, material);
}


/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
// 4. 一圈圈水波状地面
/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
function createWaterRipples() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors    = [];
    const radii     = [];

    const maxRadius = 37;
    const totalParticles = 18000;
    const baseY = -8;

    for (let i = 0; i < totalParticles; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r     = maxRadius * Math.random();
        const x     = r * Math.cos(theta);
        const z     = r * Math.sin(theta);
        const y     = baseY;
        positions.push(x, y, z);
        colors.push(1, 1, 1);
        radii.push(r);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3));

    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
    });

    const ripples = new THREE.Points(geometry, material);
    ripples.userData = {
        radii,
        waveSpeed: 0.4,
        waveHeight: 0.4,
        waveLength: 3
    };
    return ripples;
}


/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
// 5. 星空背景
/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
function createStars() {
    const geometry = new THREE.BufferGeometry();
    const points  = [];
    const colors  = [];
    const color   = new THREE.Color();
    const starCount = 8000;

    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * 300;
        const y = (Math.random() - 0.5) * 300;
        const z = (Math.random() - 0.5) * 300;
        points.push(x, y, z);

        const brightness = 0.6 + Math.random() * 0.4;
        color.setRGB(brightness, brightness, brightness);
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors,  3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true
    }));
}


/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
// 6. 场景组合 & 动画
/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
const tree     = createLayeredTree();
const ripples  = createWaterRipples();
const stars    = createStars();
const heart    = createHeart(1.5);  // 可调整大小（如createHeart(2)）

// 调整爱心坐标（可选）
heart.position.set(0, 17, 0);

tree.add(heart);
scene.add(tree);
scene.add(ripples);
scene.add(stars);

function animate() {
    requestAnimationFrame(animate);
    tree.rotation.y += 0.005;

    const posAttr = ripples.geometry.attributes.position;
    const { radii, waveSpeed, waveHeight, waveLength } = ripples.userData;
    const time = performance.now() * 0.0005;

    for (let i = 0; i < posAttr.count; i++) {
        const r = radii[i];
        const wave = Math.sin((time * waveSpeed - r / waveLength) * Math.PI * 2) * waveHeight;
        posAttr.setY(i, -11 + wave);
    }
    posAttr.needsUpdate = true;

    renderer.render(scene, camera);
}
animate();


/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
// 7. 窗口大小自适应
/* ―――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――― */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});