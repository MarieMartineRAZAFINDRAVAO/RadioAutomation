import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// =====================================================
// AJOUT AUTOMATIQUE DU JWT TOKEN
// =====================================================

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// AUTHENTIFICATION
// =====================================================

export const login = (username, password) => {
  return API.post('token/', {
    username,
    password,
  });
};

// =====================================================
// CLIENTS
// =====================================================

export const rechercherClients = (q) => {
  return API.get(
    `clients/recherche/?q=${encodeURIComponent(q)}`
  );
};

export const getClients = () => {
  return API.get('clients/');
};

export const getClient = (id) => {
  return API.get(`clients/${id}/`);
};

export const createClient = (data) => {
  return API.post('clients/', data);
};

export const updateClient = (id, data) => {
  return API.put(`clients/${id}/`, data);
};

export const deleteClient = (id) => {
  return API.delete(`clients/${id}/`);
};

// =====================================================
// SERVICES
// =====================================================

export const getServices = () => {
  return API.get('services/');
};

export const getService = (id) => {
  return API.get(`services/${id}/`);
};

// =====================================================
// TARIFS
// =====================================================

export const getTarifs = (serviceId = null) => {
  if (serviceId) {
    return API.get(`tarifs/?service=${serviceId}`);
  }

  return API.get('tarifs/');
};

export const getTarif = (id) => {
  return API.get(`tarifs/${id}/`);
};

// =====================================================
// COMMANDES
// =====================================================

export const getCommandes = () => {
  return API.get('commandes/');
};

export const getCommande = (id) => {
  return API.get(`commandes/${id}/`);
};

export const createCommande = (data) => {
  return API.post('commandes/', data);
};

export const updateCommande = (id, data) => {
  return API.put(`commandes/${id}/`, data);
};

export const deleteCommande = (id) => {
  return API.delete(`commandes/${id}/`);
};

// =====================================================
// GENERER FACTURE
// =====================================================

export const genererFacture = (id) => {
  return API.post(`commandes/${id}/generer-facture/`);
};

// =====================================================
// LIGNES DE COMMANDE
// =====================================================

export const getLignes = () => {
  return API.get('lignes/');
};

export const createLigne = (data) => {
  return API.post('lignes/', data);
};

export const updateLigne = (id, data) => {
  return API.put(`lignes/${id}/`, data);
};

export const deleteLigne = (id) => {
  return API.delete(`lignes/${id}/`);
};

// =====================================================
// DOCUMENTS
// =====================================================

export const getDocuments = () => {
  return API.get('documents/');
};

export const createDocument = (data) => {
  return API.post('documents/', data);
};

// =====================================================
// FICHIERS AUDIO
// =====================================================

export const getFichiersAudio = () => {
  return API.get('fichiers-audio/');
};

export const createFichierAudio = (data) => {
  return API.post('fichiers-audio/', data);
};

export const uploadFichierAudio = (formData) => {
  return API.post('fichiers-audio/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const envoyerVersPAD = (id) => {
  return API.post(`fichiers-audio/${id}/envoyer-pad/`);
};

// =====================================================
// PAD (config des "lera")
// =====================================================

export const getPadConfig = () => {
  return API.get('pad/config/');
};

// =====================================================
// PROFIL UTILISATEUR CONNECTE
// =====================================================

export const getMe = () => {
  return API.get('me/');
};

export const updateMe = (data) => {
  return API.patch('me/', data);
};

export const changerMotDePasse = (data) => {
  return API.post('me/changer-mot-de-passe/', data);
};

// =====================================================
// PROGRAMMATION
// =====================================================

export const getProgrammations = () => {
  return API.get('programmations/');
};

export const createProgrammation = (data) => {
  return API.post('programmations/', data);
};

export const deleteProgrammation = (id) => {
  return API.delete(`programmations/${id}/`);
};

// =====================================================
// FACTURES
// =====================================================

export const getFactures = () => {
  return API.get('factures/');
};

export const getFacture = (id) => {
  return API.get(`factures/${id}/`);
};

// =====================================================
// EXPORT PAR DEFAUT
// =====================================================

export default API;