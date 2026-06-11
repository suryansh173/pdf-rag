import { useState, useRef } from "react";

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
    padding: 2rem;
    width: 100%;
    max-width: 460px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  }

  .title {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 6px;
  }

  .subtitle {
    font-size: 14px;
    color: #888;
    margin-bottom: 1.8rem;
  }

  .drop-zone {
    border: 2px dashed #d0d5dd;
    border-radius: 12px;
    padding: 2.5rem 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #fafafa;
    margin-bottom: 1.2rem;
  }

  .drop-zone:hover, .drop-zone.over {
    border-color: #4f46e5;
    background: #f5f3ff;
  }

  .drop-zone.has-file {
    border-color: #16a34a;
    border-style: solid;
    background: #f0fdf4;
  }

  .drop-icon {
    font-size: 36px;
    margin-bottom: 10px;
  }

  .drop-text {
    font-size: 14px;
    font-weight: 500;
    color: #444;
    margin-bottom: 4px;
  }

  .drop-sub {
    font-size: 12px;
    color: #aaa;
  }

  .drop-sub span {
    color: #4f46e5;
    cursor: pointer;
    text-decoration: underline;
  }

  .file-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    margin-bottom: 1.2rem;
  }

  .file-icon { font-size: 22px; }

  .file-info { flex: 1; min-width: 0; }

  .file-name {
    font-size: 13px;
    font-weight: 500;
    color: #1a1a2e;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .file-size {
    font-size: 11px;
    color: #999;
    margin-top: 1px;
  }

  .remove-btn {
    background: none;
    border: none;
    font-size: 18px;
    color: #ccc;
    cursor: pointer;
    transition: color 0.15s;
    flex-shrink: 0;
  }

  .remove-btn:hover { color: #ef4444; }

  .progress-wrap {
    height: 4px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1.2rem;
  }

  .progress-fill {
    height: 100%;
    border-radius: 4px;
    background: #4f46e5;
    transition: width 0.3s ease;
  }

  .progress-fill.done { background: #16a34a; }

  .upload-btn {
    width: 100%;
    padding: 13px;
    background: #4f46e5;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: background 0.15s;
  }

  .upload-btn:hover:not(:disabled) { background: #4338ca; }
  .upload-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .upload-btn.done { background: #16a34a; }

  .msg {
    margin-top: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
  }

  .msg.success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .msg.error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

  input[type="file"] { display: none; }
`;

const fmt = (b) => b < 1024 * 1024
  ? (b / 1024).toFixed(1) + " KB"
  : (b / (1024 * 1024)).toFixed(2) + " MB";

export default function PDFUploader({ onUploadSuccess }) {
  const [file, setFile]       = useState(null);
  const [over, setOver]       = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const pickFile = (f) => {
    if (!f || f.type !== "application/pdf") {
      setStatus({ type: "error", msg: "Please select a PDF file." });
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setStatus({ type: "error", msg: "File must be under 20 MB." });
      return;
    }
    setFile(f);
    setStatus(null);
    setProgress(0);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setOver(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const upload = () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setStatus(null);

    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
   xhr.open("POST", "https://44-215-49-95.nip.io/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        setProgress(100);
        const data = JSON.parse(xhr.responseText);
        setStatus({ type: "success", msg: `✓ Indexed ${data.chunks} chunks from ${data.pages} pages.` });
        onUploadSuccess && onUploadSuccess({ ...data, name: file.name });
      } else {
        setProgress(0);
        setStatus({ type: "error", msg: "Upload failed. Is the backend running?" });
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setProgress(0);
      setStatus({ type: "error", msg: "Cannot connect. Run: uvicorn main:app --reload" });
    };

    xhr.send(form);
  };

  const isSuccess = status?.type === "success";

  return (
    <>
      <style>{styles}</style>
      <div className="page">
        <div className="card">
          <div className="title">📄 PDF Q&A</div>
          <div className="subtitle">Upload a PDF to start asking questions from it</div>

          <div
            className={`drop-zone ${over ? "over" : ""} ${file ? "has-file" : ""}`}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onClick={() => !file && inputRef.current.click()}
          >
            <input
              type="file"
              accept="application/pdf"
              ref={inputRef}
              onChange={(e) => pickFile(e.target.files[0])}
            />
            <div className="drop-icon">{file ? "✅" : "📂"}</div>
            {file ? (
              <div className="drop-text" style={{ color: "#16a34a" }}>File selected</div>
            ) : (
              <>
                <div className="drop-text">Drag & drop your PDF here</div>
                <div className="drop-sub">
                  or <span onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}>
                    browse
                  </span> · max 20 MB
                </div>
              </>
            )}
          </div>

          {file && (
            <div className="file-row">
              <span className="file-icon">📋</span>
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{fmt(file.size)}</div>
              </div>
              <button className="remove-btn" onClick={() => { setFile(null); setProgress(0); setStatus(null); }}>✕</button>
            </div>
          )}

          {progress > 0 && (
            <div className="progress-wrap">
              <div className={`progress-fill ${progress === 100 ? "done" : ""}`} style={{ width: `${progress}%` }} />
            </div>
          )}

          <button
            className={`upload-btn ${isSuccess ? "done" : ""}`}
            onClick={upload}
            disabled={!file || uploading || isSuccess}
          >
            {uploading ? `Uploading… ${progress}%` : isSuccess ? "✓ Ready" : "Upload & Index PDF"}
          </button>

          {status && <div className={`msg ${status.type}`}>{status.msg}</div>}
        </div>
      </div>
    </>
  );
}
