document.addEventListener("DOMContentLoaded", function () {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    const icon = item.querySelector(".toggle-icon");

    question.addEventListener("click", () => {
      // close all others first
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains("open")) {
          const otherAnswer = other.querySelector(".faq-answer");
          const otherIcon = other.querySelector(".toggle-icon");

          otherAnswer.style.maxHeight = otherAnswer.scrollHeight + "px";
          setTimeout(() => {
            otherAnswer.style.maxHeight = "0";
            other.classList.remove("open");
            if (otherIcon) otherIcon.textContent = "+";
          }, 10);
        }
      });

      // toggle this one
      if (item.classList.contains("open")) {
        answer.style.maxHeight = answer.scrollHeight + "px";
        setTimeout(() => {
          answer.style.maxHeight = "0";
          item.classList.remove("open");
          if (icon) icon.textContent = "+";
        }, 10);
      } else {
        answer.style.maxHeight = answer.scrollHeight + "px";
        item.classList.add("open");
        if (icon) icon.textContent = "−";

        answer.addEventListener(
          "transitionend",
          () => {
            if (item.classList.contains("open")) {
              answer.style.maxHeight = "none"; // reset so it can grow naturally
            }
          },
          { once: true }
        );
      }
    });
  });
});
