(() => {
  const THEME_KEY = "dm-theme";
  const DUCK_KEY = "dm-duck-address";
  const HISTORY_KEY = "dm-history";
  const HISTORY_MAX = 5;

  interface HistoryEntry {
    result: string;
    duck: string;
    target: string;
  }

  // ---------------------------------------------------------------------
  // Theme toggle
  // ---------------------------------------------------------------------
  const themeToggle: HTMLButtonElement | null =
    document.querySelector("#theme-toggle");

  const getStoredTheme = (): "light" | "dark" | null => {
    try {
      const value = localStorage.getItem(THEME_KEY);
      return value === "light" || value === "dark" ? value : null;
    } catch {
      return null;
    }
  };

  const currentTheme = (): "light" | "dark" =>
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";

  const applyTheme = (theme: "light" | "dark") => {
    document.documentElement.setAttribute("data-theme", theme);
    themeToggle?.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore storage failures (private browsing, etc.)
    }
  };

  applyTheme(getStoredTheme() ?? currentTheme());

  themeToggle?.addEventListener("click", () => {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
  });

  // ---------------------------------------------------------------------
  // Tabs (Convert / Decode)
  // ---------------------------------------------------------------------
  const tabConvert: HTMLButtonElement | null = document.querySelector("#tab-convert");
  const tabDecode: HTMLButtonElement | null = document.querySelector("#tab-decode");
  const panelConvert = document.getElementById("panel-convert");
  const panelDecode = document.getElementById("panel-decode");
  const tabButtons = [tabConvert, tabDecode].filter(
    (el): el is HTMLButtonElement => !!el
  );

  const setActiveTab = (mode: "convert" | "decode") => {
    const isConvert = mode === "convert";
    tabConvert?.classList.toggle("is-active", isConvert);
    tabDecode?.classList.toggle("is-active", !isConvert);
    tabConvert?.setAttribute("aria-selected", String(isConvert));
    tabDecode?.setAttribute("aria-selected", String(!isConvert));
    if (tabConvert) tabConvert.tabIndex = isConvert ? 0 : -1;
    if (tabDecode) tabDecode.tabIndex = isConvert ? -1 : 0;
    if (panelConvert) panelConvert.hidden = !isConvert;
    if (panelDecode) panelDecode.hidden = isConvert;
  };

  tabConvert?.addEventListener("click", () => setActiveTab("convert"));
  tabDecode?.addEventListener("click", () => setActiveTab("decode"));

  tabButtons.forEach((btn, idx) => {
    btn.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const nextIdx =
        e.key === "ArrowRight"
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
  const outputCopyLink: HTMLButtonElement | null = document.querySelector(
    "#output-email-copy-link"
  );
  const outputShareBtn: HTMLButtonElement | null =
    document.querySelector("#output-email-share");
  const pairingLinkBtn: HTMLButtonElement | null =
    document.querySelector("#output-copy-link");
  const duckErrorMsg = document.getElementById("duck-error-msg");
  const targetErrorMsg = document.getElementById("target-error-msg");
  const duckForgetBtn: HTMLButtonElement | null = document.querySelector("#duck-forget");
  const snackbar = document.getElementById("snackbar");
  let duckAddress: HTMLInputElement | null = null;
  let targetAddress: HTMLInputElement | null = null;
  let convertButton: HTMLButtonElement | null = null;

  // validate email address
  const validEmail = (email: string) => {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  };

  // validate @duck.com email address
  const validDuckEmail = (email: string) => {
    const re = /^([a-zA-Z0-9_\-.]+)@duck\.com$/;
    return re.test(email.toLowerCase());
  };

  // convert email address
  const convertEmail = (duck: string, target: string): string => {
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
  const decodeForwardingAddress = (
    fwd: string
  ): { target: string; duck: string } | null => {
    const atSignIndex = fwd.lastIndexOf("@");
    if (atSignIndex <= 0) return null;

    const local = fwd.slice(0, atSignIndex);
    const domain = fwd.slice(atSignIndex + 1).toLowerCase();
    if (domain !== "duck.com") return null;

    const atMarker = local.indexOf("_at_");
    if (atMarker <= 0) return null;

    const targetName = local.slice(0, atMarker);
    const rest = local.slice(atMarker + 4);
    const lastUnderscore = rest.lastIndexOf("_");
    if (lastUnderscore <= 0 || lastUnderscore === rest.length - 1) return null;

    const targetDomain = rest.slice(0, lastUnderscore);
    const duckName = rest.slice(lastUnderscore + 1);
    if (!targetDomain.includes(".") || !duckName) return null;

    return {
      target: `${targetName}@${targetDomain}`,
      duck: `${duckName}@duck.com`,
    };
  };

  const setFieldValidity = (
    input: HTMLInputElement | null,
    errorEl: HTMLElement | null,
    isValid: boolean
  ) => {
    if (!input) return;
    input.setAttribute("aria-invalid", isValid ? "false" : "true");
    input.classList.toggle("is-valid", isValid && input.value.trim() !== "");
    errorEl?.classList.toggle("hidden", isValid);
  };

  const hideResult = () => {
    outputContainer?.classList.remove("is-visible");
    setTimeout(() => {
      if (!outputContainer?.classList.contains("is-visible")) {
        outputContainer && (outputContainer.style.display = "none");
      }
    }, 250);
  };

  if (duckMailerForm) {
    duckAddress = duckMailerForm.querySelector('input[name="duck-email"]');
    targetAddress = duckMailerForm.querySelector('input[name="target-email"]');
    convertButton = duckMailerForm.querySelector('button[type="submit"]');

    // live validation as the user types / leaves a field
    duckAddress?.addEventListener("input", () => {
      const value = duckAddress?.value.trim() ?? "";
      if (!value) {
        setFieldValidity(duckAddress, duckErrorMsg, true);
        return;
      }
      setFieldValidity(duckAddress, duckErrorMsg, validDuckEmail(value));
    });

    targetAddress?.addEventListener("input", () => {
      const value = targetAddress?.value.trim() ?? "";
      if (!value) {
        setFieldValidity(targetAddress, targetErrorMsg, true);
        return;
      }
      setFieldValidity(targetAddress, targetErrorMsg, validEmail(value));
    });

    duckMailerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const duck = duckAddress?.value.trim();
      const target = targetAddress?.value.trim();

      const duckValid = !!duck && validDuckEmail(duck);
      const targetValid = !!target && validEmail(target);

      setFieldValidity(duckAddress, duckErrorMsg, duckValid);
      setFieldValidity(targetAddress, targetErrorMsg, targetValid);

      if (!duckValid) {
        duckAddress?.focus();
        return;
      }
      if (!targetValid) {
        targetAddress?.focus();
        return;
      }

      convertButton?.classList.add("is-loading");
      convertButton && (convertButton.disabled = true);

      window.setTimeout(() => {
        const convertedEmail = duck && target && convertEmail(duck, target);
        convertButton?.classList.remove("is-loading");
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

    duckAddress?.addEventListener("input", hideResult);
    targetAddress?.addEventListener("input", hideResult);
  }

  outputCopyLink?.addEventListener("click", () => {
    copyToClipboard(output?.innerText.trim() || "", { button: outputCopyLink });
  });

  if (typeof navigator.share === "function") {
    outputShareBtn?.classList.remove("hidden");
  }

  outputShareBtn?.addEventListener("click", async () => {
    const text = output?.innerText.trim();
    if (!text) return;
    try {
      await navigator.share({ text, title: "DuckMailer forwarding address" });
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  });

  pairingLinkBtn?.addEventListener("click", () => {
    const duck = duckAddress?.value.trim();
    const target = targetAddress?.value.trim();
    if (!duck || !target) return;
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("duck", duck);
    url.searchParams.set("target", target);
    copyToClipboard(url.toString(), {
      successMessage: "Link copied to clipboard",
      button: pairingLinkBtn,
    });
  });

  duckForgetBtn?.addEventListener("click", () => {
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
  const fwdInput: HTMLInputElement | null = document.querySelector("#fwd-email");
  const fwdErrorMsg = document.getElementById("fwd-error-msg");
  const decodeButton: HTMLButtonElement | null = document.querySelector("#decode-button");
  const decodeTargetEl = document.getElementById("decode-target");
  const decodeDuckEl = document.getElementById("decode-duck");
  const decodeTargetCopyBtn: HTMLButtonElement | null =
    document.querySelector("#decode-target-copy");
  const decodeDuckCopyBtn: HTMLButtonElement | null =
    document.querySelector("#decode-duck-copy");

  const hideDecodeResult = () => {
    decodeOutputContainer?.classList.remove("is-visible");
    setTimeout(() => {
      if (!decodeOutputContainer?.classList.contains("is-visible")) {
        decodeOutputContainer && (decodeOutputContainer.style.display = "none");
      }
    }, 250);
  };

  fwdInput?.addEventListener("input", () => {
    fwdInput.removeAttribute("aria-invalid");
    fwdInput.classList.remove("is-valid");
    fwdErrorMsg?.classList.add("hidden");
    hideDecodeResult();
  });

  decodeForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fwd = fwdInput?.value.trim() ?? "";
    const decoded = fwd ? decodeForwardingAddress(fwd) : null;

    setFieldValidity(fwdInput, fwdErrorMsg, !!decoded);

    if (!decoded) {
      fwdInput?.focus();
      return;
    }

    decodeButton?.classList.add("is-loading");
    decodeButton && (decodeButton.disabled = true);

    window.setTimeout(() => {
      decodeButton?.classList.remove("is-loading");
      decodeButton && (decodeButton.disabled = false);

      decodeTargetEl && (decodeTargetEl.innerText = decoded.target);
      decodeDuckEl && (decodeDuckEl.innerText = decoded.duck);

      if (decodeOutputContainer) {
        decodeOutputContainer.style.display = "block";
        requestAnimationFrame(() => decodeOutputContainer.classList.add("is-visible"));
      }
    }, 220);
  });

  decodeTargetCopyBtn?.addEventListener("click", () => {
    copyToClipboard(decodeTargetEl?.innerText.trim() || "", {
      successMessage: "Target email copied to clipboard",
      button: decodeTargetCopyBtn,
    });
  });

  decodeDuckCopyBtn?.addEventListener("click", () => {
    copyToClipboard(decodeDuckEl?.innerText.trim() || "", {
      successMessage: "Duck address copied to clipboard",
      button: decodeDuckCopyBtn,
    });
  });

  // ---------------------------------------------------------------------
  // Clipboard + toast helpers
  // ---------------------------------------------------------------------
  const fallbackCopy = (text: string): boolean => {
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
    } catch {
      succeeded = false;
    }
    document.body.removeChild(textarea);
    return succeeded;
  };

  const copyToClipboard = (
    copy: string,
    opts: {
      successMessage?: string;
      failMessage?: string;
      button?: HTMLButtonElement | null;
    } = {}
  ) => {
    if (!copy) return;

    const onSuccess = () => {
      showSnackbar(opts.successMessage ?? "Copied to clipboard");
      markCopied(opts.button ?? null);
    };

    const onFailure = () => {
      if (fallbackCopy(copy)) {
        onSuccess();
      } else {
        showSnackbar(opts.failMessage ?? "Couldn't copy — please copy manually");
      }
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(copy).then(onSuccess).catch(onFailure);
    } else {
      onFailure();
    }
  };

  const markCopied = (button: HTMLButtonElement | null) => {
    if (!button) return;
    const label = button.querySelector("span");
    const original = label?.textContent ?? "";
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

  function showSnackbar(msg: string) {
    const text = snackbar?.querySelector(".snackbar-text");
    text && (text.textContent = msg);
    snackbar?.classList.add("show");
    setTimeout(() => {
      snackbar?.classList.remove("show");
    }, 3000);
  }

  // ---------------------------------------------------------------------
  // Remembered duck address
  // ---------------------------------------------------------------------
  const getStoredDuckAddress = (): string | null => {
    try {
      return localStorage.getItem(DUCK_KEY);
    } catch {
      return null;
    }
  };

  const updateForgetLinkVisibility = () => {
    duckForgetBtn?.classList.toggle("hidden", !getStoredDuckAddress());
  };

  function setStoredDuckAddress(value: string) {
    try {
      localStorage.setItem(DUCK_KEY, value);
    } catch {
      // ignore storage failures (private browsing, etc.)
    }
    updateForgetLinkVisibility();
  }

  function clearStoredDuckAddress() {
    try {
      localStorage.removeItem(DUCK_KEY);
    } catch {
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

  const getHistory = (): HistoryEntry[] => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    } catch {
      return [];
    }
  };

  const saveHistory = (entries: HistoryEntry[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    } catch {
      // ignore storage failures (private browsing, etc.)
    }
  };

  const copyIconSvg =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const deleteIconSvg =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  function renderHistory() {
    const entries = getHistory();
    if (!historyList || !historySection) return;
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

  function addHistoryEntry(entry: HistoryEntry) {
    const existing = getHistory().filter((item) => item.result !== entry.result);
    saveHistory([entry, ...existing].slice(0, HISTORY_MAX));
    renderHistory();
  }

  historyClearBtn?.addEventListener("click", () => {
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
  } else if (duckAddress) {
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
