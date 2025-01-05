'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentEditor } from '@/components/document-editor';

export default function DocumentsPage() {
    const router = useRouter();
    const [docId] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    return (
        <main className="container mx-auto p-4 h-screen">
            <DocumentEditor docId={docId} />
        </main>
    );
}