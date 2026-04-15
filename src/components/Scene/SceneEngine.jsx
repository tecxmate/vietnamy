import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import { useProgress } from '../../context/ProgressContext';
import { useUser } from '../../context/UserContext';
import { getDB } from '../../lib/db';
import { addItemsFromLesson } from '../../lib/srs';
import SoundButton from '../SoundButton';
import SceneExplore from './SceneExplore';
import SceneObserve from './SceneObserve';
import ScenePerform from './ScenePerform';
import SceneEnding from './SceneEnding';
import { DEFAULT_LEARNER_MODE } from '../../data/learnerModes';

const PHASES = ['explore', 'observe', 'perform', 'ending'];

const SceneEngine = () => {
    const { sceneId } = useParams();
    const navigate = useNavigate();
    const progressCtx = useProgress();
    const { userProfile } = useUser();
    const currentMode = userProfile?.learnerMode || DEFAULT_LEARNER_MODE;

    const [scene, setScene] = useState(null);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [exploreComplete, setExploreComplete] = useState(false);
    // observeComplete not used directly but tracked by phase transitions
    const [performResults, setPerformResults] = useState(null);
    const completedRef = useRef(false);

    // Load scene data
    useEffect(() => {
        const db = getDB();
        const sceneData = (db.scenes || []).find(s => s.id === sceneId);
        if (sceneData) {
            setScene(sceneData);
        }
    }, [sceneId]);

    // Complete node on ending
    useEffect(() => {
        if (phaseIndex === 3 && performResults && !completedRef.current) {
            completedRef.current = true;
            const db = getDB();
            const node = (db.path_nodes || []).find(n => n.scene_id === sceneId);
            if (node) {
                progressCtx.completeNode(node.id, { immediate: true, mode: currentMode });
            }
            // Register vocab items with SRS
            if (scene?.vocab_items?.length) {
                addItemsFromLesson(scene.vocab_items);
            }
        }
    }, [phaseIndex, performResults]);

    const currentPhase = PHASES[phaseIndex];

    const handleNextPhase = () => {
        if (phaseIndex < PHASES.length - 1) {
            setPhaseIndex(prev => prev + 1);
        }
    };

    const handleExploreComplete = () => {
        setExploreComplete(true);
    };

    const handleObserveComplete = () => {
        handleNextPhase();
    };

    const handlePerformComplete = (results) => {
        setPerformResults(results);
        handleNextPhase();
    };

    if (!scene) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', padding: 24 }}>
                <h2>Scene not found</h2>
                <button className="primary mt-4" onClick={() => navigate('/', { state: { tab: 'study' } })}>Return to Roadmap</button>
            </div>
        );
    }

    const explorePhase = scene.phases?.find(p => p.type === 'explore');
    const observePhase = scene.phases?.find(p => p.type === 'observe');
    const performPhase = scene.phases?.find(p => p.type === 'perform');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>

            {/* Top bar */}
            {currentPhase !== 'ending' && (
                <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 12, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="ghost" onClick={() => navigate('/', { state: { tab: 'study' } })} style={{ padding: 8 }}>
                        <X size={22} color="var(--text-muted)" />
                    </button>

                    {/* Phase progress dots */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {['explore', 'observe', 'perform'].map((phase, i) => (
                            <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: i < phaseIndex ? 28 : i === phaseIndex ? 36 : 28,
                                    height: 6,
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: i < phaseIndex ? 'var(--success-color)' : i === phaseIndex ? 'var(--primary-color)' : 'var(--surface-color-light)',
                                    transition: 'all 0.3s ease'
                                }} />
                            </div>
                        ))}
                    </div>

                    {/* Phase label */}
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', minWidth: 60, textAlign: 'right' }}>
                        {currentPhase}
                    </span>
                </div>
            )}

            {/* Phase content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {currentPhase === 'explore' && explorePhase && (
                    <SceneExplore
                        config={explorePhase.config}
                        scene={scene}
                        onComplete={handleExploreComplete}
                        isComplete={exploreComplete}
                    />
                )}

                {currentPhase === 'observe' && observePhase && (
                    <SceneObserve
                        config={observePhase.config}
                        scene={scene}
                        onComplete={handleObserveComplete}
                    />
                )}

                {currentPhase === 'perform' && performPhase && (
                    <ScenePerform
                        config={performPhase.config}
                        scene={scene}
                        onComplete={handlePerformComplete}
                    />
                )}

                {currentPhase === 'ending' && (
                    <SceneEnding
                        scene={scene}
                        results={performResults}
                        onFinish={() => navigate('/', { state: { tab: 'study' } })}
                    />
                )}
            </div>

            {/* Bottom bar for Explore phase continue */}
            {currentPhase === 'explore' && (
                <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 16, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)', borderTop: '2px solid var(--border-color)', backgroundColor: 'var(--surface-color)', minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SoundButton
                        className="primary w-full shadow-lg"
                        style={{
                            fontSize: 17,
                            opacity: exploreComplete ? 1 : 0.5,
                            pointerEvents: exploreComplete ? 'auto' : 'none'
                        }}
                        onClick={handleNextPhase}
                    >
                        I'M READY <ChevronRight size={18} />
                    </SoundButton>
                </div>
            )}
        </div>
    );
};

export default SceneEngine;
