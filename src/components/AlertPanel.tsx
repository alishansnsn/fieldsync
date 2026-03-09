import type { SafetyAlert } from '../types';
import { Warning, WarningCircle, Info } from '@phosphor-icons/react';

interface Props {
  alerts: SafetyAlert[];
}

const SEVERITY_CONFIG = {
  critical: {
    icon: Warning,
    color: 'var(--danger)',
    label: 'CRITICAL',
  },
  warning: {
    icon: WarningCircle,
    color: 'var(--warning)',
    label: 'WARNING',
  },
  info: {
    icon: Info,
    color: 'var(--info)',
    label: 'INFO',
  },
};

export default function AlertPanel({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="alert-panel-empty">
        <div className="status-dot" />
        <span>No alerts</span>
        <style>{`
          .alert-panel-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 8px;
            color: var(--text-tertiary);
            font-size: 0.8125rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="alert-panel-list">
      <div className="alert-panel-header">
        <Warning size={14} weight="bold" />
        <span>{alerts.length} Safety Alert{alerts.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="alerts-scroll">
        {[...alerts].reverse().map(alert => {
          const cfg = SEVERITY_CONFIG[alert.alertData.severity] || SEVERITY_CONFIG.warning;
          const Icon = cfg.icon;
          return (
            <div
              key={alert.id}
              className="alert-card slide-in"
              style={{
                borderLeftColor: cfg.color,
              }}
            >
              <div className="alert-card-header">
                <Icon size={16} weight="bold" style={{ color: cfg.color, flexShrink: 0 }} />
                <span className="alert-severity" style={{ color: cfg.color }}>{cfg.label}</span>
                <span className="alert-time">
                  {new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="alert-card-title">{alert.alertData.title}</div>

              <div className="alert-conflict">
                <div className="conflict-row">
                  <span className="conflict-label">User said</span>
                  <span className="conflict-text">"{alert.alertData.userStatement}"</span>
                </div>
                <div className="conflict-vs">vs</div>
                <div className="conflict-row">
                  <span className="conflict-label">Manual states</span>
                  <span className="conflict-text">"{alert.alertData.documentStatement}"</span>
                </div>
              </div>

              {alert.alertData.recommendation && (
                <div className="alert-action">
                  <span className="action-label">Recommended action</span>
                  <span className="action-text">{alert.alertData.recommendation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .alert-panel-list {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .alert-panel-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--danger);
          background: var(--danger-muted);
          flex-shrink: 0;
        }
        .alerts-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .alert-card {
          border: 1px solid var(--border-subtle);
          border-left: 2px solid;
          border-radius: var(--radius-md);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: var(--bg-raised);
        }
        .alert-card-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .alert-severity {
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          flex: 1;
        }
        .alert-time {
          font-size: 0.625rem;
          color: var(--text-tertiary);
        }
        .alert-card-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .alert-conflict {
          background: var(--bg-base);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .conflict-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .conflict-label {
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--text-tertiary);
        }
        .conflict-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-style: italic;
          line-height: 1.4;
        }
        .conflict-vs {
          text-align: center;
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--text-tertiary);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .alert-action {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 10px;
          background: var(--success-muted);
          border: 1px solid var(--success-border);
          border-radius: var(--radius-sm);
        }
        .action-label {
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--success);
        }
        .action-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        @media (max-width: 640px) {
          .alerts-scroll {
            padding: 10px;
            gap: 8px;
          }
          .alert-card {
            padding: 10px;
          }
          .alert-card-title {
            font-size: 0.875rem;
          }
          .conflict-text {
            font-size: 0.8125rem;
            word-break: break-word;
          }
          .alert-conflict {
            padding: 8px;
          }
          .alert-action {
            padding: 8px;
          }
          .action-text {
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
  );
}
