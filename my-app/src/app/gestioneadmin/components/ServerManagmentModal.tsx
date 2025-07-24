'use client';

import React, { useState, useEffect } from 'react';
import { X, Server, Shield, Database, Calendar, Mail, Activity, Settings, RotateCcw, Trash2, Save, AlertTriangle, Loader2, MessageCircle, Edit, Package, Clock } from 'lucide-react';

const ServerManagementPage = ({ serverId, uuidShort, pterodactyl_id, onBack }) => {
    const [server, setServer] = useState(null);
    const [originalServer, setOriginalServer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [pterodactylDetails, setPterodactylDetails] = useState(null);
    const [showPterodactylDetails, setShowPterodactylDetails] = useState(false);
    const [authToken, setAuthToken] = useState(null);

    const API_BASE = 'http://localhost:3001/api';

    // Recupera il token JWT dal localStorage
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            setAuthToken(token);
        } else {
            setError('Token di autenticazione non trovato. Effettua il login.');
        }
    }, []);

    // Carica i dati del server
    useEffect(() => {
        if (serverId && authToken) {
            fetchServer();
        }
    }, [serverId, authToken]);

    const fetchServer = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/admin/servers/${serverId}`, {
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
                throw new Error('Errore nel caricamento del server');
            }

            const data = await response.json();
            setServer(data.server);
            setOriginalServer(data.server);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPterodactylDetails = async () => {
        try {
            const response = await fetch(`${API_BASE}/admin/servers/${serverId}/pterodactyl-details`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPterodactylDetails(data);
            }
        } catch (err) {
            console.error('Errore nel caricamento dettagli Pterodactyl:', err);
        }
    };

    useEffect(() => {
        if (server?.pterodactyl_id && authToken) {
            fetchPterodactylDetails();
        }
    }, [server, authToken]);

    const handleInputChange = (field, value) => {
        setServer((prev) => ({ ...prev, [field]: value === '' ? null : value, }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/admin/servers/${serverId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nome: server.nome,
                    tipo: server.tipo,
                    proprietario_email: server.proprietario_email,
                    data_acquisto: server.data_acquisto,
                    data_scadenza: server.data_scadenza,
                    stato: server.stato,
                    n_rinnovi: server.n_rinnovi || 0,
                    n_backup: server.n_backup,
                    commenti: server.commenti
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Errore nel salvataggio');
            }

            const data = await response.json();
            setServer(data.server);
            setOriginalServer(data.server);
            setIsEditing(false);

            // Mostra messaggio di successo
            alert('Server aggiornato con successo!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/admin/servers/${serverId}`, {
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

            alert('Server eliminato con successo!');
            onBack();
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }

        setShowDeleteConfirm(false);
    };

    const handleToggleSuspend = async () => {
        const newSuspendedState = !server.sospeso;

        try {
            const response = await fetch(`${API_BASE}/admin/servers/${serverId}/toggle-suspend`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sospeso: newSuspendedState })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Errore nel cambio stato');
            }

            setServer(prev => ({ ...prev, sospeso: newSuspendedState }));
            alert(newSuspendedState ? 'Server sospeso con successo!' : 'Server riattivato con successo!');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCancelEdit = () => {
        setServer(originalServer);
        setIsEditing(false);
        setError(null);
    };

    const isExpiringSoon = () => {
        if (!server) return false;
        const expiryDate = new Date(server.data_scadenza);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate > now && expiryDate <= thirtyDaysFromNow && server.stato === 'disponibile';
    };


    const [statiError, setStatiError] = useState<string | null>(null);
    const [statiOptions, setStatiOptions] = useState<string[]>([]);
    const [loadingStati, setLoadingStati] = useState(true);

    useEffect(() => {
        async function fetchStati() {
            try {
                const res = await fetch('http://localhost:3001/api/server/stati');
                if (!res.ok) throw new Error(`Errore ${res.status}`);
                const data: string[] = await res.json();
                setStatiOptions(data);
                setStatiError(null);
            } catch (err) {
                setStatiError('Impossibile caricare gli stati');
                console.error(err);
            } finally {
                setLoadingStati(false);
            }
        }
        fetchStati();
    }, []);

    const [tipiOptions, setTipiOptions] = useState<string[]>([]);
    const [loadingTipi, setLoadingTipi] = useState(true);
    const [tipiError, setTipiError] = useState("");

    useEffect(() => {
        const fetchTipiServer = async () => {
            try {
                const response = await fetch("http://localhost:3001/api/tipi-server");
                if (!response.ok) {
                    throw new Error("Errore nel recupero dei tipi di server");
                }
                const data = await response.json();
                const tipi = data.map((item: any) => item.nome); // supponendo che la colonna sia "nome"
                setTipiOptions(tipi);
                setLoadingTipi(false);
            } catch (error: any) {
                console.error("Errore:", error);
                setTipiError("Errore durante il caricamento dei tipi server.");
                setLoadingTipi(false);
            }
        };

        fetchTipiServer();
    }, []);

    // Se non c'è il token, mostra un messaggio
    if (!authToken) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Autenticazione richiesta</h2>
                    <p className="text-gray-600 mb-4">Devi effettuare il login per accedere a questa pagina.</p>
                    <button
                        onClick={onBack}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Torna indietro
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading && !server) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-gray-600">Caricamento server...</span>
                </div>
            </div>
        );
    }

    if (error && !server) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={onBack}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Torna indietro
                    </button>
                </div>
            </div>
        );
    }

    if (!server) return null;


    return (
        // Overlay di sfondo del modale
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onBack}>
            {/* Contenuto del modale */}
            <div
                className="bg-white rounded-2xl max-w-[80rem] w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header del modale */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 rounded-t-2xl p-6 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg mr-4">
                                <Server className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                    Gestione Server
                                </h1>
                                <p className="text-slate-600 mt-1 font-medium">ID: <b>{serverId}</b> • Pterodactyl ID: <b>{pterodactyl_id}</b> • Pterodactyl UUID: <b>{uuidShort}</b></p>
                            </div>
                        </div>
                        {/* Pulsante di chiusura */}
                        <button
                            onClick={onBack}
                            className="p-3 hover:bg-slate-100 rounded-xl transition-all duration-200 group hover:scale-105"
                            aria-label="Chiudi"
                        >
                            <X className="h-6 w-6 text-slate-600 group-hover:text-slate-900" />
                        </button>
                    </div>
                </div>

                {/* Contenuto scrollabile del modale */}
                <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
                    <div className="p-6 space-y-8">
                        {/* Error Alert */}
                        {error && (
                            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 shadow-sm animate-in slide-in-from-top duration-300">
                                <div className="flex items-center">
                                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                    </div>
                                    <span className="text-red-800 font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                                <div className="flex items-center justify-between">
                                    <div className="w-full">
                                        <div className="flex items-center mb-3">
                                            <div className="p-2 bg-slate-100 rounded-lg mr-2">
                                                <Server className="h-4 w-4 text-slate-600" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-600">Stato Server</p>
                                        </div>
                                        <div className="flex items-center flex-wrap gap-2">
                                            <span
                                                className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition-all duration-200 ${server.stato === 'disponibile'
                                                    ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                                                    : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                                                    }`}
                                            >
                                                {server.stato}
                                            </span>
                                            {server.sospeso && (
                                                <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 rounded-full text-xs font-semibold border border-orange-200">
                                                    Sospeso
                                                </span>
                                            )}
                                            {isExpiringSoon() && (
                                                <span className="px-3 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full text-xs font-semibold border border-yellow-200 animate-pulse">
                                                    In scadenza
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                                <div className="flex items-center justify-between">
                                    <div className="w-full">
                                        <div className="flex items-center mb-3">
                                            <div className="p-2 bg-slate-100 rounded-lg mr-2">
                                                <Settings className="h-4 w-4 text-slate-600" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-600">Azioni</p>
                                        </div>
                                        <div className="mt-2">
                                            {server.pterodactyl_id ? (
                                                <a
                                                    href={`http://192.168.1.56/admin/servers/view/${server.pterodactyl_id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                                >
                                                    <Server className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                                                    Gestisci
                                                </a>
                                            ) : (
                                                <div className="group bg-gradient-to-r from-slate-400 to-slate-500 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 opacity-50">
                                                    <Server className="h-4 w-4" />
                                                    Non disponibile
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                                <div className="flex items-center justify-between">
                                    <div className="w-full">
                                        <div className="flex items-center mb-3">
                                            <div className="p-2 bg-slate-100 rounded-lg mr-2">
                                                <RotateCcw className="h-4 w-4 text-slate-600" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-600">Rinnovi</p>
                                        </div>
                                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                            {server.n_rinnovi || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                            <div className="p-6 bg-gradient-to-r from-slate-100 to-blue-100 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="p-3 bg-white rounded-xl shadow-sm mr-4">
                                            <Database className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                            Informazioni Server
                                        </h2>
                                    </div>
                                    <div className="flex items-center space-x-3">
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
                                                    className="px-6 py-3 text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold disabled:opacity-50 transform hover:scale-105 disabled:transform-none"
                                                >
                                                    <span className="font-semibold">Annulla</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Nome Server */}
                                        <div className="space-y-3">
                                            <label className="flex items-center text-sm font-semibold text-slate-700">
                                                <Server className="h-4 w-4 mr-2" />
                                                Nome Server
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={server.nome}
                                                    onChange={(e) => handleInputChange('nome', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md"
                                                    placeholder="inserisci il nome del server..."
                                                    required
                                                />
                                            ) : (
                                                <div className="text-slate-900 h-12 flex items-center px-4 bg-white rounded-xl font-medium border border-slate-200">
                                                    {server.nome}
                                                </div>
                                            )}
                                        </div>

                                        {/* Tipo Server */}
                                        <div className="space-y-3">
                                            <label className="flex items-center text-sm font-semibold text-slate-700">
                                                <Package className="h-4 w-4 mr-2" />
                                                Tipo Server
                                            </label>
                                            {isEditing ? (
                                                loadingTipi ? (
                                                    <div className="w-full h-12 px-4 py-3 border border-slate-300 rounded-xl bg-slate-100 flex items-center">
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        <span className="text-slate-600">Caricamento...</span>
                                                    </div>
                                                ) : tipiError ? (
                                                    <div className="text-red-600 font-medium p-3 bg-red-50 rounded-xl border border-red-200">
                                                        {tipiError}
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={server.tipo}
                                                        onChange={(e) => handleInputChange("tipo", e.target.value)}
                                                        className="w-full h-12 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md"
                                                    >
                                                        {tipiOptions.map((tipo) => (
                                                            <option key={tipo} value={tipo}>
                                                                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )
                                            ) : (
                                                <div className="h-12 flex items-center">
                                                    <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-200">
                                                        {server.tipo}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Email Proprietario */}
                                        <div className="space-y-3">
                                            <label className="flex items-center text-sm font-semibold text-slate-700">
                                                <Mail className="h-4 w-4 mr-2" />
                                                Email Proprietario
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={server.proprietario_email}
                                                    onChange={(e) => handleInputChange('proprietario_email', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md"
                                                    placeholder='mario@example.com'
                                                    required
                                                />
                                            ) : (
                                                <div className="text-slate-900 h-12 flex items-center px-4 bg-white rounded-xl font-medium border border-slate-200">
                                                    {server.proprietario_email}
                                                </div>
                                            )}
                                        </div>

                                        {/* Stato */}
                                        <div className="space-y-3">
                                            <label className="flex items-center text-sm font-semibold text-slate-700">
                                                <Activity className="h-4 w-4 mr-2" />
                                                Stato
                                            </label>
                                            {isEditing ? (
                                                loadingStati ? (
                                                    <div className="w-full h-12 px-4 py-3 border border-slate-300 rounded-xl bg-slate-100 flex items-center">
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        <span className="text-slate-600">Caricamento...</span>
                                                    </div>
                                                ) : statiError ? (
                                                    <div className="text-red-600 font-medium p-3 bg-red-50 rounded-xl border border-red-200">
                                                        {statiError}
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={server.stato}
                                                        onChange={(e) => handleInputChange('stato', e.target.value)}
                                                        className="w-full h-12 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md"
                                                    >
                                                        {statiOptions.map((stato) => (
                                                            <option key={stato} value={stato}>
                                                                {stato.charAt(0).toUpperCase() + stato.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )
                                            ) : (
                                                <div className="h-12 flex items-center">
                                                    <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-200">
                                                        {server.stato}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Data Acquisto */}
                                        <div className="space-y-3">
                                            <label className="flex items-center text-sm font-semibold text-slate-700">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Data Acquisto
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={
                                                        server.data_acquisto
                                                            ? new Date(server.data_acquisto).toISOString().split('T')[0]
                                                            : ''
                                                    }
                                                    onChange={(e) => handleInputChange('data_acquisto', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md"
                                                />
                                            ) : (
                                                <div className="text-slate-900 h-12 flex items-center px-4 bg-white rounded-xl font-medium border border-slate-200">
                                                    {server.data_acquisto
                                                        ? new Date(server.data_acquisto).toLocaleDateString('it-IT')
                                                        : '—'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Data Scadenza */}
                                        <div className="space-y-3">
                                            <label className="flex items-center text-sm font-semibold text-slate-700">
                                                <Clock className="h-4 w-4 mr-2" />
                                                Data Scadenza
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={
                                                        server.data_scadenza
                                                            ? new Date(server.data_scadenza).toISOString().split('T')[0]
                                                            : ''
                                                    }
                                                    onChange={(e) => handleInputChange('data_scadenza', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md"
                                                />
                                            ) : (
                                                <div className="text-slate-900 h-12 flex items-center px-4 bg-white rounded-xl font-medium border border-slate-200">
                                                    {server.data_scadenza
                                                        ? new Date(server.data_scadenza).toLocaleDateString('it-IT')
                                                        : '—'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Backup */}
                                        <div className="space-y-3">
                                            <label className="flex items-center text-sm font-semibold text-slate-700">
                                                <Shield className="h-4 w-4 mr-2" />
                                                Numero Backup
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={server.n_backup ?? 0}
                                                    onChange={(e) => handleInputChange('n_backup', parseInt(e.target.value, 10) || 0)}
                                                    className="w-full h-12 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md"
                                                    placeholder="3, 4, 5, 6..."
                                                    min="0"
                                                    required
                                                />
                                            ) : (
                                                <div className="text-slate-900 h-12 flex items-center px-4 bg-white rounded-xl font-medium border border-slate-200">
                                                    {server.n_backup ?? 0}
                                                </div>
                                            )}
                                        </div>

                                        {/* Rinnovi */}
                                        <div className="space-y-3">
                                            <label className="flex items-center text-sm font-semibold text-slate-700">
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Numero Rinnovi
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={server.n_rinnovi ?? 0}
                                                    onChange={(e) => handleInputChange('n_rinnovi', parseInt(e.target.value, 10) || 0)}
                                                    className="w-full h-12 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md"
                                                    placeholder="3, 4, 5, 6..."
                                                    min="0"
                                                    required
                                                />
                                            ) : (
                                                <div className="text-slate-900 h-12 flex items-center px-4 bg-white rounded-xl font-medium border border-slate-200">
                                                    {server.n_rinnovi ?? 0}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sezione Commenti - A tutta larghezza */}
                                    <div className="space-y-3">
                                        <label className="flex items-center text-sm font-semibold text-slate-700">
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Commenti e Note
                                        </label>
                                        {isEditing ? (
                                            <textarea
                                                value={server.commenti || ''}
                                                onChange={(e) => handleInputChange('commenti', e.target.value)}
                                                className="w-full min-h-[120px] px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:shadow-md resize-y"
                                                placeholder="Inserisci commenti personalizzati, bug, fix, ecc... (questa sezione è visibile solo agli amministraotri)"
                                                rows={5}
                                            />
                                        ) : (
                                            <div className="min-h-[120px] px-4 py-3 bg-white rounded-xl border border-slate-200">
                                                {server.commenti ? (
                                                    <div className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                                                        {server.commenti}
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-500 italic flex">
                                                        <MessageCircle className="h-5 w-5 mr-2" />
                                                        Nessun commento aggiunto
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-lg border border-red-200 p-6">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-red-100 rounded-lg mr-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-red-800">
                                    Azioni Pericolose
                                </h3>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm border border-red-200 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-red-100 rounded-lg mr-3">
                                            <Trash2 className="h-5 w-5 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-red-800">Elimina Server</p>
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

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-[3px] flex items-center justify-center z-60 p-4 animate-in fade-in duration-300" onClick={() => setShowDeleteConfirm(false)}>
                        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-200 rounded-t-2xl">
                                <div className="flex items-center">
                                    <div className="p-3 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl shadow-lg mr-4">
                                        <AlertTriangle className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-red-800">
                                            Conferma Eliminazione
                                        </h3>
                                        <p className="text-red-600 text-sm mt-1">Questa azione non può essere annullata</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-600 mb-6 leading-relaxed">
                                    Sei sicuro di voler eliminare il server <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">"{server.nome}"</span>?
                                </p>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-6 py-3 text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                        <span className="font-semibold">Elimina</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServerManagementPage;