// ==UserScript==
// @name         Mediawiki IPE
// @namespace    https://github.com/smalllqiang
// @version      0.1.1
// @description  Mediawiki使用IPE工具
// @author       smalllqiang
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.mediawiki.org
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @downloadURL  https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/Mediawiki_IPE.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/Mediawiki_IPE.meta.js
// ==/UserScript==

(function () {
    "use strict";

    const w = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

    const STORAGE_KEY = "ipe.enabledSites";
    const DEFAULT_SITES = ["mediawiki.org", "moegirl.org.cn", "thwiki.cc"];

    function getEnabledSites() {
        let list = GM_getValue(STORAGE_KEY, null);
        if (!Array.isArray(list)) {
            list = DEFAULT_SITES.slice();
            GM_setValue(STORAGE_KEY, list);
        }
        return list;
    }

    function setEnabledSites(list) {
        const uniq = [
            ...new Set(
                list.map((s) => String(s).trim().toLowerCase()).filter(Boolean),
            ),
        ];
        GM_setValue(STORAGE_KEY, uniq);
        return uniq;
    }

    function normalizeHost(host) {
        return String(host)
            .replace(/^www\./, "")
            .toLowerCase();
    }

    function parseHostInput(input) {
        return normalizeHost(
            String(input)
                .trim()
                .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
                .replace(/\/.*$/, "")
                .replace(/:\d+$/, ""),
        );
    }

    function isEnabled(host) {
        const h = normalizeHost(host);
        return getEnabledSites().some((site) => {
            const s = site.toLowerCase();
            return h === s || h.endsWith("." + s);
        });
    }

    function addSite(host) {
        const s = parseHostInput(host);
        if (!s) return getEnabledSites();
        const sites = getEnabledSites();
        if (!sites.includes(s)) {
            sites.push(s);
            setEnabledSites(sites);
        }
        return sites;
    }

    function removeSite(host) {
        const s = normalizeHost(host);
        const sites = getEnabledSites().filter((item) => item !== s);
        setEnabledSites(sites);
        return sites;
    }

    function injectIPE() {
        let count = 0;
        const interval = setInterval(() => {
            count++;
            if (typeof w.jQuery !== "undefined") {
                clearInterval(interval);
                // 防止网站并不是MediaWiki时报错
                try {
                    w.mw.loader.load(
                        "https://cdn.jsdelivr.net/npm/mediawiki-inpageedit",
                    );
                    console.log("[IPE] 正在加载...");
                } catch (e) {}
            } else if (count > 30 * 5) {
                clearInterval(interval);
                console.error("[IPE] 等待jQuery加载超时");
            }
        }, 200);
    }

    let started = false;
    function startIPE() {
        if (started) return;
        started = true;
        injectIPE();
    }

    function loadIPE() {
        w.RLQ = w.RLQ || [];
        try {
            w.RLQ.push(startIPE);
        } catch (error) {
            startIPE();
        }
        setTimeout(startIPE, 5000);
    }

    function openManager() {
        if (document.getElementById("ipe-manager")) return;

        const overlay = document.createElement("div");
        overlay.id = "ipe-manager";
        overlay.style.cssText =
            "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;";

        const panel = document.createElement("div");
        panel.style.cssText =
            "width:min(440px,92vw);max-height:80vh;overflow:auto;background:#fff;color:#202122;border-radius:10px;padding:18px 20px;box-shadow:0 8px 32px rgba(0,0,0,.3);";

        const title = document.createElement("h2");
        title.textContent = "IPE 启用网站";
        title.style.cssText = "margin:0 0 4px;font-size:18px;";
        panel.appendChild(title);

        const hint = document.createElement("p");
        hint.textContent = "命中以下域名的网站会自动加载 IPE（支持子域名）。";
        hint.style.cssText = "margin:0 0 12px;font-size:12px;color:#54595d;";
        panel.appendChild(hint);

        const listEl = document.createElement("div");
        listEl.style.cssText =
            "display:flex;flex-direction:column;gap:6px;margin-bottom:12px;";
        panel.appendChild(listEl);

        function renderList() {
            listEl.textContent = "";
            const sites = getEnabledSites();
            if (!sites.length) {
                const empty = document.createElement("div");
                empty.textContent = "（空）";
                empty.style.cssText = "color:#72777d;font-size:13px;";
                listEl.appendChild(empty);
            }
            sites.forEach((site) => {
                const row = document.createElement("div");
                row.style.cssText =
                    "display:flex;align-items:center;justify-content:space-between;gap:8px;background:#f8f9fa;border:1px solid #eaecf0;border-radius:6px;padding:6px 10px;font-size:14px;";
                const name = document.createElement("span");
                name.textContent = site;
                const del = document.createElement("button");
                del.textContent = "移除";
                del.style.cssText =
                    "cursor:pointer;border:none;background:none;color:#d33;font-size:13px;";
                del.addEventListener("click", () => {
                    removeSite(site);
                    renderList();
                });
                row.append(name, del);
                listEl.appendChild(row);
            });
        }
        renderList();

        const addRow = document.createElement("div");
        addRow.style.cssText = "display:flex;gap:8px;";
        const input = document.createElement("input");
        input.placeholder = "例如 example.com";
        input.style.cssText =
            "flex:1;padding:7px 10px;border:1px solid #a2a9b1;border-radius:6px;font-size:14px;";
        const addBtn = document.createElement("button");
        addBtn.textContent = "添加";
        addBtn.style.cssText =
            "cursor:pointer;padding:7px 14px;border:none;border-radius:6px;background:#36c;color:#fff;font-size:14px;";
        const handleAdd = () => {
            const value = input.value.trim();
            if (!value) return;
            addSite(value);
            input.value = "";
            renderList();
        };
        addBtn.addEventListener("click", handleAdd);
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") handleAdd();
        });
        addRow.append(input, addBtn);
        panel.appendChild(addRow);

        const footer = document.createElement("div");
        footer.style.cssText =
            "display:flex;justify-content:space-between;align-items:center;margin-top:16px;";
        const host = location.hostname;
        const currentBtn = document.createElement("button");
        currentBtn.textContent =
            isEnabled(host) ? "移除当前网站" : "添加当前网站";
        currentBtn.style.cssText =
            "cursor:pointer;border:none;background:none;color:#36c;font-size:13px;";
        currentBtn.addEventListener("click", () => {
            if (isEnabled(host)) removeSite(host);
            else addSite(host);
            location.reload();
        });
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "完成";
        closeBtn.style.cssText =
            "cursor:pointer;padding:7px 16px;border:none;border-radius:6px;background:#eaecf0;font-size:14px;";
        closeBtn.addEventListener("click", () => overlay.remove());
        footer.append(currentBtn, closeBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);
    }

    function registerMenus() {
        const host = location.hostname;
        if (isEnabled(host)) {
            GM_registerMenuCommand("移除当前网站 (" + host + ")", () => {
                removeSite(host);
                location.reload();
            });
        } else {
            GM_registerMenuCommand("添加当前网站 (" + host + ")", () => {
                addSite(host);
                location.reload();
            });
        }
        GM_registerMenuCommand("管理启用网站列表...", openManager);
    }

    function isMediaWikiPage() {
        const generator = document.querySelector('meta[name="generator"]');
        if (
            generator &&
            /mediawiki/i.test(generator.getAttribute("content") || "")
        ) {
            return true;
        }
        if (w.mw) return true;
        if (Array.isArray(w.RLQ)) return true;
        return false;
    }

    function showEnableButton() {
        if (document.getElementById("ipe-enable")) return;
        const btn = document.createElement("button");
        btn.id = "ipe-enable";
        btn.textContent = "启用 IPE";
        btn.title = "将当前网站加入 IPE 启用列表";
        btn.style.cssText =
            "position:fixed;right:16px;bottom:16px;z-index:2147483646;padding:8px 14px;border:none;border-radius:999px;background:#36c;color:#fff;font-size:13px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.25);";
        btn.addEventListener("click", () => {
            addSite(location.hostname);
            location.reload();
        });
        document.body.appendChild(btn);
    }

    function main() {
        if (w.top !== w.self) return;

        registerMenus();

        if (isEnabled(location.hostname)) {
            loadIPE();
        } else if (document.body && isMediaWikiPage()) {
            showEnableButton();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", main);
    } else {
        main();
    }
})();
