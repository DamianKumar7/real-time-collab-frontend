'use client'

import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';



export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    useEffect(() => {
            const token = localStorage.getItem('token');
            setIsLoggedIn(!!token);
        }, []);
    if (isLoggedIn) {
        redirect('/document-manager')
    } else {
            redirect('/login');
    }
}