
import { useEffect, useState } from "react";
import "./App.css";

function Hero() {
  return (
    <main className="hero" id="home">
      <div className="hero-background" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-copy">
          <span className="eyebrow">
            PERSONAL WEBSITE · DLFANX
          </span>

          <h1>
            Welcome to My
            <span> Personal Website.</span>
          </h1>

          <p>
            I'm dlfanx, a game developer,
            designer, and programmer.
          </p>

          <p>
            Explore my work, learn about my
            skills, and get in touch!
          </p>

          <button
            className="glow-button"
            onClick={() =>
              document
                .getElementById("footer")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Learn More <span aria-hidden="true">↗</span>
          </button>
        </div>

        <div className="character-card">
          <div className="character-image">
            <img
              src="/images/anime-girl.webp"
              alt="Hu Tao"
            />
          </div>
          <p>Hu Tao</p>
          <span>Character spotlight</span>
        </div>
      </div>

      <a className="scroll-hint" href="#footer">
        <span className="scroll-mouse" />
        Scroll to explore
      </a>
    </main>
  );
}

function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="socials">
        <a
          href="https://www.youtube.com/@NasaXD"
          target="_blank"
          rel="noreferrer"
        >
          YouTube ↗
        </a>

        <a
          href="https://github.com/dlfanx"
          target="_blank"
          rel="noreferrer"
        >
          GitHub ↗
        </a>

        <a
          href="https://instagram.com/dlfanx"
          target="_blank"
          rel="noreferrer"
        >
          Instagram ↗
        </a>
      </div>

      <p>
        © 2025 dlfanx | All rights reserved
      </p>
    </footer>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 250);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      className="back-to-top"
      aria-label="Back to top"
      onClick={() =>
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    >
      ↑
    </button>
  );
}

export default function App() {
  return (
    <>
      <Hero />
      <Footer />
      <BackToTop />
    </>
  );
}
