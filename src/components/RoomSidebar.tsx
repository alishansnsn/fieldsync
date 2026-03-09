import type { RoomUser } from '../types';
import { Users } from '@phosphor-icons/react';

interface Props {
    roomUsers: RoomUser[];
}

export default function RoomSidebar({ roomUsers }: Props) {
    return (
        <div className="room-sidebar">
            <div className="sidebar-header">
                <Users size={16} weight="bold" />
                <span>Participants ({roomUsers.length})</span>
            </div>
            <div className="sidebar-users">
                {roomUsers.map(u => (
                    <div key={u.id} className="sidebar-user">
                        <div className={`avatar avatar-sm ${u.role}`}>{u.avatar}</div>
                        <div className="sidebar-user-info">
                            <div className="sidebar-user-name">{u.name}</div>
                            <div className="sidebar-user-role">{u.role}</div>
                        </div>
                        <div className="status-dot" />
                    </div>
                ))}
                {roomUsers.length === 0 && (
                    <div className="sidebar-empty">No users online yet</div>
                )}
            </div>
            <style>{`
        .room-sidebar { display: flex; flex-direction: column; padding: 12px; gap: 8px; }
        .sidebar-header {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.72rem; font-weight: 700; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.5px;
          padding-bottom: 8px;
        }
        .sidebar-users { display: flex; flex-direction: column; gap: 6px; }
        .sidebar-user {
          display: flex; align-items: center; gap: 10px;
          padding: 8px;
        }
        .sidebar-user-info { flex: 1; }
        .sidebar-user-name { font-size: 0.82rem; font-weight: 600; }
        .sidebar-user-role { font-size: 0.68rem; color: var(--text-muted); text-transform: capitalize; }
        .sidebar-empty { font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 20px 0; }
      `}</style>
        </div>
    );
}
