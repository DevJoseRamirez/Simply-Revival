document.addEventListener("DOMContentLoaded", function () {
  const swiper = new Swiper(".cwc-testimonials__carousel", {
    slidesPerView: 3,
    spaceBetween: 16,
    loop: true,
    speed: 400,
    navigation: {
      nextEl: ".cwc-testimonials__carousel-next",
      prevEl: ".cwc-testimonials__carousel-prev",
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      0: { slidesPerView: 1 },
      768: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
    },
    on: {
      slideChange(swiper) {
        const progressBar = document.querySelector(
          ".cwc-testimonials__progress-bar"
        );
        if (progressBar) {
          const progress =
            ((swiper.realIndex + 1) / swiper.slides.length) * 100;
          progressBar.style.width = `${progress}%`;
        }
      },
    },
  });
});
