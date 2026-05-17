import React from 'react';
import { Map, LayoutGrid, BookOpen, User, type LucideIcon } from 'lucide-react';
import { useAppStore, Tab } from '../store/appStore';

const ICONS: Record<Tab, LucideIcon> = {
  map: Map,
  dashboard: LayoutGrid,
  library: BookOpen,
  profile: User,
};

const LABELS: Record<Tab, string> = {
  map: 'Map',
  dashboard: 'Dashboard',
  library: 'Library',
  profile: 'Profile',
};

const TABS: Tab[] = ['map', 'dashboard', 'library', 'profile'];

export default function TabBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="tab-bar">
      {TABS.map((tab) => {
        const Icon = ICONS[tab];
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            className={`tab-bar-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            aria-label={`${LABELS[tab]} tab`}
            aria-pressed={isActive}
          >
            <span className="tab-icon">
              <Icon size={24} strokeWidth={isActive ? 2.25 : 1.85} />
            </span>
            <span>{LABELS[tab]}</span>
          </button>
        );
      })}
    </div>
  );
}
