// ==UserScript==
// @name         GitHub下载加速
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  自动将GitHub特定链接替换为代理链接,并添加代理克隆按钮
// @author       only9464（https://github.com/only9464）
// @match        https://github.com/*
// @match        https://raw.githubusercontent.com/*
// @match        https://gist.github.com/*
// @match        https://gist.githubusercontent.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 定义代理服务器前缀
    const PROXY_PREFIX = 'https://ghproxy.mioe.me/';

    // 定义下载链接匹配规则
    const DOWNLOAD_PATTERN = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/releases\/download\/.+$/i;

    // 定义排除的页面链接规则
    const EXCLUDE_PATTERNS = [
        /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/tags\/?$/i,         // tags页面
        /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/releases\/?$/i,     // releases列表页面
        /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/releases\/tag\/.+$/i, // 具体release页面
        /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/tree\/[^\/]+\/[^\/]+$/i  // 文件列表链接
    ];

    // 定义其他需要代理的URL匹配规则
    const URL_PATTERNS = [
        /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:releases|archive)\/.*$/i,    // releases和archive链接
        /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:raw)\/.*$/i,               // raw链接
        /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:info|git-).*$/i,            // git信息链接
        /^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+?\/.+$/i,  // raw内容链接
        /^(?:https?:\/\/)?gist\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+$/i,      // gist链接
        /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/tags.*$/i                      // tags链接
    ];

    // 将相对路径转换为绝对路径
    function toAbsoluteUrl(url) {
        if (!url) return '';

        // 如果已经是完整URL,则直接返回
        if (url.match(/^https?:\/\//i)) {
            return url;
        }

        // 处理相对路径
        if (url.startsWith('/')) {
            return 'https://github.com' + url;
        }

        // 处理无协议的URL
        if (url.startsWith('github.com') || url.startsWith('raw.githubusercontent.com') ||
            url.startsWith('gist.github.com') || url.startsWith('gist.githubusercontent.com')) {
            return 'https://' + url;
        }

        return url;
    }

    // 检查是否为文件列表中的链接
    function isFileTreeLink(element) {
        return element.closest('.js-navigation-container') !== null;
    }

    // 检查URL是否需要添加代理
    function shouldAddProxy(url, element) {
        // 如果是文件列表中的链接,不需要代理
        if (element && isFileTreeLink(element)) {
            return false;
        }

        // 如果是下载链接,需要代理
        if (DOWNLOAD_PATTERN.test(url)) {
            return true;
        }

        // 如果是排除的页面链接,不需要代理
        if (EXCLUDE_PATTERNS.some(pattern => pattern.test(url))) {
            return false;
        }

        // 其他链接按原有规则处理
        return URL_PATTERNS.some(pattern => pattern.test(url));
    }

    // 处理链接
    function processLink(link) {
        // 转换为绝对路径
        const absoluteUrl = toAbsoluteUrl(link.href);

        // 检查是否需要添加代理
        if (shouldAddProxy(absoluteUrl, link) && !absoluteUrl.startsWith(PROXY_PREFIX)) {
            link.href = PROXY_PREFIX + absoluteUrl;
        }
    }


    // 创建观察器监听DOM变化
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            // 处理链接
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // 元素节点
                    if (node.tagName === 'A') {
                        processLink(node);
                    }
                    node.querySelectorAll('a').forEach(processLink);
                }
            });

        });
    });

    // 开始监听
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['role']
    });

    // 初始处理
    document.querySelectorAll('a').forEach(processLink);
})();