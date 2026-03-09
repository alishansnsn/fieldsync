import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import type { SafetyAlert } from '../types';
import {
  ArrowLeft, Users, PaperPlaneTilt, Warning, FileText, X, Eye
} from '@phosphor-icons/react';
import Logo from '../components/Logo';
import AgoraChatPanel from '../components/AgoraChatPanel';
import DocumentPanel from '../components/DocumentPanel';
import AlertPanel from '../components/AlertPanel';
import VideoPanel from '../components/VideoPanel';

const API_URL = import.meta.env.VITE_API_URL || '/api';

type TabType = 'chat' | 'documents' | 'alerts';

export default function Room() {
  const { id: roomId } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const {
    connected, joinRoom, leaveRoom, sendMessage,
    messages, alerts, roomUsers, documents,
    setMessages, setDocuments, setAlerts,
    newAlertCount, clearAlertCount, aiAnalyzing, aiStreamText
  } = useSocket();

  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [roomInfo, setRoomInfo] = useState<{ title: string } | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [latestAlert, setLatestAlert] = useState<SafetyAlert | null>(null);

  useEffect(() => {
    if (!roomId || !token) return;

    fetch(`${API_URL}/rooms`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((rooms: Array<{ id: string; title: string }>) => {
        const room = rooms.find(r => r.id === roomId);
        if (room) setRoomInfo(room);
      });

    Promise.all([
      fetch(`${API_URL}/rooms/${roomId}/messages`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/rooms/${roomId}/documents`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/rooms/${roomId}/alerts`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(async ([mRes, dRes, aRes]) => {
      const msgs = await mRes.json();
      const docs = await dRes.json();
      const als = await aRes.json();
      setMessages(msgs);
      setDocuments(docs);
      setAlerts(als);
    });

    joinRoom(roomId);

    return () => {
      if (roomId) leaveRoom(roomId);
    };
  }, [roomId, token]);

  useEffect(() => {
    if (alerts.length > 0) {
      const newest = alerts[alerts.length - 1];
      setLatestAlert(newest);
      setTimeout(() => setLatestAlert(null), 6000);
    }
  }, [alerts.length]);

  useEffect(() => {
    if (newAlertCount > 0 && activeTab !== 'alerts') {
      // Badge visible, don't auto-switch
    }
  }, [newAlertCount]);

  const handleSendMessage = (content: string) => {
    if (roomId) sendMessage(roomId, content);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'alerts') clearAlertCount();
  };

  const handleLeave = () => {
    navigate('/');
  };

  return (
    <div className="room-page">
      {/* Alert Toast */}
      {latestAlert && (
        <div
          className={`alert-toast fade-in`}
          onClick={() => { handleTabChange('alerts'); setLatestAlert(null); }}
        >
          <div className="toast-indicator" style={{
            background: latestAlert.alertData.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'
          }} />
          <Warning size={18} weight="bold" style={{
            color: latestAlert.alertData.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'
          }} />
          <div className="alert-toast-content">
            <div className="alert-toast-title">{latestAlert.alertData.title}</div>
            <div className="alert-toast-sub">{latestAlert.alertData.userStatement?.slice(0, 60)}...</div>
          </div>
          <button className="alert-toast-close" onClick={(e) => { e.stopPropagation(); setLatestAlert(null); }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="room-header">
        <div className="room-header-left">
          <button className="btn-icon" onClick={handleLeave}>
            <ArrowLeft size={15} />
          </button>
          <div className="room-info">
            <div className="room-info-title">{roomInfo?.title || 'Loading...'}</div>
            <div className="room-info-meta">
              <div className={`status-dot ${connected ? '' : 'offline'}`} />
              <span>{connected ? 'Connected' : 'Reconnecting...'}</span>
              <span className="meta-sep">&middot;</span>
              <Users size={11} />
              <span>{roomUsers.length} online</span>
              <span className="meta-sep">&middot;</span>
              <Logo size={12} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--accent)' }}>AI Monitoring</span>
            </div>
          </div>
        </div>
        <div className="room-header-right">
          <button
            className={`btn-icon ${showSidebar ? 'active' : ''}`}
            onClick={() => setShowSidebar(s => !s)}
            title="Toggle panel"
          >
            <Eye size={15} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="room-body">
        <div className="room-main">
          <VideoPanel
            roomId={roomId!}
            videoEnabled={videoEnabled}
            audioEnabled={audioEnabled}
            onVideoToggle={() => setVideoEnabled(v => !v)}
            onAudioToggle={() => setAudioEnabled(a => !a)}
            roomUsers={roomUsers}
          />
        </div>

        <div className={`room-panel ${showSidebar ? 'open' : 'closed'}`}>
          <div className="panel-tabs">
            {([
              { key: 'chat', label: 'Chat', icon: PaperPlaneTilt, count: 0 },
              { key: 'documents', label: 'Docs', icon: FileText, count: documents.length },
              { key: 'alerts', label: 'Safety', icon: Warning, count: newAlertCount },
            ] as const).map(tab => (
              <button
                key={tab.key}
                className={`panel-tab ${activeTab === tab.key ? 'active' : ''} ${tab.key === 'alerts' && newAlertCount > 0 ? 'has-alert' : ''}`}
                onClick={() => handleTabChange(tab.key as TabType)}
              >
                <tab.icon size={13} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`tab-count ${tab.key === 'alerts' ? 'danger' : ''}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="panel-content">
            {activeTab === 'chat' && (
              <AgoraChatPanel
                messages={messages}
                onSend={handleSendMessage}
                currentUser={user!}
                roomId={roomId!}
                aiAnalyzing={aiAnalyzing}
                aiStreamText={aiStreamText}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentPanel
                documents={documents}
                roomId={roomId!}
                token={token!}
                currentUser={user!}
              />
            )}
            {activeTab === 'alerts' && (
              <AlertPanel alerts={alerts} />
            )}
          </div>
        </div>
      </div>

      <style>{`
        .room-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          background: var(--bg-base);
        }
        .room-header {
          height: var(--header-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-base);
          flex-shrink: 0;
          z-index: 50;
        }
        .room-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .room-info-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .room-info-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.6875rem;
          color: var(--text-tertiary);
          margin-top: 1px;
        }
        .meta-sep { opacity: 0.3; }
        .room-header-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .room-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        .room-main {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .room-panel {
          width: 360px;
          border-left: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: width 0.2s ease, opacity 0.2s ease;
          overflow: hidden;
          background: var(--bg-base);
        }
        .room-panel.closed {
          width: 0;
          opacity: 0;
        }
        .panel-tabs {
          display: flex;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-base);
          flex-shrink: 0;
        }
        .panel-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 10px 6px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-tertiary);
          font-family: inherit;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }
        .panel-tab:hover {
          color: var(--text-secondary);
        }
        .panel-tab.active {
          color: var(--text-primary);
          border-bottom-color: var(--accent);
        }
        .panel-tab.has-alert {
          color: var(--danger);
        }
        .panel-tab.has-alert.active {
          border-bottom-color: var(--danger);
        }
        .tab-count {
          background: var(--accent-muted);
          color: var(--accent);
          border-radius: var(--radius-xs);
          padding: 0 5px;
          font-size: 0.625rem;
          font-weight: 600;
          min-width: 16px;
          text-align: center;
          line-height: 16px;
        }
        .tab-count.danger {
          background: var(--danger-muted);
          color: var(--danger);
        }
        .panel-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Toast */
        .alert-toast {
          position: fixed;
          top: calc(var(--header-height) + 8px);
          right: 12px;
          z-index: 1000;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          max-width: 340px;
          cursor: pointer;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .toast-indicator {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 2px;
        }
        .alert-toast-content { flex: 1; }
        .alert-toast-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .alert-toast-sub {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .alert-toast-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary);
          padding: 2px;
          transition: color 0.15s;
        }
        .alert-toast-close:hover { color: var(--text-secondary); }

        @media (max-width: 768px) {
          .room-panel {
            position: fixed;
            right: 0;
            top: var(--header-height);
            bottom: 0;
            width: 100% !important;
            z-index: 40;
          }
          .room-panel.closed {
            transform: translateX(100%);
            width: 100% !important;
            opacity: 1;
          }
        }
        @media (max-width: 640px) {
          .room-header {
            padding: 0 10px;
            gap: 6px;
          }
          .room-header-left {
            min-width: 0;
            flex: 1;
            gap: 8px;
          }
          .room-info {
            min-width: 0;
            flex: 1;
          }
          .room-info-title {
            font-size: 0.8125rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .room-info-meta {
            flex-wrap: wrap;
            gap: 4px;
            font-size: 0.625rem;
          }
          .panel-tab {
            min-height: 44px;
            padding: 10px 4px;
            font-size: 0.8125rem;
          }
          .alert-toast {
            right: 8px;
            left: 8px;
            max-width: none;
          }
          .alert-toast-close {
            min-width: 36px;
            min-height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
