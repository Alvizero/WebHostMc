'use client';

import React, { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { X, User, Server, Shield, Boxes, Eye, Database, Calendar, Mail, Hash, Activity, Search, ArrowLeft, Settings, RotateCcw, Trash2, Save, AlertTriangle, Plus, Loader2, MessageCircle, Edit, StopCircle, Check, Package, Clock } from 'lucide-react';
import CreateServerModal from '../components/CreateServerModal';
import ServerManagmentModal from '../components/ServerManagmentModal';
import ServerDashboard from './dashboard/page';


// Componente principale
const AdminPanel = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

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

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.replace('/gestioneadmin/login');
            return;
        }

        // Opzionale: verifica token con API
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
        router.push('/gestioneadmin/login'); // <-- redirect alla pagina login
    };

    const handleRefreshServers = () => {
        loadServers();
    };

    const handleCreateServer = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleServerCreated = () => {
        handleRefreshServers();
        setIsModalOpen(false);
    };

    if (loading) return <div>Caricamento...</div>;
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
                            loading={loading}
                            onRefresh={handleRefreshServers}
                            onCreateServer={handleCreateServer}
                        />
                    )}

                    {isModalOpen && (
                        <CreateServerModal
                            isOpen={isModalOpen}
                            onClose={handleCloseModal}
                            onServerCreated={handleServerCreated}
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
            <ServerManagmentModal
                serverId={server.id}
                onBack={() => navigate('/admin/servers')}
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

export default AdminPanel;