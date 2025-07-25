'use client';

import React, { useState, useEffect } from 'react';
import { X, Server, Shield, Database, Calendar, Mail, Activity, Settings, RotateCcw, Trash2, Save, AlertTriangle, Loader2, MessageCircle, Edit, Package, Clock, Boxes } from 'lucide-react';

const ServerManagementPage = ({ serverId, uuidShort, pterodactyl_id, onBack }) => {
    const [server, setServer] = useState(null);
    const [originalServer, setOriginalServer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');
    const [pterodactylDetails, setPterodactylDetails] = useState(null);
    const [showPterodactylDetails, setShowPterodactylDetails] = useState(false);
    const [authToken, setAuthToken] = useState(null);
    const [eggInfo, setEggInfo] = useState(null);
    const [versioniEgg, setVersioniEgg] = useState([]);
    const [versioniServer, setVersioniServer] = useState([]);
    const [filteredVersioniServer, setFilteredVersioniServer] = useState([]);
    const [versionePersonalizzata, setVersionePersonalizzata] = useState(false);
    const [statiOptions, setStatiOptions] = useState([]);
    const [tipiOptions, setTipiOptions] = useState([]);
    const [loadingStati, setLoadingStati] = useState(true);
    const [loadingTipi, setLoadingTipi] = useState(true);
    const [statiError, setStatiError] = useState('');
    const [tipiError, setTipiError] = useState('');

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
    const PTERODACTYL_URL = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

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
            fetchStati();
            fetchTipiServer();
        }
    }, [serverId, authToken]);

    // Carica versioni egg e server una sola volta
    useEffect(() => {
        if (authToken) {
            fetchVersioniEgg();
            fetchVersioniServer();
        }
    }, [authToken]);

    // Filtra versioni server in base al tipo egg selezionato
    useEffect(() => {
        if (server?.versione_egg && versioniServer.length > 0) {
            const eggSelected = versioniEgg.find(egg =>
                egg.id === parseInt(server.versione_egg) ||
                egg.nome.toLowerCase() === server.versione_egg?.toLowerCase()
            );
            if (eggSelected) {
                const filtered = versioniServer.filter(version =>
                    version.tipo_nome.toLowerCase() === eggSelected.nome.toLowerCase()
                );
                setFilteredVersioniServer(filtered);

                // Controlla se la versione corrente esiste nelle versioni filtrate
                if (server.versione_server && !filtered.find(v => v.versione === server.versione_server)) {
                    // Se la versione non esiste nelle dropdown, attiva la modalità personalizzata
                    setVersionePersonalizzata(true);
                }
            }
        } else {
            setFilteredVersioniServer([]);
        }
    }, [server?.versione_egg, versioniEgg, versioniServer]);

    // Fetch egg and version info from Pterodactyl
    useEffect(() => {
        if (uuidShort && authToken && versioniEgg.length > 0 && versioniServer.length > 0) {
            fetchEggAndVersion();
        }
    }, [uuidShort, authToken, versioniEgg, versioniServer]);

    useEffect(() => {
        if (server?.pterodactyl_id && authToken) {
            fetchPterodactylDetails();
        }
    }, [server, authToken]);

    const fetchServer = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/admin/servers/${serverId}`, {
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
            const response = await fetch(`${API_BASE}/api/admin/servers/${serverId}/pterodactyl-details`, {
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

    const fetchEggAndVersion = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/pterodactyl/client/servers/${uuidShort}/startup`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log("🎯 Egg info ricevuto:", data);

                setEggInfo({
                    eggType: data.eggType,
                    version: data.version,
                });

                // Aggiorna i valori del server con i dati ricevuti SOLO se non sono già presenti
                setServer(prev => ({
                    ...prev,
                    versione_egg: prev.versione_egg || data.eggType,
                    versione_server: prev.versione_server || data.version
                }));

                // Aggiorna anche l'originalServer per mantenere la coerenza
                setOriginalServer(prev => ({
                    ...prev,
                    versione_egg: prev.versione_egg || data.eggType,
                    versione_server: prev.versione_server || data.version
                }));
            } else {
                console.warn("⚠️ Errore nella fetch egg/version");
            }
        } catch (err) {
            console.error("❌ Errore nel recupero egg/version:", err);
        }
    };

    const fetchVersioniEgg = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/versioni-server-egg`);
            if (!response.ok) throw new Error('Errore nel caricamento versioni egg');
            const data = await response.json();
            setVersioniEgg(data);
        } catch (err) {
            console.error('Errore versioni egg:', err);
        }
    };

    const fetchVersioniServer = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/versioni-server`);
            if (!response.ok) throw new Error('Errore nel caricamento versioni server');
            const data = await response.json();
            setVersioniServer(data);
        } catch (err) {
            console.error('Errore versioni server:', err);
        }
    };

    const fetchStati = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/server/stati`);
            if (!response.ok) throw new Error('Errore nel caricamento stati');
            const data = await response.json();
            setStatiOptions(data);
            setStatiError('');
        } catch (err) {
            setStatiError('Errore durante il caricamento degli stati.');
        } finally {
            setLoadingStati(false);
        }
    };

    const fetchTipiServer = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/tipi-server`);
            if (!response.ok) throw new Error('Errore nel caricamento tipi server');
            const data = await response.json();
            const tipi = data.map((item) => item.nome);
            setTipiOptions(tipi);
            setTipiError('');
        } catch (err) {
            setTipiError('Errore durante il caricamento dei tipi server.');
        } finally {
            setLoadingTipi(false);
        }
    };

    const handleInputChange = (field, value) => {
        setServer((prev) => ({
            ...prev,
            [field]: field === 'n_backup' || field === 'n_rinnovi' ? parseInt(value, 10) || 0 : (value === '' ? null : value)
        }));

        // Reset versione server quando cambia egg
        if (field === 'versione_egg') {
            setServer(prev => ({
                ...prev,
                versione_server: ''
            }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE}/api/admin/servers/${serverId}`, {
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
                    versione_egg: server.versione_egg,
                    versione_server: server.versione_server,
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
            setSuccess('Server aggiornato con successo!');

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
            const response = await fetch(`${API_BASE}/api/admin/servers/${serverId}`, {
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

    const handleToggleSuspend = async () => {
        const newSuspendedState = !server.sospeso;

        try {
            const response = await fetch(`${API_BASE}/api/admin/servers/${serverId}/toggle-suspend`, {
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
            setSuccess(newSuspendedState ? 'Server sospeso con successo!' : 'Server riattivato con successo!');

            // Rimuovi messaggio di successo dopo 3 secondi
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCancelEdit = () => {
        // Ripristina completamente lo stato originale del server
        setServer({ ...originalServer });
        setIsEditing(false);
        setError(null);
        setSuccess('');
        setVersionePersonalizzata(false);
    };

    const toggleVersionePersonalizzata = () => {
        setVersionePersonalizzata(!versionePersonalizzata);
        // Se si disattiva la versione personalizzata, resetta il campo versione_server
        if (versionePersonalizzata) {
            handleInputChange('versione_server', '');
        }
    };

    const isExpiringSoon = () => {
        if (!server) return false;
        const expiryDate = new Date(server.data_scadenza);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate > now && expiryDate <= thirtyDaysFromNow && server.stato === 'disponibile';
    };

    // Funzione helper per ottenere il nome dell'egg selezionato
    const getSelectedEggName = (versioneEgg) => {
        if (!versioneEgg || versioniEgg.length === 0) return 'Non selezionato';

        const selectedEgg = versioniEgg.find(egg =>
            egg.id === parseInt(versioneEgg) ||
            egg.nome.toLowerCase() === versioneEgg.toLowerCase()
        );

        return selectedEgg ? `${selectedEgg.icona} ${selectedEgg.nome}` : versioneEgg;
    };

    // Funzione helper per ottenere l'ID dell'egg selezionato
    const getSelectedEggId = (versioneEgg) => {
        if (!versioneEgg || versioniEgg.length === 0) return '';

        // Se è già un ID numerico, ritornalo
        if (!isNaN(versioneEgg)) {
            return versioneEgg.toString();
        }

        // Altrimenti cerca per nome
        const selectedEgg = versioniEgg.find(egg =>
            egg.nome.toLowerCase() === versioneEgg.toLowerCase()
        );

        return selectedEgg ? selectedEgg.id.toString() : '';
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

    if (isLoading && !server) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-white/20 p-8 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Caricamento server...</p>
                </div>
            </div>
        );
    }

    if (error && !server) {
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

    if (!server) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onBack}>
                <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-white/20 max-h-[95vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    {/* Header con gradiente migliorato */}
                    <div className="relative p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-slate-200/50">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-t-3xl"></div>
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-50"></div>
                                    <div className="relative p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                                        <Server className="h-7 w-7 text-white" />
                                    </div>
                                </div>
                                <div className="ml-5">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                        Gestione Server
                                    </h2>
                                    <p className="text-slate-600 text-sm mt-1 font-medium">
                                        ID: <strong>{serverId}</strong> • Pterodactyl ID: <strong>{pterodactyl_id}</strong> • UUID: <strong>{uuidShort}</strong>
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
                                        <p className="text-sm font-semibold text-slate-600">Stato Server</p>
                                    </div>
                                    <div className="flex items-center flex-wrap gap-2">
                                        <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${server.stato === 'disponibile'
                                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                                            : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                                            }`}>
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

                                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200/50">
                                    <div className="flex items-center mb-3">
                                        <div className="p-2 bg-slate-100 rounded-xl mr-3">
                                            <Settings className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-600">Gestione</p>
                                    </div>
                                    {server.pterodactyl_id ? (
                                        <a
                                            href={`${PTERODACTYL_URL}/admin/servers/view/${server.pterodactyl_id}`}
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
                                            <RotateCcw className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-600">Rinnovi</p>
                                    </div>
                                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        {server.n_rinnovi || 0}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Sezione principale */}
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/50">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                            Informazioni Base
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
                                        {/* Nome Server */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Server className="h-4 w-4 mr-2 text-blue-600" />
                                                Nome Server
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={server.nome}
                                                    onChange={(e) => handleInputChange('nome', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                    placeholder="Il mio server..."
                                                    required
                                                />
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {server.nome}
                                                </div>
                                            )}
                                        </div>

                                        {/* Email Proprietario */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                                Email Proprietario
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={server.proprietario_email}
                                                    onChange={(e) => handleInputChange('proprietario_email', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                    placeholder="mario@example.com"
                                                    required
                                                />
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {server.proprietario_email}
                                                </div>
                                            )}
                                        </div>

                                        {/* Data Acquisto */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                                Data Acquisto
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={server.data_acquisto ? new Date(server.data_acquisto).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => handleInputChange('data_acquisto', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                />
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {server.data_acquisto ? new Date(server.data_acquisto).toLocaleDateString('it-IT') : '—'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Data Scadenza */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                                                Data Scadenza
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={server.data_scadenza ? new Date(server.data_scadenza).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => handleInputChange('data_scadenza', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                    required
                                                />
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {server.data_scadenza ? new Date(server.data_scadenza).toLocaleDateString('it-IT') : '—'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Numero Backup */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Shield className="h-4 w-4 mr-2 text-blue-600" />
                                                Numero Backup
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={server.n_backup}
                                                    onChange={(e) => handleInputChange('n_backup', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                    placeholder="3, 4, 5, 6..."
                                                    min="1"
                                                    max="10"
                                                    required
                                                />
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {server.n_backup || 0}
                                                </div>
                                            )}
                                        </div>

                                        {/* Numero Rinnovi */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <RotateCcw className="h-4 w-4 mr-2 text-blue-600" />
                                                Numero Rinnovi
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={server.n_rinnovi || 0}
                                                    onChange={(e) => handleInputChange('n_rinnovi', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                    min="0"
                                                    required
                                                />
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {server.n_rinnovi || 0}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Configurazione Server */}
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/50">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                                        Configurazione Server
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Tipo Server */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Package className="h-4 w-4 mr-2" />
                                                Tipo Server
                                            </label>
                                            {isEditing ? (
                                                loadingTipi ? (
                                                    <div className="flex items-center space-x-3 p-3 bg-slate-100 rounded-xl">
                                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                        <span className="text-slate-600">Caricamento tipi server...</span>
                                                    </div>
                                                ) : tipiError ? (
                                                    <div className="text-red-600 font-medium p-4 bg-red-50 rounded-xl border border-red-200">
                                                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                                                        {tipiError}
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={server.tipo}
                                                        onChange={(e) => handleInputChange('tipo', e.target.value)}
                                                        className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                        required
                                                    >
                                                        <option value="">Seleziona tipo server...</option>
                                                        {tipiOptions.map((tipo) => (
                                                            <option key={tipo} value={tipo}>
                                                                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {server.tipo}
                                                </div>
                                            )}
                                        </div>

                                        {/* Stato */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Activity className="h-4 w-4 mr-2" />
                                                Stato
                                            </label>
                                            {isEditing ? (
                                                loadingStati ? (
                                                    <div className="flex items-center space-x-3 p-3 bg-slate-100 rounded-xl">
                                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                                        <span className="text-slate-600">Caricamento stati...</span>
                                                    </div>
                                                ) : statiError ? (
                                                    <div className="text-red-600 font-medium p-4 bg-red-50 rounded-xl border border-red-200">
                                                        <AlertTriangle className="h-4 w-4 inline mr-2" />
                                                        {statiError}
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={server.stato}
                                                        onChange={(e) => handleInputChange('stato', e.target.value)}
                                                        className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                        required
                                                    >
                                                        {statiOptions.map((stato) => (
                                                            <option key={stato} value={stato}>
                                                                {stato.charAt(0).toUpperCase() + stato.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {server.stato}
                                                </div>
                                            )}
                                        </div>

                                        {/* Tipo Egg */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Boxes className="h-4 w-4 mr-2" />
                                                Tipo Egg
                                            </label>
                                            {isEditing ? (
                                                <select
                                                    value={(() => {
                                                        // Se server.versione_egg è già un ID numerico, usalo direttamente
                                                        if (server.versione_egg && !isNaN(server.versione_egg)) {
                                                            return server.versione_egg;
                                                        }
                                                        // Altrimenti cerca per nome
                                                        const selectedEgg = versioniEgg?.find(egg =>
                                                            egg.nome.toLowerCase() === server.versione_egg?.toLowerCase()
                                                        );
                                                        return selectedEgg ? selectedEgg.id : '';
                                                    })()}
                                                    onChange={(e) => handleInputChange('versione_egg', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                >
                                                    <option value="">Seleziona versione egg...</option>
                                                    {versioniEgg?.map((egg) => (
                                                        <option key={egg.id} value={egg.id}>
                                                            {egg.icona} {egg.nome} - {egg.descrizione}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {server.versione_egg ? (
                                                        (() => {
                                                            const selectedEgg = versioniEgg.find(egg =>
                                                                egg.id === parseInt(server.versione_egg) ||
                                                                egg.nome.toLowerCase() === server.versione_egg.toLowerCase()
                                                            );
                                                            return selectedEgg ? `${selectedEgg.icona} ${selectedEgg.nome}` : server.versione_egg;
                                                        })()
                                                    ) : (
                                                        'Non selezionato'
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Versione Server */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                    <Package className="h-4 w-4 mr-2" />
                                                    Versione Server
                                                </label>
                                                {isEditing && (
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-sm text-slate-600 font-medium">Versione personalizzata</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setVersionePersonalizzata(!versionePersonalizzata)}
                                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${versionePersonalizzata ? 'bg-blue-600 shadow-lg' : 'bg-gray-300'}`}
                                                        >
                                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${versionePersonalizzata ? 'translate-x-6' : 'translate-x-1'}`} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isEditing ? (
                                                versionePersonalizzata ? (
                                                    server.versione_egg ? (
                                                        <div className="space-y-2">
                                                            <input
                                                                type="text"
                                                                value={server.versione_server || ''}
                                                                onChange={(e) => handleInputChange('versione_server', e.target.value)}
                                                                placeholder="Inserisci versione personalizzata (es. 1.20.4, latest, snapshot)"
                                                                className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                            />
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-xs text-gray-400 italic">
                                                                    Se la versione indicata è errata, verrà installata l'ultima versione disponibile.
                                                                </p>
                                                                <p className="text-xs text-gray-400 italic">
                                                                    scrivere latest per installare l'ultima versione
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-12 px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl text-slate-400 flex items-center">
                                                            Seleziona prima il tipo di egg...
                                                        </div>
                                                    )
                                                ) : (
                                                    <select
                                                        value={(() => {
                                                            // Se server.versione_server è già presente, usalo
                                                            if (server.versione_server) {
                                                                // Verifica se esiste nelle versioni filtrate
                                                                const exists = filteredVersioniServer?.find(version =>
                                                                    version.versione === server.versione_server
                                                                );
                                                                return exists ? server.versione_server : '';
                                                            }
                                                            return '';
                                                        })()}
                                                        onChange={(e) => handleInputChange('versione_server', e.target.value)}
                                                        className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                        disabled={!server.versione_egg || filteredVersioniServer.length === 0}
                                                    >
                                                        <option value="">
                                                            {!server.versione_egg
                                                                ? 'Seleziona prima il tipo di egg...'
                                                                : 'Seleziona versione server...'}
                                                        </option>
                                                        {filteredVersioniServer?.map((version) => {
                                                            let label = version.versione;
                                                            const badges = [];

                                                            if (version.ultima_versione) badges.push('Ultima');
                                                            if (version.popolare) badges.push('Popolare');

                                                            if (badges.length > 0) {
                                                                label += ` (${badges.join(', ')})`;
                                                            }

                                                            return (
                                                                <option key={version.id} value={version.versione}>
                                                                    {label}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                )
                                            ) : (
                                                <div className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 flex items-center font-medium">
                                                    {server.versione_server || 'Non selezionata'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Commenti - Full width */}
                                        <div className="space-y-3 md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
                                                Commenti e Note
                                            </label>
                                            {isEditing ? (
                                                <textarea
                                                    value={server.commenti || ''}
                                                    onChange={(e) => handleInputChange('commenti', e.target.value)}
                                                    className="w-full min-h-[120px] px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 resize-y"
                                                    placeholder="Inserisci commenti personalizzati, bug, fix, ecc... (questa sezione è visibile solo agli amministratori)"
                                                    rows={5}
                                                />
                                            ) : (
                                                <div className="min-h-[120px] px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700">
                                                    {server.commenti ? (
                                                        <div className="whitespace-pre-wrap leading-relaxed">
                                                            {server.commenti}
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-400 italic flex items-center">
                                                            <MessageCircle className="h-5 w-5 mr-2" />
                                                            Nessun commento aggiunto
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

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
        </>
    );
};

export default ServerManagementPage;