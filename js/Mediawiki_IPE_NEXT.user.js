// ==UserScript==
// @name         Mediawiki IPE NEXT
// @namespace    Mediawiki IPE NEXT
// @version      0.1
// @description  Mediawiki使用IPE Next工具
// @author       dragon-fish, sq修改
// @match        newmoon.click/*
// @match        thwiki.cc/*
// @match        *.moegirl.org.cn/*
// @grant        none
// ==/UserScript==

!(function() {
  // RLQ是MediaWiki保存异步执行函数的数组
  window.RLQ = RLQ || [];
  RLQ.push(() => {
    // 等待jQuery加载完毕
    var _count = 0;
    var _interval = setInterval(() => {
      _count++;
      if (typeof jQuery !== "undefined") {
        // jQuery加载完毕，清除定时器
        clearInterval(_interval);
        
        // 动态创建script标签加载IPE Next
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@inpageedit/core/dist/index.js';
        script.type = 'module';
        document.body.appendChild(script);
        
        console.log('[IPE NEXT] 正在加载...');
      } else if (_count > 100) {
        // 超过10秒(100*100ms)仍未加载jQuery，放弃等待
        clearInterval(_interval);
        console.error('[IPE NEXT] 等待jQuery加载超时');
      }
    }, 100);
  });
})();