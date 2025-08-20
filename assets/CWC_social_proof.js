document.addEventListener("DOMContentLoaded", function () {
  const track = document.querySelector(".carousel-track");
  if (track) {
    track.addEventListener("mouseenter", () => {
      track.style.animationPlayState = "paused";
    });
    track.addEventListener("mouseleave", () => {
      track.style.animationPlayState = "running";
    });
  }
});
