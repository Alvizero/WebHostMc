'use client'

import { useState, useEffect } from 'react';
import { Plus, Mail, Hash, Activity, Search, Users, User, Eye, ArrowLeft, Trash2, Calendar, Server } from 'lucide-react';
import ServerManagmentModal from '../../components/ServerManagmentModal';

import UserManagmentModal from '../../components/UserManagmentModal';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('tutti');

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

    // Carica utenti e server
    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('adminToken');

                const [usersRes, serversRes] = await Promise.all([
                    fetch(`${API_BASE}/api/admin/users`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE}/api/admin/servers`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        }
                    })
                ]);

                const usersData = await usersRes.json();
                const serversData = await serversRes.json();

                setUsers(usersData.users || usersData || []);
                setServers(serversData.servers || serversData || []);
            } catch (err) {
                setError('Errore nel caricamento dei dati');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Calcoli statistiche
    const totalUsers = users.length;
    const usersWithServers = users.filter(u => servers.some(s => s.proprietario_email === u.email)).length;
    const usersWithoutServers = totalUsers - usersWithServers;

    // Filtra gli utenti
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === 'con_server') {
            matchesStatus = servers.some(s => s.proprietario_email === user.email);
        } else if (statusFilter === 'senza_server') {
            matchesStatus = !servers.some(s => s.proprietario_email === user.email);
        }

        return matchesSearch && matchesStatus;
    }).sort((a, b) => a.id - b.id);

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleCreateUser = () => {
        alert('Funzionalità da implementare');
    };

    const handleManageUser = (user) => {
        setSelectedUser(user);
    };

    const handleBack = () => {
        setSelectedUser(null);
    };

    const handleUpdateUser = async (userId, userData) => {
        console.log('Aggiorna utente:', userId, userData);
    };

    const handleDeleteUser = async (userId) => {
        console.log('Elimina utente:', userId);
    };

    const handleResetPassword = async (userId) => {
        console.log('Reset password:', userId);
    };

    const handleStatBoxClick = (filterType) => {
        setSearchTerm('');
        setStatusFilter(filterType);
    };

    return (
        <>

            {selectedUser && (
                <div className="fixed inset-0 z-50">
                    <UserManagmentModal
                        userId={selectedUser.id}
                        onBack={handleBack}
                    />
                </div>
            )}


            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800">{error}</div>
                </div>
            )}

            <div className="space-y-8">
                {/* Header con bottoni crea e aggiorna */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Dashboard Utenti</h2>
                        <p className="text-gray-600 mt-1">Gestisci tutti i tuoi utenti da qui</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleCreateUser}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center shadow-lg hover:shadow-xl"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Crea Utente
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center shadow-lg hover:shadow-xl group"
                        >
                            <Activity className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                            Aggiorna
                        </button>
                    </div>
                </div>

                {/* Statistiche */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                        onClick={() => handleStatBoxClick('tutti')}
                        className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${statusFilter === 'tutti' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Utenti Totali</p>
                                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-3">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => handleStatBoxClick('con_server')}
                        className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${statusFilter === 'con_server' ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Con Server</p>
                                <p className="text-3xl font-bold text-gray-900">{usersWithServers}</p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <User className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => handleStatBoxClick('senza_server')}
                        className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${statusFilter === 'senza_server' ? 'ring-2 ring-yellow-500 bg-yellow-50' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Senza Server</p>
                                <p className="text-3xl font-bold text-gray-900">{usersWithoutServers}</p>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-3">
                                <User className="h-8 w-8 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista Utenti */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Lista Utenti ({filteredUsers.length}
                                    {filteredUsers.length !== users.length ? ` di ${users.length}` : ''})
                                </h3>
                                <p className="text-gray-600 text-sm mt-1">Gestisci e monitora tutti gli utenti registrati</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        placeholder="Cerca utenti..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-12 w-64 pl-10 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-gray-700 transition-all duration-200 hover:border-gray-400"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-12 w-48 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 transition-all duration-200 hover:border-gray-400"
                                >
                                    <option value="tutti">Tutti gli utenti</option>
                                    <option value="con_server">Con Server</option>
                                    <option value="senza_server">Senza Server</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tabella o messaggio "Nessun utente trovato" */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Caricamento utenti...</span>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun utente trovato</h3>
                            <p className="text-gray-600">
                                {searchTerm || statusFilter !== 'tutti' ? 'Prova a modificare i filtri di ricerca.' : 'Non ci sono utenti registrati nel sistema.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <Hash className="h-4 w-4 mr-2" />
                                                ID
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <User className="h-4 w-4 mr-2" />
                                                Username
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nome</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Cognome</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <Mail className="h-4 w-4 mr-2" />
                                                Email
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Data Registrazione
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <Server className="h-4 w-4 mr-2" />
                                                Server
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.map((user) => {
                                        const userServerCount = servers.filter(s => s.proprietario_email === user.email).length;

                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{user.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <button
                                                        onClick={() => handleManageUser(user)}
                                                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors duration-200"
                                                    >
                                                        {user.username}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.nome}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.cognome}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {user.data_registrazione
                                                        ? (() => {
                                                            const d = new Date(user.data_registrazione);
                                                            return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('it-IT');
                                                        })()
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {userServerCount > 0 ? (
                                                        <button
                                                            onClick={() => handleManageUserServers(user)}
                                                            className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm hover:from-blue-200 hover:to-blue-300 transition-all duration-200 cursor-pointer"
                                                        >
                                                            {userServerCount}
                                                        </button>
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-semibold">
                                                            0
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handleManageUser(user)}
                                                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                                    >
                                                        <Server className="h-4 w-4" />
                                                        Gestisci Server
                                                    </button>
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
        </>
    );
}