import React, { useEffect, useState } from 'react';
import { Radio, CheckCircle2, Clock } from 'lucide-react';

import { getProgrammations, getPadConfig } from '../../services/api';

const mainColor = '#007A4D';

function heureActuelle() {
  const d = new Date();
  return d.toTimeString().slice(0, 5); // HH:MM
}

export default function Diffusion() {
  const [lera, setLera] = useState([]);
  const [programmationsJour, setProgrammationsJour] = useState([]);
  const [maintenant, setMaintenant] = useState(heureActuelle());

  const aujourdHui = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getPadConfig()
      .then((res) => setLera(res.data.lera_slots || []))
      .catch(() => setLera(['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']));

    getProgrammations()
      .then((res) =>
        setProgrammationsJour(
          res.data.filter((p) => p.dateDiffusion === aujourdHui)
        )
      )
      .catch(() => {});

    const timer = setInterval(() => setMaintenant(heureActuelle()), 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trouver = (heure) =>
    programmationsJour.find((p) => p.heureDiffusion?.slice(0, 5) === heure);

  // Le lera "en cours" = le dernier créneau déjà passé dans la journée
  const leraEnCours = [...lera].reverse().find((h) => h <= maintenant);

  const cardStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    padding: '1.5rem',
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <h2 style={{ marginBottom: '0.3rem' }}>📡 Diffusion — aujourd'hui</h2>
      <p style={{ color: '#64748B', marginBottom: '1.2rem' }}>
        Ce que la radio lit dans le PAD pour la journée du {aujourdHui}.
        Le lera en cours correspond au dernier créneau déjà atteint.
      </p>

      <div style={cardStyle}>
        {lera.map((heure) => {
          const prog = trouver(heure);
          const enCours = heure === leraEnCours;

          return (
            <div
              key={heure}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.9rem 0.5rem',
                borderBottom: '1px solid #F1F5F9',
                backgroundColor: enCours ? '#F0FDF4' : 'transparent',
                borderRadius: enCours ? '10px' : 0,
              }}
            >
              <div
                style={{
                  width: '70px',
                  fontWeight: 800,
                  color: enCours ? mainColor : '#334155',
                }}
              >
                {heure}
              </div>

              {enCours && (
                <Radio size={18} color={mainColor} className="pulse" />
              )}

              {prog ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} color="#15803D" />
                  <span style={{ fontWeight: 600 }}>
                    {prog.fichier_nom || 'Fichier programmé'}
                  </span>
                  {enCours && (
                    <span
                      style={{
                        backgroundColor: mainColor,
                        color: '#FFF',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                      }}
                    >
                      EN COURS
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} /> lera vide (rien de programmé)
                </span>
              )}
            </div>
          );
        })}

        {lera.length === 0 && (
          <p style={{ color: '#94A3B8' }}>Aucun lera configuré.</p>
        )}
      </div>

      <style>{`
        .pulse { animation: pulseAnim 1.4s ease-in-out infinite; }
        @keyframes pulseAnim { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
