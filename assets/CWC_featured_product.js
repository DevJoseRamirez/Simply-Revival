document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll(".cwc-featured-product");

  sections.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const productId = section.dataset.productId;
    const variants = JSON.parse(section.dataset.variants || "[]");
    const sellingPlanGroups = JSON.parse(section.dataset.sellingPlans || "[]");

    initFeaturedProduct(section, sectionId, variants, sellingPlanGroups);
  });
});

function initFeaturedProduct(section, sectionId, variants, sellingPlanGroups) {
  // Get all the elements using the section context and sectionId
  const form = section.querySelector(`#product-form-${sectionId}`);
  const variantIdInput = section.querySelector(".variant-id-input"); // <input name="id">
  const sellingPlanInput = section.querySelector(".selling-plan-input"); // <input name="selling_plan">
  const optionButtons = section.querySelectorAll(
    ".cwc-featured-product__option_button"
  );
  const optionInputs = section.querySelectorAll(
    ".cwc-featured-product__option-input"
  ); // These are <input name="options[...]">
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
    newSellingPlanInput.value = ""; // Empty by default
    form.appendChild(newSellingPlanInput);
    console.log("Created selling plan input");
  }

  const finalSellingPlanInput =
    sellingPlanInput || form.querySelector(".selling-plan-input");

  // Validate required elements exist
  if (!form || !addToCartButton || !variantIdInput) {
    console.warn(
      "CWC Featured Product: Required elements not found for section",
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
    // Not needed anymore - we'll get variant directly from button
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
    // Get all option buttons and update their prices based on subscription state
    const allButtons = section.querySelectorAll(
      ".cwc-featured-product__option_button"
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

      // Apply subscription discount if needed
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

      // Update button price elements
      const priceEl = button.querySelector(
        ".cwc-featured-product__option_button_price"
      );
      const compareEl = button.querySelector(
        ".cwc-featured-product__option_button_compare_price"
      );
      const saveEl = button.querySelector(
        ".cwc-featured-product__option_button_save_perc"
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
          // saveEl.textContent = `You Save ${formatPrice(savings)} (${savingsPct}%)`;
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
    // If no variant passed, try to find it from selected options
    if (!variant) {
      const selectedOptions = Array.from(optionInputs).map(
        (input) => input.value
      );
      variant = findVariant(selectedOptions);
    }

    const isAutoRefill = autoRefillCheckbox && autoRefillCheckbox.checked;

    if (variant) {
      console.log("Updating to variant:", variant.id, "Price:", variant.price);

      // Update hidden input
      if (variantIdInput) {
        variantIdInput.value = variant.id;
      }

      // Update selling plan input
      updateSellingPlan();

      // Determine prices (subscription vs one-time)
      let displayPrice = variant.price;
      let displayComparePrice = variant.compare_at_price;

      if (isAutoRefill && sellingPlanGroups.length > 0) {
        // Find subscription price - typically discounted
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
        section.querySelector(".cwc-featured-product__price-current") ||
        section.querySelector(`#current-price-${sectionId}`);
      if (priceElement) {
        priceElement.textContent = formatPrice(displayPrice);
        console.log("Updated price element to:", formatPrice(displayPrice));
      }

      // Update ALL option button prices based on subscription state
      updateAllButtonPrices(isAutoRefill);

      // Update add to cart button price
      const buttonMainPrice = addToCartButton
        ? addToCartButton.querySelector(".main-price")
        : null;
      if (buttonMainPrice) {
        buttonMainPrice.textContent = formatPrice(displayPrice);
      }

      // Update compare price and savings in main display
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
          const savings = displayComparePrice - displayPrice;
          // saveElement.textContent = "Save   " + formatPrice(savings);
          saveElement.innerHTML =
            "<span>Save</span> " + `<span>${formatPrice(savings)}</span>`;
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
      const variantId = this.getAttribute("data-variant-id");

      console.log("Button data:", { optionIndex, value, variantId });

      // Remove selected class from siblings
      const siblings = this.parentNode.querySelectorAll(
        ".cwc-featured-product__option_button"
      );
      siblings.forEach((sibling) => sibling.classList.remove("selected"));

      // Add selected class to clicked button
      this.classList.add("selected");

      // Update the option's hidden input (for form submission)
      const hiddenInput = section.querySelector(
        `input[data-option-index="${optionIndex}"]`
      );
      if (hiddenInput) {
        console.log(
          "Updating option input from",
          hiddenInput.value,
          "to",
          value
        );
        hiddenInput.value = value;
      }

      // IMPORTANT: Update the main variant ID hidden input
      if (variantId && variantIdInput) {
        console.log(
          "Updating main variant input from",
          variantIdInput.value,
          "to",
          variantId
        );
        variantIdInput.value = variantId;
      }

      // Get variant by ID and update prices
      if (variantId) {
        const variant = findVariantById(variantId);
        if (variant) {
          console.log("Found variant by ID:", variant);
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

  // Add event listener to auto refill checkbox and set it initially checked
  if (autoRefillCheckbox) {
    // Set checkbox as initially checked
    autoRefillCheckbox.checked = true;

    // Add visual styling for initially checked state
    const checkboxIcon = section.querySelector(".cwc-checkbox-icon");
    if (checkboxIcon) {
      checkboxIcon.classList.add("initially-checked");
    }

    autoRefillCheckbox.addEventListener("change", function () {
      console.log("Subscription checkbox changed:", this.checked);
      updateVariant();
    });
  }

  // Store original button text for later use
  const buttonText = addToCartButton.querySelector(".cwc-button-text");
  if (buttonText && !buttonText.dataset.originalText) {
    buttonText.dataset.originalText = buttonText.textContent;
  }

  // Add to cart functionality
  addToCartButton.addEventListener("click", function () {
    const selectedVariantId = variantIdInput.value;
    const sellingPlanId = finalSellingPlanInput.value;
    const variant = findVariantById(selectedVariantId);

    console.log("Add to cart clicked:", {
      selectedVariantId,
      sellingPlanId,
      variant: variant
        ? { id: variant.id, available: variant.available }
        : null,
    });

    if (!variant) {
      console.warn("No variant found for ID:", selectedVariantId);
      return;
    }

    if (!variant.available) {
      alert("This product is currently unavailable.");
      return;
    }

    addToCartButton.classList.add("loading_hk");

    // Build cart data from hidden inputs
    const data = {
      quantity: 1,
      id: selectedVariantId,
    };

    // Add selling plan if checkbox is checked and selling plan exists
    if (sellingPlanId) {
      data.selling_plan = sellingPlanId;
      console.log("Adding with selling plan:", sellingPlanId);
    } else {
      console.log("Adding as regular purchase (no selling plan)");
    }

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

        console.log("Item added to cart:", data);

        // Dispatch custom event for other scripts to listen
        document.dispatchEvent(
          new CustomEvent("cwc:item-added-to-cart", {
            detail: { variant, sellingPlanId, sectionId },
          })
        );
      })
      .catch((error) => {
        console.error("Error:", error);
        addToCartButton.classList.remove("loading_hk");
        alert(
          "An error occurred while processing your request. Please try again."
        );
      });
  });

  // Initialize with current selection
  updateVariant();

  // Expose for testing
  window.CWCFeaturedProduct = window.CWCFeaturedProduct || {};
  window.CWCFeaturedProduct.testUpdate = function (testSection) {
    if (testSection === section) {
      console.log("Testing updateVariant for section:", sectionId);
      updateVariant();
    }
  };
}
