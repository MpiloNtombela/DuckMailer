"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(() => {
    var _a;
    const THEME_KEY = "dm-theme";
    const DUCK_KEY = "dm-duck-address";
    const HISTORY_KEY = "dm-history";
    const HISTORY_MAX = 5;
    // ---------------------------------------------------------------------
    // Theme toggle
    // ---------------------------------------------------------------------
    const themeToggle = document.querySelector("#theme-toggle");
    const getStoredTheme = () => {
        try {
            const value = localStorage.getItem(THEME_KEY);
            return value === "light" || value === "dark" ? value : null;
        }
        catch (_a) {
            return null;
        }
    };
    const currentTheme = () => document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    const applyTheme = (theme) => {
        document.documentElement.setAttribute("data-theme", theme);
        themeToggle === null || themeToggle === void 0 ? void 0 : themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
        try {
            localStorage.setItem(THEME_KEY, theme);
        }
        catch (_a) {
            // ignore storage failures (private browsing, etc.)
        }
    };
    applyTheme((_a = getStoredTheme()) !== null && _a !== void 0 ? _a : currentTheme());
    themeToggle === null || themeToggle === void 0 ? void 0 : themeToggle.addEventListener("click", () => {
        applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
    // ---------------------------------------------------------------------
    // Tabs (Convert / Decode)
    // ---------------------------------------------------------------------
    const tabConvert = document.querySelector("#tab-convert");
    const tabDecode = document.querySelector("#tab-decode");
    const panelConvert = document.getElementById("panel-convert");
    const panelDecode = document.getElementById("panel-decode");
    const tabButtons = [tabConvert, tabDecode].filter((el) => !!el);
    const setActiveTab = (mode) => {
        const isConvert = mode === "convert";
        tabConvert === null || tabConvert === void 0 ? void 0 : tabConvert.classList.toggle("is-active", isConvert);
        tabDecode === null || tabDecode === void 0 ? void 0 : tabDecode.classList.toggle("is-active", !isConvert);
        tabConvert === null || tabConvert === void 0 ? void 0 : tabConvert.setAttribute("aria-selected", String(isConvert));
        tabDecode === null || tabDecode === void 0 ? void 0 : tabDecode.setAttribute("aria-selected", String(!isConvert));
        if (tabConvert)
            tabConvert.tabIndex = isConvert ? 0 : -1;
        if (tabDecode)
            tabDecode.tabIndex = isConvert ? -1 : 0;
        if (panelConvert)
            panelConvert.hidden = !isConvert;
        if (panelDecode)
            panelDecode.hidden = isConvert;
    };
    tabConvert === null || tabConvert === void 0 ? void 0 : tabConvert.addEventListener("click", () => setActiveTab("convert"));
    tabDecode === null || tabDecode === void 0 ? void 0 : tabDecode.addEventListener("click", () => setActiveTab("decode"));
    tabButtons.forEach((btn, idx) => {
        btn.addEventListener("keydown", (e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft")
                return;
            e.preventDefault();
            const nextIdx = e.key === "ArrowRight"
                ? (idx + 1) % tabButtons.length
                : (idx - 1 + tabButtons.length) % tabButtons.length;
            const nextBtn = tabButtons[nextIdx];
            nextBtn.focus();
            setActiveTab(nextBtn === tabConvert ? "convert" : "decode");
        });
    });
    // ---------------------------------------------------------------------
    // Converter form
    // ---------------------------------------------------------------------
    const duckMailerForm = document.getElementById("duckmailer-form");
    const outputContainer = document.getElementById("output-container");
    const output = document.getElementById("output-email");
    const outputCopyLink = document.querySelector("#output-email-copy-link");
    const outputShareBtn = document.querySelector("#output-email-share");
    const pairingLinkBtn = document.querySelector("#output-copy-link");
    const duckErrorMsg = document.getElementById("duck-error-msg");
    const targetErrorMsg = document.getElementById("target-error-msg");
    const duckForgetBtn = document.querySelector("#duck-forget");
    const snackbar = document.getElementById("snackbar");
    let duckAddress = null;
    let targetAddress = null;
    let convertButton = null;
    // validate email address
    const validEmail = (email) => {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email.toLowerCase());
    };
    // validate @duck.com email address
    const validDuckEmail = (email) => {
        const re = /^([a-zA-Z0-9_\-.]+)@duck\.com$/;
        return re.test(email.toLowerCase());
    };
    // convert email address
    const convertEmail = (duck, target) => {
        const duckParts = duck.split("@");
        const targetParts = target.split("@");
        const duckName = duckParts[0];
        const duckDomain = duckParts[1];
        const targetName = targetParts[0];
        const targetDomain = targetParts[1];
        // duck address: name@duck.com
        // target address: user@example.com
        // converted address: user_at_example.com_name@duck.com
        return `${targetName}_at_${targetDomain}_${duckName}@${duckDomain}`;
    };
    // reverse a DuckMailer-generated forwarding address back to its parts
    const decodeForwardingAddress = (fwd) => {
        const atSignIndex = fwd.lastIndexOf("@");
        if (atSignIndex <= 0)
            return null;
        const local = fwd.slice(0, atSignIndex);
        const domain = fwd.slice(atSignIndex + 1).toLowerCase();
        if (domain !== "duck.com")
            return null;
        const atMarker = local.indexOf("_at_");
        if (atMarker <= 0)
            return null;
        const targetName = local.slice(0, atMarker);
        const rest = local.slice(atMarker + 4);
        const lastUnderscore = rest.lastIndexOf("_");
        if (lastUnderscore <= 0 || lastUnderscore === rest.length - 1)
            return null;
        const targetDomain = rest.slice(0, lastUnderscore);
        const duckName = rest.slice(lastUnderscore + 1);
        if (!targetDomain.includes(".") || !duckName)
            return null;
        return {
            target: `${targetName}@${targetDomain}`,
            duck: `${duckName}@duck.com`,
        };
    };
    const setFieldValidity = (input, errorEl, isValid) => {
        if (!input)
            return;
        input.setAttribute("aria-invalid", isValid ? "false" : "true");
        input.classList.toggle("is-valid", isValid && input.value.trim() !== "");
        errorEl === null || errorEl === void 0 ? void 0 : errorEl.classList.toggle("hidden", isValid);
    };
    const hideResult = () => {
        outputContainer === null || outputContainer === void 0 ? void 0 : outputContainer.classList.remove("is-visible");
        setTimeout(() => {
            if (!(outputContainer === null || outputContainer === void 0 ? void 0 : outputContainer.classList.contains("is-visible"))) {
                outputContainer && (outputContainer.style.display = "none");
            }
        }, 250);
    };
    if (duckMailerForm) {
        duckAddress = duckMailerForm.querySelector('input[name="duck-email"]');
        targetAddress = duckMailerForm.querySelector('input[name="target-email"]');
        convertButton = duckMailerForm.querySelector('button[type="submit"]');
        // live validation as the user types / leaves a field
        duckAddress === null || duckAddress === void 0 ? void 0 : duckAddress.addEventListener("input", () => {
            var _a;
            const value = (_a = duckAddress === null || duckAddress === void 0 ? void 0 : duckAddress.value.trim()) !== null && _a !== void 0 ? _a : "";
            if (!value) {
                setFieldValidity(duckAddress, duckErrorMsg, true);
                return;
            }
            setFieldValidity(duckAddress, duckErrorMsg, validDuckEmail(value));
        });
        targetAddress === null || targetAddress === void 0 ? void 0 : targetAddress.addEventListener("input", () => {
            var _a;
            const value = (_a = targetAddress === null || targetAddress === void 0 ? void 0 : targetAddress.value.trim()) !== null && _a !== void 0 ? _a : "";
            if (!value) {
                setFieldValidity(targetAddress, targetErrorMsg, true);
                return;
            }
            setFieldValidity(targetAddress, targetErrorMsg, validEmail(value));
        });
        duckMailerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const duck = duckAddress === null || duckAddress === void 0 ? void 0 : duckAddress.value.trim();
            const target = targetAddress === null || targetAddress === void 0 ? void 0 : targetAddress.value.trim();
            const duckValid = !!duck && validDuckEmail(duck);
            const targetValid = !!target && validEmail(target);
            setFieldValidity(duckAddress, duckErrorMsg, duckValid);
            setFieldValidity(targetAddress, targetErrorMsg, targetValid);
            if (!duckValid) {
                duckAddress === null || duckAddress === void 0 ? void 0 : duckAddress.focus();
                return;
            }
            if (!targetValid) {
                targetAddress === null || targetAddress === void 0 ? void 0 : targetAddress.focus();
                return;
            }
            convertButton === null || convertButton === void 0 ? void 0 : convertButton.classList.add("is-loading");
            convertButton && (convertButton.disabled = true);
            window.setTimeout(() => {
                const convertedEmail = duck && target && convertEmail(duck, target);
                convertButton === null || convertButton === void 0 ? void 0 : convertButton.classList.remove("is-loading");
                convertButton && (convertButton.disabled = false);
                output && (output.innerText = convertedEmail || "");
                if (outputContainer) {
                    outputContainer.style.display = "block";
                    requestAnimationFrame(() => outputContainer.classList.add("is-visible"));
                }
                copyToClipboard(convertedEmail || "", {
                    successMessage: "Duck address created — copied to clipboard",
                    failMessage: "Duck address created — copy it manually",
                    button: outputCopyLink,
                });
                if (convertedEmail && duck && target) {
                    setStoredDuckAddress(duck);
                    addHistoryEntry({ result: convertedEmail, duck, target });
                }
            }, 280);
        });
        duckAddress === null || duckAddress === void 0 ? void 0 : duckAddress.addEventListener("input", hideResult);
        targetAddress === null || targetAddress === void 0 ? void 0 : targetAddress.addEventListener("input", hideResult);
    }
    outputCopyLink === null || outputCopyLink === void 0 ? void 0 : outputCopyLink.addEventListener("click", () => {
        copyToClipboard((output === null || output === void 0 ? void 0 : output.innerText.trim()) || "", { button: outputCopyLink });
    });
    if (typeof navigator.share === "function") {
        outputShareBtn === null || outputShareBtn === void 0 ? void 0 : outputShareBtn.classList.remove("hidden");
    }
    outputShareBtn === null || outputShareBtn === void 0 ? void 0 : outputShareBtn.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
        const text = output === null || output === void 0 ? void 0 : output.innerText.trim();
        if (!text)
            return;
        try {
            yield navigator.share({ text, title: "DuckMailer forwarding address" });
        }
        catch (_a) {
            // user cancelled the share sheet — nothing to do
        }
    }));
    pairingLinkBtn === null || pairingLinkBtn === void 0 ? void 0 : pairingLinkBtn.addEventListener("click", () => {
        const duck = duckAddress === null || duckAddress === void 0 ? void 0 : duckAddress.value.trim();
        const target = targetAddress === null || targetAddress === void 0 ? void 0 : targetAddress.value.trim();
        if (!duck || !target)
            return;
        const url = new URL(window.location.href);
        url.search = "";
        url.searchParams.set("duck", duck);
        url.searchParams.set("target", target);
        copyToClipboard(url.toString(), {
            successMessage: "Link copied to clipboard",
            button: pairingLinkBtn,
        });
    });
    duckForgetBtn === null || duckForgetBtn === void 0 ? void 0 : duckForgetBtn.addEventListener("click", () => {
        clearStoredDuckAddress();
        if (duckAddress) {
            duckAddress.value = "";
            setFieldValidity(duckAddress, duckErrorMsg, true);
            duckAddress.focus();
        }
        hideResult();
    });
    // ---------------------------------------------------------------------
    // Decode form
    // ---------------------------------------------------------------------
    const decodeForm = document.getElementById("decode-form");
    const decodeOutputContainer = document.getElementById("decode-output-container");
    const fwdInput = document.querySelector("#fwd-email");
    const fwdErrorMsg = document.getElementById("fwd-error-msg");
    const decodeButton = document.querySelector("#decode-button");
    const decodeTargetEl = document.getElementById("decode-target");
    const decodeDuckEl = document.getElementById("decode-duck");
    const decodeTargetCopyBtn = document.querySelector("#decode-target-copy");
    const decodeDuckCopyBtn = document.querySelector("#decode-duck-copy");
    const hideDecodeResult = () => {
        decodeOutputContainer === null || decodeOutputContainer === void 0 ? void 0 : decodeOutputContainer.classList.remove("is-visible");
        setTimeout(() => {
            if (!(decodeOutputContainer === null || decodeOutputContainer === void 0 ? void 0 : decodeOutputContainer.classList.contains("is-visible"))) {
                decodeOutputContainer && (decodeOutputContainer.style.display = "none");
            }
        }, 250);
    };
    fwdInput === null || fwdInput === void 0 ? void 0 : fwdInput.addEventListener("input", () => {
        fwdInput.removeAttribute("aria-invalid");
        fwdInput.classList.remove("is-valid");
        fwdErrorMsg === null || fwdErrorMsg === void 0 ? void 0 : fwdErrorMsg.classList.add("hidden");
        hideDecodeResult();
    });
    decodeForm === null || decodeForm === void 0 ? void 0 : decodeForm.addEventListener("submit", (e) => {
        var _a;
        e.preventDefault();
        const fwd = (_a = fwdInput === null || fwdInput === void 0 ? void 0 : fwdInput.value.trim()) !== null && _a !== void 0 ? _a : "";
        const decoded = fwd ? decodeForwardingAddress(fwd) : null;
        setFieldValidity(fwdInput, fwdErrorMsg, !!decoded);
        if (!decoded) {
            fwdInput === null || fwdInput === void 0 ? void 0 : fwdInput.focus();
            return;
        }
        decodeButton === null || decodeButton === void 0 ? void 0 : decodeButton.classList.add("is-loading");
        decodeButton && (decodeButton.disabled = true);
        window.setTimeout(() => {
            decodeButton === null || decodeButton === void 0 ? void 0 : decodeButton.classList.remove("is-loading");
            decodeButton && (decodeButton.disabled = false);
            decodeTargetEl && (decodeTargetEl.innerText = decoded.target);
            decodeDuckEl && (decodeDuckEl.innerText = decoded.duck);
            if (decodeOutputContainer) {
                decodeOutputContainer.style.display = "block";
                requestAnimationFrame(() => decodeOutputContainer.classList.add("is-visible"));
            }
        }, 220);
    });
    decodeTargetCopyBtn === null || decodeTargetCopyBtn === void 0 ? void 0 : decodeTargetCopyBtn.addEventListener("click", () => {
        copyToClipboard((decodeTargetEl === null || decodeTargetEl === void 0 ? void 0 : decodeTargetEl.innerText.trim()) || "", {
            successMessage: "Target email copied to clipboard",
            button: decodeTargetCopyBtn,
        });
    });
    decodeDuckCopyBtn === null || decodeDuckCopyBtn === void 0 ? void 0 : decodeDuckCopyBtn.addEventListener("click", () => {
        copyToClipboard((decodeDuckEl === null || decodeDuckEl === void 0 ? void 0 : decodeDuckEl.innerText.trim()) || "", {
            successMessage: "Duck address copied to clipboard",
            button: decodeDuckCopyBtn,
        });
    });
    // ---------------------------------------------------------------------
    // Clipboard + toast helpers
    // ---------------------------------------------------------------------
    const fallbackCopy = (text) => {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        let succeeded = false;
        try {
            succeeded = document.execCommand("copy");
        }
        catch (_a) {
            succeeded = false;
        }
        document.body.removeChild(textarea);
        return succeeded;
    };
    const copyToClipboard = (copy, opts = {}) => {
        var _a;
        if (!copy)
            return;
        const onSuccess = () => {
            var _a, _b;
            showSnackbar((_a = opts.successMessage) !== null && _a !== void 0 ? _a : "Copied to clipboard");
            markCopied((_b = opts.button) !== null && _b !== void 0 ? _b : null);
        };
        const onFailure = () => {
            var _a;
            if (fallbackCopy(copy)) {
                onSuccess();
            }
            else {
                showSnackbar((_a = opts.failMessage) !== null && _a !== void 0 ? _a : "Couldn't copy — please copy manually");
            }
        };
        if ((_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText) {
            navigator.clipboard.writeText(copy).then(onSuccess).catch(onFailure);
        }
        else {
            onFailure();
        }
    };
    const markCopied = (button) => {
        var _a;
        if (!button)
            return;
        const label = button.querySelector("span");
        const original = (_a = label === null || label === void 0 ? void 0 : label.textContent) !== null && _a !== void 0 ? _a : "";
        label && (label.textContent = "Copied");
        button.classList.add("is-copied");
        const wasDisabled = button.disabled;
        button.disabled = true;
        setTimeout(() => {
            label && (label.textContent = original || "Copy");
            button.classList.remove("is-copied");
            button.disabled = wasDisabled;
        }, 2000);
    };
    function showSnackbar(msg) {
        const text = snackbar === null || snackbar === void 0 ? void 0 : snackbar.querySelector(".snackbar-text");
        text && (text.textContent = msg);
        snackbar === null || snackbar === void 0 ? void 0 : snackbar.classList.add("show");
        setTimeout(() => {
            snackbar === null || snackbar === void 0 ? void 0 : snackbar.classList.remove("show");
        }, 3000);
    }
    // ---------------------------------------------------------------------
    // Remembered duck address
    // ---------------------------------------------------------------------
    const getStoredDuckAddress = () => {
        try {
            return localStorage.getItem(DUCK_KEY);
        }
        catch (_a) {
            return null;
        }
    };
    const updateForgetLinkVisibility = () => {
        duckForgetBtn === null || duckForgetBtn === void 0 ? void 0 : duckForgetBtn.classList.toggle("hidden", !getStoredDuckAddress());
    };
    function setStoredDuckAddress(value) {
        try {
            localStorage.setItem(DUCK_KEY, value);
        }
        catch (_a) {
            // ignore storage failures (private browsing, etc.)
        }
        updateForgetLinkVisibility();
    }
    function clearStoredDuckAddress() {
        try {
            localStorage.removeItem(DUCK_KEY);
        }
        catch (_a) {
            // ignore storage failures (private browsing, etc.)
        }
        updateForgetLinkVisibility();
    }
    // ---------------------------------------------------------------------
    // Recent conversions history
    // ---------------------------------------------------------------------
    const historySection = document.getElementById("history-section");
    const historyList = document.getElementById("history-list");
    const historyClearBtn = document.getElementById("history-clear");
    const getHistory = () => {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            return raw ? JSON.parse(raw) : [];
        }
        catch (_a) {
            return [];
        }
    };
    const saveHistory = (entries) => {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
        }
        catch (_a) {
            // ignore storage failures (private browsing, etc.)
        }
    };
    const copyIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    const deleteIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    function renderHistory() {
        const entries = getHistory();
        if (!historyList || !historySection)
            return;
        historyList.innerHTML = "";
        historySection.classList.toggle("hidden", entries.length === 0);
        entries.forEach((entry) => {
            const li = document.createElement("li");
            li.className = "history-item";
            const address = document.createElement("span");
            address.className = "history-address";
            address.textContent = entry.result;
            address.title = entry.result;
            const actions = document.createElement("div");
            actions.className = "history-actions";
            const copyBtn = document.createElement("button");
            copyBtn.type = "button";
            copyBtn.className = "icon-btn";
            copyBtn.setAttribute("aria-label", "Copy address");
            copyBtn.innerHTML = copyIconSvg;
            copyBtn.addEventListener("click", () => {
                copyToClipboard(entry.result, { button: copyBtn });
            });
            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "icon-btn";
            deleteBtn.setAttribute("aria-label", "Remove from history");
            deleteBtn.innerHTML = deleteIconSvg;
            deleteBtn.addEventListener("click", () => {
                saveHistory(getHistory().filter((item) => item.result !== entry.result));
                renderHistory();
            });
            actions.appendChild(copyBtn);
            actions.appendChild(deleteBtn);
            li.appendChild(address);
            li.appendChild(actions);
            historyList.appendChild(li);
        });
    }
    function addHistoryEntry(entry) {
        const existing = getHistory().filter((item) => item.result !== entry.result);
        saveHistory([entry, ...existing].slice(0, HISTORY_MAX));
        renderHistory();
    }
    historyClearBtn === null || historyClearBtn === void 0 ? void 0 : historyClearBtn.addEventListener("click", () => {
        saveHistory([]);
        renderHistory();
    });
    // ---------------------------------------------------------------------
    // Initial state: prefill from a shared link or a remembered duck address
    // ---------------------------------------------------------------------
    const params = new URLSearchParams(window.location.search);
    const paramDuck = params.get("duck");
    const paramTarget = params.get("target");
    if (paramDuck && duckAddress) {
        duckAddress.value = paramDuck;
        setFieldValidity(duckAddress, duckErrorMsg, validDuckEmail(paramDuck));
    }
    else if (duckAddress) {
        const saved = getStoredDuckAddress();
        if (saved) {
            duckAddress.value = saved;
            setFieldValidity(duckAddress, duckErrorMsg, validDuckEmail(saved));
        }
    }
    if (paramTarget && targetAddress) {
        targetAddress.value = paramTarget;
        setFieldValidity(targetAddress, targetErrorMsg, validEmail(paramTarget));
    }
    updateForgetLinkVisibility();
    renderHistory();
})();
