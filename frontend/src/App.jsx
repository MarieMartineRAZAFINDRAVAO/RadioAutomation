import React, { useState } from 'react';

import Navbar from './components/Navbar';

import Dashboard from './pages/Dashboard/Dashboard';
import Commandes from './pages/Commandes/Commandes';
import AjoutCommandeWizard from './components/AjoutCommandeWizard';

import FichiersAudio from './pages/FichiersAudio/FichiersAudio';
import Programmation from './pages/Programmation/Programmation';
import Factures from './pages/Factures/Factures';
import Diffusion from './pages/Diffusion/Diffusion';
import Parametres from './pages/Parametres/Parametres';
import Clients from './pages/Clients/Clients';
import Profil from './pages/Profil/Profil';
import Home from './pages/Home/Home';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function App() {
  // =========================================================
  // AUTHENTIFICATION
  // =========================================================

  const [page, setPage] = useState('home');

  const [darkMode, setDarkMode] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [token, setToken] = useState(
    localStorage.getItem('token') || ''
  );

  // =========================================================
  // CHAMPS LOGIN / REGISTER
  // =========================================================

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [username, setUsername] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');

  const role = 'Accueil';

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const [activeTab, setActiveTab] = useState('dashboard');

  const [showWizard, setShowWizard] = useState(false);

  const [commandeAEditer, setCommandeAEditer] = useState(null);
  const [etapeInitialCommandes, setEtapeInitialCommandes] = useState(1);
    // Commande sélectionnée pour "Gérer l'audio"
  const [commandeIdAudio, setCommandeIdAudio] = useState(null);
    const [clientSelectionneDashboard, setClientSelectionneDashboard] = useState(null);
  // =========================================================
  // UTILISATEUR CONNECTÉ
  // =========================================================

  const user = {
    username: localStorage.getItem('username') || 'admin',
    role: role,
  };

  // =========================================================
  // FILTRAGE TEXTE
  // =========================================================

  const handleTextOnly = (setter) => (e) => {
    const value = e.target.value;

    const cleanedValue = value.replace(
      /[^a-zA-ZÀ-ÿ\s-]/g,
      ''
    );

    setter(cleanedValue);
  };

  // =========================================================
  // MOT DE PASSE
  // =========================================================

  const pwdHasLetter = /[a-zA-Z]/.test(motDePasse);

  const pwdHasNumber = /[0-9]/.test(motDePasse);

  const pwdHasSpecial = /[^a-zA-Z0-9]/.test(motDePasse);

  const isPwdValid =
    pwdHasLetter &&
    pwdHasNumber &&
    pwdHasSpecial;

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !motDePasse) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        API_BASE_URL + '/token/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: motDePasse,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.error ||
          'Nom d’utilisateur ou mot de passe incorrect.'
        );
      }

      if (!data.access) {
        throw new Error(
          'Le serveur n’a pas retourné de token JWT.'
        );
      }

      localStorage.setItem('token', data.access);

      if (data.refresh) {
        localStorage.setItem('refreshToken', data.refresh);
      }

      localStorage.setItem('username', username);

      setToken(data.access);
      setPage('app');
      setActiveTab('dashboard');
      setShowWizard(false);
      setMotDePasse('');
    } catch (err) {
      console.error('Erreur de connexion :', err);

      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      setToken('');

      setError(
        err.message ||
        'Impossible de se connecter au serveur.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // REGISTER
  // =========================================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!nom || !prenom || !username) {
      setError(
        'Veuillez remplir tous les champs correctement.'
      );
      return;
    }

    if (!isPwdValid) {
      setError(
        'Le mot de passe ne respecte pas tous les critères requis.'
      );
      return;
    }

    if (motDePasse !== confirmMotDePasse) {
      setError(
        'Les mots de passe ne correspondent pas.'
      );
      return;
    }

    try {
      const response = await fetch(
        API_BASE_URL + '/register/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: motDePasse,
            email: username + '@gmail.com',
            first_name: prenom,
            last_name: nom,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          'Compte créé avec succès ! Connectez-vous.'
        );

        setPage('login');

        setMotDePasse('');
        setConfirmMotDePasse('');
      } else {
        setError(
          data.error ||
          data.detail ||
          'Une erreur est survenue.'
        );
      }
    } catch (err) {
      setError(
        'Impossible de contacter le serveur.'
      );
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');

    setToken('');

    setShowLogoutConfirm(false);

    setShowWizard(false);

    setCommandeAEditer(null);

    setPage('home');

    setActiveTab('dashboard');
  };

  // =========================================================
  // NOUVELLE COMMANDE
  // =========================================================

  const ouvrirNouvelleCommande = () => {
    setCommandeAEditer(null);
    setShowWizard(true);
  };

  // =========================================================
  // FERMER WIZARD
  // =========================================================

  const fermerWizard = () => {
    setShowWizard(false);
    setCommandeAEditer(null);
  };

  // =========================================================
  // MODIFIER COMMANDE
  // =========================================================

  const modifierCommande = (commande) => {
    console.log(
      'Commande à modifier :',
      commande
    );

    setCommandeAEditer(commande);

    setShowWizard(true);
  };

  // =========================================================
  // CHANGEMENT MENU
  // =========================================================

  const changerOnglet = (tab) => {
    setActiveTab(tab);

    setShowWizard(false);

    setCommandeAEditer(null);
  };

  // =========================================================
  // COULEURS
  // =========================================================

  const mainColor = '#007A4D';

  const bgContainer = darkMode
    ? '#18181B'
    : '#CBD5E1';

  const cardBg = darkMode
    ? '#27272A'
    : '#FFFFFF';

  const textColor = darkMode
    ? '#F4F4F5'
    : '#0F172A';

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        backgroundColor: bgContainer,
        color: textColor,
        minHeight: '100vh',
        fontFamily:
          "'Inter', 'Segoe UI', sans-serif",
      }}
    >

      {/* =====================================================
          STYLES INTERNES
      ===================================================== */}

 <style>{`
  .animated-radio-title {
    font-size: 2.8rem;
    font-weight: 900;
    letter-spacing: 2.5px;
    color: #FFFFFF;
  }

  .btn-modern-green {
    background: linear-gradient(135deg, #007A4D, #005F3C);
    color: white;
    border: none;
    padding: 1.1rem 2.5rem;
    border-radius: 35px;
    font-weight: 800;
    font-size: 1.15rem;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(0, 122, 77, 0.35);
    transition: all 0.25s ease;
  }

  .btn-modern-green:hover {
    transform: translateY(-2px);
  }

  .input-curved {
    width: 100%;
    padding: 1.05rem 1.4rem;
    border-radius: 12px;
    border: 2px solid #CBD5E1;
    font-size: 1.1rem;
    box-sizing: border-box;
    outline: none;
    background-color: #F8FAFC;
  }

  .input-curved:focus {
    border-color: #007A4D;
    background-color: #FFFFFF;
    box-shadow: 0 0 0 4px rgba(0, 122, 77, 0.18);
  }

  .badge-rule {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    display: inline-block;
    margin-right: 0.4rem;
    margin-top: 0.4rem;
  }

    /* ═══ Animation 1 : RADIO TSIRY — Marquee (mivezivezy) ═══ */
  @keyframes marqueeRadio {
    0% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(40px);
    }
    100% {
      transform: translateX(0);
    }
  }

  .radio-tsiry-animated {
    display: inline-block;
    animation: marqueeRadio 3s ease-in-out infinite;
    white-space: nowrap;
  }

  /* ═══ Animation 2 : Texte — Miovaova loko ═══ */
  @keyframes colorPulse {
    0% {
      color: #FFFFFF;
    }
    25% {
      color: #86EFAC;
    }
    50% {
      color: #FDE68A;
    }
    75% {
      color: #93C5FD;
    }
    100% {
      color: #FFFFFF;
    }
  }

  .text-color-animated {
    animation: colorPulse 4s ease-in-out infinite;
  }

  /* ═══ Animation 3 : Le trait (bonus) ═══ */
  @keyframes barGrow {
    0% {
      width: 60px;
    }
    50% {
      width: 100px;
    }
    100% {
      width: 60px;
    }
  }

  .bar-animated {
    animation: barGrow 3s ease-in-out infinite;
  }
`}</style>

      {/* =====================================================
          HOME (PAGE D'ACCUEIL)
      ===================================================== */}

      {page === 'home' && (
        <Home
          onSeConnecter={() => setPage('login')}
          darkMode={darkMode}
          setIsDarkMode={setDarkMode}
        />
      )}

      {/* =====================================================
          LOGIN / REGISTER
      ===================================================== */}

            {(page === 'login' ||
        page === 'register') && (

        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#F5F8F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            fontFamily:
              "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          }}
        >

          {/* ═══ CARTE PRINCIPALE ═══ */}
          <div
            style={{
              width: '100%',
              maxWidth: '980px',
              backgroundColor: '#FFFFFF',
              borderRadius: '28px',
              boxShadow: '0 20px 60px rgba(0, 122, 77, 0.15)',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr',
              minHeight: '600px',
            }}
          >

            {/* ═══ PARTIE GAUCHE — GRADIENT VERT ═══ */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, #007A4D 0%, #005C3A 60%, #002B1C 100%)',
                padding: '50px 40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#FFFFFF',
                position: 'relative',
                overflow: 'hidden',
              }}
            >

              {/* Cercles décoratifs */}
              <div
                style={{
                  position: 'absolute',
                  top: '-80px',
                  right: '-80px',
                  width: '280px',
                  height: '280px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-100px',
                  left: '-100px',
                  width: '350px',
                  height: '350px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

             {/* Texte RADIO TSIRY (en haut) */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h1
                  className="radio-tsiry-animated"
                  style={{
                    margin: 0,
                    fontSize: '32px',
                    fontWeight: 900,
                    letterSpacing: '1px',
                    color: '#FFFFFF',
                  }}
                >
                  RADIO TSIRY
                </h1>
              </div>

              {/* Bloc central */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <p
                  style={{
                    margin: '0 0 20px',
                    fontSize: '16px',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    color: 'rgba(255,255,255,0.85)',
                    textTransform: 'uppercase',
                  }}
                >
                  Vous pouvez facilement
                </p>

                <h2
                  className="text-color-animated"
                  style={{
                    margin: 0,
                    fontSize: '26px',
                    fontWeight: 800,
                    lineHeight: 1.35,
                  }}
                >
                  Accéder à votre espace pour la gestion des
                  commandes et la programmation de diffusion radio.
                </h2>
              </div>

              {/* Bas de page */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div
                  className="bar-animated"
                  style={{
                    height: '3px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '2px',
                    marginBottom: '20px',
                  }}
                />

                <p
                  style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  Connectez-vous pour accéder aux fonctionnalités.
                </p>
              </div>
            </div>

            {/* ═══ PARTIE DROITE — FORMULAIRE ═══ */}
            <div
              style={{
                padding: '50px 45px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >

              {/* =================================================
                  LOGIN
              ================================================= */}
              {page === 'login' ? (
                <div>

                  <h1
                    style={{
                      margin: '0 0 12px',
                      fontSize: '36px',
                      fontWeight: 800,
                      color: '#1F2937',
                    }}
                  >
                    Connexion
                  </h1>
                  <p
                    style={{
                      margin: '0 0 35px',
                      fontSize: '17px',
                      color: '#6B7280',
                      lineHeight: 1.5,
                    }}
                  >
                    Accès à votre espace <strong>RADIO TSIRY</strong>
                  </p>
                  {message && (
                    <div style={successStyle}>{message}</div>
                  )}

                  {error && (
                    <div style={errorStyle}>{error}</div>
                  )}

                  <form onSubmit={handleLogin}>

                    <div style={{ marginBottom: '20px' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#1F2937',
                        }}
                      >
                        Nom d'utilisateur
                      </label>

                      <input
                        type="text"
                        placeholder="Votre nom d'utilisateur"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value)
                        }
                        required
                        autoFocus
                        style={inputCurvedStyle}
                      />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#1F2937',
                        }}
                      >
                        Mot de passe
                      </label>

                      <input
                        type="password"
                        placeholder="Votre mot de passe"
                        value={motDePasse}
                        onChange={(e) =>
                          setMotDePasse(e.target.value)
                        }
                        required
                        style={inputCurvedStyle}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '15px',
                        border: 'none',
                        borderRadius: '12px',
                        backgroundColor: loading
                          ? '#9CA3AF'
                          : '#007A4D',
                        color: '#FFFFFF',
                        fontSize: '16px',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                        cursor: loading ? 'wait' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: loading
                          ? 'none'
                          : '0 10px 25px rgba(0, 122, 77, 0.25)',
                      }}
                    >
                      {loading
                        ? 'CONNEXION...'
                        : 'SE CONNECTER'}
                    </button>

                  </form>

                  {/* Séparateur */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      margin: '25px 0 20px',
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: '1px',
                        backgroundColor: '#DDE8E2',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '13px',
                        color: '#6B7280',
                        fontWeight: 600,
                      }}
                    >
                      ou
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: '1px',
                        backgroundColor: '#DDE8E2',
                      }}
                    />
                  </div>

                  <p
                    style={{
                      margin: 0,
                      textAlign: 'center',
                      fontSize: '16px',
                      color: '#6B7280',
                    }}
                  >
                    Pas encore de compte ?{' '}

                    <span
                      onClick={() => {
                        setPage('register');
                        setError('');
                        setMessage('');
                      }}
                      style={{
                        color: '#007A4D',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Créer un compte
                    </span>

                  </p>

                  <p
                    style={{
                      margin: '12px 0 0',
                      textAlign: 'center',
                      fontSize: '13px',
                    }}
                  >
                    <span
                      onClick={() => {
                        setPage('home');
                        setError('');
                        setMessage('');
                      }}
                      style={{
                        color: '#6B7280',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      ← Retour à l'accueil
                    </span>
                  </p>

                </div>
              ) : (

                /* =================================================
                   REGISTER
                ================================================= */
                <div>

                  <h1
                    style={{
                      margin: '0 0 10px',
                      fontSize: '30px',
                      fontWeight: 800,
                      color: '#1F2937',
                    }}
                  >
                    Créer un compte
                  </h1>

                  <p
                    style={{
                      margin: '0 0 25px',
                      fontSize: '15px',
                      color: '#6B7280',
                    }}
                  >
                    Inscription à l'espace <strong>RADIO TSIRY</strong>
                  </p>

                  {error && (
                    <div style={errorStyle}>{error}</div>
                  )}

                  <form onSubmit={handleRegister}>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '15px',
                        marginBottom: '15px',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#1F2937',
                          }}
                        >
                          Nom
                        </label>
                        <input
                          type="text"
                          placeholder="Votre nom"
                          value={nom}
                          onChange={handleTextOnly(setNom)}
                          required
                          style={inputCurvedStyle}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#1F2937',
                          }}
                        >
                          Prénom
                        </label>
                        <input
                          type="text"
                          placeholder="Votre prénom"
                          value={prenom}
                          onChange={handleTextOnly(setPrenom)}
                          required
                          style={inputCurvedStyle}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#1F2937',
                        }}
                      >
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        placeholder="Votre nom d'utilisateur"
                        value={username}
                        onChange={handleTextOnly(setUsername)}
                        required
                        style={inputCurvedStyle}
                      />
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '15px',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#1F2937',
                          }}
                        >
                          Mot de passe
                        </label>
                        <input
                          type="password"
                          placeholder="Mot de passe"
                          value={motDePasse}
                          onChange={(e) =>
                            setMotDePasse(e.target.value)
                          }
                          required
                          style={inputCurvedStyle}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: '#1F2937',
                          }}
                        >
                          Confirmation
                        </label>
                        <input
                          type="password"
                          placeholder="Confirmer"
                          value={confirmMotDePasse}
                          onChange={(e) =>
                            setConfirmMotDePasse(e.target.value)
                          }
                          required
                          style={inputCurvedStyle}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          display: 'inline-block',
                          marginRight: '6px',
                          backgroundColor: pwdHasLetter
                            ? '#DCFCE7'
                            : '#F1F5F9',
                          color: pwdHasLetter
                            ? '#15803D'
                            : '#94A3B8',
                        }}
                      >
                        {pwdHasLetter ? '✓' : '○'} Lettre
                      </span>

                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          display: 'inline-block',
                          marginRight: '6px',
                          backgroundColor: pwdHasNumber
                            ? '#DCFCE7'
                            : '#F1F5F9',
                          color: pwdHasNumber
                            ? '#15803D'
                            : '#94A3B8',
                        }}
                      >
                        {pwdHasNumber ? '✓' : '○'} Chiffre
                      </span>

                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          display: 'inline-block',
                          backgroundColor: pwdHasSpecial
                            ? '#DCFCE7'
                            : '#F1F5F9',
                          color: pwdHasSpecial
                            ? '#15803D'
                            : '#94A3B8',
                        }}
                      >
                        {pwdHasSpecial ? '✓' : '○'} Caractère spécial
                      </span>
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        padding: '15px',
                        border: 'none',
                        borderRadius: '12px',
                        backgroundColor: '#007A4D',
                        color: '#FFFFFF',
                        fontSize: '16px',
                        fontWeight: 800,
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow:
                          '0 10px 25px rgba(0, 122, 77, 0.25)',
                      }}
                    >
                      S'INSCRIRE
                    </button>

                  </form>

                  <p
                    style={{
                      margin: '20px 0 0',
                      textAlign: 'center',
                      fontSize: '16px',
                      color: '#6B7280',
                    }}
                  >
                    Déjà un compte ?{' '}

                    <span
                      onClick={() => {
                        setPage('login');
                        setError('');
                        setMessage('');
                      }}
                      style={{
                        color: '#007A4D',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Se connecter
                    </span>

                  </p>

                </div>
              )}

            </div>
          </div>
        </div>
      )}
      {/* =====================================================
          APPLICATION
      ===================================================== */}
      {page === 'app' && (

        <div
          style={{
            minHeight: '100vh',
            backgroundColor: darkMode
              ? '#18181B'
              : '#F5F8F6',
          }}
        >

          <Navbar
            activeTab={activeTab}
            setActiveTab={changerOnglet}
            user={user}
            isDarkMode={darkMode}
            setIsDarkMode={setDarkMode}
            onLogout={() =>
              setShowLogoutConfirm(true)
            }
          />
                  {activeTab === 'dashboard' && (
            <Dashboard
              darkMode={darkMode}
              onVoirClient={(commande) => {
                // Sélectionner le client de cette commande
                if (commande && commande.client) {
                  setClientSelectionneDashboard(commande.client);
                }
                setActiveTab('clients');
              }}
            />
          )}

          {activeTab === 'clients' && (
            <Clients
              darkMode={darkMode}
              clientSelectionneId={clientSelectionneDashboard}
            />
          )}


          {activeTab === 'commandes' && (
            <Commandes
              darkMode={darkMode}
              etapeInitial={etapeInitialCommandes}
              onFactureGeneree={(facture) => {
                setActiveTab('factures');
              }}
              onGererAudio={(commande) => {
                setCommandeIdAudio(commande.id);
                setActiveTab('fichiers-audio');
              }}
            />
          )}

          {activeTab === 'fichiers-audio' && (
            <FichiersAudio
              darkMode={darkMode}
              commandeId={commandeIdAudio}
              onPrecedent={() => {
                setCommandeIdAudio(null);
                setActiveTab('commandes');
              }}
            />
          )}

          {activeTab === 'programmation' && (
            <Programmation
              darkMode={darkMode}
              onPrecedent={() => setActiveTab('fichiers-audio')}
            />
          )}

          {activeTab === 'factures' && (
            <Factures
              darkMode={darkMode}
              onPrecedent={() => {
                setEtapeInitialCommandes(3);
                setActiveTab('commandes');
              }}
            />
          )}

        </div>
      )}

      {/* =====================================================
          MODAL LOGOUT
      ===================================================== */}

      {showLogoutConfirm && (

        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,

            backgroundColor:
              'rgba(0,0,0,0.55)',

            display: 'flex',

            justifyContent: 'center',

            alignItems: 'center',

            zIndex: 1000,
          }}
        >

          <div
            style={{
              backgroundColor: cardBg,

              padding: '2.5rem',

              borderRadius: '20px',

              textAlign: 'center',

              width: '380px',
            }}
          >

            <h4
              style={{
                margin:
                  '0 0 1rem 0',

                fontSize: '1.4rem',
              }}
            >
              Déconnexion
            </h4>

            <p
              style={{
                color: '#64748B',

                marginBottom:
                  '1.8rem',
              }}
            >
              Voulez-vous vous déconnecter ?
            </p>

            <div
              style={{
                display: 'flex',

                gap: '1rem',

                justifyContent:
                  'center',
              }}
            >

              <button
                onClick={handleLogout}
                style={{
                  backgroundColor:
                    '#EF4444',

                  color: '#FFF',

                  border: 'none',

                  padding:
                    '0.7rem 1.5rem',

                  borderRadius: '10px',

                  fontWeight: 700,

                  cursor: 'pointer',
                }}
              >
                Oui
              </button>

              <button
                onClick={() =>
                  setShowLogoutConfirm(
                    false
                  )
                }
                style={{
                  backgroundColor:
                    '#94A3B8',

                  color: '#FFF',

                  border: 'none',

                  padding:
                    '0.7rem 1.5rem',

                  borderRadius: '10px',

                  fontWeight: 700,

                  cursor: 'pointer',
                }}
              >
                Non
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const inputCurvedStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '16px 18px',
  border: '1.5px solid #DDE8E2',
  borderRadius: '12px',
  fontSize: '17px',
  color: '#1F2937',
  backgroundColor: '#F9FAFB',
  outline: 'none',
  transition: 'all 0.2s',
};

const labelStyle = {
  display: 'block',
  fontSize: '1.05rem',
  fontWeight: 800,
  marginBottom: '0.4rem',
  color: '#334155',
};
const errorStyle = {
  color: '#DC2626',
  backgroundColor: '#FEF2F2',
  border: '1px solid #FECACA',
  padding: '12px 16px',
  borderRadius: '10px',
  marginBottom: '20px',
  fontSize: '16px',
  fontWeight: 600,
};

const successStyle = {
  color: '#15803D',
  backgroundColor: '#F0FDF4',
  border: '1px solid #BBF7D0',
  padding: '12px 16px',
  borderRadius: '10px',
  marginBottom: '20px',
  fontSize: '16px',
  fontWeight: 600,
};
export default App;