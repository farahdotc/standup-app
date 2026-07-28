import { useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import "./StandupCommandCenter.css";

/* ─── Trivia (preserved for future use) ─────────────────────────────────── */
const TRIVIA = [
  { q: "Kissing someone for one minute burns about 2 calories.", a: "True" },
  { q: '"Buffalo buffalo Buffalo buffalo buffalo buffalo Buffalo buffalo." is a grammatically correct sentence.', a: "True" },
  { q: "Furby was released in 1998.", a: "True" },
  { q: "Only a small percentage of the world's population is lactose intolerant.", a: "False" },
  { q: "Crystal Pepsi was first sold in US markets in 1993.", a: "False" },
  { q: "Popcorn was invented in 1871 by Frederick W. Rueckheim in the USA where he sold the snack on the streets of Chicago.", a: "False" },
  { q: "The sum of all the numbers on a roulette wheel is 666.", a: "True" },
  { q: 'Kraft "Cheez Whiz" contains cheese culture, but doesn\'t actually contain cheese.', a: "True" },
  { q: "Coca-Cola's original colour was green.", a: "False" },
  { q: '"Typewriter" is the longest word that can be typed using only the first row on a QWERTY keyboard.', a: "False" },
  { q: 'Don Cheto is the host of the radio station "East Los FM" in GTA V.', a: "True" },
  { q: "The vapor produced by e-cigarettes is actually water.", a: "False" },
  { q: 'The French word for "glass" is "glace".', a: "False" },
  { q: 'The word "news" originates from the first letters of the 4 main directions on a compass (North, East, West, South).', a: "False" },
  { q: '"Santa Claus" is a variety of melon.', a: "True" },
  { q: "Fast food restaurant chains Carl's Jr. and Hardee's are owned by the same company.", a: "True" },
  { q: "The US emergency hotline is 911 because of the September 11th terrorist attacks.", a: "False" },
  { q: "The Happy Face was created by commercial artist Harvey Ball.", a: "True" },
  { q: "Pure water effectively conducts electricity.", a: "False" },
  { q: "The British organisation CAMRA stands for The Campaign for Real Ale.", a: "True" },
  { q: "The pickled gherkin was first added to hamburgers because a US health law required all fast-food to include a source of Vitamin C.", a: "False" },
  { q: 'The French word to travel is "Travail".', a: "False" },
  { q: 'The term "Spam" came before the food product "Spam".', a: "False" },
  { q: 'The bikini is named after the "Bikini Atoll", an island where the United States conducted tests on atomic bombs.', a: "True" },
  { q: "Haggis is traditionally eaten on Burns Night.", a: "True" },
  { q: 'SCP-173 was the first SCP article written for the web-based collaborative fiction project known as the "SCP Foundation".', a: "True" },
  { q: "An eggplant is a vegetable.", a: "False" },
  { q: "A pencil's lead is typically made from graphite, not lead.", a: "True" },
  { q: "Sitting for more than three hours a day can cut two years off a person's life expectancy.", a: "True" },
  { q: "The scientific name for the Southern Lights is Aurora Australis.", a: "True" },
  { q: 'The commercial UK channel ITV stands for "International Television".', a: "False" },
  { q: "Francis Bacon died from a fatal case of pneumonia while attempting to preserve meat by stuffing a chicken with snow.", a: "True" },
  { q: "The original Jack-o-Lanterns were actually hollowed out turnips.", a: "True" },
  { q: "Albert Einstein had trouble with mathematics when he was in school.", a: "False" },
  { q: "The average woman is 5 inches / 13 centimeters shorter than the average man.", a: "True" },
  { q: "Ecuador uses the Mexican Peso as its currency.", a: "False" },
  { q: "There are 86,400 seconds in a day.", a: "True" },
  { q: "You are allowed to sell your soul on eBay.", a: "False" },
  { q: "Cucumbers are usually more than 90% water.", a: "True" },
  { q: "Instant mashed potatoes were invented by Canadian Edward Asselbergs in 1962.", a: "True" },
];

/* Trivia logic preserved for future use:
function _getTriviaForDay(sprintDay) {
  const idx = ((sprintDay ?? 1) - 1) * 2;
  return [
    TRIVIA[idx % TRIVIA.length],
    TRIVIA[(idx + 1) % TRIVIA.length],
  ];
}
*/

// Keep TRIVIA available for when trivia mode is re-enabled
void TRIVIA;

/* ─── Daily questions ────────────────────────────────────────────────────── */
const DAILY_QUESTIONS = [
  "What's something you bought for under $100 that you use all the time?",
  "What's one purchase you wish you'd made years earlier?",
  "What's one thing you own that you think everyone should have?",
  "What's a kitchen gadget you actually use?",
  "What's an app that's worth paying for?",
  "What's something surprisingly useful you keep in your car?",
  "What's the best gift you've ever received?",
  "What's something you thought was gimmicky until you tried it?",
  "What's one subscription you'll probably never cancel?",
  "What's one thing you've bought that completely lived up to the hype?",
  "What's something you were completely wrong about?",
  "What's a food you hated as a kid but love now?",
  "What's something you thought was overrated until you experienced it?",
  "What's something that's actually worth spending more money on?",
  "What's a trend you didn't expect to like?",
  "What's something you used to care about that doesn't matter to you anymore?",
  "What's a place that surprised you?",
  "What's a movie you appreciated more the second time?",
  "What's a job you didn't realize was difficult until you tried it?",
  "What's something that gets better with age?",
  "What's the best restaurant you've found by accident?",
  "What's one YouTube channel everyone should know about?",
  "What's the best podcast you've listened to?",
  "What's the best documentary you've watched?",
  "What's a book that changed how you think?",
  "What's the best local hidden gem where you live?",
  "What's one website you think more people should know about?",
  "What's a recipe everyone should learn?",
  "What's a TV show you recommend that most people haven't seen?",
  "What's one life hack that actually works?",
  "What are you currently learning just because you're interested?",
  "What's a hobby you admire but don't have?",
  "What's something you could happily spend hours talking about?",
  "What's something you've gone down a rabbit hole researching?",
  "What's one skill you'd like to have someday?",
  "What's something you've become much better at over the last five years?",
  "What's one thing you've taught yourself?",
  "What's a topic you wish you knew more about?",
  "What's one random fact you think is fascinating?",
  "What's something you've recently become interested in?",
  "What's your perfect Saturday?",
  "What's your favorite way to waste an hour?",
  "What's your favorite weather?",
  "What's your favorite smell?",
  "What's a sound you find relaxing?",
  "What's your favorite room in your house?",
  "What's the first thing you do after work?",
  "What's your favorite season and why?",
  "What's your favorite holiday tradition?",
  "What's something small that instantly improves your day?",
  "What's one piece of advice you'd give your 20-year-old self?",
  "What's something you wish someone had taught you earlier?",
  "What's the best advice you've ever received?",
  "What's one decision you're really glad you made?",
  "What's something that seemed scary but turned out great?",
  "What's a risk that paid off?",
  "What's something you're proud you stuck with?",
  "What's something you wish you'd started sooner?",
  "What's a lesson you've learned the hard way?",
  "What's something that gets easier with experience?",
  "What's your favorite way to start the morning?",
  "What's your ideal workspace?",
  "Do you prefer total silence or background noise?",
  "What's one meeting habit you appreciate?",
  "What's your favorite keyboard shortcut?",
  "What's your favorite office snack?",
  "What's something that helps you focus?",
  "What's the best compliment you've received professionally?",
  "What's your favorite notebook, planner, or organization tool?",
  "What's your dream home office feature?",
  "What's something most people don't know exists?",
  "What's something you're irrationally picky about?",
  "What's a hill you'll happily die on?",
  "What's something everyone should try at least once?",
  "What's a smell that instantly reminds you of childhood?",
  "What's your weirdest useful talent?",
  "What's something people always ask you for help with?",
  "What's something you notice that most people don't?",
  "What's one thing you're always curious about?",
  "What's a question you love asking other people?",
  "What's somewhere you've visited that you'd happily return to every year?",
  "What's one city you think everyone should visit?",
  "What's the prettiest drive you've ever taken?",
  "What's the coolest natural place you've seen?",
  "What's your favorite road trip stop?",
  "What's the most memorable meal you've had while traveling?",
  "What's a place that felt nothing like you expected?",
  "What's somewhere you haven't been but know you'll love?",
  "What's your favorite airport?",
  "What's your favorite vacation memory?",
  "If someone gave you six months off with full pay, what would you do?",
  "If money wasn't a factor, what hobby would you pick up?",
  "If you could have coffee with anyone, who would it be?",
  "If you had to give a TED Talk tomorrow, what would it be about?",
  "What's something you're convinced you're better at than the average person?",
  "What's one luxury you secretly enjoy?",
  "If you had to eat one cuisine for a month, what would it be?",
  "What's one thing that instantly makes you smile?",
  "If someone visited your hometown for one day, where would you take them?",
  "What's something you're excited about right now?",
  "What purchase has had the highest return on investment in your life?",
  "What do you spend money on that you'll never regret?",
  "What's something you once thought was a waste of money?",
  "What's one convenience you'll happily pay for?",
  "What's a simple habit that has made your life noticeably better?",
  "What's one thing you do that saves you a surprising amount of time?",
  "What's the best recommendation someone has ever given you?",
  "What's something you were influenced into trying that you're grateful for?",
  "What's the nicest compliment you've ever received?",
  "What's one tradition you'd like to start?",
  "What's something you've gotten rid of that you don't miss?",
  "What's one thing you always pack when traveling?",
  "What's something you've become less stressed about as you've gotten older?",
  "What always makes a place feel like home?",
  "What's something that instantly earns your respect?",
  "What's a tiny everyday luxury you really appreciate?",
  "What's one thing you hope never becomes obsolete?",
  "What's something that feels expensive but is actually a great value?",
  "What's a belief you've held for a long time that has served you well?",
  "What's something you're looking forward to that isn't a vacation?",
];

const TEAM_MEMBERS = ["Tom", "Febian", "Scott", "Steve", "John", "Jean", "Farah", "Travis", "Elise", "Lauren", "Adam"];

function getDailyQuestion(dateStr, offset = 0) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash * 31) + dateStr.charCodeAt(i)) >>> 0;
  }
  return DAILY_QUESTIONS[(hash + offset) % DAILY_QUESTIONS.length];
}

function pickTwoNames(exclude = []) {
  const pool = TEAM_MEMBERS.filter(n => !exclude.includes(n));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

/* ─── Team facts (Firestore) ─────────────────────────────────────────────── */
function pickRandom(pool, excludeId = null) {
  const candidates = excludeId ? pool.filter(f => f.id !== excludeId) : pool;
  if (candidates.length === 0) return pool[0] ?? null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function buildDisplayFact(fact, peopleMap) {
  if (!fact) return null;
  const usePro = fact.pro && Math.random() < 0.5;
  return {
    ...fact,
    clue: usePro ? fact.pro : fact.fact,
    name: peopleMap[fact.code] ?? "???",
  };
}


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
  sprintStart: "",
  today: "",
  sprintGoal: "Stabilize COR platform work and reduce carryover risk.",
  committed: "42 pts",
  done: "18 pts",
  atRisk: "11 pts",
  watch: "17 pts",
  notes: "",
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

  const [factRevealed, setFactRevealed] = useState(false);
  const [factsPool, setFactsPool] = useState([]);
  const [peopleMap, setPeopleMap] = useState({});
  const [currentFact, setCurrentFact] = useState(null);
  const [factsLoading, setFactsLoading] = useState(true);

  useEffect(() => {
    async function loadFacts() {
      try {
        const [factsSnap, peopleSnap] = await Promise.all([
          getDocs(collection(db, "facts")),
          getDocs(collection(db, "people")),
        ]);

        const allFacts = factsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const map = {};
        peopleSnap.docs.forEach(d => {
          const { code, name } = d.data();
          map[code] = name;
        });

        const unseen = allFacts.filter(f => !f.shownAt);
        const pool = unseen.length > 0 ? unseen : allFacts;

        setPeopleMap(map);
        setFactsPool(pool);
        setCurrentFact(buildDisplayFact(pickRandom(pool), map));
      } finally {
        setFactsLoading(false);
      }
    }
    loadFacts();
  }, []);

  async function handleReveal() {
    if (!currentFact) return;
    setFactRevealed(true);
    await updateDoc(doc(db, "facts", currentFact.id), { shownAt: serverTimestamp() });
  }

  function handleNextFact() {
    setFactRevealed(false);
    const next = pickRandom(factsPool, currentFact?.id);
    setCurrentFact(buildDisplayFact(next, peopleMap));
  }

  const [questionOffset, setQuestionOffset] = useState(0);
  const [selectedNames, setSelectedNames] = useState([]);

  const sprintDay = calcSprintDay(data.sprintStart);
  const displayDate = formatDate(data.today || todayISO());
  const todayKey = data.today || todayISO();
  const dailyQuestion = getDailyQuestion(todayKey, questionOffset);

  function handlePickNames() {
    setSelectedNames(pickTwoNames());
  }

  function handleReplaceName(index) {
    const others = TEAM_MEMBERS.filter(n => !selectedNames.includes(n));
    if (!others.length) return;
    const replacement = others[Math.floor(Math.random() * others.length)];
    setSelectedNames(prev => prev.map((n, i) => i === index ? replacement : n));
  }

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
          <span className="scc-date-quote-text">{dailyQuestion}</span>
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
            <RichTextEditor
              value={data.sprintGoal}
              editing={editing}
              onChange={(v) => update("sprintGoal", v)}
            />
          </div>
        )}
      </section>

      {/* Notes */}
      {(editing || data.notes?.trim()) && (
        <section className="scc-card">
          <div className="scc-card-header">
            <h2 className="scc-section-title">
              <span className="scc-icon">📋</span> Notes
            </h2>
          </div>
          <RichTextEditor
            value={data.notes}
            editing={editing}
            onChange={(v) => update("notes", v)}
          />
        </section>
      )}

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

      {/* Daily Question */}
      <section className="scc-card scc-question-card">
        <div className="scc-card-header">
          <h2 className="scc-section-title">
            <span className="scc-icon">💬</span> Daily Question
          </h2>
          <button
            className="scc-btn scc-btn--sm"
            onClick={() => setQuestionOffset(q => q + 1)}
          >
            New question
          </button>
        </div>
        <p className="scc-question-text">{dailyQuestion}</p>
        <div className="scc-question-names">
          {selectedNames.length === 0 ? (
            <button className="scc-btn scc-btn--pick" onClick={handlePickNames}>
              🎲 Pick who answers
            </button>
          ) : (
            <>
              <span className="scc-question-names-label">Answering today:</span>
              <div className="scc-name-chips">
                {selectedNames.map((name, i) => (
                  <span key={i} className="scc-name-chip">
                    {name}
                    <button
                      className="scc-name-chip-replace"
                      title="Replace (absent)"
                      onClick={() => handleReplaceName(i)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button className="scc-btn scc-btn--sm" onClick={handlePickNames}>
                  Re-pick
                </button>
              </div>
            </>
          )}
        </div>
      </section>

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

/* ─── Rich text editor ───────────────────────────────────────────────────── */
const TOOLBAR = [
  { cmd: "bold",          icon: "B",   title: "Bold",          style: { fontWeight: 700 } },
  { cmd: "italic",        icon: "I",   title: "Italic",        style: { fontStyle: "italic" } },
  { cmd: "underline",     icon: "U",   title: "Underline",     style: { textDecoration: "underline" } },
  { cmd: "insertUnorderedList", icon: "•—", title: "Bullet list" },
  { cmd: "insertOrderedList",   icon: "1.", title: "Numbered list" },
  { cmd: "formatBlock",   icon: "H1",  title: "Heading 1",     value: "h2" },
  { cmd: "formatBlock",   icon: "H2",  title: "Heading 2",     value: "h3" },
  { cmd: "formatBlock",   icon: "¶",   title: "Paragraph",     value: "p" },
];

function RichTextEditor({ value, editing, onChange }) {
  const ref = useRef(null);
  const isInternalChange = useRef(false);

  // Sync incoming value into the DOM only when it changes externally
  useEffect(() => {
    if (ref.current && !isInternalChange.current) {
      if (ref.current.innerHTML !== (value || "")) {
        ref.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const exec = (cmd, val) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val ?? null);
  };

  const handleInput = () => {
    isInternalChange.current = true;
    onChange(ref.current.innerHTML);
  };

  if (!editing) {
    return (
      <div
        className="scc-notes-view"
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
    );
  }

  return (
    <div className="scc-notes-editor">
      <div className="scc-notes-toolbar">
        {TOOLBAR.map((btn) => (
          <button
            key={btn.cmd + (btn.value ?? "")}
            className="scc-notes-tool"
            title={btn.title}
            style={btn.style}
            onMouseDown={(e) => {
              e.preventDefault(); // keep focus in editor
              exec(btn.cmd, btn.value);
            }}
          >
            {btn.icon}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        className="scc-notes-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder="Paste or type notes here — formatting is preserved…"
      />
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
