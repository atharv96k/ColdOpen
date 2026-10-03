import { useState } from 'react';
import testCases from './testData.json';

// Base URL for the backend.
// Empty string = same origin (/api/...).
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const GOALS = [
  { value: 'alumni', label: 'Intro to an alumnus/alumna' },
  { value: 'advice', label: 'Ask for career advice' },
  { value: 'referral', label: 'Ask for a referral' },
  { value: 'internship', label: 'Ask about openings' },
  { value: 'recruiter', label: 'Introduce myself to a recruiter' },
  { value: 'resume', label: 'Ask for resume feedback' },
  { value: 'mock', label: 'Ask for a mock interview' },
  { value: 'mentor', label: 'Ask someone to mentor me' },
  { value: 'team', label: 'Ask about their team or work' },
  { value: 'opensource', label: 'Ask to contribute to their project' },
  { value: 'followup', label: 'Follow up (no reply yet)' },
  { value: 'thanks', label: 'Thank you after a call or help' },
  { value: 'reconnect', label: 'Reconnect with an old contact' },
  { value: 'reference', label: 'Ask for a reference or recommendation' },
  { value: 'switch', label: 'Ask about a role at their company' },
];

// ---------- highlighting ----------
function renderHighlighted(text, highlights = [], kind = 'voice') {
  const lower = text.toLowerCase();
  const ranges = [];

  highlights.forEach((h) => {
    const i = lower.indexOf(h.toLowerCase());
    if (i !== -1) ranges.push([i, i + h.length, kind]);
  });

  const re = /\[[^\]]+\]/g;
  let m;

  while ((m = re.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length, 'ph']);
  }

  ranges.sort((a, b) => a[0] - b[0]);

  const out = [];
  let pos = 0;

  ranges.forEach(([s, e, k], idx) => {
    if (s < pos) return;

    if (s > pos) {
      out.push(
        <span key={`t${idx}`}>
          {text.slice(pos, s)}
        </span>
      );
    }

    out.push(
      <mark key={`m${idx}`} className={k}>
        {text.slice(s, e)}
      </mark>
    );

    pos = e;
  });

  if (pos < text.length) {
    out.push(
      <span key="end">
        {text.slice(pos)}
      </span>
    );
  }

  return out;
}

// ---------- end highlighting ----------

function CopyButton({ text }) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label="Copy email with selected subject"
      title={done ? 'Copied' : 'Copy subject + email'}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1" />
        </svg>
      )}
    </button>
  );
}

function SubjectChips({ data, index, onPick }) {
  return (
    <div className="chips">
      {data.subject_lines.map((s, i) => (
        <button
          type="button"
          key={i}
          className={'chip' + (i === index ? ' active' : '')}
          onClick={() => onPick(i)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function VoiceNote({ data }) {
  if (!data.voice_notes || data.voice_notes === 'generic') return null;

  return (
    <p className="note">
      Voice learned: {data.voice_notes}
    </p>
  );
}

function Box({
  label,
  kind,
  body,
  highlights,
  mark,
  subject,
}) {
  return (
    <div className={'box ' + kind}>
      <span className="box-label">{label}</span>

      <span className="box-copy">
        <CopyButton text={`Subject: ${subject}\n\n${body}`} />
      </span>

      <p>
        {renderHighlighted(body, highlights, mark)}
      </p>
    </div>
  );
}

function Results({ result }) {
  const { personalized, generic } = result;

  const [ps, setPs] = useState(0);
  const [gs, setGs] = useState(0);

  return (
    <>
      <p className="legend">
        <mark className="voice">green</mark> = phrases that carry your voice
        &nbsp;·&nbsp;
        <mark className="ai">pink</mark> = phrases that sound like generic AI
        &nbsp;·&nbsp;
        <mark className="ph">[amber]</mark> = fill this in before sending
      </p>

      <section className="card">
        <VoiceNote data={personalized} />

        <div className="subjrow">
          <span className="subjlabel">
            Subject line{generic ? ' · in your voice' : ''}
          </span>

          <SubjectChips
            data={personalized}
            index={ps}
            onPick={setPs}
          />
        </div>

        {generic && (
          <div className="subjrow">
            <span className="subjlabel">
              Subject line · generic
            </span>

            <SubjectChips
              data={generic}
              index={gs}
              onPick={setGs}
            />
          </div>
        )}
      </section>

      {personalized.variants.map((v, i) => (
        <section key={i} className="tone-card">
          <h2>{v.tone}</h2>

          <Box
            label="In your voice"
            kind="voice-box"
            body={v.body}
            highlights={v.highlights}
            mark="voice"
            subject={personalized.subject_lines[ps]}
          />

          {generic && generic.variants[i] && (
            <Box
              label="Generic (no voice)"
              kind="generic-box"
              body={generic.variants[i].body}
              highlights={generic.variants[i].highlights}
              mark="ai"
              subject={generic.subject_lines[gs]}
            />
          )}
        </section>
      ))}
    </>
  );
}

const EMPTY_FORM = {
  writingSamples: '',
  recipientName: '',
  recipientRole: '',
  company: '',
  goal: 'alumni',
  length: 100,
  context: '',
  about: '',
  ask: '',
};

export default function App() {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    compare: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [caseId, setCaseId] = useState('');
  const [showTestData, setShowTestData] = useState(false);

  const set = (k) => (e) =>
    setForm({
      ...form,
      [k]:
        e.target.type === 'checkbox'
          ? e.target.checked
          : e.target.value,
    });

  async function run(data) {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          length: Number(data.length),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error || 'Something went wrong'
        );
      }

      setResult({
        ...json,
        samples: data.writingSamples,
        id: Date.now(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    run(form);
  }

  function loadCase(id, andRun = false) {
    const c = testCases.find((t) => t.id === id);

    if (!c) return;

    const next = {
      ...form,
      ...c.form,
    };

    setCaseId(id);
    setForm(next);
    setResult(null);
    setError('');

    if (andRun) {
      run(next);
    }
  }

  function randomCase() {
    const pool = testCases.filter(
      (t) => t.id !== caseId
    );

    const pick =
      pool[Math.floor(Math.random() * pool.length)];

    loadCase(pick.id, true);
  }

  function clearForm() {
    setCaseId('');

    setForm({
      ...EMPTY_FORM,
      compare: form.compare,
    });

    setResult(null);
    setError('');
  }

  return (
    <main>
      <h1>ColdOpen</h1>

      <p className="sub">
        Cold emails that sound like you wrote them, because the
        first message is the hardest one to send.
      </p>

      {/* Test data is available in BOTH local and production */}
      <div className="dev-section">
        {!showTestData ? (
          <button
            type="button"
            className="ghost dev-toggle"
            onClick={() => setShowTestData(true)}
          >
            Quick check with sample data
          </button>
        ) : (
          <div className="devbar">
            <span>Test data</span>

            <select
              value={caseId}
              onChange={(e) =>
                loadCase(e.target.value)
              }
            >
              <option value="">
                Pick a test case (fills the form)...
              </option>

              {testCases.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                >
                  {t.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="ghost"
              onClick={randomCase}
              disabled={loading}
            >
              Random &amp; draft
            </button>

            <button
              type="button"
              className="ghost"
              onClick={clearForm}
            >
              Clear
            </button>

            <button
              type="button"
              className="ghost"
              onClick={() =>
                setShowTestData(false)
              }
              title="Hide test data"
            >
              Hide
            </button>
          </div>
        )}
      </div>

      <form
        className="card"
        onSubmit={submit}
      >
        <label>
          Paste 2-3 messages you have written before
          (emails, LinkedIn notes, anything natural)

          <textarea
            rows={6}
            value={form.writingSamples}
            onChange={set('writingSamples')}
            maxLength={3000}
            required
          />
        </label>

        <div className="row">
          <label>
            Recipient name

            <input
              value={form.recipientName}
              onChange={set('recipientName')}
              maxLength={80}
              required
            />
          </label>

          <label>
            Their role

            <input
              value={form.recipientRole}
              onChange={set('recipientRole')}
              maxLength={120}
              required
            />
          </label>

          <label>
            Company

            <input
              value={form.company}
              onChange={set('company')}
              maxLength={120}
              required
            />
          </label>
        </div>

        <div className="row">
          <label>
            Goal

            <select
              value={form.goal}
              onChange={set('goal')}
            >
              {GOALS.map((g) => (
                <option
                  key={g.value}
                  value={g.value}
                >
                  {g.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Length: ~{form.length} words

            <input
              type="range"
              min="60"
              max="160"
              step="20"
              value={form.length}
              onChange={set('length')}
            />
          </label>
        </div>

        <label>
          About you (optional, true facts only)

          <input
            value={form.about}
            onChange={set('about')}
            maxLength={400}
            placeholder="e.g. software engineer, 5+ years, backend work, looking for a senior role"
          />
        </label>

        <label>
          Your one question (optional)

          <input
            value={form.ask}
            onChange={set('ask')}
            maxLength={300}
            placeholder="e.g. how does your team hire for senior backend roles?"
          />
        </label>

        <label>
          Anything specific to mention? (optional)

          <input
            value={form.context}
            onChange={set('context')}
            maxLength={500}
            placeholder="e.g. we worked together at a previous company"
          />
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={form.compare}
            onChange={set('compare')}
          />

          Also show a generic version, to see the difference
        </label>

        <button
          className="primary"
          disabled={loading}
        >
          {loading
            ? 'Writing...'
            : 'Draft my emails'}
        </button>

        {error && (
          <p className="error">
            {error}
          </p>
        )}
      </form>

      {result && (
        <Results
          key={result.id}
          result={result}
        />
      )}

      <footer>
        Drafts are written by an open-weight model. Your samples
        are sent to generate drafts; this app does not store them.
      </footer>
    </main>
  );
}