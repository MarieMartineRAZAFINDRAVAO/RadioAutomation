 import React, { useState } from 'react';

export default function TraitementAccueil({ isDarkMode }) {
  const [step, setStep] = useState(1);

  // Client States
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false); // Controlled visibility
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');

  // Service States
  const [selectedService, setSelectedService] = useState('');
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [designation, setDesignation] = useState('');
  const [file, setFile] = useState(null);

  // Programmation States
  const [diffusions, setDiffusions] = useState([]);
  const [tempDate, setTempDate] = useState('');
  const [tempHeure, setTempHeure] = useState('');

  // Sample Data
  const services = [{ id: 1, nom: "Annonce" }, { id: 2, nom: "Spot Publicitaire" }];
  const tarifs = [
    { id: 101, serviceId: 1, libelle: "Moins de 10 lignes", prix: 3000 },
    { id: 102, serviceId: 1, libelle: "20 lignes", prix: 4000 },
    { id: 103, serviceId: 1, libelle: "Plus de 20 lignes", prix: 5000 }
  ];

  const clientSuggestions = [
    { id: 1, nom: "Rabe Jean", telephone: "0340000001" },
    { id: 2, nom: "Rakoto Paul", telephone: "0330000002" }
  ].filter(c => c.nom.toLowerCase().includes(clientSearch.toLowerCase()) || c.telephone.includes(clientSearch));

  const addDiffusion = () => {
    if (tempDate && tempHeure) {
      setDiffusions([...diffusions, { date: tempDate, heure: tempHeure }]);
      setTempHeure('');
    }
  };

  const removeDiffusion = (index) => {
    setDiffusions(diffusions.filter((_, i) => i !== index));
  };

  const montantTotal = (selectedTarif ? selectedTarif.prix : 0) * (diffusions.length || 1);

  return (
    <div className={`max-w-4xl mx-auto my-8 p-8 rounded-2xl shadow-xl transition-colors ${
      isDarkMode ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-gray-900'
    }`}>
      
      <h2 className="text-2xl font-extrabold text-center text-[#007a4d] mb-6">
        Traitement des Demandes (Accueil)
      </h2>

      {/* BOUTONS D'ETAPES NUMÉROTÉS 1 - 2 - 3 - 4 */}
      <div className="flex justify-center items-center gap-4 mb-8">
        {[
          { num: 1, label: 'Client' },
          { num: 2, label: 'Service & Support' },
          { num: 3, label: 'Planning' },
          { num: 4, label: 'Validation & Facture' }
        ].map((item) => (
          <button
            key={item.num}
            onClick={() => setStep(item.num)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${
              step === item.num 
                ? 'bg-[#007a4d] text-white shadow-md ring-2 ring-green-500' 
                : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === item.num ? 'bg-white text-[#007a4d]' : 'bg-gray-300 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
            }`}>
              {item.num}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      {/* ÉTAPE 1: CLIENT */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 border-b pb-2">
            1. Identification du Client
          </h3>

          {/* RAHA EFA MISY CLIENT VOASIDY */}
          {selectedClient ? (
            <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-green-900 dark:text-green-300 font-bold">🎯 Client sélectionné : {selectedClient.nom}</p>
                <p className="text-xs text-green-700 dark:text-green-400">Téléphone : {selectedClient.telephone}</p>
              </div>
              <button 
                onClick={() => setSelectedClient(null)} 
                className="text-xs text-red-600 underline font-semibold"
              >
                Changer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* CHERCHER CLIENT */}
              <div>
                <label className="block text-sm font-semibold mb-1">Rechercher un Client Existant :</label>
                <input 
                  type="text"
                  placeholder="Tapez le nom ou téléphone du client..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-[#007a4d]"
                />
                {clientSearch && clientSuggestions.length > 0 && (
                  <div className="border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 mt-1 max-h-40 overflow-y-auto shadow-md">
                    {clientSuggestions.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => { 
                          setSelectedClient(c); 
                          setClientSearch(''); 
                          setShowNewClientForm(false);
                        }}
                        className="p-3 hover:bg-green-50 dark:hover:bg-slate-700 cursor-pointer text-sm border-b last:border-none"
                      >
                        🎯 <strong>{c.nom}</strong> — {c.telephone}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BOUTON MANAHO D'AJOUTER CLIENT VAOVAO */}
              {!showNewClientForm ? (
                <div className="pt-2 text-center">
                  <span className="text-xs text-gray-400 block mb-2">- Na koa -</span>
                  <button 
                    onClick={() => setShowNewClientForm(true)}
                    className="bg-[#007a4d] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-green-800 transition-all shadow"
                  >
                    + Ajouter Nouveau Client
                  </button>
                </div>
              ) : (
                /* FORMULAIRE VAO MANINDRY BOUTON "AJOUTER" VAO MIPOITRA */
                <div className="border border-green-300 dark:border-green-800 p-4 rounded-xl bg-green-50/50 dark:bg-slate-800/60 space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <p className="text-sm font-bold text-[#007a4d]">Formulaire Nouveau Client</p>
                    <button 
                      onClick={() => setShowNewClientForm(false)} 
                      className="text-xs text-gray-500 hover:text-red-500 font-semibold"
                    >
                      ✕ Annuler
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Nom complet du client" 
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="Numéro de Téléphone" 
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ÉTAPE 2: SERVICE & SUPPORT */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 border-b pb-2">
            2. Sélection du Service et Support Audio/Scan
          </h3>

          <div>
            <label className="block text-sm font-semibold mb-1">Service Demandé :</label>
            <select 
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm"
            >
              <option value="">-- Sélectionner un Service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>

          {selectedService && (
            <div>
              <label className="block text-sm font-semibold mb-2">Tarifs Disponibles :</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tarifs.filter(t => t.serviceId === parseInt(selectedService)).map(t => (
                  <label 
                    key={t.id} 
                    className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                      selectedTarif?.id === t.id ? 'border-[#007a4d] bg-green-50 dark:bg-green-950/30 font-bold' : 'border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input type="radio" name="tarif" checked={selectedTarif?.id === t.id} onChange={() => setSelectedTarif(t)} />
                      <span className="text-sm">{t.libelle}</span>
                    </div>
                    <span className="text-sm text-[#007a4d] font-extrabold">{t.prix} Ar</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">Désignation / Texte de l'annonce :</label>
            <textarea 
              rows="3"
              placeholder="Tapez le texte ou la désignation..."
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm"
            ></textarea>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 p-6 rounded-xl text-center bg-gray-50 dark:bg-slate-800/50">
            <p className="text-sm font-semibold mb-2">📁 Charger le fichier MP3 ou Scan (Flash Disc / PC)</p>
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files[0])}
              className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#007a4d] file:text-white hover:file:bg-green-800 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ÉTAPE 3: PROGRAMMATION */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 border-b pb-2">
            3. Programmation des Diffusions
          </h3>

          <div className="flex flex-wrap gap-3 items-center">
            <input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} className="p-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm" />
            <input type="time" value={tempHeure} onChange={(e) => setTempHeure(e.target.value)} className="p-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm" />
            <button onClick={addDiffusion} className="bg-[#007a4d] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-green-800 transition-all">+ Ajouter Diffusion</button>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-800/40 space-y-2">
            {diffusions.length === 0 ? <p className="text-xs text-gray-400 italic">Aucune heure de diffusion ajoutée.</p> : (
              diffusions.map((d, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 border rounded-md text-sm">
                  <span>📅 <strong>{d.date}</strong> à ⏰ <strong>{d.heure}</strong></span>
                  <button onClick={() => removeDiffusion(idx)} className="text-red-500 text-xs font-bold">Supprimer</button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg text-right">
            <span className="text-sm font-semibold">Montant Total ({diffusions.length} diffusions) : </span>
            <span className="text-xl font-extrabold text-[#007a4d] ml-2">{montantTotal} Ar</span>
          </div>
        </div>
      )}

      {/* ÉTAPE 4: VALIDATION & FACTURE */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 border-b pb-2 text-center">
            4. Récapitulatif & Génération Facture
          </h3>

          <div className="p-6 border rounded-xl bg-white text-gray-900 shadow-md space-y-4">
            <div className="flex justify-between border-b pb-3">
              <div>
                <h4 className="font-extrabold text-[#007a4d]">RADIO TSIRY</h4>
                <p className="text-xs text-gray-500">Avis & Communiqués Radio</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400">FACTURE PROFORMA</p>
                <p className="text-xs font-bold">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <p><strong>Client :</strong> {selectedClient ? selectedClient.nom : (nom || 'N/A')}</p>
              <p><strong>Téléphone :</strong> {selectedClient ? selectedClient.telephone : (telephone || 'N/A')}</p>
              <p><strong>Service :</strong> {selectedTarif?.libelle}</p>
              <p><strong>Désignation :</strong> {designation || 'N/A'}</p>
              <p><strong>Fichier :</strong> {file ? file.name : 'Aucun fichier'}</p>
            </div>

            <div className="border-t border-b py-2 text-xs">
              <p className="font-bold mb-1">Passages programmés ({diffusions.length}) :</p>
              {diffusions.map((d, i) => (
                <span key={i} className="inline-block bg-gray-100 rounded px-2 py-1 mr-2 mb-1">
                  {d.date} à {d.heure}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-sm">TOTAL À PAYER :</span>
              <span className="text-2xl font-black text-[#007a4d]">{montantTotal} Ar</span>
            </div>
          </div>

          <button className="w-full bg-[#007a4d] text-white py-3 rounded-xl font-bold text-base hover:bg-green-800 shadow-lg transition-all">
            ✅ Valider la Commande et Imprimer la Facture
          </button>
        </div>
      )}

      {/* BOUTONS NAVIGATION */}
      <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-slate-800">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 font-bold text-sm hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
            &lt; Précédent
          </button>
        ) : <div></div>}

        {step < 4 && (
          <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-lg bg-[#007a4d] text-white font-bold text-sm hover:bg-green-800 shadow-md transition-all ml-auto">
            Suivant &gt;
          </button>
        )}
      </div>

    </div>
  );
}