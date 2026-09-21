import React, { useEffect, useState } from 'react';
import { User, Save, KeyRound } from 'lucide-react';

import { getMe, updateMe, changerMotDePasse } from '../../services/api';

const mainColor = '#007A4D';

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  padding: '1.8rem',
  marginBottom: '1.5rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.7rem 1rem',
  borderRadius: '10px',
  border: '2px solid #E2E8F0',
  fontSize: '1rem',
  boxSizing: 'border-box',
};

export default function Profil() {
  const [profil, setProfil] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [motDePasse, setMotDePasse] = useState({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '' });
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    getMe()
      .then((res) => {
        setProfil(res.data);
        setForm({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || '',
        });
      })
      .catch(() => setErreur('Impossible de charger le profil.'));
  }, []);

  const enregistrerProfil = async (e) => {
    e.preventDefault();
    setMessage('');
    setErreur('');

    try {
      const res = await updateMe(form);
      setProfil(res.data);
      setMessage('Profil mis à jour.');
    } catch {
      setErreur('Impossible de mettre à jour le profil.');
    }
  };

  const enregistrerMotDePasse = async (e) => {
    e.preventDefault();
    setMessage('');
    setErreur('');

    try {
      await changerMotDePasse(motDePasse);
      setMotDePasse({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '' });
      setMessage('Mot de passe modifié.');
    } catch (err) {
      setErreur(err.response?.data?.error || 'Impossible de changer le mot de passe.');
    }
  };

  if (!profil) return <div style={{ padding: '1rem' }}>Chargement du profil...</div>;

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ color: mainColor }}>👤 Mon profil</h2>

      {message && (
        <div style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '0.8rem 1.1rem', borderRadius: '10px', marginBottom: '1rem' }}>
          {message}
        </div>
      )}
      {erreur && (
        <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '0.8rem 1.1rem', borderRadius: '10px', marginBottom: '1rem' }}>
          {erreur}
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.4rem' }}>
          <div
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#DCFCE7', color: mainColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <User size={30} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{profil.username}</div>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{profil.role}</div>
          </div>
        </div>

        <form onSubmit={enregistrerProfil}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Nom</label>
              <input
                style={inputStyle}
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Prénom</label>
              <input
                style={inputStyle}
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
          </div>

          <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Email</label>
          <input
            type="email"
            style={{ ...inputStyle, marginBottom: '1.2rem' }}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <button
            type="submit"
            style={{
              backgroundColor: mainColor, color: '#FFF', border: 'none',
              padding: '0.7rem 1.4rem', borderRadius: '10px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <Save size={16} /> Enregistrer
          </button>
        </form>
      </div>

      <div style={cardStyle}>
        <h4 style={{ marginTop: 0, color: mainColor }}>Changer de mot de passe</h4>
        <form onSubmit={enregistrerMotDePasse}>
          <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Ancien mot de passe</label>
          <input
            type="password"
            style={{ ...inputStyle, marginBottom: '1rem' }}
            value={motDePasse.ancien_mot_de_passe}
            onChange={(e) => setMotDePasse({ ...motDePasse, ancien_mot_de_passe: e.target.value })}
          />

          <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Nouveau mot de passe</label>
          <input
            type="password"
            style={{ ...inputStyle, marginBottom: '1.2rem' }}
            value={motDePasse.nouveau_mot_de_passe}
            onChange={(e) => setMotDePasse({ ...motDePasse, nouveau_mot_de_passe: e.target.value })}
          />

          <button
            type="submit"
            style={{
              backgroundColor: '#F1F5F9', color: mainColor, border: `2px solid ${mainColor}`,
              padding: '0.7rem 1.4rem', borderRadius: '10px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <KeyRound size={16} /> Changer le mot de passe
          </button>
        </form>
      </div>
    </div>
  );
}
