import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    font-family: 'Inter', sans-serif;
    min-height: 100vh;
    background: #f5f7fa;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .layout {
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: 860px;
    height: 580px;
  }

  /* ── Chat column ── */
  .chat {
    flex: 1;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-header {
    padding: 14px 18px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .chat-title {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
  }

  .msgs {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb transparent;
  }

  .msgs::-webkit-scrollbar { width: 3px; }
  .msgs::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }

  .msg { display: flex; flex-direction: column; }
  .msg.user { align-items: flex-end; }
  .msg.ai   { align-items: flex-start; }

  .bubble {
    max-width: 85%;
    padding: 9px 13px;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.6;
    cursor: default;
  }

  .bubble.user {
    background: #4f46e5;
    color: white;
    border-bottom-right-radius: 3px;
  }

  .bubble.ai {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    color: #374151;
    border-bottom-left-radius: 3px;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .bubble.ai:hover    { border-color: #c4b5fd; }
  .bubble.ai.selected { border-color: #4f46e5; background: #f5f3ff; }

  .src-badge {
    font-size: 11px;
    color: #4f46e5;
    margin-top: 4px;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  /* ── Citations panel ── */
  .panel {
    width: 300px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
  }

  .panel-header {
    padding: 14px 18px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .panel-title {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
  }

  .panel-count {
    font-size: 11px;
    background: #ede9fe;
    color: #4f46e5;
    padding: 2px 8px;
    border-radius: 20px;
    font-weight: 500;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb transparent;
  }

  .panel-body::-webkit-scrollbar { width: 3px; }
  .panel-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }

  .empty-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #ddd;
    text-align: center;
    padding: 1rem;
  }

  .empty-panel-icon { font-size: 28px; }

  .empty-panel-text {
    font-size: 12px;
    color: #ccc;
    line-height: 1.6;
  }

  .query-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    color: #888;
    font-style: italic;
    line-height: 1.5;
  }

  .section-label {
    font-size: 11px;
    font-weight: 500;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .src-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
  }

  .src-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .src-tags { display: flex; gap: 5px; }

  .tag {
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 4px;
    font-weight: 500;
  }

  .tag-chunk { background: #ede9fe; color: #4f46e5; }
  .tag-page  { background: #f0fdf4; color: #16a34a; }

  .score-row {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    color: #aaa;
  }

  .score-track {
    width: 40px;
    height: 3px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;
  }

  .score-fill {
    height: 100%;
    border-radius: 2px;
    background: #4f46e5;
  }

  .src-text {
    padding: 8px 12px;
    font-size: 11.5px;
    color: #555;
    line-height: 1.7;
  }

  .highlight {
    background: #ede9fe;
    color: #4338ca;
    border-radius: 3px;
    padding: 0 2px;
  }
`;

const DEMO = [
  { id: 1, role: "user", text: "What is the refund policy?" },
  {
    id: 2, role: "ai",
    text: "Refunds must be requested within 30 days of purchase. Once approved, the amount is credited back within 7–10 business days.",
    sources: [
      { chunk: 1, page: 4, score: 0.91, text: "All refund requests must be submitted within 30 days of the original purchase date." },
      { chunk: 2, page: 4, score: 0.78, text: "Once approved, the amount will be credited back within 7 to 10 business days." },
      { chunk: 3, page: 7, score: 0.55, text: "Proof of payment such as a receipt or transaction ID is required with the request." },
    ],
    keywords: ["refund", "30 days", "7", "10"],
  },
  { id: 3, role: "user", text: "What documents are required?" },
  {
    id: 4, role: "ai",
    text: "You need to provide proof of payment such as a receipt or transaction ID along with your refund request form.",
    sources: [
      { chunk: 3, page: 7, score: 0.88, text: "Proof of payment such as a receipt or transaction ID is required with the request." },
      { chunk: 1, page: 4, score: 0.62, text: "All refund requests must be submitted within 30 days of the original purchase date." },
    ],
    keywords: ["proof", "receipt", "transaction", "documents"],
  },
];

const highlight = (text, keywords) => {
  if (!keywords?.length) return text;
  const re = new RegExp(`(${keywords.join("|")})`, "gi");
  return text.split(re).map((p, i) =>
    re.test(p) ? `<mark class="highlight">${p}</mark>` : p
  ).join("");
};

export default function CitationsPanel() {
  const [activeId, setActiveId] = useState(null);

  const activeMsg     = DEMO.find((m) => m.id === activeId);
  const prevMsg       = activeMsg ? DEMO.find((m) => m.id === activeId - 1) : null;
  const activeSources = activeMsg?.sources || [];

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="layout">

          {/* Chat */}
          <div className="chat">
            <div className="chat-header">
              <span style={{ fontSize: 20 }}>🤖</span>
              <span className="chat-title">Ask your PDF</span>
            </div>
            <div className="msgs">
              {DEMO.map((msg) => (
                <div key={msg.id} className={`msg ${msg.role}`}>
                  <div
                    className={`bubble ${msg.role} ${activeId === msg.id ? "selected" : ""}`}
                    onClick={() => msg.role === "ai" && setActiveId(activeId === msg.id ? null : msg.id)}
                  >
                    {msg.text}
                  </div>
                  {msg.role === "ai" && (
                    <div className="src-badge" onClick={() => setActiveId(activeId === msg.id ? null : msg.id)}>
                      {msg.sources.length} sources {activeId === msg.id ? "· open ↗" : "· click to view"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Citations panel */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Sources</span>
              {activeSources.length > 0 && (
                <span className="panel-count">{activeSources.length} chunks</span>
              )}
            </div>
            <div className="panel-body">
              {!activeId ? (
                <div className="empty-panel">
                  <div className="empty-panel-icon">📎</div>
                  <div className="empty-panel-text">
                    Click any AI reply<br />to see its sources
                  </div>
                </div>
              ) : (
                <>
                  {prevMsg && (
                    <>
                      <div className="section-label">Query</div>
                      <div className="query-box">{prevMsg.text}</div>
                    </>
                  )}

                  <div className="section-label">{activeSources.length} retrieved chunks</div>

                  {activeSources.map((s, i) => (
                    <div key={i} className="src-card">
                      <div className="src-card-head">
                        <div className="src-tags">
                          <span className="tag tag-chunk">Chunk {s.chunk}</span>
                          <span className="tag tag-page">Page {s.page}</span>
                        </div>
                        <div className="score-row">
                          <span>{Math.round(s.score * 100)}%</span>
                          <div className="score-track">
                            <div className="score-fill" style={{ width: `${s.score * 100}%` }} />
                          </div>
                        </div>
                      </div>
                      <div
                        className="src-text"
                        dangerouslySetInnerHTML={{ __html: highlight(s.text, activeMsg?.keywords) }}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
