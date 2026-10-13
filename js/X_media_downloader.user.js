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
/*jshint esversion: 11 */

/*  sq修改, 自用.
    原始地址 https://greasyfork.org/zh-CN/scripts/528890-x-twitter-%E3%83%A1%E3%83%87%E3%82%A3%E3%82%A2%E4%B8%80%E6%8B%AC%E3%83%80%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%80%E3%83%BC-iphone-android-%E5%AF%BE%E5%BF%9C
*/

dayjs.extend(dayjs_plugin_utc);

(function () {
    "use strict";

    localStorage.removeItem("twitterInternalApiInfo");
    localStorage.removeItem("twitterApiInfoLastUpdateDate");

    let enableDownloadHistorySync =
        localStorage.getItem("twdl_enableSync") === "true";

    let filenameFormat = (
        localStorage.getItem("twdl_filenameFormat") ||
        "{userId}-{postId}-{mediaType}{index}"
    ).replace(/\.?{ext}$/, "");

    let postTimeFormat =
        localStorage.getItem("twdl_postTimeFormat") || "YYYYMMDD_HHmmss";

    let downloadMode = localStorage.getItem("twdl_downloadMode") || "blob";

    const generateFilename = (filenameElements, mediaTypeLabel, index, ext) => {
        const { userId, userName, postId, postTime } = filenameElements;

        const formattedPostTime = dayjs(postTime).format(postTimeFormat);

        const baseName = filenameFormat
            .replace(/{userId}/g, userId)
            .replace(/{userName}/g, userName)
            .replace(/{postId}/g, postId)
            .replace(/{postTime}/g, formattedPostTime)
            .replace(/{mediaType}/g, mediaTypeLabel)
            .replace(/{index}/g, index);

        return `${baseName}.${ext}`;
    };

    const gmFetch = (infoOrUrl, options = {}) =>
        new Promise((resolve, reject) => {
            const info =
                typeof infoOrUrl === "string" ?
                    { url: infoOrUrl }
                :   { ...infoOrUrl };

            info.method = options.method || info.method || "GET";
            info.headers = options.headers || info.headers || {};
            if (options.body) info.data = options.body;
            info.responseType = options.responseType;

            info.onload = (res) => {
                resolve({
                    ok: res.status >= 200 && res.status < 300,
                    status: res.status,
                    response: res.response,
                    json: () => Promise.resolve(res.response),
                    text: () =>
                        Promise.resolve(
                            typeof res.response === "string" ?
                                res.response
                            :   JSON.stringify(res.response),
                        ),
                    blob: () => {
                        if (res.response instanceof Blob) {
                            return Promise.resolve(res.response);
                        }
                        return Promise.resolve(new Blob([res.response]));
                    },
                });
            };
            info.onerror = (error) => {
                console.error("GM_xmlhttpRequest error:", error);
                reject(
                    new Error(
                        `GM_xmlhttpRequest failed: status=${error.status}, statusText=${error.statusText || "N/A"}`,
                    ),
                );
            };
            info.onabort = () => reject(new Error("GM_xmlhttpRequest aborted"));
            info.ontimeout = () =>
                reject(new Error("GM_xmlhttpRequest timed out"));

            GM_xmlhttpRequest(info);
        });

    const DB_NAME = "DownloadHistoryDB";
    const DB_VERSION = 1;
    const STORE_NAME = "downloadedPosts";

    let dbPromise = null;
    let downloadedPostsCache = new Set();

    const openDB = () => {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function (event) {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "postId" });
                }
            };
            request.onsuccess = function () {
                resolve(request.result);
            };
            request.onerror = function () {
                reject(request.error);
            };
        });
        return dbPromise;
    };

    const loadDownloadedPostsCache = () => {
        getDownloadedPostIdsIndexedDB()
            .then((ids) => {
                downloadedPostsCache = new Set(ids);
            })
            .catch((err) => console.error("IndexedDB 読み込みエラー:", err));
    };

    const getDownloadedPostIdsIndexedDB = () => {
        return openDB().then((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, "readonly");
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAllKeys();
                request.onsuccess = function () {
                    resolve(request.result);
                };
                request.onerror = function () {
                    reject(request.error);
                };
            });
        });
    };

    const markPostAsDownloadedIndexedDB = (postId) => {
        return openDB().then((db) => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, "readwrite");
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put({ postId: postId });
                request.onsuccess = function () {
                    downloadedPostsCache.add(postId);
                    resolve();
                };
                request.onerror = function () {
                    reject(request.error);
                };
            });
        });
    };

    loadDownloadedPostsCache();

    const isMobile = /android|iphone|ipad|mobile/.test(
        navigator.userAgent.toLowerCase(),
    );
    const isAppleMobile = /iphone|ipad/.test(navigator.userAgent.toLowerCase());
    const userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";

    const createApiHeaders = () => {
        const GUEST_AUTHORIZATION =
            "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

        const headers = {
            authorization: GUEST_AUTHORIZATION,
            "x-csrf-token": getCookie("ct0"),
            "x-twitter-client-language": "en",
            "x-twitter-active-user": "yes",
            "content-type": "application/json",
        };

        const guestToken = getCookie("gt");
        if (guestToken) {
            headers["x-guest-token"] = guestToken;
        } else {
            headers["x-twitter-auth-type"] = "OAuth2Session";
        }

        return headers;
    };

    const getCurrentLanguage = () => document.documentElement.lang || "en";
    const getMainTweetUrl = (cell) => {
        let timeEl = cell.querySelector(
            'article[data-testid="tweet"] a[href*="/status/"][role="link"] time',
        );
        if (timeEl && timeEl.parentElement) return timeEl.parentElement.href;
        return (
            cell.querySelector(
                'article[data-testid="tweet"] a[href*="/status/"]',
            )?.href || ""
        );
    };
    const getCookie = (name) => {
        const cookies = Object.fromEntries(
            document.cookie
                .split(";")
                .filter((n) => n.includes("="))
                .map((n) =>
                    n
                        .split("=")
                        .map(decodeURIComponent)
                        .map((s) => s.trim()),
                ),
        );
        return name ? cookies[name] : cookies;
    };
    const getMediaInfoFromUrl = (url) => {
        if (url.includes("pbs.twimg.com/media/")) {
            const extMatch = url.match(/format=([a-zA-Z0-9]+)/);
            const ext = extMatch ? extMatch[1] : "jpg";
            return { ext: ext, typeLabel: "img" };
        } else if (
            url.includes("video.twimg.com/ext_tw_video/") ||
            url.includes("video.twimg.com/tweet_video/") ||
            url.includes("video.twimg.com/amplify_video/")
        ) {
            let ext = "mp4";
            if (!url.includes("video.twimg.com/tweet_video/")) {
                const pathMatch = url.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
                if (pathMatch) ext = pathMatch[1];
            }
            const typeLabel = url.includes("tweet_video") ? "gif" : "video";
            return { ext: ext, typeLabel: typeLabel };
        }
        return { ext: "jpg", typeLabel: "img" };
    };

    const fetchTweetDetailWithGraphQL = async (postId) => {
        const TWEET_RESULT_BY_REST_ID_QUERY_ID = "zAz9764BcLZOJ0JU2wrd1A";

        const TWEET_DETAIL_FEATURES = {
            creator_subscriptions_tweet_preview_api_enabled: true,
            premium_content_api_read_enabled: false,
            communities_web_enable_tweet_community_results_fetch: true,
            c9s_tweet_anatomy_moderator_badge_enabled: true,
            responsive_web_grok_analyze_button_fetch_trends_enabled: false,
            responsive_web_grok_analyze_post_followups_enabled: false,
            responsive_web_jetfuel_frame: false,
            responsive_web_grok_share_attachment_enabled: true,
            articles_preview_enabled: true,
            responsive_web_edit_tweet_api_enabled: true,
            graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
            view_counts_everywhere_api_enabled: true,
            longform_notetweets_consumption_enabled: true,
            responsive_web_twitter_article_tweet_consumption_enabled: true,
            tweet_awards_web_tipping_enabled: false,
            responsive_web_grok_show_grok_translated_post: false,
            responsive_web_grok_analysis_button_from_backend: false,
            creator_subscriptions_quote_tweet_preview_enabled: false,
            freedom_of_speech_not_reach_fetch_enabled: true,
            standardized_nudges_misinfo: true,
            tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
            longform_notetweets_rich_text_read_enabled: true,
            longform_notetweets_inline_media_enabled: true,
            profile_label_improvements_pcf_label_in_post_enabled: true,
            rweb_tipjar_consumption_enabled: true,
            verified_phone_label_enabled: false,
            responsive_web_grok_image_annotation_enabled: true,
            responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
            responsive_web_graphql_timeline_navigation_enabled: true,
            responsive_web_enhance_cards_enabled: false,
        };

        const TWEET_DETAIL_FIELD_TOGGLES = {
            withArticleRichContentState: true,
            withArticlePlainText: false,
            withGrokAnalyze: false,
            withDisallowedReplyControls: false,
        };

        const variables = {
            tweetId: postId,
            withCommunity: false,
            includePromotedContent: false,
            withVoice: false,
        };

        const apiUrl = `https://x.com/i/api/graphql/${TWEET_RESULT_BY_REST_ID_QUERY_ID}/TweetResultByRestId`;
        const url = `${apiUrl}?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(TWEET_DETAIL_FEATURES))}&fieldToggles=${encodeURIComponent(JSON.stringify(TWEET_DETAIL_FIELD_TOGGLES))}`;

        const headers = createApiHeaders();
        if (!headers) {
            throw new Error("tweetResultByRestId headers not available.");
        }

        const res = await gmFetch(url, { headers, responseType: "json" });
        if (!res.ok)
            throw new Error(`TweetResultByRestId failed: ${res.status}`);

        return res.json();
    };

    const fetchBookmarkSearchTimeline = async (userId, postTime) => {
        const BOOKMARK_SEARCH_TIMELINE_QUERY_ID = "6u3VcFdASPZrP2wkuU3C3A";

        const BOOKMARK_SEARCH_FEATURES = {
            rweb_video_screen_enabled: false,
            payments_enabled: false,
            profile_label_improvements_pcf_label_in_post_enabled: true,
            rweb_tipjar_consumption_enabled: true,
            verified_phone_label_enabled: false,
            creator_subscriptions_tweet_preview_api_enabled: true,
            responsive_web_graphql_timeline_navigation_enabled: true,
            responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
            premium_content_api_read_enabled: false,
            communities_web_enable_tweet_community_results_fetch: true,
            c9s_tweet_anatomy_moderator_badge_enabled: true,
            responsive_web_grok_analyze_button_fetch_trends_enabled: false,
            responsive_web_grok_analyze_post_followups_enabled: true,
            responsive_web_jetfuel_frame: true,
            responsive_web_grok_share_attachment_enabled: true,
            articles_preview_enabled: true,
            responsive_web_edit_tweet_api_enabled: true,
            graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
            view_counts_everywhere_api_enabled: true,
            longform_notetweets_consumption_enabled: true,
            responsive_web_twitter_article_tweet_consumption_enabled: true,
            tweet_awards_web_tipping_enabled: false,
            responsive_web_grok_show_grok_translated_post: false,
            responsive_web_grok_analysis_button_from_backend: false,
            creator_subscriptions_quote_tweet_preview_enabled: false,
            freedom_of_speech_not_reach_fetch_enabled: true,
            standardized_nudges_misinfo: true,
            tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
            longform_notetweets_rich_text_read_enabled: true,
            longform_notetweets_inline_media_enabled: true,
            responsive_web_grok_image_annotation_enabled: true,
            responsive_web_grok_community_note_auto_translation_is_enabled: false,
            responsive_web_enhance_cards_enabled: false,
        };

        const formattedSinceTime = dayjs(postTime)
            .utc()
            .format("YYYY-MM-DD_HH:mm:ss_UTC");
        const formattedUntilTime = dayjs(postTime)
            .utc()
            .add(1, "second")
            .format("YYYY-MM-DD_HH:mm:ss_UTC");
        const rawQuery = `from:${userId} since:${formattedSinceTime} until:${formattedUntilTime}`;
        const variables = { rawQuery: rawQuery, count: 20 };

        const apiUrl = `https://x.com/i/api/graphql/${BOOKMARK_SEARCH_TIMELINE_QUERY_ID}/BookmarkSearchTimeline`;
        const url = `${apiUrl}?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(BOOKMARK_SEARCH_FEATURES))}`;

        const headers = createApiHeaders();
        if (!headers) {
            throw new Error("BookmarkSearchTimeline headers not available.");
        }

        const res = await gmFetch(url, { headers, responseType: "json" });
        if (!res.ok)
            throw new Error(`BookmarkSearchTimeline failed: ${res.status}`);

        return res.json();
    };

    const twdlcss = `
    span[id^="ezoic-pub-ad-placeholder-"], .ez-sidebar-wall, span[data-ez-ph-id], .ez-sidebar-wall-ad, .ez-sidebar-wall {display:none !important}
    .tmd-down {margin-left: 2px !important; order: 99; justify-content: inherit; display: inline-grid; transform: rotate(0deg) scale(1) translate3d(0px, 0px, 0px);}
    .tmd-down:hover > div > div > div > div {color: rgba(29, 161, 242, 1.0);}
    .tmd-down:hover > div > div > div > div > div {background-color: rgba(29, 161, 242, 0.1);}
    .tmd-down:active > div > div > div > div > div {background-color: rgba(29, 161, 242, 0.2);}
    .tmd-down:hover svg {color: rgba(29, 161, 242, 1.0);}
    .tmd-down:hover div:first-child:not(:last-child) {background-color: rgba(29, 161, 242, 0.1);}
    .tmd-down:active div:first-child:not(:last-child) {background-color: rgba(29, 161, 242, 0.2);}
    .tmd-down g {display: none;}
    .tmd-down.download g.download, .tmd-down.loading g.loading, .tmd-down.failed g.failed, .tmd-down.completed g.completed {display: unset;}
    .tmd-down.loading svg g.loading {animation: spin 1s linear infinite !important; transform-box: fill-box; transform-origin: center;}
    @keyframes spin {0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}
    .tweet-detail-action-item {width: 20% !important;}
 
    /* 設定モーダル用CSS (ライトモード/デフォルト) */
    #twdl-settings-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center; }
    #twdl-settings-content { background: #ffffff; color: #0f1419; border-radius: 16px; padding: 24px; width: 90%; max-width: 480px; box-shadow: 0 0 15px rgba(0,0,0,0.2); font-family: TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .twdl-modal-header { font-size: 20px; font-weight: bold; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .twdl-close-btn { cursor: pointer; font-size: 24px; padding: 5px; line-height: 1; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; }
    .twdl-close-btn:hover { background: rgba(15, 20, 25, 0.1); }
    .twdl-input-field { width: 100%; padding: 10px; border: 1px solid #cfd9de; border-radius: 4px; box-sizing: border-box; background: transparent; color: inherit; margin-top: 8px; font-size: 15px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; }
 
    /* Xの htmlタグの color-scheme に連動してダークモードUIを適用 */
    html[style*="color-scheme: dark"] #twdl-settings-content { background: rgb(22, 24, 28); color: #e7e9ea; }
    html[style*="color-scheme: dark"] .twdl-close-btn:hover { background: rgba(255, 255, 255, 0.1); }
    html[style*="color-scheme: dark"] .twdl-input-field { border-color: #38444d; color: #e7e9ea; }
 
    /* 設定メニューのホバーエフェクト */
    a[data-testid="twdlSettingsLink"] { transition: background-color 0.2s; }
    html[style*="color-scheme: light"] a[data-testid="twdlSettingsLink"]:hover { background-color: rgb(247, 249, 249) !important; }
    html[style*="color-scheme: dark"] a[data-testid="twdlSettingsLink"]:hover { background-color: rgb(22, 24, 28) !important; }
    `;
    const newStyle = document.createElement("style");
    newStyle.id = "twdlcss";
    newStyle.innerHTML = twdlcss;
    document.head.parentNode.insertBefore(newStyle, document.head);

    const openSettingsModal = () => {
        if (document.getElementById("twdl-settings-modal")) return;

        const modal = document.createElement("div");
        modal.id = "twdl-settings-modal";

        const lang = getCurrentLanguage();
        const titleText =
            lang === "ja" ? "メディアダウンローダー設定" : (
                "Media Downloader Settings"
            );

        modal.innerHTML = `
            <div id="twdl-settings-content">
                <div class="twdl-modal-header">
                    <span>${titleText}</span>
                    <div class="twdl-close-btn">&times;</div>
                </div>
 
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 15px;">
                        <input type="checkbox" id="twdl-sync-checkbox" ${enableDownloadHistorySync ? "checked" : ""} style="margin: 0 12px 0 0; width: 18px; height: 18px;">
                        <span>${lang === "ja" ? "ブックマークを利用した履歴の同期を有効にする" : "Enable online history sync using bookmarks"}</span>
                    </label>
                </div>
 
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 15px;">
                        <input type="checkbox" id="twdl-downloadmode-checkbox" ${downloadMode === "dataurl" ? "checked" : ""} style="margin: 0 12px 0 0; width: 18px; height: 18px;">
                        <span>${lang === "ja" ? "iOSでData URL形式のダウンロードを強制する（旧仕様）" : "Force Data URL download on iOS (Legacy)"}</span>
                    </label>
                </div>
 
                <div style="margin-bottom: 20px;">
                    <label style="font-size: 15px; font-weight: bold;">
                        ${lang === "ja" ? "日時のフォーマット (dayjs形式)" : "Date/Time Format (dayjs)"}
                    </label>
                    <input type="text" id="twdl-posttime-input" class="twdl-input-field" value="${postTimeFormat}">
                    <div style="font-size: 12px; color: #536471; margin-top: 6px; line-height: 1.4;">
                        ${lang === "ja" ? "例: YYYYMMDD_HHmmss" : "Ex: YYYYMMDD_HHmmss"}
                    </div>
                </div>
 
                <div style="margin-bottom: 24px;">
                    <label style="font-size: 15px; font-weight: bold;">
                        ${lang === "ja" ? "ファイル名のフォーマット" : "Filename Format"}
                    </label>
                    <div style="display: flex; align-items: center; margin-top: 8px;">
                        <input type="text" id="twdl-filename-input" class="twdl-input-field" style="margin-top: 0; flex: 1;" value="${filenameFormat}">
                        <span style="margin-left: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; color: #536471;">.ext</span>
                    </div>
                    <div style="font-size: 12px; color: #536471; margin-top: 6px; line-height: 1.4;">
                        ${lang === "ja" ? "変数: {userId}, {userName}, {postId}, {postTime}, {mediaType}, {index}" : "Variables: {userId}, {userName}, {postId}, {postTime}, {mediaType}, {index}"}
                    </div>
                </div>
 
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button id="twdl-export-btn" style="padding: 12px; background: #1DA1F2; color: white; border: none; border-radius: 9999px; font-size: 15px; font-weight: bold; cursor: pointer; transition: 0.2s; font-family: inherit;">
                        ${lang === "ja" ? "履歴データをエクスポート" : "Export History Data"}
                    </button>
                    <button id="twdl-import-btn" style="padding: 12px; background: transparent; border: 1px solid #1DA1F2; color: #1DA1F2; border-radius: 9999px; font-size: 15px; font-weight: bold; cursor: pointer; transition: 0.2s; font-family: inherit;">
                        ${lang === "ja" ? "履歴データをインポート" : "Import History Data"}
                    </button>
                    <input type="file" id="twdl-file-input" accept=".json" style="display: none;">
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal
            .querySelector(".twdl-close-btn")
            .addEventListener("click", () => modal.remove());
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.remove();
        });

        modal
            .querySelector("#twdl-sync-checkbox")
            .addEventListener("change", (e) => {
                enableDownloadHistorySync = e.target.checked;
                localStorage.setItem(
                    "twdl_enableSync",
                    enableDownloadHistorySync,
                );
            });

        modal
            .querySelector("#twdl-downloadmode-checkbox")
            .addEventListener("change", (e) => {
                downloadMode = e.target.checked ? "dataurl" : "blob";
                localStorage.setItem("twdl_downloadMode", downloadMode);
            });

        modal
            .querySelector("#twdl-posttime-input")
            .addEventListener("input", (e) => {
                postTimeFormat = e.target.value;
                localStorage.setItem("twdl_postTimeFormat", postTimeFormat);
            });

        modal
            .querySelector("#twdl-filename-input")
            .addEventListener("input", (e) => {
                filenameFormat = e.target.value;
                localStorage.setItem("twdl_filenameFormat", filenameFormat);
            });

        modal
            .querySelector("#twdl-export-btn")
            .addEventListener("click", async () => {
                try {
                    const ids = await getDownloadedPostIdsIndexedDB();
                    const blob = new Blob([JSON.stringify(ids)], {
                        type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `twdl_history_${dayjs().format("YYYYMMDD_HHmmss")}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (err) {
                    console.error("Export Error:", err);
                    alert(
                        lang === "ja" ? "エクスポートに失敗しました" : (
                            "Export failed"
                        ),
                    );
                }
            });

        const fileInput = modal.querySelector("#twdl-file-input");
        modal
            .querySelector("#twdl-import-btn")
            .addEventListener("click", () => {
                fileInput.click();
            });

        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedIds = JSON.parse(event.target.result);
                    if (!Array.isArray(importedIds))
                        throw new Error("Invalid JSON format");

                    const db = await openDB();
                    const transaction = db.transaction(STORE_NAME, "readwrite");
                    const store = transaction.objectStore(STORE_NAME);

                    let addedCount = 0;
                    importedIds.forEach((id) => {
                        if (!downloadedPostsCache.has(id)) {
                            store.put({ postId: id });
                            downloadedPostsCache.add(id);
                            addedCount++;
                        }
                    });

                    transaction.oncomplete = () => {
                        alert(
                            lang === "ja" ?
                                `インポート完了: 新たに ${addedCount} 件の履歴を追加しました`
                            :   `Import Complete: Added ${addedCount} new records`,
                        );
                        fileInput.value = "";
                    };
                } catch (err) {
                    console.error("Import Error:", err);
                    alert(
                        lang === "ja" ?
                            "インポート失敗: 正しいJSONファイルを選択してください"
                        :   "Import Failed: Please select a valid JSON file",
                    );
                }
            };
            reader.readAsText(file);
        });
    };

    const injectSettingsMenu = () => {
        if (!window.location.pathname.startsWith("/settings")) return;

        const helpCenterLink = document.querySelector(
            'a[data-testid="helpCenterLink"]',
        );
        if (!helpCenterLink) return;

        if (document.querySelector('a[data-testid="twdlSettingsLink"]')) return;

        const settingsLink = helpCenterLink.cloneNode(true);

        settingsLink.setAttribute("data-testid", "twdlSettingsLink");
        settingsLink.href = "#";

        const textSpan = settingsLink.querySelector("span");
        if (textSpan) {
            textSpan.textContent =
                getCurrentLanguage() === "ja" ? "メディアダウンローダー設定" : (
                    "Media Downloader Settings"
                );
        }

        const svgIcon = settingsLink.querySelector("svg");
        if (svgIcon) {
            svgIcon.innerHTML = `<g><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.93,0-3.5-1.57-3.5-3.5 s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.93,15.6,12,15.6z" fill="currentColor"></path></g>`;
        }

        settingsLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            openSettingsModal();
        });

        const wrapperDiv = document.createElement("div");
        wrapperDiv.className = "css-175oi2r";
        wrapperDiv.setAttribute("data-testid", "activeRoute");
        wrapperDiv.appendChild(settingsLink);

        const parentDiv = helpCenterLink.parentElement;
        if (parentDiv) {
            parentDiv.insertBefore(wrapperDiv, helpCenterLink);
        }
    };

    const getNoImageMessage = () => {
        const lang = getCurrentLanguage();
        return lang === "ja" ?
                "このツイートには画像または動画がありません！"
            :   "There is no image or video in this tweet!";
    };

    const getAlreadyBookmarkedMessage = () => {
        const lang = getCurrentLanguage();
        if (lang === "ja") {
            return window.confirm(
                "この投稿は既にダウンロードされています。\nダウンロードを続行しますか？",
            );
        } else {
            return window.confirm(
                "This post is already downloaded.\nDo you want to continue downloading?",
            );
        }
    };

    const status = (btn, css) => {
        btn.classList.remove("download", "loading", "failed", "completed");
        if (css) btn.classList.add(css);
    };

    const getValidMediaElements = (cell) => {
        let validImages = [],
            validVideos = [],
            validGifs = [];

        validImages = Array.from(
            cell.querySelectorAll("img[src^='https://pbs.twimg.com/media/']"),
        ).filter(
            (img) =>
                !img.closest("div[tabindex='0'][role='link']") &&
                !img.closest("div[data-testid='previewInterstitial']") &&
                !img.closest("div[data-testid='videoPlayer']"),
        );

        const videoCandidates_videoTag = Array.from(
            cell.querySelectorAll("video"),
        );
        videoCandidates_videoTag.forEach((video) => {
            if (video.closest("div[tabindex='0'][role='link']")) return;
            if (!video.closest("div[data-testid='videoPlayer']")) return;
            if (video.src?.startsWith("https://video.twimg.com/tweet_video")) {
                validGifs.push(video);
            } else if (
                video.poster?.includes("/ext_tw_video_thumb/") ||
                video.poster?.includes("/amplify_tw_video_thumb/") ||
                video.poster?.includes("/amplify_video_thumb/") ||
                video.poster?.includes("/media/")
            ) {
                validVideos.push(video);
            }
        });

        const videoCandidates_imgTag = Array.from(
            cell.querySelectorAll("img[src]"),
        );
        videoCandidates_imgTag.forEach((img) => {
            if (img.closest("div[tabindex='0'][role='link']")) return;
            if (
                !img.closest("div[data-testid='previewInterstitial']") &&
                !img.closest("div[data-testid='videoPlayer']")
            )
                return;
            if (
                img.src.startsWith("https://pbs.twimg.com/tweet_video_thumb/")
            ) {
                validGifs.push(img);
            } else if (
                img.src.includes("/ext_tw_video_thumb/") ||
                img.src.includes("/amplify_tw_video_thumb/") ||
                img.src.includes("/amplify_video_thumb/") ||
                img.src.includes("/media/")
            ) {
                validVideos.push(img);
            }
        });
        return { images: validImages, videos: validVideos, gifs: validGifs };
    };

    const getTweetFilenameElements = (url, cell) => {
        const match = url.match(
            /^https?:\/\/(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/,
        );
        if (!match) return null;

        const userNameContainer = cell.querySelector(
            "div[data-testid='User-Name'] div[dir='ltr'] span",
        );
        const postTimeElement = cell.querySelector(
            "article[data-testid='tweet'] a[href*='/status/'][role='link'] time",
        );

        let userName = "unknown";
        if (userNameContainer) {
            userName = "";
            userNameContainer.querySelectorAll("*").forEach((el) => {
                userName +=
                    el.nodeName === "IMG" ? el.alt
                    : el.nodeName === "SPAN" ? el.textContent
                    : "";
            });
            userName = userName.trim();
        }

        return {
            userId: match[1],
            userName: userName || "unknown",
            postId: match[2],
            postTime: postTimeElement?.getAttribute("datetime") || "unknown",
        };
    };

    const getMediaURLs = async (cell, filenameElements) => {
        const mediaElems = getValidMediaElements(cell);
        const imageURLs = mediaElems.images.map((img) =>
            img.src.includes("name=") ?
                img.src.replace(/name=.*/gi, "name=4096x4096")
            :   img.src,
        );
        let gifURLs = mediaElems.gifs.map((gif) => gif.src);
        let videoURLs = [];

        gifURLs = gifURLs.map((gifURL) => {
            if (gifURL.startsWith("https://pbs.twimg.com/tweet_video_thumb/")) {
                const gifIdBaseUrl = gifURL.split("?")[0];
                const gifId = gifIdBaseUrl.split("/").pop();
                return `https://video.twimg.com/tweet_video/${gifId}.mp4`;
            }
            return gifURL;
        });

        if (mediaElems.videos.length > 0) {
            const tweet_res = await fetchTweetDetailWithGraphQL(
                filenameElements.postId,
            );
            if (!tweet_res.data)
                return { imageURLs: [], gifURLs: [], videoURLs: [] };
            const tweet_result = tweet_res.data.tweetResult.result;
            const tweet_obj = tweet_result.tweet || tweet_result;
            tweet_obj.extended_entities =
                tweet_obj.extended_entities ||
                tweet_obj.legacy?.extended_entities;
            const extEntities = tweet_obj.extended_entities;

            if (extEntities?.media) {
                videoURLs = extEntities.media
                    .filter(
                        (media) =>
                            media.type === "video" &&
                            media.video_info?.variants,
                    )
                    .map(
                        (media) =>
                            media.video_info.variants
                                .filter(
                                    (variant) =>
                                        variant.content_type === "video/mp4",
                                )
                                .reduce(
                                    (prev, current) =>
                                        prev.bitrate > current.bitrate ?
                                            prev
                                        :   current,
                                    media.video_info.variants[0],
                                )?.url,
                    )
                    .filter((url) => url);
            } else if (tweet_obj.card?.legacy?.binding_values) {
                const unifiedCardBinding =
                    tweet_obj.card.legacy.binding_values.find(
                        (bv) => bv.key === "unified_card",
                    );
                if (unifiedCardBinding?.value?.string_value) {
                    try {
                        const unifiedCard = JSON.parse(
                            unifiedCardBinding.value.string_value,
                        );
                        if (unifiedCard.media_entities) {
                            videoURLs = Object.values(
                                unifiedCard.media_entities,
                            )
                                .filter(
                                    (media) =>
                                        media.type === "video" &&
                                        media.video_info?.variants,
                                )
                                .map(
                                    (media) =>
                                        media.video_info.variants
                                            .filter(
                                                (variant) =>
                                                    variant.content_type ===
                                                    "video/mp4",
                                            )
                                            .reduce(
                                                (prev, current) =>
                                                    (
                                                        prev.bitrate >
                                                        current.bitrate
                                                    ) ?
                                                        prev
                                                    :   current,
                                                media.video_info.variants[0],
                                            )?.url,
                                )
                                .filter((url) => url);
                        }
                    } catch (e) {
                        console.error("Error parsing unified_card JSON:", e);
                    }
                }
            }
        }
        return { imageURLs: imageURLs, gifURLs: gifURLs, videoURLs: videoURLs };
    };

    const checkBookmarkStatus = async (userId, postId, postTime) => {
        if (!enableDownloadHistorySync) return false;

        try {
            const bookmarkData = await fetchBookmarkSearchTimeline(
                userId,
                postTime,
            );
            if (!bookmarkData.data) {
                console.log("ブックマーク状態の確認に失敗　APIなし");
                return false;
            }
            const instructions =
                bookmarkData.data.search_by_raw_query.bookmarks_search_timeline
                    .timeline.instructions;
            if (!instructions) return false;

            for (const instruction of instructions) {
                if (
                    instruction.type === "TimelineAddEntries" &&
                    instruction.entries
                ) {
                    for (const entry of instruction.entries) {
                        if (
                            entry.entryId &&
                            entry.entryId === `tweet-${postId}`
                        ) {
                            return true;
                        }
                    }
                }
            }
            return false;
        } catch (error) {
            console.error("ブックマーク状態の確認に失敗:", error);
            return false;
        }
    };

    const clickBookmarkButton = (cell) => {
        if (!enableDownloadHistorySync) return;
        const btn_group = cell.querySelector(
            'div[role="group"]:last-of-type, ul.tweet-actions, ul.tweet-detail-actions',
        );
        if (btn_group) {
            const bookmarkButton = btn_group.querySelector(
                'button[data-testid="bookmark"]',
            );
            if (bookmarkButton) bookmarkButton.click();
        }
    };

    const waitForBookmarkStateChange = (cell) => {
        return new Promise((resolve) => {
            if (!enableDownloadHistorySync && !isAppleMobile) {
                resolve();
                return;
            }
            const btn_group = cell.querySelector(
                'div[role="group"]:last-of-type, ul.tweet-actions, ul.tweet-detail-actions',
            );
            const bookmarkButton =
                btn_group ?
                    btn_group.querySelector('button[data-testid="bookmark"]')
                :   null;
            if (!bookmarkButton) {
                resolve();
                return;
            }
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (
                        mutation.type === "attributes" &&
                        mutation.attributeName === "data-testid"
                    ) {
                        if (
                            bookmarkButton.dataset.testid === "removeBookmark"
                        ) {
                            cleanup();
                            setTimeout(() => resolve(), 500);
                        }
                    }
                }
            });

            const timeoutId = setTimeout(() => {
                console.warn(
                    "waitForBookmarkStateChange: Timeout waiting for bookmark state change.",
                );
                cleanup();
                resolve();
            }, 10000);

            const cleanup = () => {
                observer.disconnect();
                clearTimeout(timeoutId);
            };

            observer.observe(bookmarkButton, {
                attributes: true,
                attributeFilter: ["data-testid"],
            });
        });
    };

    const blobToDataURL = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    };

    const downloadZipArchive = async (
        blobs,
        filenameElements,
        mediaURLs,
        cell,
        bookmarkPromise,
    ) => {
        try {
            const files = {};
            const filenames = blobs.map((_, index) => {
                const mediaInfo = getMediaInfoFromUrl(mediaURLs[index]);
                return generateFilename(
                    filenameElements,
                    mediaInfo.typeLabel,
                    index + 1,
                    mediaInfo.ext,
                );
            });
            const uint8Arrays = await Promise.all(
                blobs.map(async (blob) => {
                    return await blobToUint8Array(blob);
                }),
            );
            uint8Arrays.forEach((uint8Array, index) => {
                files[filenames[index]] = uint8Array;
            });

            const zipData = await new Promise((resolve, reject) => {
                fflate.zip(files, { level: 0 }, (err, zipData) => {
                    if (err) {
                        console.error("ZIP archive creation failed:", err);
                        reject(err);
                    } else {
                        resolve(zipData);
                    }
                });
            });

            const zipBlob = new Blob([zipData], { type: "application/zip" });
            console.log(
                `[TMD] downloadZipArchive: ZIP生成完了。総サイズ: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`,
            );
            const a = document.createElement("a");
            a.download = generateFilename(
                filenameElements,
                "medias",
                "",
                "zip",
            );

            if (enableDownloadHistorySync && isAppleMobile) {
                clickBookmarkButton(cell);
                await bookmarkPromise;
            }

            if (isAppleMobile && downloadMode === "dataurl") {
                const dataUrl = await blobToDataURL(zipBlob);
                a.href = dataUrl;
            } else {
                const blobUrl = URL.createObjectURL(zipBlob);
                a.href = blobUrl;
            }

            document.body.appendChild(a);
            a.click();
            a.remove();

            if (!isAppleMobile && a.href.startsWith("blob:")) {
                setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            }
            console.log(
                "[TMD] downloadZipArchive: ZIP処理がすべて完了しました。",
            );
        } catch (error) {
            console.error(
                "[TMD] downloadZipArchive: エラーが発生しました:",
                error,
            );
            alert(
                "ZIPダウンロード処理中にエラーが発生しました。コンソールログをご確認ください。",
            );
        }
    };

    const downloadBlobAsFile = async (
        blob,
        filename,
        cell,
        bookmarkPromise,
    ) => {
        try {
            const a = document.createElement("a");
            a.download = filename;

            if (enableDownloadHistorySync && isAppleMobile) {
                clickBookmarkButton(cell);
                await bookmarkPromise;
            }

            if (isAppleMobile && downloadMode === "dataurl") {
                const dataUrl = await blobToDataURL(blob);
                a.href = dataUrl;
            } else {
                const blobUrl = URL.createObjectURL(blob);
                a.href = blobUrl;
            }

            document.body.appendChild(a);
            a.click();
            a.remove();

            if (!isAppleMobile && a.href.startsWith("blob:")) {
                setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            }
            console.log(
                "[TMD] downloadBlobAsFile: 単一ダウンロード処理が完了しました。",
            );
        } catch (error) {
            console.error(
                "[TMD] downloadBlobAsFile: エラーが発生しました:",
                error,
            );
            alert(
                "ダウンロード処理中にエラーが発生しました。コンソールログをご確認ください。",
            );
        }
    };

    const blobToUint8Array = async (blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        try {
            return new Uint8Array(
                structuredClone(arrayBuffer, { transfer: [arrayBuffer] }),
            );
        } catch (e) {
            return new Uint8Array(arrayBuffer);
        }
    };

    const downloadMediaWithFetchStream = async (mediaSrcURL) => {
        const headers = { "User-Agent": userAgent };
        console.log(
            `[TMD] downloadMediaWithFetchStream: フェッチ開始 URL: ${mediaSrcURL}`,
        );
        try {
            const res = await gmFetch(mediaSrcURL, {
                headers,
                responseType: "blob",
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const originalBlob = await res.blob();
            console.log(
                `[TMD] downloadMediaWithFetchStream: フェッチ成功。ステータス: ${res.status}, オリジナルMIME: ${originalBlob.type}, サイズ: ${(originalBlob.size / 1024 / 1024).toFixed(2)} MB`,
            );

            const mediaInfo = getMediaInfoFromUrl(mediaSrcURL);
            let inferredMimeType = "";
            switch (mediaInfo.ext.toLowerCase()) {
                case "jpg":
                case "jpeg":
                    inferredMimeType = "image/jpeg";
                    break;
                case "png":
                    inferredMimeType = "image/png";
                    break;
                case "gif":
                    inferredMimeType = "image/gif";
                    break;
                case "mp4":
                    inferredMimeType = "video/mp4";
                    break;
                case "webm":
                    inferredMimeType = "video/webm";
                    break;
                default:
                    inferredMimeType =
                        originalBlob.type || "application/octet-stream";
                    break;
            }
            if (!originalBlob.type || originalBlob.type !== inferredMimeType) {
                return originalBlob.slice(
                    0,
                    originalBlob.size,
                    inferredMimeType,
                );
            }
            return originalBlob;
        } catch (error) {
            console.error(
                `[TMD] downloadMediaWithFetchStream: フェッチ中にエラーが発生しました URL: ${mediaSrcURL}`,
                error,
            );
            return null;
        }
    };

    const downloadMedia = async (
        imageURLs,
        gifURLs,
        videoURLs,
        filenameElements,
        btn_down,
        allMediaURLs,
        cell,
        bookmarkPromise,
    ) => {
        const mediaCount = imageURLs.length + gifURLs.length + videoURLs.length;
        if (mediaCount === 1) {
            let mediaURL = imageURLs[0] || gifURLs[0] || videoURLs[0];
            const blob = await downloadMediaWithFetchStream(mediaURL);
            if (blob) {
                const mediaInfo = getMediaInfoFromUrl(mediaURL);
                const filename = generateFilename(
                    filenameElements,
                    mediaInfo.typeLabel,
                    1,
                    mediaInfo.ext,
                );
                await downloadBlobAsFile(blob, filename, cell, bookmarkPromise);
                markPostAsDownloadedIndexedDB(filenameElements.postId);
                setTimeout(() => {
                    status(btn_down, "completed");
                    if (enableDownloadHistorySync && !isAppleMobile)
                        clickBookmarkButton(cell);
                }, 300);
            } else {
                console.error(
                    "[TMD] downloadMedia: 単一ファイルダウンロードに失敗しました（Blobがnull）。",
                );
                status(btn_down, "failed");
                setTimeout(() => status(btn_down, "download"), 3000);
            }
        } else if (mediaCount > 1) {
            const blobs = (
                await Promise.all(
                    [...imageURLs, ...gifURLs, ...videoURLs].map((url) =>
                        downloadMediaWithFetchStream(url),
                    ),
                )
            ).filter((blob) => blob);
            if (blobs.length === mediaCount) {
                if (isMobile) {
                    await downloadZipArchive(
                        blobs,
                        filenameElements,
                        allMediaURLs,
                        cell,
                        bookmarkPromise,
                    );
                } else {
                    for (const [index, blob] of blobs.entries()) {
                        const mediaURL = allMediaURLs[index];
                        const mediaInfo = getMediaInfoFromUrl(mediaURL);
                        const filename = generateFilename(
                            filenameElements,
                            mediaInfo.typeLabel,
                            index + 1,
                            mediaInfo.ext,
                        );
                        await downloadBlobAsFile(
                            blob,
                            filename,
                            cell,
                            bookmarkPromise,
                        );
                    }
                }
                markPostAsDownloadedIndexedDB(filenameElements.postId);
                setTimeout(() => {
                    status(btn_down, "completed");
                    if (enableDownloadHistorySync && !isAppleMobile)
                        clickBookmarkButton(cell);
                }, 300);
            } else {
                console.error(
                    `[TMD] downloadMedia: 複数ファイルダウンロードの一部でフェッチに失敗しました。取得成功数: ${blobs.length}/${mediaCount}`,
                );
                status(btn_down, "failed");
                setTimeout(() => status(btn_down, "download"), 3000);
            }
        }
    };

    const createDownloadButton = async (cell) => {
        let btn_group = cell.querySelector(
            'div[role="group"]:last-of-type, ul.tweet-actions, ul.tweet-detail-actions',
        );
        if (!btn_group) return;
        let btn_share = Array.from(
            btn_group.querySelectorAll(
                ":scope>div>div, li.tweet-action-item>a, li.tweet-detail-action-item>a",
            ),
        ).pop().parentNode;
        if (!btn_share) return;

        let btn_bookmark = btn_share.previousElementSibling;
        let isBookmarked = false;
        if (enableDownloadHistorySync) {
            if (btn_bookmark) {
                const bookmarkButtonTestId = btn_bookmark.querySelector(
                    'button[data-testid="bookmark"], button[data-testid="removeBookmark"]',
                )?.dataset.testid;
                isBookmarked = bookmarkButtonTestId === "removeBookmark";
            }
        }

        let btn_down = btn_share.cloneNode(true);
        btn_down.classList.add("tmd-down", "download");
        const btnElem = btn_down.querySelector("button");
        if (btnElem) btnElem.removeAttribute("disabled");
        const lang = getCurrentLanguage();
        if (btn_down.querySelector("button"))
            btn_down.querySelector("button").title =
                lang === "ja" ? "画像と動画をダウンロード" : (
                    "Download images and videos"
                );

        btn_down.querySelector("svg").innerHTML = `
            <g class="download"><path d="M12 16 17.7 10.3 16.29 8.88 13 12.18 V2.59 h-2 v9.59 L7.7 8.88 6.29 10.3 Z M21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" fill="currentColor" stroke="currentColor" stroke-width="0.20" stroke-linecap="round" /></g>
            <g class="loading"><circle cx="12" cy="12" r="10" fill="none" stroke="#1DA1F2" stroke-width="4" opacity="0.4" /><path d="M12,2 a10,10 0 0 1 10,10" fill="none" stroke="#1DA1F2" stroke-width="4" stroke-linecap="round" /></g>
            <g class="failed"><circle cx="12" cy="12" r="11" fill="#f33" stroke="currentColor" stroke-width="2" opacity="0.8" /><path d="M14,5 a1,1 0 0 0 -4,0 l0.5,9.5 a1.5,1.5 0 0 0 3,0 z M12,17 a2,2 0 0 0 0,4 a2,2 0 0 0 0,-4" fill="#fff" stroke="none" /></g>
            <g class="completed"><path d="M21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z M 7 10 l 3 4 q 1 1 2 0 l 8 -11 l -1.65 -1.2 l -7.35 10.1063 l -2.355 -3.14" fill="rgba(29, 161, 242, 1)" stroke="#1DA1F2" stroke-width="0.20" stroke-linecap="round" /></g>
        `;

        const filenameElements = getTweetFilenameElements(
            getMainTweetUrl(cell),
            cell,
        );
        if (filenameElements) {
            if (downloadedPostsCache.has(filenameElements.postId)) {
                status(btn_down, "completed");
            } else if (enableDownloadHistorySync && isBookmarked) {
                status(btn_down, "completed");
                markPostAsDownloadedIndexedDB(filenameElements.postId);
            }
        }

        btn_down.onclick = async () => {
            if (btn_down.classList.contains("loading")) return;
            let buttonStateBeforeClick =
                btn_down.classList.contains("completed") ?
                    "completed"
                :   "download";
            status(btn_down, "loading");

            const mainTweetUrl = getMainTweetUrl(cell);
            const filenameElements = getTweetFilenameElements(
                mainTweetUrl,
                cell,
            );
            if (!filenameElements) {
                console.error(
                    "[TMD] btn_down.onclick: ツイート情報 (postId) の取得に失敗しました。",
                );
                alert("ツイート情報を取得できませんでした。");
                status(btn_down, "download");
                return;
            }

            if (
                enableDownloadHistorySync &&
                buttonStateBeforeClick !== "completed"
            ) {
                const isAlreadyBookmarked = await checkBookmarkStatus(
                    filenameElements.userId,
                    filenameElements.postId,
                    filenameElements.postTime,
                );
                if (isAlreadyBookmarked) {
                    if (!getAlreadyBookmarkedMessage()) {
                        status(btn_down, "completed");
                        markPostAsDownloadedIndexedDB(filenameElements.postId);
                        return;
                    }
                }
            }

            const bookmarkPromise = waitForBookmarkStateChange(cell);

            const mediaData = await getMediaURLs(cell, filenameElements);
            const mediaUrls = [
                ...mediaData.imageURLs,
                ...mediaData.gifURLs,
                ...mediaData.videoURLs,
            ];
            if (mediaUrls.length === 0) {
                console.warn(
                    "[TMD] btn_down.onclick: 抽出されたメディアURLが0件です。ダウンロードを中断します。",
                );
                alert(getNoImageMessage());
                status(btn_down, "download");
                return;
            }
            downloadMedia(
                mediaData.imageURLs,
                mediaData.gifURLs,
                mediaData.videoURLs,
                filenameElements,
                btn_down,
                mediaUrls,
                cell,
                bookmarkPromise,
            );
        };
        if (btn_group) btn_group.insertBefore(btn_down, btn_share.nextSibling);
    };

    const processArticles = () => {
        injectSettingsMenu();

        const cells = document.querySelectorAll('[data-testid="cellInnerDiv"]');
        cells.forEach((cell) => {
            const mainTweet = cell.querySelector(
                'article[data-testid="tweet"]',
            );
            if (!mainTweet) return;
            const tweetUrl = getMainTweetUrl(cell);
            if (!getTweetFilenameElements(tweetUrl, cell)) return;
            const mediaElems = getValidMediaElements(cell);
            const mediaCount =
                mediaElems.images.length +
                mediaElems.videos.length +
                mediaElems.gifs.length;
            if (!cell.querySelector(".tmd-down") && mediaCount > 0)
                createDownloadButton(cell);
        });
    };

    let processTimeout = null;
    const debouncedProcessArticles = () => {
        clearTimeout(processTimeout);
        processTimeout = setTimeout(processArticles, 100);
    };

    const observer = new MutationObserver(debouncedProcessArticles);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("load", debouncedProcessArticles);
    window.addEventListener("popstate", debouncedProcessArticles);
    window.addEventListener("hashchange", debouncedProcessArticles);
})();
