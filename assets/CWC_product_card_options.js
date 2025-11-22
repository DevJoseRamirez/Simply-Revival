/* =====================================================
   CWC PRODUCT CARD OPTIONS JAVASCRIPT
   =====================================================
   Purpose: Handles product card button clicks to either
   navigate to a custom link or submit the variant ID
   to the hidden product form for add-to-cart.
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {
  // Find all product card sections on the page
  const sections = document.querySelectorAll('.cwc-product-cards');

  // Initialize each section independently
  sections.forEach((section) => {
    initProductCardOptions(section);
  });
});

function initProductCardOptions(section) {
  const sectionId = section.dataset.sectionId;
  const cards = section.querySelectorAll('.cwc-product-card');
  const form = section.querySelector(`#product-form-${sectionId}`);
  const variantIdInput = section.querySelector('.variant-id-input');

  if (!form || !variantIdInput || !cards.length) {
    console.warn('Required elements not found for section:', sectionId);
    return;
  }

  // --- Utility Functions ---

  function updateSelectedCard(selectedVariantId) {
    cards.forEach((card) => {
      card.classList.remove('selected');
    });

    const selectedCard = section.querySelector(
      `.cwc-product-card[data-variant-id="${selectedVariantId}"]`
    );
    if (selectedCard) {
      selectedCard.classList.add('selected');
    }
  }

  // --- Event Handlers ---

  cards.forEach((card) => {
    const button = card.querySelector('.cwc-product-card__button');
    const variantId = card.dataset.variantId;
    const buttonLink = button?.dataset.buttonLink;

    if (!button || !variantId) return;

    button.addEventListener('click', function (e) {
      e.preventDefault();

      // 1. Update form hidden input
      variantIdInput.value = variantId;

      // 2. Update visual selected state
      updateSelectedCard(variantId);

      // 3. Handle navigation/add-to-cart
      if (buttonLink && buttonLink.trim() !== '') {
        // Custom link provided - navigate to it
        window.location.href = buttonLink;
      } else {
        // No custom link - submit the hidden form for add-to-cart
        form.submit();
      }
    });

    // Make entire card clickable for better UX
    card.style.cursor = 'pointer';

    card.addEventListener('click', function (e) {
      // Don't trigger if clicking the button directly
      if (e.target.closest('.cwc-product-card__button')) {
        return;
      }

      // Trigger button click
      const button = this.querySelector('.cwc-product-card__button');
      if (button) {
        button.click();
      }
    });
  });

  // --- Initial State ---

  // Set first available card as selected on load
  const firstAvailableCard = Array.from(cards).find(
    (card) => card.dataset.available === 'true'
  );

  if (firstAvailableCard) {
    const firstVariantId = firstAvailableCard.dataset.variantId;
    variantIdInput.value = firstVariantId;
    updateSelectedCard(firstVariantId);
  }
}
