import React, { useEffect, useState } from 'react';
import {
  UploadCloud,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

import {
  getFichiersAudio,
  envoyerVersPAD,
} from '../../services/api';

const mainColor = '#007A4D';

const STATUT_STYLE = {
  Disponible: { bg: '#F1F5F9', color: '#475569', icon: Clock },
  'En attente': { bg: '#FEF9C3', color: '#854D0E', icon: Clock },
  Transféré: { bg: '#DCFCE7', color: '#15803D', icon: CheckCircle2 },
  Échec: { bg: '#FEF2F2', color: '#DC2626', icon: XCircle },
};

export default function Programmation({ darkMode = false, onPrecedent }) {
  const [fichiers, setFichiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(null);
  const [erreur, setErreur] = useState('');

  const couleurs = {
    fond: darkMode ? '#18181B' : '#F5F8F6',
    carte: darkMode ? '#27272A' : '#FFFFFF',
    texte: darkMode ? '#F4F4F5' : '#1F2937',
    texteSecondaire: darkMode ? '#A1A1AA' : '#64748B',
    bordure: darkMode ? '#3F3F46' : '#DDE8E2',
    vert: '#007A4D',
    vertClair: darkMode ? '#164E3B' : '#EAF7F1',
  };

  const chargerDonnees = () => {
    setLoading(true);
    getFichiersAudio()
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        setFichiers(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const handleEnvoyerPAD = async (fichier) => {
    setEnvoiEnCours(fichier.id);
    setErreur('');

    try {
      await envoyerVersPAD(fichier.id);
      chargerDonnees();
    } catch (err) {
      setErreur(
        err.response?.data?.error ||
          `Échec du transfert de "${fichier.nomFichier}" vers le PAD.`
      );
      chargerDonnees();
    } finally {
      setEnvoiEnCours(null);
    }
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
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: 800,
    fontSize: '15px',
    borderRight: '1px solid rgba(255,255,255,0.25)',
  };

  const tdStyle = {
    padding: '14px 16px',
    fontSize: '15px',
    borderRight: `1px solid ${couleurs.bordure}`,
    verticalAlign: 'top',
  };

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

        {/* ═══ TITRE (centré, sans icône) ═══ */}
        <h1
          style={{
            margin: '0 0 30px',
            fontSize: '38px',
            fontWeight: 800,
            textAlign: 'center',
            color: couleurs.vert,
          }}
        >
          Programmation
        </h1>

        {/* ═══ MESSAGES ═══ */}
        {erreur && (
          <div
            style={{
              marginBottom: '20px',
              backgroundColor: darkMode ? '#451A1A' : '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              padding: '14px 18px',
              borderRadius: '8px',
              fontSize: '15px',
            }}
          >
            {erreur}
          </div>
        )}

        {/* ═══ CARTE LISTE ═══ */}
        <div style={cardStyle}>
          <h3
            style={{
              marginTop: 0,
              marginBottom: '18px',
              fontSize: '20px',
              color: couleurs.vert,
            }}
          >
            Tous les fichiers
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
              Aucun fichier pour le moment.
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
                    <th style={thStyle}>Commande</th>
                    <th style={thStyle}>Client</th>
                    <th style={thStyle}>Service</th>
                    <th style={thStyle}>Statut</th>
                    <th style={thStyle}>Chemin PAD</th>
                    <th
                      style={{
                        ...thStyle,
                        textAlign: 'center',
                        borderRight: 'none',
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fichiers.map((f) => {
                    const s = STATUT_STYLE[f.statut] || STATUT_STYLE.Disponible;
                    const Icon = s.icon;

                    return (
                      <tr
                        key={f.id}
                        style={{
                          borderBottom: `1px solid ${couleurs.bordure}`,
                        }}
                      >
                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          {f.nomFichier}
                        </td>
                        <td style={tdStyle}>
                          {f.commande_nom || `CMD-${f.commande}`}
                        </td>
                        <td style={tdStyle}>
                          {f.client_nom || '-'}
                        </td>
                        <td style={tdStyle}>
                          {f.service_nom || '-'}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              backgroundColor: s.bg,
                              color: s.color,
                              padding: '5px 12px',
                              borderRadius: '14px',
                              fontSize: '13px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                          >
                            <Icon size={14} /> {f.statut}
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
                            borderRight: 'none',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleEnvoyerPAD(f)}
                            disabled={
                              envoiEnCours === f.id ||
                              f.statut === 'Transféré'
                            }
                            style={{
                              backgroundColor:
                                f.statut === 'Transféré'
                                  ? '#E2E8F0'
                                  : mainColor,
                              color:
                                f.statut === 'Transféré'
                                  ? '#64748B'
                                  : '#FFF',
                              border: 'none',
                              padding: '9px 18px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              cursor:
                                f.statut === 'Transféré'
                                  ? 'default'
                                  : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '14px',
                            }}
                          >
                            {envoiEnCours === f.id ? (
                              <RefreshCw size={16} className="spin" />
                            ) : (
                              <UploadCloud size={16} />
                            )}
                            {f.statut === 'Transféré'
                              ? 'Déjà envoyé'
                              : 'Envoyer PAD'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══ BOUTON RETOUR ═══ */}
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

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}