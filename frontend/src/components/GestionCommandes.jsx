import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function GestionCommandes() {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [filteredTarifs, setFilteredTarifs] = useState([]);

  // Form State
  const [selectedClient, setSelectedClient] = useState('');
  const [designation, setDesignation] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedTarif, setSelectedTarif] = useState('');
  const [fichierAudio, setFichierAudio] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [diffusions, setDiffusions] = useState([{ date: '', heure: '' }]);

  // Chargement des données backend
  useEffect(() => {
    API.get('clients/').then(res => setClients(res.data)).catch(err => console.error(err));
    API.get('services/').then(res => setServices(res.data)).catch(err => console.error(err));
    API.get('tarifs/').then(res => setTarifs(res.data)).catch(err => console.error(err));
  }, []);

  // Filter Tarifs dynamique quand un Service est sélectionné
  const handleServiceChange = (serviceId) => {
    setSelectedService(serviceId);
    setSelectedTarif(''); // Reset tarif
    if (serviceId) {
      const match = tarifs.filter(t => String(t.service) === String(serviceId) || String(t.service_id) === String(serviceId));
      setFilteredTarifs(match);
    } else {
      setFilteredTarifs([]);
    }
  };

  const handleEnregistrer = async (e) => {
    e.preventDefault();
    const tarifObj = tarifs.find(t => String(t.id) === String(selectedTarif));
    const total = (tarifObj?.prix || 0) * quantite * diffusions.length;

    const formData = new FormData();
    formData.append('clientId', selectedClient);
    formData.append('serviceId', selectedService);
    formData.append('tarifId', selectedTarif);
    formData.append('observation', designation);
    formData.append('montantTotal', total);
    formData.append('diffusions', JSON.stringify(diffusions));
    if (fichierAudio) formData.append('fichierAudio', fichierAudio);

    try {
      await API.post('commandes/valider_wizard/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Commande voasoratra soa aman-tsara!");
      window.location.reload();
    } catch (err) {
      alert("Misy olana tamin'ny fandraiketana: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', color: '#007a4d', marginBottom: '1.5rem' }}>Gestion des commandes</h2>

      <form onSubmit={handleEnregistrer} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        
        {/* CLIENT */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Client</label>
          <select 
            value={selectedClient} 
            onChange={(e) => setSelectedClient(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.nom} ({c.telephone})</option>
            ))}
          </select>
        </div>

        {/* DESIGNATION */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Désignation</label>
          <textarea 
            placeholder="Texte ou annonce à diffuser" 
            value={designation} 
            onChange={(e) => setDesignation(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '80px' }}
          />
        </div>

        {/* FICHIER AUDIO */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Fichier ou image à envoyer au Studio (optionnel)</label>
          <input 
            type="file" 
            onChange={(e) => setFichierAudio(e.target.files[0])}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>

        {/* SERVICE & TARIF CORRESPONDANT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Service</label>
            <select 
              value={selectedService} 
              onChange={(e) => handleServiceChange(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              required
            >
              <option value="">Sélectionner un service</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.nom_service}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Tarif correspondant</label>
            <select 
              value={selectedTarif} 
              onChange={(e) => setSelectedTarif(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
              required
              disabled={!selectedService}
            >
              <option value="">
                {selectedService ? "Sélectionner un tarif" : "-- Safidio aloha ny Service --"}
              </option>
              {filteredTarifs.map(t => (
                <option key={t.id} value={t.id}>{t.libelle} - {t.prix} Ar</option>
              ))}
            </select>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button 
          type="submit" 
          style={{
            background: '#007a4d', color: '#fff', border: 'none', padding: '12px',
            borderRadius: '25px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '1rem'
          }}
        >
          Enregistrer la Commande
        </button>
      </form>
    </div>
  );
}