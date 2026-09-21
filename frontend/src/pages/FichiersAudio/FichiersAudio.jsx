import React, { useEffect, useState } from 'react';
import { UploadCloud, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';

import {
  getLignes,
  getFichiersAudio,
  createFichierAudio,
  envoyerVersPAD,
} from '../../services/api';

const mainColor = '#007A4D';

const STATUT_STYLE = {
  Disponible: { bg: '#F1F5F9', color: '#475569', icon: Clock },
  'En attente': { bg: '#FEF9C3', color: '#854D0E', icon: Clock },
  Transféré: { bg: '#DCFCE7', color: '#15803D', icon: CheckCircle2 },
  Échec: { bg: '#FEF2F2', color: '#DC2626', icon: XCircle },
};

export default function FichiersAudio() {
  const [lignes, setLignes] = useState([]);
  const [fichiers, setFichiers] = useState([]);
  const [ligneChoisie, setLigneChoisie] = useState('');
  const [nomFichier, setNomFichier] = useState('');
  const [cheminOrdinateur, setCheminOrdinateur] = useState('');
  const [loading, setLoading] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(null);
  const [erreur, setErreur] = useState('');

  const chargerDonnees = () => {
    getLignes()
      .then((res) => setLignes(res.data))
      .catch(() => {});

    getFichiersAudio()
      .then((res) => setFichiers(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const handleAjouter = async (e) => {
    e.preventDefault();
    setErreur('');

    if (!ligneChoisie || !nomFichier || !cheminOrdinateur) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);

    try {
      await createFichierAudio({
        ligne: ligneChoisie,
        nomFichier,
        cheminOrdinateur,
        format: nomFichier.split('.').pop() || 'mp3',
        statut: 'Disponible',
      });

      setNomFichier('');
      setCheminOrdinateur('');
      setLigneChoisie('');
      chargerDonnees();
    } catch (err) {
      setErreur(
        err.response?.data?.error ||
        "Impossible d'enregistrer le fichier."
      );
    } finally {
      setLoading(false);
    }
  };

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
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    padding: '1.8rem',
    marginBottom: '1.5rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '2px solid #E2E8F0',
    fontSize: '1rem',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <h2 style={{ marginBottom: '0.3rem' }}>🎧 Fichiers audio</h2>
      <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>
        Enregistrez ici les MP3 déjà présents sur l'ordinateur, puis
        envoyez-les vers le PAD via SMB avant de les programmer.
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

      {/* Formulaire d'ajout */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Ajouter un fichier</h3>

        <form
          onSubmit={handleAjouter}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1.4fr auto',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Ligne de commande
            </label>
            <select
              value={ligneChoisie}
              onChange={(e) => setLigneChoisie(e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Choisir --</option>
              {lignes.map((l) => (
                <option key={l.id} value={l.id}>
                  #{l.id} - {l.service_nom || 'Service'} -{' '}
                  {l.designation || 'sans désignation'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Nom du fichier
            </label>
            <input
              type="text"
              placeholder="ex: pub_epicerie.mp3"
              value={nomFichier}
              onChange={(e) => setNomFichier(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              Chemin sur l'ordinateur
            </label>
            <input
              type="text"
              placeholder="ex: C:\Audios\pub_epicerie.mp3"
              value={cheminOrdinateur}
              onChange={(e) => setCheminOrdinateur(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: mainColor,
              color: '#FFF',
              border: 'none',
              padding: '0.8rem 1.4rem',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Ajouter
          </button>
        </form>
      </div>

      {/* Liste des fichiers */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Fichiers enregistrés</h3>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '0.6rem' }}>Fichier</th>
              <th style={{ padding: '0.6rem' }}>Ligne</th>
              <th style={{ padding: '0.6rem' }}>Statut</th>
              <th style={{ padding: '0.6rem' }}>Chemin PAD</th>
              <th style={{ padding: '0.6rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {fichiers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', color: '#94A3B8' }}>
                  Aucun fichier pour le moment.
                </td>
              </tr>
            )}

            {fichiers.map((f) => {
              const s = STATUT_STYLE[f.statut] || STATUT_STYLE.Disponible;
              const Icon = s.icon;

              return (
                <tr key={f.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>
                    {f.nomFichier}
                  </td>
                  <td style={{ padding: '0.6rem' }}>#{f.ligne}</td>
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
                  <td style={{ padding: '0.6rem', color: '#64748B' }}>
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
                          f.statut === 'Transféré' ? '#E2E8F0' : mainColor,
                        color: f.statut === 'Transféré' ? '#64748B' : '#FFF',
                        border: 'none',
                        padding: '0.5rem 0.9rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor:
                          f.statut === 'Transféré' ? 'default' : 'pointer',
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
                        : 'Envoyer vers PAD'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
