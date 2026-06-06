import { useState } from "react";
import PDFUploader from "./PDFUploader";
import ChatInterface from "./ChatInterface";

export default function App() {
  const [doc, setDoc] = useState(null);

  return doc ? (
    <ChatInterface docId={doc.doc_id} docName={doc.name} />
  ) : (
    <PDFUploader onUploadSuccess={(data) => setDoc(data)} />
  );
}