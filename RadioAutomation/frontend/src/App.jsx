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

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function App() {
  // =========================================================
  // AUTHENTIFICATION
  // =========================================================

  const [page, setPage] = useState(
    localStorage.getItem('token') ? 'app' : 'login'
  );

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

    setPage('login');

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
        @keyframes textShimmer {
          0% {
            background-position: 0% 50%;
          }

          100% {
            background-position: 100% 50%;
          }
        }

        .animated-radio-title {
          font-size: 2.8rem;
          font-weight: 900;
          letter-spacing: 2.5px;

          background:
            linear-gradient(
              90deg,
              #FFFFFF,
              #86EFAC,
              #FFFFFF,
              #007A4D,
              #FFFFFF
            );

          background-size: 200% auto;

          color: transparent;

          -webkit-background-clip: text;
          background-clip: text;

          animation:
            textShimmer 4s ease infinite;
        }

        .btn-modern-green {
          background:
            linear-gradient(
              135deg,
              #007A4D,
              #005F3C
            );

          color: white;
          border: none;

          padding: 1.1rem 2.5rem;

          border-radius: 35px;

          font-weight: 800;
          font-size: 1.15rem;

          cursor: pointer;

          box-shadow:
            0 8px 20px
            rgba(0, 122, 77, 0.35);

          transition:
            all 0.25s ease;
        }

        .btn-modern-green:hover {
          transform: translateY(-2px);

          box-shadow:
            0 10px 25px
            rgba(0, 122, 77, 0.45);
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

          transition:
            all 0.2s ease;
        }

        .input-curved:focus {
          border-color: #007A4D;

          background-color: #FFFFFF;

          box-shadow:
            0 0 0 4px
            rgba(0, 122, 77, 0.18);
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
      `}</style>

      {/* =====================================================
          LOGIN / REGISTER
      ===================================================== */}

      {(page === 'login' ||
        page === 'register') && (

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '2rem',
          }}
        >

          <div
            style={{
              display: 'flex',
              width: '1150px',
              maxWidth: '100%',
              minHeight: '620px',
              backgroundColor: cardBg,
              borderRadius: '32px',
              boxShadow:
                '0 30px 60px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >

            {/* =================================================
                PANEL GAUCHE
            ================================================= */}

            <div
              style={{
                flex: '1',
                backgroundColor: mainColor,
                color: '#FFFFFF',
                padding: '4rem 3.2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTopRightRadius: '180px',
                borderBottomRightRadius: '180px',
              }}
            >

              <div>

                <img
                  src="/tsiry.jpg"
                  alt="Radio Tsiry"
                  style={{
                    maxHeight: '90px',
                    marginBottom: '1.8rem',
                    borderRadius: '12px',
                  }}
                />

                <h1
                  className="animated-radio-title"
                  style={{
                    margin: '0 0 1.2rem 0',
                  }}
                >
                  RADIO TSIRY
                </h1>

                <p
                  style={{
                    fontSize: '1.2rem',
                    lineHeight: '1.7',
                    opacity: 0.95,
                  }}
                >
                  Plateforme de traitement
                  des demandes de services,
                  gestion des commandes
                  et programmation de
                  diffusion radio.
                </p>

              </div>

              <div>

                <div
                  style={{
                    width: '60px',
                    height: '4px',
                    backgroundColor: '#86EFAC',
                    marginBottom: '1.4rem',
                  }}
                />

                <h4
                  style={{
                    fontSize: '1.1rem',
                    textTransform: 'uppercase',
                  }}
                >
                  ESPACE PROFESSIONNEL
                </h4>

                <p
                  style={{
                    fontSize: '1.1rem',
                    opacity: 0.9,
                  }}
                >
                  Connectez-vous pour
                  accéder aux
                  fonctionnalités.
                </p>

              </div>

            </div>

            {/* =================================================
                FORMULAIRE
            ================================================= */}

            <div
              style={{
                flex: '1.2',
                padding: '3rem 4rem',
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

                  <h2
                    style={{
                      fontSize: '2.2rem',
                      fontWeight: 800,
                    }}
                  >
                    Connexion
                  </h2>

                  <p
                    style={{
                      color: '#64748B',
                      marginBottom: '2.2rem',
                    }}
                  >
                    Accès à votre espace RADIO TSIRY
                  </p>

                  {message && (
                    <div style={successStyle}>
                      {message}
                    </div>
                  )}

                  {error && (
                    <div style={errorStyle}>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleLogin}>

                    <div
                      style={{
                        marginBottom: '1.6rem',
                      }}
                    >

                      <label style={labelStyle}>
                        Nom d'utilisateur
                      </label>

                      <input
                        type="text"
                        placeholder="Votre nom d'utilisateur"
                        value={username}
                        onChange={(e) =>
                          setUsername(
                            e.target.value
                          )
                        }
                        required
                        className="input-curved"
                      />

                    </div>

                    <div
                      style={{
                        marginBottom: '2.2rem',
                      }}
                    >

                      <label style={labelStyle}>
                        Mot de passe
                      </label>

                      <input
                        type="password"
                        placeholder="Votre mot de passe"
                        value={motDePasse}
                        onChange={(e) =>
                          setMotDePasse(
                            e.target.value
                          )
                        }
                        required
                        className="input-curved"
                      />

                    </div>

                    <button
                      type="submit"
                      className="btn-modern-green"
                      style={{
                        width: '100%',
                      }}
                    >
                      SE CONNECTER
                    </button>

                  </form>

                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: '2rem',
                      color: '#64748B',
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
                        color: mainColor,
                        fontWeight: 800,
                        cursor: 'pointer',
                        textDecoration:
                          'underline',
                      }}
                    >
                      Créer un compte
                    </span>

                  </div>

                </div>

              ) : (

                /* =================================================
                   REGISTER
                ================================================= */

                <div>

                  <h2
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: mainColor,
                    }}
                  >
                    Créer un compte
                  </h2>

                  <p
                    style={{
                      color: '#64748B',
                      marginBottom: '1.5rem',
                    }}
                  >
                    Inscription au système RADIO TSIRY
                  </p>

                  {error && (
                    <div style={errorStyle}>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleRegister}>

                    <div
                      style={{
                        display: 'flex',
                        gap: '1.2rem',
                        marginBottom: '1rem',
                      }}
                    >

                      <div style={{ flex: 1 }}>

                        <label style={labelStyle}>
                          Nom
                        </label>

                        <input
                          type="text"
                          placeholder="Votre nom"
                          value={nom}
                          onChange={handleTextOnly(
                            setNom
                          )}
                          required
                          className="input-curved"
                        />

                      </div>

                      <div style={{ flex: 1 }}>

                        <label style={labelStyle}>
                          Prénom
                        </label>

                        <input
                          type="text"
                          placeholder="Votre prénom"
                          value={prenom}
                          onChange={handleTextOnly(
                            setPrenom
                          )}
                          required
                          className="input-curved"
                        />

                      </div>

                    </div>

                    <div
                      style={{
                        marginBottom: '1rem',
                      }}
                    >

                      <label style={labelStyle}>
                        Nom d'utilisateur
                      </label>

                      <input
                        type="text"
                        placeholder="Votre nom d'utilisateur"
                        value={username}
                        onChange={handleTextOnly(
                          setUsername
                        )}
                        required
                        className="input-curved"
                      />

                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '1.2rem',
                        marginBottom: '0.5rem',
                      }}
                    >

                      <div style={{ flex: 1 }}>

                        <label style={labelStyle}>
                          Mot de passe
                        </label>

                        <input
                          type="password"
                          placeholder="Mot de passe"
                          value={motDePasse}
                          onChange={(e) =>
                            setMotDePasse(
                              e.target.value
                            )
                          }
                          required
                          className="input-curved"
                        />

                      </div>

                      <div style={{ flex: 1 }}>

                        <label style={labelStyle}>
                          Confirmation
                        </label>

                        <input
                          type="password"
                          placeholder="Confirmer"
                          value={confirmMotDePasse}
                          onChange={(e) =>
                            setConfirmMotDePasse(
                              e.target.value
                            )
                          }
                          required
                          className="input-curved"
                        />

                      </div>

                    </div>

                    <div
                      style={{
                        marginBottom: '1.5rem',
                      }}
                    >

                      <span
                        className="badge-rule"
                        style={{
                          backgroundColor:
                            pwdHasLetter
                              ? '#DCFCE7'
                              : '#F1F5F9',

                          color:
                            pwdHasLetter
                              ? '#15803D'
                              : '#94A3B8',
                        }}
                      >
                        {pwdHasLetter
                          ? '✓'
                          : '○'} Lettre
                      </span>

                      <span
                        className="badge-rule"
                        style={{
                          backgroundColor:
                            pwdHasNumber
                              ? '#DCFCE7'
                              : '#F1F5F9',

                          color:
                            pwdHasNumber
                              ? '#15803D'
                              : '#94A3B8',
                        }}
                      >
                        {pwdHasNumber
                          ? '✓'
                          : '○'} Chiffre
                      </span>

                      <span
                        className="badge-rule"
                        style={{
                          backgroundColor:
                            pwdHasSpecial
                              ? '#DCFCE7'
                              : '#F1F5F9',

                          color:
                            pwdHasSpecial
                              ? '#15803D'
                              : '#94A3B8',
                        }}
                      >
                        {pwdHasSpecial
                          ? '✓'
                          : '○'} Caractère spécial
                      </span>

                    </div>

                    <button
                      type="submit"
                      className="btn-modern-green"
                      style={{
                        width: '100%',
                      }}
                    >
                      S'INSCRIRE
                    </button>

                  </form>

                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: '1.5rem',
                      color: '#64748B',
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
                        color: mainColor,
                        fontWeight: 800,
                        cursor: 'pointer',
                        textDecoration:
                          'underline',
                      }}
                    >
                      Se connecter
                    </span>

                  </div>

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

        <div>

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

          <main
            style={{
              padding: '2rem',
            }}
          >

            {/* DASHBOARD */}

            {activeTab === 'dashboard' && (
              <Dashboard />
            )}

            {/* COMMANDES */}

            {activeTab === 'commandes' && (

              showWizard ? (

                <AjoutCommandeWizard
                  onClose={fermerWizard}
                  token={token}
                  commandeAEditer={
                    commandeAEditer
                  }
                />

              ) : (

                <Commandes
                  onNouvelleCommande={
                    ouvrirNouvelleCommande
                  }

                  onEditCommande={
                    modifierCommande
                  }
                />

              )
            )}

            {/* FICHIERS AUDIO */}

            {activeTab === 'fichiers-audio' && (
              <FichiersAudio />
            )}

            {/* PROGRAMMATION */}

            {activeTab === 'programmation' && (
              <Programmation />
            )}

            {/* FACTURES */}

            {activeTab === 'factures' && (
              <Factures />
            )}

            {/* DIFFUSION */}

            {activeTab === 'diffusion' && (
              <Diffusion />
            )}

            {/* CLIENTS */}

            {activeTab === 'clients' && (
              <Clients />
            )}

            {/* PARAMETRES */}

            {activeTab === 'parametres' && (
              <Parametres />
            )}

            {/* PROFIL */}

            {activeTab === 'profil' && (
              <Profil />
            )}

          </main>

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

const labelStyle = {
  display: 'block',

  fontSize: '1.05rem',

  fontWeight: 800,

  marginBottom: '0.4rem',

  color: '#334155',
};

const errorStyle = {
  color: '#EF4444',

  backgroundColor: '#FEF2F2',

  padding: '1rem',

  borderRadius: '10px',

  marginBottom: '1.2rem',
};

const successStyle = {
  color: '#16A34A',

  backgroundColor: '#F0FDF4',

  padding: '1rem',

  borderRadius: '10px',

  marginBottom: '1.2rem',
};

export default App;