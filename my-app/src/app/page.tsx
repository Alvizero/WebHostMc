'use client';

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Server, Clock, User, Settings, Check, Zap, Shield, Cpu } from "lucide-react";

const serverOptions = [
  { 
    name: "Server Base", 
    cpu: "2 vCPU", 
    ram: "5GB RAM", 
    ssd: "10GB SSD", 
    price: 9.99,
    icon: <Server className="w-6 h-6" />,
    popular: false
  },
  { 
    name: "Server Medio", 
    cpu: "4 vCPU", 
    ram: "10GB RAM", 
    ssd: "20GB SSD", 
    price: 19.99,
    icon: <Zap className="w-6 h-6" />,
    popular: true
  },
  { 
    name: "Server Pro", 
    cpu: "8 vCPU", 
    ram: "20GB RAM", 
    ssd: "50GB SSD", 
    price: 39.99,
    icon: <Shield className="w-6 h-6" />,
    popular: false
  },
];

const durations = [
  { months: 1, discount: 0 },
  { months: 2, discount: 4 },
  { months: 3, discount: 7 },
  { months: 6, discount: 12 },
  { months: 12, discount: 18 }
];

const versions = [
  { name: "Vanilla 1.21.7", type: "Vanilla", isLatest: true, isPopular: false },
  { name: "Vanilla 1.21.6", type: "Vanilla", isLatest: false, isPopular: false },
  { name: "Vanilla 1.21.5", type: "Vanilla", isLatest: false, isPopular: false },
  { name: "Vanilla 1.21.4", type: "Vanilla", isLatest: false, isPopular: true },

  { name: "Forge 1.21.7", type: "Forge", isLatest: true, isPopular: false },
  { name: "Forge 1.21.6", type: "Forge", isLatest: false, isPopular: false },
  { name: "Forge 1.21.5", type: "Forge", isLatest: false, isPopular: false },
  { name: "Forge 1.21.4", type: "Forge", isLatest: false, isPopular: false },

  { name: "Fabric 1.21.7", type: "Fabric", isLatest: true, isPopular: false },
  { name: "Fabric 1.21.6", type: "Fabric", isLatest: false, isPopular: false },
  { name: "Fabric 1.21.5", type: "Fabric", isLatest: false, isPopular: false },
  { name: "Fabric 1.21.4", type: "Fabric", isLatest: false, isPopular: false },
  
  { name: "Spigot 1.21.5", type: "Spigot", isLatest: true, isPopular: false },
  { name: "Spigot 1.21.4", type: "Spigot", isLatest: false, isPopular: false },
  { name: "Spigot 1.21.3", type: "Spigot", isLatest: false, isPopular: false },
  { name: "Spigot 1.21.2", type: "Spigot", isLatest: false, isPopular: false },
  
  { name: "Paper 1.21.7", type: "Paper", isLatest: true, isPopular: false },
  { name: "Paper 1.21.6", type: "Paper", isLatest: false, isPopular: false },
  { name: "Paper 1.21.5", type: "Paper", isLatest: false, isPopular: false },
  { name: "Paper 1.21.4", type: "Paper", isLatest: false, isPopular: false },
  
  { name: "Bukkit 1.21.5", type: "Bukkit", isLatest: true, isPopular: false },
  { name: "Bukkit 1.21.4", type: "Bukkit", isLatest: false, isPopular: false },
  { name: "Bukkit 1.21.3", type: "Bukkit", isLatest: false, isPopular: false },
  { name: "Bukkit 1.21.1", type: "Bukkit", isLatest: false, isPopular: false },
  
];

const eggTypes = [
{ name: "Vanilla", icon: "🎮", description: "Minecraft originale senza modifiche" },
{ name: "Forge", icon: "🔨", description: "Supporto completo per le mod" },
{ name: "Fabric", icon: "🧵", description: "Mod leggere e performance ottimizzate" },
{ name: "Spigot", icon: "🌟", description: "Supporto completo per i plugins" },
{ name: "Paper", icon: "📄", description: "Fork di Spigot ottimizzato" },
{ name: "Bukkit", icon: "🪣", description: "Plugins classici" }
];

export default function Page() {
  const [step, setStep] = useState(1);
  const [selectedServer, setSelectedServer] = useState(null);
  const [duration, setDuration] = useState(1);
  const [userData, setUserData] = useState({ name: "", username: "", email: "", password: "" });
  const [serverConfig, setServerConfig] = useState({ name: "", version: "" });
  const [showOnlyLatest, setShowOnlyLatest] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [selectedEgg, setSelectedEgg] = useState("");
  const [customVersion, setCustomVersion] = useState("");
  const [useCustomVersion, setUseCustomVersion] = useState(false);

  const nextStep = () => {
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username) => {
    return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const validateForm = () => {
    const errors = {};
    
    if (!userData.name.trim()) errors.name = "Nome richiesto";
    if (!userData.username.trim()) errors.username = "Username richiesto";
    else if (!validateUsername(userData.username)) errors.username = "Username deve avere almeno 3 caratteri e contenere solo lettere, numeri e underscore";
    if (!userData.email.trim()) errors.email = "Email richiesta";
    else if (!validateEmail(userData.email)) errors.email = "Email non valida";
    if (!userData.password) errors.password = "Password richiesta";
    else if (!validatePassword(userData.password)) errors.password = "Password deve avere almeno 8 caratteri";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 2 && !validateForm()) return;
    nextStep();
  };

  const filteredVersions = showOnlyLatest ? versions.filter(v => v.isLatest) : versions;

  const calculatePrice = () => {
    if (!selectedServer) return 0;
    const basePrice = selectedServer.price * duration;
    const discountObj = durations.find(d => d.months === duration);
    const discount = discountObj ? discountObj.discount : 0;
    return basePrice * (1 - discount / 100);
  };

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
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            stepNum <= currentStep 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-400'
          }`}>
          {stepNum < currentStep ? <span className="text-lg">✓</span> : stepNum}
          </div>
          {stepNum < 3 && (
            <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
              stepNum < currentStep ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

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
            <div className={`transition-all duration-500 ease-in-out ${step === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full absolute'}`}>
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
                  {serverOptions.map((server, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedServer(server)}
                      className={`relative group cursor-pointer transition-all duration-300 transform hover:scale-105 rounded-2xl ${
                        selectedServer?.name === server.name 
                          ? "ring-4 ring-purple-500 shadow-2xl shadow-purple-500/50" 
                          : "hover:shadow-xl"
                      }`}
                    >
                      {server.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold z-10">
                          POPOLARE
                        </div>
                      )}
                      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 border border-gray-600 h-full">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-purple-400">{server.icon}</div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">${server.price}</p>
                            <p className="text-gray-400 text-sm">/mese</p>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">{server.name}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span>{server.cpu}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span>{server.ram}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span>{server.ssd}</span>
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
                    {durations.map((d) => (
                      <button
                        key={d.months}
                        onClick={() => setDuration(d.months)}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                          duration === d.months
                            ? "border-purple-500 bg-purple-500/20 text-purple-400"
                            : "border-gray-600 text-gray-300 hover:border-gray-500"
                        }`}
                      >
                        <div className="font-bold">{d.months} mes{d.months > 1 ? 'i' : 'e'}</div>
                        {d.discount > 0 && (
                          <div className="text-xs text-green-400">-{d.discount}%</div>
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
                        <p className="text-gray-300 text-sm">{selectedServer.name} × {duration} mes{duration > 1 ? 'i' : 'e'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">${calculatePrice().toFixed(2)}</p>
                        {durations.find(d => d.months === duration)?.discount > 0 && (
                          <p className="text-green-400 text-sm">Risparmio {durations.find(d => d.months === duration)?.discount}%</p>
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
                  <span className="text-xl">→</span>
                </button>
              </div>
            )}
            </div>

            <div className={`transition-all duration-500 ease-in-out ${step === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full absolute'}`}>
              {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <User className="w-8 h-8" />
                    I tuoi Dati
                  </h2>
                  <p className="text-gray-300">Crea il tuo account per continuare</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Nome e Cognome</label>
                    <input
                      type="text"
                      className={`w-full bg-slate-800 border rounded-xl p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 ${
                        validationErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-purple-500'
                      }`}
                      placeholder="Mario Rossi"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                    />
                    {validationErrors.name && <p className="text-red-400 text-sm">{validationErrors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Username</label>
                    <input
                      type="text"
                      className={`w-full bg-slate-800 border rounded-xl p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 ${
                        validationErrors.username ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-purple-500'
                      }`}
                      placeholder="mariorossi"
                      value={userData.username}
                      onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                    />
                    {validationErrors.username && <p className="text-red-400 text-sm">{validationErrors.username}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Email</label>
                    <input
                      type="email"
                      className={`w-full bg-slate-800 border rounded-xl p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 ${
                        validationErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-purple-500'
                      }`}
                      placeholder="mario@example.com"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    />
                    {validationErrors.email && <p className="text-red-400 text-sm">{validationErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Password</label>
                    <input
                      type="password"
                      className={`w-full bg-slate-800 border rounded-xl p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 ${
                        validationErrors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-purple-500'
                      }`}
                      placeholder="••••••••"
                      value={userData.password}
                      onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    />
                    {validationErrors.password && <p className="text-red-400 text-sm">{validationErrors.password}</p>}
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <button
                    onClick={prevStep}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                  >
                    <span className="text-xl">←</span>
                    Indietro
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                  >
                    Continua
                    <span className="text-xl">→</span>
                  </button>
                </div>
              </div>
            )}
            </div>

            <div className={`transition-all duration-500 ease-in-out ${step === 3 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full absolute'}`}>
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
                        key={egg.name}
                        onClick={() => {
                          setSelectedEgg(egg.name);
                          setServerConfig({ ...serverConfig, version: "" });
                        }}
                        className={`p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                          selectedEgg === egg.name
                            ? "border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 shadow-lg shadow-purple-500/25"
                            : "border-gray-600 bg-slate-800 text-gray-300 hover:border-gray-500 hover:bg-slate-700"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{egg.icon}</div>
                          <div className="font-bold text-xs">{egg.name}</div>
                          <div className="text-xs text-gray-400 mt-1">{egg.description}</div>
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
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                useCustomVersion ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-600'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                  useCustomVersion ? 'translate-x-6' : 'translate-x-1'
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
                            <p className="text-sm text-gray-400 italic">
                              Se la versione indicata è errata, verrà installata l'ultima versione disponibile.
                            </p>
                          </div>
                        ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {/*<div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto px py-1"> */}
                          
                          {filteredVersions
                            .filter(version => version.type === selectedEgg)
                            .map((version) => (
                              <button
                                key={version.name}
                                onClick={() => setServerConfig({ ...serverConfig, version: version.name })}
                                className={`p-3 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 ${
                                  serverConfig.version === version.name
                                    ? "border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 shadow-lg shadow-purple-500/25"
                                    : "border-gray-600 bg-slate-800 text-gray-300 hover:border-gray-500 hover:bg-slate-700"
                                }`}
                              >
                                <div className="font-bold text-sm">{version.name.split(" ").pop()}</div>
                                {version.isLatest && (
                                  <div className="text-xs text-green-400 font-semibold">Latest</div>
                                )}
                                {version.isPopular && (
                                  <div className="text-xs text-green-400 font-semibold">Popular</div>
                                )}
                              </button>
                            ))
                          }
                        </div>
                      )}
                      {/* Message if no egg selected */}
                      {!selectedEgg && (
                        <div className="text-center py-8">
                          <p className="text-gray-400">Seleziona un tipo di server per scegliere la versione</p>
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
                        <span className="text-white font-bold">{selectedServer?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Durata:</span>
                        <span className="text-white font-bold">{duration} mes{duration > 1 ? 'i' : 'e'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Configurazione:</span>
                        <span className="text-white font-bold">{selectedServer?.cpu}, {selectedServer?.ram}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Versione:</span>
                        <span className="text-white font-bold">{useCustomVersion ? `${selectedEgg} ${customVersion}` : serverConfig.version || "—"}</span>
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
                    <span className="text-xl">←</span>
                    Indietro
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!serverConfig.name || (!serverConfig.version && !customVersion)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                  >
                    <span className="text-xl">✓</span>
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