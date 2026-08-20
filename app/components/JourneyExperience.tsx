"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { environments } from "../data/journey";
import { CinematicHero } from "./CinematicHero";

export function JourneyExperience() {
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const handleVideoReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable > 0 ? window.scrollY / scrollable : 0;
      const progress = Math.min(1, Math.max(0, next));
      document.documentElement.style.setProperty("--journey-progress", `${progress * 100}%`);
      const nextIndex = Math.min(environments.length - 1, Math.max(0, Math.floor(progress * 4.15)));
      if (nextIndex !== activeIndexRef.current) {
        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
      }
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className={`experience ${ready ? "is-ready" : ""}`}>
      <div className="atmosphere" aria-hidden="true" />
      <CinematicHero onReady={handleVideoReady} />
      <header className="site-nav">
        <a className="wordmark" href="#top" aria-label="Digital Garden home"><span>JH</span><span className="wordmark-copy">Systems / 2026</span></a>
        <span className="nav-status"><i /> Available for select projects</span>
        <a className="nav-contact" href="mailto:hello@example.com">Start a conversation <b>↗</b></a>
      </header>
      <aside className="journey-rail" aria-label="Journey progress">
        <span className="rail-label">The journey</span><div className="rail-track"><i /></div><span className="rail-count">0{activeIndex + 1} / 04</span>
      </aside>

      <section className="hero panel" id="top">
        <motion.div className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2, duration: .8 }}><span>Portfolio experience</span><span>Scroll to explore</span></motion.div>
        <motion.h1 initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [.2, .8, .2, 1] }}>The Digital Garden<br /><em>of Systems</em></motion.h1>
        <motion.p className="hero-copy" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, duration: .8 }}>I design intelligent systems at the intersection of biology, software, business, and machine learning.</motion.p>
        <div className="journey-index" aria-label="Journey environments">
          {environments.map((environment) => (
            <a href={`#${environment.slug}`} key={environment.slug}><span className="journey-number">{environment.id}</span><span><strong>{environment.name}</strong><small>{environment.discipline}</small></span></a>
          ))}
        </div>
      </section>

      {environments.map((environment, index) => (
        <section className={`environment-panel environment-${environment.slug}`} id={environment.slug} key={environment.slug} style={{ "--accent": environment.accent } as React.CSSProperties}>
          <motion.div className="environment-card" initial={{ opacity: 0, y: 44 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: .45, once: false }} transition={{ duration: .8, ease: [.2, .8, .2, 1] }}>
            <div className="section-meta"><span>{environment.id} / 04</span><span>{environment.discipline}</span></div>
            <p className="section-kicker">{environment.kicker}</p><h2>{environment.headline}</h2><p className="section-body">{environment.body}</p>
            <div className="project-tags">{environment.projects.map((project) => <span key={project}>{project}</span>)}</div>
          </motion.div>
          <div className="environment-name" aria-hidden="true">{environment.name}</div>
          {index === environments.length - 1 && <footer><span>End of prototype / Beginning of possibility</span><a href="#top">Return to orbit ↑</a></footer>}
        </section>
      ))}
    </main>
  );
}
