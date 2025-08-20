document.addEventListener("DOMContentLoaded", function () {
  const track = document.querySelector(
    ".cwc-video-testimonials .carousel-track"
  );
  const cards = Array.from(
    document.querySelectorAll(".cwc-video-testimonials .video-card")
  );
  const prevBtn = document.querySelector(
    ".cwc-video-testimonials .carousel-prev"
  );
  const nextBtn = document.querySelector(
    ".cwc-video-testimonials .carousel-next"
  );
  const progressBar = document.querySelector(
    ".cwc-video-testimonials .progress-bar"
  );

  if (!track || cards.length === 0) return; // stop if no cards

  let cardWidth, gap, visibleCount, currentIndex;

  function setVisibleCount() {
    visibleCount = window.innerWidth <= 768 ? 1 : 3; // mobile vs desktop
  }

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

    // progress bar ignoring clones
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
          currentIndex = visibleCount;
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
          currentIndex = cards.length;
          updateCarousel(false);
        }
      },
      { once: true }
    );
  }

  // Prevent videos from playing while sliding
  function pauseAllVideos() {
    const videos = track.querySelectorAll("video");
    videos.forEach((v) => v.pause());
  }

  // Init
  setVisibleCount();
  cloneCards();
  currentIndex = visibleCount;
  setDimensions();

  nextBtn.addEventListener("click", () => {
    pauseAllVideos();
    handleNext();
  });
  prevBtn.addEventListener("click", () => {
    pauseAllVideos();
    handlePrev();
  });

  window.addEventListener("resize", () => {
    setVisibleCount();
    setDimensions();
  });
});
