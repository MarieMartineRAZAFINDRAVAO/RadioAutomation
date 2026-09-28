import React, { useEffect, useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function FichiersAudio({
  darkMode = false,
  onPrecedent,
  commandeId = null,
}) {
  const [commande, setCommande] = useState(null);
  const [programmations, setProgrammations] = useState([]);
  const [fichiers, setFichiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Formulaire
  const [fichierSelectionne, setFichierSelectionne] = useState(null);
  const [nomFichier, setNomFichier] = useState('');
  const [ajoutLoading, setAjoutLoading] = useState(false);

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
                  accept=".mp3,audio/mpeg"
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

                <button
                  type="submit"
                  disabled={ajoutLoading || !fichierSelectionne}
                  style={{
                    marginLeft: 'auto',
                    border: 'none',
                    backgroundColor: fichierSelectionne ? couleurs.vert : '#9CA3AF',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor:
                      ajoutLoading || !fichierSelectionne
                        ? 'not-allowed'
                        : 'pointer',
                    fontWeight: 700,
                    fontSize: '15px',
                  }}
                >
                  {ajoutLoading ? 'Upload en cours...' : '+ Ajouter'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CARTE LISTE FICHIERS */}
        <div style={cardStyle}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: '18px',
              fontSize: '20px',
              color: couleurs.vert,
            }}
          >
            Fichiers audio associés
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
          ) : fichiers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '30px',
                border: `1px dashed ${couleurs.bordure}`,
                borderRadius: '8px',
                color: couleurs.texteSecondaire,
              }}
            >
              Aucun fichier audio pour cette commande.
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
                    <th style={thStyle}>Fichier</th>
                    <th style={thStyle}>Statut</th>
                    <th style={thStyle}>Chemin PAD</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fichiers.map((f) => (
                    <tr
                      key={f.id}
                      style={{
                        borderBottom: `1px solid ${couleurs.bordure}`,
                      }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 700 }}>
                        {f.nomFichier}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: '5px 12px',
                            borderRadius: '14px',
                            fontSize: '13px',
                            fontWeight: 700,
                            backgroundColor:
                              f.statut === 'Transféré'
                                ? '#DCFCE7'
                                : '#FEF9C3',
                            color:
                              f.statut === 'Transféré'
                                ? '#15803D'
                                : '#854D0E',
                          }}
                        >
                          {f.statut}
                        </span>
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: couleurs.texteSecondaire,
                        }}
                      >
                        {f.cheminPAD || '—'}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          textAlign: 'center',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => envoyerFichier(f)}
                          disabled={
                            envoiEnCours === f.id ||
                            f.statut === 'Transféré'
                          }
                          style={{
                            border: 'none',
                            backgroundColor:
                              f.statut === 'Transféré'
                                ? '#E2E8F0'
                                : couleurs.vert,
                            color:
                              f.statut === 'Transféré'
                                ? '#64748B'
                                : '#FFFFFF',
                            padding: '9px 18px',
                            borderRadius: '7px',
                            cursor:
                              f.statut === 'Transféré'
                                ? 'default'
                                : 'pointer',
                            fontWeight: 700,
                            fontSize: '14px',
                          }}
                        >
                          {envoiEnCours === f.id
                            ? 'Envoi...'
                            : f.statut === 'Transféré'
                            ? 'Déjà envoyé'
                            : '📤 Envoyer PAD'}
                        </button>
                      </td>
                    </tr>
                  ))}
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
    </div>
  );
}