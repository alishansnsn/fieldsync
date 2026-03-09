import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SignOut, Plus, CaretRight, Lock, Storefront } from '@phosphor-icons/react';
import Logo from '../components/Logo';
import type { Room } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRooms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newRoomTitle }),
      });
      const room = await res.json();
      setRooms(prev => [...prev, room]);
      setNewRoomTitle('');
      setShowCreate(false);
      navigate(`/room/${room.id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-left">
          <div className="header-brand">
            <div className="brand-mark-sm">
              <Logo size={18} />
            </div>
            <span className="brand-name">FieldSync</span>
          </div>
        </div>
        <div className="dash-header-right">
          <div className="user-chip">
            <div className={`avatar avatar-sm ${user?.role}`}>
              {user?.avatar}
            </div>
            <span className="user-chip-name">{user?.name}</span>
          </div>
          <button className="btn-icon" onClick={logout} title="Sign Out" style={{ background: 'none' }}>
            <SignOut size={18} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="dash-main">
        {/* Rooms */}
        <section className="rooms-section fade-in">
          <div className="rooms-header">
            <div>
              <h2>Rooms <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', fontWeight: 400 }}>{rooms.filter(r => r.status === 'active').length}</span></h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/marketplace')}>
                <Storefront size={14} weight="bold" />
                Marketplace
              </button>
              {(user?.role === 'supervisor' || user?.role === 'admin') && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
                  <Plus size={14} weight="bold" />
                  New Room
                </button>
              )}
            </div>
          </div>

          {/* Create Form */}
          {showCreate && (
            <form onSubmit={createRoom} className="create-form fade-in">
              <input
                className="input"
                placeholder="Room title..."
                value={newRoomTitle}
                onChange={e => setNewRoomTitle(e.target.value)}
                autoFocus
              />
              <div className="create-form-actions">
                <button type="submit" className="btn btn-primary btn-sm" disabled={creating || !newRoomTitle.trim()}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          )}

          {/* Room Grid */}
          {loading ? (
            <div className="dash-loading">
              <div className="loading-spinner" />
              <p>Loading rooms...</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className="room-card"
                  onClick={() => navigate(`/room/${room.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/room/${room.id}`)}
                >
                  <div className="room-card-body">
                    <div className="room-card-title">{room.title}</div>
                  </div>
                  <CaretRight size={16} weight="bold" className="room-arrow" />
                </div>
              ))}
            </div>
          )}

          {/* RBAC */}
          {user?.role === 'technician' && (
            <div className="rbac-notice">
              <Lock size={14} weight="bold" />
              <span>Room creation requires Supervisor or Admin role.</span>
            </div>
          )}
        </section>
      </main>

      <style>{`
        .dashboard {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-base);
        }
        .dash-header {
          height: var(--header-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-base);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .dash-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-mark-sm {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
        }
        .brand-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .dash-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
        }
        .user-chip-name {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .dash-main {
          flex: 1;
          padding: 40px 32px;
          max-width: 960px;
          margin: 0 auto;
          width: 100%;
        }
        .rooms-section {}
        .rooms-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 16px;
        }
        .create-form {
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .create-form-actions {
          display: flex;
          gap: 8px;
        }
        .dash-loading {
          text-align: center;
          padding: 48px 0;
          color: var(--text-tertiary);
        }
        .dash-loading p {
          margin-top: 12px;
          font-size: 0.8125rem;
        }
        .rooms-grid {
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: var(--border-subtle);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .room-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: var(--bg-raised);
          cursor: pointer;
          transition: background 0.12s;
        }
        .room-card:hover {
          background: var(--bg-overlay);
        }
        .room-card-body {
          flex: 1;
          min-width: 0;
        }
        .room-card-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .room-arrow {
          color: var(--text-tertiary);
          opacity: 0;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .room-card:hover .room-arrow {
          opacity: 1;
        }
        .rbac-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 10px 14px;
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }
        @media (max-width: 640px) {
          .dash-header {
            padding: 0 12px;
          }
          .brand-name {
            display: none;
          }
          .user-chip-name {
            max-width: 100px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .dash-main {
            padding: 20px 16px;
          }
          .rooms-header {
            flex-wrap: wrap;
          }
          .room-card {
            min-height: 48px;
            padding: 14px 14px;
          }
          .room-arrow {
            opacity: 1;
          }
          .create-form {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}
