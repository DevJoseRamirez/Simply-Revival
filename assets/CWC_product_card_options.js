/* =====================================================
   CWC PRODUCT CARD OPTIONS JAVASCRIPT
   =====================================================
   Purpose: Handles product card interactions, variant
   selection, add-to-cart, and pricing calculations
   ===================================================== */

/* =====================================================
   INITIALIZATION
   ===================================================== */
document.addEventListener("DOMContentLoaded", function () {
  // Find all product card sections on the page
  const sections = document.querySelectorAll(".cwc-product-cards");

  // Initialize each section independently
  sections.forEach((section) => {
    const sectionId = section.dataset.sectionId;
    const productId = section.dataset.productId;
    const variants = JSON.parse(section.dataset.variants || "[]");

    initProductCardOptions(section, sectionId, productId, variants);
  });
});

/* =====================================================
   MAIN INITIALIZATION FUNCTION
   ===================================================== */
function initProductCardOptions(section, sectionId, productId, variants) {
  console.log(`Initializing product card options for section: ${sectionId}`);

  /* -----------------------------------------------------
     DOM ELEMENT REFERENCES
     ----------------------------------------------------- */
  const form = section.querySelector(
    `#cwc-product-cards__section-${sectionId}`
  );
  const variantIdInput = section.querySelector(".variant-id-input");
  const cards = section.querySelectorAll(".cwc-product-card");

  /* -----------------------------------------------------
     VALIDATION
     ----------------------------------------------------- */
  if (!form || !variantIdInput) {
    console.warn("Required form elements not found in section:", sectionId);
    return;
  }

  if (!cards.length) {
    console.warn("No product cards found in section:", sectionId);
    return;
  }

  console.log(`Found ${cards.length} cards and ${variants.length} variants`);

  /* =====================================================
     UTILITY FUNCTIONS
     ===================================================== */

  /* -----------------------------------------------------
     VARIANT FINDING FUNCTION
     ----------------------------------------------------- */
  function findVariantById(variantId) {
    return variants.find((variant) => variant.id == variantId);
  }

  /* -----------------------------------------------------
     PRICE FORMATTING
     ----------------------------------------------------- */
  function formatPrice(priceInCents, currencyCode = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(priceInCents / 100);
  }

  /* -----------------------------------------------------
     SAVINGS CALCULATION
     ----------------------------------------------------- */
  function calculateSavings(comparePrice, currentPrice) {
    if (!comparePrice || comparePrice <= currentPrice) {
      return null;
    }

    const savings = comparePrice - currentPrice;
    const savingsPercent = Math.round((savings / comparePrice) * 100);

    return {
      amount: savings,
      percent: savingsPercent,
      formatted: formatPrice(savings),
    };
  }

  /* -----------------------------------------------------
     UPDATE SELECTED CARD STATE
     ----------------------------------------------------- */
  function updateSelectedCard(selectedVariantId) {
    // Remove selected state from all cards
    cards.forEach((card) => {
      card.classList.remove("selected");
    });

    // Add selected state to clicked card
    const selectedCard = section.querySelector(
      `.cwc-product-card[data-variant-id="${selectedVariantId}"]`
    );
    if (selectedCard) {
      selectedCard.classList.add("selected");
    }

    console.log("Updated selected card to variant:", selectedVariantId);
  }

  /* =====================================================
     CARD BUTTON CLICK HANDLERS
     ===================================================== */
  cards.forEach((card) => {
    const button = card.querySelector(".cwc-product-card__button");
    const variantId = card.dataset.variantId;
    const isAvailable = card.dataset.available === "true";

    if (!button || !variantId) {
      console.warn("Card missing button or variant ID:", card);
      return;
    }

    button.addEventListener("click", function (e) {
      e.preventDefault();

      const variant = findVariantById(variantId);

      if (!variant) {
        console.warn("Variant not found for ID:", variantId);
        return;
      }

      if (!isAvailable || !variant.available) {
        console.log("Variant is sold out:", variantId);
        alert("This product is currently unavailable.");
        return;
      }

      console.log("Card button clicked - Adding to cart:", {
        variantId,
        variantTitle: variant.title,
        price: variant.price,
      });

      // Update form hidden input
      variantIdInput.value = variantId;

      // Update visual selected state
      updateSelectedCard(variantId);

      // Add to cart
      addToCart(variant, button);
    });
  });

  /* =====================================================
     ADD TO CART FUNCTIONALITY
     ===================================================== */
  function addToCart(variant, button) {
    // Show loading state
    button.classList.add("loading");
    button.disabled = true;

    const originalText = button.textContent;

    // Build cart data
    const data = {
      quantity: 1,
      id: variant.id,
    };

    console.log("Adding to cart:", data);

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
      .then((response) => {
        console.log("Item added to cart successfully:", response);

        // Remove loading state
        button.classList.remove("loading");
        button.disabled = false;

        // Show success message
        button.textContent = "Added to Cart!";
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);

        // Dispatch custom event for other scripts to listen
        document.dispatchEvent(
          new CustomEvent("cwc:item-added-to-cart", {
            detail: { variant, sectionId, response },
          })
        );

        // Optional: Redirect to cart after short delay
        // setTimeout(() => {
        //   window.location.href = '/cart';
        // }, 1500);
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);

        // Remove loading state
        button.classList.remove("loading");
        button.disabled = false;

        alert("An error occurred while adding to cart. Please try again.");
      });
  }

  /* =====================================================
     CARD CLICK HANDLERS (OPTIONAL)
     ===================================================== */
  // Make entire card clickable for better UX
  // cards.forEach((card) => {
  //   card.style.cursor = "pointer";

  //   card.addEventListener("click", function (e) {
  //     // Don't trigger if clicking the button directly
  //     if (e.target.closest(".cwc-product-card__button")) {
  //       return;
  //     }

  //     // Trigger button click
  //     const button = this.querySelector(".cwc-product-card__button");
  //     if (button && !button.disabled) {
  //       button.click();
  //     }
  //   });
  // });

  /* =====================================================
     INITIAL STATE
     ===================================================== */
  // Set first available variant as selected on load
  const firstAvailableCard = Array.from(cards).find(
    (card) => card.dataset.available === "true"
  );

  if (firstAvailableCard) {
    const firstVariantId = firstAvailableCard.dataset.variantId;
    variantIdInput.value = firstVariantId;
    updateSelectedCard(firstVariantId);
    console.log("Set initial variant:", firstVariantId);
  }

  /* =====================================================
     DYNAMIC PRICE CALCULATIONS (IF NEEDED)
     ===================================================== */
  // Update prices dynamically if needed (e.g., for subscriptions)
  function updateCardPrices(card, variant) {
    const priceEl = card.querySelector(".cwc-product-card__price");
    const comparePriceEl = card.querySelector(
      ".cwc-product-card__compare-price"
    );
    const savingsEl = card.querySelector(".cwc-product-card__savings");

    if (!variant) return;

    // Update main price
    if (priceEl) {
      priceEl.textContent = formatPrice(variant.price);
    }

    // Handle compare price and savings
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      if (comparePriceEl) {
        comparePriceEl.textContent = formatPrice(variant.compare_at_price);
        comparePriceEl.style.display = "inline";
      }

      if (savingsEl) {
        const savings = calculateSavings(
          variant.compare_at_price,
          variant.price
        );
        if (savings) {
          savingsEl.textContent = `Save ${savings.percent}%`;
          savingsEl.style.display = "inline";
        }
      }
    } else {
      if (comparePriceEl) comparePriceEl.style.display = "none";
      if (savingsEl) savingsEl.style.display = "none";
    }
  }

  // Initialize all card prices
  cards.forEach((card) => {
    const variantId = card.dataset.variantId;
    const variant = findVariantById(variantId);
    if (variant) {
      updateCardPrices(card, variant);
    }
  });

  /* =====================================================
     INITIALIZATION COMPLETION
     ===================================================== */
  console.log(
    `Product card options initialized for section ${sectionId}: ${cards.length} cards`
  );

  // Expose for testing/debugging
  window.CWCProductCardOptions = window.CWCProductCardOptions || {};
  window.CWCProductCardOptions[sectionId] = {
    section,
    form,
    variants,
    cards,
    updateSelectedCard,
    updateCardPrices,
    addToCart,
  };
}
