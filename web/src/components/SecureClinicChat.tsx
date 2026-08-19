import React, { useState, FormEvent, useEffect, useRef } from "react";
import { MessageSquare, Send, ShieldAlert, CheckCircle, Users } from "lucide-react";
import { ClinicMessage } from "../types";

interface Props {
  messages: ClinicMessage[];
  currentRole: string;
  activeChannel: string;
  setActiveChannel: (ch: string) => void;
  onPostMessage: (text: string, channel: string) => void;
}

export default function SecureClinicChat({
  messages,
  currentRole,
  activeChannel,
  setActiveChannel,
  onPostMessage,
}: Props) {
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const channels = ["#general-clinical", "#billing-frontdesk", "#emergency-notices"];

  const activeMessages = messages.filter((m) => m.channel === activeChannel);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onPostMessage(inputText.trim(), activeChannel);
    setInputText("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChannel]);

  return (
    <div className="bg-white border rounded shadow-md grid grid-cols-1 md:grid-cols-12 h-[550px] overflow-hidden">
      {/* Sidebar Channels (3 cols) */}
      <div className="md:col-span-3 border-r bg-slate-50 flex flex-col h-full">
        <div className="p-4 border-b bg-slate-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-slate-700" />
          <h3 className="font-bold text-sm text-[#00334f] font-sans">Clinic Channels</h3>
        </div>

        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {channels.map((chan) => (
            <button
              key={chan}
              onClick={() => setActiveChannel(chan)}
              className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-all ${
                activeChannel === chan
                  ? "bg-[#0b4a6e] text-white"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{chan}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t bg-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4 text-[#00334f]" />
            Active Clinic Staff
          </div>
          <div className="space-y-1 text-[11px] text-slate-600">
            <p className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Dr. P. Silva (Doctor)
            </p>
            <p className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Ms. S. Jayasekara (Admin)
            </p>
            <p className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Mr. T. Perera (Receptionist)
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Conversation (9 cols) */}
      <div className="md:col-span-9 flex flex-col h-full bg-slate-50/50">
        {/* Chat Header */}
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">{activeChannel} Channel</h4>
            <p className="text-[11px] text-gray-400">Internal secure chat compliant with clinical guidelines.</p>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Signed-In: {currentRole}
          </span>
        </div>

        {/* Message Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[350px]">
          {activeMessages.map((msg) => {
            const isMe = msg.senderRole === currentRole;
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

          {activeMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-400 text-xs">
              <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
              <p>No messages posted in this secure clinical channel yet.</p>
              <p className="text-[10px] italic mt-1">Submit a message below to broadcast updates to the clinic desk.</p>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex gap-2">
          <input
            type="text"
            placeholder={`Type secure message as ${currentRole}...`}
            className="flex-grow p-2.5 border text-xs rounded focus:border-[#00334f] outline-none bg-slate-50"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="submit"
            className="bg-[#00334f] hover:bg-[#0c4a6e] text-white font-bold p-2.5 rounded transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
