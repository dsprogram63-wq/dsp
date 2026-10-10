import React, { useState } from 'react';
import TesterSidebar from './TesterSidebar';
import TesterHeader from './TesterHeader';
import { initialTesterNotifications } from '../../data/testerMockData';
import '../admin/AdminLayout.css';
import './TesterLayout.css';

export default function TesterLayout({ 
  currentPath = 'dashboard', 
  title, 
  profile,
  onNavigate,
  onOpenProject,
  onLogout,
  projectsCount,
  projects,
  pendingCount = 3,
  inTestingCount = 2,
  revisionCount = 1,
  children 
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const unreadCount = initialTesterNotifications.filter(n => n.unread).length;

  return (
    <div className="portal-root admin-portal-root">
      {/* Tester Sidebar */}
      <TesterSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        unreadCount={unreadCount}
        projectsCount={projectsCount}
        projects={projects}
        pendingCount={pendingCount}
        inTestingCount={inTestingCount}
        revisionCount={revisionCount}
      />

      {/* Main Area */}
      <div className="portal-main-area">
        {/* Top Header */}
        <TesterHeader
          title={title}
          profile={profile}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onNavigate={onNavigate}
          onOpenProject={onOpenProject}
        />

        {/* Dynamic Content */}
        <main className="portal-content-wrapper admin-content-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
}
