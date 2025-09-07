// document.addEventListener("DOMContentLoaded", function () {
//   const cards = document.querySelectorAll(".cwc-reasons__card");

//   cards.forEach((card) => {
//     const button = card.querySelector(".toggle-button");
//     const plus = button.querySelector(".cwc-icon-plus");
//     const minus = button.querySelector(".cwc-icon-minus");

//     button.addEventListener("click", () => {
//       const isOpen = card.classList.contains("open");

//       // close all other cards first
//       cards.forEach((other) => {
//         if (other !== card && other.classList.contains("open")) {
//           other.classList.remove("open");
//           const otherBtn = other.querySelector(".toggle-button");
//           const otherPlus = otherBtn.querySelector(".cwc-icon-plus");
//           const otherMinus = otherBtn.querySelector(".cwc-icon-minus");
//           otherBtn.setAttribute("aria-expanded", "false");
//           otherPlus.style.display = "inline";
//           otherMinus.style.display = "none";
//         }
//       });

//       // toggle this one
//       if (isOpen) {
//         card.classList.remove("open");
//         button.setAttribute("aria-expanded", "false");
//         plus.style.display = "inline";
//         minus.style.display = "none";
//       } else {
//         card.classList.add("open");
//         button.setAttribute("aria-expanded", "true");
//         plus.style.display = "none";
//         minus.style.display = "inline";
//       }
//     });
//   });
// });

document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".cwc-reasons__card");
  const mobileBreakpoint = 991;

  // Function to check if we're on mobile
  function isMobile() {
    return window.innerWidth <= mobileBreakpoint;
  }

  // Function to reset all cards to closed state
  function resetAllCards() {
    cards.forEach((card) => {
      card.classList.remove("open");
      const button = card.querySelector(".toggle-button");
      const plus = button.querySelector(".cwc-icon-plus");
      const minus = button.querySelector(".cwc-icon-minus");
      const back = card.querySelector(".cwc-reasons__back");

      button.setAttribute("aria-expanded", "false");
      plus.style.display = "inline";
      minus.style.display = "none";

      // Reset mobile-specific styles using FAQ pattern
      if (back) {
        back.style.maxHeight = "0";
      }
    });
  }

  // Function to handle desktop flip behavior
  function handleDesktopFlip(card) {
    const isOpen = card.classList.contains("open");

    // Close all other cards first
    cards.forEach((other) => {
      if (other !== card && other.classList.contains("open")) {
        other.classList.remove("open");
        const otherBtn = other.querySelector(".toggle-button");
        const otherPlus = otherBtn.querySelector(".cwc-icon-plus");
        const otherMinus = otherBtn.querySelector(".cwc-icon-minus");
        otherBtn.setAttribute("aria-expanded", "false");
        otherPlus.style.display = "inline";
        otherMinus.style.display = "none";
      }
    });

    // Toggle this card
    const button = card.querySelector(".toggle-button");
    const plus = button.querySelector(".cwc-icon-plus");
    const minus = button.querySelector(".cwc-icon-minus");

    if (isOpen) {
      card.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
      plus.style.display = "inline";
      minus.style.display = "none";
    } else {
      card.classList.add("open");
      button.setAttribute("aria-expanded", "true");
      plus.style.display = "none";
      minus.style.display = "inline";
    }
  }

  // Function to handle mobile accordion behavior (using FAQ pattern)
  function handleMobileAccordion(card) {
    const isOpen = card.classList.contains("open");
    const back = card.querySelector(".cwc-reasons__back");
    const button = card.querySelector(".toggle-button");
    const plus = button.querySelector(".cwc-icon-plus");
    const minus = button.querySelector(".cwc-icon-minus");

    // Close all other cards first (FAQ pattern)
    cards.forEach((other) => {
      if (other !== card && other.classList.contains("open")) {
        const otherBack = other.querySelector(".cwc-reasons__back");
        const otherBtn = other.querySelector(".toggle-button");
        const otherPlus = otherBtn.querySelector(".cwc-icon-plus");
        const otherMinus = otherBtn.querySelector(".cwc-icon-minus");

        // Close other card using FAQ transition pattern
        if (otherBack) {
          otherBack.style.maxHeight = otherBack.scrollHeight + "px";
          setTimeout(() => {
            otherBack.style.maxHeight = "0";
            other.classList.remove("open");
            otherBtn.setAttribute("aria-expanded", "false");
            otherPlus.style.display = "inline";
            otherMinus.style.display = "none";
          }, 10);
        }
      }
    });

    // Toggle this card (FAQ pattern)
    if (isOpen) {
      // Close this card
      if (back) {
        back.style.maxHeight = back.scrollHeight + "px";
        setTimeout(() => {
          back.style.maxHeight = "0";
          card.classList.remove("open");
          button.setAttribute("aria-expanded", "false");
          plus.style.display = "inline";
          minus.style.display = "none";
        }, 10);
      }
    } else {
      // Open this card
      if (back) {
        back.style.maxHeight = back.scrollHeight + "px";
        card.classList.add("open");
        button.setAttribute("aria-expanded", "true");
        plus.style.display = "none";
        minus.style.display = "inline";

        // Reset max-height after transition completes (FAQ pattern)
        back.addEventListener(
          "transitionend",
          () => {
            if (card.classList.contains("open")) {
              back.style.maxHeight = "none"; // reset so it can grow naturally
            }
          },
          { once: true }
        );
      }
    }
  }

  // Main click handler
  cards.forEach((card) => {
    const button = card.querySelector(".toggle-button");

    button.addEventListener("click", () => {
      if (isMobile()) {
        handleMobileAccordion(card);
      } else {
        handleDesktopFlip(card);
      }
    });
  });

  // Handle window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Reset all cards when switching between mobile/desktop
      resetAllCards();
    }, 250);
  });

  // Initialize proper state on load
  resetAllCards();
});
