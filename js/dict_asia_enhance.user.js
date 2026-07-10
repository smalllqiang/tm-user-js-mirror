// ==UserScript==
// @name         Dict Asia Enhance
// @namespace    https://github.com/smalllqiang
// @version      0.1.0
// @description  Dict Asia 頁面淨化
// @author       sq
// @match        https://dict.asia/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dict.asia
// @grant        none
// @downloadURL  https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/dict_asia_enhance.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/dict_asia_enhance.meta.js
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";
    const currentUrl = window.location.href;
    // 網址正則匹配樣式
    const patterns = {
        mainPage: /^https:\/\/dict\.asia\/.*$/,
    };

    // 以下是CSS Selector
    const mainPageSelector = {
        remove: ["div.ad"],
        hideVisibility: [],
        hideDisplay: [],
        monitor: [],
    };

    //使用的函式
    function dictAsiaEnhanceLog(text) {
        console.log(
            "%cDict Asia 增強",
            "color: #80BF26;padding: 2px;border: 1px solid;border-radius: 3px;border-color: #80BF26;background-color: #151515",
            text,
        );
    }
    function dictAsiaEnhanceDebug(text) {
        console.debug(
            "%cDict Asia 增強",
            "color: #80BF26;padding: 2px;border: 1px solid;border-radius: 3px;border-color: #80BF26;background-color: #151515",
            text,
        );
    }
    function hideElementsDisplay(selectors) {
        if (selectors == false) {
            return;
        }
        let selector = selectors.join(", ");
        document.querySelectorAll(selector).forEach((node) => {
            if (node.style.display !== "none") {
                node.style.display = "none";
            }
        });
    }
    function hideElementsVisibility(selectors) {
        if (selectors == false) {
            return;
        }
        let selector = selectors.join(", ");
        document.querySelectorAll(selector).forEach((node) => {
            if (node.style.visibility !== "hidden") {
                node.style.visibility = "hidden";
            }
        });
    }
    function removeElements(selectors) {
        if (selectors == false) {
            return;
        }
        let selector = selectors.join(", ");
        document.querySelectorAll(selector).forEach((node) => {
            node.remove();
        });
    }
    function monitorNewNode(clearFunction, selectors) {
        // 使用 MutationObserver 監聽動態加載的元素
        if (selectors == false) {
            dictAsiaEnhanceDebug("2");
            return;
        }
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
                dictAsiaEnhanceDebug("yes");
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
        dictAsiaEnhanceLog(currentUrl);
        if (patterns.mainPage.test(currentUrl)) {
            function clearMainPage() {
                removeElements(mainPageSelector.remove);
                hideElementsVisibility(mainPageSelector.hideVisibility);
                hideElementsDisplay(mainPageSelector.hideDisplay);
                dictAsiaEnhanceLog("清除");
            }

            // 初始執行一次
            clearMainPage();
            dictAsiaEnhanceDebug("1");
            monitorNewNode(clearMainPage, mainPageSelector.monitor);
        } else {
            dictAsiaEnhanceLog("未適配的頁面");
        }
    }, 2000);
})();
