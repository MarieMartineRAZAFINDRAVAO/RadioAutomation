import React, { useState } from 'react';
import { Settings, Users, Save as SaveIcon, DatabaseBackup, Sliders } from 'lucide-react';

const mainColor = '#007A4D';

const ONGLETS = [
  { id: 'general', label: 'Général', icon: Settings },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
  { id: 'sauvegarde', label: 'Sauvegarde', icon: DatabaseBackup },
  { id: 'systeme', label: 'Système', icon: Sliders },
];

export default function Parametres() {
  const [onglet, setOnglet] = useState('general');
  const [nomRadio, setNomRadio] = useState('Radio Tsiry');
  const [message, setMessage] = useState('');

  const enregistrer = (e) => {
    e.preventDefault();
    localStorage.setItem('nomRadio', nomRadio);
    setMessage('Paramètres enregistrés.');
    setTimeout(() => setMessage(''), 2500);
  };

  return (
    <div>
      <h2 style={{ color: mainColor }}>⚙️ Paramètres</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
        {/* ONGLETS */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            padding: '1rem',
            height: 'fit-content',
          }}
        >
          {ONGLETS.map((o) => {
            const Icon = o.icon;
            const actif = onglet === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setOnglet(o.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  marginBottom: '0.3rem',
                  border: 'none',
                  borderRadius: '10px',
                  backgroundColor: actif ? '#DCFCE7' : 'transparent',
                  color: actif ? mainColor : '#334155',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon size={16} /> {o.label}
              </button>
            );
          })}
        </div>

        {/* CONTENU */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            padding: '1.8rem',
          }}
        >
          {onglet === 'general' && (
            <>
              <h4 style={{ marginTop: 0 }}>Informations générales</h4>

              {message && (
                <div style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '0.7rem 1rem', borderRadius: '10px', marginBottom: '1rem' }}>
                  {message}
                </div>
              )}

              <form onSubmit={enregistrer}>
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Nom de la radio</label>
                <input
                  value={nomRadio}
                  onChange={(e) => setNomRadio(e.target.value)}
                  style={{
                    width: '100%', padding: '0.7rem 1rem', borderRadius: '10px',
                    border: '2px solid #E2E8F0', marginBottom: '1.4rem', boxSizing: 'border-box',
                  }}
                />

                <button
                  type="submit"
                  style={{
                    backgroundColor: mainColor, color: '#FFF', border: 'none',
                    padding: '0.7rem 1.4rem', borderRadius: '10px', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}
                >
                  <SaveIcon size={16} /> Enregistrer
                </button>
              </form>
            </>
          )}

          {onglet === 'utilisateurs' && (
            <p style={{ color: '#94A3B8' }}>
              La gestion des comptes utilisateurs (Accueil, Admin, Technicien) sera
              disponible ici.
            </p>
          )}

          {onglet === 'sauvegarde' && (
            <p style={{ color: '#94A3B8' }}>
              Options de sauvegarde de la base de données à venir.
            </p>
          )}

          {onglet === 'systeme' && (
            <p style={{ color: '#94A3B8' }}>
              Informations système et configuration technique (PAD, SMB) à venir ici.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
