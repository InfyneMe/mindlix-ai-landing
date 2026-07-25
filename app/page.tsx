"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import ChatModal from "./chat-modal";

type Focus = "Research" | "Demand" | "Decisions" | "Growth";
type Accent = "ocean" | "sage" | "violet" | "orange";

const focusOptions: Focus[] = ["Research", "Demand", "Decisions", "Growth"];

const accentOptions: Array<{ id: Accent; label: string; color: string }> = [
  { id: "ocean", label: "Ocean blue", color: "#007dcc" },
  { id: "sage", label: "Sage green", color: "#9fcb98" },
  { id: "violet", label: "Soft violet", color: "#9b8ec7" },
  { id: "orange", label: "Burnt orange", color: "#e76f2e" },
];

const capabilities = [
  {
    index: "01",
    title: "Business R&D",
    label: "Understand the terrain",
    copy: "Turn an open market question into a structured research path that connects customer reality, commercial context, and the decision ahead.",
  },
  {
    index: "02",
    title: "Lead generation",
    label: "Find real demand",
    copy: "Define the segments, buying signals, and outreach priorities that give every conversation a clear commercial reason.",
  },
  {
    index: "03",
    title: "Decision intelligence",
    label: "Choose deliberately",
    copy: "Make assumptions, options, trade-offs, and next actions visible before a consequential business choice is made.",
  },
  {
    index: "04",
    title: "Growth analytics",
    label: "Learn what moves",
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
    copy: "Organize market, customer, competitor, and operating evidence around the question.",
  },
  {
    index: "03",
    title: "Model the decision",
    copy: "Compare viable paths through their assumptions, trade-offs, risk, and learning value.",
  },
  {
    index: "04",
    title: "Move and learn",
    copy: "Translate the chosen direction into a focused action with a signal for the next decision.",
  },
];

const principles = [
  {
    index: "01",
    title: "Traceable thinking",
    copy: "Keep evidence, assumptions, and reasoning visible enough to revisit.",
  },
  {
    index: "02",
    title: "Connected signals",
    copy: "Read research, demand, and performance as parts of the same system.",
  },
  {
    index: "03",
    title: "Human control",
    copy: "Use AI to structure the work while people own the judgement.",
  },
  {
    index: "04",
    title: "Learning over theatre",
    copy: "Prefer focused tests and honest signals to activity that only looks like progress.",
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
  const [accent, setAccent] = useState<Accent>("ocean");
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focus, setFocus] = useState<Focus>("Decisions");
  const [query, setQuery] = useState(
    "Should we enter a new market or deepen our current one?",
  );
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("mindlix-theme");
    const preferredTheme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    const savedAccent = window.localStorage.getItem("mindlix-accent");
    const preferredAccent = accentOptions.some((option) => option.id === savedAccent)
      ? (savedAccent as Accent)
      : "ocean";

    const frame = window.requestAnimationFrame(() => {
      setTheme(preferredTheme);
      setAccent(preferredAccent);
      document.documentElement.dataset.theme = preferredTheme;
      document.documentElement.dataset.accent = preferredAccent;
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("mindlix-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    window.localStorage.setItem("mindlix-accent", accent);
  }, [accent]);

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

    document
      .querySelectorAll(".reveal")
      .forEach((element) => revealObserver.observe(element));

    const desktop = window.matchMedia("(min-width: 1024px)");
    let frame = 0;

    const updateReadingTracks = () => {
      frame = 0;
      const viewport = window.innerHeight;

      document.querySelectorAll<HTMLElement>("[data-highlight-track]").forEach((track) => {
        const highlight = track.querySelector<HTMLElement>("[data-highlight]");
        const words = highlight ? Array.from(highlight.querySelectorAll(".word")) : [];

        if (!desktop.matches) {
          words.forEach((word) => word.classList.add("is-active"));
          return;
        }

        const rect = track.getBoundingClientRect();
        const travel = Math.max(rect.height - viewport, 1);
        const progress = Math.min(1, Math.max(0, (74 - rect.top) / travel));
        const activeCount = Math.max(4, Math.ceil(progress * words.length));

        words.forEach((word, index) => {
          word.classList.toggle("is-active", index < activeCount);
        });
      });

      document.querySelectorAll<HTMLElement>("[data-stage-track]").forEach((track) => {
        const stages = Array.from(track.querySelectorAll<HTMLElement>("[data-stage]"));

        if (!desktop.matches) {
          stages.forEach((stage) => stage.classList.add("is-active"));
          return;
        }

        const rect = track.getBoundingClientRect();
        const travel = Math.max(rect.height - viewport, 1);
        const progress = Math.min(1, Math.max(0, (74 - rect.top) / travel));
        const activeIndex = Math.min(
          stages.length - 1,
          Math.floor(progress * stages.length),
        );

        stages.forEach((stage, index) => {
          stage.classList.toggle("is-active", index === activeIndex);
        });
      });
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateReadingTracks);
    };

    updateReadingTracks();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      revealObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function submitQuery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;
    setChatPrompt(query.trim());
    setChatOpen(true);
  }

  const closeChat = useCallback(() => {
    setChatOpen(false);
    setChatPrompt("");
  }, []);

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
          <a className="brand" href="#top" aria-label="mindlix.in home">
            <span className="brand-mark" aria-hidden="true">
              M
            </span>
            <span className="brand-name">mindlix.in</span>
          </a>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#direction">Direction</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#method">Method</a>
            <a href="#principles">Principles</a>
          </nav>

          <div className="header-actions">
            <a className="header-cta" href="#workbench">
              Ask Mindlix
            </a>

            <div className="appearance-control">
              <button
                className="appearance-toggle"
                type="button"
                aria-label="Open appearance settings"
                aria-expanded={appearanceOpen}
                aria-controls="appearance-popover"
                onClick={() => setAppearanceOpen(!appearanceOpen)}
              >
                <span className="appearance-icon" aria-hidden="true">
                  {theme === "dark" ? "☼" : "☾"}
                </span>
                <span className="appearance-label">Appearance</span>
              </button>
              <div
                className={`appearance-popover${appearanceOpen ? " is-open" : ""}`}
                id="appearance-popover"
                aria-label="Appearance settings"
              >
                <div className="appearance-section">
                  <span>Theme</span>
                  <div className="appearance-mode-row">
                    <button
                      type="button"
                      className={theme === "dark" ? "is-selected" : ""}
                      onClick={() => {
                        setTheme("dark");
                        setAppearanceOpen(false);
                      }}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      className={theme === "light" ? "is-selected" : ""}
                      onClick={() => {
                        setTheme("light");
                        setAppearanceOpen(false);
                      }}
                    >
                      Light
                    </button>
                  </div>
                </div>

                <div className="appearance-section">
                  <span>Accent</span>
                  <div className="appearance-swatch-row">
                    {accentOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={accent === option.id ? "is-selected" : ""}
                        aria-label={option.label}
                        aria-pressed={accent === option.id}
                        style={{ "--swatch": option.color } as React.CSSProperties}
                        onClick={() => {
                          setAccent(option.id);
                          setAppearanceOpen(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
          <div className="hero-sticky">
            <div className="hero-grid" aria-hidden="true" />
            <div className="page-shell hero-main">
              <div className="hero-copy reveal">
                <p className="eyebrow">AI-assisted business intelligence</p>
                <h1 id="hero-title">
                  Research the signal.
                  <br />
                  Decide what <em>moves.</em>
                </h1>
                <p className="hero-intro">
                  mindlix.in brings business R&D, lead generation, decision
                  intelligence, analytics, and growth into one deliberate path.
                </p>
              </div>

              <form
                className="hero-search reveal"
                id="workbench"
                onSubmit={submitQuery}
                aria-label="Ask Mindlix a business question"
              >
                <label htmlFor="business-question">Ask a business question</label>
                <div className="search-shell">
                  <span className="search-mark" aria-hidden="true">
                    ✦
                  </span>
                  <input
                    id="business-question"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ask about a market, lead segment, decision, or growth constraint"
                  />
                  <button type="submit" aria-label="Structure this business question">
                    <span aria-hidden="true">→</span>
                  </button>
                </div>

                <div className="search-lenses" aria-label="Question lens">
                  <span>Lens</span>
                  {focusOptions.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={focus === option ? "is-selected" : ""}
                      aria-pressed={focus === option}
                      onClick={() => setFocus(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>

              </form>
            </div>

            <div className="hero-facts">
              <div className="page-shell hero-facts-grid">
                <div>
                  <span>For</span>
                  <p>Founders, growth leaders, and commercial teams</p>
                </div>
                <div>
                  <span>Across</span>
                  <p>Research, demand, decisions, analytics, and growth</p>
                </div>
                <div>
                  <span>Built around</span>
                  <p>Structured intelligence with human judgement in control</p>
                </div>
                <a href="#direction">
                  Follow the thinking <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          className="direction-track section-rule"
          id="direction"
          data-highlight-track
          aria-labelledby="direction-heading"
        >
          <div className="direction-sticky page-shell split-grid">
            <div className="section-intro">
              <p className="eyebrow">01 / Direction</p>
              <h2 id="direction-heading">A clearer line through uncertainty.</h2>
              <p className="section-note">Scroll slowly. The argument reveals as you read.</p>
            </div>
            <div className="direction-copy">
              <p className="editorial-statement">
                <HighlightText>
                  Business teams rarely lack information. They lack a shared way to turn scattered market signals, customer behaviour, competing priorities, and incomplete evidence into a decision they can explain and act on. mindlix.in connects research, demand, analytics, and growth around the question that matters now.
                </HighlightText>
              </p>
              <p className="support-copy reveal">
                The aim is not another layer of reports. It is a durable operating
                rhythm: ask a better question, assemble relevant evidence, choose
                deliberately, and learn from what happens next.
              </p>
            </div>
          </div>
        </section>

        <section
          className="capability-track section-rule"
          id="capabilities"
          data-stage-track
          aria-labelledby="capabilities-heading"
        >
          <div className="capability-sticky page-shell split-grid">
            <div className="section-intro">
              <p className="eyebrow">02 / Capabilities</p>
              <h2 id="capabilities-heading">
                Four disciplines.
                <br />
                One commercial <em>direction.</em>
              </h2>
              <p className="section-note">
                Each capability becomes active as the page pauses through the section.
              </p>
            </div>

            <div className="capability-list">
              {capabilities.map((capability, index) => (
                <article
                  className={index === 0 ? "is-active" : ""}
                  data-stage
                  key={capability.index}
                >
                  <span>{capability.index}</span>
                  <div>
                    <p>{capability.label}</p>
                    <h3>{capability.title}</h3>
                  </div>
                  <p>{capability.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="method-track section-rule"
          id="method"
          data-stage-track
          aria-labelledby="method-heading"
        >
          <div className="method-sticky page-shell">
            <div className="method-heading">
              <div>
                <p className="eyebrow">03 / Method</p>
                <h2 id="method-heading">A repeatable route from ambiguity to action.</h2>
              </div>
              <p>
                The method keeps every engagement anchored to a decision and every
                decision connected to learning.
              </p>
            </div>

            <div className="method-grid">
              {method.map((step, index) => (
                <article
                  className={index === 0 ? "is-active" : ""}
                  data-stage
                  key={step.index}
                >
                  <span>{step.index}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                  <i aria-hidden="true">↘</i>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="position-track section-rule"
          id="principles"
          data-stage-track
          data-highlight-track
          aria-labelledby="principles-heading"
        >
          <div className="position-sticky page-shell position-grid">
            <div className="position-copy">
              <p className="eyebrow">04 / Position</p>
              <h2 id="principles-heading">
                <HighlightText>
                  Better business intelligence is not more dashboards. It is a shorter, more responsible distance between a question and a move.
                </HighlightText>
              </h2>
            </div>

            <div className="principle-list">
              {principles.map((principle, index) => (
                <article
                  className={index === 0 ? "is-active" : ""}
                  data-stage
                  key={principle.index}
                >
                  <span>{principle.index}</span>
                  <div>
                    <h3>{principle.title}</h3>
                    <p>{principle.copy}</p>
                  </div>
                </article>
              ))}
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
              Use mindlix.in to frame the choice, connect the evidence it needs,
              and define a practical next move.
            </p>
            <a className="primary-action" href="#workbench">
              Ask Mindlix <span aria-hidden="true">↗</span>
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
              <a href="#workbench">Ask Mindlix</a>
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
              <a href="#direction">Why mindlix.in</a>
            </div>
            <div>
              <p className="eyebrow">Company</p>
              <a href="#top">mindlix.in</a>
              <a href="#principles">Responsible AI</a>
              <a href="#start">Start a question</a>
            </div>
          </div>

          <div className="footer-panel">
            <div>
              <span className="footer-parent">An infyne.in product</span>
              <p>Technology built for thoughtful, long-term business progress.</p>
            </div>
            <div>
              <span className="footer-wordmark">mindlix.in</span>
              <a href="#workbench">
                Structure your next decision <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="legal-bar">
            <p>© {new Date().getFullYear()} mindlix.in</p>
            <p>Research clearly. Decide deliberately. Grow responsibly.</p>
          </div>
        </div>
      </footer>
      {chatOpen && (
        <ChatModal initialPrompt={chatPrompt} onClose={closeChat} />
      )}
    </>
  );
}
