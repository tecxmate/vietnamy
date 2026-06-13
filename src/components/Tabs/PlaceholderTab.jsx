import React from 'react';

// Lightweight, on-brand placeholder used by tabs that are scaffolded but not
// yet built out (YouTube, Conversation) or that bridge to existing surfaces
// (Flashcard). Kept dependency-light and self-styled so the tab-shell reorg
// compiles and is clickable end-to-end before each tab is filled in.
const PlaceholderTab = ({ icon, title, blurb, action }) => (
  <div
    style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 24,
      textAlign: 'center',
    }}
  >
    <div style={{ color: 'var(--accent, #1CB0F6)' }}>{icon}</div>
    <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
    {blurb && (
      <p style={{ margin: 0, maxWidth: 320, color: 'var(--text-secondary, #6b7280)', lineHeight: 1.5 }}>
        {blurb}
      </p>
    )}
    {action}
  </div>
);

export default PlaceholderTab;
