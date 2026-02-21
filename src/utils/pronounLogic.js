/**
 * Vietnamese Pronoun Logic
 * 
 * Determines the correct pronoun pair (Addresser -> Addressee) based on 
 * the relationship and the relative age/gender.
 */

/**
 * Calculates the pronouns for a conversation between Self (User) and a Target.
 * 
 * @param {Object} userProfile - { age: number, gender: 'male'|'female' }
 * @param {Object} targetMember - The family member object from kinshipData
 * @returns {Object} { selfPronoun: string, targetPronoun: string, explanation: string }
 */
export function calculatePronoun(userProfile, targetMember) {
    if (!userProfile || !targetMember) return null;

    let selfPronoun = "Tôi";
    let targetPronoun = "Bạn";
    let explanation = "Standard neutral addressing.";

    const { relationType, gender: targetGender } = targetMember;
    const { gender: userGender } = userProfile; // 'male' or 'female'

    // Generation-based Logic
    if (targetMember.generation === 2) {
        // Grandparents
        selfPronoun = "Cháu";
        targetPronoun = targetMember.relationType.includes("grandmother") ? "Bà" : "Ông";
        explanation = `You are the grandchild (Cháu) speaking to your grandparent (${targetPronoun}).`;
    }
    else if (targetMember.generation === 1) {
        // Parents & Uncles/Aunts
        selfPronoun = "Con"; // Default for parents
        if (['paternal_grandfather', 'paternal_grandmother', 'maternal_grandfather', 'maternal_grandmother'].includes(targetMember.relationType)) {
            // Redundant check, handled above, but just in case of data overlap
            selfPronoun = "Cháu";
        }

        switch (relationType) {
            case 'father':
                targetPronoun = "Bố";
                explanation = "Calling your father.";
                break;
            case 'mother':
                targetPronoun = "Mẹ";
                explanation = "Calling your mother.";
                break;
            case 'father_older_brother':
            case 'father_older_sister': // Dialect vary, often Bác
                targetPronoun = "Bác";
                selfPronoun = "Cháu";
                explanation = "Father's older sibling is always 'Bác', regardless of gender.";
                break;
            case 'father_younger_brother':
                targetPronoun = "Chú";
                selfPronoun = "Cháu";
                explanation = "Father's younger brother is 'Chú'.";
                break;
            case 'father_younger_sister':
                targetPronoun = "Cô";
                selfPronoun = "Cháu";
                explanation = "Father's younger sister is 'Cô'.";
                break;
            case 'mother_brother':
                targetPronoun = "Cậu";
                selfPronoun = "Cháu";
                explanation = "Mother's brother is 'Cậu'.";
                break;
            case 'mother_sister':
                targetPronoun = "Dì";
                selfPronoun = "Cháu";
                explanation = "Mother's sister is 'Dì'.";
                break;
        }
    }
    else if (targetMember.generation === 0) {
        // Siblings / Cousins / Peers
        if (['older_brother', 'older_sister'].includes(relationType)) {
            // Older
            selfPronoun = "Em";
            targetPronoun = relationType === 'older_brother' ? "Anh" : "Chị";
            explanation = targetGender === 'male' ? "Older brother is 'Anh'." : "Older sister is 'Chị'.";
        } else if (['younger_brother', 'younger_sister'].includes(relationType)) {
            // Younger
            targetPronoun = "Em";
            selfPronoun = userGender === 'male' ? "Anh" : "Chị";
            explanation = `You are older, so you are '${selfPronoun}'. Younger sibling is 'Em'.`;
        } else if (relationType === 'self') {
            return { selfPronoun: 'Tôi', targetPronoun: 'Tôi', explanation: 'Talking to yourself?' };
        }
    }
    else if (targetMember.generation === -1) {
        // Children / Nieces / Nephews
        targetPronoun = "Con"; // Or 'Cháu' if niece/nephew
        if (['son', 'daughter'].includes(relationType)) {
            targetPronoun = "Con";
            selfPronoun = userGender === 'male' ? "Bố" : "Mẹ";
            explanation = `You are the parent (${selfPronoun}). Child is 'Con'.`;
        }
    }

    return { selfPronoun, targetPronoun, explanation };
}

/**
 * Helper to get the reverse addressing (What they call YOU)
 */
export function getReversePronouns(userProfile, targetMember) {
    const form = calculatePronoun(userProfile, targetMember);
    if (!form) return null;
    // Swap
    return {
        selfPronoun: form.targetPronoun,
        targetPronoun: form.selfPronoun,
        explanation: `Reverse: They call you '${form.selfPronoun}' and refer to themselves as '${form.targetPronoun}'.`
    };
}
