const canvas = document.getElementById('biomech-cursor');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// リサイズ対応
window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

// マウス座標と状態
let mouse = { x: width / 2, y: height / 2 };
let isHoveringTarget = false;
let idleTime = 0;
let isHoveringGallery = false;

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    idleTime = 0;
});

// インタラクティブ要素のホバー検知
const observeHover = () => {
    const interactiveElements = document.querySelectorAll('a, button, .gallery-item, .lang-switch, .bgm-toggle-container, .close-btn, input, textarea');
    interactiveElements.forEach(el => {
        if (!el.dataset.cursorBound) {
            el.addEventListener('mouseenter', () => {
                isHoveringTarget = true;
                if (el.classList.contains('gallery-item')) isHoveringGallery = true;
            });
            el.addEventListener('mouseleave', () => {
                isHoveringTarget = false;
                isHoveringGallery = false;
            });
            el.dataset.cursorBound = 'true';
        }
    });
};
observeHover();

// 動的に追加される要素（RSSなど）の監視
const observer = new MutationObserver(observeHover);
observer.observe(document.body, { childList: true, subtree: true });

// 神経繊維（トレイル）の設定
const numFibers = 5;
const fiberLength = 15;
const fibers = [];

for (let i = 0; i < numFibers; i++) {
    const points = [];
    for (let j = 0; j < fiberLength; j++) {
        points.push({ x: mouse.x, y: mouse.y });
    }
    fibers.push({
        points: points,
        angleOffset: (Math.PI * 2 / numFibers) * i,
        // 個体差をつける
        wobbleSpeed: 0.05 + Math.random() * 0.05,
        wobbleSize: 2 + Math.random() * 3
    });
}

// 散る体液・火花（パーティクル）の設定
const particles = [];

function createParticles(x, y) {
    // ギャラリーホバー時に激しく散らす
    for (let i = 0; i < 2; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8, // ランダムな方向へ弾け飛ぶ
            vy: (Math.random() - 0.5) * 8,
            life: 1.0, // 寿命
            decay: 0.02 + Math.random() * 0.03,
            size: 1 + Math.random() * 2
        });
    }
}

function update() {
    ctx.clearRect(0, 0, width, height);
    idleTime++;

    if (isHoveringGallery && Math.random() > 0.4) {
        createParticles(mouse.x, mouse.y); // パーティクル生成
    }

    // 待機時のゆっくりとした呼吸（拍動）スケール
    let pulse = 1;
    if (idleTime > 60 && !isHoveringTarget) {
        pulse = 1 + Math.sin(idleTime * 0.05) * 0.15;
    }

    const coreX = mouse.x;
    const coreY = mouse.y;

    // --- 神経繊維の描画 ---
    fibers.forEach(fiber => {
        // 先頭ポイント（コアの周囲をうごめく）
        let targetX = coreX;
        let targetY = coreY;

        if (isHoveringTarget) {
            // 捕食モード：ターゲットに向かって広がる・絡みつく
            targetX += Math.cos(fiber.angleOffset + idleTime * 0.1) * 25;
            targetY += Math.sin(fiber.angleOffset + idleTime * 0.1) * 25;
        } else {
            // 待機モード：コアの周りで静かにうごめく
            targetX += Math.cos(fiber.angleOffset + idleTime * fiber.wobbleSpeed) * (fiber.wobbleSize * pulse);
            targetY += Math.sin(fiber.angleOffset + idleTime * fiber.wobbleSpeed) * (fiber.wobbleSize * pulse);
        }

        // 先頭をターゲットに追従させる
        fiber.points[0].x += (targetX - fiber.points[0].x) * 0.3;
        fiber.points[0].y += (targetY - fiber.points[0].y) * 0.3;

        // 後続の関節を引っ張る（Inverse Kinematics風のシンプルなフォロースルー）
        for (let i = 1; i < fiberLength; i++) {
            const dx = fiber.points[i - 1].x - fiber.points[i].x;
            const dy = fiber.points[i - 1].y - fiber.points[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 関節間の距離を維持しながら引っ張る
            const spring = 0.4;
            fiber.points[i].x += dx * spring;
            fiber.points[i].y += dy * spring;
        }

        // 繊維を描画
        ctx.beginPath();
        ctx.moveTo(fiber.points[0].x, fiber.points[0].y);
        for (let i = 1; i < fiberLength; i++) {
            // 滑らかな曲線を引くためのコントロールポイント計算
            const xc = (fiber.points[i - 1].x + fiber.points[i].x) / 2;
            const yc = (fiber.points[i - 1].y + fiber.points[i].y) / 2;
            ctx.quadraticCurveTo(fiber.points[i - 1].x, fiber.points[i - 1].y, xc, yc);
        }

        // 色と太さの決定（ホバー時は血の色に）
        ctx.strokeStyle = isHoveringTarget ? `rgba(168, 35, 35, ${0.8})` : `rgba(92, 24, 24, ${0.5})`;
        ctx.lineWidth = isHoveringTarget ? 1.5 : 1;
        ctx.lineCap = 'round';
        ctx.stroke();
    });

    // --- コア（有機的な核）の描画 ---
    // ホバー時は乾燥した血液色に広がり、待機時は暗いマルーン色で拍動
    const coreRadius = isHoveringTarget ? 7 : 4 * pulse;
    const coreColor = isHoveringTarget ? '#a82323' : '#5c1818';
    const glowColor = isHoveringTarget ? 'rgba(255, 50, 50, 0.6)' : 'rgba(92, 24, 24, 0.3)';

    ctx.beginPath();
    ctx.arc(coreX, coreY, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = coreColor;
    ctx.shadowBlur = isHoveringTarget ? 15 : 5;
    ctx.shadowColor = glowColor;
    ctx.fill();

    // コアの内側の小さな発光点（瞳や端子のようなディテール）
    ctx.beginPath();
    ctx.arc(coreX, coreY, coreRadius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = isHoveringTarget ? '#ffb3b3' : '#c4a7a7';
    ctx.shadowBlur = 0;
    ctx.fill();

    // --- パーティクルの描画（体液・火花の飛散） ---
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(168, 35, 35, ${p.life})`; // 飛び散る真っ赤な血
            ctx.shadowBlur = 2;
            ctx.shadowColor = 'rgba(255, 50, 50, 0.5)';
            ctx.fill();
        }
    }

    requestAnimationFrame(update);
}

// アニメーションループ開始
update();
