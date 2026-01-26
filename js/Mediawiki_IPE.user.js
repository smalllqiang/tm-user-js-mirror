// ==UserScript==
// @name         Mediawiki IPE
// @namespace    Mediawiki IPE
// @version      0.0.1
// @description  Mediawiki使用IPE工具
// @author       dragon-fish, sq修改
// @match        newmoon.click/*
// @match        thwiki.cc/*
// @match        *.moegirl.org.cn/*
// @grant        none
// @downloadURL  https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/Mediawiki_IPE.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/Mediawiki_IPE.meta.js
// ==/UserScript==

!(function () {
    // RLQ是MediaWiki保存异步执行函数的数组
    window.RLQ = RLQ || [];
    RLQ.push(() => {
        // 等待jQuery加载完毕
        var _count = 0;
        var _interval = setInterval(() => {
            _count++;
            if (typeof jQuery !== "undefined") {
                // jQuery加载完毕
                clearInterval(_interval);
                // 防止网站并不是MediaWiki时报错
                try {
                    mw.loader.load(
                        "https://cdn.jsdelivr.net/npm/mediawiki-inpageedit",
                    );
                } catch (e) {}
            } else if (_count > 30 * 5) {
                // 加载超时
                clearInterval(_interval);
            }
        }, 200);
    });
})();
