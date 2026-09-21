import React, { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, X, User } from 'lucide-react';

import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from '../../services/api';

const mainColor = '#007A4D';

const emptyForm = { nom: '', telephone: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  const [modalOuvert, setModalOuvert] = useState(false);
  const [clientEnEdition, setClientEnEdition] = useState(null); // null = ajout
  const [form, setForm] = useState(emptyForm);

  const chargerClients = () => {
    setLoading(true);
    getClients()
      .then((res) => setClients(res.data))
      .catch(() => setErreur('Impossible de charger les clients.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    chargerClients();
  }, []);

  const filtres = clients.filter(
    (c) =>
      c.nom?.toLowerCase().includes(search.toLowerCase()) ||
      c.telephone?.includes(search)
  );

  const ouvrirAjout = () => {
    setClientEnEdition(null);
    setForm(emptyForm);
    setErreur('');
    setModalOuvert(true);
  };

  const ouvrirEdition = (client) => {
    setClientEnEdition(client);
    setForm({ nom: client.nom || '', telephone: client.telephone || '' });
    setErreur('');
    setModalOuvert(true);
  };

  const fermerModal = () => setModalOuvert(false);

  const enregistrer = async (e) => {
    e.preventDefault();

    if (!form.nom.trim() || !form.telephone.trim()) {
      setErreur('Le nom et le téléphone sont obligatoires.');
      return;
    }

    try {
      if (clientEnEdition) {
        await updateClient(clientEnEdition.id, form);
      } else {
        await createClient(form);
      }

      setModalOuvert(false);
      chargerClients();
    } catch (err) {
      setErreur(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Impossible d'enregistrer le client."
      );
    }
  };

  const supprimer = async (client) => {
    if (!window.confirm(`Supprimer le client "${client.nom}" ?`)) return;

    try {
      await deleteClient(client.id);
      chargerClients();
    } catch {
      setErreur('Impossible de supprimer ce client (vérifiez ses commandes liées).');
    }
  };

  const cardStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    padding: '1.5rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '2px solid #E2E8F0',
    fontSize: '1rem',
    boxSizing: 'border-box',
    marginBottom: '1rem',
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.2rem',
        }}
      >
        <h2 style={{ margin: 0, color: mainColor }}>👤 Clients</h2>

        <button
          onClick={ouvrirAjout}
          style={{
            backgroundColor: mainColor,
            color: '#FFF',
            border: 'none',
            padding: '0.7rem 1.2rem',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Plus size={18} /> Nouveau client
        </button>
      </div>

      {erreur && (
        <div
          style={{
            color: '#DC2626',
            backgroundColor: '#FEF2F2',
            padding: '0.9rem 1.2rem',
            borderRadius: '10px',
            marginBottom: '1.2rem',
          }}
        >
          {erreur}
        </div>
      )}

      <div style={cardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            border: '2px solid #E2E8F0',
            borderRadius: '10px',
            padding: '0.6rem 1rem',
            marginBottom: '1.2rem',
            maxWidth: '380px',
          }}
        >
          <Search size={18} color="#94A3B8" />
          <input
            type="text"
            placeholder="Rechercher un client (nom ou téléphone)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem' }}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '0.6rem' }}>Client</th>
              <th style={{ padding: '0.6rem' }}>Téléphone</th>
              <th style={{ padding: '0.6rem' }}>Depuis le</th>
              <th style={{ padding: '0.6rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtres.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8' }}>
                  {clients.length === 0
                    ? 'Aucun client pour le moment. Cliquez sur "Nouveau client" pour en ajouter un.'
                    : 'Aucun résultat pour cette recherche.'}
                </td>
              </tr>
            )}

            {filtres.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#DCFCE7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: mainColor,
                    }}
                  >
                    <User size={16} />
                  </div>
                  <span style={{ fontWeight: 600 }}>{c.nom}</span>
                </td>
                <td style={{ padding: '0.6rem' }}>{c.telephone}</td>
                <td style={{ padding: '0.6rem', color: '#64748B' }}>
                  {c.dateCreation ? new Date(c.dateCreation).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                  <button
                    onClick={() => ouvrirEdition(c)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: mainColor, marginRight: '0.6rem' }}
                    title="Modifier"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => supprimer(c)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOuvert && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ backgroundColor: '#FFF', padding: '2rem', borderRadius: '18px', width: '420px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>
                {clientEnEdition ? 'Modifier le client' : 'Nouveau client'}
              </h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={fermerModal} />
            </div>

            <form onSubmit={enregistrer}>
              <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Nom complet</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                style={inputStyle}
                autoFocus
              />

              <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>Téléphone</label>
              <input
                type="text"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                style={inputStyle}
              />

              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={fermerModal}
                  style={{ backgroundColor: '#F1F5F9', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: mainColor, color: '#FFF', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
