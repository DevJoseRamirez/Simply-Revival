document.addEventListener("DOMContentLoaded", function () {
  const section = document.querySelector(".cwc-statistical-proof");
  const statItems = document.querySelectorAll(".cwc-statistical-proof__item");
  let animated = false;

  function animateCountUp(el, target) {
    let start = 0;
    let duration = 2000; // total time
    let increment = target / (duration / 16); // per frame (~60fps)

    function update() {
      start += increment;
      if (start >= target) {
        el.textContent = target + "%";
      } else {
        el.textContent = Math.round(start) + "%";
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  function animateStats() {
    statItems.forEach((item) => {
      const numberEl = item.querySelector(".cwc-statistical-proof__stat-number");
      const progressEl = item.querySelector(
        ".cwc-statistical-proof__progress-bar"
      );

      if (numberEl && progressEl) {
        const target = parseInt(numberEl.dataset.value, 10);

        // Count up numbers
        animateCountUp(numberEl, target);
        // Fill progress bar
        progressEl.style.transition = "width 1.5s ease";
        progressEl.style.width = target + "%";
        // console.log(progressEl)
        // console.log(progressEl.style.width)
      }
    });
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animated) {
          animateStats();
          animated = true;
          obs.disconnect();
        }
      });
    },
    { threshold: 0.5 }
  );

  if (section) observer.observe(section);
});
