import React, { useState } from 'react';
import API from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ═══ Couleurs RADIO TSIRY ═══
  const couleurs = {
    vert: '#007A4D',
    vertFonce: '#005C3A',
    vertClair: '#EAF7F1',
    rouge: '#DC2626',
    texte: '#1F2937',
    texteSecondaire: '#6B7280',
    bordure: '#DDE8E2',
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('token/', { username, password });
      localStorage.setItem('token', res.data.access);
      navigate('/dashboard');
    } catch (err) {
      setError("Nom d'utilisateur ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F8F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
              `linear-gradient(135deg, ${couleurs.vert} 0%, ${couleurs.vertFonce} 60%, #002B1C 100%)`,
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
                fontSize: '14px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                color: 'rgba(255,255,255,0.85)',
                textTransform: 'uppercase',
              }}
            >
              Vous pouvez facilement
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: '26px',
                fontWeight: 800,
                lineHeight: 1.35,
                color: '#FFFFFF',
              }}
            >
              Accéder à votre espace pour la gestion des commandes et la
              programmation de diffusion radio.
            </h2>
          </div>

          {/* Bas de page */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div
              style={{
                width: '60px',
                height: '3px',
                backgroundColor: '#FFFFFF',
                borderRadius: '2px',
                marginBottom: '20px',
              }}
            />

            <p
              style={{
                margin: 0,
                fontSize: '14px',
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
          {/* Titre */}
          <h1
            style={{
              margin: '0 0 10px',
              fontSize: '30px',
              fontWeight: 800,
              color: couleurs.texte,
            }}
          >
            Connexion
          </h1>

          <p
            style={{
              margin: '0 0 35px',
              fontSize: '15px',
              color: couleurs.texteSecondaire,
              lineHeight: 1.5,
            }}
          >
            Accès à votre espace <strong>RADIO TSIRY</strong>
          </p>

          {/* Message erreur */}
          {error && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                color: couleurs.rouge,
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleLogin}>
            {/* Nom d'utilisateur */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: couleurs.texte,
                }}
              >
                Nom d'utilisateur
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre nom d'utilisateur"
                required
                autoFocus
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 16px',
                  border: `1.5px solid ${couleurs.bordure}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  color: couleurs.texte,
                  backgroundColor: '#F9FAFB',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = couleurs.vert;
                  e.target.style.backgroundColor = '#FFFFFF';
                  e.target.style.boxShadow = `0 0 0 4px ${couleurs.vertClair}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = couleurs.bordure;
                  e.target.style.backgroundColor = '#F9FAFB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Mot de passe */}
            <div style={{ marginBottom: '28px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: couleurs.texte,
                }}
              >
                Mot de passe
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '14px 16px',
                  border: `1.5px solid ${couleurs.bordure}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  color: couleurs.texte,
                  backgroundColor: '#F9FAFB',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = couleurs.vert;
                  e.target.style.backgroundColor = '#FFFFFF';
                  e.target.style.boxShadow = `0 0 0 4px ${couleurs.vertClair}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = couleurs.bordure;
                  e.target.style.backgroundColor = '#F9FAFB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Bouton SE CONNECTER */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '15px',
                border: 'none',
                borderRadius: '12px',
                backgroundColor: loading ? '#9CA3AF' : couleurs.vert,
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
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = couleurs.vertFonce;
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = couleurs.vert;
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? 'CONNEXION...' : 'SE CONNECTER'}
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
                backgroundColor: couleurs.bordure,
              }}
            />
            <span
              style={{
                fontSize: '13px',
                color: couleurs.texteSecondaire,
                fontWeight: 600,
              }}
            >
              ou
            </span>
            <div
              style={{
                flex: 1,
                height: '1px',
                backgroundColor: couleurs.bordure,
              }}
            />
          </div>

          {/* Lien Créer un compte */}
          <p
            style={{
              margin: 0,
              textAlign: 'center',
              fontSize: '14px',
              color: couleurs.texteSecondaire,
            }}
          >
            Pas encore de compte ?{' '}
            <Link
              to="/register"
              style={{
                color: couleurs.vert,
                fontWeight: 800,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) =>
                (e.target.style.textDecoration = 'underline')
              }
              onMouseLeave={(e) =>
                (e.target.style.textDecoration = 'none')
              }
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;