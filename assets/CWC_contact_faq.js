/* ==============================
   CWC Contact FAQ
   Accordion behavior with smooth height transition.
   - Toggles aria-expanded on the button
   - Toggles `hidden` + animated max-height on the panel
   - Toggles `is-open` class on parent item (drives chevron rotate)
   - Each item opens/closes independently
   - Re-bound on shopify:section:load for theme editor
   ============================== */

(function () {
  "use strict";

  function openPanel(item, btn, panel) {
    btn.setAttribute("aria-expanded", "true");
    item.classList.add("is-open");
    panel.removeAttribute("hidden");

    // Set explicit height for transition, then unlock to auto after.
    panel.style.maxHeight = "0px";
    // Force reflow so the transition picks up the change.
    panel.offsetHeight; // eslint-disable-line no-unused-expressions
    panel.style.maxHeight = panel.scrollHeight + "px";

    var onEnd = function (e) {
      if (e.propertyName !== "max-height") return;
      panel.removeEventListener("transitionend", onEnd);
      // Only unlock if still open — guards against rapid toggle.
      if (item.classList.contains("is-open")) {
        panel.style.maxHeight = "none";
      }
    };
    panel.addEventListener("transitionend", onEnd);
  }

  function closePanel(item, btn, panel) {
    // Lock current height first so we can transition to 0.
    panel.style.maxHeight = panel.scrollHeight + "px";
    // Force reflow.
    panel.offsetHeight; // eslint-disable-line no-unused-expressions
    panel.style.maxHeight = "0px";

    btn.setAttribute("aria-expanded", "false");
    item.classList.remove("is-open");

    var onEnd = function (e) {
      if (e.propertyName !== "max-height") return;
      panel.removeEventListener("transitionend", onEnd);
      // Re-apply `hidden` after the close transition finishes — but only
      // if the item is still closed (guards against rapid re-open).
      if (!item.classList.contains("is-open")) {
        panel.setAttribute("hidden", "");
        panel.style.maxHeight = "";
      }
    };
    panel.addEventListener("transitionend", onEnd);
  }

  function initFaq(root) {
    if (!root) return;
    var questions = root.querySelectorAll(".cwc_contact-faq__question");
    if (!questions.length) return;

    // Close every other open item within this section. Scoping to `root`
    // means multiple FAQ sections on one page won't interfere with each
    // other — each section keeps its own single-open state.
    function closeOthers(currentItem) {
      var openItems = root.querySelectorAll(".cwc_contact-faq__item.is-open");
      openItems.forEach(function (other) {
        if (other === currentItem) return;
        var otherBtn = other.querySelector(".cwc_contact-faq__question");
        var otherPanelId = otherBtn
          ? otherBtn.getAttribute("aria-controls")
          : null;
        var otherPanel = otherPanelId
          ? document.getElementById(otherPanelId)
          : null;
        if (otherBtn && otherPanel) {
          closePanel(other, otherBtn, otherPanel);
        }
      });
    }

    questions.forEach(function (btn) {
      // Avoid double-binding if this runs twice on the same node.
      if (btn.dataset.cwcFaqBound === "true") return;
      btn.dataset.cwcFaqBound = "true";

      btn.addEventListener("click", function () {
        var panelId = btn.getAttribute("aria-controls");
        var panel = panelId ? document.getElementById(panelId) : null;
        var item = btn.closest(".cwc_contact-faq__item");

        if (!panel || !item) return;

        var isOpen = btn.getAttribute("aria-expanded") === "true";

        if (isOpen) {
          closePanel(item, btn, panel);
        } else {
          // Single-open mode: close any other open items in this section first.
          closeOthers(item);
          openPanel(item, btn, panel);
        }
      });
    });
  }

  function initAll(scope) {
    var sections = (scope || document).querySelectorAll(".cwc_contact-faq");
    sections.forEach(initFaq);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initAll();
    });
  } else {
    initAll();
  }

  // Shopify theme editor: re-init when this section is loaded/updated.
  document.addEventListener("shopify:section:load", function (e) {
    if (e && e.target) initAll(e.target);
  });
})();
