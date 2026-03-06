import { playButton, playDisabled, playTap, playSelect } from '../utils/sound';

/**
 * SoundButton — a <button> wrapper that auto-plays sounds based on variant.
 *
 * Sound is auto-detected from className:
 *   - "primary"   → playButton()
 *   - "disabled"  → playDisabled() (onClick is NOT called)
 *   - "secondary"  → playTap()
 *
 * Override with `sound` prop: "button" | "tap" | "select" | "disabled" | "none"
 *
 * All other props are passed through to <button>.
 */
export default function SoundButton({ sound, onClick, className = '', disabled, children, ...rest }) {
    const handleClick = (e) => {
        // Determine which sound to play
        const resolvedSound = sound ?? detectSound(className, disabled);

        if (resolvedSound === 'disabled') {
            playDisabled();
            return; // don't fire onClick
        }

        // Play sound before action
        switch (resolvedSound) {
            case 'button': playButton(); break;
            case 'tap': playTap(); break;
            case 'select': playSelect(); break;
            // 'none' or unknown → no sound
        }

        onClick?.(e);
    };

    return (
        <button className={className} onClick={handleClick} {...rest}>
            {children}
        </button>
    );
}

function detectSound(className, disabled) {
    if (disabled || className.includes('disabled')) return 'disabled';
    if (className.includes('primary')) return 'button';
    if (className.includes('secondary')) return 'button';
    return 'none';
}
