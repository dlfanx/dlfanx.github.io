const cardWrapper = document.querySelector(".about-img-wrapper");
const card = document.querySelector(".about-img");
const cursive = document.querySelector(".cursive");

cardWrapper.addEventListener("mousemove",function(e){
  let rect = e.target.getBoundingClientRect();
  let x = e.clientX - rect.left - rect.width / 2;
  let y = e.clientY - rect.top - rect.height / 2;
  
  card.style.transform = `rotateX(${-y / 50}deg) rotateY(${x / 30}deg)`;
});

cardWrapper.addEventListener("mouseleave",function(){
  card.style.transform = `rotateX(0) rotateY(0)`;
  cursive.style.display = "none";
})

card.addEventListener("mousemove",function(e){
  cursive.style.display = "block";
  const rect = cardWrapper.getBoundingClientRect();
  let x = e.clientX - rect.left - cursive.offsetWidth / 2;
  let y = e.clientY - rect.top - cursive.offsetHeight / 2;
  
  cursive.style.transform = `translate(${x}px, ${y}px)`;
})
