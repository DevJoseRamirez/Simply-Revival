/* =====================================================
   CWC FEATURED PRODUCT - CORE MODULE
   =====================================================
   Handles: Variant logic, selling plans, form inputs, 
   add-to-cart API calls.
   
   Emits Events:
   - cwc:variant-changed      → When variant selection changes
   - cwc:subscription-changed → When subscription toggle changes
   - cwc:cart-loading         → When add-to-cart starts
   - cwc:cart-success         → When add-to-cart succeeds
   - cwc:cart-error           → When add-to-cart fails
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll(".cwc-featured-product");

  sections.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const variants = JSON.parse(section.dataset.variants || "[]");
    const sellingPlanGroups = JSON.parse(section.dataset.sellingPlans || "[]");
    const savingsDisplayType = section.dataset.savingsDisplay || "dollar";

    initFeaturedProductCore(
      section,
      sectionId,
      variants,
      sellingPlanGroups,
      savingsDisplayType,
    );
  });
});

/* =====================================================
   CORE INITIALIZATION
   ===================================================== */
function initFeaturedProductCore(
  section,
  sectionId,
  variants,
  sellingPlanGroups,
  savingsDisplayType = "dollar",
) {
  /* -----------------------------------------------------
     DOM REFERENCES
     ----------------------------------------------------- */
  const form = section.querySelector(`#product-form-${sectionId}`);
  const variantIdInput = section.querySelector(".variant-id-input");
  const optionButtons = section.querySelectorAll(
    ".cwc-featured-product__option_button",
  );
  const optionInputs = section.querySelectorAll(
    ".cwc-featured-product__option-input",
  );
  const addToCartButton = section.querySelector(`#add-to-cart-${sectionId}`);
  const autoRefillCheckbox = section.querySelector(`#auto-refill-${sectionId}`);

  /* -----------------------------------------------------
     SELLING PLAN INPUT SETUP
     ----------------------------------------------------- */
  let sellingPlanInput = section.querySelector(".selling-plan-input");

  if (!sellingPlanInput && form) {
    sellingPlanInput = document.createElement("input");
    sellingPlanInput.type = "hidden";
    sellingPlanInput.name = "selling_plan";
    sellingPlanInput.className = "selling-plan-input";
    sellingPlanInput.value = "";
    form.appendChild(sellingPlanInput);
  }

  /* -----------------------------------------------------
     VALIDATION
     ----------------------------------------------------- */
  if (!form || !addToCartButton || !variantIdInput) {
    console.warn(
      "CWC Core: Required elements not found for section",
      sectionId,
    );
    return;
  }

  /* =====================================================
     VARIANT FUNCTIONS
     ===================================================== */
  function findVariant(selectedOptions) {
    return variants.find((variant) => {
      return variant.options.every(
        (option, index) => option === selectedOptions[index],
      );
    });
  }

  function findVariantById(variantId) {
    return variants.find((variant) => variant.id == variantId);
  }

  function getCurrentVariant() {
    const variantId = variantIdInput.value;
    return findVariantById(variantId);
  }

  /* =====================================================
     SELLING PLAN FUNCTIONS
     ===================================================== */

  /**
   * SCENARIO 1: Product-level selling plan (same for all variants)
   * SCENARIO 2: Variant-level selling plans (unique per variant)
   * Only ONE scenario exists at any given time.
   */

  function isVariantLevelSellingPlans() {
    return !!section.querySelector(
      ".cwc-featured-product__option_button[data-selling-plan-id]",
    );
  }

  function getVariantSellingPlanId() {
    if (isVariantLevelSellingPlans()) {
      const selectedButton = section.querySelector(
        ".cwc-featured-product__option_button.selected",
      );
      if (selectedButton && selectedButton.dataset.sellingPlanId) {
        return selectedButton.dataset.sellingPlanId;
      }
      return null;
    }

    if (sellingPlanGroups.length > 0) {
      return sellingPlanGroups[0]?.selling_plans?.[0]?.id || null;
    }
    return null;
  }

  function hasSellingPlanAvailable() {
    if (isVariantLevelSellingPlans()) {
      const selectedButton = section.querySelector(
        ".cwc-featured-product__option_button.selected",
      );
      return !!(selectedButton && selectedButton.dataset.sellingPlanId);
    }
    return sellingPlanGroups.length > 0;
  }

  function getSellingPlanById(sellingPlanId) {
    if (!sellingPlanId) return null;

    for (const group of sellingPlanGroups) {
      const found = group.selling_plans?.find(
        (plan) => String(plan.id) === String(sellingPlanId),
      );
      if (found) return found;
    }
    return null;
  }

  function isSubscriptionActive() {
    return autoRefillCheckbox && autoRefillCheckbox.checked;
  }

  function updateSellingPlanInput() {
    if (!sellingPlanInput) return;

    if (isSubscriptionActive() && hasSellingPlanAvailable()) {
      const sellingPlanId = getVariantSellingPlanId();
      sellingPlanInput.value = sellingPlanId || "";
    } else {
      sellingPlanInput.value = "";
    }
  }

  /* =====================================================
     PRICE CALCULATION (for event data)
     ===================================================== */

  /**
   * Get price data from the selected button's data attributes.
   * These are pre-calculated by Liquid.
   */
  function getSelectedButtonPriceData() {
    const selectedButton = section.querySelector(
      ".cwc-featured-product__option_button.selected",
    );

    if (!selectedButton) return null;

    return {
      price: parseInt(selectedButton.dataset.price) || 0,
      comparePrice: parseInt(selectedButton.dataset.compare) || 0,
      subscriptionPrice: selectedButton.dataset.subscriptionPrice
        ? parseInt(selectedButton.dataset.subscriptionPrice)
        : null,
      subscriptionCompare: selectedButton.dataset.subscriptionCompare
        ? parseInt(selectedButton.dataset.subscriptionCompare)
        : null,
      sellingPlanId: selectedButton.dataset.sellingPlanId || null,
    };
  }

  function calculatePrices(variant) {
    if (!variant) return null;

    // Get data from selected button
    const buttonData = getSelectedButtonPriceData();
    const subscriptionActive = isSubscriptionActive();

    // Compare price is ALWAYS the variant's compare_at_price
    const comparePrice = variant.compare_at_price || 0;

    // Determine display price based on subscription state
    let displayPrice = variant.price;
    let sellingPlanId = null;

    // Use subscription prices if subscription is active AND we have subscription data
    if (subscriptionActive && buttonData && buttonData.subscriptionPrice) {
      // Variant-level: use pre-calculated subscription price from button
      displayPrice = buttonData.subscriptionPrice;
      sellingPlanId = buttonData.sellingPlanId;
    } else if (
      subscriptionActive &&
      sellingPlanGroups.length > 0 &&
      !isVariantLevelSellingPlans()
    ) {
      // Product-level fallback: calculate from selling plan groups
      sellingPlanId = sellingPlanGroups[0]?.selling_plans?.[0]?.id;
      const sellingPlan = getSellingPlanById(sellingPlanId);

      if (sellingPlan && sellingPlan.price_adjustments?.[0]) {
        const adjustment = sellingPlan.price_adjustments[0];
        if (adjustment.value_type === "percentage") {
          displayPrice =
            variant.price - (variant.price * adjustment.value) / 100;
        } else if (adjustment.value_type === "fixed_amount") {
          displayPrice = variant.price - adjustment.value;
        }
      }
    }

    return {
      price: displayPrice,
      comparePrice: comparePrice,
      originalPrice: variant.price,
      savings: comparePrice > displayPrice ? comparePrice - displayPrice : 0,
      savingsPercent:
        comparePrice > displayPrice
          ? Math.round(((comparePrice - displayPrice) / comparePrice) * 100)
          : 0,
      sellingPlanId: sellingPlanId,
      isSubscription: subscriptionActive,
    };
  }

  /* =====================================================
     EVENT DISPATCHERS
     ===================================================== */
  function emitVariantChanged(variant) {
    const prices = calculatePrices(variant);

    section.dispatchEvent(
      new CustomEvent("cwc:variant-changed", {
        bubbles: true,
        detail: {
          sectionId,
          variant,
          prices,
          isSubscription: isSubscriptionActive(),
          sellingPlanId: getVariantSellingPlanId(),
          isVariantLevel: isVariantLevelSellingPlans(),
          sellingPlanGroups,
        },
      }),
    );
  }

  function emitSubscriptionChanged() {
    const variant = getCurrentVariant();
    const prices = calculatePrices(variant);

    section.dispatchEvent(
      new CustomEvent("cwc:subscription-changed", {
        bubbles: true,
        detail: {
          sectionId,
          variant,
          prices,
          isSubscription: isSubscriptionActive(),
          sellingPlanId: getVariantSellingPlanId(),
          isVariantLevel: isVariantLevelSellingPlans(),
          sellingPlanGroups,
        },
      }),
    );
  }

  function emitCartLoading() {
    section.dispatchEvent(
      new CustomEvent("cwc:cart-loading", {
        bubbles: true,
        detail: { sectionId },
      }),
    );
  }

  function emitCartSuccess(data) {
    section.dispatchEvent(
      new CustomEvent("cwc:cart-success", {
        bubbles: true,
        detail: { sectionId, ...data },
      }),
    );

    // Also dispatch global event for external listeners (e.g., cart drawer)
    document.dispatchEvent(
      new CustomEvent("cwc:item-added-to-cart", {
        detail: { sectionId, ...data },
      }),
    );
  }

  function emitCartError(error) {
    section.dispatchEvent(
      new CustomEvent("cwc:cart-error", {
        bubbles: true,
        detail: { sectionId, error },
      }),
    );
  }

  /* =====================================================
     UPDATE VARIANT (form inputs + emit event)
     ===================================================== */
  function updateVariant(variant = null) {
    if (!variant) {
      const selectedOptions = Array.from(optionInputs).map(
        (input) => input.value,
      );
      variant = findVariant(selectedOptions);
    }

    if (!variant) {
      console.warn("CWC Core: No variant found");
      return;
    }

    // Update form inputs
    variantIdInput.value = variant.id;
    updateSellingPlanInput();

    // Emit event for UI to handle display updates
    emitVariantChanged(variant);
  }

  /* =====================================================
     OPTION BUTTON HANDLERS
     ===================================================== */
  optionButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const optionIndex = this.dataset.optionIndex;
      const value = this.dataset.value;
      const variantId = this.dataset.variantId;

      // IMPORTANT: Update visual selection FIRST (before calculating prices)
      // This ensures getSelectedButtonPriceData() finds the correct button
      // Use closest() to find the buttons container (handles wrapper divs)
      const buttonsContainer = this.closest(
        ".cwc-featured-product__option_buttons",
      );
      if (buttonsContainer) {
        const siblings = buttonsContainer.querySelectorAll(
          ".cwc-featured-product__option_button",
        );
        siblings.forEach((sibling) => sibling.classList.remove("selected"));
      }
      this.classList.add("selected");

      // Update hidden option input
      const hiddenInput = section.querySelector(
        `input[data-option-index="${optionIndex}"]`,
      );
      if (hiddenInput) {
        hiddenInput.value = value;
      }

      // Update variant ID input
      if (variantId && variantIdInput) {
        variantIdInput.value = variantId;
      }

      // Find and update variant (this will emit events with correct prices)
      if (variantId) {
        const variant = findVariantById(variantId);
        if (variant) {
          updateVariant(variant);
        }
      } else {
        updateVariant();
      }
    });
  });

  /* =====================================================
     SUBSCRIPTION CHECKBOX HANDLER
     ===================================================== */
  if (autoRefillCheckbox) {
    autoRefillCheckbox.checked = true; // Default to checked

    autoRefillCheckbox.addEventListener("change", function () {
      // Update the selling plan input
      updateSellingPlanInput();

      // Get current variant and recalculate prices
      const variant = getCurrentVariant();
      if (variant) {
        // Emit subscription changed event with new price calculations
        emitSubscriptionChanged();

        // Also emit variant changed to ensure all UI updates
        emitVariantChanged(variant);
      }
    });
  }

  /* =====================================================
     BUNDLE MODE DETECTION
     ===================================================== */
  const isBundleMode =
    addToCartButton &&
    (addToCartButton.dataset.bundleVariant1 ||
      addToCartButton.dataset.bundleVariant2 ||
      addToCartButton.dataset.bundleVariant3 ||
      addToCartButton.dataset.bundleVariant4);

  /* =====================================================
     BUNDLE ADD TO CART
     ===================================================== */
  function handleBundleAddToCart() {
    if (!variantIdInput?.value) {
      console.warn("CWC Core: No main variant ID for bundle");
      return;
    }

    const mainVariantId = Number(variantIdInput.value);
    const skipCart = addToCartButton.dataset.skipCart === "true";

    if (!Number.isFinite(mainVariantId)) {
      console.warn("CWC Core: Invalid main variant ID");
      return;
    }

    const sellingPlanId = sellingPlanInput?.value
      ? Number(sellingPlanInput.value)
      : null;

    const items = [];

    // Collect bundle products
    [
      "bundleVariant1",
      "bundleVariant2",
      "bundleVariant3",
      "bundleVariant4",
    ].forEach((key) => {
      const value = addToCartButton.dataset[key];
      if (value && !isNaN(value)) {
        items.push({ id: Number(value), quantity: 1 });
      }
    });

    // Add main product with subscription
    const mainItem = {
      id: mainVariantId,
      quantity: 1,
      ...(sellingPlanId && { selling_plan: sellingPlanId }),
    };
    items.push(mainItem);

    if (!items.length) {
      console.warn("CWC Core: No items to add");
      return;
    }

    // Emit loading event
    emitCartLoading();

    fetch("/cart/add.js", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ items }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add bundle to cart");
        return res.json();
      })
      .then((data) => {
        if (skipCart) {
          window.location.href = "/checkout";
          return;
        }

        emitCartSuccess({
          items,
          isBundle: true,
          variant: getCurrentVariant(),
          sellingPlanId,
        });
      })
      .catch((err) => {
        console.error("CWC Core: Bundle add-to-cart error:", err);
        emitCartError(err);
      });
  }

  /* =====================================================
     STANDARD ADD TO CART
     ===================================================== */
  function handleStandardAddToCart() {
    const selectedVariantId = variantIdInput.value;
    const sellingPlanId = sellingPlanInput?.value || "";
    const variant = findVariantById(selectedVariantId);

    if (!variant) {
      console.warn("CWC Core: No variant found for ID:", selectedVariantId);
      return;
    }

    if (!variant.available) {
      alert("This product is currently unavailable.");
      return;
    }

    const data = {
      quantity: 1,
      id: selectedVariantId,
      ...(sellingPlanId && { selling_plan: sellingPlanId }),
    };

    // Emit loading event
    emitCartLoading();

    fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add item to cart");
        return res.json();
      })
      .then(() => {
        emitCartSuccess({
          variant,
          sellingPlanId,
          isBundle: false,
        });
      })
      .catch((error) => {
        console.error("CWC Core: Add-to-cart error:", error);
        emitCartError(error);
      });
  }

  /* =====================================================
     ATTACH ADD TO CART HANDLER
     ===================================================== */
  if (isBundleMode) {
    addToCartButton.addEventListener("click", handleBundleAddToCart);
    window.CWCBundleAddToCart = handleBundleAddToCart;
  } else {
    addToCartButton.addEventListener("click", handleStandardAddToCart);
  }

  /* =====================================================
     INITIALIZATION
     ===================================================== */

  // Find the initially selected button and its variant
  function getInitialVariant() {
    const selectedButton = section.querySelector(
      ".cwc-featured-product__option_button.selected",
    );

    if (selectedButton && selectedButton.dataset.variantId) {
      return findVariantById(selectedButton.dataset.variantId);
    }

    // Fallback: use variant ID from the hidden input
    if (variantIdInput && variantIdInput.value) {
      return findVariantById(variantIdInput.value);
    }

    // Last resort: first available variant
    return variants.find((v) => v.available) || variants[0];
  }

  // Initialize with the default selected variant
  const initialVariant = getInitialVariant();
  if (initialVariant) {
    // Ensure the hidden input has the correct variant ID
    if (variantIdInput) {
      variantIdInput.value = initialVariant.id;
    }

    // Update selling plan input based on initial subscription state
    updateSellingPlanInput();

    // Defer initial event to next tick to ensure UI listeners are set up
    // (UI module loads after Core, both use DOMContentLoaded)
    setTimeout(() => {
      emitVariantChanged(initialVariant);
    }, 0);
  }

  /* =====================================================
     EXPOSE API FOR EXTERNAL USE
     ===================================================== */
  window.CWCFeaturedProductCore = window.CWCFeaturedProductCore || {};
  window.CWCFeaturedProductCore[sectionId] = {
    updateVariant,
    getCurrentVariant,
    getVariantSellingPlanId,
    isSubscriptionActive,
    calculatePrices,
    findVariantById,
    variants,
    sellingPlanGroups,
  };
}
