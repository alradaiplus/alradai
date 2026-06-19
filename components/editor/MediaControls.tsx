"use client";

import { useRef, useState } from "react";
import { putMedia, compressImage } from "@/lib/media";
import type { NodeType } from "@/lib/types";
import { Upload, Mic, Square, Loader2 } from "lucide-react";

const ACCEPT: Partial<Record<NodeType, string>> = {
  image: "image/*",
  video: "video/*",
  voice: "audio/*",
  pdf: "application/pdf",
};

/**
 * Device-native media input for a node: upload a file straight from the device,
 * or (for voice notes) record audio in the browser. Files are stored locally in
 * IndexedDB and referenced by the node's src — no server required.
 */
export function MediaControls({
  type,
  onSrc,
}: {
  type: NodeType;
  onSrc: (src: string, fileName?: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFile = async (f: File) => {
    setBusy(true);
    try {
      const blob = type === "image" ? await compressImage(f) : f;
      const ref = await putMedia(blob);
      onSrc(ref, f.name);
    } catch (e) {
      alert(`Upload failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recRef.current = mr;
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        setBusy(true);
        try {
          const ref = await putMedia(blob);
          onSrc(ref, "recording");
        } finally {
          setBusy(false);
        }
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      mr.start();
      setRecording(true);
    } catch (e) {
      alert(`Microphone unavailable: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const btn =
    "flex items-center gap-1.5 rounded-lg border border-canvas-border px-2.5 py-1.5 text-[12px] text-ink-muted transition hover:border-accent-ring hover:text-ink disabled:opacity-50";

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT[type] ?? "*/*"}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <button className={btn} onClick={() => fileRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        Upload from device
      </button>
      {type === "voice" &&
        (recording ? (
          <button className={btn} onClick={() => recRef.current?.stop()}>
            <Square size={13} className="text-danger" /> Stop
          </button>
        ) : (
          <button className={btn} onClick={startRec} disabled={busy}>
            <Mic size={13} /> Record
          </button>
        ))}
    </div>
  );
}
