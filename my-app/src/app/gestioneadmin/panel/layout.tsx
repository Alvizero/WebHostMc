'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Shield, User, Database, Calendar, Home } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.replace('/gestioneadmin/login');
            return;
        }

        fetch('http://localhost:3001/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (data.valid && data.user?.ruolo === 'admin') {
                    setUser(data.user);
                } else {
                    localStorage.removeItem('adminToken');
                    router.replace('/gestioneadmin/login');
                }
            })
            .catch(() => {
                localStorage.removeItem('adminToken');
                router.replace('/gestioneadmin/login');
            })
            .finally(() => setLoading(false));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setUser(null);
        router.push('/gestioneadmin/login');
    };

    if (loading) return <div className="p-6">Caricamento...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-[85rem] mx-auto px-6 sm:px-8 lg:px-0">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <Shield className="h-8 w-8 text-blue-600 mr-3" />
                            <h1 className="text-2xl font-bold text-gray-900">Pannello Amministratore</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center text-sm text-gray-600">
                                <User className="h-4 w-4 mr-2" />
                                {user.email}
                            </div>
                            <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">Logout</button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-[85rem] mx-auto px-6 sm:px-8 lg:px-0">
                    <div className="flex space-x-8">
                        <NavLink href="/gestioneadmin/panel/dashboard" current={pathname.endsWith('/dashboard')}>
                            <Database className="h-4 w-4 mr-2" />
                            Dashboard Server
                        </NavLink>
                        <NavLink href="/gestioneadmin/panel/users" current={pathname.endsWith('/users')}>
                            <User className="h-4 w-4 mr-2" />
                            Gestione Utenti
                        </NavLink>
                        <NavLink href="/minecraft" current={pathname.endsWith('/users')}>
                            <Home className="h-4 w-4 mr-2" />
                            Home
                        </NavLink>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="max-w-[85rem] mx-auto py-6 sm:px-12 lg:px-0">
                <div className="px-4 py-6 sm:px-0">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex">
                                <Calendar className="h-5 w-5 text-red-400 mr-2" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}

// NavLink component
function NavLink({ href, current, children }: { href: string; current: boolean; children: React.ReactNode }) {
    return (
        <Link href={href} className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center ${current ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            {children}
        </Link>
    );
}