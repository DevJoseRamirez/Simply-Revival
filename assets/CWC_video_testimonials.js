document.addEventListener("DOMContentLoaded", function () {
  // swiper
  const swiper = new Swiper(".cwc-video-testimonials__carousel", {
    slidesPerView: 5,
    spaceBetween: 10,
    loop: true,
    speed: 400,

    preventClicks: false,
    preventClicksPropagation: false,
    threshold: 8, // tiny wobble ≠ swipe
    touchStartPreventDefault: false,

    navigation: {
      nextEl: ".cwc-video-testimonials__carousel-next",
      prevEl: ".cwc-video-testimonials__carousel-prev",
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: false,
    },
    breakpoints: {
      0: { slidesPerView: 1.5, spaceBetween: 10 },
      768: { slidesPerView: 2.5, spaceBetween: 10 },
      992: { slidesPerView: 3, spaceBetween: 10 },
      1200: { slidesPerView: 5, spaceBetween: 10 },
    },
    on: {
      slideChange(swiper) {
        const progressBar = document.querySelector(
          ".cwc-video-testimonials__progress-bar"
        );
        if (progressBar) {
          const progress =
            ((swiper.realIndex + 1) / swiper.slides.length) * 100;
          progressBar.style.width = `${progress}%`;
        }
      },
    },
  });
  //
  //
  // *****  elements in order of heirhcy:
  // cwc-video-testimonials__swiper-wrapper
  // - for loop starts here
  // cwc-video-testimonials__swiper-slide
  // cwc-video-testimonials__video-card
  // cwc-video-testimonials__video-wrapper
  // - contained here is our video and button whic are sibling elements

  // 2) Helpers
  const TAP_MOVE_TOL = 8; // px

  function pauseOtherVideos(currentVideo) {
    const currentId = currentVideo.dataset.videoId;
    document
      .querySelectorAll(".cwc-video-testimonials__swiper-slide video")
      .forEach((vid) => {
        if (vid.dataset.videoId !== currentId) {
          vid.pause();
          const btn = vid
            .closest(".cwc-video-testimonials__video-wrapper")
            ?.querySelector("button");
          if (btn) btn.style.display = "block";
        }
      });
  }

  // 3) Wire each slide
  document
    .querySelectorAll(".cwc-video-testimonials__swiper-slide")
    .forEach((slide) => {
      const videoEl = slide.querySelector("video");
      const playBtn = slide.querySelector("button");
      if (!videoEl || !playBtn) return;

      const updateBtn = () => {
        playBtn.style.display = videoEl.paused ? "block" : "none";
      };

      // --- Play button: reliable first-tap play, without killing swipe elsewhere
      let downX = 0,
        downY = 0,
        moved = false;

      const lockDrag = () => {
        if (swiper) swiper.allowTouchMove = false;
      };
      const unlockDrag = () => {
        if (swiper) swiper.allowTouchMove = true;
      };

      playBtn.addEventListener(
        "pointerdown",
        (e) => {
          downX = e.clientX;
          downY = e.clientY;
          moved = false;
          lockDrag(); // only lock while finger is on the button
          e.preventDefault(); // requires passive:false
          e.stopPropagation();
        },
        { passive: false }
      );

      playBtn.addEventListener("pointermove", (e) => {
        if (moved) return;
        const dx = Math.abs(e.clientX - downX);
        const dy = Math.abs(e.clientY - downY);
        if (dx > TAP_MOVE_TOL || dy > TAP_MOVE_TOL) {
          moved = true; // user intended to swipe
          unlockDrag(); // give control back to Swiper
        }
      });

      playBtn.addEventListener(
        "pointerup",
        (e) => {
          if (!moved) {
            e.preventDefault();
            e.stopPropagation();
            pauseOtherVideos(videoEl);
            // rAF avoids any race with Swiper’s gesture bookkeeping
            requestAnimationFrame(() => {
              videoEl
                .play()
                .catch((err) => console.warn("play() blocked:", err));
              updateBtn();
            });
          }
          unlockDrag();
        },
        { passive: false }
      );

      playBtn.addEventListener("pointercancel", unlockDrag);
      playBtn.addEventListener("pointerleave", unlockDrag);

      // --- Video surface: allow swipe drags; tap toggles pause only
      let vDownX = 0,
        vDownY = 0,
        vMoved = false;

      videoEl.addEventListener(
        "pointerdown",
        (e) => {
          vDownX = e.clientX;
          vDownY = e.clientY;
          vMoved = false;
          // DO NOT stopPropagation here—Swiper needs to see drags starting on video
        },
        { passive: true }
      );

      videoEl.addEventListener(
        "pointermove",
        (e) => {
          if (vMoved) return;
          const dx = Math.abs(e.clientX - vDownX);
          const dy = Math.abs(e.clientY - vDownY);
          if (dx > TAP_MOVE_TOL || dy > TAP_MOVE_TOL) vMoved = true; // becomes a swipe
        },
        { passive: true }
      );

      videoEl.addEventListener(
        "pointerup",
        (e) => {
          if (!vMoved) {
            // treat as a tap: pause if playing (or toggle if you prefer)
            e.preventDefault();
            if (!videoEl.paused) {
              videoEl.pause();
              updateBtn();
            }
          }
          // no stopPropagation; Swiper already handled swipes
        },
        { passive: false }
      );

      videoEl.addEventListener("play", updateBtn);
      videoEl.addEventListener("pause", updateBtn);
      videoEl.addEventListener("ended", updateBtn);

      updateBtn();
    });
});
