document.addEventListener("DOMContentLoaded", function () {
  const track = document.querySelector(".carousel-track");
  const cards = Array.from(document.querySelectorAll(".testimonial-card"));
  const prevBtn = document.querySelector(".carousel-prev");
  const nextBtn = document.querySelector(".carousel-next");
  const progressBar = document.querySelector(".progress-bar");

  let cardWidth, gap, visibleCount, currentIndex;

  function setVisibleCount() {
    visibleCount = window.innerWidth <= 768 ? 1 : 3; // mobile vs desktop
  }

  // Clone enough cards for visible viewport
  function cloneCards() {
    const startClones = cards
      .slice(0, visibleCount)
      .map((c) => c.cloneNode(true));
    const endClones = cards.slice(-visibleCount).map((c) => c.cloneNode(true));

    startClones.forEach((c) => track.appendChild(c));
    endClones.reverse().forEach((c) => track.insertBefore(c, track.firstChild));
  }

  function setDimensions() {
    cardWidth = cards[0].offsetWidth;
    gap = parseInt(getComputedStyle(cards[0]).marginRight) || 0;
    updateCarousel(false);
  }

  function updateCarousel(animate = true) {
    track.style.transition = animate ? "transform 0.4s ease" : "none";
    const moveX = -(currentIndex * (cardWidth + gap));
    track.style.transform = `translateX(${moveX}px)`;

    // update progress ignoring clones
    const realIndex =
      (currentIndex - visibleCount + cards.length) % cards.length;
    const progress = ((realIndex + 1) / cards.length) * 100;
    progressBar.style.width = `${progress}%`;
  }

  function handleNext() {
    currentIndex++;
    updateCarousel();

    track.addEventListener(
      "transitionend",
      () => {
        if (currentIndex >= cards.length + visibleCount) {
          track.style.transition = "none";
          currentIndex = visibleCount; // reset back to first real
          updateCarousel(false);
        }
      },
      { once: true }
    );
  }

  function handlePrev() {
    currentIndex--;
    updateCarousel();

    track.addEventListener(
      "transitionend",
      () => {
        if (currentIndex < visibleCount) {
          track.style.transition = "none";
          currentIndex = cards.length; // reset back to last real group
          updateCarousel(false);
        }
      },
      { once: true }
    );
  }

  // Init
  setVisibleCount();
  cloneCards();
  currentIndex = visibleCount; // start after clones
  setDimensions();

  nextBtn.addEventListener("click", handleNext);
  prevBtn.addEventListener("click", handlePrev);
  window.addEventListener("resize", () => {
    setVisibleCount();
    setDimensions();
  });
});
