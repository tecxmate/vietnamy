/**
 * Learner Modes Configuration
 *
 * Each mode has a set of topics. Lessons are tagged with one topic.
 * Progress is tracked separately per mode.
 */

export const LEARNER_MODES = {
    explore_vietnam: {
        id: 'explore_vietnam',
        label: 'Explore Vietnam',
        description: 'For travelers and tourists visiting Vietnam',
        icon: 'Plane',
        color: '#1CB0F6',
        topics: [
            { id: 'basics', label: 'Basics', icon: 'BookOpen' },
            { id: 'greetings', label: 'Greetings', icon: 'Hand' },
            { id: 'restaurant', label: 'Restaurant', icon: 'UtensilsCrossed' },
            { id: 'hotel', label: 'Hotel', icon: 'Hotel' },
            { id: 'transport', label: 'Transport', icon: 'Car' },
            { id: 'airport', label: 'Airport', icon: 'Plane' },
            { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag' },
            { id: 'money', label: 'Money', icon: 'Banknote' },
            { id: 'directions', label: 'Directions', icon: 'MapPin' },
            { id: 'sightseeing', label: 'Sightseeing', icon: 'Camera' },
            { id: 'emergency', label: 'Emergency', icon: 'Siren' },
        ],
    },
    professional: {
        id: 'professional',
        label: 'Professional',
        description: 'For business and work in Vietnam',
        icon: 'Briefcase',
        color: '#A78BFA',
        topics: [
            { id: 'basics', label: 'Basics', icon: 'BookOpen' },
            { id: 'greetings', label: 'Greetings', icon: 'Hand' },
            { id: 'office', label: 'Office', icon: 'Building' },
            { id: 'meetings', label: 'Meetings', icon: 'Users' },
            { id: 'email', label: 'Email & Chat', icon: 'Mail' },
            { id: 'presentations', label: 'Presentations', icon: 'Presentation' },
            { id: 'networking', label: 'Networking', icon: 'Network' },
            { id: 'negotiation', label: 'Negotiation', icon: 'Handshake' },
            { id: 'business_travel', label: 'Business Travel', icon: 'Plane' },
            { id: 'dining', label: 'Business Dining', icon: 'UtensilsCrossed' },
        ],
    },
    heritage: {
        id: 'heritage',
        label: 'Heritage',
        description: 'For connecting with Vietnamese roots and family',
        icon: 'Heart',
        color: '#F26B5A',
        topics: [
            { id: 'basics', label: 'Basics', icon: 'BookOpen' },
            { id: 'greetings', label: 'Greetings', icon: 'Hand' },
            { id: 'family', label: 'Family', icon: 'Users' },
            { id: 'kinship', label: 'Kinship Terms', icon: 'Heart' },
            { id: 'traditions', label: 'Traditions', icon: 'Sparkles' },
            { id: 'holidays', label: 'Holidays', icon: 'PartyPopper' },
            { id: 'ancestors', label: 'Ancestors', icon: 'Scroll' },
            { id: 'home', label: 'Home & Chores', icon: 'Home' },
            { id: 'cooking', label: 'Cooking', icon: 'ChefHat' },
            { id: 'stories', label: 'Stories & Proverbs', icon: 'BookOpen' },
        ],
    },
};

// Default mode for new users
export const DEFAULT_LEARNER_MODE = 'explore_vietnam';

// Get topics for a mode
export function getTopicsForMode(modeId) {
    return LEARNER_MODES[modeId]?.topics || [];
}

// Get mode config
export function getModeConfig(modeId) {
    return LEARNER_MODES[modeId] || LEARNER_MODES[DEFAULT_LEARNER_MODE];
}

// All mode IDs
export const MODE_IDS = Object.keys(LEARNER_MODES);
