document.addEventListener("DOMContentLoaded", function () {
  const faqItems = document.querySelectorAll(".cwc-faqs .faq-item");

  faqItems.forEach((item) => {
    const button = item.querySelector(".faq-question");
    const icon = item.querySelector(".toggle-icon");
    const answer = item.querySelector(".faq-answer");

    button.addEventListener("click", () => {
      // Close others (accordion style)
      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove("open");
          other.querySelector(".toggle-icon").textContent = "+";
        }
      });

      // Toggle current
      const isOpen = item.classList.contains("open");
      if (isOpen) {
        item.classList.remove("open");
        icon.textContent = "+";
      } else {
        item.classList.add("open");
        icon.textContent = "–";
      }
    });
  });
});
