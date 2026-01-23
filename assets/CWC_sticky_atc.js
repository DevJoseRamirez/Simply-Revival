/* ================================
   CWC_sticky_atc.js
   
   Sticky/Floating Add to Cart functionality
   - Shows sticky bar when user scrolls past static ATC button
   - Syncs price and disabled state with static button
   - Triggers static button click for consistent functionality
   ================================ */

(function() {
  'use strict';

  function initStickyATC() {
    // Find all sticky ATC bars on the page
    const stickyBars = document.querySelectorAll('[data-sticky-atc]');
    
    if (!stickyBars.length) return;

    stickyBars.forEach(function(stickyBar) {
      // Get the target static button ID from data attribute
      const targetId = stickyBar.dataset.observeTarget;
      const staticButton = document.getElementById(targetId);
      
      if (!staticButton) return;

      // Get the sticky button within this bar
      const stickyButton = stickyBar.querySelector('[data-sticky-atc-button]');
      
      if (!stickyButton) return;

      // Store original button text for sync
      const originalButtonText = stickyButton.textContent.trim();

      // ================================
      // Click Sync - Sticky triggers Static
      // ================================
      stickyButton.addEventListener('click', function(e) {
        e.preventDefault();
        staticButton.click();
      });

      // ================================
      // Scroll Detection - IntersectionObserver
      // ================================
      const observer = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              // Static button is visible - hide sticky
              stickyBar.classList.remove('is-visible');
            } else {
              // Static button not visible - check if we scrolled past it
              const rect = staticButton.getBoundingClientRect();
              if (rect.bottom < 0) {
                // Button is above viewport (scrolled past)
                stickyBar.classList.add('is-visible');
              } else {
                // Button is below viewport (haven't reached it yet)
                stickyBar.classList.remove('is-visible');
              }
            }
          });
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: 0
        }
      );

      observer.observe(staticButton);

      // ================================
      // Price Sync - MutationObserver
      // ================================
      const stickyPriceCurrent = stickyBar.querySelector('[data-sticky-price-current]');
      const stickyPriceCompare = stickyBar.querySelector('[data-sticky-price-compare]');
      
      // Find price elements in static button
      const staticButtonParent = staticButton.closest('.cwc-featured-product__add_to_cart, .cwc_product-template__add_to_cart');
      let staticPriceCurrent = null;
      let staticPriceCompare = null;

      if (staticButtonParent) {
        staticPriceCurrent = staticButtonParent.querySelector('.cwc-featured-product__price-current');
        staticPriceCompare = staticButtonParent.querySelector('.cwc-featured-product__price-compare');
      } else {
        // Fallback: look within the button itself
        staticPriceCurrent = staticButton.querySelector('.cwc-featured-product__price-current');
        staticPriceCompare = staticButton.querySelector('.cwc-featured-product__price-compare');
      }

      // Function to sync prices
      function syncPrices() {
        if (staticPriceCurrent && stickyPriceCurrent) {
          stickyPriceCurrent.textContent = staticPriceCurrent.textContent;
        }
        
        if (stickyPriceCompare) {
          if (staticPriceCompare && staticPriceCompare.textContent.trim() !== '') {
            stickyPriceCompare.textContent = staticPriceCompare.textContent;
            stickyPriceCompare.style.display = '';
          } else {
            stickyPriceCompare.style.display = 'none';
          }
        }
      }

      if (staticPriceCurrent && stickyPriceCurrent) {
        const priceObserver = new MutationObserver(syncPrices);

        priceObserver.observe(staticPriceCurrent, { 
          childList: true, 
          characterData: true, 
          subtree: true 
        });

        // Also observe compare price if it exists
        if (staticPriceCompare) {
          priceObserver.observe(staticPriceCompare, { 
            childList: true, 
            characterData: true, 
            subtree: true 
          });
        }
      }

      // ================================
      // Disabled State Sync
      // ================================
      const buttonObserver = new MutationObserver(function() {
        stickyButton.disabled = staticButton.disabled;
        
        if (staticButton.disabled) {
          stickyButton.textContent = 'Sold Out';
        } else {
          stickyButton.textContent = originalButtonText;
        }
      });

      buttonObserver.observe(staticButton, { 
        attributes: true, 
        attributeFilter: ['disabled'] 
      });
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStickyATC);
  } else {
    initStickyATC();
  }

  // Re-initialize on Shopify section events (for theme editor)
  document.addEventListener('shopify:section:load', initStickyATC);
})();
