console.log("prouduct template");
document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll(".cwc_product-template");

  sections.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const productId = section.dataset.productId;
    const variants = JSON.parse(section.dataset.variants || "[]");
    const sellingPlanGroups = JSON.parse(section.dataset.sellingPlans || "[]");

    initProductTemplate(section, sectionId, variants, sellingPlanGroups);
  });
});

function initProductTemplate(section, sectionId, variants, sellingPlanGroups) {
  // Get all the elements using the section context and sectionId
  const form = section.querySelector(`#product-form-${sectionId}`);
  const variantIdInput = section.querySelector(".variant-id-input");
  const sellingPlanInput = section.querySelector(".selling-plan-input");
  const optionButtons = section.querySelectorAll(
    ".cwc_product-template__option_button"
  );
  const optionInputs = section.querySelectorAll(
    ".cwc_product-template__option-input"
  );
  const addToCartButton = section.querySelector(`#add-to-cart-${sectionId}`);
  const currentPriceEl = section.querySelector(`#current-price-${sectionId}`);
  const comparePriceEl = section.querySelector(`#compare-price-${sectionId}`);
  const saveAmountEl = section.querySelector(`#save-amount-${sectionId}`);
  const autoRefillCheckbox = section.querySelector(`#auto-refill-${sectionId}`);

  // Create selling plan input if it doesn't exist
  if (!sellingPlanInput && form) {
    const newSellingPlanInput = document.createElement("input");
    newSellingPlanInput.type = "hidden";
    newSellingPlanInput.name = "selling_plan";
    newSellingPlanInput.className = "selling-plan-input";
    newSellingPlanInput.value = "";
    form.appendChild(newSellingPlanInput);
    console.log("Created selling plan input");
  }

  const finalSellingPlanInput =
    sellingPlanInput || form.querySelector(".selling-plan-input");

  // Validate required elements exist
  if (!form || !addToCartButton || !variantIdInput) {
    console.warn(
      "CWC Product Template: Required elements not found for section",
      sectionId
    );
    console.warn("Missing:", {
      form: !form,
      addToCartButton: !addToCartButton,
      variantIdInput: !variantIdInput,
    });
    return;
  }

  function findVariant(selectedOptions) {
    return variants.find((variant) => {
      return variant.options.every((option, index) => {
        return option === selectedOptions[index];
      });
    });
  }

  function findVariantById(variantId) {
    return variants.find((variant) => variant.id == variantId);
  }

  function updateSellingPlan() {
    const isAutoRefill = autoRefillCheckbox && autoRefillCheckbox.checked;

    if (isAutoRefill && sellingPlanGroups.length > 0) {
      const sellingPlanId = sellingPlanGroups[0]?.selling_plans?.[0]?.id;
      if (sellingPlanId && finalSellingPlanInput) {
        finalSellingPlanInput.value = sellingPlanId;
        console.log("Set selling plan input to:", sellingPlanId);
      }
    } else {
      if (finalSellingPlanInput) {
        finalSellingPlanInput.value = "";
        console.log("Cleared selling plan input");
      }
    }
  }

  function updateAllButtonPrices(isAutoRefill) {
    const allButtons = section.querySelectorAll(
      ".cwc_product-template__option_button"
    );

    allButtons.forEach((button) => {
      const variantId = button.getAttribute("data-variant-id");
      const originalPrice = parseInt(button.getAttribute("data-price"));
      const originalComparePrice = parseInt(
        button.getAttribute("data-compare")
      );

      if (!variantId || !originalPrice) return;

      let displayPrice = originalPrice;
      let displayComparePrice = originalComparePrice;

      if (isAutoRefill && sellingPlanGroups.length > 0) {
        const sellingPlan = sellingPlanGroups[0]?.selling_plans?.[0];
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

      const priceEl = button.querySelector(
        ".cwc_product-template__option_button_price"
      );
      const compareEl = button.querySelector(
        ".cwc_product-template__option_button_compare_price"
      );
      const saveEl = button.querySelector(
        ".cwc_product-template__option_button_save_perc"
      );

      if (priceEl) {
        priceEl.textContent = formatPrice(displayPrice);
      }

      if (displayComparePrice && displayComparePrice > displayPrice) {
        if (compareEl) {
          compareEl.textContent = formatPrice(displayComparePrice);
          compareEl.style.display = "inline";
        }
        if (saveEl) {
          const savings = displayComparePrice - displayPrice;
          const savingsPct = Math.round((savings / displayComparePrice) * 100);
          saveEl.textContent = `You Save ${savingsPct}%`;
          saveEl.style.display = "inline";
        }
      } else {
        if (compareEl) compareEl.style.display = "none";
        if (saveEl) saveEl.style.display = "none";
      }
    });

    console.log("Updated all button prices, subscription mode:", isAutoRefill);
  }

  function formatPrice(priceInCents, currencyCode = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(priceInCents / 100);
  }

  function updateVariant(variant = null) {
    if (!variant) {
      const selectedOptions = Array.from(optionInputs).map(
        (input) => input.value
      );
      variant = findVariant(selectedOptions);
    }

    const isAutoRefill = autoRefillCheckbox && autoRefillCheckbox.checked;

    if (variant) {
      console.log("Updating to variant:", variant.id, "Price:", variant.price);

      if (variantIdInput) {
        variantIdInput.value = variant.id;
      }

      updateSellingPlan();

      let displayPrice = variant.price;
      let displayComparePrice = variant.compare_at_price;

      if (isAutoRefill && sellingPlanGroups.length > 0) {
        const sellingPlan = sellingPlanGroups[0]?.selling_plans?.[0];
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

      // Update main price display
      const priceElement =
        currentPriceEl ||
        section.querySelector(".cwc_product-template__price-current") ||
        section.querySelector(`#current-price-${sectionId}`);
      if (priceElement) {
        priceElement.textContent = formatPrice(displayPrice);
        console.log("Updated price element to:", formatPrice(displayPrice));
      }

      // Update button price display
      const buttonCurrentPriceEl = section.querySelector(
        `#current-price-button-${sectionId}`
      );
      const buttonComparePriceEl = section.querySelector(
        `#compare-price-button-${sectionId}`
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

      updateAllButtonPrices(isAutoRefill);

      // Update compare price and savings in main display
      const compareElement =
        comparePriceEl ||
        section.querySelector(".cwc_product-template__price-compare") ||
        section.querySelector(`#compare-price-${sectionId}`);
      const saveElement =
        saveAmountEl ||
        section.querySelector(".cwc_product-template__price-save") ||
        section.querySelector(`#save-amount-${sectionId}`);

      if (displayComparePrice && displayComparePrice > displayPrice) {
        if (compareElement) {
          compareElement.textContent = formatPrice(displayComparePrice);
          compareElement.style.display = "inline";
        }
        if (saveElement) {
          const savings = displayComparePrice - displayPrice;
          saveElement.innerHTML =
            "<span>Save</span> " + `<span>${formatPrice(savings)}</span>`;
          saveElement.style.display = "flex";
        }
      } else {
        if (compareElement) compareElement.style.display = "none";
        if (saveElement) saveElement.style.display = "none";
      }

      // Update button availability
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
    } else {
      console.warn("No variant provided to updateVariant");
    }
  }

  // Add event listeners to option buttons
  console.log(
    "CWC Debug - Setting up option button listeners:",
    optionButtons.length
  );

  optionButtons.forEach((button, index) => {
    button.addEventListener("click", function () {
      console.log("CWC Debug - Button clicked!");

      const optionIndex = this.getAttribute("data-option-index");
      const value = this.getAttribute("data-value");