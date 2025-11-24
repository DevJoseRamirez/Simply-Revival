/* =====================================================
   CWC PRODUCT CONTENT STACK JAVASCRIPT
   =====================================================
   Purpose: Handles the button click to trigger an add-to-cart
   action for the target variant using the Shopify AJAX API.
   ===================================================== */

/* =====================================================
   INITIALIZATION
   ===================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll(".cwc-product-content-stack");

  sections.forEach((section) => {
    initProductContentStack(section);
  });
});

/* =====================================================
   MAIN INITIALIZATION FUNCTION
   ===================================================== */
function initProductContentStack(section) {
  const sectionId = section.dataset.sectionId;
  const productId = section.dataset.productId;
  const targetVariantId = section.dataset.targetVariantId;
  const form = section.querySelector(`#product-form-${sectionId}`);
  const button = section.querySelector(".cwc-product-content-stack__button");
  const variantInput = form ? form.querySelector(".variant-id-input") : null;

  console.log(`Initializing product content stack for section: ${sectionId}`);
  console.log("Target variant ID from data attribute:", targetVariantId);
  console.log(
    "Variant input value:",
    variantInput ? variantInput.value : "No input found"
  );

  /* -----------------------------------------------------
     VALIDATION
     ----------------------------------------------------- */
  if (!button) {
    console.warn("Button not found for section:", sectionId);
    return;
  }

  if (!form) {
    console.warn("Form not found for section:", sectionId);
    return;
  }

  if (!variantInput) {
    console.warn("Variant input not found for section:", sectionId);
    return;
  }

  // Get the actual variant ID from the hidden input (most reliable)
  const actualVariantId = variantInput.value;

  if (!actualVariantId || actualVariantId === "") {
    console.error(
      "No variant ID found in hidden input for section:",
      sectionId
    );
    return;
  }

  console.log("Using variant ID from hidden input:", actualVariantId);

  /* -----------------------------------------------------
     BUTTON CLICK HANDLER
     ----------------------------------------------------- */
  button.addEventListener("click", function (e) {
    e.preventDefault();

    if (button.disabled) {
      console.log("Button is disabled (sold out)");
      return;
    }

    console.log("Add to cart button clicked for variant:", actualVariantId);
    addToCart(actualVariantId, button, sectionId);
  });

  /* -----------------------------------------------------
     EXPOSE FOR DEBUGGING
     ----------------------------------------------------- */
  window.CWCProductContentStack = window.CWCProductContentStack || {};
  window.CWCProductContentStack[sectionId] = {
    section,
    form,
    button,
    variantInput,
    targetVariantId: actualVariantId,
  };
}

/* =====================================================
   ADD TO CART FUNCTION
   ===================================================== */
function addToCart(variantId, button, sectionId) {
  // Show loading state
  button.classList.add("loading");
  button.disabled = true;

  const originalText = button.textContent;

  // Build cart data
  const data = {
    quantity: 1,
    id: variantId,
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

      // Dispatch custom event for other scripts to listen (e.g., cart drawer)
      document.dispatchEvent(
        new CustomEvent("cwc:item-added-to-cart", {
          detail: {
            variantId,
            sectionId,
            response,
          },
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
