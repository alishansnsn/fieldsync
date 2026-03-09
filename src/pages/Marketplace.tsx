import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SignOut, ArrowLeft } from '@phosphor-icons/react';

type Category = 'All' | 'Services' | 'Equipment' | 'Training';

interface Product {
  id: number;
  title: string;
  price: string;
  category: 'Equipment' | 'Services' | 'Training';
  description: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    title: 'Hydraulic Seal Replacement Kit',
    price: '$249',
    category: 'Equipment',
    description: 'Complete seal kit for Unit 7 hydraulic systems. Includes O-rings, gaskets, and installation guide.',
  },
  {
    id: 2,
    title: 'Certified Safety Audit',
    price: '$1,200',
    category: 'Services',
    description: 'On-site safety compliance audit by certified industrial engineer. Includes report and recommendations.',
  },
  {
    id: 3,
    title: 'Advanced LOTO Training',
    price: '$89/user',
    category: 'Training',
    description: 'Lock-Out/Tag-Out certification program. 4-hour online course with hands-on assessment.',
  },
  {
    id: 4,
    title: 'Thermal Imaging Inspection',
    price: '$450',
    category: 'Services',
    description: 'Infrared thermal scan of electrical panels and hydraulic systems. Predictive maintenance report included.',
  },
  {
    id: 5,
    title: 'Industrial Pressure Gauge Set',
    price: '$175',
    category: 'Equipment',
    description: 'Calibrated digital pressure gauge set (0-100 PSI). NIST traceable certification.',
  },
  {
    id: 6,
    title: 'Emergency Response Protocol Design',
    price: '$2,500',
    category: 'Services',
    description: 'Custom emergency response protocol development for your facility. Includes training materials.',
  },
];

const CATEGORY_COLORS: Record<Product['category'], { bg: string; color: string }> = {
  Equipment: { bg: 'var(--role-technician-muted)', color: 'var(--role-technician)' },
  Services: { bg: 'var(--role-supervisor-muted)', color: 'var(--role-supervisor)' },
  Training: { bg: 'var(--role-admin-muted)', color: 'var(--role-admin)' },
};

export default function Marketplace() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Category>('All');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = activeTab === 'All'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeTab);

  const tabs: Category[] = ['All', 'Services', 'Equipment', 'Training'];

  return (
    <div className="marketplace">
      {/* Header */}
      <header className="mp-header">
        <div className="mp-header-left">
          <button className="btn-icon" onClick={() => navigate('/')} title="Back to Dashboard">
            <ArrowLeft size={15} />
          </button>
          <span className="mp-header-title">Marketplace</span>
        </div>
        <div className="mp-header-right">
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
      <main className="mp-main">
        <section className="mp-section fade-in">
          <div className="mp-title-row">
            <div>
              <h2>Marketplace</h2>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mp-tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                className={`mp-tab${activeTab === tab ? ' mp-tab-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="mp-grid">
            {filtered.map(product => (
              <div key={product.id} className="mp-card">
                <div className="mp-card-top">
                  <span
                    className="mp-category-tag"
                    style={{
                      background: CATEGORY_COLORS[product.category].bg,
                      color: CATEGORY_COLORS[product.category].color,
                    }}
                  >
                    {product.category}
                  </span>
                  <span className="mp-price">{product.price}</span>
                </div>
                <div className="mp-card-title">{product.title}</div>
                <p className="mp-card-desc">{product.description}</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setToast(`Added "${product.title}" to cart`)}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Toast */}
      {toast && (
        <div className="mp-toast fade-in">
          {toast}
        </div>
      )}

      <style>{`
        .marketplace {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-base);
        }
        .mp-header {
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
        .mp-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mp-header-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .mp-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mp-main {
          flex: 1;
          padding: 40px 32px;
          max-width: 960px;
          margin: 0 auto;
          width: 100%;
        }
        .mp-title-row {
          margin-bottom: 16px;
        }
        .mp-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
        }
        .mp-tab {
          padding: 5px 12px;
          border-radius: var(--radius-sm);
          font-family: inherit;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-tertiary);
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .mp-tab:hover {
          color: var(--text-secondary);
          background: var(--bg-hover);
        }
        .mp-tab-active {
          color: var(--text-primary);
          background: var(--bg-raised);
          border-color: var(--border-subtle);
        }
        .mp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .mp-card {
          background: var(--bg-raised);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: border-color 0.15s;
        }
        .mp-card:hover {
          border-color: var(--border-default);
        }
        .mp-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .mp-category-tag {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: var(--radius-xs);
          font-size: 0.6875rem;
          font-weight: 600;
        }
        .mp-price {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .mp-card-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .mp-card-desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
          flex: 1;
        }
        .mp-card .btn {
          align-self: flex-start;
          margin-top: 4px;
        }
        .mp-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 10px 18px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-primary);
          z-index: 999;
          box-shadow: var(--shadow-md);
        }
        @media (max-width: 640px) {
          .mp-main { padding: 24px 16px; }
          .mp-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
