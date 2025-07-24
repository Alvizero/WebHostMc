'use client';

import React, { useState, useEffect } from 'react';
import { X, Server, Shield, Boxes, Calendar, Mail, Save, AlertTriangle, Loader2, Check, Package } from 'lucide-react';

const CreateServerModal = ({ isOpen, onClose, onServerCreated }) => {
    const [formData, setFormData] = useState({
        nome: '',
        tipo: '',
        versione_egg: '',
        versione_server: '',
        proprietario_email: '',
        data_scadenza: '',
        n_backup: Number(process.env.NEXT_PUBLIC_PTERODACTYL_DEFAULT_BACKUPS) || 3
    });

    const [versioniEgg, setVersioniEgg] = useState([]);
    const [versioniServer, setVersioniServer] = useState([]);
    const [filteredVersioniServer, setFilteredVersioniServer] = useState([]);
    const [tipiOptions, setTipiOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingTipi, setLoadingTipi] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [tipiError, setTipiError] = useState('');
    const [success, setSuccess] = useState('');
    const [versionePersonalizzata, setVersionePersonalizzata] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [allocationInfo, setAllocationInfo] = useState(null);
    const [dockerImageInfo, setDockerImageInfo] = useState(null);
    const [loadingPterodactylInfo, setLoadingPterodactylInfo] = useState(false);
    const [dockerImagesMap, setDockerImagesMap] = useState({});


    // Carica dati al mount
    useEffect(() => {
        if (isOpen) {
            fetchVersioniEgg();
            fetchVersioniServer();
            fetchTipiServer();
            fetchPterodactylInfo();
        }
    }, [isOpen]);

    // Filtra versioni server in base al tipo egg selezionato
    useEffect(() => {
        if (formData.versione_egg && versioniServer.length > 0) {
            const eggSelected = versioniEgg.find(egg => egg.id === parseInt(formData.versione_egg));
            if (eggSelected) {
                // Modifica per supportare il nuovo formato del backend
                const filtered = versioniServer.filter(version =>
                    version.tipo_nome.toLowerCase() === eggSelected.nome.toLowerCase()
                );
                setFilteredVersioniServer(filtered);
                // Reset versione server se non più valida
                if (formData.versione_server && !filtered.find(v => v.versione === formData.versione_server)) {
                    setFormData(prev => ({ ...prev, versione_server: '' }));
                }
            }
        } else {
            setFilteredVersioniServer([]);
        }
    }, [formData.versione_egg, versioniEgg, versioniServer]);

    const fetchTipiServer = async () => {
        try {
            setLoadingTipi(true);
            const response = await fetch("http://localhost:3001/api/tipi-server");
            if (!response.ok) {
                throw new Error("Errore nel recupero dei tipi di server");
            }
            const data = await response.json();
            const tipi = data.map((item) => item.nome);
            setTipiOptions(tipi);
            setTipiError('');
        } catch (error) {
            console.error("Errore:", error);
            setTipiError("Errore durante il caricamento dei tipi server.");
        } finally {
            setLoadingTipi(false);
        }
    };

    const fetchVersioniEgg = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:3001/api/versioni-server-egg');
            if (!response.ok) throw new Error('Errore nel caricamento versioni egg');
            const data = await response.json();
            setVersioniEgg(data);
        } catch (err) {
            setError('Errore nel caricamento delle versioni egg');
            console.error('Errore versioni egg:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchVersioniServer = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/versioni-server');
            if (!response.ok) throw new Error('Errore nel caricamento versioni server');
            const data = await response.json();
            setVersioniServer(data);
        } catch (err) {
            setError('Errore nel caricamento delle versioni server');
            console.error('Errore versioni server:', err);
        }
    };

    const fetchPterodactylInfo = async () => {
        try {
            setLoadingPterodactylInfo(true);

            // Fetch allocation info
            const allocationResponse = await fetch('http://localhost:3001/api/pterodactyl/next-allocation');
            if (allocationResponse.ok) {
                const allocationData = await allocationResponse.json();
                setAllocationInfo(allocationData);
            }

            // Fetch all docker images for each egg
            const dockerResponse = await fetch('http://localhost:3001/api/pterodactyl/latest-docker-images');
            if (dockerResponse.ok) {
                const dockerData = await dockerResponse.json(); // array: [{ nome, docker_image }]
                const map = {};
                dockerData.forEach(item => {
                    map[item.nome.toLowerCase()] = item.docker_image;
                });
                setDockerImagesMap(map);
            }

        } catch (err) {
            console.error('Errore nel caricamento info Pterodactyl:', err);
        } finally {
            setLoadingPterodactylInfo(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const updatedForm = {
                ...prev,
                [field]: field === 'n_backup' ? parseInt(value, 10) || 0 : value
            };

            // Se cambia egg, resetta la versione
            if (field === 'versione_egg') {
                updatedForm.versione_server = '';
            }

            return updatedForm;
        });

        // Reset tipo quando cambia versione egg
        if (field === 'versione_egg') {
            setFormData(prev => ({
                ...prev,
                versione_server: ''
            }));
        }
    };

    const validateForm = async () => {
        if (!formData.nome.trim()) {
            throw new Error('Nome server è obbligatorio');
        }
        if (!formData.proprietario_email.trim()) {
            throw new Error('Email proprietario è obbligatoria');
        }

        // Validazione formato email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.proprietario_email)) {
            throw new Error('Email non valida');
        }

        // Verifica se l'email esiste nel database
        const emailResponse = await fetch("http://localhost:3001/api/check-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.proprietario_email.trim() }),
        });

        if (!emailResponse.ok) {
            const data = await emailResponse.json();
            if (emailResponse.status === 404) {
                throw new Error("Nessun utente trovato con questa email. Verifca la email/registra l'utente");
            } else {
                throw new Error(data.error || "Errore nella verifica dell'email.");
            }
        }

        if (!formData.tipo) {
            throw new Error('Tipo server è obbligatorio');
        }
        if (!formData.versione_egg) {
            throw new Error('Tipo Egg è obbligatorio');
        }
        if (!formData.versione_server) {
            throw new Error('Versione Server è obbligatoria');
        }

        const today = new Date();
        const scadenza = new Date(formData.data_scadenza);
        if (scadenza <= today) {
            throw new Error('La data di scadenza deve essere futura');
        }
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');

        try {
            await validateForm();
            setShowConfirmModal(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleConfirmCreation = async () => {
        setIsSaving(true);
        setShowConfirmModal(false);

        try {
            const serverData = {
                nome: formData.nome.trim(),
                tipo: formData.tipo,
                versione_egg: formData.versione_egg,
                versione_server: formData.versione_server,
                proprietario_email: formData.proprietario_email.trim(),
                data_acquisto: new Date().toISOString().split('T')[0],
                data_scadenza: formData.data_scadenza,
                n_rinnovi: 0,
                stato: 'disponibile',
                n_backup: formData.n_backup,
                // Aggiungi sempre la versione server dal form
                // Aggiungi info da Pterodactyl se disponibili
                ...(allocationInfo && { allocation_id: allocationInfo.id }),
                ...(dockerImagesMap && formData.versione_egg && (() => {
                    const selectedEgg = versioniEgg.find(egg => egg.id === parseInt(formData.versione_egg));
                    if (selectedEgg) {
                        const image = dockerImagesMap[selectedEgg.nome.toLowerCase()];
                        if (image) {
                            return { docker_image: image };
                        }
                    }
                    return {};
                })())
            };

            console.log("🎯 formData.versione_server:", formData.versione_server);
            console.log("Server data da inviare:", serverData);

            const response = await fetch('http://localhost:3001/api/servers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(serverData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nella creazione del server');
            }

            const newServer = await response.json();
            setSuccess('Server creato con successo!');

            // Chiama callback per aggiornare la lista
            if (onServerCreated) {
                onServerCreated(newServer);
            }

            // Chiudi modal dopo 1.5 secondi
            setTimeout(() => {
                onClose();
                resetForm();
            }, 1500);

            alert("Server creato con successo!");

        } catch (err) {
            setError(err.message);
            console.error('Errore creazione server:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nome: '',
            tipo: '',
            versione_egg: '',
            versione_server: '',
            proprietario_email: '',
            data_scadenza: ''
        });
        setError('');
        setSuccess('');
        setTipiError('');
        setVersionePersonalizzata(false);
        setShowConfirmModal(false);
        setAllocationInfo(null);
        setDockerImageInfo(null);
    };

    const handleClose = () => {
        if (!isSaving) {
            onClose();
            resetForm();
        }
    };

    const toggleVersionePersonalizzata = () => {
        setVersionePersonalizzata(!versionePersonalizzata);
        if (!versionePersonalizzata) {
            handleInputChange('versione_server', '');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={handleClose}>
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
                                        Crea Nuovo Server
                                    </h2>
                                    <p className="text-slate-600 text-sm mt-1 font-medium">Configura il tuo server con tutti i dettagli necessari</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={isSaving}
                                className="group p-3 hover:bg-white/60 rounded-2xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm"
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

                            <div className="space-y-8">
                                {/* Sezione principale */}
                                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/50">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                        Informazioni Base
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Nome Server */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Server className="h-4 w-4 mr-2 text-blue-600" />
                                                Nome Server
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.nome}
                                                onChange={(e) => handleInputChange('nome', e.target.value)}
                                                className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                placeholder="Il mio server Minecraft..."
                                                required
                                            />
                                        </div>

                                        {/* Email Proprietario */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                                Email Proprietario
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.proprietario_email}
                                                onChange={(e) => handleInputChange('proprietario_email', e.target.value)}
                                                className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                placeholder="mario@example.com"
                                                required
                                            />
                                        </div>

                                        {/* Data Scadenza */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                                                Data Scadenza
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.data_scadenza}
                                                onChange={(e) => handleInputChange('data_scadenza', e.target.value)}
                                                className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>

                                        {/* Numero Backup */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Shield className="h-4 w-4 mr-2" />
                                                Numero Backup
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.n_backup}
                                                onChange={(e) => handleInputChange('n_backup', e.target.value)}
                                                className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                                placeholder="3, 4, 5, 6..."
                                                min="1"
                                                max="10"
                                                defaultValue={3}
                                                required
                                            />
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
                                            {loadingTipi ? (
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
                                                    value={formData.tipo}
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
                                            )}
                                        </div>

                                        {/* Tipo Egg */}
                                        <div className="space-y-3">
                                            <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                <Boxes className="h-4 w-4 mr-2" />
                                                Tipo Egg
                                            </label>
                                            <select
                                                value={formData.versione_egg}
                                                onChange={(e) => handleInputChange('versione_egg', e.target.value)}
                                                className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300"
                                            >
                                                <option value="">Seleziona versione egg...</option>
                                                {versioniEgg.map((egg) => (
                                                    <option key={egg.id} value={egg.id}>
                                                        {egg.icona} {egg.nome} - {egg.descrizione}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Versione Egg - Full width */}
                                        <div className="space-y-3 md:col-span-2">
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="block text-sm font-semibold text-slate-700 flex items-center">
                                                    <Package className="h-4 w-4 mr-2" />
                                                    Versione Egg
                                                </label>
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-sm text-slate-600 font-medium">Versione personalizzata</span>
                                                    <button
                                                        type="button"
                                                        onClick={toggleVersionePersonalizzata}
                                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${versionePersonalizzata ? 'bg-blue-600 shadow-lg' : 'bg-gray-300'}`}
                                                    >
                                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${versionePersonalizzata ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            </div>

                                            {versionePersonalizzata ? (
                                                formData.versione_egg ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={formData.versione_server}
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
                                                    value={formData.versione_server}
                                                    onChange={(e) => handleInputChange('versione_server', e.target.value)}
                                                    className="w-full h-12 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                    disabled={!formData.versione_egg || filteredVersioniServer.length === 0}
                                                >
                                                    <option value="">
                                                        {!formData.versione_egg
                                                            ? 'Seleziona prima il tipo di egg...'
                                                            : 'Seleziona versione server...'}
                                                    </option>
                                                    {filteredVersioniServer.map((version) => {
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
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Info Box migliorata */}
                                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 p-3 bg-blue-100 rounded-xl mr-4">
                                            <Server className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-blue-800 mb-3">Informazioni Automatiche</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div className="space-y-2">
                                                    <div className="flex items-center text-blue-700">
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        <span className="font-medium">Data acquisto:</span>
                                                        <span className="ml-2">{new Date().toLocaleDateString('it-IT')}</span>
                                                    </div>
                                                    <div className="flex items-center text-blue-700">
                                                        <Server className="h-4 w-4 mr-2" />
                                                        <span className="font-medium">Nodo:</span>
                                                        <span className="ml-2">{allocationInfo ? allocationInfo.node : 'Caricamento...'}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center text-blue-700">
                                                        <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                                                        <span className="font-medium">Allocazione:</span>
                                                        <span className="ml-2 font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                                                            {allocationInfo ? `${allocationInfo.ip}:${allocationInfo.port}` : 'Caricamento...'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-blue-700">
                                                        <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                                                        <span className="font-medium">Docker Image:</span>
                                                        <span className="ml-2 font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                                                            {loadingPterodactylInfo ? 'Caricamento...' : formData.versione_egg ? (() => {
                                                                const selectedEgg = versioniEgg.find(e => e.id === parseInt(formData.versione_egg));
                                                                const image = selectedEgg ? dockerImagesMap[selectedEgg.nome.toLowerCase()] : null;
                                                                const tag = image?.split(':')[1];
                                                                return tag || 'Non disponibile';
                                                            })() : 'Seleziona un egg'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer con bottoni migliorati */}
                    <div className="shrink-0 bg-slate-50/50 p-6 border-t border-slate-200/50 rounded-b-3xl">
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSaving || isLoading}
                                className="px-8 py-3 text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"

                            >
                                Annulla
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving || isLoading}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Preparando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        <span>Crea Server</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal di Conferma */}
            {showConfirmModal && (
                <ConfirmModal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={handleConfirmCreation}
                    isLoading={isSaving}
                    serverData={formData}
                />
            )}
        </>
    );
};

// Componente modal di conferma
const ConfirmModal = ({ isOpen, onClose, onConfirm, isLoading, serverData }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-slate-200/50">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-t-3xl"></div>
                    <div className="relative flex items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-50"></div>
                            <div className="relative p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                                <AlertTriangle className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                Conferma Creazione Server
                            </h3>
                            <p className="text-slate-600 text-sm mt-1">Verifica i dettagli prima di procedere</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-slate-700 text-base mb-4">
                            Sei sicuro di voler creare il server <span className="font-semibold text-blue-600">"{serverData.nome}"</span>?
                        </p>

                        {/* Dettagli server */}
                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/50">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                Riepilogo Configurazione
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Nome Server:</span>
                                    <span className="font-medium text-slate-800">{serverData.nome}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Email Proprietario:</span>
                                    <span className="font-medium text-slate-800">{serverData.proprietario_email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Tipo Server:</span>
                                    <span className="font-medium text-slate-800">{serverData.tipo}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Tipo Egg:</span>
                                    <span className="font-medium text-slate-800">{serverData.versione_egg}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Versione Egg:</span>
                                    <span className="font-medium text-slate-800">{serverData.versione_server}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Numero Backup:</span>
                                    <span className="font-medium text-slate-800">{serverData.n_backup || 3}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Data di Scadenza:</span>
                                    <span className="font-medium text-slate-800">
                                        {serverData.data_scadenza ? new Date(serverData.data_scadenza).toLocaleDateString('it-IT') : 'Non impostata'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 p-2 bg-amber-100 rounded-lg mr-3">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-amber-800 mb-1">Attenzione</p>
                                <p className="text-amber-700">Verifica che tutti i dati siano corretti prima di procedere con la creazione.</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottoni */}
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-6 py-3 text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Creando...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-5 w-5" />
                                    <span>Conferma Creazione</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateServerModal;