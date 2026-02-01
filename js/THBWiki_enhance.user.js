// ==UserScript==
// @name         THBWiki Enhance
// @namespace    https://github.com/smalllqiang
// @version      0.0.2
// @description  THBWiki增強
// @author       sq
// @match        https://thwiki.cc/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=thwiki.cc
// @grant        none
// @downloadURL  https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/THBWiki_enhance.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/THBWiki_enhance.meta.js
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";

    function thbEnhanceLog(text) {
        console.log(
            "%cTHB增強",
            "background:linear-gradient(90deg,#F1AF44,#FE9CEB);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;padding:2px;border:1px solid;border-radius:3px;border-color:#F9A4A6;background-color:#1E1F20",
            text,
        );
    }

    let thbExtTabSelector = "nav#p-thbext";
    // 使用 MutationObserver 監聽動態加載的元素
    const observer = new MutationObserver((mutations) => {
        let shouldClean = false;
        for (const mutation of mutations) {
            // 檢查新增的節點
            if (mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 檢查是否是我們關注的選擇器對應的元素
                        if (
                            node.matches?.(thbExtTabSelector) ||
                            node.querySelector?.(thbExtTabSelector)
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
            try {
                let thbExtTab = document.querySelector(thbExtTabSelector);
                thbExtTab.style.display = "none";
                thbEnhanceLog("已清除THB擴展的tab");
            } catch (error) {
                thbEnhanceLog(error);
            }
        }
    });
    // 監聽整個文檔的子樹變化
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
    // 可選：一段時間後斷開觀察器以節省性能（例如頁面加載完成 10 秒後）
    // setTimeout(() => observer.disconnect(), 10000);
})();
