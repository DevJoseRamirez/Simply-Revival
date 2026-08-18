/* =====================================================
   CWC GIFT-UNLOCK TIERS
   =====================================================
   Companion script for
   snippets/CWC_product_options_tiers.liquid.

   Scope is deliberately tiny. It does NOT touch variants,
   prices, selling plans or the cart — CWC_featured_product__core.js
   and __ui.js still own all of that, unmodified. All this does is
   mirror the selected tier into three pieces of presentation state:

     1. .is-selected on the tier wrap  → opens that tier's panel
     2. .is-unlocked on strip cells    → reveals gifts 1…N
     3. .is-active on a cell's views   → swaps a gift's image/label
                                         when a higher tier overrides it

   INDEX PARITY
   ------------
   Tier N unlocks gift cell N. Selecting tier i unlocks every
   cell whose data-tier is <= i.

   WHY THE CLICKED ELEMENT, NOT `.selected`
   ----------------------------------------
   core.js adds `.selected` inside its own click handler. This
   script's listeners are registered from a <script> that appears
   EARLIER in the document than core.js's, so on click our handler
   runs BEFORE core.js has moved the class. Reading `.selected`
   at that moment would be one tier stale. So a click resolves the
   tier from the clicked button's own wrap, which is correct
   regardless of handler order. `cwc:variant-changed` (emitted by
   core.js after it updates) is then used as a resync safety net,
   which also covers selection changes made by any other code.
   ===================================================== */

(function () {
  "use strict";

  function tierOf(el) {
    var wrap = el.closest(".cwc-gift-tier__wrap");
    return wrap ? parseInt(wrap.dataset.tierIndex, 10) || 0 : 0;
  }

  /**
   * Apply a tier selection to the presentation state.
   * @param {HTMLElement} root  the [data-gift-tiers] container
   * @param {number} tier       1-based tier index (0 = nothing selected)
   */
  function apply(root, tier) {
    var wraps = root.querySelectorAll(".cwc-gift-tier__wrap");
    for (var i = 0; i < wraps.length; i++) {
      var wrapTier = parseInt(wraps[i].dataset.tierIndex, 10) || 0;
      var isCurrent = wrapTier === tier;
      wraps[i].classList.toggle("is-selected", isCurrent);

      // Keep the accessible state in step with the visual one.
      var button = wraps[i].querySelector(
        ".cwc-featured-product__option_button",
      );
      if (button) button.setAttribute("aria-pressed", isCurrent ? "true" : "false");
    }

    var cells = root.querySelectorAll("[data-gift-cell]");
    for (var j = 0; j < cells.length; j++) {
      var cellTier = parseInt(cells[j].dataset.tier, 10) || 0;
      cells[j].classList.toggle("is-unlocked", cellTier > 0 && cellTier <= tier);

      // A cell can carry per-tier overrides — e.g. the bottle gift shows
      // one bottle on tier 2 and two bottles on tier 3. Every view is
      // already in the DOM; pick the one for this tier, else "base".
      // Cells with no overrides render a single view and are skipped.
      var views = cells[j].querySelectorAll("[data-tier-view]");
      if (views.length < 2) continue;

      var active =
        cells[j].querySelector('[data-tier-view="' + tier + '"]') ||
        cells[j].querySelector('[data-tier-view="base"]');

      for (var v = 0; v < views.length; v++) {
        views[v].classList.toggle("is-active", views[v] === active);
      }
    }
  }

  /**
   * Read the currently selected tier out of the DOM. Used for the
   * initial paint (Liquid renders `.selected` server-side) and for
   * resyncing after core.js emits a variant change.
   */
  function selectedTier(root) {
    var selected = root.querySelector(
      ".cwc-featured-product__option_button.selected",
    );
    if (selected) return tierOf(selected);

    // Nothing marked selected — fall back to the first enabled tier
    // so a gift is never orphaned behind a lock with no way to open it.
    var first = root.querySelector(
      ".cwc-featured-product__option_button:not([disabled])",
    );
    return first ? tierOf(first) : 0;
  }

  function init(root) {
    if (root.dataset.giftUnlockReady === "true") return;
    root.dataset.giftUnlockReady = "true";

    // Click: resolve from the clicked button (see note above).
    root.addEventListener("click", function (event) {
      var button = event.target.closest(
        ".cwc-featured-product__option_button",
      );
      if (!button || !root.contains(button)) return;
      if (button.disabled) return;

      var tier = tierOf(button);
      if (tier) apply(root, tier);
    });

    // Resync after core.js has finished updating the selection.
    var section = root.closest(".cwc-featured-product");
    if (section) {
      section.addEventListener("cwc:variant-changed", function () {
        apply(root, selectedTier(root));
      });
    }

    apply(root, selectedTier(root));
  }

  function initAll(scope) {
    var roots = (scope || document).querySelectorAll("[data-gift-tiers]");
    for (var i = 0; i < roots.length; i++) init(roots[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initAll(document);
    });
  } else {
    initAll(document);
  }

  // Theme editor re-renders the section without a page load.
  document.addEventListener("shopify:section:load", function (event) {
    initAll(event.target || document);
  });
})();
