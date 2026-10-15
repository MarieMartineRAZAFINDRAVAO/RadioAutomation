import React, { useEffect, useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function ModalPadOriginal({
  isOpen,
  onClose,
  fichierAudio,
  darkMode = false,
}) {
  const [etape, setEtape] = useState(1);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const [configs, setConfigs] = useState([]);
  const [chargementConfigs, setChargementConfigs] = useState(true);
  const [configChoisie, setConfigChoisie] = useState(null);
  const [configIdChoisie, setConfigIdChoisie] = useState('');

  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  const [newNomReseau, setNewNomReseau] = useState('');
  const [newDossier, setNewDossier] = useState('');
  const [newNomUtilisateur, setNewNomUtilisateur] = useState('');
  const [newMotDePasse, setNewMotDePasse] = useState('');

  const couleurs = {
    fondModal: darkMode ? '#27272A' : '#FFFFFF',
    texte: darkMode ? '#F4F4F5' : '#1F2937',
    texteSecondaire: darkMode ? '#A1A1AA' : '#6B7280',
    bordure: darkMode ? '#3F3F46' : '#DDE8E2',
    vert: '#007A4D',
    vertClair: darkMode ? '#164E3B' : '#EAF7F1',
    rouge: '#DC2626',
    rougeFond: darkMode ? '#3B1818' : '#FEF2F2',
  };

  useEffect(() => {
    if (isOpen) {
      setEtape(1);
      setErreur('');
      setConfigChoisie(null);
      setConfigIdChoisie('');
      setNomUtilisateur('');
      setMotDePasse('');
      setNewNomReseau('');
      setNewDossier('');
      setNewNomUtilisateur('');
      setNewMotDePasse('');
      chargerConfigs();
    }
  }, [isOpen]);

  const chargerConfigs = async () => {
    try {
      setChargementConfigs(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/pad-configs/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error('Impossible de charger les réseaux.');
      const data = await response.json();
      const liste = Array.isArray(data) ? data : data.results || [];
      setConfigs(liste);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargementConfigs(false);
    }
  };

  const choisirReseau = (id) => {
    setConfigIdChoisie(id);
    const config = configs.find((c) => String(c.idPadConfig) === String(id));
    setConfigChoisie(config || null);
    setErreur('');
  };

  const passerEtape2 = () => {
    if (!configChoisie) {
      setErreur('Veuillez sélectionner un réseau.');
      return;
    }
    setErreur('');
    // ═══ LAISSER VIDE — le mpampiasa no manoratra ═══
    setNomUtilisateur('');
    setMotDePasse('');
    setEtape(2);
  };

  const seConnecter = async () => {
    if (!nomUtilisateur.trim() || !motDePasse.trim()) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }
    setErreur('');
    setChargement(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/pad-configs/${configChoisie.idPadConfig}/tester/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            nomUtilisateur: nomUtilisateur.trim(),
            motDePasse: motDePasse.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setEtape(4);
      } else {
        setErreur(data?.error || data?.message || 'Échec de connexion.');
      }
    } catch (err) {
      setErreur(err.message || 'Impossible de contacter le serveur.');
    } finally {
      setChargement(false);
    }
  };

  const creerReseau = async () => {
    if (
      !newNomReseau.trim() ||
      !newDossier.trim() ||
      !newNomUtilisateur.trim() ||
      !newMotDePasse.trim()
    ) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }

    setErreur('');
    setChargement(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/pad-configs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nomReseau: newNomReseau.trim(),
          dossier: newDossier.trim(),
          nomUtilisateur: newNomUtilisateur.trim(),
          motDePasse: newMotDePasse.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData?.error ||
            errData?.detail ||
            "Impossible de créer le réseau."
        );
      }

      const nouveau = await response.json();
      await chargerConfigs();
      setConfigIdChoisie(String(nouveau.idPadConfig));
      setConfigChoisie(nouveau);
      setNewNomReseau('');
      setNewDossier('');
      setNewNomUtilisateur('');
      setNewMotDePasse('');
      setEtape(1);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  };

  const accederPad = () => {
    if (!configChoisie) return;
    const chemin = `\\\\${configChoisie.nomReseau}\\${configChoisie.dossier}`;
    window.open(`file://${chemin}`, '_blank');
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px 16px',
    borderRadius: '10px',
    border: `1.5px solid ${couleurs.bordure}`,
    backgroundColor: darkMode ? '#18181B' : '#F9FAFB',
    color: couleurs.texte,
    fontSize: '15px',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 700,
    fontSize: '14px',
    color: couleurs.texte,
  };

  const boutonPrimaire = {
    border: 'none',
    backgroundColor: couleurs.vert,
    color: '#FFFFFF',
    padding: '13px 26px',
    borderRadius: '10px',
    cursor: chargement ? 'wait' : 'pointer',
    fontWeight: 800,
    fontSize: '15px',
    boxShadow: '0 6px 16px rgba(0,122,77,0.28)',
    opacity: chargement ? 0.7 : 1,
  };

  const boutonSecondaire = {
    border: `1.5px solid ${couleurs.bordure}`,
    backgroundColor: 'transparent',
    color: couleurs.texte,
    padding: '13px 24px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '15px',
  };

  const etapeVisuelle = etape === 4 ? 3 : etape;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: couleurs.fondModal,
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          color: couleurs.texte,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #007A4D 0%, #005C3A 100%)',
            padding: '26px 30px',
            color: '#FFFFFF',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              🌐
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>
                Envoyer vers PAD Original
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 600,
                }}
              >
                {fichierAudio?.nomFichier || 'Fichier audio'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              fontSize: '18px',
              cursor: 'pointer',
              fontWeight: 800,
            }}
          >
            ✕
          </button>

          <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor:
                    etapeVisuelle >= n ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ padding: '30px' }}>
          {erreur && (
            <div
              style={{
                marginBottom: '20px',
                padding: '14px 18px',
                backgroundColor: couleurs.rougeFond,
                border: `1px solid ${couleurs.rouge}`,
                color: couleurs.rouge,
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              ⚠️ {erreur}
            </div>
          )}

          {etape === 1 && (
            <div>
              <h3
                style={{
                  margin: '0 0 6px',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: couleurs.vert,
                }}
              >
                Choisir un réseau
              </h3>
              <p
                style={{
                  margin: '0 0 24px',
                  fontSize: '14px',
                  color: couleurs.texteSecondaire,
                  lineHeight: 1.5,
                }}
              >
                Sélectionnez le réseau PAD auquel vous souhaitez vous connecter.
              </p>

              {chargementConfigs ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '30px',
                    color: couleurs.texteSecondaire,
                  }}
                >
                  Chargement des réseaux...
                </div>
              ) : configs.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '30px 20px',
                    border: `1.5px dashed ${couleurs.bordure}`,
                    borderRadius: '12px',
                    color: couleurs.texteSecondaire,
                    fontSize: '14px',
                  }}
                >
                  ⚠️ Aucun réseau configuré.
                  <br />
                  Cliquez sur "Créer un réseau" ci-dessous.
                </div>
              ) : (
                <>
                  <label style={labelStyle}>Réseau</label>
                  <select
                    value={configIdChoisie}
                    onChange={(e) => choisirReseau(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="">— Sélectionner un réseau —</option>
                    {configs.map((c) => (
                      <option key={c.idPadConfig} value={c.idPadConfig}>
                        {c.nomReseau} ({c.dossier})
                      </option>
                    ))}
                  </select>

                  {configChoisie && (
                    <div
                      style={{
                        marginTop: '18px',
                        padding: '16px',
                        backgroundColor: couleurs.vertClair,
                        borderRadius: '12px',
                        border: `1px solid ${couleurs.bordure}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: couleurs.vert,
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Détails du réseau
                      </div>
                      <div style={{ fontSize: '14px', lineHeight: 1.7 }}>
                        <div>
                          <strong>Nom :</strong> {configChoisie.nomReseau}
                        </div>
                        <div>
                          <strong>Dossier :</strong> {configChoisie.dossier}
                        </div>
                        <div>
                          <strong>Utilisateur :</strong>{' '}
                          {configChoisie.nomUtilisateur}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: `1px solid ${couleurs.bordure}`,
                  textAlign: 'center',
                  fontSize: '14px',
                  color: couleurs.texteSecondaire,
                }}
              >
                Vous n'avez pas de compte ?{' '}
                <span
                  onClick={() => {
                    setErreur('');
                    setEtape(3);
                  }}
                  style={{
                    color: couleurs.vert,
                    fontWeight: 800,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Créer un réseau
                </span>
              </div>
            </div>
          )}

          {etape === 2 && configChoisie && (
            <div>
              <h3
                style={{
                  margin: '0 0 6px',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: couleurs.vert,
                }}
              >
                Authentification
              </h3>
              <p
                style={{
                  margin: '0 0 24px',
                  fontSize: '14px',
                  color: couleurs.texteSecondaire,
                  lineHeight: 1.5,
                }}
              >
                Entrez vos informations d'identification pour le réseau{' '}
                <strong>{configChoisie.nomReseau}</strong>.
              </p>

              <div style={{ marginBottom: '18px' }}>
                <label style={labelStyle}>Nom d'utilisateur</label>
                <input
                  type="text"
                  value={nomUtilisateur}
                  onChange={(e) => setNomUtilisateur(e.target.value)}
                  placeholder="Nom d'utilisateur réseau"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Mot de passe</label>
                <input
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>

              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: couleurs.vertClair,
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: couleurs.texteSecondaire,
                  fontWeight: 600,
                }}
              >
                💡 Le système testera la connexion avant d'accéder au PAD.
              </div>
            </div>
          )}

          {etape === 3 && (
            <div>
              <h3
                style={{
                  margin: '0 0 6px',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: couleurs.vert,
                }}
              >
                Créer un réseau
              </h3>
              <p
                style={{
                  margin: '0 0 24px',
                  fontSize: '14px',
                  color: couleurs.texteSecondaire,
                  lineHeight: 1.5,
                }}
              >
                Enregistrez un nouveau réseau PAD.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Nom du réseau</label>
                <input
                  type="text"
                  value={newNomReseau}
                  onChange={(e) => setNewNomReseau(e.target.value)}
                  placeholder="ex : onair"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Dossier partagé</label>
                <input
                  type="text"
                  value={newDossier}
                  onChange={(e) => setNewDossier(e.target.value)}
                  placeholder="ex : \\\\onair\\z"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Nom d'utilisateur</label>
                <input
                  type="text"
                  value={newNomUtilisateur}
                  onChange={(e) => setNewNomUtilisateur(e.target.value)}
                  placeholder="ex : onair"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Mot de passe</label>
                <input
                  type="password"
                  value={newMotDePasse}
                  onChange={(e) => setNewMotDePasse(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {etape === 4 && configChoisie && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: couleurs.vertClair,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: '40px',
                }}
              >
                ✅
              </div>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: couleurs.vert,
                }}
              >
                Connexion réussie
              </h3>
              <p
                style={{
                  margin: '0 0 24px',
                  fontSize: '14px',
                  color: couleurs.texteSecondaire,
                  lineHeight: 1.6,
                }}
              >
                Connecté au réseau <strong>{configChoisie.nomReseau}</strong>.
              </p>

              <button
                type="button"
                onClick={accederPad}
                style={{
                  ...boutonPrimaire,
                  width: '100%',
                  padding: '15px',
                  fontSize: '16px',
                }}
              >
                📂 Accéder au PAD
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '20px 30px',
            borderTop: `1px solid ${couleurs.bordure}`,
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            backgroundColor: darkMode ? '#1F1F23' : '#FAFBFC',
          }}
        >
          {etape === 1 && (
            <>
              <button type="button" onClick={onClose} style={boutonSecondaire}>
                Annuler
              </button>
              <button
                type="button"
                onClick={passerEtape2}
                disabled={!configChoisie}
                style={{
                  ...boutonPrimaire,
                  opacity: !configChoisie ? 0.5 : 1,
                  cursor: !configChoisie ? 'not-allowed' : 'pointer',
                }}
              >
                Suivant →
              </button>
            </>
          )}

          {etape === 2 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setErreur('');
                  setEtape(1);
                }}
                style={boutonSecondaire}
              >
                ← Retour
              </button>
              <button
                type="button"
                onClick={seConnecter}
                disabled={chargement}
                style={boutonPrimaire}
              >
                {chargement ? '⏳ Connexion...' : 'Se connecter'}
              </button>
            </>
          )}

          {etape === 3 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setErreur('');
                  setEtape(1);
                }}
                style={boutonSecondaire}
              >
                ← Retour
              </button>
              <button
                type="button"
                onClick={creerReseau}
                disabled={chargement}
                style={boutonPrimaire}
              >
                {chargement ? '⏳ Enregistrement...' : 'Enregistrer'}
              </button>
            </>
          )}

          {etape === 4 && (
            <button
              type="button"
              onClick={onClose}
              style={{ ...boutonSecondaire, width: '100%' }}
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}