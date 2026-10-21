import "./SkillsProjects.css";
import ShapeGrid from "./components/ShapeGrid/ShapeGrid";

const skills = [
  { name: "React", category: "Frontend" },
  { name: "JavaScript", category: "Language" },
  { name: "Node.js", category: "Backend" },
  { name: "HTML & CSS", category: "Frontend" },
  { name: "Unity3D", category: "Game Dev" },
  { name: "UI / UX Design", category: "Design" },
];

const projects = [
  {
    number: "01",
    title: "Project Nebula",
    description:
      "A fictional web experience exploring modern design, smooth animations, and interactive elements.",
    tags: ["React", "CSS", "Motion"],
    icon: "✦",
    color: "violet",
    status: "Placeholder",
  },
  {
    number: "02",
    title: "Discord Utility Bot",
    description:
      "A sample Discord bot with useful commands, automated responses, and server management tools.",
    tags: ["Node.js", "Discord.js"],
    icon: "⌘",
    color: "blue",
    status: "Placeholder",
  },
  {
    number: "03",
    title: "Pixel Playground",
    description:
      "A fictional mini-game project focused on playful mechanics and a colorful pixel-inspired world.",
    tags: ["C#"],
    icon: "▦",
    color: "pink",
    status: "Placeholder",
  },
];

function SectionHeading({ eyebrow, title, accent, description }) {
  return (
    <div className="sp-heading">
      <span className="sp-eyebrow">{eyebrow}</span>
      <h2>
        {title} <span>{accent}</span>
      </h2>
      <p>{description}</p>
    </div>
  );
}

function SkillsSection() {
  return (
    <section className="sp-section" id="skills">
      <SectionHeading
        eyebrow="WHAT I WORK WITH"
        title="My"
        accent="Skills."
        description="A collection of tools and technologies in my fictional developer toolkit."
      />

      <div className="sp-skills-grid">
        {skills.map((skill, index) => (
          <div
            className="sp-skill-card"
            key={skill.name}
            style={{ "--item-index": index }}
          >
            <span className="sp-skill-dot" />
            <div>
              <h3>{skill.name}</h3>
              <span>{skill.category}</span>
            </div>
            <span className="sp-skill-arrow">↗</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section className="sp-section sp-projects" id="projects">
      <SectionHeading
        eyebrow="A FEW THINGS I'VE IMAGINED"
        title="Featured"
        accent="Projects."
        description="Some placeholder ideas for projects that could live here. The possibilities are endless."
      />

      <div className="sp-projects-grid">
        {projects.map((project, index) => (
          <article
            className={`sp-project-card sp-${project.color}`}
            key={project.number}
            style={{ "--item-index": index }}
          >
            <div className="sp-project-top">
              <span className="sp-project-number">/ {project.number}</span>
              <span className="sp-project-status">{project.status}</span>
            </div>

            <div className="sp-project-art" aria-hidden="true">
              <div className="sp-art-orbit" />
              <span className="sp-project-symbol">{project.icon}</span>
              <span className="sp-art-spark sp-spark-one">✦</span>
              <span className="sp-art-spark sp-spark-two">✧</span>
            </div>

            <div className="sp-project-content">
              <h3>{project.title}</h3>
              <p>{project.description}</p>

              <div className="sp-project-tags">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="sp-project-footer">
                <span>Concept project</span>
                <span className="sp-project-link" aria-hidden="true">
                  ↗
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function SkillsProjects() {
  return (
    
    <div className="sp-container">
    <div className="sp-background">
  <ShapeGrid
      shape="cross"
      direction="none"
      lineColor="#46316b"
      hoverColor="#c196eb"
      hoverFillColor="#ffffff"
      fillOpacity={0.15}
      cellSize={34}
      speed={0.5}
      tiltX={0}
      tiltY={0}
      rainbow={false}
      lineWidth={1}
      radius={3}
      trail={1.2}
      glow={0.2}
      twinkle={0.4}
      fade={1}
      clickCascade
      intro
  />
</div>
      <SkillsSection />
      <ProjectsSection />
    </div>
  );
}
