// ==UserScript==
// @name         Nextcloud Copy DL QR Code
// @namespace    https://github.com/MrArgparse
// @version      1.0
// @description  Add copy and QR code buttons to Nextcloud
// @author       MrArgparse
// @match        *://*apps/files/files/*&opendetails=true
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nextcloud.com
// @grant        GM_setClipboard
// @downloadURL  https://raw.githubusercontent.com/MrArgparse/nextcloud-copy-dl-qr-code/main/nextcloud-copy-dl-qr-code.js
// @updateURL    https://raw.githubusercontent.com/MrArgparse/nextcloud-copy-dl-qr-code/main/nextcloud-copy-dl-qr-code.js
// ==/UserScript==

(function () {
    'use strict';

    const WRAPPER_ID = 'nextcloud-direct-dl-wrapper';
    const MODAL_ID = 'nextcloud-qr-modal';

    function injectQrLib(callback) {
        if (window.QRious) return callback();

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
        script.onload = callback;
        document.head.appendChild(script);
    }

    function createQrModal(link) {
        if (document.getElementById(MODAL_ID)) return; // Already open

        const overlay = document.createElement('div');
        overlay.id = MODAL_ID;
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: #fff;
            padding: 30px 30px 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            position: relative;
            min-width: 240px;
        `;

        const close = document.createElement('button');
        close.textContent = '✖';
        close.style.cssText = `
            position: absolute;
            top: 0px;
            right: 0px;
            border: none;
            background: #fff;
            font-size: 1.4em;
            cursor: pointer;
            color: #444;
            border-radius: 50%;
            box-shadow: 0 0 6px rgba(0,0,0,0.2);
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        `;

        close.onclick = () => overlay.remove();

        const qr = new QRious({ value: link, size: 200 });
        const img = document.createElement('img');
        img.src = qr.toDataURL();

        const label = document.createElement('div');
        label.textContent = 'Scan to download';
        label.style.cssText = `
            margin-top: 10px;
            font-size: 0.9em;
            color: #222;
        `;

        modal.appendChild(close);
        modal.appendChild(img);
        modal.appendChild(label);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Optional: close when clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    function tryInject(node) {
        if (!(node instanceof HTMLElement)) return;

        const copyLinkButton = node.querySelector?.('a.sharing-entry__copy');
        if (!copyLinkButton || document.getElementById(WRAPPER_ID)) return;

        const rawLink = copyLinkButton.getAttribute('href');
        if (!rawLink || !rawLink.startsWith('http')) return;

        const downloadLink = rawLink.replace(/\/$/, '') + '/download';

        const wrapper = document.createElement('div');
        wrapper.id = WRAPPER_ID;
        wrapper.style.cssText = `
            display: flex;
            gap: 8px;
            margin-left: -24px;
        `;

        const baseBtnStyle = `
            padding: 6px 10px;
            cursor: pointer;
            background: #222;
            font-size: 0.85em;
            border: 1px solid #ccc;
            border-radius: 4px;
            white-space: nowrap;
        `;

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '⬇️ COPY-DL';
        copyBtn.style.cssText = baseBtnStyle;
        copyBtn.onclick = () => {
            GM_setClipboard(downloadLink, 'text');
            copyBtn.textContent = '✅ COPIED!';
            setTimeout(() => (copyBtn.textContent = '⬇️ COPY-DL'), 1000);
        };

        const qrBtn = document.createElement('button');
        qrBtn.textContent = '📱 QR-DL';
        qrBtn.style.cssText = baseBtnStyle;
        qrBtn.onclick = () => {
            injectQrLib(() => createQrModal(downloadLink));
        };

        wrapper.appendChild(copyBtn);
        wrapper.appendChild(qrBtn);
        copyLinkButton.parentElement.appendChild(wrapper);
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                tryInject(node);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
