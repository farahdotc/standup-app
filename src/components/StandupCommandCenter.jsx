import { useEffect, useState } from "react";
import "./StandupCommandCenter.css";

/* ─── Quotes ─────────────────────────────────────────────────────────────── */
const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "Small progress is still progress.", author: "Unknown" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "The best time to start was yesterday. The next best time is now.", author: "Unknown" },
  { text: "Clarity is the antidote to anxiety.", author: "Unknown" },
  { text: "Move fast and fix things.", author: "Unknown" },
  { text: "Every sprint is a chance to improve.", author: "Unknown" },
  { text: "Velocity is a lagging indicator. Focus on removing blockers.", author: "Unknown" },
  { text: "Ship early, learn fast.", author: "Unknown" },
];

function getTodayQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length];
}

/* ─── Sprint day calculation ─────────────────────────────────────────────── */
// Counts business days (Mon–Fri) from sprintStart up to and including today, max 10.
function calcSprintDay(sprintStartStr) {
  if (!sprintStartStr) return null;
  const [y, m, d] = sprintStartStr.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  if (today < start) return null;

  let bizDays = 0;
  const cursor = new Date(start);
  while (cursor <= today) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) bizDays++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.min(bizDays, 10);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const defaultTeams = [
  {
    id: 1,
    name: "Platform Readiness",
    done: 18,
    incomplete: 14,
    unestimated: 5,
    prev: { done: 15, incomplete: 18, unestimated: 8 },
  },
];

const defaultInsights = [
  {
    id: 1,
    category: "Delivery Risk",
    title: "MVP DIH & Platform Foundations",
    issue:
      'Core infrastructure tasks required to "Start Building out MVP DIH" are still in the early stages or not yet started.',
    why: 'These are critical path dependencies. Without the AWS environment and dbt connectivity, the team cannot validate the "DIH PoC 2" (COR-626) or the "API layer implementation" (COR-612), which is currently sitting in the Backlog.',
  },
  {
    id: 2,
    category: "Workflow Bottleneck",
    title: "QA Congestion",
    issue:
      'There will be a significant buildup of work in "Ready for QA" or "QA" status.',
    why: 'With roughly one week left in the sprint, the "QA pile-up" creates a high risk of spillover. If defects are found late, there will be no time for remediation, leading to a failure to meet the goals.',
  },
  {
    id: 3,
    category: "Misalignment",
    title: "Provider Silver Revamp",
    issue:
      'While progress has been made on individual tables, a large cluster of related fact tables remains in To Do.',
    why: 'The "Begin Provider Silver Revamp" goal is broad. With so many components still in "To Do," we are at risk of delivering a fragmented model that doesn\'t meet the full requirements for the provider domain.',
  },
];

const defaultData = {
  sprintName: "Sprint 12",
  sprintStart: "",   // YYYY-MM-DD, always a Wednesday
  today: "",         // YYYY-MM-DD, set each morning
  sprintGoal: "Stabilize COR platform work and reduce carryover risk.",
  committed: "42 pts",
  done: "18 pts",
  atRisk: "11 pts",
  watch: "17 pts",
  trivia: "The average standup takes 11 minutes — but feels like 40.",
  teams: defaultTeams,
  insights: defaultInsights,
  blocked: "COR-124 blocked by external team.",
  qaRisk: "COR-141 in QA > 2 days.",
  largeNotInQA: "COR-177 large item not in QA early.",
};

const CATEGORY_VARIANTS = {
  "Delivery Risk": "danger",
  "Workflow Bottleneck": "warning",
  "Misalignment": "info",
};

function variantForCategory(cat) {
  return CATEGORY_VARIANTS[cat] ?? "neutral";
}

export default function StandupCommandCenter() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("standup-data");
    return saved ? JSON.parse(saved) : defaultData;
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem("standup-data", JSON.stringify(data));
  }, [data]);

  const update = (key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateTeam = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      teams: (prev.teams ?? []).map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  };

  const addTeam = () => {
    setData((prev) => ({
      ...prev,
      teams: [
        ...(prev.teams ?? []),
        {
          id: Date.now(),
          name: "",
          done: 0,
          incomplete: 0,
          unestimated: 0,
          prev: { done: 0, incomplete: 0, unestimated: 0 },
        },
      ],
    }));
  };

  const removeTeam = (id) => {
    setData((prev) => ({
      ...prev,
      teams: (prev.teams ?? []).filter((t) => t.id !== id),
    }));
  };

  const updateInsight = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      insights: (prev.insights ?? []).map((ins) =>
        ins.id === id ? { ...ins, [field]: value } : ins
      ),
    }));
  };

  const addInsight = () => {
    const newId = Date.now();
    setData((prev) => ({
      ...prev,
      insights: [
        ...(prev.insights ?? []),
        { id: newId, category: "Delivery Risk", title: "", issue: "", why: "" },
      ],
    }));
  };

  const removeInsight = (id) => {
    setData((prev) => ({
      ...prev,
      insights: (prev.insights ?? []).filter((ins) => ins.id !== id),
    }));
  };

  const progress = (() => {
    const done = parseFloat(data.done);
    const committed = parseFloat(data.committed);
    if (!isNaN(done) && !isNaN(committed) && committed > 0) {
      return Math.min(100, Math.round((done / committed) * 100));
    }
    return null;
  })();

  const sprintDay = calcSprintDay(data.sprintStart);
  const displayDate = formatDate(data.today || todayISO());
  const quote = getTodayQuote();

  const hasTeams = (data.teams ?? []).some(
    (t) => t.name.trim() || t.done > 0 || t.incomplete > 0 || t.unestimated > 0
  );
  const hasInsights = (data.insights ?? []).length > 0;
  const hasRisks = [data.blocked, data.qaRisk, data.largeNotInQA].some((v) => v?.trim());

  return (
    <div className="scc-page">

      {/* Date banner */}
      <div className="scc-date-banner">
        <div className="scc-date-banner-left">
          <span className="scc-date-today">{displayDate}</span>
          {sprintDay !== null && (
            <span className="scc-date-sprintday">Day {sprintDay} of 10</span>
          )}
        </div>
        <div className="scc-date-quote">
          <span className="scc-date-quote-text">"{quote.text}"</span>
          <span className="scc-date-quote-author">— {quote.author}</span>
        </div>
      </div>

      {/* Header */}
      <header className="scc-header">
        <div className="scc-header-left">
          <div>
            <h1 className="scc-title">
              {editing ? (
                <input
                  className="scc-inline-input"
                  value={data.sprintName}
                  onChange={(e) => update("sprintName", e.target.value)}
                />
              ) : (
                data.sprintName
              )}
            </h1>
            {editing && (
              <div className="scc-date-inputs">
                <label className="scc-date-label">
                  Sprint start (Wed)
                  <input
                    type="date"
                    className="scc-date-input"
                    value={data.sprintStart}
                    onChange={(e) => update("sprintStart", e.target.value)}
                  />
                </label>
                <label className="scc-date-label">
                  Today
                  <input
                    type="date"
                    className="scc-date-input"
                    value={data.today || todayISO()}
                    onChange={(e) => update("today", e.target.value)}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
        <button
          className={`scc-btn ${editing ? "scc-btn--active" : ""}`}
          onClick={() => setEditing(!editing)}
        >
          {editing ? (
            <><span className="scc-btn-icon">✓</span> Done</>
          ) : (
            <><span className="scc-btn-icon">✎</span> Edit</>
          )}
        </button>
      </header>

      {/* Sprint Pulse */}
      <section className="scc-card">
        <div className="scc-card-header">
          <h2 className="scc-section-title">Sprint Pulse</h2>
          {progress !== null && (
            <span className="scc-progress-label">{progress}% complete</span>
          )}
        </div>

        {progress !== null && (
          <div className="scc-progress-bar">
            <div className="scc-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className="scc-metrics">
          {(editing || data.committed?.trim()) && (
            <MetricCard label="Committed" value={data.committed} variant="neutral" editing={editing} onChange={(v) => update("committed", v)} />
          )}
          {(editing || data.atRisk?.trim()) && (
            <MetricCard label="At Risk" value={data.atRisk} variant="warning" editing={editing} onChange={(v) => update("atRisk", v)} />
          )}
          {(editing || data.watch?.trim()) && (
            <MetricCard label="Watch" value={data.watch} variant="warning" editing={editing} onChange={(v) => update("watch", v)} />
          )}
                    {(editing || data.done?.trim()) && (
            <MetricCard label="Done" value={data.done} variant="success" editing={editing} onChange={(v) => update("done", v)} />
          )}
        </div>

        {(editing || data.sprintGoal?.trim()) && (
          <div className="scc-goal">
            <span className="scc-field-label">Sprint Goal</span>
            {editing ? (
              <textarea className="scc-textarea" value={data.sprintGoal} onChange={(e) => update("sprintGoal", e.target.value)} />
            ) : (
              <p className="scc-goal-text">{data.sprintGoal}</p>
            )}
          </div>
        )}
      </section>

      {/* Epic Progress */}
      {(editing || hasTeams) && (
        <section className="scc-card">
          <div className="scc-card-header">
            <h2 className="scc-section-title">
              <span className="scc-icon">▲</span> Epic Progress
            </h2>
            {editing && (
              <button className="scc-btn scc-btn--sm" onClick={addTeam}>+ Add</button>
            )}
          </div>
          <div className="scc-teams">
            {(data.teams ?? [])
              .filter((t) => editing || t.name.trim() || t.done > 0 || t.incomplete > 0 || t.unestimated > 0)
              .map((team) => (
                <TeamRow
                  key={team.id}
                  team={team}
                  editing={editing}
                  onChange={(field, val) => updateTeam(team.id, field, val)}
                  onRemove={() => removeTeam(team.id)}
                />
              ))}
          </div>
        </section>
      )}

      {/* Trivia */}
      {(editing || data.trivia?.trim()) && (
        <div className="scc-trivia-bar">
          <span className="scc-trivia-icon">💡</span>
          {editing ? (
            <input
              className="scc-trivia-input"
              value={data.trivia}
              onChange={(e) => update("trivia", e.target.value)}
            />
          ) : (
            <span className="scc-trivia-text">{data.trivia}</span>
          )}
        </div>
      )}

      {/* Jira Insights */}
      {(editing || hasInsights) && (
        <section className="scc-card">
          <div className="scc-card-header">
            <h2 className="scc-section-title">
              <span className="scc-icon">⚡</span> Jira Insights
            </h2>
            {editing && (
              <button className="scc-btn scc-btn--sm" onClick={addInsight}>
                + Add
              </button>
            )}
          </div>

          <div className="scc-insights">
            {(data.insights ?? []).map((ins, idx) => (
              <InsightCard
                key={ins.id}
                index={idx + 1}
                insight={ins}
                editing={editing}
                onChange={(field, val) => updateInsight(ins.id, field, val)}
                onRemove={() => removeInsight(ins.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Carryover Risks */}
      {(editing || hasRisks) && (
        <section className="scc-card">
          <div className="scc-card-header">
            <h2 className="scc-section-title">
              <span className="scc-icon scc-icon--danger">⚠</span> Carryover Risks
            </h2>
          </div>
          <div className="scc-risks">
            {(editing || data.blocked?.trim()) && (
              <RiskItem label="Blocked" value={data.blocked} variant="danger" editing={editing} onChange={(v) => update("blocked", v)} />
            )}
            {(editing || data.qaRisk?.trim()) && (
              <RiskItem label="QA › 2 days" value={data.qaRisk} variant="warning" editing={editing} onChange={(v) => update("qaRisk", v)} />
            )}
            {(editing || data.largeNotInQA?.trim()) && (
              <RiskItem label="In progress › 3 days" value={data.largeNotInQA} variant="info" editing={editing} onChange={(v) => update("largeNotInQA", v)} />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── Team row ───────────────────────────────────────────────────────────── */
function TeamRow({ team, editing, onChange, onRemove }) {
  const total = (team.done ?? 0) + (team.incomplete ?? 0);
  const donePct   = total > 0 ? (team.done / total) * 100 : 0;
  const incompPct = total > 0 ? (team.incomplete / total) * 100 : 0;

  const prevTotal = (team.prev?.done ?? 0) + (team.prev?.incomplete ?? 0);
  const prevDonePct = prevTotal > 0 ? Math.round((team.prev.done / prevTotal) * 100) : 0;
  const currDonePct = total > 0 ? Math.round((team.done / total) * 100) : 0;
  const delta = currDonePct - prevDonePct;
  const deltaLabel = delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : "—";
  const deltaClass = delta > 0 ? "scc-team-delta--up" : delta < 0 ? "scc-team-delta--down" : "";

  const updatePrev = (field, val) => onChange("prev", { ...team.prev, [field]: val });

  return (
    <div className="scc-team-row">

      {/* Name */}
      <div className="scc-team-name-col">
        {editing ? (
          <input
            className="scc-team-input"
            placeholder="Team / area name"
            value={team.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        ) : (
          <span className="scc-team-name">{team.name}</span>
        )}
      </div>

      {/* Stacked bar */}
      <div className="scc-team-bar-col">
        <div className="scc-team-bar-track">
          <div className="scc-team-bar-done"    style={{ width: `${donePct}%` }} />
          <div className="scc-team-bar-incomp"  style={{ width: `${incompPct}%` }} />
        </div>
        <div className="scc-team-bar-legend">
          <span className="scc-legend-dot scc-legend-dot--done" />
          <span className="scc-legend-label">Done</span>
          <span className="scc-legend-dot scc-legend-dot--incomp" />
          <span className="scc-legend-label">Incomplete</span>
          {(team.unestimated ?? 0) > 0 && (
            <>
              <span className="scc-legend-dot scc-legend-dot--unest" />
              <span className="scc-legend-label">Unestimated</span>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="scc-team-stats-col">
        {editing ? (
          <div className="scc-team-edit-grid">
            <div className="scc-team-edit-cols">
              <div className="scc-team-edit-group">
                <span className="scc-team-edit-header">Current sprint</span>
                <NumField label="Done"        value={team.done}        onChange={(v) => onChange("done", v)} />
                <NumField label="Incomplete"  value={team.incomplete}  onChange={(v) => onChange("incomplete", v)} />
                <NumField label="Unestimated" value={team.unestimated} onChange={(v) => onChange("unestimated", v)} />
              </div>
              <div className="scc-team-edit-group">
                <span className="scc-team-edit-header">Previous sprint</span>
                <NumField label="Done"        value={team.prev?.done ?? 0}        onChange={(v) => updatePrev("done", v)} />
                <NumField label="Incomplete"  value={team.prev?.incomplete ?? 0}  onChange={(v) => updatePrev("incomplete", v)} />
                <NumField label="Unestimated" value={team.prev?.unestimated ?? 0} onChange={(v) => updatePrev("unestimated", v)} />
              </div>
            </div>
            <button className="scc-remove-btn scc-team-remove" onClick={onRemove} aria-label="Remove team">✕ Remove team</button>
          </div>
        ) : (
          <div className="scc-team-read-stats">
            <div className="scc-team-pts-row">
              <span className="scc-team-pts scc-team-pts--done">{team.done ?? 0} <span className="scc-team-pts-label">done</span></span>
              <span className="scc-team-pts-sep">/</span>
              <span className="scc-team-pts scc-team-pts--incomp">{team.incomplete ?? 0} <span className="scc-team-pts-label">incomplete</span></span>
              {(team.unestimated ?? 0) > 0 && (
                <>
                  <span className="scc-team-pts-sep">/</span>
                  <span className="scc-team-pts scc-team-pts--unest">{team.unestimated} <span className="scc-team-pts-label">unestimated</span></span>
                </>
              )}
            </div>
            <div className="scc-team-prev-row">
              <span className="scc-team-meta">
                Prev: {team.prev?.done ?? 0} done / {team.prev?.incomplete ?? 0} incomplete
                {(team.prev?.unestimated ?? 0) > 0 && ` / ${team.prev.unestimated} unest.`}
              </span>
              <span className={`scc-team-delta ${deltaClass}`}>{deltaLabel}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <label className="scc-num-field">
      <span className="scc-num-field-label">{label}</span>
      <input
        className="scc-team-num-input"
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/* ─── Metric card ────────────────────────────────────────────────────────── */
function MetricCard({ label, value, variant, editing, onChange }) {
  return (
    <div className={`scc-metric scc-metric--${variant}`}>
      <span className="scc-metric-label">{label}</span>
      {editing ? (
        <input className="scc-metric-input" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <span className="scc-metric-value">{value}</span>
      )}
    </div>
  );
}

/* ─── Insight card ───────────────────────────────────────────────────────── */
const CATEGORIES = ["Delivery Risk", "Workflow Bottleneck", "Misalignment", "Process Gap", "Dependency"];

function InsightCard({ index, insight, editing, onChange, onRemove }) {
  const variant = variantForCategory(insight.category);

  return (
    <div className={`scc-insight scc-insight--${variant}`}>
      <div className="scc-insight-header">
        <div className="scc-insight-meta">
          <span className="scc-insight-index">{index}</span>
          {editing ? (
            <select
              className="scc-insight-category-select"
              value={insight.category}
              onChange={(e) => onChange("category", e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          ) : (
            <span className={`scc-insight-category scc-insight-category--${variant}`}>
              {insight.category}
            </span>
          )}
        </div>
        {editing && (
          <button className="scc-remove-btn" onClick={onRemove} aria-label="Remove insight">✕</button>
        )}
      </div>

      {editing ? (
        <input
          className="scc-insight-title-input"
          placeholder="Title"
          value={insight.title}
          onChange={(e) => onChange("title", e.target.value)}
        />
      ) : (
        <h3 className="scc-insight-title">{insight.title}</h3>
      )}

      <div className="scc-insight-body">
        {(editing || insight.issue?.trim()) && (
          <div className="scc-insight-row">
            <span className="scc-insight-row-label">The Issue</span>
            {editing ? (
              <textarea
                className="scc-textarea scc-textarea--sm"
                value={insight.issue}
                onChange={(e) => onChange("issue", e.target.value)}
              />
            ) : (
              <p className="scc-insight-text">{insight.issue}</p>
            )}
          </div>
        )}
        {(editing || insight.why?.trim()) && (
          <div className="scc-insight-row">
            <span className="scc-insight-row-label">Why it matters</span>
            {editing ? (
              <textarea
                className="scc-textarea scc-textarea--sm"
                value={insight.why}
                onChange={(e) => onChange("why", e.target.value)}
              />
            ) : (
              <p className="scc-insight-text">{insight.why}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Risk item ──────────────────────────────────────────────────────────── */
function RiskItem({ label, value, variant, editing, onChange }) {
  return (
    <div className={`scc-risk scc-risk--${variant}`}>
      <span className="scc-risk-label">{label}</span>
      {editing ? (
        <textarea className="scc-textarea scc-textarea--sm" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <p className="scc-risk-text">{value}</p>
      )}
    </div>
  );
}
