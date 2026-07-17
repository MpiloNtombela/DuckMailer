(() => {
  const THEME_KEY = "dm-theme";

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
  // Converter form
  // ---------------------------------------------------------------------
  const duckMailerForm = document.getElementById("duckmailer-form");
  const outputContainer = document.getElementById("output-container");
  const output = document.getElementById("output-email");
  const outputCopyLink: HTMLButtonElement | null = document.querySelector(
    "#output-email-copy-link"
  );
  const duckErrorMsg = document.getElementById("duck-error-msg");
  const targetErrorMsg = document.getElementById("target-error-msg");
  const snackbar = document.getElementById("snackbar");
  let duckAddress: HTMLInputElement | null;
  let targetAddress: HTMLInputElement | null;
  let convertButton: HTMLButtonElement | null;

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
        copyToClipboard(convertedEmail || "", { silent: true });
      }, 280);
    });

    duckAddress?.addEventListener("input", hideResult);
    targetAddress?.addEventListener("input", hideResult);
  }

  outputCopyLink?.addEventListener("click", () => {
    copyToClipboard(output?.innerText.trim() || "");
  });

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

  const copyToClipboard = (copy: string, opts: { silent?: boolean } = {}) => {
    if (!copy) return;

    const onSuccess = () => {
      if (opts.silent) return;
      showSnackbar("Email copied to clipboard");
      markCopied();
    };

    const onFailure = () => {
      if (fallbackCopy(copy)) {
        onSuccess();
      } else if (!opts.silent) {
        showSnackbar("Couldn't copy — please copy manually");
      }
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(copy).then(onSuccess).catch(onFailure);
    } else {
      onFailure();
    }
  };

  const markCopied = () => {
    if (!outputCopyLink) return;
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

  function showSnackbar(msg: string) {
    const text = snackbar?.querySelector(".snackbar-text");
    text && (text.textContent = msg);
    snackbar?.classList.add("show");
    setTimeout(() => {
      snackbar?.classList.remove("show");
    }, 3000);
  }
})();
