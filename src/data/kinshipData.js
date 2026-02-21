/**
 * Kinship Data for Vietnamese Pronouns Module
 * 
 * Defines the family structure relative to a central "Self" node (or abstractly).
 * 
 * Each member has:
 * - id: unique identifier
 * - label: English Display Name (e.g., "Older Brother")
 * - relationType: technical relation (e.g., 'older_brother', 'paternal_grandfather')
 * - gender: 'male' | 'female'
 * - ageOffset: approximate age difference relative to "Self" (positive = older, negative = younger)
 * - generation: 0 (same), 1 (parents), 2 (grandparents), -1 (children)
 */

export const FAMILY_MEMBERS = [
    // Generation 2 (Grandparents)
    { id: 'gp1', label: 'Grandfather (Paternal)', relationType: 'paternal_grandfather', gender: 'male', generation: 2, ageOffset: 60 },
    { id: 'gp2', label: 'Grandmother (Paternal)', relationType: 'paternal_grandmother', gender: 'female', generation: 2, ageOffset: 58 },
    { id: 'gp3', label: 'Grandfather (Maternal)', relationType: 'maternal_grandfather', gender: 'male', generation: 2, ageOffset: 62 },
    { id: 'gp4', label: 'Grandmother (Maternal)', relationType: 'maternal_grandmother', gender: 'female', generation: 2, ageOffset: 59 },

    // Generation 1 (Parents & Uncles/Aunts)
    { id: 'p1', label: 'Father', relationType: 'father', gender: 'male', generation: 1, ageOffset: 30 },
    { id: 'p2', label: 'Mother', relationType: 'mother', gender: 'female', generation: 1, ageOffset: 28 },

    // Paternal Uncles/Aunts
    { id: 'u1', label: 'Uncle (Father\'s Older Brother)', relationType: 'father_older_brother', gender: 'male', generation: 1, ageOffset: 35 },
    { id: 'u2', label: 'Aunt (Father\'s Older Sister)', relationType: 'father_older_sister', gender: 'female', generation: 1, ageOffset: 32 },
    { id: 'u3', label: 'Uncle (Father\'s Younger Brother)', relationType: 'father_younger_brother', gender: 'male', generation: 1, ageOffset: 25 },
    { id: 'u4', label: 'Aunt (Father\'s Younger Sister)', relationType: 'father_younger_sister', gender: 'female', generation: 1, ageOffset: 22 },

    // Maternal Uncles/Aunts
    { id: 'u5', label: 'Uncle (Mother\'s Brother)', relationType: 'mother_brother', gender: 'male', generation: 1, ageOffset: 26 }, // Cậu
    { id: 'u6', label: 'Aunt (Mother\'s Sister)', relationType: 'mother_sister', gender: 'female', generation: 1, ageOffset: 24 }, // Dì

    // Generation 0 (Siblings & Cousins - simplified)
    { id: 's1', label: 'Older Brother', relationType: 'older_brother', gender: 'male', generation: 0, ageOffset: 5 },
    { id: 's2', label: 'Older Sister', relationType: 'older_sister', gender: 'female', generation: 0, ageOffset: 3 },
    { id: 'me', label: 'You (Self)', relationType: 'self', gender: 'neutral', generation: 0, ageOffset: 0 },
    { id: 's3', label: 'Younger Brother', relationType: 'younger_brother', gender: 'male', generation: 0, ageOffset: -4 },
    { id: 's4', label: 'Younger Sister', relationType: 'younger_sister', gender: 'female', generation: 0, ageOffset: -6 },

    // Generation -1 (Children - Contextual if User is older)
    { id: 'c1', label: 'Son', relationType: 'son', gender: 'male', generation: -1, ageOffset: -25 },
    { id: 'c2', label: 'Daughter', relationType: 'daughter', gender: 'female', generation: -1, ageOffset: -28 },
];

export const PRONOUN_MAP = {
    // Self referring to others
    'paternal_grandfather': 'Ông nội',
    'paternal_grandmother': 'Bà nội',
    'maternal_grandfather': 'Ông ngoại',
    'maternal_grandmother': 'Bà ngoại',
    'father': 'Bố',
    'mother': 'Mẹ',
    'father_older_brother': 'Bác',
    'father_older_sister': 'Bác',
    'father_younger_brother': 'Chú',
    'father_younger_sister': 'Cô',
    'mother_brother': 'Cậu',
    'mother_sister': 'Dì',
    'older_brother': 'Anh',
    'older_sister': 'Chị',
    'younger_brother': 'Em',
    'younger_sister': 'Em',
    'son': 'Con',
    'daughter': 'Con',

    // Self referring to self (Standard/Default)
    'self_neutral': 'Tôi',
    'self_younger': 'Em',
    'self_older': 'Anh/Chị',
    'self_child': 'Con',
    'self_grandchild': 'Cháu',
};
