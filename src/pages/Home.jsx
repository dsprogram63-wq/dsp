import React from 'react';
import Hero from '../components/Hero';
import ReferralNotice from '../components/ReferralNotice';
import DashboardPreview from '../components/DashboardPreview';
import TrustSection from '../components/TrustSection';
import FAQSection from '../components/FAQSection';
import FinalCTA from '../components/FinalCTA';

export default function Home({ onNavigate }) {
  return (
    <main>
      <Hero onNavigate={onNavigate} />
      <ReferralNotice />
      <DashboardPreview />
      <TrustSection />
      <FAQSection />
      <FinalCTA onNavigate={onNavigate} />
    </main>
  );
}
