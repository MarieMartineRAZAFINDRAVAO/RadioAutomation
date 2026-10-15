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
                  {/* BOUTON 1 — PAD LOCAL */}
                  <button
                    type="submit"
                    disabled={ajoutLoading || !fichierSelectionne}
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
                    {ajoutLoading ? 'Upload...' : '📁 Ajouter au PAD Local'}
                  </button>

                  {/* BOUTON 2 — PAD ORIGINAL */}
                  <button
                    type="button"
                    disabled={ajoutLoading || !fichierSelectionne}
                    onClick={ajouterFichierOriginal}
                    style={{
                      border: 'none',
                      backgroundColor: fichierSelectionne
                        ? '#005C3A'
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
                    📤 Ajouter au PAD Original
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* CARTE DIFFUSIONS ET FICHIERS */}
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '20px',
                color: couleurs.vert,
              }}
            >
              Diffusions et fichiers audio
            </h3>
          </div>

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
                  fontSize: '14px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: couleurs.vert,
                      color: '#FFFFFF',
                    }}
                  >
                    <th style={thStyle}>Fichier</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Heure</th>
                    <th style={thStyle}>Statut</th>
                    <th style={thStyle}>Chemin PAD</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {programmations
                    .filter((p) => !lignesMasquees.includes(p.id))
                    .map((p) => {
                    // ═══ Fallback : chercher par fichierAudio ou prendre le premier ═══
                    const fichier =
                      fichiers.find((f) => f.id === p.fichierAudio) ||
                      fichiers[0];

                    const nomFichier =
                      p.fichier_nom ||
                      (fichier ? fichier.nomFichier : '-');

                    const dateStr = formaterDateLocale(p.dateDiffusion);
                    const heureStr = formaterHeure(p.heureDiffusion);
                    const statutProg = p.statut || '-';

                                       // ═══ Chemin spécifique à cette diffusion ═══
                    let cheminDiffusion = '—';
                    if (fichier && fichier.cheminPAD) {
                      // Mapping jour semaine → dossier PAD (tous les jours)
                      const JOURS_PAD = {
                        1: '1-ALATSINAINY',
                        2: '2-TALATA',
                        3: '3-ALAROBIA',
                        4: '4-ALAKAMISY',
                        5: '5- ZOMA',
                        6: '6- SABOTSY',
                        0: '0- ALAHADY',
                      };

                      const d = new Date(`${p.dateDiffusion}T00:00:00`);
                      const jourSemaine = d.getDay();
                      const prefixJour = JOURS_PAD[jourSemaine] || '';

                      const heureClean = String(p.heureDiffusion || '')
                        .slice(0, 5)
                        .replace(':', 'h');

                      const chemins = fichier.cheminPAD
                        .split(',')
                        .map((c) => c.trim());

                        // 1. Jour + sous-dossier ora (ex: 06h30/01_...)
                      let match = chemins.find(
                        (c) =>
                          prefixJour &&
                          c.includes(prefixJour) &&
                          (c.includes(`/${heureClean}/`) ||
                           c.includes(`\\${heureClean}\\`))
                      );

                      // 2. Jour + préfixe heure (ex: 12h25_...)
                      if (!match && prefixJour) {
                        match = chemins.find(
                          (c) =>
                            c.includes(prefixJour) &&
                            (c.includes(`/${heureClean}_`) ||
                             c.includes(`\\${heureClean}_`))
                        );
                      }

                      // 3. Jour ihany
                      if (!match && prefixJour) {
                        match = chemins.find((c) => c.includes(prefixJour));
                      }

                      // 4. Préfixe heure ihany
                      if (!match) {
                        match = chemins.find(
                          (c) =>
                            c.includes(`/${heureClean}/`) ||
                            c.includes(`/${heureClean}_`) ||
                            c.includes(`\\${heureClean}\\`) ||
                            c.includes(`\\${heureClean}_`)
                        );
                      }

                      cheminDiffusion = match || chemins[0] || '—';
                
                    }
                    // ═══ Couleur du statut ═══
                    let bgStatut = '#FEF9C3';
                    let colStatut = '#854D0E';
                    if (statutProg === 'Archivé') {
                      bgStatut = '#DCFCE7';
                      colStatut = '#15803D';
                    } else if (
                      statutProg === 'Transféré' ||
                      statutProg === 'Envoyé au PAD'
                    ) {
                      bgStatut = '#DBEAFE';
                      colStatut = '#1E40AF';
                    } else if (statutProg === 'À venir') {
                      bgStatut = '#E0E7FF';
                      colStatut = '#3730A3';
                    } else if (statutProg === 'Échec') {
                      bgStatut = '#FEE2E2';
                      colStatut = '#DC2626';
                    } else if (statutProg === 'En attente') {
                      bgStatut = '#F1F5F9';
                      colStatut = '#64748B';
                    }

                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: `1px solid ${couleurs.bordure}`,
                        }}
                      >
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 700,
                            maxWidth: '250px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={nomFichier}
                        >
                          {nomFichier}
                        </td>

                        <td style={tdStyle}>{dateStr}</td>

                        <td style={{ ...tdStyle, fontWeight: 700 }}>
                          {heureStr}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 700,
                              backgroundColor: bgStatut,
                              color: colStatut,
                            }}
                          >
                            {statutProg}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color: couleurs.texteSecondaire,
                            fontSize: '12px',
                            maxWidth: '250px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={cheminDiffusion}
                        >
                          {cheminDiffusion}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign: 'center',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              justifyContent: 'center',
                              flexWrap: 'wrap',
                            }}
                          >
                             {/* ═══ À VENIR / TRANSFÉRÉ / ENVOYÉ AU PAD → Voir PAD ═══ */}
                            {(statutProg === 'À venir' ||
                              statutProg === 'Transféré' ||
                              statutProg === 'Envoyé au PAD') && (
                              <button
                                type="button"
                                onClick={() => ouvrirPAD(fichier || {}, p)}
                                style={{
                                  border: 'none',
                                  backgroundColor: '#3B82F6',
                                  color: '#FFFFFF',
                                  padding: '7px 14px',
                                  borderRadius: '7px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                }}
                              >
                                📂 Voir PAD
                              </button>
                            )}

                            {/* ═══ ARCHIVÉ → Voir Archive + Masquer ═══ */}
                            {statutProg === 'Archivé' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => ouvrirArchive(fichier)}
                                  style={{
                                    border: 'none',
                                    backgroundColor: '#10B981',
                                    color: '#FFFFFF',
                                    padding: '7px 14px',
                                    borderRadius: '7px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                  }}
                                >
                                  📦 Voir Archive
                                </button>
                                <button
                                  type="button"
                                  onClick={() => masquerLigne(p.id)}
                                  style={{
                                    border: 'none',
                                    backgroundColor: '#FEE2E2',
                                    color: '#DC2626',
                                    padding: '7px 14px',
                                    borderRadius: '7px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                  }}
                                >
                                  🗑 Masquer
                                </button>
                              </>
                            )}

                            {/* ═══ ÉCHEC → Masquer ═══ */}
                            {statutProg === 'Échec' && (
                              <button
                                type="button"
                                onClick={() => masquerLigne(p.id)}
                                style={{
                                  border: 'none',
                                  backgroundColor: '#FEE2E2',
                                  color: '#DC2626',
                                  padding: '7px 14px',
                                  borderRadius: '7px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '12px',
                                }}
                              >
                                🗑 Masquer
                              </button>
                            )}

                            {/* ═══ EN ATTENTE → texte discret ═══ */}
                            {statutProg === 'En attente' && (
                              <span
                                style={{
                                  color: couleurs.texteSecondaire,
                                  fontSize: '12px',
                                  fontStyle: 'italic',
                                  padding: '4px 8px',
                                }}
                              >
                                ⏳ En attente
                              </span>
                            )}

                            {/* ═══ DISPONIBLE → rien ═══ */}
                            {statutProg === 'Disponible' && (
                              <span
                                style={{
                                  color: couleurs.texteSecondaire,
                                  fontSize: '12px',
                                  fontStyle: 'italic',
                                }}
                              >
                                —
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

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