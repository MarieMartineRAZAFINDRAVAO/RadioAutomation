
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

const mainColor = '#007A4D';
const lightGreen = '#EAF7F1';

const MENUS = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
  },
  {
    id: 'commandes',
    label: 'Commandes',
  },
  {
    id: 'factures',
    label: 'Factures',
  },
  {
    id: 'fichiers-audio',
    label: 'Fichiers audio',
  },
  {
    id: 'programmation',
    label: 'Programmation',
  },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  isDarkMode,
  setIsDarkMode,
  onLogout,
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  const [heure, setHeure] = useState(
    new Date()
  );

  const [photoProfil, setPhotoProfil] = useState(
    localStorage.getItem('photoProfil') || ''
  );

  const menuRef = useRef(null);

  // =========================================================
  // HORLOGE EN TEMPS REEL
  // =========================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setHeure(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =========================================================
  // FERMER LE MENU PARAMETRES EN DEHORS
  // =========================================================

  useEffect(() => {
    const fermerMenu = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        setMenuOuvert(false);
      }
    };

    document.addEventListener(
      'mousedown',
      fermerMenu
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        fermerMenu
      );
    };
  }, []);

  // =========================================================
  // CHANGER LA PHOTO DE PROFIL
  // =========================================================

  const changerPhotoProfil = (event) => {
    const fichier = event.target.files?.[0];

    if (!fichier) {
      return;
    }

    if (!fichier.type.startsWith('image/')) {
      return;
    }

    const lecteur = new FileReader();

    lecteur.onload = () => {
      const image = lecteur.result;

      setPhotoProfil(image);

      localStorage.setItem(
        'photoProfil',
        image
      );
    };

    lecteur.readAsDataURL(fichier);
  };

  // =========================================================
  // FORMAT HEURE
  // =========================================================

  const heureActuelle =
    heure.toLocaleTimeString(
      'fr-FR',
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }
    );

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const dateActuelle =
    heure.toLocaleDateString(
      'fr-FR',
      {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    );

  // =========================================================
  // NOM UTILISATEUR
  // =========================================================

  const username =
    user?.username ||
    'Utilisateur';

  const role =
    user?.role ||
    'Accueil';

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <header
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: isDarkMode
          ? '#12382C'
          : '#FFFFFF',
        color: isDarkMode
          ? '#FFFFFF'
          : '#17211B',
        boxShadow: isDarkMode
          ? '0 4px 18px rgba(0,0,0,0.35)'
          : '0 4px 18px rgba(0,0,0,0.08)',
        position: 'relative',
        zIndex: 100,
      }}
    >

      {/* =====================================================
          LIGNE SUPERIEURE
      ===================================================== */}

      <div
        style={{
          minHeight: '105px',
          padding: '0 3.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '3rem',
          boxSizing: 'border-box',
        }}
      >

        {/* =================================================
            LOGO + TITRE
        ================================================= */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.2rem',
            minWidth: '360px',
          }}
        >

          {/* LOGO RADIO TSIRY */}

          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: mainColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow:
                '0 5px 15px rgba(0,122,77,0.20)',
            }}
          >
            <img
              src="/tsiry.jpg"
              alt="Logo Radio Tsiry"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
              onError={(event) => {
                event.currentTarget.style.display =
                  'none';
              }}
            />
          </div>

          {/* TITRE */}

          <div
            style={{
              lineHeight: 1.15,
            }}
          >

            <div
              style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                letterSpacing: '1.2px',
                color: isDarkMode
                  ? '#FFFFFF'
                  : mainColor,
                whiteSpace: 'nowrap',
              }}
            >
              RADIO TSIRY
            </div>

            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginTop: '7px',
                color: isDarkMode
                  ? '#CDE5DA'
                  : '#475569',
                whiteSpace: 'nowrap',
              }}
            >
              AUTOMATISATION RADIO TSIRY
            </div>

          </div>

        </div>
        {/* =================================================
            ESPACE CENTRAL (vide)
        ================================================= */}

        <div
          style={{
            flex: 1,
            minWidth: '250px',
          }}
        />

        {/* =================================================
            PARTIE DROITE
        ================================================= */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexShrink: 0,
          }}
        >

          {/* =================================================
              HEURE
          ================================================= */}

          <div
            style={{
              textAlign: 'right',
              paddingRight: '1rem',
              borderRight: isDarkMode
                ? '1px solid #3B5A4D'
                : '1px solid #E2E8F0',
            }}
          >

            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 850,
                color: isDarkMode
                  ? '#FFFFFF'
                  : mainColor,
                letterSpacing: '1px',
                fontVariantNumeric:
                  'tabular-nums',
              }}
            >
              {heureActuelle}
            </div>

            <div
              style={{
                fontSize: '0.75rem',
                marginTop: '3px',
                color: isDarkMode
                  ? '#B9D7C9'
                  : '#64748B',
                fontWeight: 600,
              }}
            >
              Heure actuelle
            </div>

          </div>

          {/* =================================================
              PROFIL
          ================================================= */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              padding:
                '0.55rem 0.9rem 0.55rem 0.6rem',
              borderRadius: '14px',
              backgroundColor: isDarkMode
                ? '#1B4D3B'
                : '#F1F8F4',
              border: isDarkMode
                ? '1px solid #2F6651'
                : '1px solid #D7EAE0',
              minWidth: '190px',
              boxSizing: 'border-box',
            }}
          >

            {/* PHOTO */}

            <label
              style={{
                position: 'relative',
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: mainColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Changer la photo de profil"
            >

              {photoProfil ? (
                <img
                  src={photoProfil}
                  alt="Profil"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <span
                  style={{
                    color: '#FFFFFF',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                  }}
                >
                  {username
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={
                  changerPhotoProfil
                }
                style={{
                  display: 'none',
                }}
              />

            </label>

            {/* INFORMATIONS PROFIL */}

            <button
              type="button"
              onClick={() =>
                setActiveTab('profil')
              }
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                textAlign: 'left',
                minWidth: 0,
              }}
            >

              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 850,
                  color: isDarkMode
                    ? '#FFFFFF'
                    : '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '115px',
                }}
              >
                {username}
              </div>

              <div
                style={{
                  fontSize: '0.78rem',
                  marginTop: '5px',
                  color: isDarkMode
                    ? '#B9D7C9'
                    : '#64748B',
                  fontWeight: 650,
                }}
              >
                {role}
              </div>

            </button>

          </div>

          {/* =================================================
              PARAMETRES
          ================================================= */}

          <div
            ref={menuRef}
            style={{
              position: 'relative',
            }}
          >

            <button
              type="button"
              onClick={() =>
                setMenuOuvert(
                  !menuOuvert
                )
              }
              title="Paramètres"
              style={{
                width: '52px',
                height: '52px',
                border: isDarkMode
                  ? '1px solid #3B5A4D'
                  : '1px solid #D7EAE0',
                backgroundColor:
                  isDarkMode
                    ? '#1B4D3B'
                    : '#F1F8F4',
                color: isDarkMode
                  ? '#FFFFFF'
                  : mainColor,
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.45rem',
                transition:
                  'all 0.2s ease',
              }}
            >
              ⚙
            </button>

            {/* DROPDOWN */}

            {menuOuvert && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top:
                    'calc(100% + 12px)',
                  width: '235px',
                  backgroundColor:
                    isDarkMode
                      ? '#1F2937'
                      : '#FFFFFF',
                  borderRadius: '14px',
                  padding: '0.6rem',
                  boxShadow:
                    '0 15px 35px rgba(0,0,0,0.20)',
                  border: isDarkMode
                    ? '1px solid #374151'
                    : '1px solid #E2E8F0',
                }}
              >

                <div
                  style={{
                    padding:
                      '0.6rem 0.8rem 0.8rem',
                    fontSize: '0.85rem',
                    fontWeight: 850,
                    color: isDarkMode
                      ? '#DDF5E9'
                      : mainColor,
                  }}
                >
                  PARAMÈTRES
                </div>

                {/* MODE CLAIR */}

                <button
                  type="button"
                  onClick={() => {
                    setIsDarkMode(false);
                    setMenuOuvert(false);
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background:
                      !isDarkMode
                        ? lightGreen
                        : 'transparent',
                    color: isDarkMode
                      ? '#FFFFFF'
                      : '#334155',
                    padding:
                      '0.85rem 0.8rem',
                    textAlign: 'left',
                    borderRadius: '9px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}
                >
                  Mode clair
                </button>

                {/* MODE SOMBRE */}

                <button
                  type="button"
                  onClick={() => {
                    setIsDarkMode(true);
                    setMenuOuvert(false);
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background:
                      isDarkMode
                        ? 'rgba(255,255,255,0.10)'
                        : 'transparent',
                    color: isDarkMode
                      ? '#FFFFFF'
                      : '#334155',
                    padding:
                      '0.85rem 0.8rem',
                    textAlign: 'left',
                    borderRadius: '9px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}
                >
                  Mode sombre
                </button>

                <div
                  style={{
                    height: '1px',
                    backgroundColor:
                      isDarkMode
                        ? '#374151'
                        : '#E2E8F0',
                    margin:
                      '0.5rem 0',
                  }}
                />

                {/* DECONNEXION */}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOuvert(false);
                    onLogout();
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background:
                      'transparent',
                    color: '#DC2626',
                    padding:
                      '0.85rem 0.8rem',
                    textAlign: 'left',
                    borderRadius: '9px',
                    cursor: 'pointer',
                    fontWeight: 750,
                    fontSize: '0.95rem',
                  }}
                >
                  Déconnexion
                </button>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* =====================================================
          MENU PRINCIPAL
      ===================================================== */}

      <div
        style={{
          borderTop: isDarkMode
            ? '1px solid #2F5546'
            : '1px solid #E2EEE8',
          backgroundColor:
            isDarkMode
              ? '#0F2F24'
              : '#F8FBF9',
          padding:
            '0 3.5rem',
          boxSizing: 'border-box',
        }}
      >

        <nav
          style={{
            minHeight: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.9rem',
            flexWrap: 'wrap',
          }}
        >

          {MENUS.map((menu) => {
            const actif =
              activeTab === menu.id;

            return (
              <button
                key={menu.id}
                type="button"
                onClick={() =>
                  setActiveTab(
                    menu.id
                  )
                }
                style={{
                  border: 'none',
                  borderBottom:
                    actif
                      ? `4px solid ${mainColor}`
                      : '4px solid transparent',

                  backgroundColor:
                    actif
                      ? isDarkMode
                        ? '#1B4D3B'
                        : '#E2F3EB'
                      : 'transparent',

                  color:
                    actif
                      ? isDarkMode
                        ? '#FFFFFF'
                        : mainColor
                      : isDarkMode
                        ? '#D4E7DE'
                        : '#475569',

                  padding:
                    '1rem 1.7rem 0.85rem',

                  cursor: 'pointer',

                  fontWeight:
                    actif
                      ? 850
                      : 700,

                  fontSize: '1.05rem',

                  borderRadius:
                    '9px 9px 0 0',

                  whiteSpace:
                    'nowrap',

                  transition:
                    'all 0.2s ease',
                }}
              >
                {menu.label}
              </button>
            );
          })}

        </nav>

      </div>

    </header>
  );
}
