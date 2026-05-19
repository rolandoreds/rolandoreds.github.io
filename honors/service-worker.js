"use strict";

(function () {
  const STORAGE_KEYS = {
    checklist: "securelaunch-checklist-progress-v1",
    activePhase: "securelaunch-active-phase-v1"
  };

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const select = (selector, parent = document) => parent.querySelector(selector);
  const selectAll = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  function runWhenReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  runWhenReady(function () {
    document.documentElement.classList.add("js-enabled");

    registerServiceWorker();
    setupMobileNavigation();
    setupSmoothScrolling();
    setupScrollSpy();
    setupRevealEffects();
    setupChecklistStorage();
    setupInteractivePanels();
    setupCopyButtons();
    setupOfflineStatus();
    setupCurrentYear();
  });

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("service-worker.js")
        .then(function (registration) {
          console.log("SecureLaunch service worker registered:", registration.scope);
        })
        .catch(function (error) {
          console.warn("SecureLaunch service worker registration failed:", error);
        });
    });
  }

  function setupMobileNavigation() {
    const navButton =
      select("[data-nav-toggle]") ||
      select(".nav-toggle") ||
      select("#navToggle") ||
      select("#menuButton");

    const navMenu =
      select("[data-primary-nav]") ||
      select(".primary-nav") ||
      select(".nav-links") ||
      select("#primaryNav");

    if (!navButton || !navMenu) {
      return;
    }

    function setNavigationState(isOpen) {
      navButton.setAttribute("aria-expanded", String(isOpen));
      navMenu.classList.toggle("is-open", isOpen);
      document.body.classList.toggle("nav-is-open", isOpen);
    }

    navButton.addEventListener("click", function () {
      const isOpen = navButton.getAttribute("aria-expanded") === "true";
      setNavigationState(!isOpen);
    });

    selectAll("a", navMenu).forEach(function (link) {
      link.addEventListener("click", function () {
        setNavigationState(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        setNavigationState(false);
      }
    });
  }

  function setupSmoothScrolling() {
    const pageLinks = selectAll('a[href^="#"]');

    pageLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        const targetId = link.getAttribute("href");

        if (!targetId || targetId === "#") {
          return;
        }

        const target = select(targetId);

        if (!target) {
          return;
        }

        event.preventDefault();

        target.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start"
        });

        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }

        target.focus({ preventScroll: true });
      });
    });
  }

  function setupScrollSpy() {
    const sections = selectAll("main section[id], section[id]");
    const navLinks = selectAll("nav a[href^='#'], .primary-nav a[href^='#']");

    if (sections.length === 0 || navLinks.length === 0) {
      return;
    }

    const linksBySection = new Map();

    navLinks.forEach(function (link) {
      const sectionId = link.getAttribute("href").replace("#", "");
      linksBySection.set(sectionId, link);
    });

    function setActiveLink(sectionId) {
      navLinks.forEach(function (link) {
        link.removeAttribute("aria-current");
        link.classList.remove("is-active");
      });

      const activeLink = linksBySection.get(sectionId);

      if (activeLink) {
        activeLink.setAttribute("aria-current", "page");
        activeLink.classList.add("is-active");
      }
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: "-35% 0px -55% 0px",
        threshold: 0
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function setupRevealEffects() {
    const revealElements = selectAll(
      "[data-reveal], .reveal, .section-card, .feature-card, .phase-card, .threat-card, .checklist-card, .research-card"
    );

    if (revealElements.length === 0) {
      return;
    }

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealElements.forEach(function (element) {
        element.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, currentObserver) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.12
      }
    );

    revealElements.forEach(function (element) {
      observer.observe(element);
    });
  }

  function setupChecklistStorage() {
    const checklistInputs = selectAll(
      "[data-checklist] input[type='checkbox'], .launch-checklist input[type='checkbox'], .checklist input[type='checkbox']"
    );

    if (checklistInputs.length === 0) {
      return;
    }

    const progressText =
      select("[data-checklist-progress-text]") ||
      select("#checklistProgressText");

    const progressBar =
      select("[data-checklist-progress-bar]") ||
      select("#checklistProgressBar");

    const resetButton =
      select("[data-reset-checklist]") ||
      select("#resetChecklist");

    const savedProgress = loadChecklistProgress();

    checklistInputs.forEach(function (input, index) {
      const key = getChecklistKey(input, index);

      if (savedProgress[key] === true) {
        input.checked = true;
      }

      input.addEventListener("change", function () {
        const currentProgress = loadChecklistProgress();
        currentProgress[key] = input.checked;
        localStorage.setItem(
          STORAGE_KEYS.checklist,
          JSON.stringify(currentProgress)
        );

        updateChecklistProgress(checklistInputs, progressText, progressBar);
      });
    });

    if (resetButton) {
      resetButton.addEventListener("click", function () {
        checklistInputs.forEach(function (input) {
          input.checked = false;
        });

        localStorage.removeItem(STORAGE_KEYS.checklist);
        updateChecklistProgress(checklistInputs, progressText, progressBar);
      });
    }

    updateChecklistProgress(checklistInputs, progressText, progressBar);
  }

  function loadChecklistProgress() {
    const rawProgress = localStorage.getItem(STORAGE_KEYS.checklist);

    if (!rawProgress) {
      return {};
    }

    try {
      return JSON.parse(rawProgress);
    } catch (error) {
      console.warn("Saved checklist data could not be read:", error);
      localStorage.removeItem(STORAGE_KEYS.checklist);
      return {};
    }
  }

  function getChecklistKey(input, index) {
    if (input.id) {
      return input.id;
    }

    if (input.name) {
      return input.name;
    }

    return "checklist-item-" + index;
  }

  function updateChecklistProgress(inputs, progressText, progressBar) {
    const completed = inputs.filter(function (input) {
      return input.checked;
    }).length;

    const total = inputs.length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (progressText) {
      progressText.textContent =
        completed + " of " + total + " launch checks completed";
    }

    if (progressBar) {
      progressBar.style.width = percentage + "%";
      progressBar.setAttribute("aria-valuenow", String(percentage));
      progressBar.setAttribute("aria-valuemin", "0");
      progressBar.setAttribute("aria-valuemax", "100");
    }
  }

  function setupInteractivePanels() {
    const buttons = selectAll("[data-panel-button], [data-phase-button], [data-tab-button]");

    if (buttons.length === 0) {
      return;
    }

    function activatePanel(button) {
      const targetId =
        button.dataset.panelTarget ||
        button.dataset.phaseTarget ||
        button.dataset.tabTarget ||
        button.getAttribute("aria-controls");

      if (!targetId) {
        return;
      }

      const targetPanel = select("#" + targetId);

      if (!targetPanel) {
        return;
      }

      const panelGroup = button.dataset.panelGroup || "default";
      const groupButtons = buttons.filter(function (candidate) {
        return (candidate.dataset.panelGroup || "default") === panelGroup;
      });

      const groupPanels = selectAll(
        "[data-panel-group='" + panelGroup + "'], [data-phase-panel], [data-tab-panel]"
      );

      groupButtons.forEach(function (candidate) {
        candidate.classList.remove("is-active");
        candidate.setAttribute("aria-selected", "false");
      });

      groupPanels.forEach(function (panel) {
        panel.classList.remove("is-active");
        panel.setAttribute("hidden", "");
      });

      button.classList.add("is-active");
      button.setAttribute("aria-selected", "true");

      targetPanel.classList.add("is-active");
      targetPanel.removeAttribute("hidden");

      localStorage.setItem(STORAGE_KEYS.activePhase, targetId);
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        activatePanel(button);
      });
    });

    const savedPanelId = localStorage.getItem(STORAGE_KEYS.activePhase);

    if (savedPanelId) {
      const savedButton = buttons.find(function (button) {
        return (
          button.dataset.panelTarget === savedPanelId ||
          button.dataset.phaseTarget === savedPanelId ||
          button.dataset.tabTarget === savedPanelId ||
          button.getAttribute("aria-controls") === savedPanelId
        );
      });

      if (savedButton) {
        activatePanel(savedButton);
      }
    }
  }

  function setupCopyButtons() {
    const copyButtons = selectAll("[data-copy-target]");

    copyButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const targetSelector = button.dataset.copyTarget;
        const target = select(targetSelector);

        if (!target) {
          return;
        }

        const textToCopy =
          target.value ||
          target.textContent ||
          target.innerText ||
          "";

        copyText(textToCopy.trim(), button);
      });
    });
  }

  function copyText(text, button) {
    if (!text) {
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(function () {
          showCopyConfirmation(button);
        })
        .catch(function () {
          fallbackCopyText(text, button);
        });
    } else {
      fallbackCopyText(text, button);
    }
  }

  function fallbackCopyText(text, button) {
    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = text;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "absolute";
    temporaryInput.style.left = "-9999px";

    document.body.appendChild(temporaryInput);
    temporaryInput.select();

    try {
      document.execCommand("copy");
      showCopyConfirmation(button);
    } catch (error) {
      console.warn("Copy failed:", error);
    }

    document.body.removeChild(temporaryInput);
  }

  function showCopyConfirmation(button) {
    const originalText = button.textContent;

    button.textContent = "Copied";
    button.classList.add("is-success");

    window.setTimeout(function () {
      button.textContent = originalText;
      button.classList.remove("is-success");
    }, 1600);
  }

  function setupOfflineStatus() {
    let statusBadge =
      select("[data-network-status]") ||
      select("#networkStatus");

    if (!statusBadge) {
      statusBadge = document.createElement("div");
      statusBadge.className = "network-status";
      statusBadge.setAttribute("data-network-status", "");
      statusBadge.setAttribute("aria-live", "polite");
      document.body.appendChild(statusBadge);
    }

    function updateStatus() {
      const isOnline = navigator.onLine;

      statusBadge.textContent = isOnline
        ? "Online"
        : "Offline mode";

      statusBadge.classList.toggle("is-online", isOnline);
      statusBadge.classList.toggle("is-offline", !isOnline);
    }

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    updateStatus();
  }

  function setupCurrentYear() {
    const yearElements = selectAll("[data-current-year]");

    yearElements.forEach(function (element) {
      element.textContent = String(new Date().getFullYear());
    });
  }
})();
