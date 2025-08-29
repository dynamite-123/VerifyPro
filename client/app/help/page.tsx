 'use client';

import React, { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { chatQuery } from '@/services/chat';

export default function HelpPage() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Array<{ from: 'user'|'bot'; text: string }>>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = [
    'How do I upload my Aadhaar and PAN?',
    'What format is the signature image?',
    'How is signature confidence calculated?'
  ];

  useEffect(() => {
    setMessages([
      { from: 'bot', text: "Hi — I'm the KYC Help Assistant. Ask me about uploading Aadhaar/PAN, signatures, or verification steps." },
    ]);
  }, []);

  // Intentionally do not auto-scroll when messages update to avoid jarring jumps.
  // Kept messagesEndRef for future manual scroll controls if needed.

  const submitQuery = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query) return;

    setMessages(prev => [...prev, { from: 'user', text: query }]);
    setInput('');

    if (!isAuthenticated) {
      setMessages(prev => [...prev, { from: 'bot', text: 'Please log in to send this query. You can still browse the help page or try the quick prompts.' }]);
      return;
    }

    setIsSending(true);
  setMessages(prev => [...prev, { from: 'bot', text: '...' }]);

    try {
  const answer = await chatQuery(query, 3);
  setMessages(prev => prev.filter(m => !(m.from === 'bot' && m.text === '...')));

  setMessages(prev => [...prev, { from: 'bot', text: answer || 'Sorry, I could not find an answer.' }]);
    } catch (err) {
      setMessages(prev => prev.filter(m => !(m.from === 'bot' && m.text === '...')));
      setMessages(prev => [...prev, { from: 'bot', text: 'Something went wrong. Please try again later.' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-[78vh] bg-transparent">
      <div className="w-full h-full bg-white rounded-xl p-6 flex flex-col" style={{ boxShadow: '0 6px 20px rgba(16,24,40,0.12)', border: '1px solid rgba(203,213,225,0.6)' }}>
        <div className="flex-1 overflow-auto pb-4 space-y-3">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-4 py-2 rounded-xl break-words text-sm ${m.from === 'user' ? 'bg-blue-50 text-slate-900 border border-blue-100 rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-gray-100'}`}>
                <div>{m.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-3">
          <div className="flex gap-2 mb-3">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => submitQuery(p)}
                className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 hover:bg-blue-100"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <input
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Ask about Aadhaar, PAN, signature verification..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuery(); } }}
              aria-label="Ask the KYC assistant"
              autoFocus
              disabled={isSending}
            />
            <Button onClick={() => submitQuery()} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>

          {!isAuthenticated && (
            <div className="mt-3 text-sm text-gray-600">You can type questions, but please <a href="/auth/login" className="text-blue-600 underline">log in</a> to send queries to the assistant.</div>
          )}
        </div>
      </div>
    </div>
  );
}
