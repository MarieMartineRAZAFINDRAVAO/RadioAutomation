import React, { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const PAR_PAGE = 5;

export default function Factures({ darkMode = false, onPrecedent }) {
  const [factures, setFactures] = useState([]);
  const [facturesArchivees, setFacturesArchivees] = useState([]);
  const [vue, setVue] = useState('actives');
  const [moisFiltre, setMoisFiltre] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const couleurs = {
    fond: darkMode ? '#18181B' : '#F5F8F6',
    carte: darkMode ? '#27272A' : '#FFFFFF',
    texte: darkMode ? '#F4F4F5' : '#1F2937',
    texteSecondaire: darkMode ? '#A1A1AA' : '#6B7280',
    bordure: darkMode ? '#3F3F46' : '#DDE8E2',
    vert: '#007A4D',
    vertClair: darkMode ? '#164E3B' : '#EAF7F1',
    rouge: '#DC2626',
    bleu: '#0284C7',
  };

  // =========================================================
  // CHARGER LES FACTURES
  // =========================================================
  const charger = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const r1 = await fetch(`${API_BASE_URL}/factures/?archive=false`, { headers });
      const d1 = await r1.json();
      setFactures(Array.isArray(d1) ? d1 : d1.results || []);

      const r2 = await fetch(`${API_BASE_URL}/factures/?archive=true`, { headers });
      const d2 = await r2.json();
      setFacturesArchivees(Array.isArray(d2) ? d2 : d2.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  // =========================================================
  // TRI ARCHIVE
  // =========================================================
  const archiveTriee = useMemo(() => {
    return [...facturesArchivees].sort((a, b) => {
      const da = a.dateSuppression ? new Date(a.dateSuppression) : new Date(0);
      const db = b.dateSuppression ? new Date(b.dateSuppression) : new Date(0);
      return db - da;
    });
  }, [facturesArchivees]);

  // =========================================================
  // FILTRE MOIS
  // =========================================================
  const filtrerParMois = (liste) => {
    if (!moisFiltre) return liste;
    return liste.filter((f) => {
      const d = new Date(f.dateFacture);
      const annee = d.getFullYear();
      const mois = String(d.getMonth() + 1).padStart(2, '0');
      return `${annee}-${mois}` === moisFiltre;
    });
  };

  // =========================================================
  // PAGINATION
  // =========================================================
  const listeComplete =
    vue === 'actives' ? filtrerParMois(factures) : filtrerParMois(archiveTriee);

  const nombrePages = Math.max(1, Math.ceil(listeComplete.length / PAR_PAGE));
  const pageActuelle = Math.min(page, nombrePages);

  const facturesPage = listeComplete.slice(
    (pageActuelle - 1) * PAR_PAGE,
    pageActuelle * PAR_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [vue, moisFiltre]);

  // =========================================================
  // MONTANT TOTAL
  // =========================================================
  const totalPage = useMemo(() => {
    return facturesPage.reduce((s, f) => s + Number(f.montantTotal || 0), 0);
  }, [facturesPage]);

  // =========================================================
  // ACTIONS
  // =========================================================
  const archiverFacture = async (id) => {
    if (!window.confirm('Archiver cette facture ?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/factures/${id}/archiver/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      charger();
    } catch (err) {
      alert('Erreur');
    }
  };

  const imprimerFacture = (facture) => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>${facture.numeroFacture}</title>
          <style>
            body { font-family: Arial; padding: 40px; }
            h1 { color: #007A4D; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 12px; text-align: left; font-size: 16px; }
            .total { font-size: 24px; font-weight: bold; color: #007A4D; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>RADIO TSIRY</h1>
          <h2>FACTURE ${facture.numeroFacture}</h2>
          <p><strong>Client :</strong> ${facture.client_nom || '-'}</p>
          <p><strong>Date :</strong> ${new Date(facture.dateFacture).toLocaleString('fr-FR')}</p>
          <table>
            <tr><th>Montant</th><th>Statut</th></tr>
            <tr><td>${Number(facture.montantTotal).toLocaleString('fr-FR')} Ar</td><td>${facture.statut}</td></tr>
          </table>
          <p class="total">TOTAL : ${Number(facture.montantTotal).toLocaleString('fr-FR')} Ar</p>
        </body>
      </html>
    `);
    w.document.close();
    w.print();
  };

  const exporterPDF = (mois) => {
    const url = mois
      ? `${API_BASE_URL}/factures/export-pdf/?mois=${mois}`
      : `${API_BASE_URL}/factures/export-pdf/`;
    window.open(url, '_blank');
  };

  const exporterExcel = (mois) => {
    const url = mois
      ? `${API_BASE_URL}/factures/export-excel/?mois=${mois}`
      : `${API_BASE_URL}/factures/export-excel/`;
    window.open(url, '_blank');
  };

  const formatMontant = (n) => Number(n || 0).toLocaleString('fr-FR');

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
        <h1
          style={{
            margin: '0 0 30px',
            fontSize: '38px',
            fontWeight: 800,
            textAlign: 'center',
            color: couleurs.vert,
          }}
        >
          Factures
        </h1>

        {/* ONGLETS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setVue('actives')}
            style={{
              padding: '12px 22px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '16px',
              backgroundColor: vue === 'actives' ? couleurs.vert : couleurs.carte,
              color: vue === 'actives' ? '#FFF' : couleurs.texte,
            }}
          >
            Factures actives ({factures.length})
          </button>
          <button
            onClick={() => setVue('archive')}
            style={{
              padding: '12px 22px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '16px',
              backgroundColor: vue === 'archive' ? couleurs.vert : couleurs.carte,
              color: vue === 'archive' ? '#FFF' : couleurs.texte,
            }}
          >
            Archive ({facturesArchivees.length})
          </button>
        </div>

        {/* FILTRES + EXPORTS */}
        <div
          style={{
            backgroundColor: couleurs.carte,
            border: `1px solid ${couleurs.bordure}`,
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '16px', fontWeight: 700 }}>
              Filtrer par mois :
            </label>
            <input
              type="month"
              value={moisFiltre}
              onChange={(e) => setMoisFiltre(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '9px',
                border: `1px solid ${couleurs.bordure}`,
                background: darkMode ? '#18181B' : '#FFF',
                color: couleurs.texte,
                fontSize: '16px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            <button
              onClick={() => exporterPDF(moisFiltre)}
              style={{
                padding: '11px 20px',
                borderRadius: '9px',
                border: 'none',
                background: couleurs.bleu,
                color: '#FFF',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              Exporter PDF
            </button>
            <button
              onClick={() => exporterExcel(moisFiltre)}
              style={{
                padding: '11px 20px',
                borderRadius: '9px',
                border: 'none',
                background: couleurs.vert,
                color: '#FFF',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '15px',
              }}
            >
              Exporter Excel
            </button>
          </div>
        </div>

        {/* LISTE */}
        <div
          style={{
            backgroundColor: couleurs.carte,
            border: `1px solid ${couleurs.bordure}`,
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: couleurs.texteSecondaire,
                fontSize: '17px',
              }}
            >
              Chargement...
            </div>
          ) : facturesPage.length === 0 ? (
            <div
              style={{
                padding: '50px',
                textAlign: 'center',
                color: couleurs.texteSecondaire,
                fontSize: '17px',
              }}
            >
              {vue === 'actives' ? 'Aucune facture active' : 'Aucune facture archivée'}
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '16px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: darkMode ? '#1E293B' : '#F1F5F9' }}>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Montant</th>
                  <th style={thStyle}>Statut</th>
                  {vue === 'archive' ? (
                    <th style={thStyle}>Supprimée le</th>
                  ) : (
                    <th style={{ ...thStyle, textAlign: 'center', width: '240px' }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {facturesPage.map((f) => (
                  <tr
                    key={f.id}
                    style={{ borderTop: `1px solid ${couleurs.bordure}` }}
                  >
                    <td style={tdStyle}>{f.client_nom || '-'}</td>
                    <td style={tdStyle}>
                      {f.dateFacture
                        ? new Date(f.dateFacture).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td style={tdStyle}>{formatMontant(f.montantTotal)} Ar</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: 700,
                          backgroundColor:
                            f.statut === 'Payé' ? '#DCFCE7' : '#FEF3C7',
                          color: f.statut === 'Payé' ? '#15803D' : '#92400E',
                        }}
                      >
                        {f.statut}
                      </span>
                    </td>
                    {vue === 'archive' ? (
                      <td style={tdStyle}>
                        {f.dateSuppression
                          ? new Date(f.dateSuppression).toLocaleString('fr-FR')
                          : '-'}
                      </td>
                    ) : (
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            gap: '10px',
                          }}
                        >
                          <button
                            onClick={() => imprimerFacture(f)}
                            style={actionButtonOutline(couleurs)}
                          >
                            Imprimer
                          </button>
                          <button
                            onClick={() => archiverFacture(f.id)}
                            style={actionButtonDanger()}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ============================================================ */}
        {/* ZONE AMBANY : TOTAL + PAGINATION + PRÉCÉDENT                */}
        {/* ============================================================ */}

        {listeComplete.length > 0 && (
          <div style={{ marginTop: '25px' }}>
            {/* TOTAL */}
            <div
              style={{
                padding: '18px 24px',
                backgroundColor: couleurs.vertClair,
                border: `1px solid ${couleurs.bordure}`,
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 700 }}>
                Total page
              </span>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 900,
                  color: couleurs.vert,
                }}
              >
                {formatMontant(totalPage)} Ar
              </span>
            </div>
          </div>
        )}

        {/* PAGINATION + PRÉCÉDENT */}
        <div
          style={{
            marginTop: '25px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '15px',
            flexWrap: 'wrap',
          }}
        >
          {/* PRÉCÉDENT (retour à Étape 3) */}
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
                fontSize: '16px',
              }}
            >
              ← Précédent
            </button>
          )}

          {/* PAGINATION */}
          {listeComplete.length > PAR_PAGE && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '15px',
                marginLeft: 'auto',
              }}
            >
              <button
                onClick={() => {
                  if (pageActuelle > 1) {
                    setPage(pageActuelle - 1);
                  }
                }}
                disabled={pageActuelle <= 1}
                style={{
                  padding: '13px 25px',
                  borderRadius: '10px',
                  border: `1px solid ${couleurs.bordure}`,
                  background: 'transparent',
                  color: pageActuelle <= 1 ? '#9CA3AF' : couleurs.texte,
                  fontWeight: 700,
                  cursor: pageActuelle <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                }}
              >
                ← Page précédente
              </button>

              <span style={{ fontSize: '16px', fontWeight: 700 }}>
                Page {pageActuelle} / {nombrePages}
              </span>

              <button
                onClick={() => {
                  if (pageActuelle < nombrePages) {
                    setPage(pageActuelle + 1);
                  }
                }}
                disabled={pageActuelle >= nombrePages}
                style={{
                  padding: '13px 25px',
                  borderRadius: '10px',
                  border: 'none',
                  background:
                    pageActuelle >= nombrePages ? '#9CA3AF' : couleurs.vert,
                  color: '#FFF',
                  fontWeight: 700,
                  cursor:
                    pageActuelle >= nombrePages ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                }}
              >
                Page suivante →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =========================================================
// STYLES
// =========================================================
const thStyle = {
  padding: '16px',
  textAlign: 'left',
  fontWeight: 800,
  fontSize: '16px',
};

const tdStyle = {
  padding: '16px',
  fontSize: '16px',
};

const actionButtonOutline = (couleurs) => ({
  padding: '9px 20px',
  borderRadius: '8px',
  border: `1px solid ${couleurs.bordure}`,
  background: 'transparent',
  color: couleurs.texte,
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const actionButtonDanger = () => ({
  padding: '9px 20px',
  borderRadius: '8px',
  border: 'none',
  background: '#FEE2E2',
  color: '#DC2626',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});