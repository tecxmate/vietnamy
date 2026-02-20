import React from 'react';
import { PlayCircle, BookmarkPlus, FastForward } from 'lucide-react';

const WatchTab = () => {
    const contentFeed = [
        { id: 1, type: 'Video', title: 'Ordering Pho like a local', duration: '1:30', level: 'Beginner', thumb: '🍜' },
        { id: 2, type: 'News', title: 'Tet Festival Highlights 2026', readTime: '3 min', level: 'Intermediate', thumb: '🧨' },
        { id: 3, type: 'Story', title: 'The Legend of Hoan Kiem', duration: '2:15', level: 'Intermediate', thumb: '🐢' },
    ];

    return (
        <div style={{ padding: 'var(--spacing-4)', paddingBottom: '100px' }}>
            <div className="flex justify-between items-center mb-6">
                <h2 style={{ fontSize: 24, margin: 0 }}>Watch & Read</h2>
                <div style={{ display: 'flex', gap: 8, backgroundColor: 'var(--surface-color)', padding: 4, borderRadius: 24 }}>
                    <button style={{ padding: '6px 12px', fontSize: 12, borderRadius: 20, backgroundColor: 'var(--primary-color)', color: '#1A1A1A' }}>VN Only</button>
                    <button style={{ padding: '4px 12px', fontSize: 12, borderRadius: 20, backgroundColor: 'transparent', color: 'var(--text-muted)' }}>Dual</button>
                </div>
            </div>

            <div className="flex-col gap-4">
                {contentFeed.map((item) => (
                    <div key={item.id} className="glass-panel" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
                        <div style={{ height: 160, backgroundColor: 'var(--surface-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            <div style={{ margin: '0 auto', fontSize: 48 }}>{item.thumb}</div>

                            <div style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                                {item.duration || item.readTime}
                            </div>

                            <div style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'var(--primary-color)', color: '#1A1A1A', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                                {item.level}
                            </div>
                        </div>

                        <div className="p-4">
                            <h3 style={{ fontSize: 16, marginBottom: 8 }}>{item.title}</h3>
                            <div className="flex justify-between items-center text-muted">
                                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Interactive {item.type}</span>
                                <div className="flex gap-2">
                                    <BookmarkPlus size={20} color="var(--text-muted)" />
                                    <PlayCircle size={20} color="var(--primary-color)" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
};

export default WatchTab;
