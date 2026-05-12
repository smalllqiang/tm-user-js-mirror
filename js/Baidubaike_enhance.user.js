// ==UserScript==
// @name         Baidubaike Enhance
// @namespace    https://github.com/smalllqiang
// @version      0.1.0
// @description  百度百科頁面淨化
// @author       sq
// @match        https://baike.baidu.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=baike.baidu.com
// @grant        none
// @downloadURL  https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/Baidubaike_enhance.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/Baidubaike_enhance.meta.js
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";
    const currentUrl = window.location.href;
    // 網址正則匹配樣式
    const patterns = {
        mainPage: /^https:\/\/baike\.baidu\.com\/.*$/,
    };

    // 以下是CSS Selector
    const mainPageSelector = {
        remove: [
            "div#J-lemma-video-list", // 主內容上方視頻
            "div#J-right-tashuo", // 右側TA說
            "div#J-union-wrapper", // 右側廣告
            "div#J-bottom-recommend-wrapper", //底部猜你喜歡廣告
            "div#J-related-search", //底部相關搜索
            "div#J-bottom-tashuo", //底部TA說
            "div[class^='bannerAdBox_']", //內容內條幅廣告
            "div[class^='secondContainer_']", //科普中國背景
            //"div[class^='declareWrap_']",//頂部警告
            //"div[class^='index-module_navBarWrapper_']",//頂部藍色導航
            "div[data-module-type='video'] div[class^='videoWrap_']", //
        ],
        hideVisibility: [],
        hideDisplay: [],
        monitor: ["div[data-module-type='video'] div[class^='videoWrap_']"],
    };

    //使用的函式
    function baikeEnhanceLog(text) {
        console.log(
            "%c百度百科增強",
            "color: #479df5;padding: 2px;border: 1px solid;border-radius: 3px;border-color: #479df5;background-color: #151515",
            text,
        );
    }
    function baikeEnhanceDebug(text) {
        console.debug(
            "%c百度百科增強",
            "color: #479df5;padding: 2px;border: 1px solid;border-radius: 3px;border-color: #479df5;background-color: #151515",
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
            baikeEnhanceDebug("2");
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
                baikeEnhanceDebug("yes");
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
        baikeEnhanceLog(currentUrl);
        if (patterns.mainPage.test(currentUrl)) {
            function clearMainPage() {
                removeElements(mainPageSelector.remove);
                hideElementsVisibility(mainPageSelector.hideVisibility);
                hideElementsDisplay(mainPageSelector.hideDisplay);
                baikeEnhanceLog("清除");
            }

            // 初始執行一次
            clearMainPage();
            baikeEnhanceDebug("1");
            monitorNewNode(clearMainPage, mainPageSelector.monitor);
        } else {
            baikeEnhanceLog("未適配的頁面");
        }
    }, 2000);
})();
