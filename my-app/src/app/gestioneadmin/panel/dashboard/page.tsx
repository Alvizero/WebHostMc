
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Server, Calendar, Mail, Hash, Activity, Search, Plus, StopCircle } from 'lucide-react';
import CreateServerModal from '../../components/CreateServerModal';
import ServerManagmentModal from '../../components/ServerManagmentModal';

const DashboardPanel = () => {
    // Stati principali
    const [user, setUser] = useState(null);
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    // Stati per la dashboard
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('tutti');
    const [typeFilter, setTypeFilter] = useState('tutti');
    const [currentView, setCurrentView] = useState('dashboard');
    const [selectedServer, setSelectedServer] = useState(null);
    const [serverTypes, setServerTypes] = useState([]);

    // Carica i server
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

    // Carica i tipi di server dal database
    const fetchServerTypes = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/tipi-server');
            if (response.ok) {
                const types = await response.json();
                setServerTypes(types);
            }
        } catch (error) {
            console.error('Errore nel caricamento dei tipi server:', error);
        }
    };

    // Effetti
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.replace('/gestioneadmin/login');
            return;
        }

        // Verifica token con API
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
            fetchServerTypes();
        }
    }, [user]);

    // Calcoli statistiche
    const totalServers = servers.length;
    const availableServers = servers.filter(s => s.stato === 'disponibile').length;
    const expiredServers = servers.filter(s => s.stato === 'scaduto').length;
    const suspendedServers = servers.filter(s => s.stato === 'sospeso').length;
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

    // Gestori per i click sui box delle statistiche
    const handleStatBoxClick = (filterType) => {
        setSearchTerm('');
        setTypeFilter('tutti');

        switch (filterType) {
            case 'tutti':
                setStatusFilter('tutti');
                break;
            case 'disponibili':
                setStatusFilter('disponibili');
                break;
            case 'scaduti':
                setStatusFilter('scaduti');
                break;
            case 'sospesi':
                setStatusFilter('sospesi');
                break;
            case 'in_scadenza':
                setStatusFilter('in_scadenza');
                break;
            default:
                setStatusFilter('tutti');
        }
    };

    // Gestori per i click sui box dei tipi di server
    const handleTypeBoxClick = (tipo) => {
        setSearchTerm('');
        setStatusFilter('tutti');
        setTypeFilter(tipo);
    };

    // Filtra i server
    const filteredServers = servers.filter(server => {
        const matchesSearch = server.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            server.proprietario_email.toLowerCase().includes(searchTerm.toLowerCase());

        // Filtro per stato
        let matchesStatus = true;
        if (statusFilter === 'disponibili') matchesStatus = server.stato === 'disponibile';
        else if (statusFilter === 'scaduti') matchesStatus = server.stato === 'scaduto';
        else if (statusFilter === 'sospesi') matchesStatus = server.stato === 'sospeso';
        else if (statusFilter === 'in_scadenza') {
            const expiryDate = new Date(server.data_scadenza);
            matchesStatus = expiryDate > now && expiryDate <= thirtyDaysFromNow && server.stato === 'disponibile';
        }

        // Filtro per tipo
        const matchesType = typeFilter === 'tutti' || server.tipo === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    }).sort((a, b) => a.id - b.id);

    // Gestione eventi
    const handleServerClick = (server) => {
        setSelectedServer(server);
        setCurrentView('management');
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
        loadServers();
        setSelectedServer(null);
    };

    const handleCreateServer = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleServerCreated = () => {
        loadServers();
        setIsModalOpen(false);
    };

    if (loading) return <div>Caricamento...</div>;
    if (!user) return null;

    return (
        <>
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800">{error}</div>
                </div>
            )}

            <div className="space-y-8">
                {/* Header con bottoni crea e aggiorna */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Dashboard Server</h2>
                        <p className="text-gray-600 mt-1">Gestisci tutti i tuoi server da qui</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleCreateServer}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center shadow-lg hover:shadow-xl"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Crea Server
                        </button>
                        <button
                            onClick={loadServers}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center shadow-lg hover:shadow-xl group"
                        >
                            <Activity className="h-5 w-5 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                            Aggiorna
                        </button>
                    </div>
                </div>

                {/* Statistiche */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div
                        onClick={() => handleStatBoxClick('tutti')}
                        className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${statusFilter === 'tutti' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Server Totali</p>
                                <p className="text-3xl font-bold text-gray-900">{totalServers}</p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-3">
                                <Server className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => handleStatBoxClick('disponibili')}
                        className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${statusFilter === 'disponibili' ? 'ring-2 ring-green-500 bg-green-50' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Disponibili</p>
                                <p className="text-3xl font-bold text-gray-900">{availableServers}</p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <Activity className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => handleStatBoxClick('in_scadenza')}
                        className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${statusFilter === 'in_scadenza' ? 'ring-2 ring-yellow-500 bg-yellow-50' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">In Scadenza</p>
                                <p className="text-xs text-gray-500">(30 giorni)</p>
                                <p className="text-3xl font-bold text-gray-900">{soonExpiring}</p>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-3">
                                <Calendar className="h-8 w-8 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => handleStatBoxClick('scaduti')}
                        className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${statusFilter === 'scaduti' ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Scaduti</p>
                                <p className="text-3xl font-bold text-gray-900">{expiredServers}</p>
                            </div>
                            <div className="bg-red-100 rounded-full p-3">
                                <Calendar className="h-8 w-8 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div
                        onClick={() => handleStatBoxClick('sospesi')}
                        className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-gray-500 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 ${statusFilter === 'sospesi' ? 'ring-2 ring-gray-500 bg-gray-50' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Sospesi</p>
                                <p className="text-3xl font-bold text-gray-900">{suspendedServers}</p>
                            </div>
                            <div className="bg-gray-100 rounded-full p-3">
                                <StopCircle className="h-8 w-8 text-gray-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Server per tipo */}
                {Object.keys(serversByType).length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Server per Tipo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(serversByType).map(([tipo, count]) => (
                                <div
                                    key={tipo}
                                    onClick={() => handleTypeBoxClick(tipo)}
                                    className={`flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl cursor-pointer transition-all duration-200 hover:from-blue-50 hover:to-blue-100 hover:shadow-md transform hover:scale-105 ${typeFilter === tipo ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                                >
                                    <span className="font-semibold text-gray-700 capitalize">{tipo}</span>
                                    <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista Server */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Lista Server ({filteredServers.length}
                                    {filteredServers.length !== servers.length ? ` di ${servers.length}` : ''})
                                </h3>
                                <p className="text-gray-600 text-sm mt-1">Gestisci e monitora tutti i tuoi server</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        placeholder="Cerca server..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-12 w-64 pl-10 pr-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 text-gray-700 transition-all duration-200 hover:border-gray-400"
                                    />
                                </div>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="h-12 w-48 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 transition-all duration-200 hover:border-gray-400"
                                >
                                    <option value="tutti">Tutti i tipi</option>
                                    {serverTypes.map(type => (
                                        <option key={type.id} value={type.nome}>
                                            {type.nome}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-12 w-48 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 transition-all duration-200 hover:border-gray-400"
                                >
                                    <option value="tutti">Tutti i server</option>
                                    <option value="disponibili">Disponibili</option>
                                    <option value="scaduti">Scaduti</option>
                                    <option value="in_scadenza">In scadenza</option>
                                    <option value="sospesi">Sospesi</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tabella o messaggio "Nessun server trovato" */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Caricamento server...</span>
                        </div>
                    ) : filteredServers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Server className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun server trovato</h3>
                            <p className="text-gray-600">
                                {searchTerm || statusFilter !== 'tutti' ? 'Prova a modificare i filtri di ricerca.' : 'Inizia creando il tuo primo server.'}
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
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nome</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <Mail className="h-4 w-4 mr-2" />
                                                Proprietario
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data Acquisto</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data Scadenza</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Rinnovi</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Stato</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredServers.map((server) => {
                                        const isExpiringSoon = () => {
                                            const expiryDate = new Date(server.data_scadenza);
                                            return expiryDate > now && expiryDate <= thirtyDaysFromNow && server.stato === 'disponibile';
                                        };

                                        return (
                                            <tr key={server.id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{server.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <button onClick={() => handleServerClick(server)} className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors duration-200">
                                                        {server.nome}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">{server.tipo}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{server.proprietario_email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className={isExpiringSoon() ? 'text-yellow-600 font-semibold' : ''}>
                                                        {server.data_acquisto
                                                            ? (() => {
                                                                const d = new Date(server.data_acquisto);
                                                                return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('it-IT');
                                                            })()
                                                            : '—'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className={isExpiringSoon() ? 'text-yellow-600 font-semibold' : ''}>
                                                        {server.data_scadenza
                                                            ? (() => {
                                                                const d = new Date(server.data_scadenza);
                                                                return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('it-IT');
                                                            })()
                                                            : '—'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">{server.n_rinnovi}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col space-y-1">
                                                        <span
                                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${server.stato === 'disponibile'
                                                                ? 'bg-green-100 text-green-800'
                                                                : server.stato === 'sospeso'
                                                                    ? 'bg-gray-100 text-gray-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                }`}
                                                        >
                                                            {server.stato}
                                                        </span>
                                                        {isExpiringSoon() && (
                                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
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
                                                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 inline-flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                                        >
                                                            <Server className="h-4 w-4" />
                                                            Gestisci
                                                        </a>
                                                    ) : (
                                                        <span className="bg-gray-400 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 opacity-50">
                                                            <Server className="h-4 w-4" />
                                                            Non disponibile
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

                {/* Modal di gestione server */}
                {currentView === 'management' && selectedServer && (
                    <div className="fixed inset-0 z-50">
                        <ServerManagmentModal
                            serverId={selectedServer.id}
                            uuidShort={selectedServer.uuidShort}
                            pterodactyl_id={selectedServer.pterodactyl_id}
                            onBack={handleBackToDashboard}
                        />
                    </div>
                )}
            </div>

            {/* Modal per creare server */}
            {isModalOpen && (
                <CreateServerModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onServerCreated={handleServerCreated}
                />
            )}
        </>
    );
};

export default DashboardPanel;