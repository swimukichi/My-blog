// --- 1. 背景のバイオ・パララックス効果 ---
document.addEventListener('mousemove', (e) => {
    const background = document.querySelector('.organic-background');
    if (!background) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    background.style.transform = `translate(${x}px, ${y}px) scale(1.1) skew(${x * 0.1}deg, ${y * 0.1}deg)`;
});

// --- 2. ギャラリー生成 (WORKS) ---
const galleryContainer = document.getElementById('gallery-grid');
if (galleryContainer) {
    const allMedia = [];
    if (typeof videoFiles !== 'undefined') {
        videoFiles.forEach(f => allMedia.push({ type: 'video', src: `${f}` }));
    }
    if (typeof imageFiles !== 'undefined') {
        imageFiles.forEach(f => allMedia.push({ type: 'image', src: `${f}` }));
    }

    allMedia.forEach(media => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        const el = document.createElement(media.type === 'video' ? 'video' : 'img');
        el.src = media.src;
        if (media.type === 'video') { el.muted = true; el.loop = true; el.playsInline = true; }
        item.appendChild(el);
        galleryContainer.appendChild(item);
    });
}

// --- 3. note RSS 読み込み (LATEST) ---
const rssUrl = 'https://note.com/swimukichi/rss';
const apiUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;

async function fetchNoteRSS() {
    const container = document.getElementById("rss-feed-container");
    if (!container) return;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 5);
        container.innerHTML = '';
        items.forEach(item => {
            const title = item.querySelector("title").textContent;
            const link = item.querySelector("link").textContent;
            const desc = item.querySelector("description").textContent;
            const imgMatch = desc.match(/<img[^>]+src="([^">]+)"/);
            const imageUrl = imgMatch ? imgMatch[1] : 'images/default-note.jpg';
            container.insertAdjacentHTML('beforeend', `
                <a href="${link}" target="_blank" class="note-card">
                    <img src="${imageUrl}" alt="${title}">
                    <div class="note-content"><h3>${title}</h3></div>
                </a>
            `);
        });
    } catch (error) {
        container.innerHTML = '<div class="note-card"><h3>通信エラー</h3></div>';
    }
}
fetchNoteRSS();