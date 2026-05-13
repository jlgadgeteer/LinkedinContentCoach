/* ============================================================================
   Screens — every artboard for LinkedIn Content Coach.
   Uses tokens (screens.css) + primitives + shells (screen-parts.jsx).
   ============================================================================ */

// Representative draft used in several states. Single source so all
// versions stay in sync if we revise the copy.
const SAMPLE_DRAFT_PARAS = [
  "Three things I tell every first-time founder about hiring senior engineers.",
  "First, the resume is the wrong artifact to read. Read the side projects. Read the talks. Read the open-source contributions. The resume tells you what they were paid to do. The rest tells you what they would do for free.",
  "Second, the technical interview is mostly theater after a certain seniority. By the time someone has shipped three or four production systems you already know they can write code. What you don't know is whether they can sit with ambiguity for a week without getting anxious. Ask about that.",
  "Third, comp doesn't motivate seniors. Comp filters them. Pay market, then talk about everything else.",
];

const SAMPLE_DRAFT_INLINE = SAMPLE_DRAFT_PARAS.join("\n\n");

// ============================================================
// 01 · Login
// ============================================================
function Login({ mode }) {
  return (
    <Frame mode={mode}>
      <div style={{ position: "absolute", top: 28, left: 32 }}>
        <div className="brand">
          Content Coach
          <small>v0.4 · personal</small>
        </div>
      </div>
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px",
      }}>
        <div style={{
          width: 420,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: "40px 40px 32px",
        }}>
          <h1 className="serif" style={{
            fontSize: 32, lineHeight: 1.15, letterSpacing: "-0.018em",
            fontWeight: 400, color: "var(--color-fg)", marginBottom: 8,
          }}>
            Welcome back.
          </h1>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 28 }}>
            Your personal instance. Sign in with the password you set during deploy.
          </p>
          <label className="label" htmlFor="pw">Password</label>
          <input className="input input--lg" id="pw" type="password" defaultValue="••••••••••••" />
          <button className="btn btn--primary btn--lg btn--block" type="button" style={{ marginTop: 16 }}>
            Continue
          </button>
          <p className="faint mono" style={{ fontSize: 11, lineHeight: 1.6, marginTop: 24, letterSpacing: "0.02em" }}>
            Self-hosted. Not a public service.<br />
            Forgot it? Reset in your Vercel project's environment variables.
          </p>
        </div>
      </div>
      <div style={{
        position: "absolute", bottom: 20, right: 32,
        fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-fg-faint)",
      }}>
        github.com/your-org/content-coach
      </div>
    </Frame>
  );
}

// ============================================================
// 02 · Setup wizard — three steps
// ============================================================
function SetupStep1({ mode }) {
  return (
    <WizardShell mode={mode} step={1}
      title="Connect a model."
      lede="Bring your own API key. Stored encrypted in your Vercel environment, never on a server we control."
      primaryLabel="Test and continue">
      <div style={{ display: "grid", gap: 20 }}>
        <div>
          <label className="label" htmlFor="prov">Provider</label>
          <select className="select" id="prov" defaultValue="anth">
            <option value="anth">Anthropic · claude-sonnet-4-5</option>
            <option value="anth-h">Anthropic · claude-haiku-4-5</option>
            <option value="oai">OpenAI · gpt-5</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="key">API key</label>
          <input className="input" id="key" type="password" defaultValue="sk-ant-api03-•••••••••••••••••••••••••••••••••" />
          <p className="help">We send a single test request to confirm it works, then encrypt it.</p>
        </div>
      </div>
    </WizardShell>
  );
}

function SetupStep2({ mode }) {
  const profile = `# Voice profile

I write for senior operators. Founders, CTOs, heads of platform.

## Tone
- Direct. No corporate hedging.
- Specific over general. A real example beats a framework.
- Confident but not certain. I'll change my mind in public.

## Themes I return to
- Hiring senior engineers
- The cost of premature scaling
- What I got wrong as a first-time founder

## Things I never write
- Listicles dressed up as essays
- The phrase "in today's fast-paced world"
- Anything about hustle culture
`;
  return (
    <WizardShell mode={mode} step={2}
      title="Write a voice profile."
      lede="A short markdown file describing how you write. Tone, themes, what you'd never post. The model reads this every time. You can edit it anytime from Settings.">
      <label className="label" htmlFor="voice">
        Profile <span className="hint">markdown · ~120 lines is plenty</span>
      </label>
      <textarea className="textarea textarea--mono" id="voice" style={{ minHeight: 280 }} defaultValue={profile} />
      <p className="help">An example profile is pre-filled. Edit it, replace it, or skip for now and add yours later.</p>
    </WizardShell>
  );
}

function SetupStep3({ mode }) {
  const sample = `{
  "posts": [
    {
      "id": "urn:li:activity:7195443201",
      "publishedAt": "2025-02-14T08:12:00Z",
      "text": "Three things I tell every first-time founder about hiring senior engineers.\\n\\nFirst, the resume is the wrong artifact to read…"
    },
    {
      "id": "urn:li:activity:7194880023",
      "publishedAt": "2025-02-09T17:45:00Z",
      "text": "We don't decide what to ship. We notice what is already moving and clear the path…"
    },
    … 45 more
  ]
}`;
  return (
    <WizardShell mode={mode} step={3} isLast
      title="Paste your post history."
      lede="Export from LinkedIn (Settings → Get a copy of your data) and paste the posts.json contents. We index locally for voice examples. Nothing leaves your instance."
      primaryLabel="Finish setup">
      <label className="label" htmlFor="corpus">
        Corpus <span className="hint">json · up to ~5MB</span>
      </label>
      <textarea className="textarea textarea--mono" id="corpus" style={{ minHeight: 280 }} defaultValue={sample} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <p className="help" style={{ margin: 0 }}>Detected: 47 posts. Oldest 2023-06-04. Newest 2025-02-14.</p>
        <button className="btn btn--ghost btn--sm" type="button">Load from file</button>
      </div>
    </WizardShell>
  );
}

// ============================================================
// 03 · Workspace — empty
// ============================================================
function WorkspaceEmpty({ mode }) {
  return (
    <AppShell mode={mode} active="">
      <div className="content content--wide">
        <PageHead
          eyebrow="Workspace"
          title="What are you writing today?"
          right={
            <>
              <span className="badge">47 posts loaded</span>
              <span className="badge badge--success">Voice profile active</span>
            </>
          }
        />
        <div className="actions">
          <ActionCard kbd="⌘1" title="Draft a post"
            desc="Topic in, draft out, in your voice. Returns a single post in serif." />
          <ActionCard kbd="⌘2" title="Ideate"
            desc="Five post angles from a rough idea. Pick one, send it to Draft." />
          <ActionCard kbd="⌘3" title="Search past posts"
            desc="Find what you've already said. Semantic, not keyword." />
          <ActionCard kbd="⌘4" title="Quality check"
            desc="Paste a draft. Get a short list of issues and fixes." />
        </div>
        <p className="faint" style={{ fontSize: 12, marginTop: 32, lineHeight: 1.55 }}>
          Nothing here yet. Your drafts and checks will show up below once you run one.
        </p>
      </div>
    </AppShell>
  );
}

// ============================================================
// 04 · Workspace — populated
// ============================================================
function WorkspacePopulated({ mode }) {
  const items = [
    { when: "2 hr ago",  kind: "Draft",    title: "Three things I tell every first-time founder about hiring seniors" },
    { when: "Yesterday", kind: "QC",       title: "Why we stopped writing weekly status reports (draft v3)" },
    { when: "Yesterday", kind: "Ideate",   title: "Angles on: managing a team through a rewrite" },
    { when: "Mon",       kind: "Search",   title: "\"premature scaling\" — 4 matches" },
    { when: "Feb 09",    kind: "Draft",    title: "We don't decide what to ship. We notice what is already moving." },
  ];
  return (
    <AppShell mode={mode} active="">
      <div className="content content--wide">
        <PageHead
          eyebrow="Workspace"
          title="What are you writing today?"
          right={
            <>
              <span className="badge">47 posts loaded</span>
              <span className="badge badge--success">Voice profile active</span>
            </>
          }
        />
        <div className="actions">
          <ActionCard kbd="⌘1" title="Draft a post"
            desc="Topic in, draft out, in your voice." />
          <ActionCard kbd="⌘2" title="Ideate"
            desc="Five post angles from a rough idea." />
          <ActionCard kbd="⌘3" title="Search past posts"
            desc="Find what you've already said." />
          <ActionCard kbd="⌘4" title="Quality check"
            desc="Paste a draft. Get a short list of fixes." />
        </div>
        <Recent items={items} />
      </div>
    </AppShell>
  );
}

// ============================================================
// 05 · Action · Draft — idle, streaming, complete
// ============================================================
function ActionDraftIdle({ mode }) {
  return (
    <AppShell mode={mode} active="draft">
      <div className="content">
        <PageHead
          eyebrow="Workspace › Draft"
          title="Draft a post"
          right={<span className="faint mono" style={{ fontSize: 11, letterSpacing: "0.04em" }}>USING VOICE · 47 EXAMPLES</span>}
        />
        <label className="label" htmlFor="topic">Topic <span className="hint">a sentence or two</span></label>
        <textarea
          id="topic"
          className="textarea"
          style={{ minHeight: 96 }}
          placeholder="What's the post about? Don't worry about phrasing. Be specific about the idea."
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span className="faint mono" style={{ fontSize: 11 }}>⌘↵ to draft</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--ghost" type="button">Clear</button>
            <button className="btn btn--primary" type="button" disabled>Draft</button>
          </div>
        </div>
        <div style={{
          marginTop: 36,
          border: "1px dashed var(--color-border)",
          borderRadius: 8,
          padding: "44px 24px",
          textAlign: "center",
        }}>
          <p className="faint mono" style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Output will appear here
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function ActionDraftStreaming({ mode }) {
  return (
    <AppShell mode={mode} active="draft">
      <div className="content">
        <PageHead
          eyebrow="Workspace › Draft"
          title="Draft a post"
          right={<span className="badge badge--accent">Streaming</span>}
        />
        <label className="label" htmlFor="topic2">Topic</label>
        <textarea
          id="topic2"
          className="textarea"
          style={{ minHeight: 72 }}
          defaultValue="What I tell first-time founders about hiring senior engineers. Resumes are the wrong artifact. Comp filters, doesn't motivate."
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span className="faint mono" style={{ fontSize: 11 }}>⌘↵ to draft</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--ghost" type="button">Clear</button>
            <button className="btn btn--primary" type="button" disabled>
              <span className="dot-pulse" />Drafting
            </button>
          </div>
        </div>
        <div className="output" style={{ marginTop: 28 }}>
          <div className="output-head">
            <span className="output-meta is-live">Drafting</span>
            <button className="btn btn--ghost btn--sm" type="button">Stop</button>
          </div>
          <div className="output-body">
            <p>Three things I tell every first-time founder about hiring senior engineers.</p>
            <p>
              First, the resume is the wrong artifact to read. Read the side projects. Read the talks. Read the open-source contributions. The resume tells you what they were paid to do. The rest tells you what they would do for free<span className="caret" />
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ActionDraftComplete({ mode }) {
  return (
    <AppShell mode={mode} active="draft">
      <div className="content">
        <PageHead
          eyebrow="Workspace › Draft"
          title="Draft a post"
          right={<span className="faint mono" style={{ fontSize: 11, letterSpacing: "0.04em" }}>312 TOKENS · 2.1s</span>}
        />
        <label className="label" htmlFor="topic3">Topic</label>
        <textarea
          id="topic3"
          className="textarea"
          style={{ minHeight: 56 }}
          defaultValue="What I tell first-time founders about hiring senior engineers. Resumes are the wrong artifact."
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button className="btn btn--ghost" type="button">Clear</button>
          <button className="btn btn--secondary" type="button">Draft again</button>
        </div>

        <div className="output" style={{ marginTop: 28 }}>
          <div className="output-head">
            <span className="output-meta is-done">Complete · 312 tokens</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn--ghost btn--sm" type="button">Quality check</button>
              <button className="btn btn--ghost btn--sm" type="button">Copy</button>
            </div>
          </div>
          <article className="post">
            <span className="post-meta">Draft · 184 words</span>
            {SAMPLE_DRAFT_PARAS.map((p, i) => <p key={i}>{p}</p>)}
          </article>
        </div>
      </div>
    </AppShell>
  );
}

// ============================================================
// 06 · Action · Quality check
// ============================================================
function ActionQualityCheck({ mode }) {
  const findings = [
    {
      n: 1,
      issue: "Generic AI opening",
      excerpt: "In today's fast-paced startup environment, hiring senior engineers is more important than ever.",
      fix: <><b>Cut the first sentence.</b> The second sentence is your actual lead. Start with "Three things I tell every first-time founder about hiring senior engineers."</>,
    },
    {
      n: 2,
      issue: "Phrase you've flagged: \"at the end of the day\"",
      excerpt: "At the end of the day, what matters is whether they can sit with ambiguity.",
      fix: <><b>Drop the phrase.</b> Your voice profile lists this as a tell. The sentence reads stronger as: "What matters is whether they can sit with ambiguity."</>,
    },
    {
      n: 3,
      issue: "Bulleted list inside a narrative",
      excerpt: "• Resume is theater\n• Tech interview is theater\n• Comp filters",
      fix: <><b>Unbullet.</b> You've never posted a bulleted list. Rewrite as three numbered paragraphs to match your past structure.</>,
    },
    {
      n: 4,
      issue: "Closing CTA out of voice",
      excerpt: "What do you think? Let me know in the comments.",
      fix: <><b>Remove.</b> 0 of 47 past posts end with a comment CTA.</>,
    },
  ];

  return (
    <AppShell mode={mode} active="qc">
      <div className="content">
        <PageHead
          eyebrow="Workspace › Quality check"
          title="Quality check a draft"
          right={<span className="faint mono" style={{ fontSize: 11 }}>4 ISSUES FOUND</span>}
        />
        <label className="label" htmlFor="qcdraft">Paste a draft</label>
        <textarea id="qcdraft" className="textarea" style={{ minHeight: 140 }} defaultValue={SAMPLE_DRAFT_INLINE} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button className="btn btn--ghost" type="button">Clear</button>
          <button className="btn btn--primary" type="button">Check again</button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "32px 0 14px" }}>
          <h2 className="section-header">Findings</h2>
          <span className="faint mono" style={{ fontSize: 11 }}>ordered by severity</span>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {findings.map((f) => <Finding key={f.n} {...f} />)}
        </div>
      </div>
    </AppShell>
  );
}

// ============================================================
// 07 · Action · Ideate (compact, to show variation)
// ============================================================
function ActionIdeate({ mode }) {
  const angles = [
    { n: 1, title: "The technical interview is theater above a certain seniority.", note: "Hot take. Builds on your 2024-09 thread." },
    { n: 2, title: "Why I read side projects, not resumes.", note: "Frames a habit you've mentioned but never posted about." },
    { n: 3, title: "Comp doesn't motivate seniors. Comp filters them.", note: "Quotable. Strong opening line." },
    { n: 4, title: "Hiring as a forecasting problem.", note: "More analytical. Closer to your 2024-Q4 register." },
    { n: 5, title: "The interview question you ask is the team you become.", note: "Aphoristic. Risk: lands as Twitter-bait." },
  ];
  return (
    <AppShell mode={mode} active="ideate">
      <div className="content">
        <PageHead
          eyebrow="Workspace › Ideate"
          title="Ideate post angles"
        />
        <label className="label" htmlFor="seed">Rough idea</label>
        <textarea id="seed" className="textarea" style={{ minHeight: 64 }}
          defaultValue="Something about hiring senior engineers and why most of the standard advice is wrong." />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button className="btn btn--ghost" type="button">Clear</button>
          <button className="btn btn--primary" type="button">Five angles</button>
        </div>
        <div className="output" style={{ marginTop: 28 }}>
          <div className="output-head">
            <span className="output-meta is-done">Five angles · pick one to draft</span>
            <button className="btn btn--ghost btn--sm" type="button">Regenerate</button>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {angles.map((a) => (
              <div key={a.n} style={{
                display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 14, alignItems: "baseline",
                padding: "10px 0", borderBottom: "1px solid var(--color-border)",
              }}>
                <span className="faint mono" style={{ fontSize: 11 }}>{`0${a.n}`}</span>
                <div>
                  <p style={{ color: "var(--color-fg)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.003em" }}>{a.title}</p>
                  <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>{a.note}</p>
                </div>
                <button className="btn btn--secondary btn--sm" type="button">Draft this</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ============================================================
// 08 · Action · Search
// ============================================================
function ActionSearch({ mode }) {
  const hits = [
    { when: "2024-09-12", excerpt: "Premature scaling kills more startups than competition does. The mistake is hiring before you've found the loop that compounds.", score: 0.91 },
    { when: "2024-06-30", excerpt: "I keep meeting founders who scale headcount because the board wants them to, not because the work has caught up to it.", score: 0.84 },
    { when: "2023-11-04", excerpt: "Three signs you're scaling too early: the org chart leads product, hiring outpaces shipping, and your standups feel like status meetings.", score: 0.78 },
    { when: "2023-08-21", excerpt: "When growth is the goal, you'll find ways to measure it. When the goal is the loop, growth shows up on its own.", score: 0.61 },
  ];
  return (
    <AppShell mode={mode} active="search">
      <div className="content">
        <PageHead
          eyebrow="Workspace › Search"
          title="Search past posts"
          right={<span className="faint mono" style={{ fontSize: 11 }}>SEMANTIC · 47 INDEXED</span>}
        />
        <label className="label" htmlFor="q">Query</label>
        <input id="q" className="input input--lg" defaultValue="premature scaling" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button className="btn btn--ghost" type="button">Clear</button>
          <button className="btn btn--primary" type="button">Search</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "28px 0 12px" }}>
          <h2 className="section-header">4 matches</h2>
          <span className="faint mono" style={{ fontSize: 11 }}>cosine ≥ 0.6</span>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {hits.map((h, i) => (
            <article key={i} className="card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className="faint mono" style={{ fontSize: 11 }}>{h.when}</span>
                <span className="faint mono" style={{ fontSize: 11 }}>{h.score.toFixed(2)}</span>
              </div>
              <p className="serif" style={{ fontSize: 15, lineHeight: 1.55, color: "var(--color-fg)" }}>{h.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ============================================================
// 09 · Settings
// ============================================================
function Settings({ mode }) {
  const profile = `# Voice profile

I write for senior operators. Founders, CTOs, heads of platform.

## Tone
- Direct. No corporate hedging.
- Specific over general. A real example beats a framework.

## Themes I return to
- Hiring senior engineers
- The cost of premature scaling`;
  return (
    <AppShell mode={mode} active="settings">
      <div className="content">
        <PageHead eyebrow="Account" title="Settings"
          right={<span className="badge">Last saved 4 min ago</span>}
        />

        <section className="settings-card" id="provider">
          <div className="settings-card__head">
            <h2 className="settings-card__title">Provider and API key</h2>
            <span className="faint mono" style={{ fontSize: 11 }}>01</span>
          </div>
          <p className="settings-card__desc">Bring your own. Keys are encrypted in your Vercel project's environment.</p>
          <div className="field-row">
            <div>
              <label className="label" htmlFor="s-prov">Provider</label>
              <select className="select" id="s-prov" defaultValue="anth">
                <option value="anth">Anthropic · claude-sonnet-4-5</option>
                <option value="oai">OpenAI · gpt-5</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="s-key">API key</label>
              <input className="input" id="s-key" type="password" defaultValue="sk-ant-api03-•••••••••••••••••••••••••••••••••" />
            </div>
          </div>
          <div className="settings-card__foot">
            <span className="faint mono" style={{ fontSize: 11 }}>Last verified 4 min ago</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn--secondary" type="button">Test connection</button>
              <button className="btn btn--primary" type="button">Save provider</button>
            </div>
          </div>
        </section>

        <section className="settings-card" id="voice">
          <div className="settings-card__head">
            <h2 className="settings-card__title">Voice profile</h2>
            <span className="faint mono" style={{ fontSize: 11 }}>02</span>
          </div>
          <p className="settings-card__desc">A markdown file describing how you write. Edited live, used on every request.</p>
          <textarea className="textarea textarea--mono" style={{ minHeight: 180 }} defaultValue={profile} />
          <div className="settings-card__foot">
            <span className="faint mono" style={{ fontSize: 11 }}>108 lines · 2.4 KB</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn--ghost" type="button">Revert</button>
              <button className="btn btn--primary" type="button">Save voice</button>
            </div>
          </div>
        </section>

        <section className="settings-card" id="corpus">
          <div className="settings-card__head">
            <h2 className="settings-card__title">Post corpus</h2>
            <span className="faint mono" style={{ fontSize: 11 }}>03</span>
          </div>
          <p className="settings-card__desc">47 posts indexed. Used as voice examples and searchable from the workspace.</p>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
            background: "var(--color-sunken)", border: "1px solid var(--color-border)",
            borderRadius: 6, padding: "16px 18px", marginBottom: 16,
          }}>
            <div>
              <p className="faint mono" style={{ fontSize: 11, marginBottom: 4 }}>POSTS</p>
              <p style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.013em" }}>47</p>
            </div>
            <div>
              <p className="faint mono" style={{ fontSize: 11, marginBottom: 4 }}>RANGE</p>
              <p style={{ fontSize: 14 }}>Jun 2023 → Feb 2025</p>
            </div>
            <div>
              <p className="faint mono" style={{ fontSize: 11, marginBottom: 4 }}>INDEXED</p>
              <p style={{ fontSize: 14 }}>Feb 14, 2025 · 09:21</p>
            </div>
          </div>
          <div className="settings-card__foot" style={{ borderTop: "none", paddingTop: 0, marginTop: 0 }}>
            <button className="btn btn--ghost btn--sm" type="button">Re-index</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn--secondary" type="button">Replace corpus</button>
              <button className="btn btn--secondary" type="button">Add posts</button>
            </div>
          </div>
        </section>

        <section className="settings-card" id="backup">
          <div className="settings-card__head">
            <h2 className="settings-card__title">Backup and restore</h2>
            <span className="faint mono" style={{ fontSize: 11 }}>04</span>
          </div>
          <p className="settings-card__desc">
            Export everything as a single JSON file: voice profile, corpus, provider config. Restore on a new deploy without losing state.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn--secondary" type="button">Restore from file</button>
            <button className="btn btn--secondary" type="button">Download backup</button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

// ============================================================
// 10 · Error & streaming states
// ============================================================
function StateBanner({ mode }) {
  return (
    <AppShell mode={mode} active="draft">
      <div className="content">
        <Banner
          title="API key invalid."
          body="Anthropic returned 401. Update the key in Settings → Provider, or check that your Vercel deploy redeployed after the env var change."
          actions={
            <>
              <button className="btn btn--ghost btn--sm" type="button">Dismiss</button>
              <button className="btn btn--secondary btn--sm" type="button">Open settings</button>
            </>
          }
        />
        <p className="faint" style={{ marginTop: 24, fontSize: 13 }}>
          The rest of the workspace is below, unchanged. Errors are specific, never alarming.
        </p>
      </div>
    </AppShell>
  );
}

function StateFail({ mode }) {
  return (
    <Frame mode={mode}>
      <div style={{ padding: 40 }}>
        <div className="output">
          <div className="output-head">
            <span className="output-meta is-fail">Request failed · 529</span>
            <button className="btn btn--secondary btn--sm" type="button">Try again</button>
          </div>
          <div className="output-body">
            <p>
              Anthropic returned a 529 (overloaded) after 142 tokens. Your draft so far is below.
            </p>
            <p style={{ color: "var(--color-fg-muted)" }}>
              Three things I tell every first-time founder about hiring senior engineers. First, the resume is the wrong artifact to read. Read the side projects, the talks, the open-source…
            </p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function StateMobile({ mode }) {
  return (
    <Frame mode={mode} style={{ minHeight: "100%" }}>
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 24px",
        borderBottom: "1px solid var(--color-border)",
      }}>
        <div className="brand" style={{ fontSize: 15 }}>
          Content Coach
          <small style={{ fontSize: 9 }}>v0.4</small>
        </div>
        <button className="btn btn--ghost btn--sm" type="button">Menu</button>
      </header>
      <main style={{ padding: "28px 24px 40px" }}>
        <span className="eyebrow" style={{ display: "block", marginBottom: 8 }}>Workspace</span>
        <h1 className="page-header" style={{ fontSize: 24, lineHeight: "30px", marginBottom: 8 }}>
          What are you writing today?
        </h1>
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          <span className="badge">47 posts</span>
          <span className="badge badge--success">Profile active</span>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <ActionCard kbd="" title="Draft a post" desc="Topic in, draft out, in your voice." />
          <ActionCard kbd="" title="Ideate" desc="Five post angles from a rough idea." />
          <ActionCard kbd="" title="Search past posts" desc="Find what you've already said." />
          <ActionCard kbd="" title="Quality check" desc="Paste a draft. Get a short list of fixes." />
        </div>
      </main>
    </Frame>
  );
}

// ============================================================
// Canvas
// ============================================================
function App() {
  return (
    <DesignCanvas title="LinkedIn Content Coach · Screens" subtitle="Every screen, both modes. Same tokens, same primitives.">

      <DCSection id="login" title="01 · Login" subtitle="Calm welcome. One field. A small note that this is self-hosted.">
        <DCArtboard id="login-l" label="Login · Light" width={1040} height={640}><Login mode="light" /></DCArtboard>
        <DCArtboard id="login-d" label="Login · Dark"  width={1040} height={640}><Login mode="dark"  /></DCArtboard>
      </DCSection>

      <DCSection id="setup" title="02 · First-time setup" subtitle="Three steps. Skippable. Progress is a thin top rule, not a bouncing bar.">
        <DCArtboard id="setup-1-l" label="01 · Provider · Light"      width={1080} height={720}><SetupStep1 mode="light" /></DCArtboard>
        <DCArtboard id="setup-1-d" label="01 · Provider · Dark"       width={1080} height={720}><SetupStep1 mode="dark"  /></DCArtboard>
        <DCArtboard id="setup-2-l" label="02 · Voice profile · Light" width={1080} height={820}><SetupStep2 mode="light" /></DCArtboard>
        <DCArtboard id="setup-2-d" label="02 · Voice profile · Dark"  width={1080} height={820}><SetupStep2 mode="dark"  /></DCArtboard>
        <DCArtboard id="setup-3-l" label="03 · Post corpus · Light"   width={1080} height={780}><SetupStep3 mode="light" /></DCArtboard>
        <DCArtboard id="setup-3-d" label="03 · Post corpus · Dark"    width={1080} height={780}><SetupStep3 mode="dark"  /></DCArtboard>
      </DCSection>

      <DCSection id="workspace" title="03 · Workspace" subtitle="Empty after setup. Populated once drafts and checks accumulate.">
        <DCArtboard id="ws-empty-l" label="Empty · Light"     width={1280} height={680}><WorkspaceEmpty mode="light" /></DCArtboard>
        <DCArtboard id="ws-empty-d" label="Empty · Dark"      width={1280} height={680}><WorkspaceEmpty mode="dark"  /></DCArtboard>
        <DCArtboard id="ws-pop-l"   label="Populated · Light" width={1280} height={920}><WorkspacePopulated mode="light" /></DCArtboard>
        <DCArtboard id="ws-pop-d"   label="Populated · Dark"  width={1280} height={920}><WorkspacePopulated mode="dark"  /></DCArtboard>
      </DCSection>

      <DCSection id="draft" title="04 · Action · Draft" subtitle="The detailed flow. Idle → streaming → complete. Output settles into a serif post block.">
        <DCArtboard id="dr-idle-l"      label="Idle · Light"      width={1280} height={700}><ActionDraftIdle      mode="light" /></DCArtboard>
        <DCArtboard id="dr-streaming-l" label="Streaming · Light" width={1280} height={680}><ActionDraftStreaming mode="light" /></DCArtboard>
        <DCArtboard id="dr-streaming-d" label="Streaming · Dark"  width={1280} height={680}><ActionDraftStreaming mode="dark"  /></DCArtboard>
        <DCArtboard id="dr-complete-l"  label="Complete · Light"  width={1280} height={920}><ActionDraftComplete  mode="light" /></DCArtboard>
        <DCArtboard id="dr-complete-d"  label="Complete · Dark"   width={1280} height={920}><ActionDraftComplete  mode="dark"  /></DCArtboard>
      </DCSection>

      <DCSection id="qc" title="05 · Action · Quality check" subtitle="Larger paste area. Findings render as numbered cards with excerpt + fix.">
        <DCArtboard id="qc-l" label="Quality check · Light" width={1280} height={1100}><ActionQualityCheck mode="light" /></DCArtboard>
        <DCArtboard id="qc-d" label="Quality check · Dark"  width={1280} height={1100}><ActionQualityCheck mode="dark"  /></DCArtboard>
      </DCSection>

      <DCSection id="other" title="06 · Action · Ideate and Search" subtitle="Same chrome as Draft. Output shape is what makes each action distinct: angles list for Ideate, ranked hits for Search.">
        <DCArtboard id="ideate-l" label="Ideate · Light" width={1280} height={880}><ActionIdeate mode="light" /></DCArtboard>
        <DCArtboard id="search-l" label="Search · Light" width={1280} height={780}><ActionSearch mode="light" /></DCArtboard>
      </DCSection>

      <DCSection id="settings" title="07 · Settings" subtitle="Three sections plus backup. Each section is a card with one save action.">
        <DCArtboard id="settings-l" label="Settings · Light" width={1280} height={1280}><Settings mode="light" /></DCArtboard>
        <DCArtboard id="settings-d" label="Settings · Dark"  width={1280} height={1280}><Settings mode="dark"  /></DCArtboard>
      </DCSection>

      <DCSection id="states" title="08 · States" subtitle="Errors are calm and specific. Streaming failures keep the partial text. Sidebar collapses below 768px.">
        <DCArtboard id="banner-l"  label="API key invalid · Light" width={1080} height={500}><StateBanner mode="light" /></DCArtboard>
        <DCArtboard id="fail-l"    label="Output failed · Light"    width={760}  height={280}><StateFail   mode="light" /></DCArtboard>
        <DCArtboard id="mobile-l"  label="Mobile · Light"           width={380}  height={720}><StateMobile mode="light" /></DCArtboard>
        <DCArtboard id="mobile-d"  label="Mobile · Dark"            width={380}  height={720}><StateMobile mode="dark"  /></DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
