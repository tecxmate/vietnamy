# Goal-shaped roadmap (per-purpose visible path) — ready-to-apply design

**Status: APPLIED (2026-06-11)** — landed on top of Codex's roadmapDb refactor.
Verified per-goal: restaurant lessons Explore-only, family lessons Heritage-only,
topic-less nodes (foundations/grammar/scenes/tests) in every goal, Continue works
in all 4 modes, 0 page errors. Remaining notes below still apply.

## Finding (2026-06-11)
The learning-goal selector is **shallow today**: switching goals changes the topic
chips offered, the progress bucket (`getProgressMode`), and the sequencer purpose —
but `isVisibleRoadmapNode` filters only by the tapped chip (`activeTopic`), never by
the goal's topics. Every goal sees the identical path.

Data says goal-gating works well: lessons per goal = Explore 135 / Professional 105 /
Heritage 110 (of 140); every lesson topic belongs to ≥1 goal; node `topic` comes from
the lesson record at runtime (foundations/grammar/tests carry no topic).

## The change (small, in RoadmapTab)
1. **Gate visibility by goal** — extend `isVisibleRoadmapNode`:
   ```js
   const modeTopicIds = React.useMemo(() => new Set(modeTopics.map(tp => tp.id)), [modeTopics]);
   // inside the callback, add:
   (currentMode === ALL_LEARNER_MODE || !node.topic || modeTopicIds.has(node.topic)) &&
   ```
   (import `ALL_LEARNER_MODE` from learnerModes — already added to the import line.)
   "All" shows the union; topic-less nodes (foundations, grammar, tests) show in
   every goal. The chip row keeps working as the finer filter *within* the goal.

2. **Per-goal unlock** — re-derive status over the goal-visible subsequence so the
   path stays continuous (otherwise the linear "active" node can be hidden and the
   path/Continue appears stuck):
   ```js
   const visibleNodesMap = React.useMemo(() => {
       const out = {};
       let prevTestId = null;
       for (const unit of units) {
           const vis = (nodesMap[unit.id] || []).filter(isVisibleRoadmapNode);
           out[unit.id] = vis.map((n, i) => {
               let status;
               if (modeCompletedNodes.has(n.id)) status = 'completed';
               else if (i === 0) status = (!prevTestId || modeCompletedNodes.has(prevTestId)) ? 'active' : 'locked';
               else status = modeCompletedNodes.has(vis[i - 1].id) ? 'active' : 'locked';
               return n.status === status ? n : { ...n, status };
           });
           const unitTest = vis.find(n => n.type === 'test' && n.test_scope !== 'module');
           if (unitTest) prevTestId = unitTest.id;
       }
       return out;
   }, [units, nodesMap, isVisibleRoadmapNode, modeCompletedNodes]);
   ```
3. **Use it everywhere the path renders/acts**: the units render loop
   (`visibleNodes` ← `visibleNodesMap[unit.id]`), `hasAnyVisibleNodes`, and
   `handleContinueClick` (find active in `visibleNodesMap`, not raw nodesMap).

## Why this aligns the whole system
goal → path subset (this change) → chips filter within goal (existing tech) →
sequencer ranks within the same purpose map (already live). One topic→goal map
drives all three layers.

## Verify after applying
- Fresh user per goal: professional sees ~34 units / no travel-topic lessons;
  heritage sees family/kinship units; "All" unchanged.
- Continue works in every goal (active node always visible; no stuck state).
- Completing a lesson then returning advances the visible path.
- Quiz (module-scope) badges still attach (they read raw nodesMap, unaffected).

## Follow-ups — DONE (2026-06-11, 5a6462f)
- `db.getNextNode` is goal-aware (skips off-goal-topic nodes when advancing).
- The 7 travel scenes carry topics and goal-filter; "At a Party" stays universal.
- Pipeline reminder: roadmap content changes require `node
  scripts/build-roadmap-seed.mjs` + a CURRICULUM_VERSION bump (now 32).
