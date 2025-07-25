'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Shield, Lock, Eye, EyeOff, LogIn, AlertCircle, Mail } from 'lucide-react';

// Componente per il form di login
const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) return; // Non loggato, resta qui e mostra form

        fetch(`${API_BASE}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(res => res.json())
            .then(data => {
                if (data.valid && data.user?.ruolo === 'admin') {
                    router.replace('/gestioneadmin/panel/dashboard'); // Redirect se già loggato
                } else {
                    localStorage.removeItem('adminToken'); // Token non valido
                }
            })
            .catch(() => {
                localStorage.removeItem('adminToken'); // Errore API: pulisci token
            });
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Chiamata API reale per login
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Verifica se l'utente è admin
                if (data.user && data.user.ruolo === 'admin') {
                    // Salva il token se presente
                    if (data.token) {
                        localStorage.setItem('adminToken', data.token);
                        document.cookie = `adminToken=${data.token}; path=/; max-age=86400`; // 1 giorno

                    }
                    router.push("/gestioneadmin/panel/dashboard");
                    onLogin(data.user);
                } else {
                    setError('Accesso negato. Solo gli amministratori possono accedere a questa sezione.');
                }
            } else {
                setError(data.message || 'Credenziali non valide.');
            }
        } catch (err) {
            console.error('Errore di login:', err);
            setError('Errore di connessione al server. Riprova più tardi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-xl"></div>
                        <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4 relative z-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Pannello Admin</h1>
                    <p className="text-gray-600">Accesso riservato agli amministratori</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-700 hover:border-gray-400"
                                placeholder="admin@alvidomain.it"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-700 hover:border-gray-400"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Accesso in corso...
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <LogIn className="h-5 w-5" />
                                Accedi
                            </div>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;