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
  function formatPrice(priceInCents, currencyCode = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(priceInCents / 100);
  }

  /* =====================================================
     PRICE DISPLAY UPDATES
     ===================================================== */
  function updateMainPriceDisplay(prices) {
    if (!prices) return;

    const { price, comparePrice, savings } = prices;
    console.log(savings);
    console.log("savings");
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

    // const savings = comparePrice - price;
    const savingsPct = Math.round((savings / comparePrice) * 100);

    if (comparePrice && comparePrice > price) {
      if (compareElement) {
        compareElement.textContent = formatPrice(comparePrice);
        compareElement.style.display = "inline";
      }
      if (saveElement) {
        const saveAmountSpan = saveElement.querySelector(
          ".cwc-featured-product__price-save-amount",
        );
        if (saveAmountSpan) saveAmountSpan.textContent = savingsPct + "%";
        saveElement.style.display = "flex";
      }
    } else {
      if (compareElement) compareElement.style.display = "none";
      if (saveElement) saveElement.style.display = "none";
    }
    // if (comparePrice && comparePrice > price) {
    //   if (compareElement) {
    //     compareElement.textContent = formatPrice(comparePrice);
    //     compareElement.style.display = "inline";
    //   }
    //   if (saveElement) {
    //     const saveAmountSpan = saveElement.querySelector(
    //       ".cwc-featured-product__price-save-amount",
    //     );
    //     if (saveAmountSpan) saveAmountSpan.textContent = formatPrice(savings);
    //     saveElement.style.display = "flex";
    //   }
    // } else {
    //   if (compareElement) compareElement.style.display = "none";
    //   if (saveElement) saveElement.style.display = "none";
    // }
    // if (comparePrice && comparePrice > price) {
    //   if (compareElement) {
    //     compareElement.textContent = formatPrice(comparePrice);
    //     compareElement.style.display = "inline";
    //   }
    //   if (saveElement) {
    //     saveElement.innerHTML = `<span>Save</span> <span>${formatPrice(savings)}</span>`;
    //     saveElement.style.display = "flex";
    //   }
    // } else {
    //   if (compareElement) compareElement.style.display = "none";
    //   if (saveElement) saveElement.style.display = "none";
    // }
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
