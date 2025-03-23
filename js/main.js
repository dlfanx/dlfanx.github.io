document.addEventListener("DOMContentLoaded", function () {
  const goUpBtn = document.getElementById("goUpBtn");

  window.addEventListener("scroll", function () {
    const homeSection = document.getElementById("home");
    const rect = homeSection.getBoundingClientRect();

    if (rect.top >= 0) {
      goUpBtn.classList.add("hide");
      setTimeout(() => (goUpBtn.style.display = "none"), 300);
    } else {
      goUpBtn.style.display = "block";
      setTimeout(() => goUpBtn.classList.remove("hide"), 10);
    }
  });
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
