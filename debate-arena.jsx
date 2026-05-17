import { useState, useCallback, useEffect } from "react";

// ═══════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════

const S = {
  page:  { background: "#f4f3f0", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "2rem 1.25rem 4rem" },
  inner: { maxWidth: 860, margin: "0 auto" },
  title: { fontFamily: "Georgia, serif", fontSize: 22, fontWeight: "normal", color: "#1a1a18", letterSpacing: ".02em", marginBottom: 2 },
  sub:   { fontSize: 13, color: "#909088", marginBottom: "1.75rem" },
  controls: { display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" },
  input: { flex: 1, minWidth: 200, padding: "9px 13px", fontSize: 14, border: "1px solid #dddad4", borderRadius: 8, background: "#fff", color: "#1a1a18", outline: "none", fontFamily: "inherit" },
  btnBase:    { padding: "9px 18px", fontSize: 13, fontWeight: 500, fontFamily: "inherit", borderRadius: 8, border: "1px solid transparent", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  btnDark:    { background: "#1c1c1a", color: "#fff", borderColor: "#1c1c1a" },
  btnVerdict: { background: "#2d4030", color: "#d8eeda", borderColor: "#2d4030" },
  btnReset:   { background: "#fff", color: "#606058", borderColor: "#dddad4" },
  btnDis:     { opacity: .38, cursor: "not-allowed" },
  pill:  { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#767870", background: "#eceae5", borderRadius: 20, padding: "3px 11px", marginBottom: "1rem", letterSpacing: ".04em", textTransform: "uppercase" },
  dot:   { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  card:  { background: "#fff", border: "1px solid #e2e0d9", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.05)", overflow: "hidden", marginBottom: 12 },
  cHead: { display: "flex", alignItems: "center", gap: 9, padding: "11px 15px", borderBottom: "1px solid #eeece6" },
  chip:  { width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 },
  cTitle:{ fontSize: 13, fontWeight: 600, color: "#1a1a18" },
  cTag:  { marginLeft: "auto", fontSize: 11, color: "#9a9890", letterSpacing: ".04em", textTransform: "uppercase" },
  cBody: { padding: "14px 15px" },
  argText: { fontFamily: "Georgia, serif", fontSize: 14, lineHeight: 1.8, color: "#28281e" },
  muted:   { fontSize: 13, color: "#c0bdb5", fontStyle: "italic" },
  barRow:  { display: "flex", alignItems: "center", gap: 8, marginBottom: 7 },
  barLbl:  { fontSize: 11.5, color: "#888880", width: 76, flexShrink: 0 },
  barTrk:  { flex: 1, height: 5, background: "#eeecea", borderRadius: 3, overflow: "hidden" },
  barVal:  { fontSize: 12, fontWeight: 600, width: 22, textAlign: "right", flexShrink: 0 },
  th: { padding: "7px 9px", textAlign: "center", fontSize: 10.5, fontWeight: 600, color: "#8a8880", letterSpacing: ".05em", textTransform: "uppercase", background: "#fafaf7", borderBottom: "1px solid #eeece6" },
  td: { padding: "8px 9px", textAlign: "center", borderBottom: "1px solid #f3f2ee", fontSize: 12 },
  totBar: { display: "flex", alignItems: "center", gap: 12, padding: "10px 15px", borderTop: "1px solid #eeece6", background: "#fafaf7", flexWrap: "wrap" },
  vTop:  { padding: "22px 20px 16px", textAlign: "center", borderBottom: "1px solid #eeece6" },
  vBody: { padding: "16px 20px" },
  vProse:{ fontFamily: "Georgia, serif", fontSize: 14.5, lineHeight: 1.8, color: "#2a2820", fontStyle: "italic", textAlign: "center", marginBottom: 16 },
  err:   { fontSize: 13, color: "#7a3030", background: "#f8eeee", border: "1px solid #e4cccc", borderRadius: 8, padding: "9px 13px", marginBottom: 12 },
};

// ═══════════════════════════════════════════════════════
// PROMPTS
// ═══════════════════════════════════════════════════════

const P = {
  proposer: (t) =>
`You are a skilled debate champion arguing IN FAVOR of the following topic.
- Build the strongest possible case FOR this position
- Use clear logic, real-world examples, and compelling reasoning
- Structure: opening claim, 2-3 supporting points, closing statement
- Be confident, persuasive, direct. Do NOT acknowledge the opposing side.
- Keep your response to 150-200 words.
Topic: ${t}
Deliver your argument now.`,

  opposer: (t, p) =>
`You are a skilled debate champion arguing AGAINST the following topic.
- Directly rebut the specific points made by the Proposer
- Build a strong counter-case AGAINST this position
- Structure: rebut Proposer, then 2-3 independent counter-points, then close strongly
- Be sharp, confident, direct. 150-200 words.
Topic: ${t}
Proposer's argument:
${p}
Deliver your counter-argument now.`,

  judge: (t, p, o) =>
`You are an impartial debate judge scoring one round.
Score each debater on:
- Logic (0-10): reasoning quality and structure
- Evidence (0-10): examples, facts, real-world support
- Persuasion (0-10): rhetoric and compelling delivery
Topic: ${t}
Proposer's argument:
${p}
Opposer's argument:
${o}
Return ONLY a valid JSON object. No markdown, no code fences, no text before or after.
Exact format:
{"proposer":{"logic":7,"evidence":6,"persuasion":8,"total":21,"summary":"One sentence."},"opposer":{"logic":8,"evidence":7,"persuasion":7,"total":22,"summary":"One sentence."},"round_winner":"opposer","round_commentary":"One or two sentences."}
Rules: total MUST equal logic+evidence+persuasion. round_winner MUST be exactly "proposer" or "opposer".`,

  verdict: (t, history, cum) => {
    const lines = history.map((h, i) =>
      `Round ${i+1}: Proposer ${h.scores?.proposer?.total ?? "?"} pts, Opposer ${h.scores?.opposer?.total ?? "?"} pts. Winner: ${h.scores?.round_winner ?? "unknown"}. ${h.scores?.round_commentary ?? ""}`
    ).join("\n");
    return `You are the chief debate judge delivering a final verdict.
Topic debated: "${t}"
Round-by-round results:
${lines}
Overall totals — Proposer: ${cum.proposer} pts, Opposer: ${cum.opposer} pts.
Write a final verdict of 2-3 sentences. Name the overall winner clearly. Highlight the decisive strength that won the debate. Be authoritative and concise. Plain prose only, no markdown, no JSON.`;
  },
};

// ═══════════════════════════════════════════════════════
// STREAMING
// ═══════════════════════════════════════════════════════

async function streamClaude(system, userMsg, onToken) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      stream: true,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const reader = res.body.getReader();
  const dec    = new TextDecoder();
  let   full   = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value, { stream: true }).split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const p = JSON.parse(raw);
        if (p.type === "content_block_delta" && p.delta?.text) { full += p.delta.text; onToken(p.delta.text); }
      } catch {}
    }
  }
  return full;
}

function parseJSON(raw) {
  try {
    const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
    if (s === -1 || e === -1) return null;
    return JSON.parse(raw.slice(s, e + 1));
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════

function Cursor() {
  return <span style={{ display:"inline-block", width:2, height:14, background:"#5a8a5a", verticalAlign:"middle", marginLeft:1, borderRadius:1, animation:"dbcur .75s step-end infinite" }} />;
}

function Bar({ label, value, state }) {
  const fill = state === "win" ? "#6aaa7a" : state === "lose" ? "#cc7a7a" : "#aaa8a0";
  const text = state === "win" ? "#2a6a36" : state === "lose" ? "#8a2a2a" : "#666660";
  return (
    <div style={S.barRow}>
      <span style={S.barLbl}>{label}</span>
      <div style={S.barTrk}><div style={{ height:"100%", borderRadius:3, background:fill, width:`${value*10}%`, transition:"width .55s ease" }} /></div>
      <span style={{ ...S.barVal, color:text }}>{value}</span>
    </div>
  );
}

function AgentCard({ chipBg, emoji, name, stance, text, streaming, scores, state }) {
  const bg  = state==="win" ? "#eef6ee" : state==="lose" ? "#f8eeee" : "#f4f3ef";
  const bd  = state==="win" ? "#b4d8bc" : state==="lose" ? "#e0c0c0" : "#dddad4";
  const clr = state==="win" ? "#236a30" : state==="lose" ? "#8a2a2a" : "#555550";
  return (
    <div style={{ ...S.card, display:"flex", flexDirection:"column", marginBottom:0 }}>
      <div style={S.cHead}>
        <div style={{ ...S.chip, background:chipBg }}>{emoji}</div>
        <span style={S.cTitle}>{name}</span>
        <span style={S.cTag}>{stance}</span>
      </div>
      <div style={{ ...S.cBody, flex:1, minHeight:160 }}>
        {!text && <p style={S.muted}>{streaming ? "Preparing…" : "Waiting…"}</p>}
        {text  && <p style={S.argText}>{text}{streaming && <Cursor />}</p>}
        {scores && (
          <div style={{ marginTop:13, paddingTop:13, borderTop:"1px solid #eeece6" }}>
            <div style={{ marginBottom:10 }}>
              <Bar label="Logic"      value={scores.logic}      state={state} />
              <Bar label="Evidence"   value={scores.evidence}   state={state} />
              <Bar label="Persuasion" value={scores.persuasion} state={state} />
            </div>
            <span style={{ fontSize:11.5, padding:"3px 10px", borderRadius:20, border:`1px solid ${bd}`, background:bg, color:clr, fontWeight:600 }}>
              {state === "win" ? "🏆 " : ""}Total {scores.total}/30
            </span>
            {scores.summary && <div style={{ fontSize:12, color:"#686860", lineHeight:1.55, padding:"7px 10px", background:"#fafaf7", border:"1px solid #eeece6", borderRadius:6, marginTop:8 }}>{scores.summary}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════

const INIT = {
  round:0, phase:"idle",
  aText:"", bText:"", judgeRaw:"", judgeComment:"", roundScores:null,
  history:[], cum:{ proposer:0, opposer:0, rP:0, rO:0 },
  verdict:"", verdictDone:false, error:"",
};

export default function DebateArena() {
  const [topic,   setTopic]   = useState("");
  const [st,      setSt]      = useState(INIT);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (document.getElementById("dba-kf")) return;
    const el = document.createElement("style");
    el.id = "dba-kf";
    el.textContent = "@keyframes dbcur{0%,100%{opacity:1}50%{opacity:0}} @keyframes dblive{0%,100%{opacity:1}50%{opacity:.25}}";
    document.head.appendChild(el);
  }, []);

  const upd = p => setSt(prev => ({ ...prev, ...p }));
  const reset = () => { setSt(INIT); setRunning(false); };

  const runRound = useCallback(async () => {
    if (!topic.trim()) { upd({ error:"Please enter a debate topic." }); return; }
    upd({ error:"", aText:"", bText:"", judgeRaw:"", judgeComment:"", roundScores:null });
    setRunning(true);
    const r = st.round + 1;
    upd({ round:r, phase:"proposer", verdict:"", verdictDone:false });

    try {
      let propArg = "";
      await streamClaude(P.proposer(topic), "Make your argument.", tok => {
        propArg += tok;
        setSt(p => ({ ...p, aText: p.aText + tok }));
      });

      upd({ phase:"opposer" });
      let oppArg = "";
      await streamClaude(P.opposer(topic, propArg), "Make your counter-argument.", tok => {
        oppArg += tok;
        setSt(p => ({ ...p, bText: p.bText + tok }));
      });

      upd({ phase:"judge" });
      let raw = "";
      await streamClaude(P.judge(topic, propArg, oppArg), "Score this round.", tok => {
        raw += tok;
        setSt(p => ({ ...p, judgeRaw: p.judgeRaw + tok }));
      });

      const scores = parseJSON(raw);
      if (scores) {
        const pW = scores.round_winner === "proposer" ? 1 : 0;
        const oW = scores.round_winner === "opposer"  ? 1 : 0;
        setSt(prev => ({
          ...prev,
          judgeComment: scores.round_commentary || "",
          roundScores:  scores,
          phase: "done",
          history: [...prev.history, { round:r, propArg, oppArg, scores }],
          cum: {
            proposer: prev.cum.proposer + (scores.proposer?.total || 0),
            opposer:  prev.cum.opposer  + (scores.opposer?.total  || 0),
            rP: prev.cum.rP + pW,
            rO: prev.cum.rO + oW,
          },
        }));
      } else {
        upd({ phase:"done", error:"Judge returned malformed JSON — scores omitted." });
        setSt(prev => ({ ...prev, history:[...prev.history, { round:r, propArg, oppArg, scores:null }] }));
      }
    } catch(e) {
      upd({ phase:"done", error:"Error: " + e.message });
    } finally {
      setRunning(false);
    }
  }, [topic, st.round]);

  const deliverVerdict = useCallback(async () => {
    if (!st.history.length) return;
    setRunning(true);
    upd({ phase:"verdict", verdict:"", verdictDone:false });
    try {
      await streamClaude(P.verdict(topic, st.history, st.cum), "Deliver the final verdict.", tok => {
        setSt(p => ({ ...p, verdict: p.verdict + tok }));
      });
      upd({ verdictDone:true, phase:"final" });
    } catch(e) {
      upd({ error:"Verdict error: " + e.message, phase:"final" });
    } finally {
      setRunning(false);
    }
  }, [topic, st.history, st.cum]);

  const { round, phase, aText, bText, judgeRaw, judgeComment,
          roundScores, history, cum, verdict, verdictDone, error } = st;

  const overall = cum.proposer > cum.opposer ? "proposer" : cum.opposer > cum.proposer ? "opposer" : "tied";
  const winner  = roundScores?.round_winner;
  const aState  = winner === "proposer" ? "win" : winner === "opposer" ? "lose" : "neu";
  const bState  = winner === "opposer"  ? "win" : winner === "proposer" ? "lose" : "neu";

  const dotClr  = running ? "#5a9a66" : phase === "idle" ? "#c0bdb5" : "#7aaa54";
  const dotAnim = running ? "dblive 1.1s infinite" : "none";

  const phaseLabel = { idle:"Ready", proposer:`Round ${round} — Proposer arguing…`, opposer:`Round ${round} — Opposer rebutting…`, judge:`Round ${round} — Judge deliberating…`, done:`Round ${round} complete`, verdict:"Delivering final verdict…", final:"Debate concluded" }[phase] || "";

  const showAgents  = phase !== "idle" || history.length > 0;
  const showJudge   = ["judge","done","verdict","final"].includes(phase);
  const showSB      = history.length > 0;
  const showVBtn    = history.length > 0 && !running && !verdictDone;
  const showVerdict = verdict.length > 0 || phase === "verdict";
  const margin      = Math.abs(cum.proposer - cum.opposer);

  const lClr = overall==="proposer" ? "#2a6030" : overall==="opposer" ? "#7a2a2a" : "#58584e";
  const lBg  = overall==="proposer" ? "#eef6ee" : overall==="opposer" ? "#f8eeee" : "#f2f1ec";
  const lBd  = overall==="proposer" ? "#b4d8bc" : overall==="opposer" ? "#e0c0c0" : "#dddad4";

  const rClr = (h, agent) => !h.scores?.round_winner ? "#3a3a34" : h.scores.round_winner===agent ? "#2a6a36" : "#8a2a2a";
  const rBold= (h, agent) => h.scores?.round_winner===agent ? 700 : 400;

  return (
    <div style={S.page}>
      <style>{`* { box-sizing: border-box; } input::placeholder { color: #c0bdb5; } button:hover { filter: brightness(0.92); }`}</style>
      <div style={S.inner}>

        <h1 style={S.title}>AI Debate Arena</h1>
        <p  style={S.sub}>Three agents — one argues for, one against, one judges and scores.</p>

        {/* Controls */}
        <div style={S.controls}>
          <input
            style={S.input}
            placeholder='Enter a topic — e.g. "Social media does more harm than good"'
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key==="Enter" && !running && !verdictDone && runRound()}
            disabled={running || verdictDone}
          />
          {!verdictDone && (
            <button style={{ ...S.btnBase, ...S.btnDark, ...(running||!topic.trim() ? S.btnDis : {}) }} onClick={runRound} disabled={running||!topic.trim()}>
              {running && phase!=="verdict" ? "Running…" : round===0 ? "Start Debate" : "Next Round"}
            </button>
          )}
          {showVBtn && <button style={{ ...S.btnBase, ...S.btnVerdict }} onClick={deliverVerdict}>Final Verdict</button>}
          {(round>0||!!error) && <button style={{ ...S.btnBase, ...S.btnReset }} onClick={reset}>Reset</button>}
        </div>

        {error && <div style={S.err}>⚠️ {error}</div>}

        {phase!=="idle" && (
          <div style={S.pill}>
            <span style={{ ...S.dot, background:dotClr, animation:dotAnim }} />
            {phaseLabel}
          </div>
        )}

        {/* Agent cards */}
        {showAgents && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <AgentCard chipBg="#e8f0f8" emoji="🔵" name="Proposer" stance="For"    text={aText} streaming={phase==="proposer"} scores={roundScores?.proposer} state={roundScores ? aState : "neu"} />
            <AgentCard chipBg="#f8e8e8" emoji="🔴" name="Opposer"  stance="Against" text={bText} streaming={phase==="opposer"}  scores={roundScores?.opposer}  state={roundScores ? bState : "neu"} />
          </div>
        )}

        {/* Judge */}
        {showJudge && (
          <div style={S.card}>
            <div style={S.cHead}>
              <div style={{ ...S.chip, background:"#f5f0e6" }}>⚖️</div>
              <span style={S.cTitle}>Judge</span>
              <span style={S.cTag}>{phase==="judge" ? "Deliberating…" : phase==="done" ? `Round ${round} scored` : ""}</span>
            </div>
            <div style={S.cBody}>
              {phase==="judge" && !judgeComment && (
                <><p style={{ ...S.muted, marginBottom:8 }}>Parsing arguments…</p><p style={{ fontFamily:"monospace", fontSize:11, color:"#9a9890", whiteSpace:"pre-wrap", wordBreak:"break-all", lineHeight:1.5 }}>{judgeRaw}<Cursor /></p></>
              )}
              {judgeComment
                ? <p style={{ fontFamily:"Georgia, serif", fontSize:14, lineHeight:1.75, color:"#38382e", fontStyle:"italic" }}>"{judgeComment}"</p>
                : phase!=="judge" && <p style={S.muted}>Awaiting arguments…</p>
              }
            </div>
          </div>
        )}

        {/* Scoreboard */}
        {showSB && (
          <div style={S.card}>
            <div style={S.cHead}>
              <div style={{ ...S.chip, background:"#f5f0e6" }}>📋</div>
              <span style={S.cTitle}>Scoreboard</span>
              <span style={S.cTag}>{history.length} round{history.length!==1?"s":""}</span>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr>
                    <th style={{ ...S.th, textAlign:"left" }} rowSpan={2}>Rnd</th>
                    <th style={{ ...S.th, color:"#4a7aaa", borderRight:"1px solid #eeece6" }} colSpan={4}>🔵 Proposer</th>
                    <th style={{ ...S.th, color:"#aa4a4a", borderRight:"1px solid #eeece6" }} colSpan={4}>🔴 Opposer</th>
                    <th style={S.th} rowSpan={2}>Win</th>
                  </tr>
                  <tr>
                    {["Logic","Evid.","Pers.","Pts","Logic","Evid.","Pers.","Pts"].map((h,i) => (
                      <th key={i} style={{ ...S.th, borderRight:(i===3||i===7)?"1px solid #eeece6":undefined }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => {
                    const p = h.scores?.proposer, o = h.scores?.opposer;
                    return (
                      <tr key={h.round}>
                        <td style={{ ...S.td, textAlign:"left", fontWeight:600, color:"#1a1a18" }}>#{h.round}</td>
                        <td style={{ ...S.td, color:rClr(h,"proposer") }}>{p?.logic      ?? "—"}</td>
                        <td style={{ ...S.td, color:rClr(h,"proposer") }}>{p?.evidence   ?? "—"}</td>
                        <td style={{ ...S.td, color:rClr(h,"proposer") }}>{p?.persuasion ?? "—"}</td>
                        <td style={{ ...S.td, color:rClr(h,"proposer"), fontWeight:rBold(h,"proposer"), borderRight:"1px solid #f3f2ee" }}>{p?.total ?? "—"}</td>
                        <td style={{ ...S.td, color:rClr(h,"opposer")  }}>{o?.logic      ?? "—"}</td>
                        <td style={{ ...S.td, color:rClr(h,"opposer")  }}>{o?.evidence   ?? "—"}</td>
                        <td style={{ ...S.td, color:rClr(h,"opposer")  }}>{o?.persuasion ?? "—"}</td>
                        <td style={{ ...S.td, color:rClr(h,"opposer"),  fontWeight:rBold(h,"opposer"),  borderRight:"1px solid #f3f2ee" }}>{o?.total ?? "—"}</td>
                        <td style={{ ...S.td, fontSize:14 }}>{h.scores?.round_winner==="proposer" ? "🔵" : h.scores?.round_winner==="opposer" ? "🔴" : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={S.totBar}>
              <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                <span style={{ fontSize:12, color:"#8a8880" }}>🔵 Points</span>
                <span style={{ fontSize:16, fontWeight:700, color: overall==="proposer" ? "#2a6a36" : overall==="opposer" ? "#8a2a2a" : "#1a1a18" }}>{cum.proposer}</span>
              </div>
              <div style={{ width:1, height:18, background:"#e4e2da" }} />
              <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                <span style={{ fontSize:12, color:"#8a8880" }}>🔴 Points</span>
                <span style={{ fontSize:16, fontWeight:700, color: overall==="opposer" ? "#2a6a36" : overall==="proposer" ? "#8a2a2a" : "#1a1a18" }}>{cum.opposer}</span>
              </div>
              <div style={{ width:1, height:18, background:"#e4e2da" }} />
              <div style={{ display:"flex", alignItems:"baseline", gap:5 }}><span style={{ fontSize:12, color:"#8a8880" }}>🔵 Rounds</span><span style={{ fontSize:16, fontWeight:700, color:"#1a1a18" }}>{cum.rP}</span></div>
              <div style={{ width:1, height:18, background:"#e4e2da" }} />
              <div style={{ display:"flex", alignItems:"baseline", gap:5 }}><span style={{ fontSize:12, color:"#8a8880" }}>🔴 Rounds</span><span style={{ fontSize:16, fontWeight:700, color:"#1a1a18" }}>{cum.rO}</span></div>
              <div style={{ marginLeft:"auto", fontSize:12, fontWeight:600, padding:"4px 12px", borderRadius:20, background:lBg, border:`1px solid ${lBd}`, color:lClr }}>
                {overall==="proposer" ? "🔵 Proposer leads" : overall==="opposer" ? "🔴 Opposer leads" : "⚖️ Tied"}
              </div>
            </div>
          </div>
        )}

        {/* Verdict */}
        {showVerdict && (
          <div style={S.card}>
            <div style={S.vTop}>
              <div style={{ fontSize:34, marginBottom:6, lineHeight:1 }}>
                {verdictDone ? (overall==="proposer" ? "🔵" : overall==="opposer" ? "🔴" : "⚖️") : "⚖️"}
              </div>
              <div style={{ fontSize:10.5, color:"#9a9890", letterSpacing:".08em", textTransform:"uppercase", marginBottom:5 }}>Final Verdict</div>
              <div style={{ fontFamily:"Georgia, serif", fontSize:22, color:"#1a1a18", fontWeight:"normal", marginBottom:4 }}>
                {verdictDone ? (overall==="proposer" ? "Proposer wins" : overall==="opposer" ? "Opposer wins" : "A draw") : "Deliberating…"}
              </div>
              {verdictDone && overall!=="tied" && (
                <div style={{ fontSize:13, color:"#767870" }}>by {margin} point{margin!==1?"s":""} across {history.length} round{history.length!==1?"s":""}</div>
              )}
            </div>
            <div style={S.vBody}>
              <p style={S.vProse}>{verdict}{!verdictDone && <Cursor />}</p>
              {verdictDone && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    { label:"🔵 Proposer", val:cum.proposer, rounds:cum.rP, color: overall==="proposer" ? "#2a6a36" : overall==="opposer" ? "#8a2a2a" : "#1a1a18" },
                    { label:"🔴 Opposer",  val:cum.opposer,  rounds:cum.rO, color: overall==="opposer"  ? "#2a6a36" : overall==="proposer" ? "#8a2a2a" : "#1a1a18" },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign:"center", padding:"12px 10px", borderRadius:8, border:"1px solid #e2e0d9", background:"#fafaf7" }}>
                      <div style={{ fontSize:11, color:"#8a8880", letterSpacing:".04em", textTransform:"uppercase", marginBottom:3 }}>{item.label}</div>
                      <div style={{ fontFamily:"Georgia, serif", fontSize:26, color:item.color, lineHeight:1 }}>{item.val}</div>
                      <div style={{ fontSize:11, color:"#9a9890", marginTop:2 }}>{item.rounds} round{item.rounds!==1?"s":""} won</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
