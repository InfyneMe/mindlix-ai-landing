"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Focus = "Research" | "Demand" | "Decisions" | "Growth";

const focusOptions: Focus[] = ["Research", "Demand", "Decisions", "Growth"];

const focusOutputs: Record<
  Focus,
  { evidence: string; move: string; question: string }
> = {
  Research: {
    question: "Which uncertainty must be reduced before resources are committed?",
    evidence: "Market structure, customer friction, substitutes, and operating constraints.",
    move: "Turn the largest unknown into one focused research sprint.",
  },
  Demand: {
    question: "Which buyer has a real reason to act now?",
    evidence: "Segment fit, intent signals, buying triggers, and reachable decision-makers.",
    move: "Prioritize one segment and test one clear route to conversation.",
  },
  Decisions: {
    question: "Which option creates the best learning-adjusted return?",
    evidence: "Assumptions, trade-offs, reversibility, downside, and decision timing.",
    move: "Compare the viable paths and define the condition that changes the choice.",
  },
  Growth: {
    question: "What is creating movement—and what only looks busy?",
    evidence: "Acquisition quality, conversion behavior, retention signals, and experiment history.",
    move: "Connect one growth constraint to one measurable operating experiment.",
  },
};

const capabilities = [
  {
    index: "01",
    title: "Business R&D",
    copy: "Turn an open market question into a structured research path that connects customer reality, commercial context, and the decision ahead.",
  },
  {
    index: "02",
    title: "Lead generation",
    copy: "Define the right segments, buying signals, and outreach priorities so teams pursue conversations with a clear reason to exist.",
  },
  {
    index: "03",
    title: "Decision intelligence",
    copy: "Make assumptions, options, trade-offs, and next actions visible before a consequential business choice is made.",
  },
  {
    index: "04",
    title: "Growth analytics",
    copy: "Connect commercial signals to a readable growth model that shows what to test, continue, change, or stop.",
  },
];

const method = [
  {
    index: "01",
    title: "Frame the question",
    copy: "Name the decision, the constraint, and what must be true for the work to be useful.",
  },
  {
    index: "02",
    title: "Research the terrain",
    copy: "Organize market, customer, competitor, and operating evidence around the question—not around a generic report.",
  },
  {
    index: "03",
    title: "Model the decision",
    copy: "Compare paths through their assumptions, trade-offs, risk, and learning value.",
  },
  {
    index: "04",
    title: "Move and learn",
    copy: "Translate the chosen direction into a focused action with a signal that informs the next decision.",
  },
];

function HighlightText({ children }: { children: string }) {
  return (
    <span className="scroll-highlight" data-highlight>
      {children.split(" ").map((word, index) => (
        <span className={`word${index < 4 ? " is-active" : ""}`} key={`${word}-${index}`}>
          {word}{" "}
        </span>
      ))}
    </span>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [focus, setFocus] = useState<Focus>("Decisions");
  const [challenge, setChallenge] = useState(
    "Should we enter a new market or deepen our current one?",
  );
  const [brief, setBrief] = useState(() => focusOutputs.Decisions);

  useEffect(() => {
    const saved = window.localStorage.getItem("mindlix-theme");
    const preferred =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    setTheme(preferred);
    document.documentElement.dataset.theme = preferred;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("mindlix-theme", theme);
  }, [theme]);

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    const revealElements = Array.from(document.querySelectorAll(".reveal"));
    revealElements.forEach((element) => revealObserver.observe(element));

    const media = window.matchMedia("(min-width: 1024px)");
    let frame = 0;

    const updateHighlights = () => {
      frame = 0;
      const highlights = Array.from(
        document.querySelectorAll<HTMLElement>("[data-highlight]"),
      );

      highlights.forEach((highlight) => {
        const section = highlight.closest<HTMLElement>("[data-highlight-track]");
        const words = Array.from(highlight.querySelectorAll(".word"));

        if (!section || !media.matches) {
          words.forEach((word) => word.classList.add("is-active"));
          return;
        }

        const rect = section.getBoundingClientRect();
        const viewport = window.innerHeight;
        const travel = Math.max(rect.height - viewport * 0.58, 1);
        const progress = Math.min(
          1,
          Math.max(0, (viewport * 0.7 - rect.top) / travel),
        );
        const activeCount = Math.max(4, Math.ceil(progress * words.length));

        words.forEach((word, index) => {
          word.classList.toggle("is-active", index < activeCount);
        });
      });
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateHighlights);
    };

    updateHighlights();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const conciseChallenge = useMemo(() => {
    const value = challenge.trim();
    if (!value) return "Clarify the business question before choosing a path.";
    return value.length > 110 ? `${value.slice(0, 107)}…` : value;
  }, [challenge]);

  function createBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBrief(focusOutputs[focus]);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <div className="page-shell header-inner">
          <a className="brand" href="#top" aria-label="Mindlix.ai home">
            <span className="brand-mark" aria-hidden="true">
              M
            </span>
            <span className="brand-name">mindlix.ai</span>
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#direction">Direction</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#method">Method</a>
            <a href="#principles">Principles</a>
          </nav>

          <div className="header-actions">
            <a className="header-cta" href="#workbench">
              Build a brief
            </a>
            <button
              className="theme-toggle"
              type="button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <span aria-hidden="true">{theme === "dark" ? "○" : "●"}</span>
            </button>
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
        </div>

        <nav
          className={`mobile-nav${menuOpen ? " is-open" : ""}`}
          id="mobile-navigation"
          aria-label="Mobile navigation"
        >
          <div className="page-shell">
            <a href="#direction" onClick={closeMenu}>
              Direction <span aria-hidden="true">↘</span>
            </a>
            <a href="#capabilities" onClick={closeMenu}>
              Capabilities <span aria-hidden="true">↘</span>
            </a>
            <a href="#method" onClick={closeMenu}>
              Method <span aria-hidden="true">↘</span>
            </a>
            <a href="#principles" onClick={closeMenu}>
              Principles <span aria-hidden="true">↘</span>
            </a>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="hero-track" id="top" aria-labelledby="hero-title">
          <div className="hero-sticky page-shell">
            <div className="hero-grid" />

            <form
              className="decision-signature reveal"
              id="workbench"
              onSubmit={createBrief}
              aria-label="Mindlix decision brief preview"
            >
              <div className="signature-heading">
                <span className="status-dot" aria-hidden="true" />
                <span>Research to decision</span>
                <span className="signature-note">Illustrative workspace</span>
              </div>

              <label htmlFor="challenge">What are you trying to decide?</label>
              <textarea
                id="challenge"
                value={challenge}
                rows={2}
                onChange={(event) => setChallenge(event.target.value)}
              />

              <fieldset>
                <legend>Choose a lens</legend>
                <div className="focus-options">
                  {focusOptions.map((option) => (
                    <button
                      className={focus === option ? "is-selected" : ""}
                      key={option}
                      type="button"
                      aria-pressed={focus === option}
                      onClick={() => setFocus(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button className="signature-action" type="submit">
                Structure the question <span aria-hidden="true">→</span>
              </button>

              <div className="brief-output" aria-live="polite">
                <div>
                  <span>Decision</span>
                  <p>{conciseChallenge}</p>
                </div>
                <div>
                  <span>Research question</span>
                  <p>{brief.question}</p>
                </div>
                <div>
                  <span>Next move</span>
                  <p>{brief.move}</p>
                </div>
              </div>
            </form>

            <div className="hero-copy reveal">
              <p className="eyebrow">AI-assisted business intelligence</p>
              <h1 id="hero-title">
                Understand what matters.
                <br />
                Decide what <em>moves.</em>
              </h1>
            </div>

            <aside className="hero-facts reveal" aria-label="Product facts">
              <div>
                <span>Built for</span>
                <p>Founders, growth leaders, and commercial teams</p>
              </div>
              <div>
                <span>Works across</span>
                <p>Research, demand, decisions, analytics, and growth</p>
              </div>
              <div>
                <span>Operating idea</span>
                <p>Structured intelligence with human judgement in control</p>
              </div>
            </aside>

            <div className="hero-strap">
              <p>Clarity before acceleration.</p>
              <a href="#direction">
                Follow the thinking <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>

        <section
          className="direction-track section-rule"
          id="direction"
          data-highlight-track
          aria-labelledby="direction-heading"
        >
          <div className="page-shell direction-sticky split-grid">
            <div className="sticky-label">
              <p className="eyebrow">01 / Direction</p>
              <h2 id="direction-heading">A clearer line through uncertainty.</h2>
            </div>
            <div className="direction-copy">
              <p className="editorial-statement">
                <HighlightText>
                  Business teams rarely lack information. They lack a shared way to turn scattered market signals, customer behaviour, competing priorities, and incomplete evidence into a decision they can explain and act on. Mindlix.ai connects research, demand, analytics, and growth around the question that matters now.
                </HighlightText>
              </p>
              <p className="support-copy reveal">
                The aim is not another layer of reports. It is a durable operating rhythm:
                ask a better question, assemble relevant evidence, choose deliberately,
                and learn from what happens next.
              </p>
            </div>
          </div>
        </section>

        <section className="capabilities section-rule" id="capabilities" aria-labelledby="capabilities-heading">
          <div className="page-shell">
            <div className="section-heading split-grid reveal">
              <p className="eyebrow">02 / Capabilities</p>
              <div>
                <h2 id="capabilities-heading">The useful work between a question and growth.</h2>
                <p>
                  Four connected disciplines, organized around the business outcome—not
                  isolated software features.
                </p>
              </div>
            </div>

            <div className="capability-list">
              {capabilities.map((capability) => (
                <article className="capability-row reveal" key={capability.index}>
                  <span>{capability.index}</span>
                  <h3>{capability.title}</h3>
                  <p>{capability.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="method section-rule" id="method" aria-labelledby="method-heading">
          <div className="page-shell method-layout split-grid">
            <div className="method-intro">
              <p className="eyebrow">03 / Method</p>
              <h2 id="method-heading">One repeatable path from ambiguity to action.</h2>
              <p>
                A compact method keeps every engagement anchored to a decision and every
                decision connected to learning.
              </p>
            </div>

            <div className="method-steps">
              {method.map((step) => (
                <article className="method-step reveal" key={step.index}>
                  <span>{step.index}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="position-track section-rule"
          id="principles"
          data-highlight-track
          aria-labelledby="principles-heading"
        >
          <div className="page-shell position-sticky position-grid">
            <div>
              <p className="eyebrow">04 / Position</p>
              <h2 className="position-statement" id="principles-heading">
                <HighlightText>
                  Better business intelligence is not more dashboards. It is a shorter, more responsible distance between a question and a move.
                </HighlightText>
              </h2>
            </div>

            <div className="principle-list">
              <article className="reveal">
                <span>01</span>
                <div>
                  <h3>Traceable thinking</h3>
                  <p>Keep evidence, assumptions, and reasoning visible enough to revisit.</p>
                </div>
              </article>
              <article className="reveal">
                <span>02</span>
                <div>
                  <h3>Connected signals</h3>
                  <p>Read research, demand, and performance as parts of the same system.</p>
                </div>
              </article>
              <article className="reveal">
                <span>03</span>
                <div>
                  <h3>Human control</h3>
                  <p>Use AI to structure and accelerate the work while people own the judgement.</p>
                </div>
              </article>
              <article className="reveal">
                <span>04</span>
                <div>
                  <h3>Learning over theatre</h3>
                  <p>Prefer focused tests and honest signals to activity that only looks like progress.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="conversion section-rule" id="start" aria-labelledby="conversion-heading">
          <div className="page-shell conversion-inner reveal">
            <p className="eyebrow">Start with the question</p>
            <h2 id="conversion-heading">
              Bring your next business decision into <em>focus.</em>
            </h2>
            <p>
              Use the Mindlix.ai brief to frame the choice, the evidence it needs, and a
              practical next move.
            </p>
            <a className="primary-action" href="#workbench">
              Build a decision brief <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-shell">
          <nav className="footer-jumps" aria-label="Footer section links">
            <a href="#direction">
              Direction <span aria-hidden="true">01</span>
            </a>
            <a href="#capabilities">
              Capabilities <span aria-hidden="true">02</span>
            </a>
            <a href="#method">
              Method <span aria-hidden="true">03</span>
            </a>
            <a href="#principles">
              Principles <span aria-hidden="true">04</span>
            </a>
          </nav>

          <div className="footer-directory">
            <div>
              <p className="eyebrow">Explore</p>
              <a href="#top">Overview</a>
              <a href="#workbench">Decision brief</a>
              <a href="#capabilities">Capabilities</a>
            </div>
            <div>
              <p className="eyebrow">Disciplines</p>
              <a href="#capabilities">Business R&D</a>
              <a href="#capabilities">Lead generation</a>
              <a href="#capabilities">Growth analytics</a>
            </div>
            <div>
              <p className="eyebrow">Operating model</p>
              <a href="#method">Four-step method</a>
              <a href="#principles">Product principles</a>
              <a href="#direction">Why Mindlix.ai</a>
            </div>
            <div>
              <p className="eyebrow">Company</p>
              <a href="#top">Mindlix.ai</a>
              <a href="#principles">Responsible AI</a>
              <a href="#start">Start a brief</a>
            </div>
          </div>

          <div className="footer-panel">
            <div>
              <span className="footer-parent">An Infyne product</span>
              <p>Technology built for thoughtful, long-term business progress.</p>
            </div>
            <div>
              <span className="footer-wordmark">mindlix.ai</span>
              <a href="#workbench">
                Structure your next decision <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="legal-bar">
            <p>© {new Date().getFullYear()} Mindlix.ai</p>
            <p>Research clearly. Decide deliberately. Grow responsibly.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
