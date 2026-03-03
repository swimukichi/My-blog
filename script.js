// マウスの動きに合わせて背景が歪みながら追従する（生体パララックス＆ディストーション効果）
document.addEventListener('mousemove', (e) => {
    const bg = document.querySelector('.organic-background');
    if (!bg) return;

    // マウス位置から画面中心までの距離を計算
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;

    // 背景を動かしつつ、少し歪める（skew）ことで肉体が波打つような不快感を演出
    bg.style.transform = `translate(${x}px, ${y}px) scale(1.1) skew(${x * 0.1}deg, ${y * 0.1}deg)`;
});

// 言語切り替え（JP / EN）のロジック
const langSwitch = document.getElementById('lang-switch');
const langJpLbl = document.getElementById('lang-jp-lbl');
const langEnLbl = document.getElementById('lang-en-lbl');

if (langSwitch) {
    langSwitch.addEventListener('click', () => {
        document.body.classList.toggle('lang-en-active');
        const isEn = document.body.classList.contains('lang-en-active');

        if (isEn) {
            langJpLbl.classList.remove('active');
            langEnLbl.classList.add('active');
            document.documentElement.lang = "en";
        } else {
            langEnLbl.classList.remove('active');
            langJpLbl.classList.add('active');
            document.documentElement.lang = "ja";
        }

        // タイピング済みテキストの言語即時切り替え
        document.querySelectorAll('.typing-text.typed').forEach(el => {
            el.innerHTML = isEn ? el.dataset.en : el.dataset.jp;
        });
    });
}

// ギャラリーの画像/動画動的レンダリングと拡大（ライトボックス）機能
const modal = document.getElementById("lightbox-modal");
const modalImg = document.getElementById("modal-img");
const modalVideo = document.getElementById("modal-video");
const closeBtn = document.querySelector(".close-btn");
const galleryContainer = document.getElementById("biomech-gallery");

// パフォーマンス最適化：IntersectionObserverによる遅延読み込みと再生制御
const observerOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1
};

const mediaObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;

            // 画像の遅延読み込み
            if (target.tagName.toLowerCase() === 'img' && target.dataset.src) {
                target.src = target.dataset.src;
                target.removeAttribute('data-src');
            }

            // 動画の遅延再生（画面内に入ったら再生）
            if (target.tagName.toLowerCase() === 'video') {
                if (target.dataset.src && !target.src) {
                    target.src = target.dataset.src;
                    target.removeAttribute('data-src');
                }
                target.play().catch(e => console.log("Autoplay prevented by browser", e));
            }
        } else {
            // 画面外に出た動画は一時停止してリソースを節約
            const target = entry.target;
            if (target.tagName.toLowerCase() === 'video' && !target.paused) {
                target.pause();
            }
        }
    });
}, observerOptions);

// image_list.js と video_list.js からリストを読み込み、ギャラリーを生成
if (galleryContainer) {
    const allMedia = [];
    if (typeof videoFiles !== 'undefined') {
        videoFiles.forEach(f => allMedia.push({ type: 'video', src: `${f}` }));
    }
    if (typeof imageFiles !== 'undefined') {
        imageFiles.forEach(f => allMedia.push({ type: 'image', src: `${f}` }));
    }

    allMedia.forEach(media => {
        const item = document.createElement("div");
        item.className = "gallery-item";

        if (media.type === 'video') {
            const vid = document.createElement("video");
            vid.dataset.src = media.src; // data-srcに保持してIntersectionObserverで読み込む
            vid.loop = true;
            vid.muted = true;
            vid.playsInline = true;
            // 初期状態は停止
            vid.preload = "none";

            vid.addEventListener("click", function () {
                modal.style.display = "flex";
                modalImg.style.display = "none";
                modalVideo.style.display = "block";
                modalVideo.src = this.currentSrc || this.src || media.src;
                modalVideo.play();
            });

            item.appendChild(vid);
            mediaObserver.observe(vid);
        } else {
            const img = document.createElement("img");
            img.dataset.src = media.src; // data-srcに保持
            img.alt = "Biomechanical Mutation";
            // css filter transition を滑らかにするために hardware acceleration ヒント
            img.style.willChange = "transform, filter";

            img.addEventListener("click", function () {
                modal.style.display = "flex";
                modalVideo.style.display = "none";
                modalVideo.pause();
                modalImg.style.display = "block";
                modalImg.src = this.src;
            });

            item.appendChild(img);
            mediaObserver.observe(img);
        }

        galleryContainer.appendChild(item);
    });
}

// 閉じるボタンでモーダルを閉じる
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    if (modalVideo) {
        modalVideo.pause();
        modalVideo.src = ""; // 映像ソースをリセットして音や再生を完全に停止
    }
});

// モーダルの背景（画像の外側）をクリックしても閉じる
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// --- アンビエントBGM制御（フェードイン/フェードアウトとUI更新） ---
const bgmToggle = document.getElementById('bgm-toggle');
const ambientBgm = document.getElementById('ambient-bgm');
const bgmJpLbl = document.getElementById('bgm-jp-text');
const bgmEnLbl = document.getElementById('bgm-en-text');
let isBgmPlaying = false;
let bgmFadeInterval;

if (bgmToggle && ambientBgm) {
    ambientBgm.volume = 0; // 初期音量は0

    bgmToggle.addEventListener('click', () => {
        if (isBgmPlaying) {
            // フェードアウトして停止
            clearInterval(bgmFadeInterval);
            bgmToggle.classList.remove('playing');
            if (bgmJpLbl) bgmJpLbl.textContent = "生体音: 停止";
            if (bgmEnLbl) bgmEnLbl.textContent = "AMBIENT: OFF";

            bgmFadeInterval = setInterval(() => {
                if (ambientBgm.volume > 0.05) {
                    ambientBgm.volume -= 0.05;
                } else {
                    ambientBgm.volume = 0;
                    ambientBgm.pause();
                    clearInterval(bgmFadeInterval);
                    isBgmPlaying = false;
                }
            }, 100);
        } else {
            // 再生してフェードイン
            clearInterval(bgmFadeInterval);
            bgmToggle.classList.add('playing');
            if (bgmJpLbl) bgmJpLbl.textContent = "生体音: 鼓動中";
            if (bgmEnLbl) bgmEnLbl.textContent = "AMBIENT: PULSING";

            ambientBgm.play().catch(e => console.log("BGM play failed:", e));
            isBgmPlaying = true;

            bgmFadeInterval = setInterval(() => {
                if (ambientBgm.volume < 0.95) {
                    ambientBgm.volume += 0.05;
                } else {
                    ambientBgm.volume = 1; // 最終的な最大音量
                    clearInterval(bgmFadeInterval);
                }
            }, 100);
        }
    });
}

// noteのRSSフィードを読み込んで表示する機能
const rssFeedUrl = "https://note.com/swi0801/m/md9fde77c22b2/rss";
// CORS回避とXMLの直接取得のために allorigins API を経由
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
        itemsForGallery.forEach(item => {
            const contentHtml = extractContent(item);
            const thumbnailUrl = extractThumbnail(item, contentHtml);
            const title = item.querySelector("title")?.textContent || "No Title";

            if (thumbnailUrl && galleryContainer) {
                const galleryItem = document.createElement("div");
                galleryItem.className = "gallery-item";

                const img = document.createElement("img");
                img.dataset.src = thumbnailUrl;
                img.alt = title;
                img.style.willChange = "transform, filter";

                img.addEventListener("click", function () {
                    modal.style.display = "flex";
                    if (modalVideo) {
                        modalVideo.style.display = "none";
                        modalVideo.pause();
                    }
                    modalImg.style.display = "block";
                    modalImg.src = this.currentSrc || this.src;
                });

                galleryItem.appendChild(img);
                galleryContainer.prepend(galleryItem);

                if (typeof mediaObserver !== 'undefined') {
                    mediaObserver.observe(img);
                }
            }
        });

        items.forEach(item => {
            const title = item.querySelector("title")?.textContent || "No Title";
            const link = item.querySelector("link")?.textContent || "#";
            const pubDateStr = item.querySelector("pubDate")?.textContent;

            const contentHtml = extractContent(item);

            // HTMLタグを除去して本文プレビューを作成
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = contentHtml;
            let textContent = tempDiv.textContent || tempDiv.innerText || "";

            // 100文字で三点リーダーに
            if (textContent.length > 70) {
                textContent = textContent.substring(0, 70) + "...";
            }

            // 日付のフォーマット変換
            const pubDate = new Date(pubDateStr);
            const formattedDate = !isNaN(pubDate) ? `${pubDate.getFullYear()}.${String(pubDate.getMonth() + 1).padStart(2, '0')}.${String(pubDate.getDate()).padStart(2, '0')}` : "UNKNOWN DATE";

            const cardHtml = `
                <a href="${link}" target="_blank" rel="noopener noreferrer" class="note-card">
                    <div class="note-badge">${formattedDate}</div>
                    <h3>${title}</h3>
                    <p>${textContent}</p>
                    <span class="read-more">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                        READ SIGNAL
                    </span>
                </a>
            `;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });
    } catch (error) {
        console.error("Failed to fetch RSS:", error);
        container.innerHTML = `
            <div class="note-card" style="opacity: 0.5;">
                <div class="note-badge">ERROR</div>
                <h3>通信エラー</h3>
                <p>現在シグナルを受信できません。しばらく経ってから再接続してください。</p>
            </div>
        `;
    }
}

function extractContent(item) {
    const descriptionNode = item.querySelector("description");
    const encodedNodes = item.getElementsByTagNameNS("*", "encoded");
    return (encodedNodes.length > 0 ? encodedNodes[0].textContent : null) || (descriptionNode ? descriptionNode.textContent : "");
}

function extractThumbnail(item, contentHtml) {
    let url = "";
    const thumbnailNodes = item.getElementsByTagNameNS("*", "thumbnail");
    if (thumbnailNodes.length > 0 && thumbnailNodes[0].getAttribute("url")) {
        url = thumbnailNodes[0].getAttribute("url");
    } else {
        const imgMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
            url = imgMatch[1];
        }
    }
    return url;
}

// ページ読み込み時の初期化とSPAルーティング
document.addEventListener("DOMContentLoaded", () => {
    fetchNoteRSS();

    // SPAモードの有効化
    document.body.classList.add('spa-mode');

    // 初期セクションの表示（URLハッシュに基づく、なければ#home）
    let initialHash = window.location.hash || '#home';
    let initialSection = document.querySelector(initialHash);

    // もしハッシュが間違っていれば#homeに戻す
    if (!initialSection || !initialSection.classList.contains('content-box')) {
        initialHash = '#home';
        initialSection = document.getElementById('home');
    }

    if (initialSection) {
        initialSection.classList.add('active-section');
    }

    // ナビゲーションリンクのフック
    const navLinks = document.querySelectorAll('.spine-menu a.vertebra');
    const overlay = document.getElementById('transition-overlay');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (!targetSection) return;

                // 既に表示中のセクションなら何もしない
                if (targetSection.classList.contains('active-section')) return;

                // 1. オーバーレイと激しいグリッチの発動
                overlay.classList.remove('hidden');
                void overlay.offsetWidth; // リフロー強制
                overlay.classList.add('active');
                document.body.classList.add('transition-glitch-active');

                // URLのハッシュを静かに更新
                window.history.pushState(null, null, targetId);

                // 2. 粘液が画面を覆うのを待つ（不気味なタメ）
                setTimeout(() => {
                    // セクションの切り替え
                    document.querySelectorAll('.content-box').forEach(box => {
                        box.classList.remove('active-section');
                    });
                    targetSection.classList.add('active-section');

                    // スクロール位置を一番上へ強制リセット（トップへ戻る）
                    window.scrollTo({ top: 0, behavior: 'instant' });

                    // 3. 粘液とグリッチの解除
                    overlay.classList.remove('active');
                    document.body.classList.remove('transition-glitch-active');

                    // オーバーレイを完全に隠す（CSSアニメーション終了後）
                    setTimeout(() => {
                        overlay.classList.add('hidden');
                    }, 1200);

                }, 1000); // 1秒間、画面が真っ暗な粘着質で覆われる
            }
        });
    });
});

// --- MUTATION LOG (ABOUT) タイピングエフェクト ---
const logObserverOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
};

const typeText = (element) => {
    if (element.classList.contains('typing')) return;
    element.classList.add('typing');

    const isEn = document.body.classList.contains('lang-en-active');
    const fullText = isEn ? element.dataset.en : element.dataset.jp;
    element.innerHTML = '';

    let i = 0;
    const typingInterval = setInterval(() => {
        if (i < fullText.length) {
            // HTMLタグ（<br>など）を一気に処理する
            if (fullText.charAt(i) === '<') {
                let tag = '';
                while (i < fullText.length && fullText.charAt(i) !== '>') {
                    tag += fullText.charAt(i);
                    i++;
                }
                tag += '>';
                element.innerHTML += tag;
                i++; // '>'の次へ
            } else {
                element.innerHTML += fullText.charAt(i);
                i++;
            }
        } else {
            clearInterval(typingInterval);
            element.classList.remove('typing');
            element.classList.add('typed');
            // Hide the cursor if desired, but we'll leave it blinking to look like a terminal
        }
    }, 20); // 少し速めに（長文対応）
};

const mutationLogObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const typingElement = entry.target.querySelector('.typing-text');
            if (typingElement && !typingElement.classList.contains('typed')) {
                // 少し遅延を入れてからタイピング開始（不気味な溜め）
                setTimeout(() => {
                    typeText(typingElement);
                }, 300);
            }
        }
    });
}, logObserverOptions);

document.querySelectorAll('.log-entry').forEach(entry => {
    mutationLogObserver.observe(entry);
});

// --- BIO-MECHANICAL SCROLL TO TOP ---
const scrollTopBtn = document.getElementById('biomech-scroll-top');

if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
        // 画面を300px以上スクロールしたら出現
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        // 生体組織が収縮するように滑らかにトップへ戻る
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // クリック時に一瞬激しく光るコアのエフェクト
        const core = scrollTopBtn.querySelector('.scroll-core');
        if (core) {
            core.style.transform = 'scale(1.5)';
            core.style.boxShadow = '0 0 50px #ff3333';
            setTimeout(() => {
                core.style.transform = '';
                core.style.boxShadow = '';
            }, 400);
        }
    });
}
