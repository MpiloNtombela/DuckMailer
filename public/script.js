"use strict";
(() => {
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
    if (duckMailerForm) {
        duckAddress = duckMailerForm.querySelector('input[name="duck-email"]');
        targetAddress = duckMailerForm.querySelector('input[name="target-email"]');
        convertButton = duckMailerForm.querySelector('button[type="submit"]');
        duckMailerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const duck = duckAddress === null || duckAddress === void 0 ? void 0 : duckAddress.value;
            const target = targetAddress === null || targetAddress === void 0 ? void 0 : targetAddress.value;
            outputContainer && (outputContainer.style.display = "none");
            output && (output.textContent = "");
            duckErrorMsg && (duckErrorMsg.style.display = "none");
            targetErrorMsg && (targetErrorMsg.style.display = "none");
            if (duck && !validDuckEmail(duck)) {
                duckErrorMsg && (duckErrorMsg.style.display = "block");
                duckErrorMsg &&
                    (duckErrorMsg.innerHTML =
                        "Please enter a valid @duck.com email address");
                return;
            }
            else {
                duckErrorMsg && (duckErrorMsg.style.display = "none");
            }
            if (target && !validEmail(target)) {
                targetErrorMsg && (targetErrorMsg.style.display = "block");
                targetErrorMsg &&
                    (targetErrorMsg.innerHTML = "Please enter a valid email address");
                return;
            }
            else {
                targetErrorMsg && (targetErrorMsg.style.display = "none");
            }
            const convertedEmail = duck && target && convertEmail(duck, target);
            outputContainer && (outputContainer.style.display = "block");
            output && (output.innerText = convertedEmail || "");
            // copy to clipboard
            copyToClipboard(convertedEmail || "");
        });
    }
    outputCopyLink === null || outputCopyLink === void 0 ? void 0 : outputCopyLink.addEventListener("click", () => {
        copyToClipboard((output === null || output === void 0 ? void 0 : output.innerText.trim()) || "");
    });
    // validate email address
    const validEmail = (email) => {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email.toLowerCase());
    };
    // validate @duck.com email address
    const validDuckEmail = (email) => {
        const re = /^([a-zA-Z0-9_\-\.]+)@duck.com$/;
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
    const copyToClipboard = (copy) => {
        outputCopyLink && (outputCopyLink.innerText = "Copy");
        navigator.clipboard
            .writeText(copy)
            .then(() => {
            showSnackbar("Email copied to clipboard");
            outputCopyLink && (outputCopyLink.innerText = "Copied");
            // disable button
            convertButton && (convertButton.disabled = true);
            outputCopyLink && (outputCopyLink.disabled = true);
            setTimeout(() => {
                outputCopyLink && (outputCopyLink.innerText = "Copy");
                convertButton && (convertButton.disabled = false);
                outputCopyLink && (outputCopyLink.disabled = false);
            }, 3500);
        })
            .catch((err) => {
            showSnackbar("Error copying email to clipboard");
        });
    };
    function showSnackbar(msg) {
        snackbar && (snackbar.innerText = msg);
        snackbar && snackbar.classList.add("show");
        outputCopyLink && (outputCopyLink.innerText = "Copied");
        setTimeout(() => {
            snackbar && snackbar.classList.remove("show");
        }, 3000);
    }
})();
