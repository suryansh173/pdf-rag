import { useState, useRef, useEffect } from "react";

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

  .card {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 580px;
    height: 580px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .header {
    padding: 14px 18px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .header-icon {
    font-size: 22px;
  }

  .header-title {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
  }

  .header-doc {
    font-size: 11px;
    color: #aaa;
    margin-top: 1px;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .clear-btn {
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    color: #888;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all 0.15s;
  }

  .clear-btn:hover { border-color: #ef4444; color: #ef4444; }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb transparent;
  }

  .messages::-webkit-scrollbar { width: 4px; }
  .messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }

  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #bbb;
    text-align: center;
  }

  .empty-icon { font-size: 36px; }
  .empty-text { font-size: 14px; color: #ccc; }

  .suggestions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
    width: 100%;
    max-width: 300px;
  }

  .sug-btn {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    color: #666;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s;
  }

  .sug-btn:hover { border-color: #4f46e5; color: #4f46e5; background: #f5f3ff; }

  .msg-row { display: flex; gap: 8px; animation: fadeUp 0.2s ease; }
  .msg-row.user { flex-direction: row-reverse; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .avatar {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .avatar.ai   { background: #ede9fe; }
  .avatar.user { background: #e0f2fe; }

  .bubble-wrap { max-width: 78%; display: flex; flex-direction: column; gap: 3px; }
  .msg-row.user .bubble-wrap { align-items: flex-end; }

  .bubble {
    padding: 9px 13px;
    border-radius: 12px;
    font-size: 13.5px;
    line-height: 1.6;
    word-break: break-word;
  }

  .bubble.ai {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    color: #374151;
    border-bottom-left-radius: 3px;
  }

  .bubble.user {
    background: #4f46e5;
    color: white;
    border-bottom-right-radius: 3px;
  }

  .bubble.error {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
  }

  .meta {
    font-size: 11px;
    color: #bbb;
    padding: 0 2px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .src-btn {
    background: none;
    border: none;
    font-size: 11px;
    color: #4f46e5;
    cursor: pointer;
    padding: 0;
    font-family: 'Inter', sans-serif;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .src-btn:hover { color: #4338ca; }

  .sources-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 2px;
  }

  .src-item {
    font-size: 11px;
    color: #666;
    line-height: 1.5;
    padding: 6px 8px;
    background: white;
    border-radius: 6px;
    border-left: 2px solid #c4b5fd;
  }

  .src-label {
    font-size: 10px;
    color: #4f46e5;
    font-weight: 500;
    margin-bottom: 2px;
  }

  .typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 12px 14px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    border-bottom-left-radius: 3px;
    width: fit-content;
  }

  .dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #c4b5fd;
    animation: bounce 1.2s ease-in-out infinite;
  }

  .dot:nth-child(2) { animation-delay: 0.2s; }
  .dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
  }

  .footer {
    border-top: 1px solid #f0f0f0;
    padding: 12px 14px;
    flex-shrink: 0;
  }

  .input-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 8px 8px 8px 14px;
    transition: border-color 0.2s;
  }

  .input-row:focus-within { border-color: #4f46e5; }

  .input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 13.5px;
    color: #374151;
    font-family: 'Inter', sans-serif;
    resize: none;
    line-height: 1.5;
    max-height: 90px;
    min-height: 22px;
  }

  .input::placeholder { color: #bbb; }

  .send {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #4f46e5;
    border: none;
    cursor: pointer;
    color: white;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, transform 0.1s;
  }

  .send:hover:not(:disabled) { background: #4338ca; }
  .send:active:not(:disabled) { transform: scale(0.95); }
  .send:disabled { opacity: 0.35; cursor: not-allowed; }

  .hint {
    font-size: 11px;
    color: #ccc;
    margin-top: 6px;
    text-align: center;
  }
`;

const SUGGESTIONS = [
  "Summarise this document",
  "What are the main topics covered?",
  "What are the key points?",
];

const fmt = (d) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export default function ChatInterface({ docId = null, docName = "document.pdf" }) {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [openSrc, setOpenSrc]       = useState({});
  const bottomRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const resize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px";
  };

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;

    setMessages((p) => [...p, { id: Date.now(), role: "user", text: q, time: new Date() }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await fetch("https://careful-authority-old-letting.trycloudflare.com/ask", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query: q, doc_id: docId }),
      });
      const data = await res.json();
      setMessages((p) => [...p, {
        id:      Date.now() + 1,
        role:    "ai",
        text:    data.answer,
        sources: data.sources || [],
        time:    new Date(),
      }]);
    } catch {
      setMessages((p) => [...p, {
        id:    Date.now() + 1,
        role:  "ai",
        text:  "Could not connect to backend. Make sure uvicorn is running on port 8000.",
        time:  new Date(),
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="card">

          <div className="header">
            <div className="header-left">
              <span className="header-icon">🤖</span>
              <div>
                <div className="header-title">Ask your PDF</div>
                <div className="header-doc">{docId ? docName : "No document uploaded yet"}</div>
              </div>
            </div>
            {messages.length > 0 && (
              <button className="clear-btn" onClick={() => { setMessages([]); setOpenSrc({}); }}>
                Clear
              </button>
            )}
          </div>

          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">💬</div>
                <div className="empty-text">Ask anything from your document</div>
                <div className="suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="sug-btn" onClick={() => send(s)}>{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`msg-row ${msg.role}`}>
                  <div className={`avatar ${msg.role}`}>
                    {msg.role === "ai" ? "🤖" : "👤"}
                  </div>
                  <div className="bubble-wrap">
                    <div className={`bubble ${msg.role} ${msg.error ? "error" : ""}`}>
                      {msg.text}
                    </div>
                    <div className="meta">
                      <span>{fmt(msg.time)}</span>
                      {msg.role === "ai" && msg.sources?.length > 0 && (
                        <button className="src-btn" onClick={() => setOpenSrc((p) => ({ ...p, [msg.id]: !p[msg.id] }))}>
                          {openSrc[msg.id] ? "hide sources" : `${msg.sources.length} sources`}
                        </button>
                      )}
                    </div>
                    {msg.role === "ai" && openSrc[msg.id] && (
                      <div className="sources-box">
                        {msg.sources.map((s, i) => (
                          <div key={i} className="src-item">
                            <div className="src-label">Chunk {s.chunk} · Page {s.page} · {Math.round(s.score * 100)}% match</div>
                            {s.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="msg-row">
                <div className="avatar ai">🤖</div>
                <div className="typing">
                  <div className="dot" /><div className="dot" /><div className="dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="footer">
            <div className="input-row">
              <textarea
                ref={textareaRef}
                className="input"
                placeholder="Ask a question about your document…"
                value={input}
                onChange={(e) => { setInput(e.target.value); resize(e); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={1}
              />
              <button className="send" onClick={() => send()} disabled={!input.trim() || loading}>↑</button>
            </div>
            <div className="hint">Enter to send · Shift+Enter for new line</div>
          </div>

        </div>
      </div>
    </>
  );
}
