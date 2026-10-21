import { useEffect, useState } from "react";
import "./App.css";
import SkillsProjects from "./SkillsProjects";
import DecayCard from "./components/DecayCard/DecayCard";
import TechText from "./components/TechText/TechText";

function Hero() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 768px)").matches
  );
  
  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
  
    const handleChange = (event) => {
      setIsMobile(event.matches);
    };
  
    media.addEventListener("change", handleChange);
  
    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);
  return (
    <main className="hero" id="home">
      <div className="hero-background" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-copy">
          <span className="eyebrow">PERSONAL WEBSITE · DLFANX</span>

          <h1 className="hero-title">
    Welcome to My
  <span className="tech-text-wrapper">
    <TechText
      text="Personal Website"
      fontWeight={800}
      fontSize={64}
      reveal="letter"
      dashLength={4}
      dashGap={2}
      specks={15}
      intro="none"
      introDuration={2}
      clickKick
      guides={false}
      fontFamily=""
      letterSpacing={0}
      accentColor="currentColor"
      reach={200}
      softness={0.7}
      lineStyle="dashed"
      strokeWidth={1.5}
      speed={1}
      bounce={0.4}
      selection
      labels
      color="#c5a5ff"
      align={isMobile ? "center" : "left"}
      draggable
      sweep
    />
  </span>
</h1>

          <p>I'm dlfanx, a game developer, designer, and programmer.</p>

          <p>Explore my work, learn about my skills, and get in touch!</p>

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
        <DecayCard
          image="/images/anime-girl.webp"
          width={300}
          height={400}
          intensity={0.4}
          sensitivity={0.5}
          hoverDecay={0.15}
          recovery={0.6}
          idle={0.35}
          grain={0.25}
          detail={5}
          pattern={4}
          flow={0}
          chroma={0}
          travel={0}
          tilt={0}
          scope="card"
          radius={16}
          grayscale={false}
          className="character-card"
        >
          <p className="character-name">Hu Tao</p>
          <span className="character-subtitle">Character spotlight</span>
        </DecayCard>
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

        <a href="https://github.com/dlfanx" target="_blank" rel="noreferrer">
          GitHub ↗
        </a>

        <a href="https://instagram.com/dlfanx" target="_blank" rel="noreferrer">
          Instagram ↗
        </a>

        <a
          href="https://discord.gg/zuEfSE8SMN"
          target="_blank"
          rel="noreferrer"
        >
          Discord ↗
        </a>
      </div>

      <p>© 2025 dlfanx | All rights reserved</p>
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
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ↑
    </button>
  );
}

export default function App() {
  return (
    <>
      <Hero />
      <SkillsProjects />
      <Footer />
      <BackToTop />
    </>
  );
}
