'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Shield, Calendar, Mail, Activity, Settings, RotateCcw, Trash2, Save, AlertTriangle, Loader2, MessageCircle, Edit, Package, KeyRound, Users, Check, Server } from 'lucide-react';
import ServerManagmentModal from './ServerManagmentModal';


const UserManagementPage = ({ userId, onBack }) => {
    const [user, setUser] = useState(null);
    const [originalUser, setOriginalUser] = useState(null);
    const [userServers, setUserServers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');
    const [authToken, setAuthToken] = useState(null);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [selectedServerId, setSelectedServerId] = useState(null);
    const [showServerModal, setShowServerModal] = useState(false);
    const [selectedServer, setSelectedServer] = useState(null);



    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Recupera il token JWT dal localStorage
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            setAuthToken(token);
        } else {
            setError('Token di autenticazione non trovato. Effettua il login.');
        }
    }, []);

    // Carica i dati dell'utente
    useEffect(() => {
        if (userId && authToken) {
            fetchUser();
            fetchUserServers();
        }
    }, [userId, authToken]);

    const fetchUser = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Token scaduto o non valido. Effettua nuovamente il login.');
                    return;
                }
                throw new Error('Errore nel caricamento dell\'utente');
            }

            const data = await response.json();
            setUser(data.user);
            setOriginalUser(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserServers = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/admin/users/${userId}/servers`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserServers((data.servers || []).sort((a, b) => a.id - b.id));
            }
        } catch (err) {
            console.error('Errore nel caricamento server utente:', err);
        }
    };

    const handleInputChange = (field, value) => {
        setUser((prev) => ({
            ...prev,
            [field]: value === '' ? null : value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: user.nome,
                    cognome: user.cognome,
                    username: user.username,
                    email: user.email,
                    attivo: user.attivo
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Errore nel salvataggio');
            }

            const data = await response.json();
            setUser(data.user);
            setOriginalUser(data.user);
            setIsEditing(false);
            setSuccess('Utente aggiornato con successo!');

            // Rimuovi messaggio di successo dopo 3 secondi
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Errore nell\'eliminazione');
            }

            onBack();
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }

        setShowDeleteConfirm(false);
    };

    const handleResetPassword = async () => {
        setIsResettingPassword(true);
        setError(null);
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE}/api/admin/users/${userId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Errore nel reset password');
            }

            const data = await response.json();
            setSuccess('Password reimpostata con successo! Email inviata all\'utente.');

            // Rimuovi messaggio di successo dopo 5 secondi
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsResettingPassword(false);
        }
    };

    const onServerClick = (server) => {
        setSelectedServerId(server.id);
        setSelectedServer(server); // Aggiungi questa riga
        setShowServerModal(true);
    };

    // Funzione per chiudere il modal del server
    const handleCloseServerModal = () => {
        setShowServerModal(false);
        setSelectedServerId(null);
        setSelectedServer(null); // Aggiungi questa riga
        // Ricarica i server dell'utente nel caso siano stati modificati
        fetchUserServers();
    };

    const handleToggleActive = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/admin/users/${userId}/toggle-active`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Errore nel cambio stato');
            }

            const data = await response.json();
            setUser(prev => ({ ...prev, attivo: data.attivo }));
            setSuccess(data.attivo ? 'Utente attivato con successo!' : 'Utente disattivato con successo!');

            // Rimuovi messaggio di successo dopo 3 secondi
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCancelEdit = () => {
        setUser({ ...originalUser });
        setIsEditing(false);
        setError(null);
        setSuccess('');
    };

    // Se non c'è il token, mostra un messaggio
    if (!authToken) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-white/20 p-8 text-center">
                    <div className="p-4 bg-red-100 rounded-2xl mb-6 mx-auto w-fit">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Autenticazione Richiesta</h2>
                    <p className="text-slate-600 mb-6">Devi effettuare il login per accedere a questa pagina.</p>
                    <button
                        onClick={onBack}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg"
                    >
                        Torna indietro
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading && !user) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-white/20 p-8 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Caricamento utente...</p>
                </div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-white/20 p-8 text-center">
                    <div className="p-4 bg-red-100 rounded-2xl mb-6 mx-auto w-fit">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Errore</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={onBack}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg"
                    >
                        Torna indietro
                    </button>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <>
            <div className={`fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 ${showServerModal ? 'hidden' : ''}`} onClick={onBack}>
                <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-white/20 max-h-[95vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    {/* Header con gradiente migliorato */}
                    <div className="relative p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-slate-200/50">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-t-3xl"></div>
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-50"></div>
                                    <div className="relative p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                                        <User className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="ml-5">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                        Gestione Utente
                                    </h2>
                                    <p className="text-slate-600 text-sm mt-1 font-medium">
                                        ID: <strong>{userId}</strong> • Username: <strong>{user.username}</strong>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onBack}
                                className="group p-3 hover:bg-white/60 rounded-2xl transition-all duration-200 backdrop-blur-sm"
                            >
                                <X className="h-6 w-6 text-slate-500 group-hover:text-slate-700 transition-colors" />
                            </button>
                        </div>
                    </div>

                    {/* Content con scroll migliorato */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-8">
                            {/* Alert migliorati */}
                            {error && (
                                <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-2xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 p-2 bg-red-100 rounded-xl mr-4">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-red-800 font-semibold">{error}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-5 shadow-sm animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 p-2 bg-green-100 rounded-xl mr-4">
                                            <Check className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-green-800 font-semibold">{success}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status Cards */}
                            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200/50">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 bg-slate-100 rounded-xl mr-3">
                                            <Activity className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-600">Stato Account</p>
                                    </div>
                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className="px-4 py-2 rounded-full text-sm font-semibold shadow-sm bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200">
                                            disponibile
                                        </span>
                                    </div>
                                </div>

                                {/*Penso da togliere, per migliorare la ux. presente gia' sotto */}
                                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200/50">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 bg-slate-100 rounded-xl mr-3">
                                            <Settings className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-600">Gestione Server</p>
                                    </div>
                                    {userServers.length > 0 ? (
                                        <a
                                            href={`/dafarebla`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 inline-flex items-center gap-2 shadow-lg"
                                        >
                                            <Server className="h-4 w-4" />
                                            Gestisci
                                        </a>
                                    ) : (
                                        <span className="bg-gradient-to-r from-slate-400 to-slate-500 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 opacity-50">
                                            <Server className="h-4 w-4" />
                                            Non disponibile
                                        </span>
                                    )}
                                </div>


                                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200/50">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 bg-slate-100 rounded-xl mr-3">
                                            <Server className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-600">Server Posseduti</p>
                                    </div>
                                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        {userServers.length}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Sezione principale */}
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/50">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                            Informazioni Personali
                                        </h3>
                                        {!isEditing ? (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                            >
                                                <Edit className="h-5 w-5" />
                                                <span className="font-semibold">Modifica</span>
                                            </button>
                                        ) : (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                                                >
                                                    {isSaving ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <Save className="h-5 w-5" />
                                                    )}
                                                    <span className="font-semibold">{isSaving ? 'Salvataggio...' : 'Salva'}</span>
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={isSaving}
                                                    className="px-6 py-3 text-slate-700 border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-semibold disabled:opacity-50 shadow-sm"
                                                >
                                                    Annulla
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Nome */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <User className="h-4 w-4 mr-2 text-blue-600" />
                                                Nome
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={user.nome || ''}
                                                    onChange={(e) => handleInputChange('nome', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                    placeholder="Mario"
                                                    required
                                                />
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {user.nome || '—'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Cognome */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <User className="h-4 w-4 mr-2 text-blue-600" />
                                                Cognome
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={user.cognome || ''}
                                                    onChange={(e) => handleInputChange('cognome', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                    placeholder="Rossi"
                                                    required
                                                />
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {user.cognome || '—'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Username */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Users className="h-4 w-4 mr-2 text-blue-600" />
                                                Username
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={user.username || ''}
                                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                    placeholder="mario_rossi"
                                                    required
                                                />
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {user.username}
                                                </div>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                                Email
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={user.email || ''}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                    placeholder="mario@example.com"
                                                    required
                                                />
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {user.email}
                                                </div>
                                            )}
                                        </div>

                                        {/* Data Registrazione */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                                Data Registrazione
                                            </label>
                                            <div className="w-full h-12 px-4 py-3 bg-gray-100 border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                {user.data_registrazione ? new Date(user.data_registrazione).toLocaleDateString('it-IT') : '—'}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <KeyRound className="h-4 w-4 mr-2 text-blue-600" />
                                                Reset Password
                                            </label>
                                            <button
                                                onClick={handleResetPassword}
                                                disabled={isResettingPassword}
                                                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-3 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none whitespace-nowrap"
                                                title="Reset Password Utente"
                                            >
                                                {isResettingPassword ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <RotateCcw className="h-4 w-4" />
                                                )}
                                                <span className="font-semibold text-sm">
                                                    {isResettingPassword ? 'Reset...' : 'Reset Password'}
                                                </span>
                                            </button>
                                        </div>


                                    </div>
                                </div>

                                {/* Server dell'utente */}
                                {userServers.length > 0 && (
                                    <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/50">
                                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                                            Server Posseduti ({userServers.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {userServers.map((server) => (
                                                <div
                                                    key={server.id}
                                                    className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 group"
                                                    onClick={() => onServerClick(server)} // Funzione per aprire modifica server
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                            {server.nome}
                                                        </h4>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${server.stato === 'disponibile'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {server.stato}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-1">Tipo: {server.tipo}</p>
                                                    <p className="text-sm text-slate-600 mb-3">
                                                        Scadenza: {server.data_scadenza ? new Date(server.data_scadenza).toLocaleDateString('it-IT') : '—'}
                                                    </p>

                                                    {/* Indicatore visivo che è cliccabile */}
                                                    <div className="flex items-center text-xs text-blue-600 group-hover:text-blue-700 font-medium">
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Clicca per modificare
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                {/* Azioni Pericolose */}
                                <div className="bg-gradient-to-br from-red-50 via-rose-50 to-red-50 border border-red-200/50 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 p-3 bg-red-100 rounded-xl mr-4">
                                            <AlertTriangle className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-red-800 mb-3">Azioni Pericolose</h4>
                                            <div className="bg-white/50 backdrop-blur-sm border border-red-200 rounded-xl p-4 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-red-100 rounded-lg mr-3">
                                                            <Trash2 className="h-5 w-5 text-red-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-red-800">Elimina Utente</p>
                                                            <p className="text-sm text-red-600">Questa azione è irreversibile</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setShowDeleteConfirm(true)}
                                                        className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="font-semibold">Elimina</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal di Conferma Eliminazione */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-60 p-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-white/20" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="relative p-6 bg-gradient-to-br from-red-50 via-rose-50 to-red-50 border-b border-red-200/50">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5 rounded-t-3xl"></div>
                            <div className="relative flex items-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl blur opacity-50"></div>
                                    <div className="relative p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl shadow-lg">
                                        <AlertTriangle className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="ml-5">
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-red-800 to-red-600 bg-clip-text text-transparent">
                                        Conferma Eliminazione
                                    </h3>
                                    <p className="text-red-600 text-sm mt-1 font-medium">Questa azione non può essere annullata</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Sei sicuro di voler eliminare il server <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">"{server.nome}"</span>?
                            </p>
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-8 py-3 text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-semibold shadow-sm"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Eliminando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-5 w-5" />
                                            <span>Elimina</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showServerModal && selectedServerId && selectedServer && (
                <ServerManagmentModal
                    serverId={selectedServerId}
                    uuidShort={selectedServer.uuidShort}
                    pterodactyl_id={selectedServer.pterodactyl_id}
                    onBack={handleCloseServerModal} // 👈 CORRETTO NOME
                    authToken={authToken}
                />
            )}
        </>
    );
};

export default UserManagementPage;