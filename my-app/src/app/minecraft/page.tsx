'use client';

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Server, Clock, User, Settings, Check, Zap, Shield, Cpu, Package, Rocket, Eye, EyeOff } from "lucide-react";

type ServerType = {
  id: number;
  nome: string;
  cpu_cores: number;
  ram_gb: number;
  storage_gb: number;
  prezzo_mensile: number | string;
  popular: number; // 1 o 0
  icon: string;
};

const iconMap: Record<string, JSX.Element> = {
  server: <Server className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  shield: <Shield className="w-6 h-6" />,
  cpu: <Cpu className="w-6 h-6" />,
  package: <Package className="w-6 h-6" />,
  rocket: <Rocket className="w-6 h-6" />,
};

type VersioneServerEgg = {
  id: number;
  nome: string;
  descrizione: string;
  icona: string;
};

type VersioneServerDisponibile = {
  id: number;
  tipo_id: number;
  versione: string;
  ultima_versione: number;
  popolare: number;
  tipo_nome: string; // <- nuovo campo
};

export default function Page() {
  const [step, setStep] = useState(1);
  const [isClient, setIsClient] = useState(false);

  const [isNewUser, setIsNewUser] = useState(true);
  const [userData, setUserData] = useState({ name: "", username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [serverConfig, setServerConfig] = useState({ name: "", version: "" });
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [duration, setDuration] = useState(1);

  const [selectedEgg, setSelectedEgg] = useState("");
  const [customVersion, setCustomVersion] = useState("");
  const [useCustomVersion, setUseCustomVersion] = useState(false);
  const [showOnlyLatest, setShowOnlyLatest] = useState(false);

  const [serverOptions, setServerOptions] = useState<ServerType[]>([]);
  const [loading, setLoading] = useState(true);

  const [durateNoleggio, setDurateNoleggio] = useState([]);
  const [loadingDurate, setLoadingDurate] = useState(true);

  const [eggTypes, setEggTypes] = useState<VersioneServerEgg[]>([]);
  const [loadingEggs, setLoadingEggs] = useState(true);

  const [versions, setVersions] = useState<VersioneServerDisponibile[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);


  useEffect(() => {
    fetch("http://localhost:3001/api/tipi-server")
      .then((res) => res.json())
      .then((data) => {
        setServerOptions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Errore fetch:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/api/durate-noleggio")
      .then(res => res.json())
      .then(data => {
        setDurateNoleggio(data);
        setLoadingDurate(false);
      })
      .catch(err => {
        console.error("Errore fetch durate:", err);
        setLoadingDurate(false);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/api/versioni-server-egg")
      .then((res) => res.json())
      .then((data) => {
        setEggTypes(data);
        setLoadingEggs(false);
      })
      .catch((err) => {
        console.error("Errore fetch versioni-server-egg:", err);
        setLoadingEggs(false);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/api/versioni-server")
      .then((res) => res.json())
      .then((data) => {
        setVersions(data);
        setLoadingVersions(false);
      })
      .catch((err) => {
        console.error("Errore fetch versioni-server:", err);
        setLoadingVersions(false);
      });
  }, []);


  if (loading) return <p>Caricamento...</p>;
  if (!serverOptions.length) return <p>Nessun server trovato</p>;
  if (!isClient || loadingDurate) return <p>Caricamento mesi...</p>;
  if (!eggTypes || loadingEggs) return <p>Caricamento egg...</p>;
  if (!versions || loadingVersions) return <p>Caricamento versioni...</p>;


  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const nextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handleNextStep = async () => {
    if (step === 2 && !validateForm()) return;

    if (step === 2) {
      try {
        if (isNewUser) {
          const res = await fetch("http://localhost:3001/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });

          if (!res.ok) {
            const { error } = await res.json();
            alert(error);
            return;
          }
        } else {
          const res = await fetch("http://localhost:3001/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userData.email, password: userData.password }),
          });

          if (!res.ok) {
            const { error } = await res.json();
            alert(error);
            return;
          }
        }

        nextStep();
      } catch (err) {
        console.error("Errore durante login/registrazione:", err);
        alert("Errore nella connessione al server.");
      }
    } else {
      nextStep();
    }
  };

  const validateUsername = (username) => {
    return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateForm = () => {
    const errors = {};

    // Validazione solo per nuovi utenti
    if (isNewUser) {
      if (!userData.name.trim()) errors.name = "Nome richiesto";
      if (!userData.username.trim()) errors.username = "Username richiesto";
      else if (!validateUsername(userData.username)) errors.username = "Username deve avere almeno 3 caratteri e contenere solo lettere, numeri e underscore";
    }

    // Validazione comune per entrambi i casi
    if (!userData.email.trim()) errors.email = "Email richiesta";
    else if (!validateEmail(userData.email)) errors.email = "Email non valida";
    if (!userData.password) errors.password = "Password richiesta";
    else if (!validatePassword(userData.password)) errors.password = "Password deve avere almeno 8 caratteri";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const filteredVersions = showOnlyLatest ? versions.filter(v => v.ultima_versione === 1) : versions;

  function calculatePrice() {
    if (!selectedServer) return 0;

    const durata = durateNoleggio.find(d => d.mesi === duration);
    if (!durata) return selectedServer.prezzo_mensile * duration;

    const prezzoBase = selectedServer.prezzo_mensile * duration;
    const sconto = durata.prezzo_sconto || 0;

    return prezzoBase * (1 - sconto / 100);
  }

  const handleSubmit = () => {
    const finalVersion = useCustomVersion ? customVersion : serverConfig.version;
    const order = {
      selectedServer,
      duration,
      userData,
      serverConfig: {
        ...serverConfig,
        version: finalVersion,
        eggType: selectedEgg
      },
      totalPrice: calculatePrice()
    };
    console.log("Ordine confermato:", order);
    alert("Ordine confermato!");
  };

  const StepIndicator = ({ currentStep }) => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${stepNum <= currentStep
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
            : 'bg-gray-200 text-gray-400'
            }`}>
            {stepNum < currentStep ? <span className="text-lg">✓</span> : stepNum}
          </div>
          {stepNum < 3 && (
            <div className={`w-16 h-1 mx-2 transition-all duration-300 ${stepNum < currentStep ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200'
              }`} />
          )}
        </div>
      ))}
    </div>
  );

  const getEggName = (selectedEgg) => {
    const egg = eggTypes.find(egg => egg.nome === selectedEgg);
    return egg ? egg.nome : selectedEgg;
  };

  const getSelectedEggVersion = (selectedEgg) => {
    // Se è selezionata una versione personalizzata, ritorna quella
    if (useCustomVersion && customVersion) {
      return customVersion;
    }

    // Se è selezionata una versione specifica dal dropdown, ritorna quella
    if (serverConfig.version) {
      return serverConfig.version;
    }

    // Altrimenti, filtra le versioni per l'egg selezionato
    const eggVersions = versions.filter(v => v.tipo_nome === selectedEgg);

    if (eggVersions.length === 0) return "—";

    // Prendi la versione più popolare o l'ultima versione
    const selectedVersion = eggVersions.find(v => v.popolare === 1) ||
      eggVersions.find(v => v.ultima_versione === 1) ||
      eggVersions[0];

    return selectedVersion ? selectedVersion.versione : "—";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center p-6 min-h-screen">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Minecraft Server
            </h1>
            <p className="text-gray-300 text-lg">Crea il tuo mondo perfetto</p>
          </div>

          <StepIndicator currentStep={step} />

          {/* Main Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 transition-all duration-500 ease-in-out">
            <div className={`transition-all duration-700 ${step === 1 ? 'opacity-100 translate-y-0 ease-out' : 'opacity-0 translate-y-4 ease-in absolute'}`}>
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                      <Server className="w-8 h-8" />
                      Scegli il tuo Server
                    </h2>
                    <p className="text-gray-300">Seleziona la configurazione perfetta per la tua avventura</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {serverOptions.map((server) => (
                      <div
                        key={server.id}
                        onClick={() => setSelectedServer(server)}
                        className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 rounded-2xl ${selectedServer?.id === server.id
                          ? "ring-4 ring-purple-500 shadow-2xl shadow-purple-500/50"
                          : "hover:shadow-xl"
                          }`}
                      >
                        {server.popular === 1 && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold z-10">
                            POPOLARE
                          </div>
                        )}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 border border-gray-600 h-full">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-purple-400">
                              {iconMap[server.icon] || <Server className="w-6 h-6" />}
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-white">
                                €{server.prezzo_mensile}
                              </p>
                              <p className="text-gray-400 text-sm">/mese</p>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4">{server.nome}</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-300">
                              <div className="w-4 h-4 bg-red-500 rounded"></div>
                              <span>{server.cpu_cores} vCPU</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <div className="w-4 h-4 bg-blue-500 rounded"></div>
                              <span>{server.ram_gb} GB RAM</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <div className="w-4 h-4 bg-green-500 rounded"></div>
                              <span>{server.storage_gb} GB SSD</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 border border-gray-600">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-purple-400" />
                      <h3 className="text-xl font-bold text-white">Durata Noleggio</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {durateNoleggio.map((d) => (
                        <button
                          key={d.mesi}
                          onClick={() => setDuration(d.mesi)}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${duration === d.mesi
                            ? "border-purple-500 bg-purple-500/20 text-purple-400"
                            : "border-gray-600 text-gray-300 hover:border-gray-500"
                            }`}
                        >
                          <div className="font-bold">{d.nome}</div>
                          {d.prezzo_sconto > 0 && (
                            <div className="text-xs text-green-400">-{d.prezzo_sconto}%</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedServer && (
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-bold">Totale:</p>
                          <p className="text-gray-300 text-sm">{selectedServer.nome} × {duration} mes{duration > 1 ? 'i' : 'e'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-white">€{calculatePrice().toFixed(2)}</p>
                          {durateNoleggio.find(d => d.mesi === duration)?.prezzo_sconto > 0 && (
                            <p className="text-green-400 text-sm">
                              Risparmio {durateNoleggio.find(d => d.mesi === duration)?.prezzo_sconto}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleNextStep}
                    disabled={!selectedServer}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    Continua
                    <span className="text-xl"><ChevronRight className="w-5 h-5" /></span>
                  </button>
                </div>
              )}
            </div>

            <div className={`transition-all duration-700 ${step === 2 ? 'opacity-100 translate-y-0 ease-out' : 'opacity-0 translate-y-4 ease-in absolute'}`}>
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                      <User className="w-8 h-8" />
                      {isNewUser ? 'Crea Account' : 'Accedi'}
                    </h2>
                    <p className="text-gray-300">
                      {isNewUser ? 'Crea il tuo account per continuare' : 'Accedi con le tue credenziali'}
                    </p>
                  </div>

                  {/* Toggle per scegliere tra nuovo utente e utente esistente */}
                  <div className="flex items-center justify-center mb-8">
                    <div className="bg-slate-800 rounded-full p-1 flex items-center border border-gray-600 relative overflow-hidden">
                      {/* Sfondo animato che si sposta */}
                      <div
                        className={`absolute top-1 bottom-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-in-out shadow-lg ${isNewUser ? 'left-1 w-[calc(50%-2px)]' : 'left-1/2 w-[calc(50%-2px)]'
                          }`}
                      />

                      <button
                        onClick={() => setIsNewUser(true)}
                        className={`relative z-10 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 transform hover:scale-105 ${isNewUser
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                          }`}
                      >
                        Nuovo Utente
                      </button>
                      <button
                        onClick={() => setIsNewUser(false)}
                        className={`relative z-10 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 transform hover:scale-105 ${!isNewUser
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                          }`}
                      >
                        Già Registrato
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Campi per nuovo utente */}
                    <div className={`space-y-2 transition-all duration-500 ease-in-out ${isNewUser
                      ? 'opacity-100 translate-y-0 max-h-96'
                      : 'opacity-0 translate-y-4 max-h-0 overflow-hidden'
                      }`}>
                      <label className="block text-sm font-medium text-gray-300">Nome e Cognome</label>
                      <input
                        type="text"
                        className={`w-full bg-slate-800 border rounded-xl p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 ${validationErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-purple-500'
                          }`}
                        placeholder="Mario Rossi"
                        value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      />
                      {validationErrors.name && <p className="text-red-400 text-sm">{validationErrors.name}</p>}
                    </div>

                    <div className={`space-y-2 transition-all duration-500 ease-in-out delay-100 ${isNewUser
                      ? 'opacity-100 translate-y-0 max-h-96'
                      : 'opacity-0 translate-y-4 max-h-0 overflow-hidden'
                      }`}>
                      <label className="block text-sm font-medium text-gray-300">Username</label>
                      <input
                        type="text"
                        className={`w-full bg-slate-800 border rounded-xl p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 ${validationErrors.username ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-purple-500'
                          }`}
                        placeholder="mariorossi"
                        value={userData.username}
                        onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                      />
                      {validationErrors.username && <p className="text-red-400 text-sm">{validationErrors.username}</p>}
                    </div>

                    {/* Campi comuni (email e password) */}
                    <div className={`space-y-2 transition-all duration-500 ease-in-out ${isNewUser ? 'delay-200' : 'delay-0'
                      }`}>
                      <label className="block text-sm font-medium text-gray-300">Email</label>
                      <input
                        type="email"
                        className={`w-full bg-slate-800 border rounded-xl p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 ${validationErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-purple-500'
                          }`}
                        placeholder="mario@example.com"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      />
                      {validationErrors.email && <p className="text-red-400 text-sm">{validationErrors.email}</p>}
                    </div>

                    <div className={`space-y-2 transition-all duration-500 ease-in-out ${isNewUser ? 'delay-300' : 'delay-100'
                      }`}>
                      <label className="block text-sm font-medium text-gray-300">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className={`w-full bg-slate-800 border rounded-xl p-4 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 ${validationErrors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-purple-500'
                            }`}
                          placeholder="••••••••"
                          value={userData.password}
                          onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {validationErrors.password && <p className="text-red-400 text-sm">{validationErrors.password}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between gap-4">
                    <button
                      onClick={prevStep}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    >
                      <span className="text-xl"><ChevronLeft className="w-5 h-5" /></span>
                      Indietro
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    >
                      {isNewUser ? 'Continua' : 'Accedi'}
                      <span className="text-xl"><ChevronRight className="w-5 h-5" /></span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={`transition-all duration-700 ${step === 3 ? 'opacity-100 translate-y-0 ease-out' : 'opacity-0 translate-y-4 ease-in absolute'}`}>
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                      <Settings className="w-8 h-8" />
                      Configura il Server
                    </h2>
                    <p className="text-gray-300">Ultimi dettagli per il tuo mondo</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">Nome del Server</label>
                      <input
                        type="text"
                        className="w-full bg-slate-800 border border-gray-600 rounded-xl p-4 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                        placeholder="Il mio server fantastico"
                        value={serverConfig.name}
                        onChange={(e) => setServerConfig({ ...serverConfig, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-6">
                      <label className="block text-sm font-medium text-gray-300">Tipo Server</label>

                      {/* Egg Selection - 3 per row */}
                      <div className="grid grid-cols-3 gap-4">
                        {eggTypes.map((egg) => (
                          <button
                            key={egg.nome}
                            onClick={() => {
                              setSelectedEgg(egg.nome); // ← compatibile con tipo_nome
                              setServerConfig({ ...serverConfig, version: "" });
                            }}
                            className={`p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${selectedEgg === egg.nome
                              ? "border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 shadow-lg shadow-purple-500/25"
                              : "border-gray-600 bg-slate-800 text-gray-300 hover:border-gray-500 hover:bg-slate-700"
                              }`}
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-1">{egg.icona}</div>
                              <div className="font-bold text-xs">{egg.nome}</div>
                              <div className="text-xs text-gray-400 mt-1">{egg.descrizione}</div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Version Selection - Only if egg is selected */}
                      {selectedEgg && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-300">Versione</label>

                            {/* Custom Version Toggle */}
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-300">Versione personalizzata</span>
                              <button
                                onClick={() => setUseCustomVersion(!useCustomVersion)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${useCustomVersion ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-600'
                                  }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${useCustomVersion ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                              </button>
                            </div>
                          </div>

                          {useCustomVersion ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Scrivi qui il numero della versione (es. 1.21.4, 1.20.5, ...)"
                                value={customVersion}
                                onChange={(e) => setCustomVersion(e.target.value)}
                                className="w-full bg-slate-800 border border-gray-600 rounded-xl p-4 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
                              />
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-400 italic">
                                  Se la versione indicata è errata, verrà installata l'ultima versione disponibile.
                                </p>
                                <p className="text-xs text-gray-400 italic">
                                  scrivere latset per installare l'ultima versione
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-4">
                              {/*<div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto px py-1"> */}

                              {filteredVersions
                                .filter(version => version.tipo_nome === selectedEgg) // cambia da version.tipo a tipo_nome
                                .map((version) => (
                                  <button
                                    key={version.id}
                                    onClick={() =>
                                      setServerConfig({ ...serverConfig, version: version.versione })
                                    }
                                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${serverConfig.version === version.versione
                                      ? "border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 shadow-lg shadow-purple-500/25"
                                      : "border-gray-600 bg-slate-800 text-gray-300 hover:border-gray-500 hover:bg-slate-700"
                                      }`}
                                  >
                                    <div className="font-bold text-sm">
                                      {version.versione.split(" ").pop()}
                                    </div>
                                    {version.ultima_versione === 1 && (
                                      <div className="text-xs text-green-400 font-semibold">Latest</div>
                                    )}
                                    {version.popolare === 1 && (
                                      <div className="text-xs text-green-400 font-semibold">Popular</div>
                                    )}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 border border-gray-600">
                      <h3 className="text-xl font-bold text-white mb-4">Riepilogo Ordine</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Server:</span>
                          <span className="text-white font-bold">{selectedServer.nome}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Durata:</span>
                          <span className="text-white font-bold">{duration} mes{duration > 1 ? 'i' : 'e'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Configurazione:</span>
                          <span className="text-white font-bold">{selectedServer.cpu_cores} vCpu, {selectedServer.ram_gb}Gb Ram, {selectedServer?.storage_gb}Gb Ssd</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Nome:</span>
                          <span className="text-white font-bold">{serverConfig.name || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Versione:</span>
                          <span className="text-white font-bold">
                            {selectedEgg ? (
                              useCustomVersion
                                ? (customVersion ? `${getEggName(selectedEgg)} ${customVersion}` : getEggName(selectedEgg))
                                : (serverConfig.version ? `${selectedEgg} ${serverConfig.version}` : selectedEgg)
                            ) : "—"}
                          </span>
                        </div>

                        <div className="border-t border-gray-600 pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-white">Totale:</span>
                            <span className="text-2xl font-bold text-purple-400">${calculatePrice().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between gap-4">
                    <button
                      onClick={prevStep}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    >
                      <span className="text-xl"><ChevronLeft className="w-5 h-5" /></span>
                      Indietro
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!serverConfig.name || (!serverConfig.version && !customVersion)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                    >
                      <span className="text-xl"><Check className="w-5 h-5" /></span>
                      Conferma Ordine
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}