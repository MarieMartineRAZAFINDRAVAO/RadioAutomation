import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  ClipboardList,
  Music,
  CalendarClock,
  Receipt,
  Radio,
  Users,
  Settings,
  Search,
  Sun,
  Moon,
  ChevronDown,
  User,
  Lock,
  LogOut,
} from 'lucide-react';

const mainColor = '#007A4D';
const mainColorDark = '#005c3a';

const MENUS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: Home },
  { id: 'commandes', label: 'Commandes', icon: ClipboardList },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'factures', label: 'Facture', icon: Receipt },
  { id: 'fichiers-audio', label: 'Fichiers audio', icon: Music },
  { id: 'programmation', label: 'Programmation', icon: CalendarClock },
  { id: 'diffusion', label: 'Diffusion', icon: Radio },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
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
  const menuRef = useRef(null);

  useEffect(() => {
    const fermer = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOuvert(false);
      }
    };
    document.addEventListener('mousedown', fermer);
    return () => document.removeEventListener('mousedown', fermer);
  }, []);

  return (
    <header
      style={{
        background: `linear-gradient(90deg, ${mainColor}, ${mainColorDark})`,
        color: '#FFFFFF',
        padding: '0.9rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        flexWrap: 'wrap',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      {/* LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Radio size={24} color="#FFFFFF" />
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '0.5px' }}>
            RADIO TSIRY
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>La voix de votre région</div>
        </div>
      </div>

      {/* NAV PRINCIPALE */}
      <nav
        style={{
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {MENUS.map((m) => {
          const Icon = m.icon;
          const actif = activeTab === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.9rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                whiteSpace: 'nowrap',
                backgroundColor: actif ? '#FFFFFF' : 'transparent',
                color: actif ? mainColor : '#FFFFFF',
                opacity: actif ? 1 : 0.9,
              }}
            >
              <Icon size={16} /> {m.label}
            </button>
          );
        })}
      </nav>

      {/* RECHERCHE + PROFIL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
        {/* Recherche (emplacement réservé pour la recherche de lera) */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '999px',
            padding: '0.5rem 1rem',
          }}
        >
          <Search size={16} />
          <input
            placeholder="Lera automatique"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFF',
              width: '160px',
            }}
          />
        </div>

        {/* Mode clair/sombre */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: '#FFF',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Profil / menu déroulant */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '999px',
              padding: '0.35rem 0.9rem 0.35rem 0.35rem',
              cursor: 'pointer',
              color: '#FFF',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                color: mainColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
              }}
            >
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>
                {(user?.username || 'Utilisateur').toUpperCase()}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>{user?.role || 'Accueil'}</div>
            </div>
            <ChevronDown size={14} />
          </button>

          {menuOuvert && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                borderRadius: '12px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                width: '220px',
                overflow: 'hidden',
                zIndex: 100,
              }}
            >
              <MenuItem
                icon={User}
                label="Mon profil"
                onClick={() => {
                  setActiveTab('profil');
                  setMenuOuvert(false);
                }}
              />
              <MenuItem
                icon={Lock}
                label="Changer de mot de passe"
                onClick={() => {
                  setActiveTab('profil');
                  setMenuOuvert(false);
                }}
              />
              <MenuItem
                icon={Settings}
                label="Paramètres"
                onClick={() => {
                  setActiveTab('parametres');
                  setMenuOuvert(false);
                }}
              />
              <div style={{ borderTop: '1px solid #F1F5F9' }} />
              <MenuItem
                icon={LogOut}
                label="Déconnexion"
                color="#DC2626"
                onClick={() => {
                  setMenuOuvert(false);
                  onLogout();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuItem({ icon: Icon, label, onClick, color = '#0F172A' }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        width: '100%',
        padding: '0.8rem 1rem',
        border: 'none',
        background: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.9rem',
        color,
      }}
    >
      <Icon size={16} /> {label}
    </button>
  );
}
