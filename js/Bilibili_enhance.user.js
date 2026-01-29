// ==UserScript==
// @name         Bilibili Enhance
// @namespace    https://github.com/smalllqiang
// @version      0.0.3
// @description  B站增強
// @author       sq
// @match        https://www.bilibili.com/
// @match        https://www.bilibili.com/?spm_id_from=*
// @match        https://t.bilibili.com/*
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/watchlater/*
// @match        https://space.bilibili.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.bilibili.com
// @grant        none
// @downloadURL  https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/Bilibili_enhance.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/Bilibili_enhance.meta.js
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";
    const currentUrl = window.location.href;
    // 網址正則匹配樣式
    const patterns = {
        mainPage: /^https:\/\/www\.bilibili\.com\/(\?spm_id_from=[^&]*)?$/,
        tPage: /^https:\/\/t\.bilibili\.com\/.*/,
        videoPage: /^https:\/\/www\.bilibili\.com\/video\/.*/,
        spacePage: /^https:\/\/space\.bilibili\.com\/.*/,
    };

    // 以下是CSS Selector
    const headerSelector = {
        remove: ["div.vip-entry-containter"], // 鼠標放在右上角用戶頭像彈出的東西裏大會員續費提示
        hideVisibility: ["div.vip-wrap", "ul.left-entry"], // div.vip-wrap:右上大會員  ul.left-entry:頂部左側內容
        hideDisplay: ["div.trending"], // 搜索欄熱榜
        monitor: ["div.trending", "div.vip-entry-containter"], // div.trending:搜索欄熱榜  div.vip-entry-containter:鼠標放在右上角用戶頭像彈出的東西裏大會員續費提示
    };
    const mainPageSelector = {
        remove: [
            ...headerSelector.remove,
            "main.bili-feed4-layout",
            "div.header-channel",
            "div.palette-button-outer.palette-feed4",
            "div.right-channel-container",
        ], // main.bili-feed4-layout:主內容流  div.header-channel:往下滑後頂部會出現的欄目  div.palette-button-outer.palette-feed4:右下一些按鈕  div.right-channel-container:banner下方右側內容
        hideVisibility: [...headerSelector.hideVisibility],
        hideDisplay: [...headerSelector.hideDisplay],
        monitor: [...headerSelector.monitor],
    };
    const tPageSelector = {
        remove: [...headerSelector.remove],
        hideVisibility: [...headerSelector.hideVisibility, "aside.right"], // 右邊欄社區中心,熱搜
        hideDisplay: [...headerSelector.hideDisplay],
        monitor: [...headerSelector.monitor],
    };
    const videoPageSelector = {
        remove: [
            ...headerSelector.remove,
            "div.video-card-ad-small",
            "div#slide_ad",
            "div.slide-ad-exp",
            "div.ad-report.left-banner",
            "div.strip-ad.left-banner",
            "div.ad-report.right-bottom-banner",
            "div.ad-floor-exp.right-bottom-banner",
        ], // div.video-card-ad-small,div#slide_ad,div.slide-ad-exp:右側彈幕盒子下的小廣告 div.ad-report.left-banner, div.strip-ad.left-banner: tag下方 評論上方的廣告  div.ad-report.right-bottom-banner div.ad-floor-exp.right-bottom-banner: 推薦列表下的小盒子
        hideVisibility: [...headerSelector.hideVisibility],
        hideDisplay: [...headerSelector.hideDisplay],
        monitor: [...headerSelector.monitor],
    };
    const spacePageSelector = {
        remove: [...headerSelector.remove],
        hideVisibility: [...headerSelector.hideVisibility],
        hideDisplay: [...headerSelector.hideDisplay],
        monitor: [...headerSelector.monitor],
    };

    //使用的函式
    function biliEnhanceLog(text) {
        console.log(
            "%cB站增強",
            "color: #0087BD;padding: 2px;border: 1px solid;border-radius: 3px;border-color: #0087BD;background-color: #151515",
            text,
        );
    }
    function hideElementsDisplay(selectors) {
        let selector = selectors.join(", ");
        document.querySelectorAll(selector).forEach((node) => {
            if (node.style.display !== "none") {
                node.style.display = "none";
            }
        });
    }
    function hideElementsVisibility(selectors) {
        let selector = selectors.join(", ");
        document.querySelectorAll(selector).forEach((node) => {
            if (node.style.visibility !== "hidden") {
                node.style.visibility = "hidden";
            }
        });
    }
    function removeElements(selectors) {
        let selector = selectors.join(", ");
        document.querySelectorAll(selector).forEach((node) => {
            node.remove();
        });
    }
    function clearSearchInput() {
        // 移除搜索欄輸入框顯示的推薦文字
        const input = document.querySelector("input.nav-search-input");
        input.removeAttribute("placeholder");
        input.removeAttribute("title");
    }
    function monitorNewNode(clearFunction, selectors) {
        // 使用 MutationObserver 監聽動態加載的元素
        let selector = selectors.join(", ");
        const observer = new MutationObserver((mutations) => {
            let shouldClean = false;
            for (const mutation of mutations) {
                // 檢查新增的節點
                if (mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 檢查是否是我們關注的選擇器對應的元素
                            if (
                                node.matches?.(selector) ||
                                node.querySelector?.(selector)
                            ) {
                                shouldClean = true;
                                break;
                            }
                        }
                    }
                }
                if (shouldClean) break;
            }
            if (shouldClean) {
                clearFunction();
            }
        });
        // 監聽整個文檔的子樹變化
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
        // 可選：一段時間後斷開觀察器以節省性能（例如頁面加載完成 10 秒後）
        // setTimeout(() => observer.disconnect(), 10000);
    }

    // 主邏輯
    setTimeout(() => {
        if (patterns.mainPage.test(currentUrl)) {
            biliEnhanceLog("這是主頁");

            function clearMainPage() {
                removeElements(mainPageSelector.remove);
                hideElementsVisibility(mainPageSelector.hideVisibility);
                hideElementsDisplay(mainPageSelector.hideDisplay);
                clearSearchInput();
                biliEnhanceLog("清除");
            }

            // 初始執行一次
            clearMainPage();
            monitorNewNode(clearMainPage, mainPageSelector.monitor);
        } else if (patterns.tPage.test(currentUrl)) {
            biliEnhanceLog("這是動態頁");

            function clearTPage() {
                removeElements(tPageSelector.remove);
                hideElementsVisibility(tPageSelector.hideVisibility);
                hideElementsDisplay(tPageSelector.hideDisplay);
                clearSearchInput();
                biliEnhanceLog("清除");
            }
            clearTPage();
            monitorNewNode(clearTPage, tPageSelector.monitor);
        } else if (patterns.videoPage.test(currentUrl)) {
            biliEnhanceLog("這是普通視頻播放頁");

            function clearTPage() {
                removeElements(videoPageSelector.remove);
                hideElementsVisibility(videoPageSelector.hideVisibility);
                hideElementsDisplay(videoPageSelector.hideDisplay);
                clearSearchInput();
                biliEnhanceLog("清除");
            }
            clearTPage();
            monitorNewNode(clearTPage, videoPageSelector.monitor);
        } else if (patterns.spacePage.test(currentUrl)) {
            biliEnhanceLog("這是個人主頁");

            function clearTPage() {
                removeElements(spacePageSelector.remove);
                hideElementsVisibility(spacePageSelector.hideVisibility);
                hideElementsDisplay(spacePageSelector.hideDisplay);
                clearSearchInput();
                biliEnhanceLog("清除");
            }
            clearTPage();
            monitorNewNode(clearTPage, spacePageSelector.monitor);
        }
    }, 2000);
})();
