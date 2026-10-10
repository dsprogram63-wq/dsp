import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { initialAdminProfile, initialAdminNotifications } from '../../data/adminMockData';
import './AdminLayout.css';

export default function AdminLayout({ 
  currentPath = 'dashboard', 
  title, 
  subtitle, 
  breadcrumbs = [],
  onNavigate, 
  projectsCount,
  developersCount,
  testersCount,
  projects,
  developers,
  testers,
  children 
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const unreadCount = initialAdminNotifications.filter(n => n.unread).length;

  return (
    <div className="portal-root admin-portal-root">
      {/* Admin Sidebar */}
      <AdminSidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        unreadCount={unreadCount}
        projectsCount={projectsCount}
        developersCount={developersCount}
        testersCount={testersCount}
        projects={projects}
        developers={developers}
        testers={testers}
      />

      {/* Main Area */}
      <div className="portal-main-area">
        {/* Top Header */}
        <AdminHeader
          title={title}
          subtitle={subtitle}
          breadcrumbs={breadcrumbs}
          profile={initialAdminProfile}
          projects={projects}
          developers={developers}
          testers={testers}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onNavigate={onNavigate}
        />

        {/* Dynamic Content */}
        <main className="portal-content-wrapper admin-content-wrapper">
          {children}
        </main>
      </div>
    </div>
  );
}
