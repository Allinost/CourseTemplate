/**
 * Standalone deck runtime. No dependencies, no modules, works from file://.
 *
 * Presentation: arrow keys / space / touch swipe / on-screen controls.
 * Export:       ?export=1&slide=N freezes animation and fills the viewport.
 * Studio:       window.HTMLPPT.mount(element, { studio: true })
 */
(function () {
  "use strict";

  const VERSION = "1.0.0";
  const instances = new WeakMap();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mount(root, options) {
    if (!root) return null;
    const existing = instances.get(root);
    if (existing) existing.destroy();

    const slides = Array.from(root.querySelectorAll(".slide"));
    if (!slides.length) return null;

    const opts = options || {};
    const params = new URLSearchParams(window.location.search);
    const exportMode = opts.export === true || params.get("export") === "1";
    const studioMode = opts.studio === true || root.classList.contains("deck--studio");
    const total = slides.length;
    let index = 0;
    let overview = false;
    let autoplayTimer = null;
    let touchStart = null;
    let destroyed = false;
    let resizeTimer = null;
    let countFrames = new Map();

    if (exportMode) {
      document.documentElement.classList.add("is-export");
      document.body.classList.add("is-export");
      root.classList.add("is-export");
    }
    if (studioMode) root.classList.add("is-studio");
    root.classList.add("is-ready");

    const counter = root.querySelector(".deck__count b");
    const progress = root.querySelector(".deck__progress span");
    const prevButton = root.querySelector('[data-nav="prev"]');
    const nextButton = root.querySelector('[data-nav="next"]');
    const overviewButton = root.querySelector('[data-action="overview"]');
    const fullscreenButton = root.querySelector('[data-action="fullscreen"]');

    function updateChrome() {
      if (counter) counter.textContent = String(index + 1).padStart(2, "0");
      if (progress) progress.style.setProperty("--progress", `${((index + 1) / total) * 100}%`);
      if (prevButton) prevButton.disabled = index === 0;
      if (nextButton) nextButton.disabled = index === total - 1;
      if (overviewButton) overviewButton.setAttribute("aria-pressed", String(overview));
    }

    function updateHash() {
      if (exportMode || studioMode) return;
      try {
        const next = `#slide-${index + 1}`;
        if (window.location.hash !== next) {
          window.history.replaceState(null, "", next);
        }
      } catch (_error) {
        /* file:// in some browsers blocks replaceState; navigation still works */
      }
    }

    function formatCount(value, decimals) {
      return Number(value).toFixed(decimals);
    }

    function animateCounts(slide) {
      if (!slide) return;
      const nodes = Array.from(slide.querySelectorAll("[data-count-to]"));
      nodes.forEach((node) => {
        const target = Number(node.dataset.countTo);
        if (!Number.isFinite(target)) return;
        const decimals = Math.max(0, Number(node.dataset.decimals || 0));
        const prefix = node.dataset.prefix || "";
        const suffix = node.dataset.suffix || "";
        const previousFrame = countFrames.get(node);
        if (previousFrame) cancelAnimationFrame(previousFrame);

        if (exportMode || reducedMotion.matches) {
          node.textContent = `${prefix}${formatCount(target, decimals)}${suffix}`;
          return;
        }

        const started = performance.now();
        const duration = 1100;
        node.textContent = `${prefix}${formatCount(0, decimals)}${suffix}`;
        const tick = (now) => {
          if (destroyed) return;
          const progressValue = clamp((now - started) / duration, 0, 1);
          const eased = 1 - Math.pow(1 - progressValue, 3);
          node.textContent = `${prefix}${formatCount(target * eased, decimals)}${suffix}`;
          if (progressValue < 1) {
            countFrames.set(node, requestAnimationFrame(tick));
          } else {
            countFrames.delete(node);
            node.textContent = `${prefix}${formatCount(target, decimals)}${suffix}`;
          }
        };
        countFrames.set(node, requestAnimationFrame(tick));
      });
    }

    function fitSlide(slide) {
      if (!slide) return;
      const inner = slide.querySelector(".slide__inner");
      if (!inner) return;
      slide.style.setProperty("--density", "1");
      const tolerance = Math.max(32, Math.round(inner.clientHeight * 0.035));
      let overflow = inner.scrollHeight - inner.clientHeight;
      if (overflow <= tolerance) {
        slide.classList.remove("is-autofit");
        return;
      }
      let density = 1;
      let previous = overflow;
      // Step the type scale down until the content stops overflowing. Decorative
      // absolutely-positioned stamps can add a few pixels of scroll overflow, so
      // ignore a small tolerance and stop as soon as shrinking stops helping.
      for (let step = 0; step < 10; step += 1) {
        density = Math.max(0.64, density - 0.05);
        slide.style.setProperty("--density", density.toFixed(3));
        const next = inner.scrollHeight - inner.clientHeight;
        if (next <= tolerance || next >= previous - 2 || density <= 0.64) {
          overflow = next;
          break;
        }
        previous = next;
        overflow = next;
      }
      slide.classList.toggle("is-autofit", density < 0.999);
    }

    function fitAll() {
      slides.forEach(fitSlide);
    }

    function setSlide(next, settings) {
      const config = settings || {};
      const target = clamp(Math.round(next), 0, total - 1);
      if (overview && !config.keepOverview) {
        overview = false;
        root.classList.remove("is-overview");
      }
      index = target;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle("is-active", active);
        slide.classList.toggle("is-past", slideIndex < index);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
        if ("inert" in slide) slide.inert = !active;
      });
      updateChrome();
      updateHash();
      root.dataset.index = String(index);
      if (!config.silent) {
        const activeSlide = slides[index];
        requestAnimationFrame(() => {
          fitSlide(activeSlide);
          animateCounts(activeSlide);
        });
        root.dispatchEvent(
          new CustomEvent("slidechange", {
            detail: { index, total, slide: activeSlide },
          }),
        );
      }
      return index;
    }

    function next() {
      return setSlide(index + 1);
    }

    function prev() {
      return setSlide(index - 1);
    }

    function toggleOverview(force) {
      overview = typeof force === "boolean" ? force : !overview;
      root.classList.toggle("is-overview", overview);
      if (overview) {
        slides.forEach((slide) => {
          slide.setAttribute("aria-hidden", "false");
          if ("inert" in slide) slide.inert = false;
        });
      } else {
        setSlide(index);
      }
      updateChrome();
    }

    function toggleFullscreen() {
      const target = root;
      try {
        if (!document.fullscreenElement) {
          const request = target.requestFullscreen && target.requestFullscreen();
          if (request && request.catch) request.catch(() => {});
        } else if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (_error) {
        /* Fullscreen may be unavailable in embedded previews. */
      }
    }

    function toggleAutoplay(force) {
      const shouldPlay = typeof force === "boolean" ? force : !autoplayTimer;
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
      if (shouldPlay) {
        autoplayTimer = window.setInterval(() => {
          if (index >= total - 1) setSlide(0);
          else next();
        }, opts.interval || 8000);
      }
      root.classList.toggle("is-autoplay", Boolean(autoplayTimer));
      return Boolean(autoplayTimer);
    }

    function onKeydown(event) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName))
      ) {
        if (event.key !== "Escape") return;
      }
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          event.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          event.preventDefault();
          prev();
          break;
        case "Home":
          event.preventDefault();
          setSlide(0);
          break;
        case "End":
          event.preventDefault();
          setSlide(total - 1);
          break;
        case "o":
        case "O":
          toggleOverview();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "p":
        case "P":
          toggleAutoplay();
          break;
        case "Escape":
          if (overview) toggleOverview(false);
          break;
        default:
          break;
      }
    }

    function onPointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.target.closest("button, a, input, textarea, select")) return;
      touchStart = { x: event.clientX, y: event.clientY, time: Date.now() };
    }

    function onPointerUp(event) {
      if (!touchStart) return;
      const dx = event.clientX - touchStart.x;
      const dy = event.clientY - touchStart.y;
      const elapsed = Date.now() - touchStart.time;
      touchStart = null;
      if (elapsed > 700) return;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (overview) return;
      if (dx < 0) next();
      else prev();
    }

    function onStageClick(event) {
      if (!overview) return;
      const slide = event.target.closest(".slide");
      if (!slide) return;
      const slideIndex = slides.indexOf(slide);
      if (slideIndex < 0) return;
      overview = false;
      root.classList.remove("is-overview");
      setSlide(slideIndex);
    }

    function onResize() {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        fitAll();
      }, 120);
    }

    function onHashChange() {
      if (exportMode || studioMode) return;
      const match = window.location.hash.match(/slide-(\d+)/);
      if (!match) return;
      const target = Number(match[1]) - 1;
      if (target !== index) setSlide(target, { silent: true });
    }

    function onNavClick(event) {
      const button = event.target.closest("[data-nav], [data-action]");
      if (!button || !root.contains(button)) return;
      const nav = button.getAttribute("data-nav");
      if (nav === "prev") prev();
      if (nav === "next") next();
      const action = button.getAttribute("data-action");
      if (action === "overview") toggleOverview();
      if (action === "fullscreen") toggleFullscreen();
    }

    root.addEventListener("click", onNavClick);
    const stage = root.querySelector(".deck__stage");
    if (stage) {
      stage.addEventListener("pointerdown", onPointerDown);
      stage.addEventListener("pointerup", onPointerUp);
      stage.addEventListener("click", onStageClick);
    }
    window.addEventListener("keydown", onKeydown);
    window.addEventListener("resize", onResize);
    window.addEventListener("hashchange", onHashChange);

    const requested = Number(
      params.get("slide") ||
        (window.location.hash.match(/slide-(\d+)/) || [])[1] ||
        opts.start ||
        1,
    );
    setSlide(Number.isFinite(requested) ? requested - 1 : 0, { silent: true });
    fitAll();
    animateCounts(slides[index]);
    root.classList.add("is-ready");

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!destroyed) fitAll();
      });
    }

    const api = {
      go: setSlide,
      next,
      prev,
      toggleOverview,
      toggleFullscreen,
      toggleAutoplay,
      fitAll,
      get index() {
        return index;
      },
      get total() {
        return total;
      },
      get exportMode() {
        return exportMode;
      },
      destroy() {
        destroyed = true;
        if (autoplayTimer) clearInterval(autoplayTimer);
        if (resizeTimer) clearTimeout(resizeTimer);
        countFrames.forEach((frame) => cancelAnimationFrame(frame));
        countFrames = new Map();
        root.removeEventListener("click", onNavClick);
        if (stage) {
          stage.removeEventListener("pointerdown", onPointerDown);
          stage.removeEventListener("pointerup", onPointerUp);
          stage.removeEventListener("click", onStageClick);
        }
        window.removeEventListener("keydown", onKeydown);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("hashchange", onHashChange);
        instances.delete(root);
      },
    };

    instances.set(root, api);
    root.__htmlppt = api;
    return api;
  }

  window.HTMLPPT = {
    version: VERSION,
    mount,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("[data-deck]").forEach((element) => {
        if (element.dataset.deckAuto !== "false") mount(element);
      });
    });
  } else {
    document.querySelectorAll("[data-deck]").forEach((element) => {
      if (element.dataset.deckAuto !== "false") mount(element);
    });
  }
})();
