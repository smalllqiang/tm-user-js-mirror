// ==UserScript==
// @name         X/Twitter メディア一括ダウンローダー（iPhone/Android 対応)
// @name:en      One-Click X/Twitter Media Downloader (Android/iPhone support)
// @name:zh-CN   X/Twitter 媒体批量下载器 (支持 iPhone/Android)
// @name:zh-TW   X/Twitter 媒體批量下載器 (支援 iPhone/Android)
// @version      1.5.2
// @description  X/Twitterの画像、動画、GIFをワンクリックでダウンロードします。標準ではユーザーIDとポストIDで保存されますが、追加される設定画面からファイル名や日時フォーマットを自由に変更可能です。iPhoneやAndroid環境でもZIP集約により複数メディアを一括ダウンロードできます。ダウンロード履歴のローカル保存に加え、オプションでXのブックマーク機能を利用したオンライン同期にも対応しています。sq 改訂バージョン。
// @description:en   Download images, videos, and GIFs from X/Twitter with one click. By default, files are saved using the User ID and Post ID, but filenames and date formats can be freely customized via the integrated settings menu. Supports ZIP archiving for bulk downloads on iPhone and Android. In addition to local history tracking, it optionally features online synchronization using X's bookmark feature. sq edition.
// @description:zh-CN 一键下载 X/Twitter 的图片、视频和 GIF。默认以用户 ID 和帖子 ID 保存，可通过集成的设置页面自由自定义文件名和日期格式。支持在 iPhone 和 Android 上通过 ZIP 压缩一键批量下载媒体。除本地保存下载历史记录外，还支持选择利用 X 的书签功能实现跨设备在线同步。sq 修改版。
// @description:zh-TW 一鍵下載 X/Twitter 的圖片、影片和 GIF。預設以使用者 ID 和貼文 ID 儲存，可透過整合的設定頁面自由自訂檔案名稱與日期格式。支援在 iPhone 和 Android 上透過 ZIP 壓縮一鍵批次下載媒體。除本機儲存下載歷史紀錄外，還支援選擇利用 X 的書籤功能實現跨裝置線上同步。sq 修改版。
// @require      https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1.11.13/dayjs.min.js
// @require      https://cdn.jsdelivr.net/npm/dayjs@1.11.13/plugin/utc.js
// @author       Azuki, sq
// @license      MIT
// @match        https://twitter.com/*
// @match        https://x.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @connect      twitter.com
// @connect      x.com
// @connect      pbs.twimg.com
// @connect      video.twimg.com
// @grant        GM_xmlhttpRequest
// @namespace    https://greasyfork.org/users/1441951
// @homepage     https://x.com/Azuki_0147
// @downloadURL  https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/X_media_downloader.user.js
// @updateURL    https://cdn.jsdelivr.net/gh/smalllqiang/tm-user-js-mirror@main/js/X_media_downloader.meta.js
// ==/UserScript==