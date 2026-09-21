import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// =========================================================
// FIX ICÔNE LEAFLET (Vite + React)
// =========================================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// =========================================================
// ICÔNE VERT (Radio Tsiry)
// =========================================================
const iconeRadio = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -40],
  shadowSize: [48, 48],
});

// =========================================================
// ICÔNE ROUGE (Toerana misy anao)
// =========================================================
const iconeMoi = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -40],
  shadowSize: [48, 48],
});

// =========================================================
// COORDONNÉES RADIO TSIRY — AMBALAPAISO
// =========================================================
const POSITION_RADIO = [-21.4526, 47.0856];

// Ordre des sections utilisé pour la navbar + la détection de scroll
const SECTIONS_ORDER = ['accueil', 'apropos', 'equipe', 'services', 'localisation'];

// =========================================================
// COMPOSANT : Boutons de navigation sur la carte
// =========================================================
function BoutonsCarte({ positionUtilisateur }) {
  const map = useMap();

  const voirLesDeux = useCallback(() => {
    if (positionUtilisateur) {
      const bounds = L.latLngBounds([POSITION_RADIO, positionUtilisateur]);
      map.fitBounds(bounds, { padding: [100, 100] });
    } else {
      map.setView(POSITION_RADIO, 15);
    }
  }, [map, positionUtilisateur]);

  const voirRadio = useCallback(() => {
    map.setView(POSITION_RADIO, 16);
  }, [map]);

  const voirMoi = useCallback(() => {
    if (positionUtilisateur) {
      map.setView(positionUtilisateur, 16);
    } else {
      alert('Position non disponible. Veuillez autoriser la géolocalisation.');
    }
  }, [map, positionUtilisateur]);

  const btnStyle = (bg) => ({
    padding: '12px 18px',
    background: bg,
    color: '#FFF',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 800,
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <button type="button" onClick={voirLesDeux} style={btnStyle('#007A4D')}>
        🎯 Voir les deux
      </button>
      <button type="button" onClick={voirRadio} style={btnStyle('#005F3C')}>
        🟢 Radio Tsiry
      </button>
      <button type="button" onClick={voirMoi} style={btnStyle('#DC2626')}>
        🔴 Ma position
      </button>
    </div>
  );
}

// =========================================================
// COMPOSANT : Position utilisateur + auto-zoom
// =========================================================
function MaPosition({ onPositionChange }) {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) {
      return undefined;
    }

    let annule = false;
    let timeoutId = null;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (annule) return;

        const p = [pos.coords.latitude, pos.coords.longitude];
        setPosition(p);

        if (onPositionChange) {
          onPositionChange(p);
        }

        timeoutId = setTimeout(() => {
          if (annule) return;
          const bounds = L.latLngBounds([POSITION_RADIO, p]);
          map.fitBounds(bounds, { padding: [100, 100] });
        }, 800);
      },
      (err) => {
        console.warn('Géolocalisation refusée :', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Nettoyage : évite un setState / fitBounds après démontage du composant
    return () => {
      annule = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [map, onPositionChange]);

  if (!position) return null;

  return (
    <Marker position={position} icon={iconeMoi}>
      <Popup>
        <strong style={{ color: '#DC2626', fontSize: '15px' }}>
          📍 Vous êtes ici
        </strong>
        <br />
        Latitude : {position[0].toFixed(5)}
        <br />
        Longitude : {position[1].toFixed(5)}
      </Popup>
    </Marker>
  );
}

// =========================================================
// COMPOSANT PRINCIPAL
// =========================================================
export default function Home({ onSeConnecter, darkMode = false, setIsDarkMode }) {
  const [sectionActive, setSectionActive] = useState('accueil');
  const [positionUtilisateur, setPositionUtilisateur] = useState(null);

  // Le fond du hero est piloté directement via une ref (pas de state),
  // pour éviter un re-render de tout l'arbre à chaque pixel de scroll.
  const heroBgRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const mettreAJour = () => {
      ticking = false;

      // Effet de zoom léger sur l'image du hero, sans re-render React
      if (heroBgRef.current) {
        const scale = 1 + window.scrollY * 0.0005;
        heroBgRef.current.style.transform = `scale(${scale})`;
      }

      // ⚠️ FILAHARANA : Accueil → À propos → Équipe → Services → Localisation
      const scrollPosition = window.scrollY + 250;

      for (const id of SECTIONS_ORDER) {
        const element = document.getElementById(id);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setSectionActive((precedent) => (precedent === id ? precedent : id));
            break;
          }
        }
      }
    };

    const handleScroll = () => {
      // Regroupe les calculs sur une seule frame d'animation par scroll,
      // plutôt que de tout recalculer à chaque évènement "scroll".
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(mettreAJour);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const vert = '#007A4D';
  const vertFonce = '#005F3C';
  const vertClair = darkMode ? 'rgba(0, 122, 77, 0.15)' : '#EAF7F1';
  const texte = darkMode ? '#F4F4F5' : '#1F2937';
  const texteSecondaire = darkMode ? '#A1A1AA' : '#6B7280';
  const bordure = darkMode ? '#3F3F46' : '#DDE8E2';
  const fond = darkMode ? '#18181B' : '#F5F8F6';
  const carte = darkMode ? '#27272A' : '#FFFFFF';

  // ⚠️ FILAHARANA : Accueil → À propos → Équipe → Services → Localisation
  const navLinks = [
    { id: 'accueil', label: 'Accueil' },
    { id: 'apropos', label: 'À propos' },
    { id: 'equipe', label: 'Notre équipe' },
    { id: 'services', label: 'Nos services' },
    { id: 'localisation', label: 'Localisation' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: fond,
        color: texte,
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        overflowX: 'hidden',
      }}
    >
      {/* ═══════════════════════════════════════════════════════
          STYLES + ANIMATIONS
      ═══════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroZoom {
          from { transform: scale(1.15); }
          to { transform: scale(1); }
        }
        @keyframes arrowMove {
          0% { opacity: 0; top: 6px; }
          50% { opacity: 1; }
          100% { opacity: 0; top: 16px; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(134,239,172,0.4); }
          50% { text-shadow: 0 0 40px rgba(255,255,255,0.6), 0 0 80px rgba(134,239,172,0.8); }
        }

        .home-anim-header { animation: slideDown 0.6s ease; }
        .home-anim-hero { animation: fadeInUp 1s ease 0.3s both; }
        .home-anim-tag { animation: fadeInUp 1s ease 0.5s both; }
        .home-anim-title { animation: fadeInUp 1s ease 0.7s both; }
        .home-anim-sub { animation: fadeInUp 1s ease 0.9s both; }
        .home-anim-desc { animation: fadeInUp 1s ease 1.1s both; }
        .home-anim-btn { animation: fadeInUp 1s ease 1.3s both; }
        .home-anim-scroll { animation: fadeInUp 1s ease 1.6s both; }

        .home-hero-title {
          font-size: 96px;
          font-weight: 900;
          letter-spacing: 6px;
          margin: 0 0 12px 0;
          background: linear-gradient(90deg, #FFFFFF, #86EFAC, #FFFFFF, #86EFAC, #FFFFFF);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmer 4s ease infinite, pulseGlow 3s ease-in-out infinite;
        }

        /* ═══ NAVBAR — SORATRA NGEZA ═══ */
        .home-nav-link {
          text-decoration: none;
          font-weight: 700;
          font-size: 18px;
          transition: all 0.2s;
          position: relative;
          padding-bottom: 6px;
          letter-spacing: 0.3px;
        }
        .home-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 3px;
          background: currentColor;
          transition: width 0.3s;
        }
        .home-nav-link:hover::after { width: 100%; }
        .home-nav-link.active::after { width: 100%; }

        .home-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.25);
        }
        .home-btn-outline:hover {
          background: rgba(255,255,255,0.15);
          border-color: #FFF;
          transform: translateY(-3px);
        }
        .home-login-btn:hover {
          background: ${vertFonce};
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,122,77,0.3);
        }
        .home-theme-btn:hover {
          background: ${vertClair};
          transform: rotate(20deg);
        }
        .home-card-hover { transition: all 0.3s; }
        .home-card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 15px 35px rgba(0,122,77,0.15);
          border-color: ${vert};
        }
        .home-service-hover { transition: all 0.3s; cursor: pointer; }
        .home-service-hover:hover {
          transform: translateY(-8px);
          border-color: ${vert};
          box-shadow: 0 20px 40px rgba(0,122,77,0.15);
        }
        .home-story-img { transition: transform 0.4s; }
        .home-story-img:hover { transform: scale(1.02); }
        .home-float { animation: floatY 3s ease-in-out infinite; }

        .home-h2 {
          font-size: 44px;
          font-weight: 800;
          margin: 0 0 16px 0;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }
        .home-p {
          font-size: 17px;
          line-height: 1.8;
          margin: 0 0 16px 0;
        }
        .home-tag {
          display: inline-block;
          color: ${vert};
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }

        /* Compense le header fixe lors d'un lien d'ancre (#section) */
        section[id] {
          scroll-margin-top: 90px;
        }

        /* LEAFLET — SARINTANY MAZAVA */
        .leaflet-container {
          width: 100%;
          height: 100%;
          border-radius: 20px;
          z-index: 1;
          background: #E8F0EA !important;
        }
        .leaflet-tile {
          filter: brightness(1.05) contrast(1.1) saturate(1.15) !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        .leaflet-popup-content {
          margin: 14px 18px;
          font-size: 14px;
          line-height: 1.6;
        }

        @media (prefers-reduced-motion: reduce) {
          .home-anim-header,
          .home-anim-hero,
          .home-anim-tag,
          .home-anim-title,
          .home-anim-sub,
          .home-anim-desc,
          .home-anim-btn,
          .home-anim-scroll,
          .home-float,
          .home-hero-title {
            animation: none !important;
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════ */}
      <header
        className="home-anim-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: darkMode ? 'rgba(24,24,27,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          borderBottom: `1px solid ${bordure}`,
        }}
      >
        <div
          style={{
            maxWidth: '1500px',
            margin: '0 auto',
            padding: '20px 45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '35px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
            <img
              src="/tsiry.jpg"
              alt="Radio Tsiry"
              style={{ height: '68px', borderRadius: '10px' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <strong style={{ color: vert, fontSize: '26px', fontWeight: 900, letterSpacing: '1.5px' }}>
                RADIO TSIRY
              </strong>
              <span style={{ fontSize: '14px', color: texteSecondaire, fontWeight: 700 }}>
                Fianara · La voix de votre région
              </span>
            </div>
          </div>

          <nav
            aria-label="Navigation principale"
            style={{
              display: 'flex',
              gap: '36px',
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center',
              minWidth: 'fit-content',
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`home-nav-link ${sectionActive === link.id ? 'active' : ''}`}
                aria-current={sectionActive === link.id ? 'true' : undefined}
                style={{
                  color: sectionActive === link.id ? vert : texte,
                  fontWeight: sectionActive === link.id ? 900 : 700,
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            {setIsDarkMode && (
              <button
                type="button"
                className="home-theme-btn"
                onClick={() => setIsDarkMode(!darkMode)}
                aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
                title={darkMode ? 'Mode clair' : 'Mode sombre'}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: `1px solid ${bordure}`,
                  background: 'transparent',
                  color: texte,
                  fontSize: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {darkMode ? '☀' : '🌙'}
              </button>
            )}

            <button
              type="button"
              className="home-login-btn"
              onClick={onSeConnecter}
              style={{
                padding: '15px 30px',
                borderRadius: '12px',
                border: 'none',
                background: vert,
                color: '#FFF',
                fontWeight: 800,
                fontSize: '17px',
                cursor: 'pointer',
                transition: 'all 0.25s',
                whiteSpace: 'nowrap',
              }}
            >
              Se connecter
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <section
        id="accueil"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          paddingTop: '80px',
        }}
      >
        <div
          ref={heroBgRef}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/images/radio-tsiry-batiment.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'transform 0.3s ease-out',
            animation: 'heroZoom 15s ease-out',
            willChange: 'transform',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0,40,25,0.92) 0%, rgba(0,80,50,0.85) 50%, rgba(0,30,20,0.95) 100%)',
          }}
        />

        <div
          className="home-anim-hero"
          style={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            color: '#FFF',
            maxWidth: '1000px',
            padding: '0 30px',
          }}
        >
          <span
            className="home-anim-tag"
            style={{
              display: 'inline-block',
              padding: '10px 22px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '30px',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '1px',
              marginBottom: '32px',
              color: '#FFF',
            }}
          >
            Radio catholique · Diocèse de Fianarantsoa
          </span>

          <h1 className="home-hero-title">RADIO TSIRY</h1>

          <p
            className="home-anim-sub"
            style={{
              fontSize: '30px',
              fontWeight: 400,
              fontStyle: 'italic',
              margin: '0 0 28px 0',
              opacity: 0.95,
            }}
          >
            La voix de votre région
          </p>

          <p
            className="home-anim-desc"
            style={{
              fontSize: '19px',
              lineHeight: 1.8,
              maxWidth: '700px',
              margin: '0 auto 40px',
              opacity: 0.9,
            }}
          >
            Une radio au service de la communauté, de la foi et de la communication à Fianarantsoa.
          </p>

          <div
            className="home-anim-btn"
            style={{
              display: 'flex',
              gap: '18px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="#services"
              className="home-btn-primary"
              style={{
                display: 'inline-block',
                padding: '17px 36px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '17px',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.3s',
                background: '#FFF',
                color: vert,
              }}
            >
              Découvrir nos services
            </a>
            <a
              href="#localisation"
              className="home-btn-outline"
              style={{
                display: 'inline-block',
                padding: '17px 36px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '17px',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.3s',
                background: 'transparent',
                color: '#FFF',
                border: '2px solid rgba(255,255,255,0.6)',
              }}
            >
              Nous trouver
            </a>
          </div>
        </div>

        <div
          className="home-anim-scroll"
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#FFF',
            fontSize: '13px',
            opacity: 0.8,
            textAlign: 'center',
          }}
        >
          <span>Défiler</span>
          <div
            style={{
              width: '20px',
              height: '30px',
              border: '2px solid #FFF',
              borderRadius: '12px',
              margin: '8px auto 0',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '4px',
                height: '8px',
                background: '#FFF',
                borderRadius: '2px',
                animation: 'arrowMove 1.6s infinite',
              }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          ① HISTORIQUE
      ═══════════════════════════════════════════════════════ */}
      <section id="apropos" style={{ padding: '110px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '70px' }}>
            <span className="home-tag">Notre histoire</span>
            <h2 className="home-h2">Une radio au cœur de la communauté</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '60px', alignItems: 'center' }}>
            <div>
              <p className="home-p">
                <strong style={{ color: vert, fontSize: '19px' }}>Radio Tsiry Fianara</strong> est une radio catholique implantée à <strong style={{ color: vert }}>Ambalapaiso</strong>, dans la ville de <strong style={{ color: vert }}>Fianarantsoa</strong>, à Madagascar.
              </p>
              <p className="home-p">
                Depuis sa création, elle accompagne la population à travers l'information, la communication, la culture, la musique et les programmes à caractère religieux et social.
              </p>
              <p className="home-p">
                Radio Tsiry constitue également un espace de proximité au service de la communauté et de la transmission des valeurs chrétiennes.
              </p>

              <div
                style={{
                  display: 'inline-block',
                  marginTop: '24px',
                  padding: '16px 26px',
                  background: vertClair,
                  borderRadius: '12px',
                  color: vert,
                  fontWeight: 800,
                  fontSize: '17px',
                }}
              >
                📍 Ambalapaiso — Fianarantsoa — Madagascar
              </div>
            </div>

            <div
              className="home-story-img"
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              }}
            >
              <img
                src="/images/radio-tsiry-batiment.jpg"
                alt="Bâtiment Radio Tsiry"
                loading="lazy"
                style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          RADIO CATHOLIQUE
      ═══════════════════════════════════════════════════════ */}
      <section
        style={{
          background: `linear-gradient(135deg, ${vert} 0%, ${vertFonce} 100%)`,
          color: '#FFF',
          textAlign: 'center',
          padding: '110px 0',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 40px' }}>
          <span
            style={{
              display: 'inline-block',
              color: '#86EFAC',
              fontSize: '15px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '2.5px',
              marginBottom: '16px',
            }}
          >
            Notre vocation
          </span>
          <h2
            style={{
              fontSize: '46px',
              fontWeight: 900,
              margin: '0 0 24px 0',
              color: '#FFF',
              lineHeight: 1.2,
            }}
          >
            Une radio au service de la foi
          </h2>
          <p
            style={{
              fontSize: '19px',
              lineHeight: 1.8,
              color: 'rgba(255,255,255,0.95)',
              maxWidth: '800px',
              margin: '0 auto',
            }}
          >
            Radio Tsiry est une radio catholique qui participe à la diffusion de programmes liés à la foi chrétienne, à la vie de l'Église et à la vie de la communauté.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          ② NOTRE ÉQUIPE (afamadika — taloha teo aorian'ny Direction)
      ═══════════════════════════════════════════════════════ */}
      <section id="equipe" style={{ padding: '110px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '70px' }}>
            <span className="home-tag">Notre équipe</span>
            <h2 className="home-h2">Une équipe engagée à votre service</h2>
            <p
              style={{
                fontSize: '18px',
                lineHeight: 1.8,
                color: texteSecondaire,
                maxWidth: '780px',
                margin: '16px auto 0',
              }}
            >
              Radio Tsiry s'appuie sur une équipe composée de techniciens, de journalistes, d'animateurs et de collaborateurs qui assurent quotidiennement la production, la diffusion et le bon fonctionnement de la radio.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '80px' }}>
            {[
              { icon: '🎙', titre: 'Journalistes', desc: "Une équipe de journalistes pour l'information." },
              { icon: '🎛', titre: 'Techniciens', desc: 'Des techniciens assurent le fonctionnement technique.' },
              { icon: '📻', titre: 'Animateurs', desc: 'Des animateurs accompagnent les auditeurs au quotidien.' },
            ].map((t, i) => (
              <div
                key={i}
                className="home-card-hover"
                style={{
                  background: carte,
                  borderRadius: '20px',
                  padding: '45px 30px',
                  textAlign: 'center',
                  border: `1px solid ${bordure}`,
                }}
              >
                <div
                  className="home-float"
                  style={{
                    width: '90px',
                    height: '90px',
                    margin: '0 auto 24px',
                    background: vertClair,
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '44px',
                  }}
                  aria-hidden="true"
                >
                  {t.icon}
                </div>
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: vert,
                    margin: '0 0 14px 0',
                  }}
                >
                  {t.titre}
                </h3>
                <p
                  style={{
                    fontSize: '16px',
                    color: texteSecondaire,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {t.desc}
                </p>
              </div>
            ))}
          </div>

          {/* DIRECTION — ao anatin'ny Équipe */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="home-tag">Notre direction</span>
            <h2 className="home-h2">Les responsables de Radio Tsiry</h2>
            <p
              style={{
                fontSize: '18px',
                lineHeight: 1.7,
                color: texteSecondaire,
                maxWidth: '700px',
                margin: '16px auto 0',
              }}
            >
              Une direction engagée au service de la radio et de la communauté.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
            {[
              {
                nom: 'Monseigneur Fulgence Rabemahafaly',
                role: 'Responsable ecclésiastique',
                photo: '/images/responsables/monseigneur-fulgence.jpg',
              },
              {
                nom: 'Monseigneur Jean Nicolas Rakotojaona',
                role: 'Responsable ecclésiastique',
                photo: '/images/responsables/monseigneur-jean-nicolas.jpg',
              },
              {
                nom: 'Père Jean Gabriel',
                role: 'Prêtre directeur',
                photo: '/images/responsables/pere-jean-gabriel.jpg',
              },
            ].map((p, i) => (
              <div
                key={i}
                className="home-card-hover"
                style={{
                  background: carte,
                  border: `1px solid ${bordure}`,
                  borderRadius: '20px',
                  padding: '36px 26px',
                  textAlign: 'center',
                  overflow: 'hidden',
                }}
              >
                <div
                  className="home-float"
                  style={{
                    width: '160px',
                    height: '160px',
                    margin: '0 auto 22px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: vertClair,
                    border: `4px solid ${vert}`,
                    boxShadow: `0 10px 30px ${vert}40`,
                  }}
                >
                  <img
                    src={p.photo}
                    alt={p.nom}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                      display: 'block',
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/tsiry.jpg';
                    }}
                  />
                </div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    margin: '0 0 10px 0',
                    color: texte,
                    lineHeight: 1.3,
                  }}
                >
                  {p.nom}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: texteSecondaire,
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  {p.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          ③ NOS SERVICES (afamadika — taloha teo alohan'ny Équipe)
      ═══════════════════════════════════════════════════════ */}
      <section id="services" style={{ padding: '110px 0', background: vertClair }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '70px' }}>
            <span className="home-tag">Nos services</span>
            <h2 className="home-h2">Ce que nous proposons</h2>
            <p
              style={{
                fontSize: '18px',
                lineHeight: 1.7,
                color: texteSecondaire,
                maxWidth: '700px',
                margin: '16px auto 0',
              }}
            >
              Découvrez nos services et contactez Radio Tsiry pour votre demande.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '26px' }}>
            {[
              { icon: '📢', titre: 'Annonce', desc: "Diffusion d'annonces sur les ondes." },
              { icon: '📣', titre: 'Publicité audio', desc: 'Promotion et communication des activités et entreprises.' },
              { icon: '💬', titre: 'Message', desc: 'Diffusion de messages à destination de la communauté.' },
              { icon: '🌐', titre: 'Traduction', desc: 'Services de traduction selon les besoins.' },
            ].map((s, i) => (
              <div
                key={i}
                className="home-service-hover"
                style={{
                  background: carte,
                  borderRadius: '20px',
                  padding: '40px 26px',
                  textAlign: 'center',
                  border: `1px solid ${bordure}`,
                }}
              >
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 22px',
                    background: `linear-gradient(135deg, ${vertClair} 0%, rgba(0,122,77,0.2) 100%)`,
                    borderRadius: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '38px',
                  }}
                  aria-hidden="true"
                >
                  {s.icon}
                </div>
                <h3
                  style={{
                    fontSize: '19px',
                    fontWeight: 800,
                    color: texte,
                    margin: '0 0 12px 0',
                  }}
                >
                  {s.titre}
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: texteSecondaire,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HORAIRES
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: '110px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '70px' }}>
            <span className="home-tag">Nos horaires</span>
            <h2 className="home-h2">Nous sommes là pour vous</h2>
          </div>

          <div
            className="home-card-hover"
            style={{
              maxWidth: '700px',
              margin: '0 auto',
              background: carte,
              borderRadius: '24px',
              padding: '60px 40px',
              textAlign: 'center',
              border: `2px solid ${vert}`,
              boxShadow: '0 20px 45px rgba(0,122,77,0.15)',
            }}
          >
            <div className="home-float" style={{ fontSize: '64px', marginBottom: '20px' }} aria-hidden="true">
              🕐
            </div>
            <div
              style={{
                fontSize: '52px',
                fontWeight: 900,
                color: vert,
                marginBottom: '12px',
                letterSpacing: '1px',
              }}
            >
              08:00 — 17:00
            </div>
            <div
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                background: vertClair,
                color: vert,
                borderRadius: '30px',
                fontWeight: 800,
                fontSize: '15px',
                letterSpacing: '2px',
                marginBottom: '24px',
              }}
            >
              DU LUNDI AU SAMEDI
            </div>
            <p style={{ fontSize: '17px', color: texteSecondaire, margin: 0, lineHeight: 1.7 }}>
              Tous les jours du lundi au samedi, Radio Tsiry vous accompagne au quotidien.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          LOCALISATION — LEAFLET
      ═══════════════════════════════════════════════════════ */}
      <section id="localisation" style={{ padding: '110px 0', background: vertClair }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span className="home-tag">Nous trouver</span>
            <h2 className="home-h2">Où sommes-nous ?</h2>
            <p
              style={{
                fontSize: '18px',
                lineHeight: 1.7,
                color: texteSecondaire,
                maxWidth: '750px',
                margin: '16px auto 0',
              }}
            >
              Radio Tsiry est implantée à <strong style={{ color: vert }}>Ambalapaiso</strong>, dans la ville de Fianarantsoa.
              <br />
              <span style={{ color: '#007A4D', fontWeight: 700 }}>🟢 Marque verte</span> : Emplacement de Radio Tsiry
              {' · '}
              <span style={{ color: '#DC2626', fontWeight: 700 }}>🔴 Marque rouge</span> : Votre position actuelle
            </p>
          </div>

          <div
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              border: `2px solid ${vert}`,
              boxShadow: '0 15px 40px rgba(0,122,77,0.15)',
              background: carte,
              height: '600px',
              position: 'relative',
            }}
          >
            <MapContainer
              center={POSITION_RADIO}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              <Marker position={POSITION_RADIO} icon={iconeRadio}>
                <Popup>
                  <strong style={{ color: '#007A4D', fontSize: '15px' }}>
                    🟢 Radio Tsiry
                  </strong>
                  <br />
                  Ambalapaiso, Fianarantsoa
                  <br />
                  Madagascar
                </Popup>
              </Marker>

              <MaPosition onPositionChange={setPositionUtilisateur} />
              <BoutonsCarte positionUtilisateur={positionUtilisateur} />
            </MapContainer>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Ambalapaiso+Fianarantsoa+Madagascar"
              target="_blank"
              rel="noopener noreferrer"
              className="home-btn-primary"
              style={{
                display: 'inline-block',
                padding: '16px 36px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '17px',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.3s',
                background: vert,
                color: '#FFF',
              }}
            >
              🧭 Obtenir l'itinéraire
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0F1F1A', color: '#D1D5DB', padding: '80px 0 30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1fr',
              gap: '50px',
              marginBottom: '50px',
            }}
          >
            <div>
              <h3
                style={{
                  color: vert,
                  fontSize: '26px',
                  fontWeight: 900,
                  letterSpacing: '1.5px',
                  margin: '0 0 16px 0',
                }}
              >
                RADIO TSIRY
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px', lineHeight: 1.7 }}>
                La voix de votre région
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '16px', lineHeight: 1.7 }}>
                Ambalapaiso, Fianarantsoa, Madagascar
              </p>
              <p style={{ margin: 0, fontSize: '15px', opacity: 0.7 }}>
                Radio catholique du diocèse de Fianarantsoa
              </p>
            </div>

            <div>
              <h4
                style={{
                  color: '#FFF',
                  fontSize: '17px',
                  fontWeight: 800,
                  margin: '0 0 20px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Contact
              </h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                Ambalapaiso, Fianarantsoa, Madagascar
              </p>
              <p style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                +261 38 84 059 19
              </p>
              <p style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                WhatsApp : +261 38 84 059 19
              </p>
              <p style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                radiotsiry@gmail.com
              </p>
              <p style={{ margin: 0, fontSize: '16px' }}>
                Facebook : RADIO TSIRY Fianara
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4
                style={{
                  color: '#FFF',
                  fontSize: '17px',
                  fontWeight: 800,
                  margin: '0 0 20px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Navigation
              </h4>
              <a href="#accueil" style={{ color: '#D1D5DB', textDecoration: 'none', fontSize: '16px' }}>
                Accueil
              </a>
              <a href="#apropos" style={{ color: '#D1D5DB', textDecoration: 'none', fontSize: '16px' }}>
                À propos
              </a>
              <a href="#equipe" style={{ color: '#D1D5DB', textDecoration: 'none', fontSize: '16px' }}>
                Notre équipe
              </a>
              <a href="#services" style={{ color: '#D1D5DB', textDecoration: 'none', fontSize: '16px' }}>
                Nos services
              </a>
              <a href="#localisation" style={{ color: '#D1D5DB', textDecoration: 'none', fontSize: '16px' }}>
                Localisation
              </a>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              paddingTop: '30px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              fontSize: '15px',
              opacity: 0.7,
            }}
          >
            © 2026 Radio Tsiry — Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}