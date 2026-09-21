import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const GestionIntegrale = () => {
  const [step, setStep] = useState(1);

  // Étape 1 : Client
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [nomClient, setNomClient] = useState('');
  const [telephone, setTelephone] = useState('');

  // Étape 2 : Service & Tarif
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [tarifs, setTarifs] = useState([]);
  const [selectedTarif, setSelectedTarif] = useState('');

  // Étape 3 : Quantité & Audio
  const [quantite, setQuantite] = useState(1);
  const [audioTitre, setAudioTitre] = useState('');

  useEffect(() => {
    fetchClients();
    fetchServices();
  }, []);

  const fetchClients = async () => {
    const res = await API.get('clients/');
    setClients(res.data);
  };

  const fetchServices = async () => {
    const res = await API.get('services/');
    setServices(res.data);
  };

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    setSelectedService(serviceId);
    const service = services.find(s => s.id === parseInt(serviceId));
    setTarifs(service ? service.tarifs : []);
  };

  const handleNext = () => setStep(step + 1);
  const handlePrev = () => setStep(step - 1);

  const handleFinalSubmit = async () => {
    try {
      let clientId = selectedClient;
      if (!clientId && nomClient) {
        const clientRes = await API.post('clients/', { nom: nomClient, telephone });
        clientId = clientRes.data.id;
      }

      const commandeRes = await API.post('commandes/', {
        client: clientId,
        statut_paiement: 'NON_PAYE'
      });

      alert('Commande et enregistrement dans la Base de Données effectués avec succès !');
      setStep(1);
    } catch (err) {
      alert('Erreur lors de l\'enregistrement.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#007A4D', textAlign: 'center', marginBottom: '1.5rem' }}>
        Assistant de Traitement Général (Étape {step} sur 4)
      </h2>

      {/* Bar de Progression */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '2px solid #CBD5E1', paddingBottom: '0.5rem' }}>
        <span style={{ fontWeight: step === 1 ? 'bold' : 'normal', color: step === 1 ? '#007A4D' : '#64748B' }}>1. Client</span>
        <span style={{ fontWeight: step === 2 ? 'bold' : 'normal', color: step === 2 ? '#007A4D' : '#64748B' }}>2. Service & Tarif</span>
        <span style={{ fontWeight: step === 3 ? 'bold' : 'normal', color: step === 3 ? '#007A4D' : '#64748B' }}>3. Audio & Commande</span>
        <span style={{ fontWeight: step === 4 ? 'bold' : 'normal', color: step === 4 ? '#007A4D' : '#64748B' }}>4. Facture</span>
      </div>

      {/* ÉTAPE 1 : CLIENT */}
      {step === 1 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Informations du Client</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Sélectionner un Client existant :</label>
            <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} style={inputStyle}>
              <option value="">-- Choisir un client --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.telephone})</option>)}
            </select>
          </div>
          <p style={{ textAlign: 'center', margin: '1rem 0', fontWeight: 'bold' }}>OU</p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Nouveau Client (Nom) :</label>
            <input type="text" value={nomClient} onChange={(e) => setNomClient(e.target.value)} style={inputStyle} placeholder="Nom du nouveau client" />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Téléphone :</label>
            <input type="text" value={telephone} onChange={(e) => setTelephone(e.target.value)} style={inputStyle} placeholder="Numéro de téléphone" />
          </div>
        </div>
      )}

      {/* ÉTAPE 2 : SERVICE & TARIF */}
      {step === 2 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Choix du Service et Tarif</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Service :</label>
            <select value={selectedService} onChange={handleServiceChange} style={inputStyle}>
              <option value="">-- Choisir un service --</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.nom_service}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Tarif associé :</label>
            <select value={selectedTarif} onChange={(e) => setSelectedTarif(e.target.value)} style={inputStyle}>
              <option value="">-- Choisir un tarif --</option>
              {tarifs.map(t => <option key={t.id} value={t.id}>{t.libelle} - {t.prix_unitaire} Ariary</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : AUDIO & QUANTITÉ */}
      {step === 3 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Détails de la Commande & Audio</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Quantité de diffusions :</label>
            <input type="number" min="1" value={quantite} onChange={(e) => setQuantite(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem' }}>Titre de l'audio :</label>
            <input type="text" value={audioTitre} onChange={(e) => setAudioTitre(e.target.value)} style={inputStyle} placeholder="Nom du spot audio" />
          </div>
        </div>
      )}

      {/* ÉTAPE 4 : RECAPITULATIF FACTURE */}
      {step === 4 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Validation & Aperçu Facture</h3>
          <div style={{ backgroundColor: '#F1F5F9', padding: '1.5rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
            <p><strong>Client :</strong> {nomClient || 'Client sélectionné'}</p>
            <p><strong>Quantité :</strong> {quantite}</p>
            <p><strong>Statut :</strong> Non Payé</p>
          </div>
        </div>
      )}

      {/* BOUTONS NAVIGATIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        {step > 1 && <button onClick={handlePrev} style={btnGrayStyle}>Précédent</button>}
        {step < 4 ? (
          <button onClick={handleNext} style={btnGreenStyle}>Suivant</button>
        ) : (
          <button onClick={handleFinalSubmit} style={btnGreenStyle}>Enregistrer dans la Base de Données</button>
        )}
      </div>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #CBD5E1', boxSizing: 'border-box' };
const btnGreenStyle = { padding: '0.6rem 1.2rem', backgroundColor: '#007A4D', color: '#FFF', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' };
const btnGrayStyle = { padding: '0.6rem 1.2rem', backgroundColor: '#64748B', color: '#FFF', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' };

export default GestionIntegrale;