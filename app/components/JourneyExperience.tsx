"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { environments } from "../data/journey";

const JourneyScene = dynamic(() => import("./JourneyScene").then((module) => module.JourneyScene), { ssr: false });

export function JourneyExperience() {
  const progress = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const next = scrollable > 0 ? window.scrollY / scrollable : 0;
      progress.current = Math.min(1, Math.max(0, next));
      document.documentElement.style.setProperty("--journey-progress", `${progress.current * 100}%`);
      document.documentElement.style.setProperty("--intro-flight", `${Math.min(1, progress.current * 8)}`);
      setActiveIndex(Math.min(environments.length - 1, Math.max(0, Math.floor(progress.current * 4.15))));
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className={`experience ${ready ? "is-ready" : ""}`}>
      <div className="atmosphere" aria-hidden="true" />
      {!reduceMotion && <JourneyScene progress={progress} onReady={() => setReady(true)} />}
      <header className="site-nav">
        <a className="wordmark" href="#top" aria-label="Digital Garden home"><span>JH</span><span className="wordmark-copy">Systems / 2026</span></a>
        <span className="nav-status"><i /> Available for select projects</span>
        <a className="nav-contact" href="mailto:hello@example.com">Start a conversation <b>↗</b></a>
      </header>
      <aside className="journey-rail" aria-label="Journey progress">
        <span className="rail-label">The journey</span><div className="rail-track"><i /></div><span className="rail-count">0{activeIndex + 1} / 04</span>
      </aside>

      <section className="hero panel" id="top">
        <motion.div className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2, duration: .8 }}><span>A portfolio about curiosity</span><span>Scroll to take flight</span></motion.div>
        <div className="bird-opening">
          <motion.div className="bird-mark" initial={{ opacity: 0, scale: .72 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [.2, .8, .2, 1] }} aria-hidden="true">
            <i className="bird-wing bird-wing-left" /><i className="bird-body" /><i className="bird-wing bird-wing-right" />
          </motion.div>
          <motion.p className="bird-manifesto" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .55, duration: .8 }}>Curiosity finds a way forward.</motion.p>
        </div>
        <motion.h1 initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15, duration: 1, ease: [.2, .8, .2, 1] }}>Follow the<br /><em>curious.</em></motion.h1>
        <motion.p className="hero-copy" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .45, duration: .8 }}>A white bird leads the way through biology, software, business, and intelligent systems.</motion.p>
        <div className="journey-index" aria-label="Journey environments">
          {environments.map((environment) => (
            <a href={`#${environment.slug}`} key={environment.slug}><span className="journey-number">{environment.id}</span><span><strong>{environment.name}</strong><small>{environment.discipline}</small></span></a>
          ))}
        </div>
        <a className="scroll-cue" href="#laboratory"><span>Begin the journey</span><i>↓</i></a>
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
