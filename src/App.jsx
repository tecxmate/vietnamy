import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import BottomNav from './components/BottomNav';
import TopBar from './components/TopBar';
import RoadmapTab from './components/Tabs/RoadmapTab';
import PracticeTab from './components/Tabs/PracticeTab';
import WatchTab from './components/Tabs/WatchTab';
import MeTab from './components/Tabs/MeTab';
import AdminLayout from './pages/Admin/AdminLayout';
import RoadmapMapper from './pages/Admin/RoadmapMapper';
import LessonBuilder from './pages/Admin/LessonBuilder';
import LessonGame from './components/LessonGame';

function StudentApp() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('vnme_onboarding_completed') === 'true';
  });
  const [activeTab, setActiveTab] = useState('roadmap');
  const [userStats, setUserStats] = useState({ streak: 0, hearts: 5, xp: 0 });

  const completeOnboarding = () => {
    localStorage.setItem('vnme_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
  };

  if (!hasCompletedOnboarding) {
    return (
      <div className="mobile-app-wrapper">
        <OnboardingFlow onComplete={completeOnboarding} />
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'roadmap': return <RoadmapTab />;
      case 'practice': return <PracticeTab />;
      case 'watch': return <WatchTab />;
      case 'me': return <MeTab />;
      default: return <RoadmapTab />;
    }
  };

  return (
    <div className="mobile-app-wrapper">
      <div className="app-container">
        <TopBar stats={userStats} />
        <main className="main-content">{renderTab()}</main>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentApp />} />
        <Route path="/lesson/:lessonId" element={<div className="mobile-app-wrapper"><LessonGame /></div>} />

        {/* Admin CMS Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="mapper" />} />
          <Route path="mapper" element={<RoadmapMapper />} />
          <Route path="lesson" element={<LessonBuilder />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
