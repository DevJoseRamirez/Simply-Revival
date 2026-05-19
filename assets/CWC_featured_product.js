/* =====================================================
   CWC FEATURED PRODUCT JAVASCRIPT
   =====================================================
   Purpose: Handles product variants, pricing, subscriptions, 
   add-to-cart functionality, and FAQ interactions for 
   featured product sections.
   ===================================================== */

/* =====================================================
   INITIALIZATION
   ===================================================== */
document.addEventListener("DOMContentLoaded", function () {
  // Find all featured product sections on the page
  const sections = document.querySelectorAll(".cwc-featured-product");

  // Initialize each section independently
  sections.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const productId = section.dataset.productId;
    const variants = JSON.parse(section.dataset.variants || "[]");
    const sellingPlanGroups = JSON.parse(section.dataset.sellingPlans || "[]");
    const savingsDisplayType = section.dataset.savingsDisplay || "dollar";

    initFeaturedProduct(
      section,
      sectionId,
      variants,
      sellingPlanGroups,
      savingsDisplayType,
    );
  });
});

/* =====================================================
   MAIN INITIALIZATION FUNCTION
   ===================================================== */
function initFeaturedProduct(
  section,
  sectionId,
  variants,
  sellingPlanGroups,
  savingsDisplayType = "dollar",
) {
  /* -----------------------------------------------------
     DOM ELEMENT REFERENCES
     ----------------------------------------------------- */
  // Form and core elements
  const form = section.querySelector(`#product-form-${sectionId}`);
  const variantIdInput = section.querySelector(".variant-id-input"); // <input name="id">
  const sellingPlanInput = section.querySelector(".selling-plan-input"); // <input name="selling_plan">

  // Product option controls (buttons and inputs)
  const optionButtons = section.querySelectorAll(
    ".cwc-featured-product__option_button",
  );
  const optionInputs = section.querySelectorAll(
    ".cwc-featured-product__option-input",
  ); // These are <input name="options[...]">

  // Cart and pricing elements
  const addToCartButton = section.querySelector(`#add-to-cart-${sectionId}`);
  const currentPriceEl = section.querySelector(`#current-price-${sectionId}`);
  const comparePriceEl = section.querySelector(`#compare-price-${sectionId}`);
  const saveAmountEl = section.querySelector(`#save-amount-${sectionId}`);

  // Subscription controls
  const autoRefillCheckbox = section.querySelector(`#auto-refill-${sectionId}`);

  /* -----------------------------------------------------
     SELLING PLAN INPUT SETUP
     ----------------------------------------------------- */
  // Create selling plan input if it doesn't exist (for subscriptions)
  if (!sellingPlanInput && form) {
    const newSellingPlanInput = document.createElement("input");
    newSellingPlanInput.type = "hidden";
    newSellingPlanInput.name = "selling_plan";
    newSellingPlanInput.className = "selling-plan-input";
    newSellingPlanInput.value = ""; // Empty by default
    form.appendChild(newSellingPlanInput);
    // console.log("Created selling plan input");
  }

  const finalSellingPlanInput =
    sellingPlanInput || form.querySelector(".selling-plan-input");

  /* -----------------------------------------------------
     VALIDATION
     ----------------------------------------------------- */
  // Ensure required elements exist before proceeding
  if (!form || !addToCartButton || !variantIdInput) {
    console.warn(
      "CWC Featured Product: Required elements not found for section",
      sectionId,
    );
    console.warn("Missing:", {
      form: !form,
      addToCartButton: !addToCartButton,
      variantIdInput: !variantIdInput,
    });
    return;
  }

  /* =====================================================
     UTILITY FUNCTIONS
     ===================================================== */

  /* -----------------------------------------------------
     VARIANT FINDING FUNCTIONS
     ----------------------------------------------------- */
  function findVariant(selectedOptions) {
    // Find variant by matching all selected options
    // Note: Not needed anymore - we'll get variant directly from button
    return variants.find((variant) => {
      return variant.options.every((option, index) => {
        return option === selectedOptions[index];
      });
    });
  }

  function findVariantById(variantId) {
    // Find variant by its ID
    return variants.find((variant) => variant.id == variantId);
  }

  /* -----------------------------------------------------
     SELLING PLAN MANAGEMENT
     ----------------------------------------------------- */
  /**
   * =====================================================
   * SELLING PLAN SCENARIOS
   * =====================================================
   *
   * SCENARIO 1: Product-level selling plan
   * - ONE selling plan applies to ALL variants
   * - sellingPlanGroups has data
   * - Variant buttons do NOT have data-selling-plan-id attribute
   * - Use: sellingPlanGroups[0].selling_plans[0].id for all variants
   *
   * SCENARIO 2: Variant-level selling plans
   * - EACH variant has its own selling plan
   * - Variants have selling_plan_allocations
   * - Variant buttons HAVE data-selling-plan-id attribute (unique per variant)
   * - Use: the specific selling plan ID from the selected button
   *
   * NOTE: Only ONE scenario exists at any given time per product
   * =====================================================
   */

  /**
   * Determine if we're using variant-level selling plans
   * (at least one button has data-selling-plan-id)
   * @returns {boolean}
   */
  function isVariantLevelSellingPlans() {
    const buttonWithSellingPlan = section.querySelector(
      ".cwc-featured-product__option_button[data-selling-plan-id]",
    );
    return !!buttonWithSellingPlan;
  }

  /**
   * Get the selling plan ID for the currently selected variant.
   *
   * SCENARIO 1 (Product-level): Returns product's first selling plan ID
   * SCENARIO 2 (Variant-level): Returns selected button's selling plan ID
   *
   * @returns {string|null} The selling plan ID or null
   */
  function getVariantSellingPlanId() {
    // Check if we're in variant-level mode
    if (isVariantLevelSellingPlans()) {
      // SCENARIO 2: Get from selected button's data attribute
      const selectedButton = section.querySelector(
        ".cwc-featured-product__option_button.selected",
      );

      if (selectedButton && selectedButton.dataset.sellingPlanId) {
        return selectedButton.dataset.sellingPlanId;
      }

      // Variant-level mode but no selection yet - return null
      return null;
    }

    // SCENARIO 1: Product-level selling plan
    if (sellingPlanGroups.length > 0) {
      return sellingPlanGroups[0]?.selling_plans?.[0]?.id || null;
    }

    return null;
  }

  /**
   * Check if subscription is available for current product/variant
   * @returns {boolean}
   */
  function hasSellingPlanAvailable() {
    // Variant-level: check if any buttons have selling plan
    if (isVariantLevelSellingPlans()) {
      const selectedButton = section.querySelector(
        ".cwc-featured-product__option_button.selected",
      );
      return !!(selectedButton && selectedButton.dataset.sellingPlanId);
    }

    // Product-level: check if product has selling plans
    return sellingPlanGroups.length > 0;
  }

  /**
   * Get selling plan details by ID (for price calculations)
   * Works for both scenarios since selling plan details are in sellingPlanGroups
   * @param {string} sellingPlanId
   * @returns {object|null}
   */
  function getSellingPlanById(sellingPlanId) {
    if (!sellingPlanId) return null;

    for (const group of sellingPlanGroups) {
      const found = group.selling_plans?.find(
        (plan) => String(plan.id) === String(sellingPlanId),
      );
      if (found) {
        return found;
      }
    }
    return null;
  }

  function updateSellingPlan() {
    // Update the selling plan input based on subscription checkbox state
    const isAutoRefill = autoRefillCheckbox && autoRefillCheckbox.checked;

    if (isAutoRefill && hasSellingPlanAvailable()) {
      const sellingPlanId = getVariantSellingPlanId();
      if (sellingPlanId && finalSellingPlanInput) {
        finalSellingPlanInput.value = sellingPlanId;
        // console.log("Set selling plan input to:", sellingPlanId);
      } else {
        // No selling plan available for this variant
        if (finalSellingPlanInput) {
          finalSellingPlanInput.value = "";
        }
      }
    } else {
      if (finalSellingPlanInput) {
        finalSellingPlanInput.value = "";
        // console.log("Cleared selling plan input");
      }
    }
  }

  /* -----------------------------------------------------
     PRICE FORMATTING
     ----------------------------------------------------- */
  function formatPrice(priceInCents, currencyCode = "USD") {
    // Convert cents to formatted currency string
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(priceInCents / 100);
  }

  /**
   * Format the savings amount as either a dollar value or a percentage.
   * Display type is controlled by the section's `data-savings-display`
   * attribute (read into `savingsDisplayType` at section init).
   *
   *   savingsDisplayType === "percentage"  →  "25%"
   *   savingsDisplayType === "dollar"       →  "$20.00"  (default)
   *
   * @param {number} comparePriceCents - Compare/original price in cents
   * @param {number} currentPriceCents - Display/current price in cents
   * @returns {string} Formatted savings value (no "Save" label)
   */
  function formatSavings(comparePriceCents, currentPriceCents) {
    const savings = comparePriceCents - currentPriceCents;

    console.log(savings);
    console.log("savings");
    if (savings <= 0 || !comparePriceCents) return "";

    if (savingsDisplayType === "percentage") {
      const pct = Math.round((savings / comparePriceCents) * 100);
      return `${pct}%`;
    }
    // Default — dollar amount
    return formatPrice(savings);
  }

  /* -----------------------------------------------------
     BUTTON PRICE UPDATES
     ----------------------------------------------------- */
  function updateAllButtonPrices(isAutoRefill) {
    // Get all option buttons and update their prices based on subscription state
    const allButtons = section.querySelectorAll(
      ".cwc-featured-product__option_button",
    );

    const usingVariantLevel = isVariantLevelSellingPlans();

    allButtons.forEach((button) => {
      const variantId = button.getAttribute("data-variant-id");
      const originalPrice = parseInt(button.getAttribute("data-price"));
      const originalComparePrice = parseInt(
        button.getAttribute("data-compare"),
      );

      if (!variantId || !originalPrice) return;

      let displayPrice = originalPrice;
      let displayComparePrice = originalComparePrice;

      // Apply subscription discount if enabled
      if (isAutoRefill) {
        let sellingPlan = null;

        if (usingVariantLevel) {
          // SCENARIO 2: Variant-level - get this button's specific selling plan
          const buttonSellingPlanId = button.dataset.sellingPlanId;
          if (buttonSellingPlanId) {
            sellingPlan = getSellingPlanById(buttonSellingPlanId);
          }
          // If this variant has no selling plan, no discount applied
        } else {
          // SCENARIO 1: Product-level - same selling plan for all
          sellingPlan = sellingPlanGroups[0]?.selling_plans?.[0] || null;
        }

        // Apply discount if we found a selling plan
        if (sellingPlan && sellingPlan.price_adjustments?.[0]) {
          const adjustment = sellingPlan.price_adjustments[0];
          if (adjustment.value_type === "percentage") {
            displayPrice =
              originalPrice - (originalPrice * adjustment.value) / 100;
          } else if (adjustment.value_type === "fixed_amount") {
            displayPrice = originalPrice - adjustment.value;
          }
        }
      }

      // Update button price elements
      const priceEl = button.querySelector(
        ".cwc-featured-product__option_button_price",
      );
      const compareEl = button.querySelector(
        ".cwc-featured-product__option_button_compare_price",
      );
      const saveEl = button.querySelector(
        ".cwc-featured-product__option_button_save_perc",
      );

      if (priceEl) {
        priceEl.textContent = formatPrice(displayPrice);
      }

      // Show/hide compare price and savings
      if (displayComparePrice && displayComparePrice > displayPrice) {
        if (compareEl) {
          compareEl.textContent = formatPrice(displayComparePrice);
          compareEl.style.display = "inline";
        }
        if (saveEl) {
          const savingsText = formatSavings(displayComparePrice, displayPrice);
          saveEl.textContent = `You Save ${savingsText}`;
          saveEl.style.display = "inline";
        }
      } else {
        if (compareEl) compareEl.style.display = "none";
        if (saveEl) saveEl.style.display = "none";
      }
    });

    // console.log("Updated all button prices, subscription mode:", isAutoRefill, "variant-level:", usingVariantLevel);
  }

  /* =====================================================
     MAIN UPDATE FUNCTION
     ===================================================== */
  function updateVariant(variant = null) {
    // Main function to update all UI elements when variant changes

    // If no variant passed, try to find it from selected options
    if (!variant) {
      const selectedOptions = Array.from(optionInputs).map(
        (input) => input.value,
      );
      variant = findVariant(selectedOptions);
    }

    const isAutoRefill = autoRefillCheckbox && autoRefillCheckbox.checked;

    if (!variant) {
      console.warn("No variant provided to updateVariant");
      return;
    }

    // console.log("Updating to variant:", variant.id, "Price:", variant.price);

    /* -----------------------------------------------------
       UPDATE FORM INPUTS
       ----------------------------------------------------- */
    // Update hidden input
    if (variantIdInput) {
      variantIdInput.value = variant.id;
    }

    // Update selling plan input
    updateSellingPlan();

    /* -----------------------------------------------------
       CALCULATE DISPLAY PRICES
       ----------------------------------------------------- */
    // Determine prices (subscription vs one-time)
    let displayPrice = variant.price;
    let displayComparePrice = variant.compare_at_price;

    if (isAutoRefill && hasSellingPlanAvailable()) {
      // Get the correct selling plan ID for this variant/product
      const sellingPlanId = getVariantSellingPlanId();
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

    /* -----------------------------------------------------
       UPDATE MAIN PRICE DISPLAY
       ----------------------------------------------------- */
    const priceElement =
      currentPriceEl ||
      section.querySelector(".cwc-featured-product__price-current") ||
      section.querySelector(`#current-price-${sectionId}`);

    if (priceElement) {
      priceElement.textContent = formatPrice(displayPrice);
      // console.log("Updated price element to:", formatPrice(displayPrice));
    }

    /* -----------------------------------------------------
       UPDATE BUTTON PRICE DISPLAY
       ----------------------------------------------------- */
    const buttonCurrentPriceEl = section.querySelector(
      `#current-price-button-${sectionId}`,
    );
    const buttonComparePriceEl = section.querySelector(
      `#compare-price-button-${sectionId}`,
    );

    if (buttonCurrentPriceEl) {
      buttonCurrentPriceEl.textContent = formatPrice(displayPrice);
    }

    if (displayComparePrice && displayComparePrice > displayPrice) {
      if (buttonComparePriceEl) {
        buttonComparePriceEl.textContent = formatPrice(displayComparePrice);
        buttonComparePriceEl.style.display = "inline";
      }
    } else {
      if (buttonComparePriceEl) buttonComparePriceEl.style.display = "none";
    }

    /* -----------------------------------------------------
       UPDATE ALL OPTION BUTTON PRICES
       ----------------------------------------------------- */
    // Update ALL option button prices based on subscription state
    updateAllButtonPrices(isAutoRefill);

    /* -----------------------------------------------------
       UPDATE ADD TO CART BUTTON PRICE
       ----------------------------------------------------- */
    const buttonMainPrice = addToCartButton
      ? addToCartButton.querySelector(".main-price")
      : null;
    if (buttonMainPrice) {
      buttonMainPrice.textContent = formatPrice(displayPrice);
    }

    /* -----------------------------------------------------
       UPDATE COMPARE PRICE AND SAVINGS DISPLAY
       ----------------------------------------------------- */
    const compareElement =
      comparePriceEl ||
      section.querySelector(".cwc-featured-product__price-compare") ||
      section.querySelector(`#compare-price-${sectionId}`);

    const saveElement =
      saveAmountEl ||
      section.querySelector(".cwc-featured-product__price-save") ||
      section.querySelector(`#save-amount-${sectionId}`);

    if (displayComparePrice && displayComparePrice > displayPrice) {
      if (compareElement) {
        compareElement.textContent = formatPrice(displayComparePrice);
        compareElement.style.display = "inline";
      }
      if (saveElement) {
        // Target the dedicated inner amount span — leaves the static "Save"
        // label markup intact instead of rebuilding the parent's innerHTML.
        // Falls back to writing to the parent for older markup that doesn't
        // have a dedicated amount span.
        const saveAmountEl = saveElement.querySelector(
          ".cwc-featured-product__price-save-amount",
        );
        const savingsText = formatSavings(displayComparePrice, displayPrice);

        if (saveAmountEl) {
          saveAmountEl.textContent = savingsText;
        } else {
          // Legacy fallback — preserves prior behavior
          saveElement.innerHTML =
            "<span>Save</span> " + `<span>${savingsText}</span>`;
        }
        saveElement.style.display = "flex";
      }

      const buttonComparePrice = addToCartButton
        ? addToCartButton.querySelector(".compare-price")
        : null;
      if (buttonComparePrice) {
        buttonComparePrice.textContent = formatPrice(displayComparePrice);
        buttonComparePrice.style.display = "inline";
      }
    } else {
      if (compareElement) compareElement.style.display = "none";
      if (saveElement) saveElement.style.display = "none";
      const buttonComparePrice = addToCartButton
        ? addToCartButton.querySelector(".compare-price")
        : null;
      if (buttonComparePrice) buttonComparePrice.style.display = "none";
    }

    /* -----------------------------------------------------
       UPDATE BUTTON AVAILABILITY
       ----------------------------------------------------- */
    if (variant.available) {
      if (addToCartButton) addToCartButton.disabled = false;
      const buttonText = addToCartButton
        ? addToCartButton.querySelector(".cwc-button-text")
        : null;
      if (buttonText) {
        buttonText.textContent =
          buttonText.dataset.originalText || "Add to Cart";
      }
    } else {
      if (addToCartButton) addToCartButton.disabled = true;
      const buttonText = addToCartButton
        ? addToCartButton.querySelector(".cwc-button-text")
        : null;
      if (buttonText) {
        buttonText.textContent = "Sold Out";
      }
    }
  }

  /* =====================================================
     EVENT LISTENERS SETUP
     ===================================================== */

  /* -----------------------------------------------------
     OPTION BUTTON CLICK HANDLERS
     ----------------------------------------------------- */
  // console.log(
  //   "CWC Debug - Setting up option button listeners:",
  //   optionButtons.length
  // );

  optionButtons.forEach((button, index) => {
    button.addEventListener("click", function () {
      // console.log("CWC Debug - Button clicked!");

      const optionIndex = this.getAttribute("data-option-index");
      const value = this.getAttribute("data-value");
      const variantId = this.getAttribute("data-variant-id");

      // console.log("Button data:", { optionIndex, value, variantId });

      // Update visual selection state
      const siblings = this.parentNode.querySelectorAll(
        ".cwc-featured-product__option_button",
      );
      siblings.forEach((sibling) => sibling.classList.remove("selected"));
      this.classList.add("selected");

      // Update the option's hidden input (for form submission)
      const hiddenInput = section.querySelector(
        `input[data-option-index="${optionIndex}"]`,
      );
      if (hiddenInput) {
        // console.log(
        //   "Updating option input from",
        //   hiddenInput.value,
        //   "to",
        //   value
        // );
        hiddenInput.value = value;
      }

      // IMPORTANT: Update the main variant ID hidden input
      if (variantId && variantIdInput) {
        // console.log(
        //   "Updating main variant input from",
        //   variantIdInput.value,
        //   "to",
        //   variantId
        // );
        variantIdInput.value = variantId;
      }

      // Get variant by ID and update prices
      if (variantId) {
        const variant = findVariantById(variantId);
        if (variant) {
          // console.log("Found variant by ID:", variant);
          updateVariant(variant);
        } else {
          console.warn("Variant not found for ID:", variantId);
        }
      } else {
        console.warn("No variant ID on button");
        updateVariant(); // Fallback to old method
      }
    });
  });

  /* -----------------------------------------------------
     SUBSCRIPTION CHECKBOX HANDLER
     ----------------------------------------------------- */
  if (autoRefillCheckbox) {
    // Set checkbox as initially checked
    autoRefillCheckbox.checked = true;

    // Add visual styling for initially checked state
    const checkboxIcon = section.querySelector(".cwc-checkbox-icon");
    if (checkboxIcon) {
      checkboxIcon.classList.add("initially-checked");
    }

    autoRefillCheckbox.addEventListener("change", function () {
      // console.log("Subscription checkbox changed:", this.checked);
      updateVariant(); // Recalculate all prices based on new subscription state
    });
  }

  /* =====================================================
   BUNDLE & STANDARD ADD TO CART - UPDATED SECTION ONLY
   =====================================================
   Replace the add-to-cart section in CWC_product_template.js
   ===================================================== */

  /* -----------------------------------------------------
     BUNDLE MODE DETECTION
     ----------------------------------------------------- */
  const isBundleMode =
    addToCartButton &&
    (addToCartButton.dataset.bundleVariant1 ||
      addToCartButton.dataset.bundleVariant2 ||
      addToCartButton.dataset.bundleVariant3 ||
      addToCartButton.dataset.bundleVariant4);

  // console.log("Bundle mode detected:", isBundleMode);
  if (isBundleMode) {
    // console.log("Bundle variants:", {
    //   v1: addToCartButton.dataset.bundleVariant1,
    //   v2: addToCartButton.dataset.bundleVariant2,
    //   v3: addToCartButton.dataset.bundleVariant3,
    //   v4: addToCartButton.dataset.bundleVariant4,
    // });
  }

  /* =====================================================
     BUNDLE ADD TO CART FUNCTIONALITY
     ===================================================== */
  function handleBundleAddToCart() {
    console.log("=== Bundle Add to Cart Started ===");

    if (!variantIdInput || !variantIdInput.value) {
      console.warn("Bundle: No main variant ID");
      return;
    }

    const mainVariantId = Number(variantIdInput.value);
    const skipCart = addToCartButton.dataset.skipCart === "true";

    // console.log("Main variant ID:", mainVariantId);
    // console.log("Skip cart mode:", skipCart);

    if (!Number.isFinite(mainVariantId)) {
      console.warn("Bundle: Invalid main variant ID:", variantIdInput.value);
      return;
    }

    // Get selling plan ID
    const sellingPlanId =
      finalSellingPlanInput && finalSellingPlanInput.value
        ? Number(finalSellingPlanInput.value)
        : null;

    // console.log("Selling plan ID:", sellingPlanId);

    // Enforce subscription-only for bundle (optional - remove if not needed)
    // if (!Number.isFinite(sellingPlanId)) {
    //   console.warn("Bundle: No selling plan selected");
    //   alert("Please select the subscription option to add this bundle.");
    //   return;
    // }

    const items = [];

    // Collect bundle products from data attributes
    // Check for bundleVariant1, bundleVariant2, bundleVariant3, bundleVariant4
    [
      "bundleVariant1",
      "bundleVariant2",
      "bundleVariant3",
      "bundleVariant4",
    ].forEach((key) => {
      const value = addToCartButton.dataset[key];
      if (value && !isNaN(value)) {
        items.push({
          id: Number(value),
          quantity: 1,
        });
        // console.log(`Added ${key}:`, value);
      }
    });

    // Add main product with subscription
    const mainItem = {
      id: mainVariantId,
      quantity: 1,
      selling_plan: sellingPlanId,
    };

    items.push(mainItem);
    // console.log("Main product added:", mainItem);

    // console.log("Final items payload:", items);

    if (!items.length) {
      console.warn("Bundle: No items to add to cart");
      return;
    }

    // Show loading state
    addToCartButton.disabled = true;
    addToCartButton.classList.add("loading_hk");

    // Send to Shopify cart API
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
        // console.log("Bundle added successfully:", data);

        const btnText = addToCartButton.querySelector(".cwc-button-text");
        const originalText =
          btnText?.dataset.originalText || "Add Bundle to Cart";

        // If skip-cart mode, redirect to checkout
        if (skipCart) {
          // console.log("Redirecting to checkout...");
          window.location.href = "/checkout";
          return;
        }

        // Show success message
        if (btnText) {
          if (!btnText.dataset.originalText) {
            btnText.dataset.originalText = btnText.textContent;
          }
          btnText.textContent = "Bundle Added!";
          setTimeout(() => {
            btnText.textContent = originalText;
          }, 2000);
        }

        // Dispatch custom event
        document.dispatchEvent(
          new CustomEvent("cwc:item-added-to-cart", {
            detail: {
              items,
              sectionId,
              isBundle: true,
            },
          }),
        );
      })
      .catch((err) => {
        console.error("Bundle add-to-cart error:", err);
        alert(
          "There was an issue adding the bundle to your cart. Please try again.",
        );
      })
      .finally(() => {
        addToCartButton.disabled = false;
        addToCartButton.classList.remove("loading_hk");
      });
  }

  /* =====================================================
     STANDARD ADD TO CART FUNCTIONALITY
     ===================================================== */
  function handleStandardAddToCart() {
    // console.log("=== Standard Add to Cart Started ===");

    const selectedVariantId = variantIdInput.value;
    const sellingPlanId = finalSellingPlanInput
      ? finalSellingPlanInput.value
      : "";
    const variant = findVariantById(selectedVariantId);

    // console.log("Add to cart clicked:", {
    //   selectedVariantId,
    //   sellingPlanId,
    //   variant: variant
    //     ? { id: variant.id, available: variant.available }
    //     : null,
    // });

    // Validation
    if (!variant) {
      console.warn("No variant found for ID:", selectedVariantId);
      return;
    }

    if (!variant.available) {
      alert("This product is currently unavailable.");
      return;
    }

    // Show loading state
    addToCartButton.classList.add("loading_hk");

    // Build cart data
    const data = {
      quantity: 1,
      id: selectedVariantId,
    };

    // Add selling plan if subscription is selected
    if (sellingPlanId) {
      data.selling_plan = sellingPlanId;
      // console.log("Adding with selling plan:", sellingPlanId);
    } else {
      // console.log("Adding as regular purchase (no selling plan)");
    }

    // Make the request to Shopify's cart API
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
        addToCartButton.classList.remove("loading_hk");

        // Show success message
        const buttonText = addToCartButton.querySelector(".cwc-button-text");
        const originalText = buttonText?.dataset.originalText || "Add to Cart";
        if (buttonText) {
          buttonText.textContent = "Added to Cart!";
          setTimeout(() => {
            buttonText.textContent = originalText;
          }, 2000);
        }

        // console.log("Item added to cart:", data);

        // Dispatch custom event for other scripts to listen
        document.dispatchEvent(
          new CustomEvent("cwc:item-added-to-cart", {
            detail: { variant, sellingPlanId, sectionId },
          }),
        );
      })
      .catch((error) => {
        console.error("Error:", error);
        addToCartButton.classList.remove("loading_hk");
        alert(
          "An error occurred while processing your request. Please try again.",
        );
      });
  }

  /* -----------------------------------------------------
     ADD TO CART BUTTON SETUP & EVENT LISTENER
     ----------------------------------------------------- */
  // Store original button text for later use
  const buttonText = addToCartButton.querySelector(".cwc-button-text");
  if (buttonText && !buttonText.dataset.originalText) {
    buttonText.dataset.originalText = buttonText.textContent;
  }

  // Attach the correct handler based on mode
  if (isBundleMode) {
    // console.log("Attaching BUNDLE add-to-cart handler");
    addToCartButton.addEventListener("click", handleBundleAddToCart);

    // Expose global handler for external triggers (like CWC_bundle_included section)
    window.CWCBundleAddToCart = handleBundleAddToCart;
  } else {
    // console.log("Attaching STANDARD add-to-cart handler");
    addToCartButton.addEventListener("click", handleStandardAddToCart);
  }

  /* =====================================================
     FAQ FUNCTIONALITY
     ===================================================== */
  function initFAQBlocks() {
    // Initialize FAQ accordion functionality
    const faqItems = section.querySelectorAll(".cwc-featured-product__faq");

    // console.log(`Section ${sectionId}: Found ${faqItems.length} FAQ items`);

    faqItems.forEach((item, index) => {
      const question = item.querySelector(
        ".cwc-featured-product__faq-question",
      );
      const answer = item.querySelector(".cwc-featured-product__faq-answer");
      const icon = item.querySelector(".cwc-featured-product__faq-icon");

      if (!question || !answer) return;

      question.addEventListener("click", () => {
        // console.log(`Clicked FAQ ${index} in section ${sectionId}`);
        // console.log(
        //   `Current state: ${
        //     item.classList.contains("active") ? "active" : "inactive"
        //   }`
        // );

        const isCurrentlyActive = item.classList.contains("active");

        // Close all others first - BUT ONLY IN THIS SECTION
        faqItems.forEach((other, otherIndex) => {
          if (other !== item && other.classList.contains("active")) {
            // console.log(`Closing FAQ ${otherIndex} in section ${sectionId}`);
            const otherAnswer = other.querySelector(
              ".cwc-featured-product__faq-answer",
            );
            const otherIcon = other.querySelector(
              ".cwc-featured-product__faq-icon",
            );

            // Start closing animation
            otherAnswer.style.maxHeight = otherAnswer.scrollHeight + "px";
            setTimeout(() => {
              otherAnswer.style.maxHeight = "0";
              other.classList.remove("active");
              if (otherIcon) otherIcon.textContent = "+";
            }, 10);
          }
        });

        // Small delay to let others start closing, then toggle this one
        setTimeout(() => {
          if (isCurrentlyActive) {
            // console.log(`Closing clicked FAQ ${index}`);
            // Close this FAQ
            answer.style.maxHeight = answer.scrollHeight + "px";
            setTimeout(() => {
              answer.style.maxHeight = "0";
              item.classList.remove("active");
              if (icon) icon.textContent = "+";
            }, 10);
          } else {
            // console.log(`Opening clicked FAQ ${index}`);
            // Open this FAQ
            item.classList.add("active");
            if (icon) icon.textContent = "−";
            answer.style.maxHeight = answer.scrollHeight + "px";

            // After transition, allow natural height growth
            answer.addEventListener(
              "transitionend",
              () => {
                if (item.classList.contains("active")) {
                  answer.style.maxHeight = "none";
                }
              },
              { once: true },
            );
          }
        }, 50);
      });
    });
  }

  /* =====================================================
     INITIALIZATION COMPLETION
     ===================================================== */

  // Initialize FAQ blocks
  initFAQBlocks(section);

  // Initialize with current selection
  updateVariant();

  // Expose for testing/debugging
  window.CWCFeaturedProduct = window.CWCFeaturedProduct || {};
  window.CWCFeaturedProduct.testUpdate = function (testSection) {
    if (testSection === section) {
      // console.log("Testing updateVariant for section:", sectionId);
      updateVariant();
    }
  };
}
