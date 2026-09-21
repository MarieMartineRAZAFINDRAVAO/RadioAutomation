import React, { useEffect, useMemo, useState } from 'react';
import { X, Radio } from 'lucide-react';

import {
  getFichiersAudio,
  getProgrammations,
  createProgrammation,
  deleteProgrammation,
  getPadConfig,
} from '../../services/api';

const mainColor = '#007A4D';
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Retourne le lundi de la semaine contenant "date"
function lundiDeLaSemaine(date) {
  const d = new Date(date);
  const jour = (d.getDay() + 6) % 7; // 0 = lundi
  d.setDate(d.getDate() - jour);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

export default function Programmation() {
  const [lera, setLera] = useState([]);
  const [fichiers, setFichiers] = useState([]);
  const [programmations, setProgrammations] = useState([]);
  const [semaineDebut, setSemaineDebut] = useState(lundiDeLaSemaine(new Date()));
  const [modalCell, setModalCell] = useState(null); // { date, heure, ordre }
  const [fichierChoisi, setFichierChoisi] = useState('');
  const [erreur, setErreur] = useState('');

  const chargerDonnees = () => {
    getPadConfig()
      .then((res) => setLera(res.data.lera_slots || []))
      .catch(() => setLera(['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']));

    getFichiersAudio()
      .then((res) => setFichiers(res.data.filter((f) => f.statut === 'Transféré')))
      .catch(() => {});

    getProgrammations()
      .then((res) => setProgrammations(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  const joursSemaine = useMemo(() => {
    return JOURS.map((nom, i) => {
      const d = new Date(semaineDebut);
      d.setDate(d.getDate() + i);
      return { nom, date: d, dateStr: formatDate(d) };
    });
  }, [semaineDebut]);

  const trouverProgrammation = (dateStr, heure) => {
    return programmations.find(
      (p) => p.dateDiffusion === dateStr && p.heureDiffusion?.slice(0, 5) === heure
    );
  };

  const ouvrirCellule = (dateStr, heure, ordre) => {
    const existante = trouverProgrammation(dateStr, heure);
    if (existante) return; // déjà occupé -> pas de modal, on utilise le bouton "retirer"
    setModalCell({ dateStr, heure, ordre });
    setFichierChoisi('');
    setErreur('');
  };

  const confirmerAffectation = async () => {
    if (!fichierChoisi) {
      setErreur('Choisissez un fichier audio.');
      return;
    }

    try {
      await createProgrammation({
        fichierAudio: fichierChoisi,
        dateDiffusion: modalCell.dateStr,
        heureDiffusion: modalCell.heure,
        ordreDiffusion: modalCell.ordre,
        statut: 'Programmé',
      });

      setModalCell(null);
      chargerDonnees();
    } catch (err) {
      setErreur(
        err.response?.data?.error || "Impossible d'enregistrer la programmation."
      );
    }
  };

  const retirer = async (prog) => {
    if (!window.confirm('Retirer cette diffusion de ce lera ?')) return;

    try {
      await deleteProgrammation(prog.id);
      chargerDonnees();
    } catch {
      /* silencieux */
    }
  };

  const semainePrecedente = () => {
    const d = new Date(semaineDebut);
    d.setDate(d.getDate() - 7);
    setSemaineDebut(d);
  };

  const semaineSuivante = () => {
    const d = new Date(semaineDebut);
    d.setDate(d.getDate() + 7);
    setSemaineDebut(d);
  };

  const cardStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    padding: '1.5rem',
    overflowX: 'auto',
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <h2 style={{ marginBottom: '0.3rem' }}>📅 Programmation — grille du PAD</h2>
      <p style={{ color: '#64748B', marginBottom: '1.2rem' }}>
        7 jours, plusieurs "lera" (créneaux) par jour. Cliquez sur un lera libre
        pour y placer un fichier déjà transféré vers le PAD.
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <button onClick={semainePrecedente} style={navBtnStyle}>
          ← Semaine précédente
        </button>
        <strong>
          {formatDate(joursSemaine[0].date)} → {formatDate(joursSemaine[6].date)}
        </strong>
        <button onClick={semaineSuivante} style={navBtnStyle}>
          Semaine suivante →
        </button>
      </div>

      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: '90px' }}>Lera</th>
              {joursSemaine.map((j) => (
                <th key={j.dateStr} style={thStyle}>
                  {j.nom}
                  <div style={{ fontWeight: 400, fontSize: '0.8rem', color: '#94A3B8' }}>
                    {j.dateStr}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lera.map((heure, ordre) => (
              <tr key={heure}>
                <td style={{ ...tdStyle, fontWeight: 700, color: mainColor }}>
                  {heure}
                </td>
                {joursSemaine.map((j) => {
                  const occupe = trouverProgrammation(j.dateStr, heure);
                  return (
                    <td
                      key={j.dateStr + heure}
                      onClick={() => ouvrirCellule(j.dateStr, heure, ordre + 1)}
                      style={{
                        ...tdStyle,
                        cursor: occupe ? 'default' : 'pointer',
                        backgroundColor: occupe ? '#DCFCE7' : '#F8FAFC',
                        minWidth: '110px',
                      }}
                    >
                      {occupe ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.4rem',
                          }}
                        >
                          <span style={{ fontSize: '0.85rem', color: '#15803D', fontWeight: 700 }}>
                            {occupe.fichier_nom || 'Fichier'}
                          </span>
                          <X
                            size={14}
                            style={{ cursor: 'pointer', color: '#DC2626' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              retirer(occupe);
                            }}
                          />
                        </div>
                      ) : (
                        <span style={{ color: '#CBD5E1' }}>+ libre</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal d'affectation */}
      {modalCell && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={20} color={mainColor} /> Placer dans ce lera
            </h3>
            <p style={{ color: '#64748B' }}>
              {modalCell.dateStr} — {modalCell.heure}
            </p>

            {erreur && (
              <div style={{ color: '#DC2626', backgroundColor: '#FEF2F2', padding: '0.7rem', borderRadius: '8px', marginBottom: '1rem' }}>
                {erreur}
              </div>
            )}

            <select
              value={fichierChoisi}
              onChange={(e) => setFichierChoisi(e.target.value)}
              style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '2px solid #E2E8F0', marginBottom: '1.2rem' }}
            >
              <option value="">-- Choisir un fichier transféré --</option>
              {fichiers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nomFichier}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setModalCell(null)} style={{ ...navBtnStyle, backgroundColor: '#F1F5F9' }}>
                Annuler
              </button>
              <button
                onClick={confirmerAffectation}
                style={{ backgroundColor: mainColor, color: '#FFF', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Programmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  padding: '0.7rem',
  borderBottom: '2px solid #E2E8F0',
  textAlign: 'center',
};

const tdStyle = {
  padding: '0.6rem',
  border: '1px solid #F1F5F9',
  textAlign: 'center',
};

const navBtnStyle = {
  backgroundColor: '#FFFFFF',
  border: '2px solid #E2E8F0',
  padding: '0.6rem 1.1rem',
  borderRadius: '10px',
  fontWeight: 700,
  cursor: 'pointer',
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.55)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: '#FFFFFF',
  padding: '2rem',
  borderRadius: '18px',
  width: '420px',
  maxWidth: '90%',
};
