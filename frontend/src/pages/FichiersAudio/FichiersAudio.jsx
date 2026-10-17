import React, { useEffect, useState } from 'react';
import ModalPadOriginal from '../../components/ModalPadOriginal';
const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function FichiersAudio({
  darkMode = false,
  onPrecedent,
  commandeId = null,
}) {
  const [commande, setCommande] = useState(null);
  const [programmations, setProgrammations] = useState([]);
  const [fichiers, setFichiers] = useState([]);
  // ═══ Modal PAD Original ═══
  const [modalPadOpen, setModalPadOpen] = useState(false);
  const [fichierPourPad, setFichierPourPad] = useState(null);
  const [padMode, setPadMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Formulaire
  const [fichierSelectionne, setFichierSelectionne] = useState(null);
  const [nomFichier, setNomFichier] = useState('');
  const [ajoutLoading, setAjoutLoading] = useState(false);
    // ═══ Modal notification custom ═══
  const [modalNotif, setModalNotif] = useState(null);
  
    // ═══ Lignes masquées (local seulement — pas en BD) ═══
  const [lignesMasquees, setLignesMasquees] = useState([]);
  const couleurs = {
    fond: darkMode ? '#18181B' : '#F5F8F6',
    carte: darkMode ? '#27272A' : '#FFFFFF',
    texte: darkMode ? '#F4F4F5' : '#1F2937',
    texteSecondaire: darkMode ? '#A1A1AA' : '#6B7280',
    bordure: darkMode ? '#3F3F46' : '#DDE8E2',
    vert: '#007A4D',
    vertClair: darkMode ? '#164E3B' : '#EAF7F1',
    rouge: '#DC2626',
  };

  // =========================================================
  // CHARGER LES DONNÉES
  // =========================================================
  const chargerDonnees = async () => {
    if (!commandeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Commande + programmations
      const r1 = await fetch(`${API_BASE_URL}/commandes/${commandeId}/`, { headers });
      if (r1.ok) {
        const d1 = await r1.json();
        setCommande(d1);
        setProgrammations(Array.isArray(d1.programmations) ? d1.programmations : []);
      }

      // Fichiers audio
            const r2 = await fetch(`${API_BASE_URL}/fichiers-audio/?commande=${commandeId}`, { headers });
      if (r2.ok) {
        const d2 = await r2.json();
        const liste = Array.isArray(d2) ? d2 : (d2.results || []);
        setFichiers(liste);
      }

      // ═══ Charger la configuration du PAD ═══
      try {
        const r3 = await fetch(`${API_BASE_URL}/pad-config/`, { headers });
        if (r3.ok) {
          const d3 = await r3.json();
          setPadMode(d3);
        }
      } catch (e) {
        console.error(e);
      }

      // ═══ Charger la configuration du PAD ═══
      try {
        const r3 = await fetch(`${API_BASE_URL}/pad-config/`, { headers });
        if (r3.ok) {
          const d3 = await r3.json();
          setPadMode(d3);
        }
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, [commandeId]);

  // =========================================================
  // CHOISIR UN MP3
  // =========================================================
  const choisirFichier = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFichierSelectionne(file);
    setNomFichier(file.name);
  };

  // =========================================================
  // UPLOAD DU FICHIER AU SERVEUR
  // =========================================================
  const ajouterFichier = async (e) => {
    e.preventDefault();

    if (!commandeId) {
      setError('Veuillez sélectionner une commande.');
      return;
    }
    if (!fichierSelectionne) {
      setError('Veuillez choisir un fichier MP3.');
      return;
    }

    try {
      setAjoutLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');

      // ═══ FormData pour envoyer le fichier ═══
      const formData = new FormData();
      formData.append('fichier', fichierSelectionne);
      formData.append('commande', commandeId);
      formData.append('padMode', 'local');

      const response = await fetch(`${API_BASE_URL}/fichiers-audio/upload/`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // ⚠️ NE PAS mettre 'Content-Type' — FormData le fait
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData ? JSON.stringify(errData) : "Erreur lors de l'upload"
        );
      }

      setFichierSelectionne(null);
      setNomFichier('');
      setSuccessMessage('Fichier uploadé avec succès.');
      chargerDonnees();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Impossible d'uploader le fichier.");
    } finally {
      setAjoutLoading(false);
    }
  };  
    // =========================================================
  // UPLOAD VERS PAD ORIGINAL (ouvre le modal)
  // =========================================================
  const ajouterFichierOriginal = async () => {
    if (!commandeId) {
      setError('Veuillez sélectionner une commande.');
      return;
    }
    if (!fichierSelectionne) {
      setError('Veuillez choisir un fichier MP3.');
      return;
    }

    try {
      setAjoutLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('fichier', fichierSelectionne);
      formData.append('commande', commandeId);
      formData.append('padMode', 'original');

      const response = await fetch(`${API_BASE_URL}/fichiers-audio/upload/`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(
          errData ? JSON.stringify(errData) : "Erreur lors de l'upload"
        );
      }

      const nouveauFichier = await response.json();
      setFichierSelectionne(null);
      setNomFichier('');
      chargerDonnees();

      setFichierPourPad(nouveauFichier);
      setModalPadOpen(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Impossible d'uploader le fichier.");
    } finally {
      setAjoutLoading(false);
    }
  };
    // =========================================================
  // MASQUER UNE LIGNE (local — tsy mamafa BD)
  // =========================================================
  const masquerLigne = (progId) => {
    setLignesMasquees((ancien) => [...ancien, progId]);
  };


    // =========================================================
  // SUPPRIMER UN FICHIER (Archivé ou Échec)
  // =========================================================
  // =========================================================
  // SUPPRIMER UN FICHIER (Archivé ou Échec) — avec modal
  // =========================================================
  const supprimerArchive = (fichier) => {
    const estEchec = fichier.statut === 'Échec';

    const titre = estEchec
      ? 'Suppression (fichier en échec)'
      : 'Suppression';

    const message = estEchec
      ? `Voulez-vous vraiment supprimer définitivement le fichier en échec ?\n\n` +
        `Fichier : ${fichier.nomFichier}\n\n` +
        `Cette action est irréversible.`
      : `Voulez-vous vraiment supprimer définitivement l'archive ?\n\n` +
        `Fichier : ${fichier.nomFichier}\n\n` +
        `L'archive sera supprimée du dossier "archives" et de l'historique.\n` +
        `Cette action est irréversible.`;

    setModalNotif({
      titre,
      message,
      avecBoutons: true,
      onConfirm: async () => {
        try {
          setError('');
          const token = localStorage.getItem('accessToken');

          const response = await fetch(
            `${API_BASE_URL}/fichiers-audio/${fichier.id}/supprimer-archive/`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            }
          );

          const data = await response.json().catch(() => null);

          if (!response.ok) {
            throw new Error(
              data?.error || "Impossible de supprimer le fichier."
            );
          }

          setSuccessMessage('✅ Fichier supprimé avec succès.');
          chargerDonnees();
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
          console.error(err);
          setError(err.message || "Impossible de supprimer le fichier.");
        }
      },
    });
  };

    // =========================================================
  // OUVRIR LES ARCHIVES (tsisy fichier spécifique)
  // =========================================================
  const ouvrirArchive = async () => {
    try {
      setError('');
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${API_BASE_URL}/fichiers-audio/ouvrir-archive-dossier/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Impossible d'ouvrir les archives."
        );
      }

      setSuccessMessage('✅ Dossier archives ouvert.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Impossible d'ouvrir les archives.");
    }
  };

    // =========================================================
  // OUVRIR LE PAD (avec jour + heure)
  // =========================================================
  const ouvrirPAD = async (fichier, prog) => {
    try {
      setError('');

      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${API_BASE_URL}/fichiers-audio/${fichier.id}/ouvrir-pad/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            dateDiffusion: prog?.dateDiffusion || null,
            heureDiffusion: prog?.heureDiffusion || null,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "Impossible d'ouvrir le PAD."
        );
      }

      setSuccessMessage('✅ PAD ouvert avec succès.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Impossible d'ouvrir le PAD.");
    }
  };
    // =========================================================
  // ENVOYER LES DIFFUSIONS DU JOUR
  // =========================================================
  const envoyerDiffusionsDuJour = async () => {
    if (
      !window.confirm(
        'Envoyer toutes les diffusions du jour vers le PAD ?'
      )
    ) {
      return;
    }

    try {
      setError('');
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${API_BASE_URL}/fichiers-audio/envoyer-jour/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData ? JSON.stringify(errData) : 'Erreur');
      }

      const data = await response.json();

      if (data.message) {
        setSuccessMessage(data.message);
      } else {
        setSuccessMessage(
          `✅ ${data.succes.length} fichier(s) envoyé(s), ${data.echecs.length} échec(s).`
        );
      }

      chargerDonnees();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Échec de l'envoi des diffusions du jour.");
    }
  };

  // =========================================================
  // ENVOYER VERS LE PAD
  // =========================================================
  const envoyerFichier = async (fichier) => {
    setEnvoiEnCours(fichier.id);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/fichiers-audio/${fichier.id}/envoyer-pad/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData ? JSON.stringify(errData) : 'Erreur');
      }

      setSuccessMessage('Fichier envoyé vers le PAD avec succès.');
      chargerDonnees();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
            console.error(err);
      setError(err.message || "Échec du transfert vers le PAD.");
    } finally {
      setEnvoiEnCours(null);
    }
  };

  // =========================================================
  // FORMATAGE
  // =========================================================
  const formaterDateLocale = (date) => {
    if (!date) return '-';
    return new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR');
  };

  const formaterHeure = (heure) => {
    if (!heure) return '-';
    return String(heure).slice(0, 5);
  };

  const serviceNom = () => {
    if (!commande) return '-';
    if (Array.isArray(commande.lignes) && commande.lignes.length > 0) {
      return commande.lignes[0].service_nom || '-';
    }
    return '-';
  };

  // =========================================================
  // STYLES
  // =========================================================
  const cardStyle = {
    backgroundColor: couleurs.carte,
    border: `1px solid ${couleurs.bordure}`,
    borderRadius: '14px',
    padding: '25px',
    marginBottom: '20px',
    boxShadow: darkMode ? 'none' : '0 4px 12px rgba(0,0,0,0.04)',
  };

  const thStyle = {
    padding: '14px',
    textAlign: 'left',
    fontWeight: 800,
    fontSize: '15px',
  };

  const tdStyle = {
    padding: '14px',
    fontSize: '15px',
  };

  // =========================================================
  // RENDU
  // =========================================================
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 90px)',
        backgroundColor: couleurs.fond,
        padding: '35px 45px 55px',
        color: couleurs.texte,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* TITRE */}
        <h1
          style={{
            margin: '0 0 30px',
            fontSize: '38px',
            fontWeight: 800,
            textAlign: 'center',
            color: couleurs.vert,
          }}
        >
          Fichier Audio
        </h1>
    

        {/* MESSAGES */}
        {error && (
          <div
            style={{
              marginBottom: '20px',
              backgroundColor: darkMode ? '#451A1A' : '#FEF2F2',
              border: '1px solid #FECACA',
              color: couleurs.rouge,
              padding: '14px 18px',
              borderRadius: '8px',
              fontSize: '15px',
            }}
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              marginBottom: '20px',
              backgroundColor: darkMode ? '#19352C' : '#F0FDF4',
              border: `1px solid ${couleurs.bordure}`,
              color: couleurs.texte,
              padding: '14px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '15px',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* CARTE CLIENT */}
        {commande && (
          <div style={cardStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: '18px',
                fontSize: '20px',
                color: couleurs.vert,
              }}
            >
              Informations client
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '20px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    color: couleurs.texteSecondaire,
                    fontWeight: 700,
                    marginBottom: '5px',
                  }}
                >
                  Client
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800 }}>
                  {commande.client_nom || '-'}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '13px',
                    color: couleurs.texteSecondaire,
                    fontWeight: 700,
                    marginBottom: '5px',
                  }}
                >
                  Téléphone
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800 }}>
                  {commande.client_telephone || '-'}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '13px',
                    color: couleurs.texteSecondaire,
                    fontWeight: 700,
                    marginBottom: '5px',
                  }}
                >
                  Service
                </div>
                <div style={{ fontSize: '17px', fontWeight: 800 }}>
                  {serviceNom()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CARTE DIFFUSIONS */}
        <div style={cardStyle}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: '18px',
              fontSize: '20px',
              color: couleurs.vert,
            }}
          >
            Diffusions prévues
          </h3>

          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '30px',
                color: couleurs.texteSecondaire,
              }}
            >
              Chargement...
            </div>
          ) : programmations.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '30px',
                border: `1px dashed ${couleurs.bordure}`,
                borderRadius: '8px',
                color: couleurs.texteSecondaire,
              }}
            >
              Aucune diffusion prévue pour cette commande.
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto',
                border: `1px solid ${couleurs.bordure}`,
                borderRadius: '9px',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '15px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: couleurs.vert,
                      color: '#FFFFFF',
                    }}
                  >
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Heure</th>
                    <th style={thStyle}>Service</th>
                  </tr>
                </thead>
                <tbody>
                  {programmations.map((p) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: `1px solid ${couleurs.bordure}`,
                      }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        {formaterDateLocale(p.dateDiffusion)}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        {formaterHeure(p.heureDiffusion)}
                      </td>
                      <td style={tdStyle}>{serviceNom()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CARTE AJOUTER MP3 */}
        {commandeId && (
          <div style={cardStyle}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: '18px',
                fontSize: '20px',
                color: couleurs.vert,
              }}
            >
              Ajouter un fichier MP3
            </h3>

            <form onSubmit={ajouterFichier}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  flexWrap: 'wrap',
                  marginBottom: '15px',
                }}
              >
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                  onChange={choisirFichier}
                  id="file-input"
                  style={{ display: 'none' }}
                />

                <label
                  htmlFor="file-input"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: couleurs.vertClair,
                    color: couleurs.vert,
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: `2px solid ${couleurs.vert}`,
                    fontSize: '15px',
                  }}
                >
                  📁 Parcourir
                </label>

                {nomFichier && (
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '15px',
                      color: couleurs.texte,
                    }}
                  >
                    {nomFichier}
                  </span>
                )}

                <div
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >


                  <button
                    type="button"
                    disabled={ajoutLoading || !fichierSelectionne}
                    onClick={ajouterFichierOriginal}
                    style={{
                      border: 'none',
                      backgroundColor: fichierSelectionne
                        ? couleurs.vert
                        : '#9CA3AF',
                      color: '#FFFFFF',
                      padding: '12px 22px',
                      borderRadius: '8px',
                      cursor:
                        ajoutLoading || !fichierSelectionne
                          ? 'not-allowed'
                          : 'pointer',
                      fontWeight: 700,
                      fontSize: '15px',
                    }}
                  >
                    {ajoutLoading ? 'Upload...' : '📤 Ajouter au PAD'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ═══ (Ny Tableau sy ny Actions rehetra efa voafafa teto) ═══ */}

        {/* BOUTON RETOUR */}
        {onPrecedent && (
          <button
            type="button"
            onClick={onPrecedent}
            style={{
              padding: '13px 25px',
              borderRadius: '10px',
              border: `1px solid ${couleurs.bordure}`,
              background: 'transparent',
              color: couleurs.texte,
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '15px',
            }}
          >
            ← Retour
          </button>
        )}

      </div>

      {/* ═══ MODAL PAD ORIGINAL ═══ */}
      <ModalPadOriginal
        isOpen={modalPadOpen}
        onClose={() => {
          setModalPadOpen(false);
          setFichierPourPad(null);
        }}
        fichierAudio={fichierPourPad}
        darkMode={darkMode}
      />

      {/* ═══ MODAL NOTIFICATION / CONFIRMATION ═══ */}
      {modalNotif && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999,
          }}
          onClick={() => setModalNotif(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: darkMode ? '#27272A' : '#FFFFFF',
              borderRadius: '18px',
              padding: '35px 40px',
              width: '520px',
              maxWidth: '95%',
              textAlign: 'center',
              boxShadow: '0 25px 70px rgba(0,0,0,0.30)',
              color: couleurs.texte,
            }}
          >
            <h2
              style={{
                margin: '0 0 18px',
                fontSize: '26px',
                fontWeight: 800,
                color: couleurs.texte,
              }}
            >
              {modalNotif.titre}
            </h2>

            <p
              style={{
                margin: '0 0 30px',
                fontSize: '16px',
                color: couleurs.texteSecondaire,
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
                textAlign: 'left',
              }}
            >
              {modalNotif.message}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '15px',
                justifyContent: 'center',
              }}
            >
              {!modalNotif.avecBoutons && (
                <button
                  type="button"
                  onClick={() => setModalNotif(null)}
                  style={{
                    padding: '12px 40px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '16px',
                    cursor: 'pointer',
                    minWidth: '120px',
                  }}
                >
                  OK
                </button>
              )}

              {modalNotif.avecBoutons && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const cb = modalNotif.onConfirm;
                      setModalNotif(null);
                      if (cb) cb();
                    }}
                    style={{
                      padding: '12px 40px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '16px',
                      cursor: 'pointer',
                      minWidth: '120px',
                    }}
                  >
                    Oui
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalNotif(null)}
                    style={{
                      padding: '12px 40px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#94A3B8',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '16px',
                      cursor: 'pointer',
                      minWidth: '120px',
                    }}
                  >
                    Non
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}