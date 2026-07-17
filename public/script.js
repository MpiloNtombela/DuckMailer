"use strict";
(() => {
    var _a;
    const THEME_KEY = "dm-theme";
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
    // Converter form
    // ---------------------------------------------------------------------
    const duckMailerForm = document.getElementById("duckmailer-form");
    const outputContainer = document.getElementById("output-container");
    const output = document.getElementById("output-email");
    const outputCopyLink = document.querySelector("#output-email-copy-link");
    const duckErrorMsg = document.getElementById("duck-error-msg");
    const targetErrorMsg = document.getElementById("target-error-msg");
    const snackbar = document.getElementById("snackbar");
    let duckAddress;
    let targetAddress;
    let convertButton;
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
                });
            }, 280);
        });
        duckAddress === null || duckAddress === void 0 ? void 0 : duckAddress.addEventListener("input", hideResult);
        targetAddress === null || targetAddress === void 0 ? void 0 : targetAddress.addEventListener("input", hideResult);
    }
    outputCopyLink === null || outputCopyLink === void 0 ? void 0 : outputCopyLink.addEventListener("click", () => {
        copyToClipboard((output === null || output === void 0 ? void 0 : output.innerText.trim()) || "");
    });
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
            var _a;
            showSnackbar((_a = opts.successMessage) !== null && _a !== void 0 ? _a : "Email copied to clipboard");
            markCopied();
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
    const markCopied = () => {
        if (!outputCopyLink)
            return;
        const label = outputCopyLink.querySelector("span");
        label && (label.textContent = "Copied");
        outputCopyLink.classList.add("is-copied");
        outputCopyLink.disabled = true;
        convertButton && (convertButton.disabled = true);
        setTimeout(() => {
            label && (label.textContent = "Copy");
            outputCopyLink.classList.remove("is-copied");
            outputCopyLink.disabled = false;
            convertButton && (convertButton.disabled = false);
        }, 2500);
    };
    function showSnackbar(msg) {
        const text = snackbar === null || snackbar === void 0 ? void 0 : snackbar.querySelector(".snackbar-text");
        text && (text.textContent = msg);
        snackbar === null || snackbar === void 0 ? void 0 : snackbar.classList.add("show");
        setTimeout(() => {
            snackbar === null || snackbar === void 0 ? void 0 : snackbar.classList.remove("show");
        }, 3000);
    }
})();
