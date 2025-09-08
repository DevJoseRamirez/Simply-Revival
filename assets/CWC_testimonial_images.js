document.addEventListener("DOMContentLoaded", function () {
  const swiper = new Swiper(".cwc-testimonial-images__carousel", {
    slidesPerView: 3,
    loop: true,
    speed: 400,
    navigation: {
      nextEl: ".cwc-testimonial-images__carousel-next",
      prevEl: ".cwc-testimonial-images__carousel-prev",
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      0: { slidesPerView: 1.2, spaceBetween: 10 },
      768: { slidesPerView: 2, spaceBetween: 26 },
      1024: { slidesPerView: 3, spaceBetween: 46 },
    },
    on: {
      slideChange(swiper) {
        const progressBar = document.querySelector(
          ".cwc-testimonial-images__progress-bar"
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
