// Sticky header
window.addEventListener('scroll', function() {
    var header = document.querySelector('header');
    header.classList.toggle('sticky', window.scrollY > 0);
    if (window.scrollY > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
  
  // DOMContentLoaded event
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.welcome-content').classList.add('animate');
    document.querySelector('.home-image').classList.add('animate');
  
    const navLinks = document.querySelectorAll('nav ul li a');
  
    function setActiveLink() {
      const currentHash = window.location.hash;
  
      navLinks.forEach(function(link) {
        const linkHash = link.getAttribute('href');
  
        if (linkHash === currentHash) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
  
        link.addEventListener('click', function(event) {
          event.preventDefault();
  
          const targetId = this.getAttribute('href').substring(1);
          const targetElement = document.getElementById(targetId);
  
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop,
              behavior: 'smooth'
            });
          }
        });
      });
    }

    setActiveLink();
  
    window.addEventListener('hashchange', function() {
      setActiveLink();
    });
  });
  
  // Toggle navigation
  const toggleNavButton = document.getElementById('toggle-nav-button');
  const nav = document.querySelector('nav');
  const navLinks = document.querySelectorAll('nav a');
  
  toggleNavButton.addEventListener('click', function() {
    nav.classList.toggle('show');
    toggleNavButton.classList.toggle('show');
  
    // Add event listener to each navigation link
    navLinks.forEach((link) => {
      link.addEventListener('click', function() {
        nav.classList.remove('show');
        toggleNavButton.classList.remove('show');
      });
    });
  });
  