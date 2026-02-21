/**
 * Roadmap data — Conversational Adventure
 * 
 * New Structure:
 * Unit 1: Welcome (Greetings)
 * Unit 2: Coffee Culture
 * Unit 3: Market Life
 * Unit 4: Getting Around
 * 
 * Technical skills (Tones, Vowels) are now side-quests in Practice.
 */

const ROADMAP_STAGES = [
    {
        id: 'unit-1',
        title: 'Welcome to Vietnam',
        subtitle: 'Greetings & Introduction',
        description: 'Learn to say hello, introduce yourself, and make a connection.',
        theme: '#10B981', // emerald
        image: 'https://images.unsplash.com/photo-1613131145282-9476375618e1?auto=format&fit=crop&q=80&w=1000',
        unlockCost: null,
        nodes: [
            {
                id: 'u1-conversation',
                label: 'The First Hello',
                description: 'Dialogue: Meeting a new friend.',
                type: 'learn',
                link: '/lessons/1',
                icon: 'MessageCircle',
            },
            {
                id: 'u1-pronouns',
                label: 'Kinship & Pronouns',
                description: 'Learn who is Anh, Chi, Em, and Bac.',
                type: 'practice',
                link: '/practice/pronouns',
                icon: 'Users',
            },
            {
                id: 'u1-vocab',
                label: 'Core Vocabulary',
                description: 'Essential words for greeting.',
                type: 'practice',
                link: '/practice/vocab',
                icon: 'BookOpen',
            },
            {
                id: 'practice-tones',
                label: 'Tone Challenge',
                description: 'Master the 6 tones before moving on.',
                type: 'practice',
                link: '/practice/tones',
                icon: 'Music',
            },
            {
                id: 'u1-boss',
                label: 'Checkpoint 1',
                description: 'Prove you can greet a local!',
                type: 'boss',
                // link: '/quiz/1', // keeping logic
                icon: 'Trophy',
            },
        ],
    },
    {
        id: 'unit-2',
        title: 'Coffee Culture',
        subtitle: 'Ordering Drinks',
        description: 'Master the art of ordering Cà phê sữa đá like a local.',
        theme: '#F59E0B', // amber
        image: 'https://images.unsplash.com/photo-1558722141-76ef6ca013be?auto=format&fit=crop&q=80&w=1000',
        unlockCost: null,
        nodes: [
            {
                id: 'u2-conversation',
                label: 'At the Cafe',
                description: 'Dialogue: Ordering a drink.',
                type: 'learn',
                link: '/lessons/2',
                icon: 'MessageCircle', // using icon name
            },
            {
                id: 'u2-vocab',
                label: 'Cafe Menu',
                description: 'Learn common drink names.',
                type: 'practice',
                link: '/practice/vocab',
                icon: 'BookOpen',
            },
            {
                id: 'practice-vowels',
                label: 'Vowels Practice',
                description: 'Perfect your vowel sounds.',
                type: 'practice',
                link: '/practice/vowels',
                icon: 'Type',
            },
            {
                id: 'u2-boss',
                label: 'Order Up!',
                description: 'Simulate a cafe order.',
                type: 'boss',
                icon: 'UtensilsCrossed',
            },
        ],
    },
    {
        id: 'unit-3',
        title: 'Market Life',
        subtitle: 'Haggling & Numbers',
        description: 'Don\'t get ripped off. Learn to ask "How much?"',
        theme: '#EF4444', // red
        image: 'https://images.unsplash.com/photo-1603375322583-e3c47065c492?auto=format&fit=crop&q=80&w=1000',
        unlockCost: null,
        nodes: [
            {
                id: 'u3-conversation',
                label: 'Bargaining 101',
                description: 'Dialogue: Buying fruit.',
                type: 'learn',
                link: '/lessons/3',
                icon: 'MessageCircle',
            },
            {
                id: 'u3-numbers',
                label: 'Numbers Master',
                description: 'Count from 1 to 1 million.',
                type: 'practice',
                link: '/practice/numbers',
                icon: 'Hash',
            },
            {
                id: 'u3-boss',
                label: 'Market Challenge',
                description: 'Buy 3 items within budget.',
                type: 'boss',
                icon: 'ShoppingBag',
            },
        ],
    },
    {
        id: 'unit-4',
        title: 'Getting Around',
        subtitle: 'Taxi & Directions',
        description: 'Navigate the chaotic streets of Saigon.',
        theme: '#3B82F6', // blue
        image: 'https://images.unsplash.com/photo-1750227429535-43c68d5e036a?auto=format&fit=crop&q=80&w=1000',
        unlockCost: null,
        nodes: [
            {
                id: 'u4-conversation',
                label: 'Where to?',
                description: 'Dialogue: Giving directions.',
                type: 'learn',
                link: '/lessons/4',
                icon: 'MessageCircle',
            },
            {
                id: 'u4-vocab',
                label: 'Street Signs',
                description: 'Read common road signs.',
                type: 'practice',
                link: '/practice/vocab',
                icon: 'Map',
            },
            {
                id: 'u4-boss',
                label: 'Lost in Saigon',
                description: 'Find your way back hotel.',
                type: 'boss',
                icon: 'Activity',
            },
        ],
    }
];

export default ROADMAP_STAGES;
