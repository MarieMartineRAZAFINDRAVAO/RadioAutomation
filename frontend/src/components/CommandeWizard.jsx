import React, { useState } from 'react';

export const CommandeWizard = () => {
  const [step, setStep] = useState(1);
  const [darkMode, setDarkMode] = useState(false);

  // Form State
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClient, setNewClient] = useState({ nom: '', telephone: '' });
  
  const [selectedService, setSelectedService] = useState('');
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [designation, setDesignation] = useState('');
  const [file, setFile] = useState(null);

  const [diffusions, setDiffusions] = useState([]);
  const [tempDate, setTempDate] = useState('');
  const [tempHeure, setTempHeure] = useState('');

  // Sample Data (Services & Tarifs)
  const services = [{ id: 1, nom: "Annonce" }, { id: 2, nom: "Spot Publicitaire" }];
  const tarifs = [
    { id: 101, serviceId: 1, libelle: "Moins de 10 lignes", prix: 3000 },
    { id: 102, serviceId: 1, libelle: "20 lignes", prix: 4000 },
  ];

  const clientSuggestions = [
    { id: 1, nom: "Rabe Jean", telephone: "0340000001" },
    { id: 2, nom: "Rakoto Paul", telephone: "0330000002" }
  ].filter(c => c.nom.toLowerCase().includes(clientSearch.toLowerCase()));

  const addDiffusion = () => {
    if (tempDate && tempHeure) {
      setDiffusions([...diffusions, { date: tempDate, heure: tempHeure }]);
      setTempHeure('');
    }
  };

  const montantTotal = (selectedTarif ? selectedTarif.prix : 0) * diffusions.length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation Buttons 1 - 2 - 3 - 4 */}
      <div className="max-w-4xl mx-auto pt-6 flex justify-center space-x-4">
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            onClick={() => setStep(num)}
            className={`w-12 h-12 rounded-full font-bold transition-all ${
              step === num ? 'bg-blue-600 text-white ring-4 ring-blue-300' : 'bg-gray-300 text-gray-700'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="max-w-3xl mx-auto mt-8 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md">
        {/* ÉTAPE 1: CLIENT */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-4">1. Identification du Client</h2>
            <input 
              type="text"
              placeholder="Taper une lettre pour chercher un client..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full border p-2 rounded mb-2 text-black"
            />
            {clientSearch && (
              <div className="border rounded bg-white text-black max-h-32 overflow-y-auto mb-4">
                {clientSuggestions.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => { setSelectedClient(c); setClientSearch(''); }}
                    className="p-2 hover:bg-blue-100 cursor-pointer"
                  >
                    {c.nom} ({c.telephone})
                  </div>
                ))}
              </div>
            )}

            {selectedClient ? (
              <div className="p-3 bg-green-100 text-green-800 rounded mb-4">
                Client Sélectionné: <strong>{selectedClient.nom}</strong> ({selectedClient.telephone})
              </div>
            ) : (
              <div className="border-t pt-4">
                <p className="font-semibold mb-2">Ou créer un nouveau client:</p>
                <input 
                  type="text" 
                  placeholder="Nom du client" 
                  onChange={(e) => setNewClient({...newClient, nom: e.target.value})}
                  className="w-full border p-2 rounded mb-2 text-black"
                />
                <input 
                  type="text" 
                  placeholder="Téléphone" 
                  onChange={(e) => setNewClient({...newClient, telephone: e.target.value})}
                  className="w-full border p-2 rounded mb-4 text-black"
                />
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 2: SERVICE & AUDIO/SCAN */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-4">2. Choix du Service & Support</h2>
            <select 
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full border p-2 rounded mb-4 text-black"
            >
              <option value="">-- Sélectionner un Service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>

            {selectedService && (
              <div className="mb-4">
                <label className="block font-semibold mb-1">Tarifs Disponibles:</label>
                {tarifs.filter(t => t.serviceId === parseInt(selectedService)).map(t => (
                  <label key={t.id} className="flex items-center space-x-2 border p-2 rounded mb-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="tarif" 
                      onChange={() => setSelectedTarif(t)} 
                    />
                    <span>{t.libelle} - <strong>{t.prix} Ar</strong></span>
                  </label>
                ))}
              </div>
            )}

            <textarea 
              placeholder="Désignation fohifohy (Texte/Annonce)..."
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full border p-2 rounded mb-4 text-black"
            ></textarea>

            <div className="border-dashed border-2 border-gray-400 p-4 rounded text-center">
              <p className="mb-2">Uploader Fichier Audio MP3 na Scan/Sary Taratasy (Flash Disc)</p>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            </div>
          </div>
        )}

        {/* ÉTAPE 3: PROGRAMMATION */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-4">3. Planning de Diffusion</h2>
            <div className="flex space-x-2 mb-4">
              <input 
                type="date" 
                value={tempDate} 
                onChange={(e) => setTempDate(e.target.value)} 
                className="border p-2 rounded text-black"
              />
              <input 
                type="time" 
                value={tempHeure} 
                onChange={(e) => setTempHeure(e.target.value)} 
                className="border p-2 rounded text-black"
              />
              <button onClick={addDiffusion} className="bg-green-600 text-white px-4 py-2 rounded">Ajouter</button>
            </div>

            <ul className="mb-4">
              {diffusions.map((d, idx) => (
                <li key={idx} className="border-b py-1"> Le {d.date} à {d.heure}</li>
              ))}
            </ul>

            <div className="text-right text-lg font-bold text-blue-600">
              Montant Total ({diffusions.length} passages) : {montantTotal} Ar
            </div>
          </div>
        )}

        {/* ÉTAPE 4: FACTURE */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-center">FACTURE - RADIO TSIRY</h2>
            <div className="border p-4 rounded bg-white text-black mb-4">
              <p><strong>Client:</strong> {selectedClient ? selectedClient.nom : newClient.nom}</p>
              <p><strong>Téléphone:</strong> {selectedClient ? selectedClient.telephone : newClient.telephone}</p>
              <hr className="my-2" />
              <p><strong>Service:</strong> {selectedTarif?.libelle}</p>
              <p><strong>Désignation:</strong> {designation}</p>
              <p><strong>Nombre de Passages:</strong> {diffusions.length}</p>
              <p className="text-xl font-bold mt-2">TOTAL À PAYER: {montantTotal} Ar</p>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Imprimer la Facture</button>
          </div>
        )}

        {/* Controls Navigation Précédent/Suivant */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="bg-gray-500 text-white px-4 py-2 rounded">
              &lt; Précédent
            </button>
          )}
          {step < 4 && (
            <button onClick={() => setStep(step + 1)} className="bg-blue-600 text-white px-4 py-2 rounded ml-auto">
              Suivant &gt;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};