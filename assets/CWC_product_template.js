/* =====================================================
   CWC PRODUCT TEMPLATE JAVASCRIPT
   =====================================================
   Purpose: Handles product variants, pricing, subscriptions, 
   add-to-cart functionality, and FAQ interactions for 
   product template pages.
   ===================================================== */

// console.log("product template");

/* =====================================================
   INITIALIZATION
   ===================================================== */
document.addEventListener("DOMContentLoaded", function () {
  // Find all product template sections on the page
  const sections = document.querySelectorAll(".cwc_product-template");

  // Initialize each section independently
  sections.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const productId = section.dataset.productId;
    const variants = JSON.parse(section.dataset.variants || "[]");
    const sellingPlanGroups = JSON.parse(section.dataset.sellingPlans || "[]");

    initProductTemplate(section, sectionId, variants, sellingPlanGroups);
  });
});

/* =====================================================
   MAIN INITIALIZATION FUNCTION
   ===================================================== */
function initProductTemplate(section, sectionId, variants, sellingPlanGroups) {
  /* -----------------------------------------------------
     DOM ELEMENT REFERENCES
     ----------------------------------------------------- */
  // Form and core elements
  const form = section.querySelector(`#product-form-${sectionId}`);
  const variantIdInput = section.querySelector(".variant-id-input");
  const sellingPlanInput = section.querySelector(".selling-plan-input");

  // Product option controls (buttons and inputs)
  const optionButtons = section.querySelectorAll(
    ".cwc-featured-product__option_button"
  );
  const optionInputs = section.querySelectorAll(
    ".cwc-featured-product__option-input"
  );

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
    newSellingPlanInput.value = "";
    form.appendChild(newSellingPlanInput);
    console.log("Created selling plan input");
  }

  const finalSellingPlanInput =
    sellingPlanInput || form.querySelector(".selling-plan-input");

  /* -----------------------------------------------------
     VALIDATION
     ----------------------------------------------------- */
  // Ensure required elements exist before proceeding
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

  /* =====================================================
     UTILITY FUNCTIONS
     ===================================================== */

  /* -----------------------------------------------------
     VARIANT FINDING FUNCTIONS
     ----------------------------------------------------- */
  function findVariant(selectedOptions) {
    // Find variant by matching all selected options
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
  function updateSellingPlan() {
    // Update the selling plan input based on subscription checkbox state
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

  /* -----------------------------------------------------
     BUTTON PRICE UPDATES
     ----------------------------------------------------- */
  function updateAllButtonPrices(isAutoRefill) {
    // Update prices on all option buttons based on subscription state
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

      // Apply subscription discount if applicable
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

      // Show/hide compare price and savings
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

  /* =====================================================
     MAIN UPDATE FUNCTION
     ===================================================== */
  function updateVariant(variant = null) {
    // Main function to update all UI elements when variant changes

    // Find variant if not provided
    if (!variant) {
      const selectedOptions = Array.from(optionInputs).map(
        (input) => input.value
      );
      variant = findVariant(selectedOptions);
    }

    const isAutoRefill = autoRefillCheckbox && autoRefillCheckbox.checked;

    if (!variant) {
      console.warn("No variant provided to updateVariant");
      return;
    }

    console.log("Updating to variant:", variant.id, "Price:", variant.price);

    /* -----------------------------------------------------
       UPDATE FORM INPUTS
       ----------------------------------------------------- */
    if (variantIdInput) {
      variantIdInput.value = variant.id;
    }
    updateSellingPlan();

    /* -----------------------------------------------------
       CALCULATE DISPLAY PRICES
       ----------------------------------------------------- */
    let displayPrice = variant.price;
    let displayComparePrice = variant.compare_at_price;

    // Apply subscription discount if applicable
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

    /* -----------------------------------------------------
       UPDATE MAIN PRICE DISPLAY
       ----------------------------------------------------- */
    const priceElement =
      currentPriceEl ||
      section.querySelector(".cwc-featured-product__price-current") ||
      section.querySelector(`#current-price-${sectionId}`);

    if (priceElement) {
      priceElement.textContent = formatPrice(displayPrice);
      console.log("Updated price element to:", formatPrice(displayPrice));
    }

    /* -----------------------------------------------------
       UPDATE BUTTON PRICE DISPLAY
       ----------------------------------------------------- */
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

    /* -----------------------------------------------------
       UPDATE ALL OPTION BUTTON PRICES
       ----------------------------------------------------- */
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
        const savings = displayComparePrice - displayPrice;
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

      // Update visual selection state
      const siblings = this.parentNode.querySelectorAll(
        ".cwc-featured-product__option_button"
      );
      siblings.forEach((sibling) => sibling.classList.remove("selected"));
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

      // Update the main variant ID hidden input
      if (variantId && variantIdInput) {
        console.log(
          "Updating main variant input from",
          variantIdInput.value,
          "to",
          variantId
        );
        variantIdInput.value = variantId;
      }

      // Find variant and update all UI elements
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
      console.log("Subscription checkbox changed:", this.checked);
      updateVariant(); // Recalculate all prices based on new subscription state
    });
  }

  /* -----------------------------------------------------
     ADD TO CART BUTTON SETUP
     ----------------------------------------------------- */
  // Store original button text for later use
  const buttonText = addToCartButton.querySelector(".cwc-button-text");
  if (buttonText && !buttonText.dataset.originalText) {
    buttonText.dataset.originalText = buttonText.textContent;
  }

  /* -----------------------------------------------------
     ADD TO CART FUNCTIONALITY
     ----------------------------------------------------- */
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
      console.log("Adding with selling plan:", sellingPlanId);
    } else {
      console.log("Adding as regular purchase (no selling plan)");
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

  /* =====================================================
     FAQ FUNCTIONALITY
     ===================================================== */
  function initFAQBlocks() {
    // Initialize FAQ accordion functionality
    const faqItems = section.querySelectorAll(".cwc_product-template__faq");

    console.log(`Section ${sectionId}: Found ${faqItems.length} FAQ items`);

    faqItems.forEach((item, index) => {
      const question = item.querySelector(
        ".cwc-featured-product__faq-question"
      );
      const answer = item.querySelector(".cwc-featured-product__faq-answer");
      const icon = item.querySelector(".cwc-featured-product__faq-icon");

      if (!question || !answer) return;

      question.addEventListener("click", () => {
        console.log(`Clicked FAQ ${index} in section ${sectionId}`);

        const isCurrentlyActive = item.classList.contains("active");

        // Close all other FAQs in this section first
        faqItems.forEach((other, otherIndex) => {
          if (other !== item && other.classList.contains("active")) {
            console.log(`Closing FAQ ${otherIndex} in section ${sectionId}`);
            const otherAnswer = other.querySelector(
              ".cwc-featured-product__faq-answer"
            );
            const otherIcon = other.querySelector(
              ".cwc-featured-product__faq-icon"
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

        // Toggle the clicked FAQ after a small delay
        setTimeout(() => {
          if (isCurrentlyActive) {
            // Close this FAQ
            answer.style.maxHeight = answer.scrollHeight + "px";
            setTimeout(() => {
              answer.style.maxHeight = "0";
              item.classList.remove("active");
              if (icon) icon.textContent = "+";
            }, 10);
          } else {
            // Open this FAQ
            item.classList.add("active");
            if (icon) icon.textContent = "−";
            answer.style.maxHeight = answer.scrollHeight + "px";

            // Allow natural height growth after animation
            answer.addEventListener(
              "transitionend",
              () => {
                if (item.classList.contains("active")) {
                  answer.style.maxHeight = "none";
                }
              },
              { once: true }
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
  window.CWCProductTemplate = window.CWCProductTemplate || {};
  window.CWCProductTemplate.testUpdate = function (testSection) {
    if (testSection === section) {
      console.log("Testing updateVariant for section:", sectionId);
      updateVariant();
    }
  };
}
