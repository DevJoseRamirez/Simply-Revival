/* =====================================================
   CWC FEATURED PRODUCT - UI MODULE
   =====================================================
   Handles: Price formatting, price display updates,
   button states, loading states, success messages,
   FAQ accordion.
   
   Listens to Events (from Core):
   - cwc:variant-changed      → Update all price displays
   - cwc:subscription-changed → Recalculate all prices
   - cwc:cart-loading         → Show loading state
   - cwc:cart-success         → Show success message
   - cwc:cart-error           → Show error message
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll(".cwc-featured-product");

  sections.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    initFeaturedProductUI(section, sectionId);
  });
});

/* =====================================================
   UI INITIALIZATION
   ===================================================== */
function initFeaturedProductUI(section, sectionId) {
  /* -----------------------------------------------------
     CONFIG
     ----------------------------------------------------- */
  // Display mode for savings: "percentage" → "25%", "dollar" → "$20.00"
  // Mirrors what Core reads, but UI owns presentation decisions.
  const savingsDisplayType = section.dataset.savingsDisplay || "dollar";

  /* -----------------------------------------------------
     DOM REFERENCES
     ----------------------------------------------------- */
  const addToCartButton = section.querySelector(`#add-to-cart-${sectionId}`);
  const currentPriceEl = section.querySelector(`#current-price-${sectionId}`);
  const comparePriceEl = section.querySelector(`#compare-price-${sectionId}`);
  const saveAmountEl = section.querySelector(`#save-amount-${sectionId}`);
  const autoRefillCheckbox = section.querySelector(`#auto-refill-${sectionId}`);

  /* =====================================================
     UTILITY FUNCTIONS
     ===================================================== */
  function formatPrice(priceInCents, currencyCode = "USD", noDecimals = false) {
    const options = {
      style: "currency",
      currency: currencyCode,
    };
    if (noDecimals) {
      options.minimumFractionDigits = 0;
      options.maximumFractionDigits = 0;
    }
    return new Intl.NumberFormat("en-US", options).format(priceInCents / 100);
  }

  /**
   * Format savings as either a dollar amount or a percentage, per
   * the section's `data-savings-display` attribute.
   *
   *   savingsDisplayType === "percentage"  →  "25%"
   *   savingsDisplayType === "dollar"      →  "$20.00"  (default)
   *
   * @param {number} savingsInCents  - Raw savings amount (cents)
   * @param {number} savingsPercent  - Pre-calculated savings percentage (integer)
   * @returns {string} Formatted savings value (no "Save" label)
   */
  function formatSavings(savingsInCents, savingsPercent) {
    if (!savingsInCents || savingsInCents <= 0) return "";

    if (savingsDisplayType === "percentage") {
      return `${savingsPercent}%`;
    }

    let cents = savingsInCents;
    let useWholeNumber = false;

    // --- OPTIONAL: round dollar savings down to nearest $10 ---
    // Safe `typeof` guard means commenting out the block below
    // does NOT break this function — it just falls through.
    if (
      typeof ROUND_DOLLAR_SAVINGS !== "undefined" &&
      ROUND_DOLLAR_SAVINGS &&
      typeof roundSavingsDownDollar === "function"
    ) {
      cents = roundSavingsDownDollar(cents);
      // Drop cents only when the value cleared the rounding threshold
      // (so under-threshold values like $9.99 still display accurately
      // as "$9.99" rather than being mis-rounded to "$10").
      useWholeNumber =
        typeof ROUND_DOLLAR_MIN_CENTS === "undefined" ||
        cents >= ROUND_DOLLAR_MIN_CENTS;
    }

    return formatPrice(cents, "USD", useWholeNumber);
  }

  /* =====================================================
     OPTIONAL · ROUND DOLLAR SAVINGS DOWN TO CLEAN NUMBER
     =====================================================
     When enabled, dollar savings round DOWN to nearest $10 AND
     drop the `.00` for cleaner marketing copy:
         $31.98  →  $30
         $128.50 →  $120
         $200    →  $200
         $9.99   →  $9.99   (under threshold, kept as-is so we
                              don't lie and round it up to $10)

     Affects: main price-save label AND option-button save labels.
     Percentage mode is unaffected.

     Configuration:
     • ROUND_DOLLAR_SAVINGS      false → off (default) · true → on
     • ROUND_DOLLAR_BUCKET_CENTS step in cents (1000 = $10)
     • ROUND_DOLLAR_MIN_CENTS    don't round savings below this
                                  (also the cutoff for dropping cents)

     To disable: set ROUND_DOLLAR_SAVINGS = false
     To remove:  comment out (or delete) this entire block — the
                 formatSavings function has a typeof guard and will
                 fall through to exact-amount display.
     ===================================================== */
  const ROUND_DOLLAR_SAVINGS = true; // ← flip to true to enable
  const ROUND_DOLLAR_BUCKET_CENTS = 1000; // 1000 = $10 · 500 = $5 · 10000 = $100
  const ROUND_DOLLAR_MIN_CENTS = 1000; // don't round amounts smaller than this

  function roundSavingsDownDollar(cents) {
    if (cents < ROUND_DOLLAR_MIN_CENTS) return cents;
    return (
      Math.floor(cents / ROUND_DOLLAR_BUCKET_CENTS) * ROUND_DOLLAR_BUCKET_CENTS
    );
  }
  /* === END OPTIONAL · ROUND DOLLAR SAVINGS === */

  /* =====================================================
     PRICE DISPLAY UPDATES
     ===================================================== */
  function updateMainPriceDisplay(prices) {
    if (!prices) return;

    const { price, comparePrice, savings, savingsPercent } = prices;

    // Main price element
    const priceElement =
      currentPriceEl ||
      section.querySelector(".cwc-featured-product__price-current");

    if (priceElement) {
      priceElement.textContent = formatPrice(price);
    }

    // Compare price element
    const compareElement =
      comparePriceEl ||
      section.querySelector(".cwc-featured-product__price-compare");

    // Save amount element
    const saveElement =
      saveAmountEl ||
      section.querySelector(".cwc-featured-product__price-save");

    if (comparePrice && comparePrice > price) {
      if (compareElement) {
        compareElement.textContent = formatPrice(comparePrice);
        compareElement.style.display = "inline";
      }
      if (saveElement) {
        // Target the dedicated inner amount span so the static "Save" label
        // markup (.cwc-featured-product__price-save-label) is preserved.
        const saveAmountSpan = saveElement.querySelector(
          ".cwc-featured-product__price-save-amount",
        );
        if (saveAmountSpan) {
          saveAmountSpan.textContent = formatSavings(savings, savingsPercent);
        }
        saveElement.style.display = "inline";
      }
    } else {
      if (compareElement) compareElement.style.display = "none";
      if (saveElement) saveElement.style.display = "none";
    }
  }

  function updateButtonPriceDisplay(prices) {
    if (!prices) return;

    const { price, comparePrice } = prices;

    // Button current price
    const buttonCurrentPriceEl = section.querySelector(
      `#current-price-button-${sectionId}`,
    );
    if (buttonCurrentPriceEl) {
      buttonCurrentPriceEl.textContent = formatPrice(price);
    }

    // Button compare price
    const buttonComparePriceEl = section.querySelector(
      `#compare-price-button-${sectionId}`,
    );
    if (buttonComparePriceEl) {
      if (comparePrice && comparePrice > price) {
        buttonComparePriceEl.textContent = formatPrice(comparePrice);
        buttonComparePriceEl.style.display = "inline";
      } else {
        buttonComparePriceEl.style.display = "none";
      }
    }

    // Add to cart button prices
    if (addToCartButton) {
      const mainPriceEl = addToCartButton.querySelector(".main-price");
      const comparePriceEl = addToCartButton.querySelector(".compare-price");

      if (mainPriceEl) {
        mainPriceEl.textContent = formatPrice(price);
      }

      if (comparePriceEl) {
        if (comparePrice && comparePrice > price) {
          comparePriceEl.textContent = formatPrice(comparePrice);
          comparePriceEl.style.display = "inline";
        } else {
          comparePriceEl.style.display = "none";
        }
      }
    }
  }

  /* =====================================================
     OPTION BUTTON PRICE UPDATES
     ===================================================== */

  function updateAllOptionButtonPrices(detail) {
    const { isSubscription } = detail;
    const allButtons = section.querySelectorAll(
      ".cwc-featured-product__option_button",
    );

    allButtons.forEach((button) => {
      const originalPrice = parseInt(button.dataset.price);
      const subscriptionPrice = button.dataset.subscriptionPrice
        ? parseInt(button.dataset.subscriptionPrice)
        : null;

      // Compare price is ALWAYS the variant's compare_at_price
      const comparePrice = parseInt(button.dataset.compare) || 0;

      if (!originalPrice) return;

      // Determine display price based on subscription state
      let displayPrice = originalPrice;

      if (isSubscription && subscriptionPrice) {
        // Use pre-calculated subscription price (variant-level)
        displayPrice = subscriptionPrice;
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

      // Show/hide compare price and savings (compare is always variant.compare_at_price)
      if (comparePrice && comparePrice > displayPrice) {
        if (compareEl) {
          compareEl.textContent = formatPrice(comparePrice);
          compareEl.style.display = "inline";
        }
        if (saveEl) {
          // Option-button savings ALWAYS display as percentage, independent
          // of the section's `savings_display_type` setting (which only
          // controls the main price display). Keeps option buttons compact
          // and on-brand regardless of the dollar/percent toggle.
          const savings = comparePrice - displayPrice;
          const savingsPct = Math.round((savings / comparePrice) * 100);
          saveEl.textContent = `You Save ${savingsPct}%`;
          saveEl.style.display = "inline";
        }
      } else {
        if (compareEl) compareEl.style.display = "none";
        if (saveEl) saveEl.style.display = "none";
      }
    });
  }

  /* =====================================================
     BUTTON AVAILABILITY STATE
     ===================================================== */
  function updateButtonAvailability(variant) {
    if (!addToCartButton) return;

    const buttonText = addToCartButton.querySelector(".cwc-button-text");

    if (variant && variant.available) {
      addToCartButton.disabled = false;
      if (buttonText) {
        buttonText.textContent =
          buttonText.dataset.originalText || "Add to Cart";
      }
    } else {
      addToCartButton.disabled = true;
      if (buttonText) {
        buttonText.textContent = "Sold Out";
      }
    }
  }

  /* =====================================================
     LOADING & SUCCESS STATES
     ===================================================== */
  function showLoadingState() {
    if (!addToCartButton) return;
    addToCartButton.disabled = true;
    addToCartButton.classList.add("loading_hk");
  }

  function hideLoadingState() {
    if (!addToCartButton) return;
    addToCartButton.disabled = false;
    addToCartButton.classList.remove("loading_hk");
  }

  function showSuccessMessage(isBundle = false) {
    if (!addToCartButton) return;

    const buttonText = addToCartButton.querySelector(".cwc-button-text");
    if (!buttonText) return;

    const originalText = buttonText.dataset.originalText || "Add to Cart";
    const successText = isBundle ? "Bundle Added!" : "Added to Cart!";

    buttonText.textContent = successText;

    setTimeout(() => {
      buttonText.textContent = originalText;
    }, 2000);
  }

  function showErrorMessage() {
    hideLoadingState();
    alert("An error occurred while processing your request. Please try again.");
  }

  /* =====================================================
     SUBSCRIPTION CHECKBOX UI
     ===================================================== */
  function initSubscriptionCheckboxUI() {
    if (!autoRefillCheckbox) return;

    const checkboxIcon = section.querySelector(".cwc-checkbox-icon");
    if (checkboxIcon) {
      checkboxIcon.classList.add("initially-checked");
    }
  }

  /* =====================================================
     FAQ ACCORDION
     ===================================================== */
  function initFAQAccordion() {
    const faqItems = section.querySelectorAll(".cwc-featured-product__faq");

    faqItems.forEach((item) => {
      const question = item.querySelector(
        ".cwc-featured-product__faq-question",
      );
      const answer = item.querySelector(".cwc-featured-product__faq-answer");
      const icon = item.querySelector(".cwc-featured-product__faq-icon");

      if (!question || !answer) return;

      question.addEventListener("click", () => {
        const isCurrentlyActive = item.classList.contains("active");

        // Close all others first
        faqItems.forEach((other) => {
          if (other !== item && other.classList.contains("active")) {
            const otherAnswer = other.querySelector(
              ".cwc-featured-product__faq-answer",
            );
            const otherIcon = other.querySelector(
              ".cwc-featured-product__faq-icon",
            );

            otherAnswer.style.maxHeight = otherAnswer.scrollHeight + "px";
            setTimeout(() => {
              otherAnswer.style.maxHeight = "0";
              other.classList.remove("active");
              if (otherIcon) otherIcon.textContent = "+";
            }, 10);
          }
        });

        // Toggle this one
        setTimeout(() => {
          if (isCurrentlyActive) {
            answer.style.maxHeight = answer.scrollHeight + "px";
            setTimeout(() => {
              answer.style.maxHeight = "0";
              item.classList.remove("active");
              if (icon) icon.textContent = "+";
            }, 10);
          } else {
            item.classList.add("active");
            if (icon) icon.textContent = "−";
            answer.style.maxHeight = answer.scrollHeight + "px";

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
     STORE ORIGINAL BUTTON TEXT
     ===================================================== */
  function storeOriginalButtonText() {
    if (!addToCartButton) return;

    const buttonText = addToCartButton.querySelector(".cwc-button-text");
    if (buttonText && !buttonText.dataset.originalText) {
      buttonText.dataset.originalText = buttonText.textContent;
    }
  }

  /* =====================================================
     EVENT LISTENERS (from Core module)
     ===================================================== */

  // Variant changed - update all price displays
  section.addEventListener("cwc:variant-changed", (e) => {
    const { variant, prices } = e.detail;

    updateMainPriceDisplay(prices);
    updateButtonPriceDisplay(prices);
    updateAllOptionButtonPrices(e.detail);
    updateButtonAvailability(variant);
  });

  // Subscription toggled - recalculate all prices
  section.addEventListener("cwc:subscription-changed", (e) => {
    const { prices } = e.detail;

    updateMainPriceDisplay(prices);
    updateButtonPriceDisplay(prices);
    updateAllOptionButtonPrices(e.detail);
  });

  // Cart loading - show spinner
  section.addEventListener("cwc:cart-loading", () => {
    showLoadingState();
  });

  // Cart success - show confirmation
  section.addEventListener("cwc:cart-success", (e) => {
    hideLoadingState();
    showSuccessMessage(e.detail.isBundle);
  });

  // Cart error - show error
  section.addEventListener("cwc:cart-error", () => {
    showErrorMessage();
  });

  /* =====================================================
     INITIALIZATION
     ===================================================== */
  storeOriginalButtonText();
  initSubscriptionCheckboxUI();
  initFAQAccordion();

  /* =====================================================
     EXPOSE UI API (optional, for debugging)
     ===================================================== */
  window.CWCFeaturedProductUI = window.CWCFeaturedProductUI || {};
  window.CWCFeaturedProductUI[sectionId] = {
    formatPrice,
    showLoadingState,
    hideLoadingState,
    showSuccessMessage,
  };
}
