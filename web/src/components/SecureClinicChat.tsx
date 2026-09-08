import React, { useState, FormEvent, useEffect, useRef, useMemo } from "react";
import { MessageSquare, Send, CheckCircle, Users, Search } from "lucide-react";
import { ClinicMessage } from "../types";

export type ChatStaff = { id: string; name: string; role?: string };

interface Props {
  messages: ClinicMessage[];
  currentRole: string;
  currentUserName?: string;
  currentUserId?: string;
  hospitalId?: string;
  staff?: ChatStaff[];
  onPostMessage: (text: string, recipient: ChatStaff) => void;
}

function threadId(a: string, b: string) {
  const pair = [a, b].filter(Boolean).sort();
  return `dm:${pair[0] || "unknown"}__${pair[1] || "unknown"}`;
}

export default function SecureClinicChat({
  messages,
  currentRole,
  currentUserName,
  currentUserId,
  hospitalId,
  staff = [],
  onPostMessage,
}: Props) {
  const meId = currentUserId || currentUserName || currentRole;
  const people = useMemo(() => {
    const seen = new Set<string>();
    return staff.filter((s) => {
      if (!s.id || !s.name) return false;
      if (s.id === meId || s.name === currentUserName) return false;
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [staff, meId, currentUserName]);

  const [selectedId, setSelectedId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const visiblePeople = people.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${p.name} ${p.role || ""}`.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!selectedId && visiblePeople[0]) setSelectedId(visiblePeople[0].id);
  }, [selectedId, visiblePeople]);

  const selected = people.find((p) => p.id === selectedId);
  const channel = selected ? threadId(meId, selected.id) : "";

  const threadMessages = messages.filter((m) => {
    if (hospitalId && m.hospitalId && m.hospitalId !== hospitalId) return false;
    if (channel && m.channel === channel) return true;
    if (!selected) return false;
    const toMe = m.recipientId === meId && (m.senderId === selected.id || m.sender === selected.name);
    const fromMe = (m.senderId === meId || m.sender === currentUserName) && m.recipientId === selected.id;
    return toMe || fromMe;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selected) return;
    onPostMessage(inputText.trim(), selected);
    setInputText("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages, selectedId]);

  return (
    <div className="bg-white border rounded shadow-md grid grid-cols-1 md:grid-cols-12 h-[550px] overflow-hidden">
      <div className="md:col-span-3 border-r bg-slate-50 flex flex-col h-full">
        <div className="p-4 border-b bg-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-sm text-[#00334f] font-sans">Registered staff</h3>
          </div>
          <p className="text-[10px] text-slate-500 mb-2">Choose one person. Only you and they see the thread.</p>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name…"
              className="w-full pl-7 pr-2 py-1.5 text-[11px] border rounded bg-white"
            />
          </div>
        </div>

        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {visiblePeople.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => setSelectedId(person.id)}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold transition-all ${
                selectedId === person.id
                  ? "bg-[#0b4a6e] text-white"
                  : "text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span className="block">{person.name}</span>
              {person.role && (
                <span className={`block text-[10px] font-medium ${selectedId === person.id ? "text-sky-100" : "text-slate-500"}`}>
                  {person.role}
                </span>
              )}
            </button>
          ))}
          {visiblePeople.length === 0 && (
            <p className="text-[11px] text-slate-500 p-3">No other staff registered at this medical centre.</p>
          )}
        </div>
      </div>

      <div className="md:col-span-9 flex flex-col h-full bg-slate-50/50">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">
              {selected ? selected.name : "Select a staff member"}
            </h4>
            <p className="text-[11px] text-gray-400">
              {selected
                ? `Private message to ${selected.name}${selected.role ? ` (${selected.role})` : ""}. Not visible to the rest of the clinic.`
                : "Pick someone from the registered staff list."}
            </p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Signed-In: {currentUserName || currentRole}
          </span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[350px]">
          {selected && threadMessages.map((msg) => {
            const isMe = msg.senderId === meId || msg.sender === currentUserName || msg.senderRole === currentRole;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[70%] ${
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-slate-500">{msg.sender}</span>
                  <span className="text-[9px] font-semibold text-slate-400 bg-slate-200 px-1 py-0.2 rounded">
                    {msg.senderRole}
                  </span>
                </div>
                <div
                  className={`p-3 rounded text-xs leading-relaxed ${
                    isMe
                      ? "bg-[#00334f] text-white rounded-tr-none"
                      : "bg-white border rounded-tl-none shadow-sm text-slate-800"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-gray-400 mt-0.5">{msg.timestamp}</span>
              </div>
            );
          })}

          {selected && threadMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 text-xs">
              <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
              <p>No messages yet with {selected.name}.</p>
              <p className="text-[10px] italic mt-1">Only the two of you will see this conversation.</p>
            </div>
          )}
          {!selected && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 text-xs">
              <Users className="w-10 h-10 mb-2 opacity-50" />
              <p>Select a registered staff member to send a private message.</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex gap-2">
          <input
            type="text"
            disabled={!selected}
            placeholder={selected ? `Message ${selected.name}…` : "Select a person first"}
            className="flex-grow p-2.5 border text-xs rounded focus:border-[#00334f] outline-none bg-slate-50 disabled:opacity-60"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!selected}
            className="bg-[#00334f] hover:bg-[#0c4a6e] text-white font-bold p-2.5 rounded transition-all active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
