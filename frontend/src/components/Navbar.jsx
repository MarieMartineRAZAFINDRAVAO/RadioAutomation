import React, { useEffect, useRef, useState } from 'react';

const mainColor = '#007A4D';

// =========================================================
// ICONES (horloge, flèche, paramètres ihany)
// =========================================================
const Icon = ({ children, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {children}
  </svg>
);

const ICONS = {
  gear: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Icon>
  ),
  clock: (
    <Icon size={22}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
  chevron: (
    <Icon size={16}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  ),
};

const MENUS = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'commandes', label: 'Commandes' },
  { id: 'factures', label: 'Factures' },
  { id: 'fichiers-audio', label: 'Fichiers audio' },
  { id: 'programmation', label: 'Programmation' },
  { id: 'pad-config', label: 'Configuration' },
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
  const [heure, setHeure] = useState(new Date());
  const [photoProfil, setPhotoProfil] = useState(
    localStorage.getItem('photoProfil') || ''
  );
  const menuRef = useRef(null);

  // HORLOGE EN TEMPS REEL
  useEffect(() => {
    const interval = setInterval(() => setHeure(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // FERMER LE MENU PARAMETRES EN DEHORS
  useEffect(() => {
    const fermerMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOuvert(false);
      }
    };
    document.addEventListener('mousedown', fermerMenu);
    return () => document.removeEventListener('mousedown', fermerMenu);
  }, []);

  // CHANGER LA PHOTO DE PROFIL
  const changerPhotoProfil = (event) => {
    const fichier = event.target.files?.[0];
    if (!fichier || !fichier.type.startsWith('image/')) return;

    const lecteur = new FileReader();
    lecteur.onload = () => {
      const image = lecteur.result;
      setPhotoProfil(image);
      localStorage.setItem('photoProfil', image);
    };
    lecteur.readAsDataURL(fichier);
  };

  const heureActuelle = heure.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const username = user?.username || 'Utilisateur';
  const role = user?.role || 'Accueil';

  const borderColor = isDarkMode ? '#3B5A4D' : '#E2E8F0';
  const textStrong = isDarkMode ? '#FFFFFF' : '#0F172A';
  const textSoft = isDarkMode ? '#CDE5DA' : '#334155';

  const dropdownItem = {
    width: '100%',
    border: 'none',
    background: 'transparent',
    color: isDarkMode ? '#FFFFFF' : '#1E293B',
    padding: '0.75rem 0.8rem',
    textAlign: 'left',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: '0.95rem',
  };

  const separator = {
    height: '1px',
    backgroundColor: isDarkMode ? '#374151' : '#E2E8F0',
    margin: '0.3rem 0',
  };

  return (
    <header
      style={{
        width: '100%',
        boxSizing: 'border-box',
        position: 'sticky',  // ✅ Ampiana ity
        top: 0,              // ✅ Ampiana ity
        backgroundColor: isDarkMode ? '#12382C' : '#FFFFFF',
        color: textStrong,
        boxShadow: isDarkMode
          ? '0 4px 18px rgba(0,0,0,0.35)'
          : '0 4px 18px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: '100%',
          minHeight: '96px',
          padding: '0 1.5rem',
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          boxSizing: 'border-box',
        }}
      >
        {/* ============ LOGO + TITRE (sisiny havia) ============ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/tsiry.jpg"
              alt="Logo Radio Tsiry"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          </div>

          <div style={{ lineHeight: 1.15 }}>
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                color: isDarkMode ? '#FFFFFF' : mainColor,
                whiteSpace: 'nowrap',
              }}
            >
              RADIO TSIRY
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: textSoft,
                whiteSpace: 'nowrap',
                letterSpacing: '0.5px',
              }}
            >
              AUTOMATISATION
            </div>
          </div>
        </div>

        {/* ============ MENU PRINCIPAL (soratra fotsiny, andalana iray) ============ */}
        <nav
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'center',
            gap: '0.4rem',
            flex: 1,
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          {MENUS.map((menu) => {
            const actif = activeTab === menu.id;

            return (
              <button
                key={menu.id}
                type="button"
                onClick={() => setActiveTab(menu.id)}
                style={{
                  border: 'none',
                  backgroundColor: actif
                    ? isDarkMode
                      ? '#1B4D3B'
                      : '#D9F2E8'
                    : 'transparent',
                  color: actif
                    ? isDarkMode
                      ? '#FFFFFF'
                      : mainColor
                    : textStrong,
                  padding: '0.75rem 1.1rem',
                  cursor: 'pointer',
                  fontWeight: actif ? 900 : 800,
                  fontSize: '1rem',
                  borderRadius: '12px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                {menu.label}
              </button>
            );
          })}
        </nav>

        {/* ============ HEURE + PROFIL + PARAMETRES (sisiny havanana) ============ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexShrink: 0,
          }}
        >
          {/* HEURE */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              paddingRight: '1rem',
              borderRight: `1px solid ${borderColor}`,
              color: isDarkMode ? '#FFFFFF' : mainColor,
            }}
          >
            {ICONS.clock}
            <div>
              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.1,
                }}
              >
                {heureActuelle}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  marginTop: '2px',
                  color: textSoft,
                  fontWeight: 700,
                }}
              >
                Heure actuelle
              </div>
            </div>
          </div>

          {/* PROFIL */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              paddingRight: '1rem',
              borderRight: `1px solid ${borderColor}`,
            }}
          >
            <label
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
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
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 900 }}>
                  {username.charAt(0).toUpperCase()}
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={changerPhotoProfil}
                style={{ display: 'none' }}
              />
            </label>

            <button
              type="button"
              onClick={() => setActiveTab('profil')}
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
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: textStrong,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '110px',
                }}
              >
                {username}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  marginTop: '2px',
                  color: textSoft,
                  fontWeight: 700,
                }}
              >
                {role}
              </div>
            </button>

            <span style={{ color: mainColor, display: 'flex' }}>{ICONS.chevron}</span>
          </div>

          {/* PARAMETRES */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOuvert(!menuOuvert)}
              title="Paramètres"
              style={{
                width: '48px',
                height: '48px',
                border: 'none',
                backgroundColor: isDarkMode ? '#1B4D3B' : '#E2F3EB',
                color: isDarkMode ? '#FFFFFF' : mainColor,
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              {ICONS.gear}
            </button>

            {menuOuvert && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  width: '220px',
                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                  borderRadius: '12px',
                  padding: '0.5rem',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.20)',
                  border: isDarkMode ? '1px solid #374151' : '1px solid #E2E8F0',
                  zIndex: 999,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profil');
                    setMenuOuvert(false);
                  }}
                  style={dropdownItem}
                >
                  👤 Profil
                </button>

                <div style={separator} />

                <button
                  type="button"
                  onClick={() => {
                    setIsDarkMode(!isDarkMode);
                    setMenuOuvert(false);
                  }}
                  style={dropdownItem}
                >
                  {isDarkMode ? '☀️ Mode clair' : '🌙 Mode sombre'}
                </button>

                <div style={separator} />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOuvert(false);
                    onLogout();
                  }}
                  style={{ ...dropdownItem, color: '#DC2626', fontWeight: 900 }}
                >
                  🚪 Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}