import React, { useState } from 'react';
import API from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await API.post('register/', { username, password, email });
      setMessage('Compte créé avec succès ! Redirection...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du compte.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#FFFFFF', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: '#007A4D', marginBottom: '0.5rem', textAlign: 'center' }}>Créer un Compte</h2>
        <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>Inscription au système RADIO TSIRY</p>

        {message && <div style={{ color: '#2E7D32', backgroundColor: '#E8F5E9', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>{message}</div>}
        {error && <div style={{ color: '#D32F2F', backgroundColor: '#FFEBEE', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.3rem' }}>Nom d'utilisateur</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.3rem' }}>Adresse Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '0.3rem' }}>Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
          </div>

          <button type="submit" style={btnGreenStyle}>S'INSCRIRE</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          Déjà un compte ? <Link to="/login" style={{ color: '#007A4D', fontWeight: 'bold', textDecoration: 'none' }}>Se connecter</Link>
        </div>
      </div>
    </div>
  );
};

const inputStyle = { width: '100%', padding: '0.7rem', borderRadius: '4px', border: '1px solid #CBD5E1', boxSizing: 'border-box' };
const btnGreenStyle = { width: '100%', padding: '0.75rem', backgroundColor: '#007A4D', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' };

export default Register;