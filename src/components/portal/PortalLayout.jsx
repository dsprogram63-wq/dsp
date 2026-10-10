import React, { useState } from 'react';
import PortalSidebar from './PortalSidebar';
import PortalHeader from './PortalHeader';
import { initialProfile, initialNotifications } from '../../data/mockData';
import './PortalLayout.css';

export default function PortalLayout({ 
  currentPath = 'dashboard', 
  title, 
  subtitle, 
  profile,
  onNavigate, 
  projectsCount,
  projects,
  children 
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const unreadCount = initialNotifications.filter(n => n.unread).length;

  return (
    <div className="portal-root">
      {/* Sidebar */}
      <PortalSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        unreadCount={unreadCount}
        projectsCount={projectsCount}
        projects={projects}
      />

      {/* Main Area */}
      <div className="portal-main-area">
        {/* Top Header */}
        <PortalHeader
          title={title}
          subtitle={subtitle}
          profile={profile || initialProfile}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onNavigate={onNavigate}
        />

        {/* Dynamic Content */}
        <main className="portal-content-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
}
