/* ============================================================================
   Screen parts — shared shells used by every artboard in screens.jsx.
   Loaded as a Babel <script>; components are attached to window so the
   canvas file can use them.
   ============================================================================ */

const Frame = ({ mode = "light", children, style }) => (
  <div className="frame" data-mode={mode} style={style}>{children}</div>
);

const NavItem = ({ children, kbd, active }) => (
  <div className={"nav-item" + (active ? " nav-item--active" : "")}>
    <span>{children}</span>
    {kbd ? <span className="nav-item__kbd">{kbd}</span> : null}
  </div>
);

const Nav = ({ active = "draft" }) => (
  <aside className="app__nav">
    <div className="brand">
      Content Coach
      <small>v0.4 · personal</small>
    </div>
    <div className="nav-section">
      <div className="nav-section__label">Workspace</div>
      <NavItem active={active === "draft"} kbd="⌘1">Draft a post</NavItem>
      <NavItem active={active === "ideate"} kbd="⌘2">Ideate</NavItem>
      <NavItem active={active === "search"} kbd="⌘3">Search past posts</NavItem>
      <NavItem active={active === "qc"} kbd="⌘4">Quality check</NavItem>
    </div>
    <div className="nav-section">
      <div className="nav-section__label">Account</div>
      <NavItem active={active === "settings"}>Settings</NavItem>
    </div>
    <div className="nav-foot">
      <span>claude-sonnet-4-5</span>
      <span>47 posts · profile active</span>
    </div>
  </aside>
);

const PageHead = ({ eyebrow, title, right }) => (
  <header className="page-head">
    <div className="page-head__left">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="page-header">{title}</h1>
    </div>
    {right ? <div className="page-head__right">{right}</div> : null}
  </header>
);

const AppShell = ({ mode, active, children }) => (
  <Frame mode={mode}>
    <div className="app">
      <Nav active={active} />
      <main className="app__main">{children}</main>
    </div>
  </Frame>
);

const WizardShell = ({ mode, step, title, lede, children, primaryLabel = "Continue", isLast = false, showSkip = true }) => {
  const steps = [
    { n: 1, label: "Provider" },
    { n: 2, label: "Voice profile" },
    { n: 3, label: "Post corpus" },
  ];
  return (
    <Frame mode={mode}>
      <div style={{ padding: "20px 32px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="brand">
          Content Coach
          <small>setup</small>
        </div>
        <span className="eyebrow">{`Step 0${step} of 03`}</span>
      </div>
      <div className="wizard">
        <div className="wizard__steps">
          {steps.map((s) => (
            <div
              key={s.n}
              className={
                "wizard__step " +
                (s.n < step ? "wizard__step--done" : s.n === step ? "wizard__step--active" : "")
              }
            >
              <span>{`0${s.n}`}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <h1 className="wizard__title">{title}</h1>
        <p className="wizard__lede">{lede}</p>
        {children}
        <footer className="wizard__foot">
          {showSkip ? <button className="btn btn--ghost" type="button">Skip this step</button> : <span />}
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--secondary" type="button">Back</button>
            <button className="btn btn--primary" type="button">{primaryLabel}</button>
          </div>
        </footer>
      </div>
    </Frame>
  );
};

const ActionCard = ({ title, desc, kbd }) => (
  <div className="action">
    <div className="action__head">
      <h3 className="action__title">{title}</h3>
      <span className="action__kbd">{kbd}</span>
    </div>
    <p className="action__desc">{desc}</p>
  </div>
);

const Recent = ({ items }) => (
  <section className="recent">
    <div className="recent__head">
      <h2 className="section-header">Recent</h2>
      <button className="btn btn--ghost btn--sm" type="button">View all</button>
    </div>
    <div className="recent__list">
      {items.map((it, i) => (
        <div className="recent__item" key={i}>
          <span className="recent__when">{it.when}</span>
          <span className="recent__title">{it.title}</span>
          <span className="recent__kind">{it.kind}</span>
        </div>
      ))}
    </div>
  </section>
);

const Finding = ({ n, issue, excerpt, fix }) => (
  <article className="finding">
    <span className="finding__num">{`0${n}`}</span>
    <div className="finding__row">
      <span className="finding__issue">{issue}</span>
      {excerpt ? <p className="finding__excerpt">{excerpt}</p> : null}
      <p className="finding__fix">{fix}</p>
    </div>
  </article>
);

const Banner = ({ title, body, actions }) => (
  <div className="banner">
    <span className="banner__dot" />
    <div>
      <div className="banner__title">{title}</div>
      <div className="banner__body">{body}</div>
    </div>
    <div className="banner__actions">{actions}</div>
  </div>
);

Object.assign(window, {
  Frame, AppShell, Nav, PageHead, WizardShell,
  ActionCard, Recent, Finding, Banner, NavItem,
});
