"use client";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Paperclip, File, Image, Video, X, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface Message {
  id: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  user: { id: string; name: string; avatar?: string | null; role: string };
  attachments: Attachment[];
}

interface Props {
  taskId: string;
  currentUserId: string;
  currentUserRole: string;
  initialMessages?: Message[];
}

function AttachmentPreview({ att }: { att: Attachment }) {
  if (att.type === "IMAGE") {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={att.url} alt={att.name} className="max-h-48 rounded-lg border border-slate-200 object-cover" />
      </a>
    );
  }
  if (att.type === "VIDEO") {
    return (
      <video src={att.url} controls className="max-h-48 rounded-lg border border-slate-200" />
    );
  }
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 max-w-xs"
    >
      <File className="h-4 w-4 shrink-0 text-indigo-600" />
      <span className="truncate">{att.name}</span>
    </a>
  );
}

function AttachmentIcon({ type }: { type: string }) {
  if (type === "IMAGE") return <Image className="h-3 w-3" />;
  if (type === "VIDEO") return <Video className="h-3 w-3" />;
  return <File className="h-3 w-3" />;
}

export default function TaskThread({ taskId, currentUserId, currentUserRole, initialMessages = [] }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/tasks/${taskId}/messages`);
      if (res.ok) setMessages(await res.json());
    }, 10000);
    return () => clearInterval(interval);
  }, [taskId]);

  async function sendMessage() {
    if (!content.trim() && pendingFiles.length === 0) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() || "(attachment)" }),
      });
      const msg: Message = await res.json();

      // Upload attachments
      for (const file of pendingFiles) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("messageId", msg.id);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (upRes.ok) {
          const att = await upRes.json();
          msg.attachments.push(att);
        }
      }

      setMessages((prev) => [...prev, msg]);
      setContent("");
      setPendingFiles([]);
    } finally {
      setSending(false);
    }
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    if (res.ok) {
      const updated: Message = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
    setEditingId(null);
  }

  async function deleteMessage(id: string) {
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setOpenMenuId(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  const canModify = (msg: Message) =>
    msg.user.id === currentUserId ||
    currentUserRole === "ADMIN" ||
    currentUserRole === "MANAGER";

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Send className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3 group">
            <Avatar className="h-8 w-8 shrink-0 mt-0.5">
              <AvatarImage src={msg.user.avatar ?? undefined} />
              <AvatarFallback className="text-xs">{msg.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-slate-900">{msg.user.name}</span>
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </span>
                {msg.isEdited && <span className="text-xs text-slate-400">(edited)</span>}
              </div>

              {editingId === msg.id ? (
                <div className="mt-1 space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px] text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(msg.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{msg.content}</p>
              )}

              {msg.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.attachments.map((att) => (
                    <AttachmentPreview key={att.id} att={att} />
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {canModify(msg) && editingId !== msg.id && (
              <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                  onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openMenuId === msg.id && (
                  <div className="absolute right-0 top-7 z-10 w-36 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                    <button
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => { setEditingId(msg.id); setEditContent(msg.content); setOpenMenuId(null); }}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => deleteMessage(msg.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs text-indigo-700">
              <AttachmentIcon type={f.type.startsWith("image") ? "IMAGE" : f.type.startsWith("video") ? "VIDEO" : "DOCUMENT"} />
              <span className="max-w-[120px] truncate">{f.name}</span>
              <button onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a message..."
              className="pr-10 min-h-[44px] max-h-40 resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          </div>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFileChange} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" />
          <Button variant="outline" size="icon" onClick={() => fileRef.current?.click()} title="Attach file">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button onClick={sendMessage} disabled={sending || (!content.trim() && pendingFiles.length === 0)} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Press Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}
