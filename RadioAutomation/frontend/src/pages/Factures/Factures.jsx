import React, { useEffect, useState } from 'react';
import { Receipt, Printer } from 'lucide-react';

import { getFactures } from '../../services/api';

const mainColor = '#007A4D';

const STATUT_STYLE = {
  'Payée': { bg: '#DCFCE7', color: '#15803D' },
  'En attente': { bg: '#FEF9C3', color: '#854D0E' },
  'Annulée': { bg: '#FEF2F2', color: '#DC2626' },
};

export default function Factures() {
  const [factures, setFactures] = useState([]);

  useEffect(() => {
    getFactures().then((res) => setFactures(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h2 style={{ color: mainColor }}>🧾 Factures</h2>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          padding: '1.5rem',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '0.6rem' }}>N° Facture</th>
              <th style={{ padding: '0.6rem' }}>Client</th>
              <th style={{ padding: '0.6rem' }}>Date</th>
              <th style={{ padding: '0.6rem' }}>Montant</th>
              <th style={{ padding: '0.6rem' }}>Statut</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                  <Receipt size={28} style={{ marginBottom: '0.5rem' }} />
                  <div>Aucune facture pour le moment.</div>
                  <div style={{ fontSize: '0.85rem' }}>
                    Une facture est générée automatiquement à la fin de l'assistant "Nouvelle commande".
                  </div>
                </td>
              </tr>
            )}

            {factures.map((f) => {
              const s = STATUT_STYLE[f.statut] || STATUT_STYLE['En attente'];
              return (
                <tr key={f.idFacture || f.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 700 }}>{f.numeroFacture}</td>
                  <td style={{ padding: '0.6rem' }}>{f.client_nom}</td>
                  <td style={{ padding: '0.6rem' }}>
                    {f.dateFacture ? new Date(f.dateFacture).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '0.6rem', fontWeight: 700 }}>
                    {Number(f.montantTotal).toLocaleString()} Ar
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    <span
                      style={{
                        backgroundColor: s.bg, color: s.color, padding: '0.3rem 0.7rem',
                        borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700,
                      }}
                    >
                      {f.statut}
                    </span>
                  </td>
                  <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                    <button
                      onClick={() => window.print()}
                      style={{
                        background: 'none', border: `1px solid ${mainColor}`, color: mainColor,
                        borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      }}
                    >
                      <Printer size={14} /> Imprimer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
