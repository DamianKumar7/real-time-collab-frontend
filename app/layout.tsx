'use client';

import { redirect, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import './globals.css'
import { ThemeProvider } from 'next-themes';
import { ModeToggle } from '@/components/mode-toggle';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import Link from 'next/link';
import { Button } from '@/components/ui/button';


export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
    }, [pathname]);

    const handleSignOut = () => {
        localStorage.removeItem('token')
        redirect('/login')
    }

    return (
        <html lang="en">
            <body>
            <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
                >
                    {isLoggedIn && pathname.startsWith('/document-manager') && (


                        <NavigationMenu>
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                <Link href="/docs" legacyBehavior passHref>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                    Documentation
                                    </NavigationMenuLink>
                                </Link>
                                
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Button onClick={handleSignOut}>
                                        Sign Out
                                    </Button>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <ModeToggle />
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                )}
                {children}
          </ThemeProvider>
                
            </body>
        </html>
    );
}