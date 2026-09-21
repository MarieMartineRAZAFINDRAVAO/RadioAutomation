import React, { useEffect, useState } from 'react';
import { Radio, ClipboardList, Receipt, CalendarClock } from 'lucide-react';

import { getCommandes, getFactures, getProgrammations } from '../../services/api';

const mainColor = '#007A4D';

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  padding: '1.4rem',
};

export default function Dashboard() {
  const [commandes, setCommandes] = useState([]);
  const [factures, setFactures] = useState([]);
  const [diffusions, setDiffusions] = useState([]);

  useEffect(() => {
    getCommandes().then((r) => setCommandes(r.data)).catch(() => {});
    getFactures().then((r) => setFactures(r.data)).catch(() => {});

    const aujourdHui = new Date().toISOString().split('T')[0];
    getProgrammations()
      .then((r) => setDiffusions(r.data.filter((p) => p.dateDiffusion >= aujourdHui)))
      .catch(() => {});
  }, []);

  const username = (localStorage.getItem('username') || 'Utilisateur').toUpperCase();
  const dernieresCommandes = [...commandes]
    .sort((a, b) => new Date(b.dateCommande) - new Date(a.dateCommande))
    .slice(0, 5);
  const prochainesDiffusions = [...diffusions]
    .sort((a, b) => (a.dateDiffusion + a.heureDiffusion).localeCompare(b.dateDiffusion + b.heureDiffusion))
    .slice(0, 5);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
      {/* COLONNE GAUCHE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div style={cardStyle}>
          <p style={{ margin: 0, color: '#64748B' }}>Bonjour,</p>
          <h3 style={{ margin: '0.2rem 0 0', color: mainColor }}>{username}</h3>
          <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Accueil</span>
        </div>

        <div
          style={{
            ...cardStyle,
            background: `linear-gradient(135deg, ${mainColor}, #005c3a)`,
            color: '#FFF',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
          }}
        >
          <Radio size={28} />
          <div>
            <div style={{ fontWeight: 800 }}>Radio Tsiry</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Automatisation de la diffusion</div>
          </div>
        </div>

        <div style={cardStyle}>
          <h4 style={{ marginTop: 0, color: mainColor }}>Résumé du jour</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
            <StatMini icon={ClipboardList} label="Commandes" value={commandes.length} />
            <StatMini icon={Receipt} label="Factures" value={factures.length} />
            <StatMini icon={CalendarClock} label="Diffusions" value={diffusions.length} />
          </div>
        </div>

        <div style={cardStyle}>
          <h4 style={{ marginTop: 0, color: mainColor }}>Prochaines diffusions</h4>
          {prochainesDiffusions.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', margin: '1rem 0' }}>
              Aucune diffusion programmée.
            </p>
          ) : (
            prochainesDiffusions.map((p) => (
              <div key={p.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                <strong>{p.dateDiffusion}</strong> — {p.heureDiffusion?.slice(0, 5)} — {p.fichier_nom || 'Fichier'}
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLONNE DROITE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div
          style={{
            ...cardStyle,
            background: `linear-gradient(135deg, ${mainColor}, #003d27)`,
            color: '#FFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '220px',
            textAlign: 'center',
          }}
        >
          <Radio size={48} />
          <h2 style={{ margin: '0.6rem 0 0.2rem', letterSpacing: '1px' }}>RADIO TSIRY</h2>
          <p style={{ margin: 0, opacity: 0.85 }}>La voix de votre région</p>
        </div>

        <div style={cardStyle}>
          <h4 style={{ marginTop: 0, color: mainColor }}>Dernières commandes</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '0.5rem' }}>N°</th>
                <th style={{ padding: '0.5rem' }}>Client</th>
                <th style={{ padding: '0.5rem' }}>Date</th>
                <th style={{ padding: '0.5rem' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {dernieresCommandes.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                    Aucune commande pour le moment.
                  </td>
                </tr>
              ) : (
                dernieresCommandes.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.5rem' }}>#{c.id}</td>
                    <td style={{ padding: '0.5rem' }}>{c.client_nom || c.client}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {c.dateCommande ? new Date(c.dateCommande).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{c.statut}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatMini({ icon: Icon, label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <Icon size={18} color={mainColor} style={{ marginBottom: '0.3rem' }} />
      <div style={{ fontWeight: 900, fontSize: '1.3rem' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{label}</div>
    </div>
  );
}
