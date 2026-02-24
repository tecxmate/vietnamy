import { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function VocabImage({ word, alt, className, ...props }) {
    const [failed, setFailed] = useState(false);

    useEffect(() => { setFailed(false); }, [word.id]);

    if (failed || !word.image) {
        return (
            <div className={`voc-img-fallback ${className || ''}`} {...props}>
                {word.emoji
                    ? <span className="voc-img-fallback-emoji">{word.emoji}</span>
                    : <ImageIcon size={20} style={{ color: 'var(--text-muted)' }} />
                }
            </div>
        );
    }

    return (
        <img
            src={word.image}
            alt={alt || word.english}
            className={className}
            loading="lazy"
            onError={() => setFailed(true)}
            {...props}
        />
    );
}
