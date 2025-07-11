'use client';

import React, { useState, useEffect } from 'react';
import { User, Server, Shield, Database, Calendar, Mail, Hash, Activity, Search, ArrowLeft, Settings, Power, Trash2, Save, AlertTriangle } from 'lucide-react';

// Componente per il form di login
const LoginForm = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        setIsLoading(true);
        setError('');

        try {
            // Chiamata API reale per login
            const response = await fetch('http://localhost:3001/api/auth/login', {
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
                    }
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
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Pannello Admin</h1>
                    <p className="text-gray-600">Accesso riservato agli amministratori</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 text-gray-700"
                            placeholder="admin@alvidomain.it"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 text-gray-700"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Accesso in corso...' : 'Accedi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ServerManagement = ({ server, onBack, onUpdate, onDelete, onSuspend }) => {
    const [formData, setFormData] = useState({
        nome: server.nome || '',
        tipo: server.tipo || '',
        proprietario_email: server.proprietario_email || '',
        data_acquisto: server.data_acquisto ? new Date(server.data_acquisto).toISOString().split('T')[0] : '',
        data_scadenza: server.data_scadenza ? new Date(server.data_scadenza).toISOString().split('T')[0] : '',
        stato: server.stato || 'disponibile'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSuspended, setIsSuspended] = useState(server.sospeso || false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onUpdate(server.id, formData);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuspend = async () => {
        setIsLoading(true);
        try {
            await onSuspend(server.id, !isSuspended);
            setIsSuspended(!isSuspended);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Sei sicuro di voler eliminare questo server? Questa operazione non può essere annullata.')) {
            setIsLoading(true);
            try {
                await onDelete(server.id);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Torna alla Dashboard
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Gestione Server #{server.id}</h2>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleSuspend}
                        disabled={isLoading}
                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isSuspended
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                    >
                        <Power className="h-4 w-4 mr-2" />
                        {isSuspended ? 'Riattiva' : 'Sospendi'}
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome Server
                            </label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo Server
                            </label>
                            <select
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Seleziona tipo</option>
                                <option value="minecraft">Minecraft</option>
                                <option value="discord">Discord Bot</option>
                                <option value="web">Web Server</option>
                                <option value="database">Database</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Proprietario
                            </label>
                            <input
                                type="email"
                                value={formData.proprietario_email}
                                onChange={(e) => setFormData({ ...formData, proprietario_email: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stato
                            </label>
                            <select
                                value={formData.stato}
                                onChange={(e) => setFormData({ ...formData, stato: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="disponibile">Disponibile</option>
                                <option value="scaduto">Scaduto</option>
                                <option value="sospeso">Sospeso</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Data Acquisto
                            </label>
                            <input
                                type="date"
                                value={formData.data_acquisto}
                                onChange={(e) => setFormData({ ...formData, data_acquisto: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Data Scadenza
                            </label>
                            <input
                                type="date"
                                value={formData.data_scadenza}
                                onChange={(e) => setFormData({ ...formData, data_scadenza: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Salvando...' : 'Salva Modifiche'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente per la gestione del singolo utente
const UserManagement = ({ user, onBack, onUpdate, onDelete, onResetPassword, servers }) => {
    const [formData, setFormData] = useState({
        nome: user.nome || '',
        cognome: user.cognome || '',
        username: user.username || '',
        email: user.email || ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedServer, setSelectedServer] = useState(null);

    const userServers = servers.filter(server => server.proprietario_email === user.email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onUpdate(user.id, formData);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Sei sicuro di voler eliminare questo utente? Verranno eliminati anche tutti i suoi server. Questa operazione non può essere annullata.')) {
            setIsLoading(true);
            try {
                await onDelete(user.id);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleResetPassword = async () => {
        if (window.confirm('Sei sicuro di voler inviare il reset password a questo utente?')) {
            setIsLoading(true);
            try {
                await onResetPassword(user.id);
                alert('Email di reset password inviata con successo!');
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (selectedServer) {
        return (
            <ServerManagement
                server={selectedServer}
                onBack={() => setSelectedServer(null)}
                onUpdate={(id, data) => {
                    // Implementa l'aggiornamento del server
                    console.log('Aggiorna server:', id, data);
                }}
                onDelete={(id) => {
                    // Implementa l'eliminazione del server
                    console.log('Elimina server:', id);
                }}
                onSuspend={(id, suspend) => {
                    // Implementa la sospensione del server
                    console.log('Sospendi server:', id, suspend);
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Torna alla Gestione Utenti
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Gestione Utente #{user.id}</h2>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleResetPassword}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                    >
                        <Mail className="h-4 w-4 mr-2" />
                        Reset Password
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina Utente
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Utente</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome
                            </label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cognome
                            </label>
                            <input
                                type="text"
                                value={formData.cognome}
                                onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={onBack}
                                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Salvando...' : 'Salva Modifiche'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Server Posseduti ({userServers.length})</h3>
                    {userServers.length === 0 ? (
                        <p className="text-gray-600">Nessun server associato a questo utente.</p>
                    ) : (
                        <div className="space-y-3">
                            {userServers.map(server => (
                                <div key={server.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{server.nome}</h4>
                                            <p className="text-sm text-gray-600">{server.tipo}</p>
                                            <p className="text-sm text-gray-600">
                                                Scadenza: {new Date(server.data_scadenza).toLocaleDateString('it-IT')}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${server.stato === 'disponibile'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {server.stato}
                                            </span>
                                            <button
                                                onClick={() => setSelectedServer(server)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                            >
                                                Gestisci
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente per la dashboard dei server
const ServerDashboard = ({ servers, onRefresh, loading: serversLoading, onCreateServer, onManageServer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('tutti');
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' o 'management'
    const [selectedServer, setSelectedServer] = useState(null);
    const [serverData, setServerData] = useState(servers);

    // Sincronizza i dati quando i server vengono aggiornati dall'esterno
    React.useEffect(() => {
        setServerData(servers);
    }, [servers]);

    const totalServers = servers.length;
    const availableServers = servers.filter(s => s.stato === 'disponibile').length;
    const expiredServers = servers.filter(s => s.stato === 'scaduto').length;
    const serversByType = servers.reduce((acc, server) => {
        acc[server.tipo] = (acc[server.tipo] || 0) + 1;
        return acc;
    }, {});

    // Calcola server in scadenza (prossimi 30 giorni)
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const soonExpiring = servers.filter(s => {
        const expiryDate = new Date(s.data_scadenza);
        return expiryDate > now && expiryDate <= thirtyDaysFromNow && s.stato === 'disponibile';
    }).length;

    // Filtra i server
    const filteredServers = servers.filter(server => {
        const matchesSearch = server.nome.toLowerCase().includes(searchTerm.toLowerCase()) || server.proprietario_email.toLowerCase().includes(searchTerm.toLowerCase());

        if (statusFilter === 'tutti') return matchesSearch;
        if (statusFilter === 'disponibili') return matchesSearch && server.stato === 'disponibile';
        if (statusFilter === 'scaduti') return matchesSearch && server.stato === 'scaduto';
        if (statusFilter === 'in_scadenza') {
            const expiryDate = new Date(server.data_scadenza);
            return matchesSearch && expiryDate > now && expiryDate <= thirtyDaysFromNow && server.stato === 'disponibile';
        }
        return matchesSearch;
    }).sort((a, b) => a.id - b.id);

    // Gestione eventi
    const handleServerClick = (server) => {
        setSelectedServer(server);
        setCurrentView('management');
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
        setSelectedServer(null);
    };

    const handleSaveServer = (updatedServer) => {
        setServerData(prevServers =>
            prevServers.map(server =>
                server.id === updatedServer.id ? updatedServer : server
            )
        );
        // Qui potresti anche fare una chiamata API per salvare nel database
        console.log('Server salvato:', updatedServer);
    };

    const handleDeleteServer = (serverId) => {
        setServerData(prevServers =>
            prevServers.filter(server => server.id !== serverId)
        );
        // Qui potresti anche fare una chiamata API per eliminare dal database
        console.log('Server eliminato:', serverId);
        handleBackToDashboard();
    };

    const handleToggleSuspend = (serverId, suspended) => {
        setServerData(prevServers =>
            prevServers.map(server =>
                server.id === serverId ? { ...server, sospeso: suspended } : server
            )
        );
        // Qui potresti anche fare una chiamata API per aggiornare lo stato
        console.log('Server sospeso/riattivato:', serverId, suspended);
    };

    // Se siamo nella vista di gestione, mostra la pagina di gestione
    if (currentView === 'management') {
        return (
            <ServerManagementPage
                server={selectedServer}
                onBack={handleBackToDashboard}
                onSave={handleSaveServer}
                onDelete={handleDeleteServer}
                onToggleSuspend={handleToggleSuspend}
            />
        );
    }

    if (serversLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Caricamento server...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con bottoni crea e aggiorna */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Server</h2>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onCreateServer}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                        Crea Server
                    </button>
                    <button
                        onClick={onRefresh}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        Aggiorna
                    </button>
                </div>
            </div>

            {/* Statistiche */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Server Totali</p>
                            <p className="text-3xl font-bold text-gray-900">{totalServers}</p>
                        </div>
                        <Server className="h-12 w-12 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Disponibili</p>
                            <p className="text-3xl font-bold text-gray-900">{availableServers}</p>
                        </div>
                        <Activity className="h-12 w-12 text-green-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Scaduti</p>
                            <p className="text-3xl font-bold text-gray-900">{expiredServers}</p>
                        </div>
                        <Calendar className="h-12 w-12 text-red-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">In Scadenza</p>
                            <p className="text-sm text-gray-500">(30 giorni)</p>
                            <p className="text-3xl font-bold text-gray-900">{soonExpiring}</p>
                        </div>
                        <Calendar className="h-12 w-12 text-yellow-500" />
                    </div>
                </div>
            </div>

            {/* Server per tipo */}
            {Object.keys(serversByType).length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Server per Categoria</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(serversByType).map(([tipo, count]) => (
                            <div key={tipo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700 capitalize">{tipo}</span>
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Controlli ricerca e filtro - SEMPRE VISIBILI */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Lista Server ({filteredServers.length}
                            {filteredServers.length !== servers.length ? ` di ${servers.length}` : ''})
                        </h3>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Cerca server..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="h-11 w-64 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-gray-700"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-11 w-45 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700">
                                <option value="tutti">Tutti i server</option>
                                <option value="disponibili">Disponibili</option>
                                <option value="scaduti">Scaduti</option>
                                <option value="in_scadenza">In scadenza</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabella o messaggio "Nessun server trovato" */}
                {filteredServers.length === 0 ? (
                    <div className="p-8 text-center text-gray-600">
                        Nessun server trovato{searchTerm || statusFilter !== 'tutti' ? ', prova a modificare i filtri di ricerca.' : '.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <Hash className="h-4 w-4 mr-2" />
                                            ID
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <Mail className="h-4 w-4 mr-2" />
                                            Proprietario
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Acquisto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Scadenza</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rinnovi</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredServers.map((server) => {
                                    const isExpiringSoon = () => {
                                        const expiryDate = new Date(server.data_scadenza);
                                        return expiryDate > now && expiryDate <= thirtyDaysFromNow && server.stato === 'disponibile';
                                    };

                                    return (
                                        <tr key={server.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{server.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <button onClick={() => handleServerClick(server)} className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">{server.nome}</button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">{server.tipo}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{server.proprietario_email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(server.data_acquisto).toLocaleDateString('it-IT')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className={isExpiringSoon() ? 'text-yellow-600 font-medium' : ''}>
                                                    {new Date(server.data_scadenza).toLocaleDateString('it-IT')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{server.n_rinnovi}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col space-y-1">
                                                    <span
                                                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${server.stato === 'disponibile' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        {server.stato}
                                                    </span>
                                                    {isExpiringSoon() && (
                                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            in scadenza
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {server.pterodactyl_id ? (
                                                    <a
                                                        href={`http://192.168.1.56/admin/servers/view/${server.pterodactyl_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 inline-flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                                                    >
                                                        <Server className="h-4 w-4" />
                                                        Pannello Admin
                                                    </a>
                                                ) : (
                                                    <span className="bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 opacity-50">
                                                        <Server className="h-4 w-4" />
                                                        Non collegato
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const ServerManagementPage = ({ server: initialServer, onBack, onSave, onDelete, onToggleSuspend }) => {
    const [server, setServer] = useState(initialServer || {
        id: 1,
        nome: 'Server Minecraft Pro',
        tipo: 'VPS',
        proprietario_email: 'utente@example.com',
        data_acquisto: '2024-01-15',
        data_scadenza: '2024-12-15',
        stato: 'disponibile',
        n_rinnovi: 2,
        pterodactyl_id: '123',
        sospeso: false
    });

    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleInputChange = (field, value) => {
        setServer(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave?.(server);
        setIsEditing(false);
    };

    const handleDelete = () => {
        onDelete?.(server.id);
        setShowDeleteConfirm(false);
    };

    const handleToggleSuspend = () => {
        const newSuspendedState = !server.sospeso;
        setServer(prev => ({ ...prev, sospeso: newSuspendedState }));
        onToggleSuspend?.(server.id, newSuspendedState);
    };

    const isExpiringSoon = () => {
        const expiryDate = new Date(server.data_scadenza);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate > now && expiryDate <= thirtyDaysFromNow && server.stato === 'disponibile';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-[80rem] mx-auto px-6 sm:px-8 lg:px-0">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Torna alla lista server
                    </button>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Server className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Gestione Server</h1>
                                <p className="text-gray-600">ID: {server.id}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Settings className="h-4 w-4" />
                                    Modifica
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        Salva
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Annulla
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Stato Server</p>
                                <div className="flex items-center mt-2">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${server.stato === 'disponibile' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {server.stato}
                                    </span>
                                    {isExpiringSoon() && (
                                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                            In scadenza
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Controllo Server</p>
                                <div className="mt-2">
                                    <button
                                        onClick={handleToggleSuspend}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${server.sospeso
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                                            }`}
                                    >
                                        <Power className="h-4 w-4" />
                                        {server.sospeso ? 'Riattiva' : 'Sospendi'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Rinnovi</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{server.n_rinnovi}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Informazioni Server</h2>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nome Server */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nome Server</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={server.nome}
                                        onChange={(e) => handleInputChange('nome', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-700 "
                                    />
                                ) : (
                                    <p className="text-gray-900 py-2">{server.nome}</p>
                                )}
                            </div>

                            {/* Tipo Server */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo Server</label>
                                {isEditing ? (
                                    <select
                                        value={server.tipo}
                                        onChange={(e) => handleInputChange('tipo', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-700"
                                    >
                                        <option value="VPS">Base</option>
                                        <option value="Dedicato">Medio</option>
                                        <option value="Condiviso">Pro</option>
                                    </select>
                                ) : (
                                    <p className="text-gray-900 py-2">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                            {server.tipo}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {/* Email Proprietario */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Mail className="h-4 w-4 inline mr-1" />
                                    Email Proprietario
                                </label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={server.proprietario_email}
                                        onChange={(e) => handleInputChange('proprietario_email', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-700"
                                    />
                                ) : (
                                    <p className="text-gray-900 py-2">{server.proprietario_email}</p>
                                )}
                            </div>

                            {/* Stato */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
                                {isEditing ? (
                                    <select
                                        value={server.stato}
                                        onChange={(e) => handleInputChange('stato', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-700"
                                    >
                                        <option value="disponibile">Disponibile</option>
                                        <option value="scaduto">Scaduto</option>
                                        <option value="sospeso">Sospeso</option>
                                    </select>
                                ) : (
                                    <p className="text-gray-900 py-2">{server.stato}</p>
                                )}
                            </div>

                            {/* Data Acquisto */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    Data Acquisto
                                </label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={server.data_acquisto}
                                        onChange={(e) => handleInputChange('data_acquisto', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-700"
                                    />
                                ) : (
                                    <p className="text-gray-900 py-2">
                                        {new Date(server.data_acquisto).toLocaleDateString('it-IT')}
                                    </p>
                                )}
                            </div>

                            {/* Data Scadenza */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="h-4 w-4 inline mr-1" />
                                    Data Scadenza
                                </label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={server.data_scadenza}
                                        onChange={(e) => handleInputChange('data_scadenza', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-gray-700"
                                    />
                                ) : (
                                    <p className={`text-gray-900 py-2 ${isExpiringSoon() ? 'text-yellow-600 font-medium' : ''}`}>
                                        {new Date(server.data_scadenza).toLocaleDateString('it-IT')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Pericolose</h3>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Elimina Server</p>
                                <p className="text-sm text-red-600">Questa azione è irreversibile</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Elimina
                        </button>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <div className="flex items-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">Conferma Eliminazione</h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Sei sicuro di voler eliminare il server "{server.nome}"? Questa azione non può essere annullata.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Elimina
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente per la dashboard degli utenti
const UserDashboard = ({ users, servers, onRefresh, loading: usersLoading, onCreateUser, onManageUser }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const totalUsers = users.length;
    const usersWithServers = users.filter(u => servers.some(s => s.proprietario_email === u.email)).length;
    const usersWithoutServers = totalUsers - usersWithServers;

    // Filtra gli utenti
    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        return (
            user.nome.toLowerCase().includes(searchLower) ||
            user.cognome.toLowerCase().includes(searchLower) ||
            user.username.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
    });

    if (usersLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Caricamento utenti...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Gestione Utenti</h2>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onCreateUser}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Crea Utente
                    </button>
                    <button
                        onClick={onRefresh}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        Aggiorna
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
                            <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
                        </div>
                        <Users className="h-12 w-12 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Con Server</p>
                            <p className="text-3xl font-bold text-gray-900">{usersWithServers}</p>
                        </div>
                        <User className="h-12 w-12 text-green-500" />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Senza Server</p>
                            <p className="text-3xl font-bold text-gray-900">{usersWithoutServers}</p>
                        </div>
                        <User className="h-12 w-12 text-yellow-500" />
                    </div>
                </div>
            </div>

            {filteredUsers.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'Nessun utente trovato' : 'Nessun utente trovato'}
                    </h3>
                    <p className="text-gray-600">
                        {searchTerm ? 'Prova a modificare i filtri di ricerca.' : 'Non ci sono utenti registrati nel sistema.'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Lista Utenti ({filteredUsers.length}{filteredUsers.length !== users.length ? ` di ${users.length}` : ''})
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Cerca utenti..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <Hash className="h-4 w-4 mr-2" />
                                            ID
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Nome
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cognome
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <Mail className="h-4 w-4 mr-2" />
                                            Email
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Server
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Azioni
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => {
                                    const userServerCount = servers.filter(s => s.proprietario_email === user.email).length;

                                    return (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {user.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.nome}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.cognome}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.username}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {userServerCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => onManageUser(user)}
                                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Gestisci
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente principale
const AdminPanel = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Funzione per caricare i server dal database
    const loadServers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('http://localhost:3001/api/admin/servers', {
                method: 'GET',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setServers(data.servers || []);
            } else if (response.status === 401) {
                // Token scaduto o non valido
                localStorage.removeItem('adminToken');
                setUser(null);
                setError('Sessione scaduta. Effettua nuovamente il login.');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Errore nel caricamento dei server');
            }
        } catch (err) {
            console.error('Errore nel caricamento dei server:', err);
            setError('Errore di connessione al server');
        } finally {
            setLoading(false);
        }
    };

    // Verifica se l'utente è già loggato all'avvio
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            // Verifica la validità del token
            fetch('http://localhost:3001/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
                .then(response => response.json())
                .then(data => {
                    if (data.valid && data.user && data.user.ruolo === 'admin') {
                        setUser(data.user);
                    } else {
                        localStorage.removeItem('adminToken');
                    }
                })
                .catch(() => {
                    localStorage.removeItem('adminToken');
                });
        }
    }, []);

    // Carica i server quando l'utente è loggato
    useEffect(() => {
        if (user) {
            loadServers();
        }
    }, [user]);

    const handleLogin = (userData) => {
        setUser(userData);
        setError('');
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setUser(null);
        setServers([]);
        setActiveTab('dashboard');
        setError('');
    };

    const handleRefreshServers = () => {
        loadServers();
    };

    const handleCreateServer = () => {
        alert('Funzionalità di creazione server in sviluppo');
    };

    if (!user) {
        return <LoginForm onLogin={handleLogin} />;
    }

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
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-[85rem] mx-auto px-6 sm:px-8 lg:px-0">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === 'dashboard'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <Database className="h-4 w-4 mr-2" />
                                Dashboard Server
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === 'users'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                Gestione Utenti
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-[85rem] mx-auto py-6 sm:px-12 lg:px-0">
                <div className="px-4 py-6 sm:px-0">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Calendar className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'dashboard' && (
                        <ServerDashboard
                            servers={servers}
                            onRefresh={handleRefreshServers}
                            onCreateServer={handleCreateServer}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'users' && (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestione Utenti</h2>
                            <p className="text-gray-600">
                                Funzionalità in sviluppo. Qui sarà possibile gestire gli utenti del sistema.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;