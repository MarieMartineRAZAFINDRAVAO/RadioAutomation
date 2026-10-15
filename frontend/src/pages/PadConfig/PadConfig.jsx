import React, { useEffect, useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function PadConfig({ darkMode = false }) {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ═══ Formulaire ═══
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nomReseau, setNomReseau] = useState('');
  const [dossier, setDossier] = useState('');
  const [nomUtilisateur, setNomUtilisateur] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [saving, setSaving] = useState(false);

  // ═══ Test ═══
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const couleurs = {
    fond: darkMode ? '#18181B' : '#F5F8F6',
    carte: darkMode ? '#27272A' : '#FFFFFF',
    texte: darkMode ? '#F4F4F5' : '#1F2937',
    texteSecondaire: darkMode ? '#A1A1AA' : '#6B7280',
    bordure: darkMode ? '#3F3F46' : '#DDE8E2',
    vert: '#007A4D',
    vertClair: darkMode ? '#164E3B' : '#EAF7F1',
    rouge: '#DC2626',
  };

  // ═══ Charger les configs ═══
  const chargerConfigs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/pad-configs/`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error('Impossible de charger les réseaux.');
      const data = await response.json();
      const liste = Array.isArray(data) ? data : data.results || [];
      setConfigs(liste);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerConfigs();
  }, []);

  // ═══ Ouvrir ajout ═══
  const ouvrirAjout = () => {
    setEditing(null);
    setNomReseau('');
    setDossier('');
    setNomUtilisateur('');
    setMotDePasse('');
    setShowForm(true);
    setError('');
    setSuccessMessage('');
  };

  // ═══ Ouvrir modification ═══
  const ouvrirModification = (config) => {
    setEditing(config);
    setNomReseau(config.nomReseau || '');
    setDossier(config.dossier || '');
    setNomUtilisateur(config.nomUtilisateur || '');
    setMotDePasse(config.motDePasse || '');
    setShowForm(true);
    setError('');
    setSuccessMessage('');
  };

  // ═══ Enregistrer ═══
  const enregistrer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!nomReseau.trim() || !dossier.trim() || !nomUtilisateur.trim() || !motDePasse.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const url = editing
        ? `${API_BASE_URL}/pad-configs/${editing.idPadConfig}/`
        : `${API_BASE_URL}/pad-configs/`;

      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nomReseau: nomReseau.trim(),
          dossier: dossier.trim(),
          nomUtilisateur: nomUtilisateur.trim(),
          motDePasse: motDePasse.trim(),
        }),
      });

      if (!response.ok) throw new Error("Impossible d'enregistrer.");

      setSuccessMessage(editing ? 'Réseau modifié.' : 'Réseau ajouté.');
      setShowForm(false);
      chargerConfigs();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ═══ Supprimer ═══
  const supprimer = async (config) => {
    if (!window.confirm(`Supprimer le réseau "${config.nomReseau}" ?`)) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/pad-configs/${config.idPadConfig}/`,
        {
          method: 'DELETE',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!response.ok) throw new Error('Impossible de supprimer.');
      setSuccessMessage('Réseau supprimé.');
      chargerConfigs();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // ═══ Tester connexion ═══
  const tester = async (config) => {
    setTestingId(config.idPadConfig);
    setTestResult(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${API_BASE_URL}/pad-configs/${config.idPadConfig}/tester/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({}),
        }
      );
      const data = await response.json().catch(() => null);
      setTestResult({
        id: config.idPadConfig,
        success: response.ok && data?.success,
        message: data?.message || data?.error || 'Réponse inconnue.',
      });
    } catch (err) {
      setTestResult({
        id: config.idPadConfig,
        success: false,
        message: err.message,
      });
    } finally {
      setTestingId(null);
    }
  };

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px 16px',
    borderRadius: '8px',
    border: `1px solid ${couleurs.bordure}`,
    backgroundColor: darkMode ? '#18181B' : '#FFFFFF',
    color: couleurs.texte,
    fontSize: '16px',
    outline: 'none',
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 90px)',
        backgroundColor: couleurs.fond,
        padding: '35px 45px 55px',
        color: couleurs.texte,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* ═══ TITRE ═══ */}
        <h1
          style={{
            textAlign: 'center',
            fontSize: '38px',
            fontWeight: 800,
            color: couleurs.vert,
            marginBottom: '30px',
          }}
        >
          Configuration des réseaux
        </h1>

        {/* ═══ MESSAGES ═══ */}
        {error && (
          <div
            style={{
              marginBottom: '20px',
              padding: '14px 18px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: couleurs.rouge,
              borderRadius: '8px',
            }}
          >
            {error}
          </div>
        )}
        {successMessage && (
          <div
            style={{
              marginBottom: '20px',
              padding: '14px 18px',
              backgroundColor: '#F0FDF4',
              border: `1px solid ${couleurs.bordure}`,
              color: couleurs.texte,
              borderRadius: '8px',
              fontWeight: 600,
            }}
          >
            {successMessage}
          </div>
        )}

        {/* ═══ CARTE ═══ */}
        <div
          style={{
            backgroundColor: couleurs.carte,
            border: `1px solid ${couleurs.bordure}`,
            borderRadius: '14px',
            padding: '30px',
          }}
        >
          {/* ═══ BOUTON AJOUTER ═══ */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
              Liste des réseaux PAD
            </h2>
            <button
              type="button"
              onClick={ouvrirAjout}
              style={{
                border: 'none',
                backgroundColor: couleurs.vert,
                color: '#FFFFFF',
                padding: '13px 23px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '15px',
              }}
            >
              + Ajouter un réseau
            </button>
          </div>

          {/* ═══ FORMULAIRE ═══ */}
          {showForm && (
            <div
              style={{
                marginBottom: '25px',
                padding: '25px',
                border: `1px solid ${couleurs.bordure}`,
                borderRadius: '10px',
                backgroundColor: couleurs.vertClair,
              }}
            >
              <h3 style={{ marginTop: 0, color: couleurs.vert }}>
                {editing ? 'Modifier le réseau' : 'Ajouter un réseau PAD'}
              </h3>

              <form onSubmit={enregistrer}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    marginBottom: '20px',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                      Nom du réseau
                    </label>
                    <input
                      type="text"
                      value={nomReseau}
                      onChange={(e) => setNomReseau(e.target.value)}
                      placeholder="ex : onair"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                      Dossier partagé
                    </label>
                    <input
                      type="text"
                      value={dossier}
                      onChange={(e) => setDossier(e.target.value)}
                      placeholder="ex : \\\\onair\\z"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      value={nomUtilisateur}
                      onChange={(e) => setNomUtilisateur(e.target.value)}
                      placeholder="ex : onair"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700 }}>
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      placeholder="••••••"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      border: `1px solid ${couleurs.bordure}`,
                      backgroundColor: 'transparent',
                      color: couleurs.texte,
                      padding: '13px 23px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      border: 'none',
                      backgroundColor: couleurs.vert,
                      color: '#FFFFFF',
                      padding: '13px 25px',
                      borderRadius: '8px',
                      cursor: saving ? 'wait' : 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ═══ LISTE ═══ */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: couleurs.texteSecondaire }}>
              Chargement...
            </div>
          ) : configs.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '45px',
                border: `1px dashed ${couleurs.bordure}`,
                borderRadius: '8px',
                color: couleurs.texteSecondaire,
              }}
            >
              Aucun réseau configuré.
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto',
                border: `1px solid ${couleurs.bordure}`,
                borderRadius: '9px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                <thead>
                  <tr style={{ backgroundColor: couleurs.vert, color: '#FFFFFF' }}>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Nom du réseau</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Dossier</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>Utilisateur</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((c) => (
                    <tr
                      key={c.idPadConfig}
                      style={{ borderBottom: `1px solid ${couleurs.bordure}` }}
                    >
                      <td style={{ padding: '15px', fontWeight: 700 }}>{c.nomReseau}</td>
                      <td style={{ padding: '15px' }}>{c.dossier}</td>
                      <td style={{ padding: '15px' }}>{c.nomUtilisateur}</td>
                      <td style={{ padding: '15px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => tester(c)}
                          disabled={testingId === c.idPadConfig}
                          style={{
                            border: 'none',
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            padding: '9px 16px',
                            borderRadius: '7px',
                            cursor: testingId === c.idPadConfig ? 'wait' : 'pointer',
                            fontWeight: 700,
                            fontSize: '14px',
                            marginRight: '8px',
                          }}
                        >
                          {testingId === c.idPadConfig ? '⏳' : '🔍 Tester'}
                        </button>

                        <button
                          type="button"
                          onClick={() => ouvrirModification(c)}
                          style={{
                            border: 'none',
                            backgroundColor: '#3B82F6',
                            color: '#FFFFFF',
                            padding: '9px 16px',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '14px',
                            marginRight: '8px',
                          }}
                        >
                          ✏️ Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() => supprimer(c)}
                          style={{
                            border: 'none',
                            backgroundColor: '#FEE2E2',
                            color: couleurs.rouge,
                            padding: '9px 16px',
                            borderRadius: '7px',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '14px',
                          }}
                        >
                          🗑 Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ═══ RESULTAT TEST ═══ */}
          {testResult && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px 18px',
                backgroundColor: testResult.success ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${testResult.success ? '#BBF7D0' : '#FECACA'}`,
                color: testResult.success ? '#15803D' : couleurs.rouge,
                borderRadius: '8px',
                fontWeight: 600,
              }}
            >
              {testResult.success ? '✅ ' : '❌ '}
              {testResult.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}