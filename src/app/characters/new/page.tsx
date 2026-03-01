'use client';

import CharacterWizard from '../components/CharacterWizard';
import { useRouter } from 'next/navigation';

export default function NewCharacterPage() {
    const router = useRouter();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <CharacterWizard
                onClose={() => router.push('/characters')}
                onComplete={() => router.push('/characters')}
                isPage={true}
            />
        </div>
    );
}
