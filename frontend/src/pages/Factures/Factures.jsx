import React, { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const PAR_PAGE = 5;

export default function Factures({ darkMode = false, onPrecedent }) {
  const [factures, setFactures] = useState([]);
  const [facturesArchivees, setFacturesArchivees] = useState([]);
  const [vue, setVue] = useState('actives');
  const [moisFiltre, setMoisFiltre] = useState('');
  const [anneeFiltre, setAnneeFiltre] = useState('');
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
  // FILTRE MOIS + ANNÉE
  // =========================================================
  const filtrer = (liste) => {
    return liste.filter((f) => {
      if (!f.dateFacture) return false;
      const d = new Date(f.dateFacture);
      const annee = String(d.getFullYear());
      const mois = String(d.getMonth() + 1).padStart(2, '0');

      if (anneeFiltre && annee !== anneeFiltre) return false;
      if (moisFiltre && mois !== moisFiltre) return false;
      return true;
    });
  };

  // =========================================================
  // PAGINATION
  // =========================================================
  const listeComplete =
    vue === 'actives' ? filtrer(factures) : filtrer(archiveTriee);

  const nombrePages = Math.max(1, Math.ceil(listeComplete.length / PAR_PAGE));
  const pageActuelle = Math.min(page, nombrePages);

  const facturesPage = listeComplete.slice(
    (pageActuelle - 1) * PAR_PAGE,
    pageActuelle * PAR_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [vue, moisFiltre, anneeFiltre]);

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

  const supprimerDefinitivement = async (id) => {
    if (
      !window.confirm(
        '⚠️ Supprimer DÉFINITIVEMENT cette facture ? Cette action est irréversible.'
      )
    )
      return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/factures/${id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Retirer de la liste locale
      setFacturesArchivees((anciennes) =>
        anciennes.filter((f) => f.id !== id)
      );
    } catch (err) {
      console.error(err);
      alert('Impossible de supprimer définitivement la facture.');
    }
  };

  // =========================================================
  // CONVERSION NOMBRE → LETTRES (Français)
  // =========================================================
  const nombreEnLettres = (nombre) => {
    const n = Math.floor(Number(nombre) || 0);

    if (n === 0) return 'zéro ariary';

    const unites = [
      '', 'un', 'deux', 'trois', 'quatre', 'cinq',
      'six', 'sept', 'huit', 'neuf', 'dix',
      'onze', 'douze', 'treize', 'quatorze', 'quinze',
      'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
    ];

    const dizaines = [
      '', '', 'vingt', 'trente', 'quarante',
      'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt',
    ];

    const convertirCentaine = (nb) => {
      if (nb === 0) return '';

      const c = Math.floor(nb / 100);
      const reste = nb % 100;
      let texte = '';

      if (c > 0) {
        if (c === 1) {
          texte = 'cent';
        } else {
          texte = `${unites[c]} cent${reste === 0 && c > 1 ? 's' : ''}`;
        }
      }

      if (reste > 0) {
        if (texte) texte += ' ';
        if (reste < 20) {
          texte += unites[reste];
        } else {
          const d = Math.floor(reste / 10);
          const u = reste % 10;

          if (d === 7 || d === 9) {
            texte += `${dizaines[d]}-${unites[10 + u]}`;
          } else {
            texte += dizaines[d];
            if (u === 1 && d !== 8) {
              texte += ' et un';
            } else if (u > 0) {
              texte += `-${unites[u]}`;
            }
          }
        }
      }

      return texte;
    };

    const milliards = Math.floor(n / 1000000000);
    const millions = Math.floor((n % 1000000000) / 1000000);
    const milliers = Math.floor((n % 1000000) / 1000);
    const reste = n % 1000;

    let texte = '';

    if (milliards > 0) {
      texte += `${convertirCentaine(milliards)} milliard${milliards > 1 ? 's' : ''}`;
    }
    if (millions > 0) {
      if (texte) texte += ' ';
      texte += `${convertirCentaine(millions)} million${millions > 1 ? 's' : ''}`;
    }
    if (milliers > 0) {
      if (texte) texte += ' ';
      if (milliers === 1) {
        texte += 'mille';
      } else {
        texte += `${convertirCentaine(milliers)} mille`;
      }
    }
    if (reste > 0) {
      if (texte) texte += ' ';
      texte += convertirCentaine(reste);
    }

    return `${texte} ariary`;
  };

  // =========================================================
  // IMPRESSION FACTURE
  // =========================================================
  const imprimerFacture = (facture) => {
    const w = window.open('', '_blank');

    const maintenant = new Date();
    const dateStr = maintenant.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const heureStr = maintenant.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const lignes = Array.isArray(facture.lignes) ? facture.lignes : [];
    const montantTotal = Number(facture.montantTotal || 0);
    const montantLettres = nombreEnLettres(montantTotal);

    const lignesHTML = lignes
      .map(
        (l) => `
        <tr>
          <td style="text-align:center;">${l.nbr}</td>
          <td>${l.service_nom || l.tarif_libelle || '-'}</td>
          <td style="text-align:right;">${Number(l.prixUnitaire).toLocaleString('fr-FR')} Ar</td>
          <td style="text-align:right;">${Number(l.montant).toLocaleString('fr-FR')} Ar</td>
        </tr>
      `
      )
      .join('');

    w.document.write(`
      <html>
        <head>
          <title>${facture.numeroFacture}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', serif;
              padding: 40px 50px;
              color: #000;
              font-size: 14px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 25px;
            }
            .header-left {
              font-size: 13px;
              line-height: 1.5;
            }
            .header-left .radio {
              font-size: 18px;
              font-weight: bold;
              color: #007A4D;
              margin-bottom: 4px;
            }
            .header-right {
              text-align: right;
              font-size: 13px;
              line-height: 1.6;
            }
            .header-right .facture-num {
              font-weight: bold;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px 10px;
              text-align: left;
            }
            th {
              background-color: #F0F0F0;
              font-weight: bold;
              text-align: center;
            }
            .total-ligne td {
              font-weight: bold;
              text-align: right;
            }
            .arrete {
              margin-top: 25px;
              font-size: 14px;
              line-height: 1.6;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              font-size: 14px;
            }
            .signature-bloc {
              text-align: center;
              width: 45%;
            }
            .signature-ligne {
              margin-top: 50px;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
          </style>
        </head>
        <body>

          <div class="header">
            <div class="header-left">
              <div class="radio">RADIO TSIRY</div>
              <div>Ecar Diosezy Fianarantsoa</div>
              <div>FM 105</div>
              <div>ambalapaiso-Ambony</div>
              <div>Fianarantsoa (301)</div>
              <div>Tel : 75 522 53</div>
              <div>radiotsiry@gmail.com</div>
            </div>
            <div class="header-right">
              <div>Fianarantsoa le ${dateStr} à ${heureStr}</div>
              <div class="facture-num" style="margin-top:10px;">
                FACTURE N° : ${facture.numeroFacture || '-'}
              </div>
              <div style="margin-top:8px;">
                Doit : ${facture.client_nom || '-'}
              </div>
              <div>
                Tel : ${facture.client_telephone || '-'}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:80px;">Nbr</th>
                <th>Désignation</th>
                <th style="width:150px;">P.U</th>
                <th style="width:170px;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${lignesHTML}
              <tr class="total-ligne">
                <td></td>
                <td></td>
                <td>TOTAL :</td>
                <td>${montantTotal.toLocaleString('fr-FR')} Ar</td>
              </tr>
            </tbody>
          </table>

          <div class="arrete">
            Arrêté la présente facture à la somme de :<br/>
            <strong>${montantLettres}</strong>
          </div>

          <div class="signatures">
            <div class="signature-bloc">
              <div>Le client</div>
              <div class="signature-ligne"></div>
            </div>
            <div class="signature-bloc">
              <div>Le responsable</div>
              <div class="signature-ligne"></div>
            </div>
          </div>

        </body>
      </html>
    `);

    w.document.close();
    w.focus();
    w.print();
  };

  // =========================================================
  // EXPORTS PDF / EXCEL (avec filtre mois + année)
  // =========================================================
  const construireQuery = () => {
    const params = new URLSearchParams();
    if (anneeFiltre) params.append('annee', anneeFiltre);
    if (moisFiltre) params.append('mois', moisFiltre);
    const q = params.toString();
    return q ? `?${q}` : '';
  };

  const exporterPDF = () => {
    const url = `${API_BASE_URL}/factures/export-pdf/${construireQuery()}`;
    window.open(url, '_blank');
  };

  const exporterExcel = () => {
    const url = `${API_BASE_URL}/factures/export-excel/${construireQuery()}`;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '16px', fontWeight: 700 }}>
              Filtrer par :
            </label>

            {/* MOIS */}
            <select
              value={moisFiltre}
              onChange={(e) => setMoisFiltre(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '9px',
                border: `1px solid ${couleurs.bordure}`,
                background: darkMode ? '#18181B' : '#FFF',
                color: couleurs.texte,
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              <option value="">-- Mois --</option>
              <option value="01">Janvier</option>
              <option value="02">Février</option>
              <option value="03">Mars</option>
              <option value="04">Avril</option>
              <option value="05">Mai</option>
              <option value="06">Juin</option>
              <option value="07">Juillet</option>
              <option value="08">Août</option>
              <option value="09">Septembre</option>
              <option value="10">Octobre</option>
              <option value="11">Novembre</option>
              <option value="12">Décembre</option>
            </select>

            {/* ANNÉE */}
            <select
              value={anneeFiltre}
              onChange={(e) => setAnneeFiltre(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '9px',
                border: `1px solid ${couleurs.bordure}`,
                background: darkMode ? '#18181B' : '#FFF',
                color: couleurs.texte,
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              <option value="">-- Année --</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
              <option value="2030">2030</option>
            </select>

            {/* RESET */}
            {(moisFiltre || anneeFiltre) && (
              <button
                onClick={() => {
                  setMoisFiltre('');
                  setAnneeFiltre('');
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '9px',
                  border: `1px solid ${couleurs.bordure}`,
                  background: 'transparent',
                  color: couleurs.texteSecondaire,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕ Effacer
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            <button
              onClick={exporterPDF}
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
              onClick={exporterExcel}
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
                  <th style={thStyle}>Service</th>
                  <th style={thStyle}>Tarif</th>
                  <th style={thStyle}>Montant</th>
                  <th style={thStyle}>Statut</th>
                  {vue === 'archive' ? (
                    <>
                      <th style={thStyle}>Supprimée le</th>
                      <th style={{ ...thStyle, textAlign: 'center', width: '240px' }}>
                        Actions
                      </th>
                    </>
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
                    <td style={tdStyle}>{f.service_nom || '-'}</td>
                    <td style={tdStyle}>
                      {Number(f.tarif_prix || 0).toLocaleString('fr-FR')} Ar
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
                      <>
                        <td style={tdStyle}>
                          {f.dateSuppression
                            ? new Date(f.dateSuppression).toLocaleString('fr-FR')
                            : '-'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => supprimerDefinitivement(f.id)}
                            style={actionButtonDanger()}
                          >
                            🗑 Supprimer définitivement
                          </button>
                        </td>
                      </>
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
        {/* ZONE AMBANY : TOTAL + PAGINATION                             */}
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

        {/* PAGINATION */}
        {listeComplete.length > PAR_PAGE && (
          <div
            style={{
              marginTop: '25px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '15px',
              flexWrap: 'wrap',
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