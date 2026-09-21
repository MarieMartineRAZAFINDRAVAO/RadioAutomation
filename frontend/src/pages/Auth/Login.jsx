import React, { useState } from 'react';
import API from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/tsiry.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('token/', { username, password });
      localStorage.setItem('token', res.data.access);
      navigate('/dashboard');
    } catch (err) {
      setError('Nom d\'utilisateur ou mot de passe incorrect.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Panneau Gauche - Vert */}
      <div style={{
        flex: '1',
        backgroundColor: '#007A4D',
        color: '#FFFFFF',
        padding: '4rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <img src={logo} alt="Radio Tsiry" style={{ width: '80px', marginBottom: '2rem', backgroundColor: '#FFF', padding: '5px', borderRadius: '4px' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', letterSpacing: '1px' }}>RADIO TSIRY</h1>
        <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '3rem', maxWidth: '450px' }}>
          Plateforme de traitement des services, factures, paiements, production audio et programmation de diffusion.
        </p>
        <hr style={{ border: 'none', borderTop: '2px solid #FFFFFF', width: '60px', margin: '0 0 2rem 0' }} />
        <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>ESPACE PROFESSIONNEL</h3>
        <p style={{ fontSize: '0.9rem', opacity: '0.9' }}>
          Connectez-vous pour accéder aux fonctionnalités correspondant à votre rôle.
        </p>
      </div>

      {/* Panneau Droit - Blanc */}
      <div style={{
        flex: '1',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '2.5rem',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#1E293B', marginBottom: '0.2rem', fontSize: '1.5rem' }}>Connexion</h2>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Accès à votre espace RADIO TSIRY</p>

          {error && <div style={{ color: '#D32F2F', backgroundColor: '#FFEBEE', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.4rem' }}>Nom d'utilisateur</label>
              <input
                type="text"
                placeholder="Votre nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.4rem' }}>Mot de passe</label>
              <input
                type="password"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <button type="submit" style={btnGreenStyle}>SE CONNECTER</button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748B' }}>
            Pas encore de compte ? <Link to="/register" style={{ color: '#007A4D', fontWeight: 'bold', textDecoration: 'none' }}>Créer un compte</Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: '#94A3B8' }}>
            RADIO TSIRY — Système interne
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '4px',
  border: '1px solid #CBD5E1',
  fontSize: '0.9rem',
  boxSizing: 'border-box'
};

const btnGreenStyle = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: '#007A4D',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '4px',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '0.9rem'
};

export default Login;