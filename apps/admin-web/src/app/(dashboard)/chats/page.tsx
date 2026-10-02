"use client";

import React, { useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { MessageSquare, Send, Inbox, User } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  sender: "customer" | "agent";
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  customerName: string;
  subject: string;
  time: string;
  unread: boolean;
  messages: ChatMessage[];
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const activeChat = conversations.find((c) => c.id === selectedId);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedId) return;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedId) {
          return {
            ...c,
            messages: [
              ...c.messages,
              {
                id: Date.now().toString(),
                sender: "agent",
                text: replyText.trim(),
                time: "Just now",
              },
            ],
          };
        }
        return c;
      })
    );

    toast.success("Reply dispatched to customer");
    setReplyText("");
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Support" title="Customer Helpdesk & Live Tickets" />

      <div className="p-8 max-w-5xl mx-auto bg-white rounded-2xl border border-[#E4E7E9] shadow-sm h-[600px] flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-1/3 border-r border-[#E4E7E9] p-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-bold text-[#5B6B65] uppercase mb-3">
            Open Conversations ({conversations.length})
          </p>

          {conversations.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 text-[#5B6B65]">
              <Inbox className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-xs font-semibold text-[#0F2A22]">No Open Inquiries</p>
              <p className="text-[11px] text-[#5B6B65] mt-1">Queue is currently clear</p>
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`p-3 rounded-xl cursor-pointer transition ${
                  selectedId === c.id ? "bg-[#F1F3F4] border border-[#E4E7E9]" : "hover:bg-[#F9FAFB]"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#0F2A22]">{c.customerName}</span>
                  <span className="text-[10px] text-[#5B6B65]">{c.time}</span>
                </div>
                <p className="text-xs text-[#5B6B65] truncate mt-1">{c.subject}</p>
              </div>
            ))
          )}
        </div>

        {/* Chat Thread */}
        <div className="flex-1 flex flex-col justify-between p-6 bg-[#FAFAFA]">
          {activeChat ? (
            <>
              <div className="space-y-4 overflow-y-auto pr-2 flex-1">
                <div className="border-b border-[#E4E7E9] pb-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] text-white text-xs font-bold flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#0F2A22]">{activeChat.customerName}</h4>
                      <p className="text-[11px] text-[#5B6B65]">{activeChat.subject}</p>
                    </div>
                  </div>
                </div>

                {activeChat.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl max-w-md text-xs leading-relaxed ${
                      m.sender === "agent"
                        ? "bg-[hsl(var(--primary))] text-white ml-auto"
                        : "bg-white text-[#0F2A22] border border-[#E4E7E9]"
                    }`}
                  >
                    <p>{m.text}</p>
                    <span
                      className={`block text-[10px] mt-1 text-right ${
                        m.sender === "agent" ? "text-white/80" : "text-[#5B6B65]"
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendReply} className="pt-4 border-t border-[#E4E7E9] flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply or canned answer..."
                  className="flex-1 px-4 py-2 bg-white border border-[#E4E7E9] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#5B6B65] p-8">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#E4E7E9] flex items-center justify-center text-[#5B6B65] mb-3 shadow-sm">
                <MessageSquare className="w-6 h-6 opacity-40" />
              </div>
              <h4 className="font-bold text-[#0F2A22] text-sm mb-1">No Conversation Selected</h4>
              <p className="text-xs max-w-xs text-[#5B6B65]">
                {conversations.length === 0
                  ? "When customers submit support questions or inquiries, active tickets will appear in the queue."
                  : "Select an active ticket from the sidebar to view conversation history and reply."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
