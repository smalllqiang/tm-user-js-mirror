// ==UserScript==
// @name         QQ外鏈自動跳轉
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  自動提取 c.pc.qq.com/ios.html 中的 url 參數並跳轉至目標網址
// @author       sq
// @match        https://c.pc.qq.com/ios.html*
// @match        https://c.pc.qq.com/middlem.html*
// @match        https://c.pc.qq.com/index.html*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    "use strict";

    // 获取当前 URL 的查询参数
    const urlParams = new URLSearchParams(window.location.search);

    // 尝试获取 url 参数
    let targetUrl = urlParams.get("url");

    // 如果没找到 url 参数，尝试获取 pfurl（有时腾讯用这个参数名）
    if (!targetUrl) {
        targetUrl = urlParams.get("pfurl");
    }

    // 如果找到了目标 URL
    if (targetUrl) {
        try {
            // URL 解码（处理 %2F 等编码字符）
            targetUrl = decodeURIComponent(targetUrl);

            // 验证 URL 是否有效（基本验证）
            if (
                targetUrl.startsWith("http://") ||
                targetUrl.startsWith("https://")
            ) {
                // 停止页面加载并立即跳转
                window.stop();
                window.location.replace(targetUrl);
            } else {
                console.warn("[QQ外链跳转] 提取的 URL 格式不正确:", targetUrl);
            }
        } catch (e) {
            console.error("[QQ外链跳转] URL 解码失败:", e);
        }
    } else {
        console.log("[QQ外链跳转] 未找到目标 URL 参数");
    }
})();
