import React, { useEffect, useState } from 'react';

import {
  rechercherClients,
  createClient,
  getServices,
  getTarifs,
  createCommande,
} from '../services/api';

const steps = [
  'Client',
  'Service',
  'Tarif',
  'Détails',
  'Récapitulatif',
];

function AjoutCommandeWizard({
  onClose,
  onSuccess,
  commandeToEdit = null,
}) {
  const [step, setStep] = useState(1);

  /* =========================
     CLIENT
  ========================= */

  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [clientSelectionne, setClientSelectionne] = useState(null);

  const [showNewClient, setShowNewClient] = useState(false);

  const [newClient, setNewClient] = useState({
    nom: '',
    telephone: '',
  });

  /* =========================
     SERVICE / TARIF
  ========================= */

  const [services, setServices] = useState([]);
  const [tarifs, setTarifs] = useState([]);

  const [form, setForm] = useState({
    service: '',
    tarif: '',
    designation: '',
    quantite: 1,
    dateDebut: '',
    dateFin: '',
    heureDiffusion: '',
  });

  /* =========================
     ETATS
  ========================= */

  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTarifs, setLoadingTarifs] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /* =========================
     CHARGEMENT SERVICES
  ========================= */

  useEffect(() => {
    chargerServices();
  }, []);

  const chargerServices = async () => {
    try {
      setLoadingServices(true);

      const response = await getServices();

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setServices(data);
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les services.');
    } finally {
      setLoadingServices(false);
    }
  };

  /* =========================
     RECHERCHE CLIENT
  ========================= */

  useEffect(() => {
    if (!clientSearch.trim()) {
      setClients([]);
      return;
    }

    const timer = setTimeout(() => {
      rechercherClient(clientSearch);
    }, 250);

    return () => clearTimeout(timer);
  }, [clientSearch]);

  const rechercherClient = async (value) => {
    try {
      setLoadingClients(true);

      const response = await rechercherClients(value);

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setClients(data);
    } catch (err) {
      console.error(err);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  /* =========================
     CHARGEMENT TARIFS
  ========================= */

  useEffect(() => {
    if (!form.service) {
      setTarifs([]);
      return;
    }

    chargerTarifs(form.service);
  }, [form.service]);

  const chargerTarifs = async (serviceId) => {
    try {
      setLoadingTarifs(true);

      const response = await getTarifs(serviceId);

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      setTarifs(data);
    } catch (err) {
      console.error(err);
      setTarifs([]);
      setError('Impossible de charger les tarifs.');
    } finally {
      setLoadingTarifs(false);
    }
  };

  /* =========================
     SELECTION CLIENT
  ========================= */

  const selectionnerClient = (client) => {
    setClientSelectionne(client);
    setClientSearch(client.nom || '');
    setClients([]);
    setShowNewClient(false);
    setError('');
  };

  /* =========================
     NOUVEAU CLIENT
  ========================= */

  const handleNewClientChange = (e) => {
    const { name, value } = e.target;

    setNewClient((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError('');
  };

  const ajouterNouveauClient = async () => {
    if (!newClient.nom.trim()) {
      setError('Le nom du client est obligatoire.');
      return;
    }

    if (!newClient.telephone.trim()) {
      setError('Le téléphone du client est obligatoire.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await createClient({
        nom: newClient.nom,
        telephone: newClient.telephone,
      });

      setClientSelectionne(response.data);
      setClientSearch(response.data.nom || newClient.nom);

      setShowNewClient(false);
      setClients([]);

      setNewClient({
        nom: '',
        telephone: '',
      });

      setMessage('Client ajouté avec succès.');
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : 'Impossible de créer le client.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     CHANGEMENT FORMULAIRE
  ========================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError('');
  };

  /* =========================
     SERVICE SELECTIONNE
  ========================= */

  const serviceSelectionne = services.find(
    (service) =>
      String(service.id) === String(form.service)
  );

  /* =========================
     TARIF SELECTIONNE
  ========================= */

  const tarifSelectionne = tarifs.find(
    (tarif) =>
      String(tarif.id) === String(form.tarif)
  );

  const prixUnitaire = Number(
    tarifSelectionne?.prix || 0
  );

  const quantite = Math.max(
    1,
    Number(form.quantite || 1)
  );

  const montantTotal = prixUnitaire * quantite;

  /* =========================
     NAVIGATION
  ========================= */

  const nextStep = () => {
    setError('');
    setMessage('');

    if (step === 1 && !clientSelectionne) {
      setError('Veuillez sélectionner un client.');
      return;
    }

    if (step === 2 && !form.service) {
      setError('Veuillez sélectionner un service.');
      return;
    }

    if (step === 3 && !form.tarif) {
      setError('Veuillez sélectionner un tarif.');
      return;
    }

    if (step < 5) {
      setStep((prev) => prev + 1);
    }
  };

  const previousStep = () => {
    setError('');
    setMessage('');

    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  /* =========================
     ENREGISTREMENT COMMANDE
  ========================= */

  const enregistrerCommande = async () => {
    if (!clientSelectionne) {
      setError('Client manquant.');
      setStep(1);
      return;
    }

    if (!form.service) {
      setError('Service manquant.');
      setStep(2);
      return;
    }

    if (!form.tarif) {
      setError('Tarif manquant.');
      setStep(3);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      const utilisateurId =
        Number(localStorage.getItem('userId')) || 1;

      const data = {
        client: clientSelectionne.id,
        utilisateur: utilisateurId,
        statut: 'En cours',
        observation: '',

        lignes: [
          {
            service: Number(form.service),
            tarif: Number(form.tarif),
            designation: form.designation,
            quantite: quantite,
            prixUnitaire: prixUnitaire,
            dateDebut: form.dateDebut || null,
            dateFin: form.dateFin || null,
            heureDiffusion:
              form.heureDiffusion || null,
          },
        ],
      };

      await createCommande(data);

      setMessage(
        'Commande enregistrée avec succès.'
      );

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1200);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : 'Erreur lors de l’enregistrement de la commande.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wizard-overlay">

      <div className="wizard-container">

        {/* =========================
            HEADER
        ========================= */}

        <div className="wizard-header">

          <div>
            <h1 className="wizard-title">
              {commandeToEdit
                ? 'Modifier la commande'
                : 'Nouvelle commande'}
            </h1>

            <p className="wizard-subtitle">
              Enregistrement d’une prestation Radio Tsiry
            </p>
          </div>

          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        {/* =========================
            STEPPER SANS ICONE
        ========================= */}

        <div className="stepper">

          {steps.map((label, index) => {

            const currentStep = index + 1;

            const active =
              step === currentStep;

            const completed =
              step > currentStep;

            return (
              <React.Fragment key={label}>

                <button
                  type="button"
                  className={
                    'step-item ' +
                    (active ? 'active ' : '') +
                    (completed ? 'completed' : '')
                  }
                  onClick={() => {
                    if (completed) {
                      setStep(currentStep);
                    }
                  }}
                >
                  <span className="step-text">
                    {label}
                  </span>
                </button>

                {index < steps.length - 1 && (
                  <span
                    className={
                      'step-separator ' +
                      (step > currentStep
                        ? 'completed'
                        : '')
                    }
                  />
                )}

              </React.Fragment>
            );
          })}

        </div>

        {/* =========================
            CONTENU
        ========================= */}

        <div className="wizard-content">

          {/* =========================
              ETAPE 1 : CLIENT
          ========================= */}

          {step === 1 && (
            <div className="step-content">

              <div className="section-heading">
                <h2>Client</h2>

                <p>
                  Sélectionnez le client concerné par la commande.
                </p>
              </div>

              <div className="form-card">

                <label className="field-label">
                  Nom ou téléphone
                </label>

                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setClientSelectionne(null);
                    setMessage('');
                  }}
                  placeholder="Tapez le nom ou le téléphone du client..."
                  className="modern-input large-input"
                />

                {loadingClients && (
                  <div className="search-status">
                    Recherche en cours...
                  </div>
                )}

                {!loadingClients &&
                  clients.length > 0 && (

                    <div className="suggestions">

                      {clients.map((client) => (

                        <button
                          type="button"
                          key={client.id}
                          className="client-suggestion"
                          onClick={() =>
                            selectionnerClient(client)
                          }
                        >

                          <div className="client-suggestion-info">

                            <strong>
                              {client.nom}
                            </strong>

                            <span>
                              {client.telephone}
                            </span>

                          </div>

                          <span className="select-text">
                            Sélectionner
                          </span>

                        </button>

                      ))}

                      <button
                        type="button"
                        className="new-client-option"
                        onClick={() => {
                          setShowNewClient(true);
                          setClients([]);
                        }}
                      >
                        + Nouveau client
                      </button>

                    </div>
                  )}

                {!clientSelectionne &&
                  !showNewClient && (
                    <button
                      type="button"
                      className="new-client-button"
                      onClick={() =>
                        setShowNewClient(true)
                      }
                    >
                      + Ajouter un nouveau client
                    </button>
                  )}

              </div>

              {/* CLIENT SELECTIONNE */}

              {clientSelectionne && (
                <div className="selected-client">

                  <div className="selected-client-content">

                    <span className="selected-label">
                      CLIENT SÉLECTIONNÉ
                    </span>

                    <strong>
                      {clientSelectionne.nom}
                    </strong>

                    <span>
                      Téléphone :{' '}
                      {clientSelectionne.telephone}
                    </span>

                  </div>

                  <button
                    type="button"
                    className="change-button"
                    onClick={() => {
                      setClientSelectionne(null);
                      setClientSearch('');
                    }}
                  >
                    Changer
                  </button>

                </div>
              )}

              {/* NOUVEAU CLIENT */}

              {showNewClient && (
                <div className="new-client-card">

                  <div className="new-client-header">

                    <div>
                      <h3>
                        Nouveau client
                      </h3>

                      <p>
                        Seules les informations nécessaires sont demandées.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="small-close"
                      onClick={() =>
                        setShowNewClient(false)
                      }
                    >
                      ×
                    </button>

                  </div>

                  <div className="new-client-fields">

                    <div className="field-group">

                      <label className="field-label">
                        Nom *
                      </label>

                      <input
                        type="text"
                        name="nom"
                        value={newClient.nom}
                        onChange={handleNewClientChange}
                        placeholder="Nom du client"
                        className="modern-input"
                      />

                    </div>

                    <div className="field-group">

                      <label className="field-label">
                        Téléphone *
                      </label>

                      <input
                        type="text"
                        name="telephone"
                        value={newClient.telephone}
                        onChange={handleNewClientChange}
                        placeholder="034 XX XXX XX"
                        className="modern-input"
                      />

                    </div>

                  </div>

                  <div className="new-client-actions">

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setShowNewClient(false)
                      }
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={ajouterNouveauClient}
                      disabled={loading}
                    >
                      {loading
                        ? 'Enregistrement...'
                        : 'Ajouter le client'}
                    </button>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* =========================
              ETAPE 2 : SERVICE
          ========================= */}

          {step === 2 && (
            <div className="step-content">

              <div className="section-heading">
                <h2>Service</h2>

                <p>
                  Sélectionnez le service demandé par le client.
                </p>
              </div>

              {loadingServices ? (
                <div className="loading-box">
                  Chargement des services...
                </div>
              ) : services.length === 0 ? (
                <div className="empty-box">
                  Aucun service disponible.
                </div>
              ) : (

                <div className="service-list">

                  {services.map((service) => {

                    const selected =
                      String(form.service) ===
                      String(service.id);

                    return (
                      <button
                        type="button"
                        key={service.id}
                        className={
                          'service-card ' +
                          (selected
                            ? 'selected'
                            : '')
                        }
                        onClick={() => {

                          setForm((prev) => ({
                            ...prev,
                            service: String(
                              service.id
                            ),
                            tarif: '',
                          }));

                          setError('');
                        }}
                      >

                        <div className="service-name">

                          {service.nomService ||
                            service.nom ||
                            'Service'}

                        </div>

                        <div
                          className={
                            selected
                              ? 'service-status selected-status'
                              : 'service-status'
                          }
                        >
                          {selected
                            ? 'Sélectionné'
                            : 'Sélectionner'}
                        </div>

                      </button>
                    );
                  })}

                </div>
              )}

            </div>
          )}

          {/* =========================
              ETAPE 3 : TARIF
          ========================= */}

          {step === 3 && (
            <div className="step-content">

              <div className="section-heading">
                <h2>Tarif</h2>

                <p>
                  Sélectionnez le tarif correspondant au service.
                </p>
              </div>

              {serviceSelectionne && (
                <div className="service-selected-bar">

                  <span>
                    Service sélectionné
                  </span>

                  <strong>
                    {serviceSelectionne.nomService ||
                      serviceSelectionne.nom}
                  </strong>

                </div>
              )}

              {loadingTarifs ? (
                <div className="loading-box">
                  Chargement des tarifs...
                </div>
              ) : tarifs.length === 0 ? (
                <div className="empty-box">
                  Aucun tarif disponible pour ce service.
                </div>
              ) : (

                <div className="tarif-list">

                  {tarifs.map((tarif) => {

                    const selected =
                      String(form.tarif) ===
                      String(tarif.id);

                    return (
                      <button
                        type="button"
                        key={tarif.id}
                        className={
                          'tarif-card ' +
                          (selected
                            ? 'selected'
                            : '')
                        }
                        onClick={() => {

                          setForm((prev) => ({
                            ...prev,
                            tarif: String(
                              tarif.id
                            ),
                          }));

                          setError('');
                        }}
                      >

                        <div className="tarif-information">

                          <strong className="tarif-name">
                            {tarif.libelle ||
                              tarif.nom ||
                              tarif.description ||
                              'Tarif'}
                          </strong>

                          <span className="tarif-duration">

                            {tarif.duree
                              ? 'Durée : ' +
                                tarif.duree
                              : ''}

                            {tarif.unite
                              ? ' ' +
                                tarif.unite
                              : tarif.uniteFacturation
                              ? ' ' +
                                tarif.uniteFacturation
                              : ''}

                          </span>

                        </div>

                        <div className="tarif-price">

                          {Number(
                            tarif.prix || 0
                          ).toLocaleString(
                            'fr-FR'
                          )}{' '}
                          Ar

                        </div>

                      </button>
                    );
                  })}

                </div>
              )}

            </div>
          )}

          {/* =========================
              ETAPE 4 : DETAILS
          ========================= */}

          {step === 4 && (
            <div className="step-content">

              <div className="section-heading">
                <h2>Détails</h2>

                <p>
                  Complétez les informations de la prestation.
                </p>
              </div>

              <div className="details-card">

                <div className="field-group full-width">

                  <label className="field-label">
                    Désignation
                  </label>

                  <textarea
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    placeholder="Décrivez la prestation demandée..."
                    className="modern-textarea"
                    rows="5"
                  />

                </div>

                <div className="details-grid">

                  <div className="field-group">

                    <label className="field-label">
                      Quantité
                    </label>

                    <input
                      type="number"
                      name="quantite"
                      min="1"
                      value={form.quantite}
                      onChange={handleChange}
                      className="modern-input"
                    />

                  </div>

                  <div className="field-group">

                    <label className="field-label">
                      Heure de diffusion
                    </label>

                    <input
                      type="time"
                      name="heureDiffusion"
                      value={form.heureDiffusion}
                      onChange={handleChange}
                      className="modern-input"
                    />

                  </div>

                  <div className="field-group">

                    <label className="field-label">
                      Date début
                    </label>

                    <input
                      type="date"
                      name="dateDebut"
                      value={form.dateDebut}
                      onChange={handleChange}
                      className="modern-input"
                    />

                  </div>

                  <div className="field-group">

                    <label className="field-label">
                      Date fin
                    </label>

                    <input
                      type="date"
                      name="dateFin"
                      value={form.dateFin}
                      onChange={handleChange}
                      className="modern-input"
                    />

                  </div>

                </div>

              </div>

              <div className="total-preview">

                <div className="total-line">

                  <span>
                    Prix unitaire
                  </span>

                  <strong>
                    {prixUnitaire.toLocaleString(
                      'fr-FR'
                    )}{' '}
                    Ar
                  </strong>

                </div>

                <div className="total-line">

                  <span>
                    Quantité
                  </span>

                  <strong>
                    {quantite}
                  </strong>

                </div>

                <div className="total-final">

                  <span>
                    Montant total
                  </span>

                  <strong>
                    {montantTotal.toLocaleString(
                      'fr-FR'
                    )}{' '}
                    Ar
                  </strong>

                </div>

              </div>

            </div>
          )}

          {/* =========================
              ETAPE 5 : RECAP
          ========================= */}

          {step === 5 && (
            <div className="step-content">

              <div className="section-heading">
                <h2>Récapitulatif</h2>

                <p>
                  Vérifiez les informations avant l’enregistrement.
                </p>
              </div>

              <div className="recap-card">

                <div className="recap-row">

                  <span>
                    Client
                  </span>

                  <strong>
                    {clientSelectionne?.nom || '-'}
                  </strong>

                </div>

                <div className="recap-row">

                  <span>
                    Téléphone
                  </span>

                  <strong>
                    {clientSelectionne?.telephone ||
                      '-'}
                  </strong>

                </div>

                <div className="recap-row">

                  <span>
                    Service
                  </span>

                  <strong>
                    {serviceSelectionne?.nomService ||
                      serviceSelectionne?.nom ||
                      '-'}
                  </strong>

                </div>

                <div className="recap-row">

                  <span>
                    Tarif
                  </span>

                  <strong>
                    {tarifSelectionne?.libelle ||
                      tarifSelectionne?.nom ||
                      tarifSelectionne?.description ||
                      '-'}
                  </strong>

                </div>

                <div className="recap-row">

                  <span>
                    Désignation
                  </span>

                  <strong>
                    {form.designation || '-'}
                  </strong>

                </div>

                <div className="recap-details">

                  <div>
                    <span>
                      Date début
                    </span>

                    <strong>
                      {form.dateDebut || '-'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Date fin
                    </span>

                    <strong>
                      {form.dateFin || '-'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Heure
                    </span>

                    <strong>
                      {form.heureDiffusion || '-'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Quantité
                    </span>

                    <strong>
                      {quantite}
                    </strong>
                  </div>

                </div>

                <div className="recap-total">

                  <span>
                    Montant total
                  </span>

                  <strong>
                    {montantTotal.toLocaleString(
                      'fr-FR'
                    )}{' '}
                    Ar
                  </strong>

                </div>

              </div>

              <div className="invoice-notice">

                <strong>
                  Facture
                </strong>

                <p>
                  La facture sera générée ultérieurement
                  depuis la liste des commandes.
                </p>

              </div>

            </div>
          )}

        </div>

        {/* =========================
            MESSAGE ERREUR
        ========================= */}

        {error && (
          <div className="message error-message">
            {error}
          </div>
        )}

        {message && (
          <div className="message success-message">
            {message}
          </div>
        )}

        {/* =========================
            FOOTER
        ========================= */}

        <div className="wizard-footer">

          <button
            type="button"
            className="secondary-button"
            onClick={
              step === 1
                ? onClose
                : previousStep
            }
          >
            {step === 1
              ? 'Annuler'
              : '← Précédent'}
          </button>

          <span className="step-counter">
            Étape {step} / {steps.length}
          </span>

          {step < 5 ? (

            <button
              type="button"
              className="primary-button"
              onClick={nextStep}
            >
              Suivant →
            </button>

          ) : (

            <button
              type="button"
              className="primary-button save-button"
              onClick={enregistrerCommande}
              disabled={loading}
            >
              {loading
                ? 'Enregistrement...'
                : 'Enregistrer la commande'}
            </button>

          )}

        </div>

      </div>

      {/* =========================
          CSS
      ========================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .wizard-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 25px;

          background: rgba(15, 23, 42, 0.68);
          backdrop-filter: blur(5px);

          overflow-y: auto;
        }

        .wizard-container {
          width: 100%;
          max-width: 1080px;
          max-height: 94vh;

          overflow-y: auto;

          background: #ffffff;

          border-radius: 22px;

          box-shadow:
            0 25px 70px rgba(0, 0, 0, 0.25);

          color: #172033;
        }

        /* HEADER */

        .wizard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 30px 38px;

          border-bottom: 1px solid #e5e7eb;
        }

        .wizard-title {
          margin: 0;

          font-size: 30px;
          line-height: 1.2;

          font-weight: 800;

          color: #12372a;
        }

        .wizard-subtitle {
          margin: 8px 0 0;

          font-size: 16px;

          color: #64748b;
        }

        .close-button {
          width: 44px;
          height: 44px;

          border: none;
          border-radius: 10px;

          background: #f1f5f9;

          color: #475569;

          font-size: 29px;

          cursor: pointer;

          transition: 0.2s;
        }

        .close-button:hover {
          background: #e2e8f0;
          color: #172033;
        }

        /* STEPPER */

        .stepper {
          display: flex;
          align-items: center;

          padding: 22px 38px;

          background: #f7faf8;

          border-bottom: 1px solid #e2e8e5;

          overflow-x: auto;
        }

        .step-item {
          border: none;
          background: transparent;

          padding: 8px 5px;

          color: #8a9992;

          font-size: 16px;
          font-weight: 700;

          white-space: nowrap;

          cursor: default;
        }

        .step-item.active {
          color: #087f5b;
        }

        .step-item.completed {
          color: #087f5b;
          cursor: pointer;
        }

        .step-text {
          display: inline-block;
        }

        .step-separator {
          width: 45px;
          height: 2px;

          margin: 0 10px;

          background: #d5ddd9;

          flex-shrink: 0;
        }

        .step-separator.completed {
          background: #087f5b;
        }

        /* CONTENT */

        .wizard-content {
          padding: 38px 42px;

          min-height: 480px;
        }

        .step-content {
          animation: showStep 0.22s ease;
        }

        @keyframes showStep {

          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }

        }

        .section-heading {
          margin-bottom: 28px;
        }

        .section-heading h2 {
          margin: 0;

          color: #12372a;

          font-size: 27px;
          font-weight: 800;
        }

        .section-heading p {
          margin: 8px 0 0;

          color: #64748b;

          font-size: 16px;
          line-height: 1.5;
        }

        /* FORM */

        .form-card {
          padding: 28px;

          background: #f8faf9;

          border: 1px solid #dfe8e3;

          border-radius: 17px;
        }

        .field-label {
          display: block;

          margin-bottom: 9px;

          color: #334155;

          font-size: 16px;
          font-weight: 750;
        }

        .modern-input,
        .modern-textarea {
          width: 100%;

          border: 1px solid #cbd5d0;
          border-radius: 11px;

          background: #ffffff;

          color: #172033;

          padding: 14px 16px;

          font-family: inherit;

          font-size: 16px;

          outline: none;

          transition: 0.2s;
        }

        .large-input {
          padding: 16px 18px;

          font-size: 17px;
        }

        .modern-input:focus,
        .modern-textarea:focus {
          border-color: #087f5b;

          box-shadow:
            0 0 0 4px
            rgba(8, 127, 91, 0.11);
        }

        .modern-textarea {
          resize: vertical;

          line-height: 1.5;
        }

        .field-group {
          width: 100%;
        }

        .full-width {
          width: 100%;
        }

        /* CLIENT SEARCH */

        .search-status {
          margin-top: 10px;

          color: #64748b;

          font-size: 14px;
        }

        .suggestions {
          position: relative;

          margin-top: 8px;

          border: 1px solid #d9e3de;

          border-radius: 13px;

          background: #ffffff;

          overflow: hidden;

          box-shadow:
            0 12px 30px
            rgba(15, 23, 42, 0.10);
        }

        .client-suggestion {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 17px 18px;

          border: none;
          border-bottom: 1px solid #edf1ef;

          background: #ffffff;

          text-align: left;

          cursor: pointer;

          transition: 0.2s;
        }

        .client-suggestion:hover {
          background: #f1faf6;
        }

        .client-suggestion-info {
          display: flex;
          flex-direction: column;

          gap: 5px;
        }

        .client-suggestion-info strong {
          color: #172033;

          font-size: 17px;
        }

        .client-suggestion-info span {
          color: #64748b;

          font-size: 14px;
        }

        .select-text {
          color: #087f5b;

          font-size: 14px;
          font-weight: 750;
        }

        .new-client-option {
          width: 100%;

          padding: 17px;

          border: none;

          background: #f7faf8;

          color: #087f5b;

          text-align: left;

          font-size: 16px;
          font-weight: 800;

          cursor: pointer;
        }

        .new-client-option:hover {
          background: #edf8f3;
        }

        .new-client-button {
          margin-top: 18px;

          padding: 13px 18px;

          border: 1px solid #087f5b;
          border-radius: 10px;

          background: #ffffff;

          color: #087f5b;

          font-size: 15px;
          font-weight: 750;

          cursor: pointer;
        }

        .new-client-button:hover {
          background: #f0faf5;
        }

        /* SELECTED CLIENT */

        .selected-client {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-top: 20px;

          padding: 20px 22px;

          background: #edf8f3;

          border: 1px solid #b9ddce;

          border-radius: 15px;
        }

        .selected-client-content {
          display: flex;
          flex-direction: column;

          gap: 5px;
        }

        .selected-label {
          color: #087f5b;

          font-size: 12px;
          font-weight: 800;

          letter-spacing: 0.5px;
        }

        .selected-client-content strong {
          color: #12372a;

          font-size: 19px;
        }

        .selected-client-content span:last-child {
          color: #64748b;

          font-size: 14px;
        }

        .change-button {
          padding: 10px 15px;

          border: 1px solid #b9ddce;
          border-radius: 9px;

          background: #ffffff;

          color: #087f5b;

          font-size: 14px;
          font-weight: 750;

          cursor: pointer;
        }

        /* NEW CLIENT */

        .new-client-card {
          margin-top: 22px;

          border: 1px solid #d8e2dd;

          border-radius: 17px;

          overflow: hidden;

          background: #ffffff;
        }

        .new-client-header {
          display: flex;
          justify-content: space-between;

          padding: 22px 25px;

          background: #f7faf8;

          border-bottom: 1px solid #e1e8e4;
        }

        .new-client-header h3 {
          margin: 0;

          color: #12372a;

          font-size: 20px;
        }

        .new-client-header p {
          margin: 6px 0 0;

          color: #64748b;

          font-size: 14px;
        }

        .small-close {
          width: 34px;
          height: 34px;

          border: none;
          border-radius: 8px;

          background: #ffffff;

          color: #64748b;

          font-size: 22px;

          cursor: pointer;
        }

        .new-client-fields {
          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 20px;

          padding: 25px;
        }

        .new-client-actions {
          display: flex;
          justify-content: flex-end;

          gap: 12px;

          padding: 18px 25px;

          background: #f7faf8;

          border-top: 1px solid #e1e8e4;
        }

        /* SERVICES */

        .service-list {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 16px;
        }

        .service-card {
          min-height: 115px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 23px;

          border: 1px solid #d8e2dd;
          border-radius: 15px;

          background: #ffffff;

          text-align: left;

          cursor: pointer;

          transition: 0.2s;
        }

        .service-card:hover {
          border-color: #7dbba4;

          transform: translateY(-2px);

          box-shadow:
            0 8px 22px
            rgba(15, 23, 42, 0.08);
        }

        .service-card.selected {
          border: 2px solid #087f5b;

          background: #f0faf5;
        }

        .service-name {
          color: #172033;

          font-size: 17px;
          font-weight: 800;
        }

        .service-status {
          color: #94a3b8;

          font-size: 13px;
          font-weight: 700;
        }

        .selected-status {
          color: #087f5b;
        }

        /* TARIFS */

        .service-selected-bar {
          display: flex;
          align-items: center;
          gap: 9px;

          margin-bottom: 20px;

          padding: 15px 18px;

          border-radius: 11px;

          background: #edf8f3;

          color: #64748b;

          font-size: 15px;
        }

        .service-selected-bar strong {
          color: #087f5b;

          font-size: 16px;
        }

        .tarif-list {
          display: flex;

          flex-direction: column;

          gap: 12px;
        }

        .tarif-card {
          width: 100%;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 20px;

          border: 1px solid #d8e2dd;
          border-radius: 14px;

          background: #ffffff;

          text-align: left;

          cursor: pointer;

          transition: 0.2s;
        }

        .tarif-card:hover {
          border-color: #7dbba4;

          background: #f8fcfa;
        }

        .tarif-card.selected {
          border: 2px solid #087f5b;

          background: #f0faf5;
        }

        .tarif-information {
          display: flex;

          flex-direction: column;

          gap: 6px;
        }

        .tarif-name {
          color: #172033;

          font-size: 17px;
          font-weight: 800;
        }

        .tarif-duration {
          color: #64748b;

          font-size: 14px;
        }

        .tarif-price {
          color: #087f5b;

          font-size: 19px;
          font-weight: 900;

          white-space: nowrap;
        }

        /* DETAILS */

        .details-card {
          display: flex;

          flex-direction: column;

          gap: 24px;

          padding: 28px;

          border: 1px solid #dce5e0;

          border-radius: 17px;

          background: #f8faf9;
        }

        .details-grid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 21px;
        }

        /* TOTAL */

        .total-preview {
          margin-top: 22px;

          border: 1px solid #b9ddce;

          border-radius: 15px;

          overflow: hidden;

          background: #f5fbf8;
        }

        .total-line {
          display: flex;

          align-items: center;
          justify-content: space-between;

          padding: 15px 21px;

          border-bottom: 1px solid #dcebe4;

          font-size: 15px;
        }

        .total-line span {
          color: #64748b;
        }

        .total-line strong {
          color: #334155;

          font-size: 16px;
        }

        .total-final {
          display: flex;

          align-items: center;
          justify-content: space-between;

          padding: 21px;

          background: #e7f6ef;

          color: #12372a;

          font-size: 18px;
          font-weight: 800;
        }

        .total-final strong {
          color: #087f5b;

          font-size: 25px;
        }

        /* RECAP */

        .recap-card {
          border: 1px solid #dce5e0;

          border-radius: 17px;

          overflow: hidden;

          background: #ffffff;
        }

        .recap-row {
          display: flex;

          align-items: flex-start;
          justify-content: space-between;

          gap: 30px;

          padding: 19px 23px;

          border-bottom: 1px solid #edf1ef;
        }

        .recap-row span {
          color: #64748b;

          font-size: 15px;
        }

        .recap-row strong {
          max-width: 65%;

          color: #172033;

          font-size: 16px;

          text-align: right;
        }

        .recap-details {
          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 15px;

          padding: 20px 23px;

          background: #f7faf8;
        }

        .recap-details div {
          display: flex;

          flex-direction: column;

          gap: 6px;
        }

        .recap-details span {
          color: #64748b;

          font-size: 13px;
        }

        .recap-details strong {
          color: #172033;

          font-size: 15px;
        }

        .recap-total {
          display: flex;

          align-items: center;
          justify-content: space-between;

          padding: 23px;

          background: #e7f6ef;

          color: #12372a;

          font-size: 18px;
          font-weight: 800;
        }

        .recap-total strong {
          color: #087f5b;

          font-size: 26px;
        }

        .invoice-notice {
          margin-top: 20px;

          padding: 18px 20px;

          border-left: 4px solid #087f5b;

          border-radius: 9px;

          background: #f3f8f6;
        }

        .invoice-notice strong {
          color: #12372a;

          font-size: 16px;
        }

        .invoice-notice p {
          margin: 6px 0 0;

          color: #64748b;

          font-size: 14px;

          line-height: 1.5;
        }

        /* LOADING */

        .loading-box,
        .empty-box {
          padding: 55px 25px;

          border: 1px dashed #cbd5d0;

          border-radius: 15px;

          background: #f8faf9;

          color: #64748b;

          text-align: center;

          font-size: 16px;
        }

        /* MESSAGES */

        .message {
          margin: 0 42px 20px;

          padding: 15px 18px;

          border-radius: 10px;

          font-size: 15px;
          line-height: 1.5;
        }

        .error-message {
          background: #fff1f2;

          border: 1px solid #fecdd3;

          color: #be123c;
        }

        .success-message {
          background: #edf8f3;

          border: 1px solid #b9ddce;

          color: #087f5b;
        }

        /* FOOTER */

        .wizard-footer {
          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 15px;

          padding: 22px 42px;

          border-top: 1px solid #e5e9e7;

          background: #ffffff;
        }

        .step-counter {
          color: #64748b;

          font-size: 15px;
          font-weight: 700;
        }

        .primary-button,
        .secondary-button {
          min-height: 47px;

          padding: 12px 22px;

          border-radius: 10px;

          font-family: inherit;

          font-size: 16px;
          font-weight: 800;

          cursor: pointer;

          transition: 0.2s;
        }

        .primary-button {
          border: 1px solid #087f5b;

          background: #087f5b;

          color: #ffffff;

          box-shadow:
            0 6px 16px
            rgba(8, 127, 91, 0.20);
        }

        .primary-button:hover {
          background: #066b4d;

          border-color: #066b4d;

          transform: translateY(-1px);
        }

        .primary-button:disabled {
          opacity: 0.6;

          cursor: not-allowed;

          transform: none;
        }

        .secondary-button {
          border: 1px solid #cbd5d0;

          background: #ffffff;

          color: #475569;
        }

        .secondary-button:hover {
          background: #f4f7f5;
        }

        .save-button {
          padding-left: 27px;
          padding-right: 27px;
        }

        /* RESPONSIVE */

        @media (max-width: 850px) {

          .wizard-overlay {
            padding: 10px;
          }

          .wizard-container {
            max-height: 97vh;
          }

          .wizard-header,
          .wizard-content,
          .wizard-footer {
            padding-left: 22px;
            padding-right: 22px;
          }

          .stepper {
            padding-left: 22px;
            padding-right: 22px;
          }

          .service-list {
            grid-template-columns: 1fr;
          }

          .recap-details {
            grid-template-columns: 1fr 1fr;
          }

        }

        @media (max-width: 600px) {

          .wizard-title {
            font-size: 24px;
          }

          .wizard-subtitle {
            font-size: 14px;
          }

          .new-client-fields,
          .details-grid {
            grid-template-columns: 1fr;
          }

          .recap-details {
            grid-template-columns: 1fr;
          }

          .recap-row {
            flex-direction: column;
            gap: 7px;
          }

          .recap-row strong {
            max-width: 100%;
            text-align: left;
          }

          .wizard-footer {
            flex-wrap: wrap;
          }

          .step-counter {
            width: 100%;
            order: 3;
            text-align: center;
          }

          .step-separator {
            width: 25px;
          }

        }

      `}</style>

    </div>
  );
}

export default AjoutCommandeWizard;