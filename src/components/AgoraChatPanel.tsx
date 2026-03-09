import { useEffect, useRef, useState } from 'react';
import type { Message, User } from '../types';
import { PaperPlaneTilt, Pulse } from '@phosphor-icons/react';

interface Props {
  messages: Message[];
  onSend: (content: string) => void;
  currentUser: User;
  roomId: string;
  aiAnalyzing?: boolean;
  aiStreamText?: string;
  lastAiResult?: string;
}

export default function AgoraChatPanel({ messages, onSend, currentUser, aiAnalyzing, aiStreamText, lastAiResult }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, aiAnalyzing, aiStreamText, lastAiResult]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const DEMO_HINTS = [
    'Pressure should be increased to 50 PSI',
    'Set voltage to 240V before connecting',
    'Temperature can go up to 200\u00B0C here',
  ];

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <PaperPlaneTilt weight="light" size={20} />
            <p className="chat-empty-title">No messages</p>
            <div className="chat-hints">
              {DEMO_HINTS.map((hint, i) => (
                <button
                  key={i}
                  className="chat-hint-btn"
                  onClick={() => { setInput(hint); inputRef.current?.focus(); }}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMe = msg.senderId === currentUser.id;
              const showAvatar = i === 0 || messages[i - 1].senderId !== msg.senderId;
              return (
                <div key={msg.id} className={`chat-message ${isMe ? 'mine' : 'theirs'} fade-in`}>
                  {!isMe && showAvatar && (
                    <div className={`avatar avatar-sm ${msg.senderRole}`}>
                      {msg.senderAvatar}
                    </div>
                  )}
                  {!isMe && !showAvatar && <div style={{ width: 26 }} />}
                  <div className="chat-bubble-group">
                    {showAvatar && !isMe && (
                      <div className="chat-meta">
                        <span className="chat-sender">{msg.senderName}</span>
                        <span className="chat-time">{formatTime(msg.timestamp)}</span>
                      </div>
                    )}
                    <div className={`chat-bubble ${isMe ? 'mine' : 'theirs'}`}>
                      {msg.content}
                    </div>
                    {isMe && (
                      <div className="chat-time" style={{ textAlign: 'right' }}>
                        {formatTime(msg.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {aiAnalyzing && (
              <div className="ai-message fade-in">
                <div className="ai-label">
                  <Pulse size={12} weight="bold" />
                  <span>Safety Monitor</span>
                </div>
                <div className="ai-bubble">
                  {aiStreamText || <span className="ai-cursor" />}
                </div>
              </div>
            )}

            {!aiAnalyzing && lastAiResult && (
              <div className="ai-message fade-in">
                <div className="ai-label">
                  <Pulse size={12} weight="bold" />
                  <span>Safety Monitor</span>
                </div>
                <div className="ai-bubble">
                  {lastAiResult}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className={`send-btn ${input.trim() ? 'active' : ''}`}
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <PaperPlaneTilt size={18} weight="bold" />
        </button>
      </div>

      <style>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 4px;
          color: var(--text-tertiary);
          padding: 40px 24px;
        }
        .chat-empty-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin: 0;
        }
        .chat-hints {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 16px;
          width: 100%;
        }
        .chat-hint-btn {
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: all 0.15s;
        }
        .chat-hint-btn:hover {
          background: var(--bg-overlay);
          border-color: var(--border-default);
          color: var(--text-primary);
        }
        .chat-message {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        .chat-message.mine {
          flex-direction: row-reverse;
        }
        .chat-bubble-group {
          display: flex;
          flex-direction: column;
          max-width: 80%;
          gap: 3px;
        }
        .chat-meta {
          font-size: 0.6875rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .chat-sender {
          font-weight: 600;
          color: var(--text-secondary);
        }
        .chat-time {
          font-size: 0.625rem;
          color: var(--text-tertiary);
        }
        .chat-bubble {
          padding: 8px 12px;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          line-height: 1.5;
          word-break: break-word;
        }
        .chat-bubble.mine {
          background: var(--accent);
          color: white;
          border-bottom-right-radius: var(--radius-xs);
        }
        .chat-bubble.theirs {
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          border-bottom-left-radius: var(--radius-xs);
        }
        .ai-message {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 85%;
        }
        .ai-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--accent);
        }
        .ai-bubble {
          background: var(--accent-subtle);
          border: 1px solid rgba(94, 106, 210, 0.12);
          border-radius: var(--radius-md);
          border-top-left-radius: var(--radius-xs);
          padding: 8px 12px;
          font-size: 0.8125rem;
          line-height: 1.5;
          color: var(--text-secondary);
          white-space: pre-wrap;
          word-break: break-word;
          min-height: 20px;
        }
        .ai-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          background: var(--accent);
          animation: cursorBlink 0.8s step-end infinite;
          vertical-align: text-bottom;
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .chat-input-area {
          display: flex;
          gap: 8px;
          align-items: flex-end;
          padding: 12px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-base);
        }
        .chat-input {
          flex: 1;
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 9px 12px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.8125rem;
          outline: none;
          resize: none;
          max-height: 120px;
          transition: border-color 0.15s;
          line-height: 1.5;
        }
        .chat-input:focus {
          border-color: var(--accent);
        }
        .chat-input::placeholder {
          color: var(--text-tertiary);
        }
        .send-btn {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-tertiary);
          cursor: pointer;
          transition: all 0.15s;
        }
        .send-btn.active {
          background: var(--accent);
          border-color: transparent;
          color: white;
        }
        .send-btn:disabled {
          cursor: not-allowed;
        }
        @media (max-width: 640px) {
          .chat-messages {
            padding: 12px;
          }
          .chat-empty {
            padding: 24px 16px;
          }
          .chat-hint-btn {
            min-height: 44px;
            padding: 10px 12px;
            font-size: 0.8125rem;
            display: flex;
            align-items: center;
          }
          .chat-bubble {
            font-size: 0.875rem;
          }
          .chat-bubble-group {
            max-width: 85%;
          }
          .chat-input-area {
            padding: 10px 12px;
            gap: 8px;
          }
          .chat-input {
            font-size: 1rem;
            min-height: 44px;
            padding: 10px 12px;
          }
          .send-btn {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
    </div>
  );
}
