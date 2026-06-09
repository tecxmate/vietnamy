import { baseEmail, escapeHtml, PUBLIC_BASE_URL, safeUrl } from './mail.js';

const DEFAULT_CTA = { label: 'Open Vietnamy', path: '/' };

function field(context, key, fallback = '') {
    const value = context?.[key];
    if (value == null || value === '') return fallback;
    return String(value);
}

function fill(template, context = {}, { html = false } = {}) {
    return String(template || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
        const value = field(context, key);
        return html ? escapeHtml(value) : value;
    });
}

function absoluteUrl(pathOrUrl, context = {}) {
    const raw = fill(pathOrUrl || DEFAULT_CTA.path, context);
    if (/^https?:\/\//i.test(raw)) return raw;
    const path = raw.startsWith('/') ? raw : `/${raw}`;
    return `${PUBLIC_BASE_URL}${path}`;
}

function paragraph(text) {
    return `<p style="margin:0 0 14px;">${text}</p>`;
}

function details(rows) {
    const items = rows
        .filter(row => row.value)
        .map(row => `<p style="margin:0 0 8px;"><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}</p>`)
        .join('');
    if (!items) return '';
    return `<div style="background:#fff7f4;border:1px solid #f4d2cb;border-radius:12px;padding:18px;margin:18px 0;">${items}</div>`;
}

function emailVariant(id, subject, preview, title, body, cta = DEFAULT_CTA) {
    return { id, subject, preview, title, body, cta };
}

function pushVariant(id, title, body, url = '/') {
    return { id, title, body, url };
}

function inAppVariant(id, title, message, url = '/') {
    return { id, title, message, url };
}

export const MESSAGE_SCENARIOS = [
    {
        id: 'account_welcome',
        group: 'account',
        intent: 'activation',
        audience: 'new_user',
        policy: { primary: 'email', fallback: null, cooldownHours: 0 },
        trigger: 'User creates an account or joins the waitlist.',
        contextFields: ['name'],
        variants: {
            email: [
                emailVariant('direct', 'Welcome to Vietnamy', 'Start your Vietnamese learning path.', 'Welcome to Vietnamy', [
                    'Hi {{name}}, welcome to Vietnamy.',
                    'Your learning path is ready. Start with one short lesson and let the app remember what needs review next.',
                ], { label: 'Start Learning', path: '/study' }),
                emailVariant('identity', 'Vietnamese starts here', 'Build a daily Vietnamese habit with Vietnamy.', 'Vietnamese starts here', [
                    'Hi {{name}}, thanks for joining Vietnamy.',
                    'We built this for learners who want practical Vietnamese: pronunciation, vocabulary, reading, and real-world phrases in one app.',
                ], { label: 'Open Vietnamy', path: '/' }),
            ],
            push: [
                pushVariant('short', 'Vietnamy is ready', 'Start with one short Vietnamese lesson.', '/study'),
                pushVariant('habit', 'Begin your Vietnamese habit', 'Two minutes is enough to start.', '/study'),
            ],
            inApp: [inAppVariant('home', 'Welcome to Vietnamy', 'Start with a short lesson and build from there.', '/study')],
        },
    },
    {
        id: 'email_verification',
        group: 'account',
        intent: 'security',
        audience: 'user',
        policy: { primary: 'email', fallback: null, cooldownHours: 1 },
        trigger: 'User requests account email verification.',
        contextFields: ['name', 'code'],
        variants: {
            email: [
                emailVariant('code', 'Your Vietnamy verification code: {{code}}', 'This code expires soon.', 'Verify your email', [
                    'Hi {{name}}, enter this code to verify your Vietnamy account.',
                    '<span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:8px;background:#fff7f4;border:1px solid #f4d2cb;border-radius:12px;padding:18px 22px;">{{code}}</span>',
                    'If you did not request this, you can ignore this email.',
                ]),
            ],
            push: [pushVariant('none', 'Verify your email', 'Check your inbox for your Vietnamy code.', '/')],
            inApp: [inAppVariant('code_sent', 'Code sent', 'Check your email for the verification code.', '/')],
        },
    },
    {
        id: 'password_reset',
        group: 'account',
        intent: 'security',
        audience: 'user',
        policy: { primary: 'email', fallback: null, cooldownHours: 1 },
        trigger: 'User requests a password reset.',
        contextFields: ['name', 'resetUrl'],
        variants: {
            email: [
                emailVariant('reset', 'Reset your Vietnamy password', 'Use this secure link to reset your password.', 'Reset your password', [
                    'Hi {{name}}, use the button below to reset your Vietnamy password.',
                    'If you did not request this, ignore this email and your password will stay unchanged.',
                ], { label: 'Reset Password', path: '{{resetUrl}}' }),
            ],
            push: [pushVariant('security', 'Password reset requested', 'Check your email for the reset link.', '/')],
            inApp: [inAppVariant('security', 'Password reset email sent', 'Check your inbox for the reset link.', '/')],
        },
    },
    {
        id: 'security_login',
        group: 'account',
        intent: 'security',
        audience: 'user',
        policy: { primary: 'email', fallback: null, cooldownHours: 24 },
        trigger: 'New device, location, or suspicious login.',
        contextFields: ['name', 'device', 'location', 'time'],
        variants: {
            email: [
                emailVariant('notice', 'New Vietnamy sign-in', 'A new sign-in was detected.', 'New sign-in detected', [
                    'Hi {{name}}, we noticed a Vietnamy sign-in from a new context.',
                    details([
                        { label: 'Device', value: field({ device: '{{device}}' }, 'device') },
                        { label: 'Location', value: field({ location: '{{location}}' }, 'location') },
                        { label: 'Time', value: field({ time: '{{time}}' }, 'time') },
                    ]),
                    'If this was you, no action is needed. If not, reset your password.',
                ], { label: 'Open Account', path: '/settings' }),
            ],
            push: [pushVariant('notice', 'New Vietnamy sign-in', 'Open account settings if this was not you.', '/settings')],
            inApp: [inAppVariant('notice', 'Security notice', 'A new sign-in was detected for your account.', '/settings')],
        },
    },
    {
        id: 'first_lesson_nudge',
        group: 'learning',
        intent: 'activation',
        audience: 'new_user',
        policy: { primary: 'push', fallback: 'email', cooldownHours: 24 },
        trigger: 'User onboarded but has not completed first lesson.',
        contextFields: ['name', 'lessonTitle'],
        variants: {
            email: [
                emailVariant('tiny_start', 'Your first Vietnamese lesson is waiting', 'Start with one small step.', 'Start small today', [
                    'Hi {{name}}, your first lesson is ready: {{lessonTitle}}.',
                    'It only takes a few minutes to get your first words into review.',
                ], { label: 'Start Lesson', path: '/study' }),
                emailVariant('confidence', 'One Vietnamese lesson. No pressure.', 'Take the first small step.', 'One lesson is enough to begin', [
                    'Hi {{name}}, Vietnamese gets easier when the first step is small.',
                    'Start with {{lessonTitle}} and let Vietnamy handle what to review next.',
                ], { label: 'Begin', path: '/study' }),
            ],
            push: [
                pushVariant('tiny_start', 'Your first lesson is ready', '{{lessonTitle}} takes just a few minutes.', '/study'),
                pushVariant('two_minutes', 'Two minutes of Vietnamese?', 'Start your first Vietnamy lesson now.', '/study'),
            ],
            inApp: [inAppVariant('start', 'Start your first lesson', '{{lessonTitle}} is ready.', '/study')],
        },
    },
    {
        id: 'daily_review_due',
        group: 'learning',
        intent: 'retention',
        audience: 'active_user',
        policy: { primary: 'push', fallback: 'email', cooldownHours: 20 },
        trigger: 'SRS reviews are due.',
        contextFields: ['name', 'reviewCount'],
        variants: {
            email: [
                emailVariant('memory', '{{reviewCount}} Vietnamese words are ready for review', 'Review before they fade.', 'Review before it fades', [
                    'Hi {{name}}, {{reviewCount}} words are ready.',
                    'A quick review now keeps them easier tomorrow.',
                ], { label: 'Review Words', path: '/practice/flashcards' }),
                emailVariant('short', 'A short Vietnamese review is ready', 'Keep your memory fresh.', 'Keep Vietnamese fresh', [
                    'Hi {{name}}, your review set is ready.',
                    'You do not need a long session. A small review is enough.',
                ], { label: 'Start Review', path: '/practice/flashcards' }),
            ],
            push: [
                pushVariant('memory', '{{reviewCount}} words are ready', 'Review them before they fade.', '/practice/flashcards'),
                pushVariant('quick', 'Quick Vietnamese review?', 'A few words are waiting.', '/practice/flashcards'),
                pushVariant('identity', 'Keep Vietnamese close', 'Review a few words today.', '/practice/flashcards'),
            ],
            inApp: [inAppVariant('review', 'Review due', '{{reviewCount}} words are ready for practice.', '/practice/flashcards')],
        },
    },
    {
        id: 'streak_save',
        group: 'learning',
        intent: 'retention',
        audience: 'active_user',
        policy: { primary: 'push', fallback: 'email', cooldownHours: 20 },
        trigger: 'User has an active streak and no lesson today near their usual cutoff.',
        contextFields: ['name', 'streakDays'],
        variants: {
            email: [
                emailVariant('save', 'Keep your {{streakDays}} day Vietnamy streak', 'One short session keeps it alive.', 'Keep the streak alive', [
                    'Hi {{name}}, your {{streakDays}} day streak is still open today.',
                    'One quick review keeps your Vietnamese rhythm going.',
                ], { label: 'Keep Streak', path: '/study' }),
                emailVariant('identity', 'Do not let today be the gap', 'A short lesson keeps the rhythm.', 'Do not let today be the gap', [
                    'Hi {{name}}, today still counts.',
                    'Take one small Vietnamese step and keep your learning chain intact.',
                ], { label: 'Open Lesson', path: '/study' }),
            ],
            push: [
                pushVariant('save', 'Your {{streakDays}} day streak is open', 'One short lesson keeps it alive.', '/study'),
                pushVariant('loss_aversion', 'Today still counts', 'Keep your Vietnamy streak before the day ends.', '/study'),
                pushVariant('calm', 'Keep the rhythm', 'A short review is enough for today.', '/study'),
            ],
            inApp: [inAppVariant('save', 'Streak saver', 'Complete one short activity to keep your streak.', '/study')],
        },
    },
    {
        id: 'streak_milestone',
        group: 'learning',
        intent: 'reward',
        audience: 'active_user',
        policy: { primary: 'push', fallback: 'email', cooldownHours: 0 },
        trigger: 'User reaches a streak milestone.',
        contextFields: ['name', 'streakDays'],
        variants: {
            email: [
                emailVariant('celebrate', '{{streakDays}} days of Vietnamese', 'Your consistency is working.', '{{streakDays}} days in a row', [
                    'Hi {{name}}, you reached a {{streakDays}} day Vietnamy streak.',
                    'That consistency matters. Keep going while the habit is warm.',
                ], { label: 'Continue', path: '/study' }),
            ],
            push: [
                pushVariant('celebrate', '{{streakDays}} days in a row', 'Your Vietnamese habit is getting stronger.', '/study'),
                pushVariant('next', '{{streakDays}} day streak', 'Ready to make it {{nextStreakDays}}?', '/study'),
            ],
            inApp: [inAppVariant('celebrate', 'Streak milestone', '{{streakDays}} days in a row.', '/study')],
        },
    },
    {
        id: 'weekly_progress',
        group: 'learning',
        intent: 'retention',
        audience: 'active_user',
        policy: { primary: 'email', fallback: 'in_app', cooldownHours: 120 },
        trigger: 'Weekly progress digest.',
        contextFields: ['name', 'lessonsCompleted', 'wordsLearned', 'minutesLearned'],
        variants: {
            email: [
                emailVariant('digest', 'Your Vietnamy week: {{lessonsCompleted}} lessons, {{wordsLearned}} words', 'A quick look at your Vietnamese progress.', 'Your Vietnamy week', [
                    'Hi {{name}}, here is what you did this week.',
                    details([
                        { label: 'Lessons completed', value: field({ lessonsCompleted: '{{lessonsCompleted}}' }, 'lessonsCompleted') },
                        { label: 'Words learned', value: field({ wordsLearned: '{{wordsLearned}}' }, 'wordsLearned') },
                        { label: 'Minutes learned', value: field({ minutesLearned: '{{minutesLearned}}' }, 'minutesLearned') },
                    ]),
                    'Pick up where you left off when you are ready.',
                ], { label: 'Continue Learning', path: '/study' }),
            ],
            push: [pushVariant('digest', 'Your weekly Vietnamy progress is ready', 'See what you learned this week.', '/study')],
            inApp: [inAppVariant('digest', 'Weekly progress', '{{lessonsCompleted}} lessons completed this week.', '/study')],
        },
    },
    {
        id: 'lesson_complete',
        group: 'learning',
        intent: 'reward',
        audience: 'active_user',
        policy: { primary: 'in_app', fallback: 'push', cooldownHours: 0 },
        trigger: 'User completes a lesson.',
        contextFields: ['name', 'lessonTitle', 'xp'],
        variants: {
            email: [
                emailVariant('recap', 'Lesson complete: {{lessonTitle}}', 'Your next Vietnamese step is ready.', 'Lesson complete', [
                    'Nice work, {{name}}. You completed {{lessonTitle}} and earned {{xp}} XP.',
                    'Your next step is ready whenever you want to continue.',
                ], { label: 'Continue', path: '/study' }),
            ],
            push: [pushVariant('next', 'Lesson complete', 'Ready for the next small Vietnamese step?', '/study')],
            inApp: [inAppVariant('recap', 'Lesson complete', '{{lessonTitle}} complete. You earned {{xp}} XP.', '/study')],
        },
    },
    {
        id: 'unit_unlocked',
        group: 'learning',
        intent: 'activation',
        audience: 'active_user',
        policy: { primary: 'in_app', fallback: 'email', cooldownHours: 12 },
        trigger: 'User unlocks a new unit or mode.',
        contextFields: ['name', 'unitTitle'],
        variants: {
            email: [
                emailVariant('unlock', 'Unlocked: {{unitTitle}}', 'A new Vietnamese unit is ready.', 'New unit unlocked', [
                    'Hi {{name}}, you unlocked {{unitTitle}}.',
                    'Start the first lesson while the path is fresh.',
                ], { label: 'Start Unit', path: '/study' }),
            ],
            push: [pushVariant('unlock', 'New unit unlocked', '{{unitTitle}} is ready.', '/study')],
            inApp: [inAppVariant('unlock', 'New unit unlocked', '{{unitTitle}} is ready.', '/study')],
        },
    },
    {
        id: 'pronunciation_practice',
        group: 'learning',
        intent: 'skill_depth',
        audience: 'active_user',
        policy: { primary: 'push', fallback: 'email', cooldownHours: 48 },
        trigger: 'User has not practiced pronunciation recently.',
        contextFields: ['name', 'soundFocus'],
        variants: {
            email: [
                emailVariant('sound', 'Practice Vietnamese pronunciation today', 'A short speaking drill is ready.', 'Train your Vietnamese ear and voice', [
                    'Hi {{name}}, a short pronunciation drill is ready.',
                    'Focus today: {{soundFocus}}. Listen, repeat, and compare your sound.',
                ], { label: 'Practice Pronunciation', path: '/practice/alphabet' }),
            ],
            push: [
                pushVariant('sound', 'Practice pronunciation', '{{soundFocus}} is ready for a short drill.', '/practice/alphabet'),
                pushVariant('voice', 'Say it out loud', 'A quick Vietnamese sound drill is ready.', '/practice/alphabet'),
            ],
            inApp: [inAppVariant('sound', 'Pronunciation practice', 'Focus today: {{soundFocus}}.', '/practice/alphabet')],
        },
    },
    {
        id: 'tone_trainer_prompt',
        group: 'learning',
        intent: 'skill_depth',
        audience: 'active_user',
        policy: { primary: 'push', fallback: 'email', cooldownHours: 72 },
        trigger: 'User has not practiced tones recently.',
        contextFields: ['name', 'toneName'],
        variants: {
            email: [
                emailVariant('tone', 'Vietnamese tone practice: {{toneName}}', 'Train tone recognition in a short drill.', 'Train your tone instinct', [
                    'Hi {{name}}, today is a good day for tone practice.',
                    'Try a short drill for {{toneName}} and sharpen your listening.',
                ], { label: 'Practice Tones', path: '/practice/tones' }),
            ],
            push: [pushVariant('tone', 'Tone practice is ready', 'Train {{toneName}} in a short drill.', '/practice/tones')],
            inApp: [inAppVariant('tone', 'Tone practice', 'Train {{toneName}} today.', '/practice/tones')],
        },
    },
    {
        id: 'grammar_review_due',
        group: 'learning',
        intent: 'skill_depth',
        audience: 'active_user',
        policy: { primary: 'push', fallback: 'email', cooldownHours: 48 },
        trigger: 'Grammar guidebook module is due for review.',
        contextFields: ['name', 'grammarTopic'],
        variants: {
            email: [
                emailVariant('grammar', 'Vietnamese grammar review: {{grammarTopic}}', 'A small grammar lesson is ready.', 'Make grammar easier', [
                    'Hi {{name}}, {{grammarTopic}} is ready for review.',
                    'One short module can make the next sentence easier.',
                ], { label: 'Review Grammar', path: '/grammar' }),
            ],
            push: [pushVariant('grammar', 'Grammar review ready', '{{grammarTopic}} is waiting.', '/grammar')],
            inApp: [inAppVariant('grammar', 'Grammar review', '{{grammarTopic}} is ready.', '/grammar')],
        },
    },
    {
        id: 'inactivity_2d',
        group: 'lifecycle',
        intent: 'winback',
        audience: 'inactive_user',
        policy: { primary: 'push', fallback: 'email', cooldownHours: 48 },
        trigger: 'User has been inactive for two days.',
        contextFields: ['name'],
        variants: {
            email: [
                emailVariant('gentle', 'Pick up Vietnamese again', 'A short review is ready when you are.', 'Pick up where you left off', [
                    'Hi {{name}}, your Vietnamese path is still here.',
                    'Start with one review. No need to catch up all at once.',
                ], { label: 'Resume Learning', path: '/study' }),
                emailVariant('low_pressure', 'No pressure. Just one Vietnamese word.', 'Restart with a small step.', 'Restart small', [
                    'Hi {{name}}, even one word keeps the habit alive.',
                    'Open Vietnamy and take a small step.',
                ], { label: 'Open Vietnamy', path: '/' }),
            ],
            push: [
                pushVariant('gentle', 'Vietnamy is ready', 'Pick up with one short review.', '/study'),
                pushVariant('small', 'Just one word?', 'Restart Vietnamese with a small step.', '/study'),
            ],
            inApp: [inAppVariant('resume', 'Welcome back', 'Pick up with one short review.', '/study')],
        },
    },
    {
        id: 'inactivity_7d_pause',
        group: 'lifecycle',
        intent: 'winback',
        audience: 'inactive_user',
        policy: { primary: 'push', fallback: 'email', cooldownHours: 168 },
        trigger: 'User has ignored reminders for one week.',
        contextFields: ['name'],
        variants: {
            email: [
                emailVariant('pause', 'Should we pause Vietnamy reminders?', 'Tell us if these reminders are not useful.', 'Should we pause reminders?', [
                    'Hi {{name}}, it looks like Vietnamy reminders may not be useful right now.',
                    'We can pause nudges for a while, or you can restart with one short lesson today.',
                ], { label: 'Restart Learning', path: '/study' }),
            ],
            push: [
                pushVariant('pause', 'Should we pause reminders?', 'If now is not the right time, we will slow down.', '/settings'),
                pushVariant('last_try', 'One last reminder for now', 'Restart Vietnamy or pause reminders.', '/settings'),
            ],
            inApp: [inAppVariant('pause', 'Reminder check', 'Restart learning or adjust reminders.', '/settings')],
        },
    },
    {
        id: 'winback_30d',
        group: 'lifecycle',
        intent: 'winback',
        audience: 'inactive_user',
        policy: { primary: 'email', fallback: null, cooldownHours: 720 },
        trigger: 'User has been inactive for thirty days.',
        contextFields: ['name', 'newFeature'],
        variants: {
            email: [
                emailVariant('new_reason', 'Vietnamy has changed since your last visit', 'New lessons and practice tools are ready.', 'A reason to come back', [
                    'Hi {{name}}, Vietnamy has new material ready for you.',
                    '{{newFeature}}',
                    'If you want to restart, start small. One short review is enough.',
                ], { label: 'See What Is New', path: '/' }),
            ],
            push: [pushVariant('new_reason', 'Vietnamy has new lessons', 'Come back with one short review.', '/')],
            inApp: [inAppVariant('new_reason', 'Welcome back', 'New lessons and tools are ready.', '/')],
        },
    },
    {
        id: 'feedback_form_invite',
        group: 'research',
        intent: 'feedback',
        audience: 'active_or_waitlist_user',
        policy: { primary: 'email', fallback: 'in_app', cooldownHours: 336 },
        trigger: 'Founder wants user feedback or product research answers.',
        contextFields: ['name', 'formUrl', 'topic'],
        variants: {
            email: [
                emailVariant('ask', 'Can you help shape Vietnamy?', 'Share feedback on the next version.', 'Help shape Vietnamy', [
                    'Hi {{name}}, we are improving Vietnamy and want real learner input.',
                    'Topic: {{topic}}',
                    'The form is short. Your answer helps decide what we build next.',
                ], { label: 'Share Feedback', path: '{{formUrl}}' }),
                emailVariant('prototype', 'We want your opinion on Vietnamy', 'Try the demo and tell us what matters.', 'Try the demo and tell us what matters', [
                    'Hi {{name}}, we are testing the next version of Vietnamy.',
                    'Open the demo, try a few flows, and send us your honest feedback.',
                ], { label: 'Open Feedback Form', path: '{{formUrl}}' }),
            ],
            push: [pushVariant('ask', 'Help shape Vietnamy', 'A short feedback form is ready.', '{{formUrl}}')],
            inApp: [inAppVariant('ask', 'Feedback request', 'Tell us what Vietnamy should improve next.', '{{formUrl}}')],
        },
    },
    {
        id: 'prototype_update_plan',
        group: 'research',
        intent: 'feedback',
        audience: 'interested_user',
        policy: { primary: 'email', fallback: null, cooldownHours: 168 },
        trigger: 'Send prototype, update plan, or roadmap information.',
        contextFields: ['name', 'updateTitle', 'summary', 'demoUrl', 'formUrl'],
        variants: {
            email: [
                emailVariant('roadmap', 'Vietnamy update: {{updateTitle}}', 'See what changed and what is next.', 'Vietnamy update: {{updateTitle}}', [
                    'Hi {{name}}, here is the latest Vietnamy prototype update.',
                    '{{summary}}',
                    'Try the demo, then tell us what should be clearer or more useful.',
                ], { label: 'Open Demo', path: '{{demoUrl}}' }),
                emailVariant('plan', 'What we are building next in Vietnamy', 'Review the plan and send ideas.', 'What we are building next', [
                    'Hi {{name}}, we are sharing the current Vietnamy plan early.',
                    '{{summary}}',
                    'If you have ideas, send them through the feedback form.',
                ], { label: 'Send Ideas', path: '{{formUrl}}' }),
            ],
            push: [pushVariant('roadmap', 'Vietnamy prototype update', '{{updateTitle}} is ready to try.', '{{demoUrl}}')],
            inApp: [inAppVariant('roadmap', 'Prototype update', '{{updateTitle}} is ready.', '{{demoUrl}}')],
        },
    },
    {
        id: 'demo_invite',
        group: 'marketing',
        intent: 'activation',
        audience: 'waitlist_or_lead',
        policy: { primary: 'email', fallback: null, cooldownHours: 168 },
        trigger: 'Invite a lead or waitlist user to use the demo app.',
        contextFields: ['name', 'demoUrl'],
        variants: {
            email: [
                emailVariant('simple', 'Try the Vietnamy demo', 'The demo app is ready.', 'Try the Vietnamy demo', [
                    'Hi {{name}}, the Vietnamy demo is ready to try.',
                    'Open it, take one lesson, and tell us what felt useful or confusing.',
                ], { label: 'Open Demo', path: '{{demoUrl}}' }),
                emailVariant('learner', 'Can Vietnamy help your Vietnamese?', 'Try the demo and tell us.', 'Can Vietnamy help your Vietnamese?', [
                    'Hi {{name}}, try the Vietnamy demo and see if the learning flow fits you.',
                    'Your feedback will help us decide what to improve first.',
                ], { label: 'Try Demo', path: '{{demoUrl}}' }),
            ],
            push: [pushVariant('simple', 'Vietnamy demo is ready', 'Try a lesson and send feedback.', '{{demoUrl}}')],
            inApp: [inAppVariant('simple', 'Demo invite', 'Try the demo and send feedback.', '{{demoUrl}}')],
        },
    },
    {
        id: 'product_update',
        group: 'product',
        intent: 'education',
        audience: 'all_opted_in',
        policy: { primary: 'email', fallback: 'in_app', cooldownHours: 168 },
        trigger: 'Major feature update or release note.',
        contextFields: ['name', 'featureName', 'summary', 'url'],
        variants: {
            email: [
                emailVariant('feature', 'New in Vietnamy: {{featureName}}', 'See the latest improvement.', 'New in Vietnamy: {{featureName}}', [
                    'Hi {{name}}, we added {{featureName}}.',
                    '{{summary}}',
                    'Try it and tell us if it makes learning Vietnamese easier.',
                ], { label: 'Try It', path: '{{url}}' }),
            ],
            push: [pushVariant('feature', 'New: {{featureName}}', '{{summary}}', '{{url}}')],
            inApp: [inAppVariant('feature', 'New feature', '{{featureName}} is ready.', '{{url}}')],
        },
    },
    {
        id: 'maintenance_notice',
        group: 'product',
        intent: 'trust',
        audience: 'all_users',
        policy: { primary: 'email', fallback: 'in_app', cooldownHours: 24 },
        trigger: 'Planned maintenance or service issue.',
        contextFields: ['name', 'window', 'impact'],
        variants: {
            email: [
                emailVariant('notice', 'Vietnamy maintenance notice', 'Planned service work is scheduled.', 'Maintenance notice', [
                    'Hi {{name}}, Vietnamy has planned maintenance scheduled.',
                    details([
                        { label: 'Window', value: field({ window: '{{window}}' }, 'window') },
                        { label: 'Expected impact', value: field({ impact: '{{impact}}' }, 'impact') },
                    ]),
                    'We will keep this as short as possible.',
                ]),
            ],
            push: [pushVariant('notice', 'Vietnamy maintenance', '{{window}}. {{impact}}', '/')],
            inApp: [inAppVariant('notice', 'Maintenance notice', '{{window}}. {{impact}}', '/')],
        },
    },
    {
        id: 'subscription_trial_started',
        group: 'billing',
        intent: 'conversion',
        audience: 'trial_user',
        policy: { primary: 'email', fallback: 'in_app', cooldownHours: 0 },
        trigger: 'User starts a paid trial.',
        contextFields: ['name', 'planName', 'trialEndDate'],
        variants: {
            email: [
                emailVariant('started', 'Your Vietnamy {{planName}} trial has started', 'Here is what to try first.', 'Your trial has started', [
                    'Hi {{name}}, your {{planName}} trial is active until {{trialEndDate}}.',
                    'Try pronunciation, review, and advanced lessons while everything is unlocked.',
                ], { label: 'Explore Premium', path: '/study' }),
            ],
            push: [pushVariant('started', '{{planName}} trial started', 'Premium practice is unlocked now.', '/study')],
            inApp: [inAppVariant('started', 'Trial started', '{{planName}} is active until {{trialEndDate}}.', '/study')],
        },
    },
    {
        id: 'subscription_trial_ending',
        group: 'billing',
        intent: 'conversion',
        audience: 'trial_user',
        policy: { primary: 'email', fallback: 'push', cooldownHours: 24 },
        trigger: 'Trial is ending soon.',
        contextFields: ['name', 'planName', 'trialEndDate'],
        variants: {
            email: [
                emailVariant('ending', 'Your Vietnamy trial ends {{trialEndDate}}', 'Keep premium practice active.', 'Your trial is ending soon', [
                    'Hi {{name}}, your {{planName}} trial ends {{trialEndDate}}.',
                    'Keep premium practice active if the advanced tools are helping your Vietnamese.',
                ], { label: 'Manage Plan', path: '/settings' }),
            ],
            push: [pushVariant('ending', 'Trial ending soon', 'Manage your Vietnamy plan before {{trialEndDate}}.', '/settings')],
            inApp: [inAppVariant('ending', 'Trial ending soon', '{{planName}} ends {{trialEndDate}}.', '/settings')],
        },
    },
    {
        id: 'payment_failed',
        group: 'billing',
        intent: 'recovery',
        audience: 'subscriber',
        policy: { primary: 'email', fallback: 'in_app', cooldownHours: 24 },
        trigger: 'Payment fails.',
        contextFields: ['name', 'planName'],
        variants: {
            email: [
                emailVariant('failed', 'Payment issue with your Vietnamy plan', 'Update payment to keep access.', 'Payment issue', [
                    'Hi {{name}}, we could not process payment for your {{planName}} plan.',
                    'Update your payment method to keep premium features active.',
                ], { label: 'Update Payment', path: '/settings' }),
            ],
            push: [pushVariant('failed', 'Payment issue', 'Update payment to keep Vietnamy premium active.', '/settings')],
            inApp: [inAppVariant('failed', 'Payment issue', 'Update your payment method to keep access.', '/settings')],
        },
    },
    {
        id: 'billing_receipt',
        group: 'billing',
        intent: 'trust',
        audience: 'subscriber',
        policy: { primary: 'email', fallback: null, cooldownHours: 0 },
        trigger: 'Successful payment or invoice.',
        contextFields: ['name', 'amount', 'planName', 'invoiceUrl'],
        variants: {
            email: [
                emailVariant('receipt', 'Your Vietnamy receipt', 'Payment received for {{planName}}.', 'Receipt from Vietnamy', [
                    'Hi {{name}}, payment for {{planName}} was received.',
                    details([
                        { label: 'Amount', value: field({ amount: '{{amount}}' }, 'amount') },
                        { label: 'Plan', value: field({ planName: '{{planName}}' }, 'planName') },
                    ]),
                ], { label: 'View Invoice', path: '{{invoiceUrl}}' }),
            ],
            push: [pushVariant('receipt', 'Vietnamy payment received', '{{amount}} for {{planName}}.', '/settings')],
            inApp: [inAppVariant('receipt', 'Payment received', '{{amount}} for {{planName}}.', '/settings')],
        },
    },
    {
        id: 'support_received',
        group: 'support',
        intent: 'trust',
        audience: 'user',
        policy: { primary: 'email', fallback: null, cooldownHours: 0 },
        trigger: 'User submits support or feedback form.',
        contextFields: ['name', 'ticketId'],
        variants: {
            email: [
                emailVariant('received', 'We received your Vietnamy message', 'Thanks for the feedback.', 'We received your message', [
                    'Hi {{name}}, thanks for writing to Vietnamy.',
                    'We received your message{{ticketId}} and will review it.',
                ], { label: 'Open Vietnamy', path: '/' }),
            ],
            push: [pushVariant('received', 'Message received', 'Thanks for helping improve Vietnamy.', '/')],
            inApp: [inAppVariant('received', 'Message received', 'Thanks for helping improve Vietnamy.', '/')],
        },
    },
    {
        id: 'community_invite',
        group: 'community',
        intent: 'engagement',
        audience: 'active_user',
        policy: { primary: 'email', fallback: 'in_app', cooldownHours: 336 },
        trigger: 'Invite learner to community channels.',
        contextFields: ['name', 'communityUrl'],
        variants: {
            email: [
                emailVariant('invite', 'Join the Vietnamy learner community', 'Ask questions and share ideas.', 'Join the Vietnamy community', [
                    'Hi {{name}}, join the Vietnamy community if you want updates, language questions, and product feedback loops.',
                    'We keep the community practical and learner-focused.',
                ], { label: 'Join Community', path: '{{communityUrl}}' }),
            ],
            push: [pushVariant('invite', 'Join the Vietnamy community', 'Ask questions and share feedback.', '{{communityUrl}}')],
            inApp: [inAppVariant('invite', 'Community invite', 'Join the Vietnamy learner community.', '{{communityUrl}}')],
        },
    },
];

export function listMessageScenarios() {
    return MESSAGE_SCENARIOS.map(scenario => ({
        id: scenario.id,
        group: scenario.group,
        intent: scenario.intent,
        audience: scenario.audience,
        policy: scenario.policy,
        trigger: scenario.trigger,
        contextFields: scenario.contextFields,
        channels: Object.keys(scenario.variants || {}),
        variantCounts: Object.fromEntries(
            Object.entries(scenario.variants || {}).map(([channel, variants]) => [channel, variants.length])
        ),
    }));
}

export function getMessageScenario(id) {
    return MESSAGE_SCENARIOS.find(scenario => scenario.id === id) || null;
}

export function getScenarioVariants(scenarioId, channel) {
    const scenario = getMessageScenario(scenarioId);
    return scenario?.variants?.[channel] || [];
}

export function renderEngagementMessage(scenarioId, {
    channel = 'email',
    variantId,
    context = {},
    tracking,
} = {}) {
    const scenario = getMessageScenario(scenarioId);
    if (!scenario) return null;
    const variants = scenario.variants?.[channel] || [];
    const variant = variants.find(v => v.id === variantId) || variants[0];
    if (!variant) return null;

    if (channel === 'email') {
        const cta = variant.cta || DEFAULT_CTA;
        const href = tracking?.clickUrl || absoluteUrl(cta.path, context);
        const body = variant.body
            .map(part => {
                if (String(part).startsWith('<')) return fill(part, context, { html: true });
                return paragraph(fill(part, context, { html: true }));
            })
            .join('');
        const html = baseEmail({
            title: fill(variant.title, context, { html: false }),
            preview: fill(variant.preview, context, { html: false }),
            body,
            cta: { label: fill(cta.label, context), href },
        }) + (tracking?.openPixelUrl
            ? `<img src="${safeUrl(tracking.openPixelUrl)}" width="1" height="1" alt="" style="display:none;opacity:0;" />`
            : '');

        return {
            scenarioId,
            variantId: variant.id,
            channel,
            subject: fill(variant.subject, context),
            preview: fill(variant.preview, context),
            html,
            text: [
                fill(variant.title, context),
                '',
                ...variant.body.map(part => fill(String(part).replace(/<[^>]+>/g, ''), context)),
                '',
                `${fill(cta.label, context)}: ${absoluteUrl(cta.path, context)}`,
            ].join('\n'),
            ctaUrl: absoluteUrl(cta.path, context),
        };
    }

    return {
        scenarioId,
        variantId: variant.id,
        channel,
        title: fill(variant.title, context),
        message: fill(variant.body || variant.message, context),
        url: absoluteUrl(variant.url, context),
    };
}
