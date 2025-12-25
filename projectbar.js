/**
 * BlackICE Portal Widget v3.4
 * Features: Full-screen Iframe Overlay, Crisp Chat, Draggable Button, Glassmorphism
 */

(function() {
    if (window.BlackICEWidget) return;

    class BlackICEWidget {
        constructor() {
            this.dbUrl = "https://h-90-8a7c5-default-rtdb.firebaseio.com/sites.json";
            this.osUrl = "https://black-ice-3dbk.onrender.com/scrapsites/osapk.html";
            this.crispId = "53f77668-00a3-4f45-8b0e-dd4d7c27ecdf"; 
            
            this.theme = {
                font: "'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif",
                glassBg: "rgba(9, 9, 11, 0.95)", 
                glassBorder: "rgba(255, 255, 255, 0.08)",
                accent: "#3b82f6",
                textMain: "#ffffff",
                textMuted: "#a1a1aa"
            };
            
            this.isOpen = false;
            this.allProjects = [];
            this.init();
        }

        init() {
            this.loadFonts();
            this.loadCrisp();
            this.injectStyles();
            this.createElements();
            this.setupDraggable();
            this.setupActions();
            this.fetchProjects();
            
            setTimeout(() => {
                const tooltip = document.getElementById('bi-drag-tip');
                if(tooltip) tooltip.style.opacity = '0';
            }, 6000);
        }

        loadFonts() {
            const link = document.createElement('link');
            link.href = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&display=swap";
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }

        loadCrisp() {
            window.$crisp = [];
            window.CRISP_WEBSITE_ID = this.crispId;
            const d = document;
            const s = d.createElement("script");
            s.src = "https://client.crisp.chat/l.js";
            s.async = 1;
            d.getElementsByTagName("head")[0].appendChild(s);
            window.$crisp.push(["do", "chat:hide"]);
            window.$crisp.push(["on", "chat:closed", () => {
                window.$crisp.push(["do", "chat:hide"]);
            }]);
        }

        injectStyles() {
            const css = `
                .bi-reset { all: initial; }
                .bi-root { font-family: ${this.theme.font}; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
                .bi-root * { box-sizing: border-box; }
                
                /* --- TRIGGER BUTTON --- */
                #bi-trigger {
                    position: fixed; bottom: 30px; right: 30px;
                    width: 56px; height: 56px;
                    background: #18181b;
                    border: 1px solid ${this.theme.glassBorder};
                    border-radius: 18px;
                    cursor: grab;
                    z-index: 2147483647;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,0,0,0.5);
                    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
                    color: ${this.theme.textMain};
                    animation: bi-wiggle 2s ease-in-out 1.5s;
                }
                
                @keyframes bi-wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    10% { transform: rotate(-10deg); }
                    20% { transform: rotate(10deg); }
                    30% { transform: rotate(-6deg); }
                    40% { transform: rotate(6deg); }
                    50% { transform: rotate(0deg); }
                }

                #bi-trigger:hover { 
                    transform: scale(1.08); 
                    box-shadow: 0 15px 35px -5px rgba(59, 130, 246, 0.3), 0 0 0 1px ${this.theme.accent};
                    border-color: ${this.theme.accent};
                }
                #bi-trigger:active { cursor: grabbing; transform: scale(0.95); }
                
                .bi-grip-lines { display: flex; gap: 2px; margin-top: 4px; opacity: 0.4; }
                .bi-grip-line { width: 12px; height: 2px; background: white; border-radius: 2px; }

                .bi-icon-wrap { position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
                #bi-trigger svg { position: absolute; width: 24px; height: 24px; transition: all 0.4s ease; }
                #bi-trigger.open .bi-menu-icon { transform: rotate(90deg); opacity: 0; }
                .bi-close-icon { opacity: 0; transform: scale(0.5); }
                #bi-trigger.open .bi-close-icon { opacity: 1; transform: scale(1); transform: rotate(0deg); }
                
                #bi-drag-tip {
                    position: absolute; right: 70px; top: 50%; transform: translateY(-50%);
                    background: rgba(24, 24, 27, 0.9);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #e4e4e7; padding: 8px 12px; border-radius: 10px;
                    font-family: ${this.theme.font}; font-size: 10px; font-weight: 600; 
                    text-transform: uppercase; letter-spacing: 0.05em;
                    pointer-events: none; opacity: 1; transition: opacity 0.5s; white-space: nowrap;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                }
                #bi-drag-tip::after {
                    content: ''; position: absolute; right: -4px; top: 50%; transform: translateY(-50%);
                    border-width: 4px; border-style: solid;
                    border-color: transparent transparent transparent rgba(24, 24, 27, 0.9);
                }

                /* --- SIDEBAR --- */
                #bi-sidebar {
                    position: fixed; top: 10px; bottom: 10px; right: 10px;
                    width: 340px; max-width: 90vw;
                    background: ${this.theme.glassBg};
                    backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
                    border: 1px solid ${this.theme.glassBorder};
                    border-radius: 24px;
                    z-index: 2147483646;
                    transform: translateX(120%);
                    opacity: 0;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex; flex-direction: column;
                    box-shadow: -20px 0 50px rgba(0,0,0,0.5);
                    overflow: hidden;
                }
                #bi-sidebar.open { transform: translateX(0); opacity: 1; }
                
                .bi-header {
                    padding: 16px 20px;
                    display: flex; align-items: center; gap: 10px;
                    border-bottom: 1px solid ${this.theme.glassBorder};
                    background: rgba(255,255,255,0.02);
                }
                .bi-logo { width: 24px; height: 24px; border-radius: 6px; background: ${this.theme.accent}; display: grid; place-items: center; color: white; font-weight: bold; font-size: 14px; flex-shrink: 0; }
                .bi-title { font-weight: 600; font-size: 15px; color: ${this.theme.textMain}; letter-spacing: -0.02em; margin-right: auto; }
                
                .bi-action-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: ${this.theme.textMuted};
                    border-radius: 8px;
                    padding: 6px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s; font-size: 11px; font-weight: 600;
                }
                .bi-action-btn:hover { background: rgba(255,255,255,0.1); color: white; }
                .bi-btn-os { padding: 6px 10px; gap: 6px; }
                .bi-btn-os svg { width: 14px; height: 14px; }
                
                .bi-search-wrap { padding: 12px 12px 4px 12px; }
                .bi-search-box {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid ${this.theme.glassBorder};
                    border-radius: 12px;
                    display: flex; align-items: center;
                    padding: 8px 12px; gap: 8px;
                    transition: border-color 0.2s;
                }
                .bi-search-box:focus-within { border-color: ${this.theme.accent}; }
                .bi-search-box svg { width: 14px; height: 14px; color: ${this.theme.textMuted}; }
                .bi-input {
                    background: transparent; border: none; outline: none;
                    color: white; font-size: 13px; width: 100%; font-family: ${this.theme.font};
                }
                .bi-input::placeholder { color: #52525b; }

                .bi-content { flex: 1; overflow-y: auto; padding: 8px 12px; }
                .bi-content::-webkit-scrollbar { width: 0px; background: transparent; }
                
                .bi-card {
                    display: flex; align-items: center; gap: 14px;
                    padding: 12px; margin-bottom: 4px;
                    border-radius: 12px; text-decoration: none;
                    transition: all 0.2s ease;
                    background: transparent; border: 1px solid transparent;
                    cursor: pointer;
                }
                .bi-card:hover {
                    background: rgba(255,255,255,0.03);
                    border-color: ${this.theme.glassBorder};
                    transform: translateX(4px);
                }
                .bi-card-img {
                    width: 38px; height: 38px; border-radius: 10px;
                    background: #27272a; object-fit: cover;
                    border: 1px solid ${this.theme.glassBorder};
                }
                .bi-card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
                .bi-card-title { color: #f4f4f5; font-size: 14px; font-weight: 500; }
                .bi-card-desc { color: #71717a; font-size: 11px; }

                /* --- IFRAME OVERLAY (Full Screen Project View) --- */
                #bi-iframe-container {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    background: #000; z-index: 2147483645; /* Below button/sidebar */
                    opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
                    display: flex; flex-direction: column;
                }
                #bi-iframe-container.active { opacity: 1; pointer-events: auto; }
                
                #bi-iframe-header {
                    height: 50px; background: #09090b; border-bottom: 1px solid #27272a;
                    display: flex; align-items: center; justify-content: space-between; padding: 0 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                }
                #bi-iframe-title { font-weight: 600; font-size: 14px; color: white; }
                #bi-iframe-close {
                    background: #27272a; border: none; color: #a1a1aa;
                    width: 30px; height: 30px; border-radius: 6px;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s;
                }
                #bi-iframe-close:hover { background: #ef4444; color: white; }
                
                #bi-iframe {
                    flex: 1; width: 100%; border: none; background: white;
                }
                
                /* Main Overlay Backdrop */
                #bi-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.3);
                    backdrop-filter: blur(4px); z-index: 2147483645;
                    opacity: 0; pointer-events: none; transition: opacity 0.4s;
                }
                #bi-overlay.visible { opacity: 1; pointer-events: auto; }
            `;
            const s = document.createElement('style');
            s.textContent = css;
            document.head.appendChild(s);
        }

        createElements() {
            // 1. Sidebar Overlay Backdrop
            this.overlay = document.createElement('div');
            this.overlay.id = 'bi-overlay';
            this.overlay.onclick = () => this.toggle();

            // 2. Fullscreen Iframe Container (Hidden initially)
            this.iframeContainer = document.createElement('div');
            this.iframeContainer.id = 'bi-iframe-container';
            this.iframeContainer.className = 'bi-root';
            this.iframeContainer.innerHTML = `
                <div id="bi-iframe-header">
                    <span id="bi-iframe-title">Project View</span>
                    <button id="bi-iframe-close" title="Close Project">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <iframe id="bi-iframe" src="about:blank"></iframe>
            `;

            // 3. Trigger Button
            const menuIcon = `<svg class="bi-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
            const closeIcon = `<svg class="bi-close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

            this.btn = document.createElement('div');
            this.btn.id = 'bi-trigger';
            this.btn.innerHTML = `
                <div id="bi-drag-tip">DRAG OR CLICK TO OPEN</div>
                <div class="bi-icon-wrap">${menuIcon}${closeIcon}</div>
                <div class="bi-grip-lines"><div class="bi-grip-line" style="width:4px"></div><div class="bi-grip-line" style="width:16px"></div><div class="bi-grip-line" style="width:4px"></div></div>
            `;
            
            // 4. Sidebar
            this.sidebar = document.createElement('div');
            this.sidebar.id = 'bi-sidebar';
            this.sidebar.className = 'bi-root';
            this.sidebar.innerHTML = `
                <div class="bi-header">
                    <div class="bi-logo">B</div>
                    <div class="bi-title">BlackICE</div>
                    <button id="bi-chat-btn" class="bi-action-btn" title="Support Chat">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <button id="bi-fs-btn" class="bi-action-btn" title="Toggle Fullscreen">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                    </button>
                    <button id="bi-os-btn" class="bi-action-btn bi-btn-os">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                        OS
                    </button>
                </div>
                <div class="bi-search-wrap">
                    <div class="bi-search-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" id="bi-search" class="bi-input" placeholder="Search projects...">
                    </div>
                </div>
                <div class="bi-content" id="bi-list">
                    <div style="padding:20px; text-align:center; color:#52525b; font-size:12px;">Loading...</div>
                </div>
            `;

            document.body.append(this.iframeContainer, this.overlay, this.btn, this.sidebar);
        }

        setupActions() {
            document.getElementById('bi-os-btn').onclick = () => window.open(this.osUrl, '_blank');
            document.getElementById('bi-fs-btn').onclick = () => {
                if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.log(e));
                else document.exitFullscreen();
            };
            
            document.getElementById('bi-chat-btn').onclick = () => {
                window.$crisp.push(["do", "chat:open"]);
                window.$crisp.push(["do", "chat:show"]);
            };

            document.getElementById('bi-search').oninput = (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.allProjects.filter(p => (p.title || '').toLowerCase().includes(term));
                this.renderProjects(filtered);
            };

            // Close Iframe
            document.getElementById('bi-iframe-close').onclick = () => {
                this.closeProject();
            };
        }

        async fetchProjects() {
            try {
                const res = await fetch(this.dbUrl);
                const data = await res.json();
                if (data) {
                    this.allProjects = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
                    this.allProjects.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                    this.renderProjects(this.allProjects);
                }
            } catch (err) {
                document.getElementById('bi-list').innerHTML = `<div style="padding:20px; text-align:center; color:#71717a">Unable to load portal.</div>`;
            }
        }

        renderProjects(projects) {
            const list = document.getElementById('bi-list');
            list.innerHTML = ""; 
            if(projects.length === 0) {
                list.innerHTML = `<div style="padding:20px; text-align:center; color:#52525b; font-size:12px;">No results found.</div>`;
                return;
            }
            projects.forEach(p => {
                const screenshot = `https://api.microlink.io/?url=${encodeURIComponent(p.url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=800&viewport.height=600`;
                const el = document.createElement('div'); // Changed from <a> to <div>
                el.className = 'bi-card';
                // Remove href, add onclick
                el.onclick = () => this.openProject(p.url, p.title);
                
                el.innerHTML = `
                    <img src="${screenshot}" class="bi-card-img" loading="lazy" />
                    <div class="bi-card-info">
                        <div class="bi-card-title">${p.title || 'Untitled Project'}</div>
                        <div class="bi-card-desc">Click to launch app</div>
                    </div>
                `;
                list.appendChild(el);
            });
        }
        
        // NEW: Open Project in Iframe
        openProject(url, title) {
            const iframe = document.getElementById('bi-iframe');
            const container = document.getElementById('bi-iframe-container');
            const titleEl = document.getElementById('bi-iframe-title');
            
            titleEl.innerText = title || 'Project View';
            iframe.src = url;
            container.classList.add('active');
            
            // Close the sidebar automatically for better view
            this.toggle(); 
        }

        // NEW: Close Project Iframe
        closeProject() {
            const container = document.getElementById('bi-iframe-container');
            const iframe = document.getElementById('bi-iframe');
            
            container.classList.remove('active');
            setTimeout(() => {
                iframe.src = 'about:blank'; // Clear source to stop audio/video
            }, 300);
            
            // Re-open sidebar so user can choose another
            this.toggle();
        }

        setupDraggable() {
            let isDragging = false;
            let startX, startY, initLeft, initTop;
            let totalMove = 0;

            const onDown = (e) => {
                const tip = document.getElementById('bi-drag-tip');
                if(tip) tip.style.opacity = '0';
                
                const evt = e.touches ? e.touches[0] : e;
                isDragging = true;
                totalMove = 0;
                startX = evt.clientX; startY = evt.clientY;
                const rect = this.btn.getBoundingClientRect();
                initLeft = rect.left; initTop = rect.top;
                e.preventDefault();
                document.addEventListener('mousemove', onMove);
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('mouseup', onUp);
                document.addEventListener('touchend', onUp);
            };

            const onMove = (e) => {
                if (!isDragging) return;
                const evt = e.touches ? e.touches[0] : e;
                const dx = evt.clientX - startX;
                const dy = evt.clientY - startY;
                totalMove += Math.abs(dx) + Math.abs(dy);
                this.btn.style.left = `${initLeft + dx}px`;
                this.btn.style.top = `${initTop + dy}px`;
                this.btn.style.right = 'auto'; this.btn.style.bottom = 'auto';
            };

            const onUp = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.removeEventListener('touchend', onUp);
                if (totalMove < 5) this.toggle();
            };

            this.btn.addEventListener('mousedown', onDown);
            this.btn.addEventListener('touchstart', onDown, { passive: false });
        }

        toggle() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.sidebar.classList.add('open');
                this.btn.classList.add('open');
                this.overlay.classList.add('visible');
                setTimeout(() => document.getElementById('bi-search').focus(), 100);
            } else {
                this.sidebar.classList.remove('open');
                this.btn.classList.remove('open');
                this.overlay.classList.remove('visible');
            }
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new BlackICEWidget());
    else new BlackICEWidget();
})();
