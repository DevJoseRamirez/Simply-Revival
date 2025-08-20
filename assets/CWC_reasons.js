document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".cwc-reasons__card");

  cards.forEach((card) => {
    const button = card.querySelector(".toggle-button");
    const plus = button.querySelector(".cwc-icon-plus");
    const minus = button.querySelector(".cwc-icon-minus");

    button.addEventListener("click", () => {
      const isOpen = card.classList.contains("open");

      // close all other cards first
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

      // toggle this one
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
    });
  });
});
