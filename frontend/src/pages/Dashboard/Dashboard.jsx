import React, { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const PAR_PAGE = 5;

export default function Dashboard({
  darkMode = false,
  onVoirClient,
}) {
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [pageCommandes, setPageCommandes] = useState(1);

  const [clients, setClients] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [factures, setFactures] = useState([]);
  const [fichiersAudio, setFichiersAudio] = useState([]);
  const [programmations, setProgrammations] = useState([]);

  const couleurs = {
    fond: darkMode ? '#18181B' : '#F5F8F6',
    carte: darkMode ? '#27272A' : '#FFFFFF',
    texte: darkMode ? '#F4F4F5' : '#1F2937',
    texteSecondaire: darkMode ? '#A1A1AA' : '#6B7280',
    bordure: darkMode ? '#3F3F46' : '#DDE8E2',
    vert: '#007A4D',
    vertClair: darkMode ? '#164E3B' : '#EAF7F1',
  };

  // ═══ Horloge ═══
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ═══ Charger les données ═══
  const chargerDonnees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [r1, r2, r3, r4, r5] = await Promise.all([
        fetch(`${API_BASE_URL}/clients/`, { headers }),
        fetch(`${API_BASE_URL}/commandes/`, { headers }),
        fetch(`${API_BASE_URL}/factures/?archive=false`, { headers }),
        fetch(`${API_BASE_URL}/fichiers-audio/`, { headers }),
        fetch(`${API_BASE_URL}/programmations/`, { headers }),
      ]);

      const extraire = async (r) => {
        if (!r.ok) return [];
        const d = await r.json();
        return Array.isArray(d) ? d : (d.results || []);
      };

      setClients(await extraire(r1));
      setCommandes(await extraire(r2));
      setFactures(await extraire(r3));
      setFichiersAudio(await extraire(r4));
      setProgrammations(await extraire(r5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // ═══ Statistiques ═══
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalCommandes = commandes.length;
    const totalFactures = factures.length;
    const totalFichiersAudio = fichiersAudio.length;

    const prixTotalCommandes = commandes.reduce(
      (sum, c) => sum + Number(c.montantTotal || 0),
      0
    );

    const maintenant = new Date();
    const moisActuel = maintenant.getMonth();
    const anneeActuelle = maintenant.getFullYear();

    const commandesMois = commandes.filter((c) => {
      if (!c.dateCommande) return false;
      const d = new Date(c.dateCommande);
      return d.getMonth() === moisActuel && d.getFullYear() === anneeActuelle;
    }).length;

    return {
      totalClients,
      totalCommandes,
      totalFactures,
      totalFichiersAudio,
      prixTotalCommandes,
      commandesMois,
    };
  }, [clients, commandes, factures, fichiersAudio]);

  // ═══ Commandes par mois ═══
  const commandesParMois = useMemo(() => {
    const moisNoms = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
    ];
    const compteur = Array(12).fill(0);
    const annee = now.getFullYear();

    commandes.forEach((c) => {
      if (!c.dateCommande) return;
      const d = new Date(c.dateCommande);
      if (d.getFullYear() === annee) compteur[d.getMonth()] += 1;
    });

    const max = Math.max(...compteur, 1);
    return compteur.map((v, i) => ({
      mois: moisNoms[i],
      valeur: v,
      pourcentage: (v / max) * 100,
    }));
  }, [commandes, now]);

  // ═══ Pagination des commandes récentes ═══
  const commandesRecentes = useMemo(() => {
    return commandes.slice(0, 20);
  }, [commandes]);

  const nbPagesCommandes = Math.max(
    1,
    Math.ceil(commandesRecentes.length / PAR_PAGE)
  );
  const pageActuelle = Math.min(pageCommandes, nbPagesCommandes);
  const commandesPage = commandesRecentes.slice(
    (pageActuelle - 1) * PAR_PAGE,
    pageActuelle * PAR_PAGE
  );

  // ═══ Formatage ═══
  const formatMontant = (n) =>
    Number(n || 0).toLocaleString('fr-FR') + ' Ar';

  // ═══ Styles des cartes KPI avec couleurs ═══
  const cartes = [
    {
      titre: 'Clients',
      valeur: stats.totalClients,
      couleur: '#3B82F6',
      bgIcon: 'rgba(59, 130, 246, 0.1)',
    },
    {
      titre: 'Commandes',
      valeur: stats.totalCommandes,
      couleur: '#10B981',
      bgIcon: 'rgba(16, 185, 129, 0.1)',
    },
    {
      titre: 'Factures',
      valeur: stats.totalFactures,
      couleur: '#F59E0B',
      bgIcon: 'rgba(245, 158, 11, 0.1)',
    },
    {
      titre: 'Prix total commandes',
      valeur: formatMontant(stats.prixTotalCommandes),
      couleur: '#8B5CF6',
      bgIcon: 'rgba(139, 92, 246, 0.1)',
      small: true,
    },
    {
      titre: 'Commandes ce mois',
      valeur: stats.commandesMois,
      couleur: '#EC4899',
      bgIcon: 'rgba(236, 72, 153, 0.1)',
    },
    
  ];

  // ═══ Couleurs des barres du graphique ═══
  const barColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#14B8A6', '#6366F1', '#E11D48',
  ];

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 90px)',
        backgroundColor: couleurs.fond,
        padding: '35px 45px 55px',
        color: couleurs.texte,
      }}
    >
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>

        {/* ═══ TITRE ═══ */}
        <h1
          style={{
            margin: '0 0 30px',
            fontSize: '36px',
            fontWeight: 800,
            textAlign: 'center',
            color: couleurs.vert,
            letterSpacing: '-0.5px',
          }}
        >
          Tableau de bord
        </h1>

        {/* ═══ KPI CARDS ═══ */}
                <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          {cartes.map((carte, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: couleurs.carte,
                border: `1px solid ${couleurs.bordure}`,
                borderTop: `4px solid ${carte.couleur}`,
                borderRadius: '12px',
                padding: '22px',
                boxShadow: darkMode
                  ? 'none'
                  : `0 4px 12px ${carte.couleur}15`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${carte.couleur}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = darkMode
                  ? 'none'
                  : `0 4px 12px ${carte.couleur}15`;
              }}
            >
              {/* Cercle décoratif en arrière-plan */}
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: carte.bgIcon,
                  zIndex: 0,
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    fontSize: '12px',
                    color: carte.couleur,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    marginBottom: '12px',
                  }}
                >
                  {carte.titre}
                </div>
                <div
                  style={{
                    fontSize: carte.small ? '20px' : '30px',
                    fontWeight: 800,
                    color: couleurs.texte,
                    lineHeight: 1.1,
                  }}
                >
                  {carte.valeur}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ═══ GRAPHIQUE ANIMÉ ═══ */}
        <div
          style={{
            backgroundColor: couleurs.carte,
            border: `1px solid ${couleurs.bordure}`,
            borderRadius: '14px',
            padding: '25px',
            marginBottom: '25px',
            boxShadow: darkMode ? 'none' : '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: '30px',
              fontSize: '16px',
              fontWeight: 800,
              color: couleurs.vert,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            Commandes par mois — {now.getFullYear()}
          </h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '220px',
              gap: '10px',
              padding: '0 10px',
            }}
          >
            {commandesParMois.map((m, idx) => (
              <div
                key={m.mois}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    marginBottom: '6px',
                    color:
                      m.valeur > 0
                        ? barColors[idx % barColors.length]
                        : couleurs.texteSecondaire,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {m.valeur > 0 ? m.valeur : ''}
                </div>

                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(m.pourcentage, 2)}%`,
                    background:
                      m.valeur > 0
                        ? `linear-gradient(180deg, ${barColors[idx % barColors.length]}, ${barColors[idx % barColors.length]}CC)`
                        : couleurs.bordure,
                    borderRadius: '8px 8px 4px 4px',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    minHeight: '6px',
                    animation:
                      m.valeur > 0 ? `growBar-${idx} 1s ease-out` : 'none',
                    boxShadow:
                      m.valeur > 0
                        ? `0 4px 12px ${barColors[idx % barColors.length]}40`
                        : 'none',
                    cursor: 'pointer',
                  }}
                  title={`${m.mois} : ${m.valeur} commande(s)`}
                />

                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    marginTop: '10px',
                    color: couleurs.texteSecondaire,
                  }}
                >
                  {m.mois}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ COMMANDES RÉCENTES (paginées) ═══ */}
        <div
          style={{
            backgroundColor: couleurs.carte,
            border: `1px solid ${couleurs.bordure}`,
            borderRadius: '14px',
            padding: '25px',
            boxShadow: darkMode ? 'none' : '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 800,
                color: couleurs.vert,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Commandes récentes
            </h3>

            <span
              style={{
                fontSize: '13px',
                color: couleurs.texteSecondaire,
                fontWeight: 600,
              }}
            >
              {commandes.length} commande(s)
            </span>
          </div>

          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '25px',
                color: couleurs.texteSecondaire,
                fontSize: '14px',
              }}
            >
              Chargement...
            </div>
          ) : commandes.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '25px',
                border: `1px dashed ${couleurs.bordure}`,
                borderRadius: '8px',
                color: couleurs.texteSecondaire,
                fontSize: '14px',
              }}
            >
              Aucune commande enregistrée.
            </div>
          ) : (
            <>
              <div style={{ overflow: 'hidden' }}>
                {commandesPage.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: `1px solid ${couleurs.bordure}`,
                      fontSize: '15px',
                    }}
                  >
                    <div>
                      <span
                        onClick={() => {
                          if (onVoirClient) {
                            onVoirClient(c);
                          }
                        }}
                        style={{
                          fontWeight: 700,
                          color: couleurs.texte,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textDecorationColor: couleurs.texteSecondaire,
                          textUnderlineOffset: '3px',
                        }}
                        title="Voir les détails du client"
                      >
                        {c.client_nom || '-'}
                      </span>

                      <span
                        style={{
                          marginLeft: '12px',
                          color: couleurs.texteSecondaire,
                          fontSize: '13px',
                        }}
                      >
                        {c.dateCommande
                          ? new Date(c.dateCommande).toLocaleDateString('fr-FR')
                          : '-'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        color: couleurs.texte,
                      }}
                    >
                      {formatMontant(c.montantTotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {nbPagesCommandes > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '15px',
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: `1px solid ${couleurs.bordure}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setPageCommandes(Math.max(1, pageActuelle - 1))
                    }
                    disabled={pageActuelle <= 1}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: `1px solid ${couleurs.bordure}`,
                      background: 'transparent',
                      color:
                        pageActuelle <= 1
                          ? couleurs.texteSecondaire
                          : couleurs.texte,
                      fontWeight: 700,
                      cursor:
                        pageActuelle <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ← Précédent
                  </button>

                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: couleurs.texte,
                    }}
                  >
                    Page {pageActuelle} / {nbPagesCommandes}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPageCommandes(
                        Math.min(nbPagesCommandes, pageActuelle + 1)
                      )
                    }
                    disabled={pageActuelle >= nbPagesCommandes}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor:
                        pageActuelle >= nbPagesCommandes
                          ? '#9CA3AF'
                          : couleurs.vert,
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor:
                        pageActuelle >= nbPagesCommandes
                          ? 'not-allowed'
                          : 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* Animation CSS */}
      <style>{`
        @keyframes growBar-0 { from { height: 0; } }
        @keyframes growBar-1 { from { height: 0; } }
        @keyframes growBar-2 { from { height: 0; } }
        @keyframes growBar-3 { from { height: 0; } }
        @keyframes growBar-4 { from { height: 0; } }
        @keyframes growBar-5 { from { height: 0; } }
        @keyframes growBar-6 { from { height: 0; } }
        @keyframes growBar-7 { from { height: 0; } }
        @keyframes growBar-8 { from { height: 0; } }
        @keyframes growBar-9 { from { height: 0; } }
        @keyframes growBar-10 { from { height: 0; } }
        @keyframes growBar-11 { from { height: 0; } }
      `}</style>
    </div>
  );
}