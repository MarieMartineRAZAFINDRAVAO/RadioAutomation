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

export default function FichiersAudio({ darkMode = false, onPrecedent }) {
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

  const cardStyle = {
    backgroundColor: couleurs.carte,
    borderRadius: '16px',
    boxShadow: darkMode ? 'none' : '0 4px 12px rgba(0,0,0,0.06)',
    padding: '1.8rem',
    marginBottom: '1.5rem',
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
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: '34px',
            fontWeight: 800,
            color: couleurs.vert,
          }}
        >
          🎧 Fichiers audio
        </h1>
        <p style={{ color: couleurs.texteSecondaire, marginBottom: '25px' }}>
          Vue générale de tous les fichiers audio rattachés aux commandes.
          Ajoutez et gérez les MP3 depuis chaque commande (🎙 Gérer l'audio).
        </p>

        {erreur && (
          <div
            style={{
              color: '#DC2626',
              backgroundColor: '#FEF2F2',
              padding: '0.9rem 1.2rem',
              borderRadius: '10px',
              marginBottom: '1.2rem',
            }}
          >
            {erreur}
          </div>
        )}

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Tous les fichiers</h3>

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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: `2px solid ${couleurs.bordure}`,
                  }}
                >
                  <th style={{ padding: '0.6rem' }}>Fichier</th>
                  <th style={{ padding: '0.6rem' }}>Commande</th>
                  <th style={{ padding: '0.6rem' }}>Client</th>
                  <th style={{ padding: '0.6rem' }}>Service</th>
                  <th style={{ padding: '0.6rem' }}>Statut</th>
                  <th style={{ padding: '0.6rem' }}>Chemin PAD</th>
                  <th style={{ padding: '0.6rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {fichiers.map((f) => {
                  const s = STATUT_STYLE[f.statut] || STATUT_STYLE.Disponible;
                  const Icon = s.icon;

                  return (
                    <tr
                      key={f.id}
                      style={{ borderBottom: `1px solid ${couleurs.bordure}` }}
                    >
                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>
                        {f.nomFichier}
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        {f.commande_nom || `CMD-${f.commande}`}
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        {f.client_nom || '-'}
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        {f.service_nom || '-'}
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        <span
                          style={{
                            backgroundColor: s.bg,
                            color: s.color,
                            padding: '0.3rem 0.7rem',
                            borderRadius: '999px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Icon size={14} /> {f.statut}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '0.6rem',
                          color: couleurs.texteSecondaire,
                        }}
                      >
                        {f.cheminPAD || '—'}
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleEnvoyerPAD(f)}
                          disabled={
                            envoiEnCours === f.id || f.statut === 'Transféré'
                          }
                          style={{
                            backgroundColor:
                              f.statut === 'Transféré'
                                ? '#E2E8F0'
                                : mainColor,
                            color:
                              f.statut === 'Transféré' ? '#64748B' : '#FFF',
                            border: 'none',
                            padding: '0.5rem 0.9rem',
                            borderRadius: '8px',
                            fontWeight: 700,
                            cursor:
                              f.statut === 'Transféré'
                                ? 'default'
                                : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
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
          )}
        </div>

        {onPrecedent && (
          <button
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