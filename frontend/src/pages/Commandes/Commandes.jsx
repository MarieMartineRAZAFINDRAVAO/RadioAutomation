import React, { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function Commandes({ darkMode = false, onFactureGeneree, etapeInitial = 1 }) {
  // =========================================================
  // ÉTAPES
  // 1 = Client
  // 2 = Service + Tarif
  // 3 = Facture
  // =========================================================
 const [etape, setEtape] = useState(etapeInitial);

  // =========================================================
  // CLIENTS
  // =========================================================
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // =========================================================
  // INTERFACE CLIENT
  // liste / ajout / modifier / details
  // =========================================================
  const [interfaceClient, setInterfaceClient] = useState('liste');

  // =========================================================
  // FORMULAIRE CLIENT
  // =========================================================
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [ajoutLoading, setAjoutLoading] = useState(false);

  // Recherche dynamique
  const [rechercheClient, setRechercheClient] = useState('');

  // Client sélectionné
  const [clientSelectionne, setClientSelectionne] = useState(null);

  // Client concerné par une action
  const [clientAction, setClientAction] = useState(null);

  // Menu clic droit
  const [menuContextuel, setMenuContextuel] = useState(null);

  // Messages
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // =========================================================
  // ÉTAPE 2 : SERVICE + TARIF + DATES + HEURES
  // =========================================================
  const [services, setServices] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [serviceSelectionne, setServiceSelectionne] = useState(null);
  const [tarifSelectionne, setTarifSelectionne] = useState(null);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [heuresParDate, setHeuresParDate] = useState({});
  const [heureTemporaire, setHeureTemporaire] = useState({});
  const [observationCommande, setObservationCommande] = useState('');
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingTarifs, setLoadingTarifs] = useState(false);

  // =========================================================
  // ÉTAPE 3 : COMMANDE + FACTURE
  // =========================================================
  const [commandeCreee, setCommandeCreee] = useState(null);
  const [factureGeneree, setFactureGeneree] = useState(null);
  const [generationFactureLoading, setGenerationFactureLoading] =
    useState(false);

  // =========================================================
  // COULEURS
  // =========================================================
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

  // =========================================================
  // CONTRÔLE TÉLÉPHONE
  // Maximum 10 caractères
  // =========================================================
const MAX_TELEPHONE = 10;

const controlerTelephone = (valeur) => {
  // Chiffres ihany
  const chiffres = String(valeur).replace(/[^0-9]/g, '');
  return chiffres.slice(0, MAX_TELEPHONE);
};

const gererTelephone = (event) => {
  const valeur = event.target.value;
  setTelephone(controlerTelephone(valeur));
};

const bloquerClavierTelephone = (event) => {
  const touchesAutorisees = [
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'Tab',
  ];

  if (touchesAutorisees.includes(event.key)) {
    return;
  }

  if (event.ctrlKey || event.metaKey) {
    return;
  }

  const input = event.currentTarget;
  const selection = input.selectionStart !== input.selectionEnd;

  // ① Chiffres ihany — tsy mandray litera
  if (!/[0-9]/.test(event.key)) {
    event.preventDefault();
    return;
  }

  // ② Raha tsy manomboka amin'ny "0" ny voalohany
  if (input.value.length === 0 && event.key !== '0') {
    event.preventDefault();
    return;
  }

  // ③ Raha "0" ny voalohany fa tsy "03" ny faharoa
  if (
    input.value.length === 1 &&
    input.value === '0' &&
    event.key !== '3'
  ) {
    event.preventDefault();
    return;
  }

  // ④ 10 chiffres ihany
  if (input.value.length >= MAX_TELEPHONE && !selection) {
    event.preventDefault();
  }
};

const gererNom = (event) => {
  const valeur = event.target.value;
  const formatted = valeur.replace(/\b\w/g, (c) => c.toUpperCase());
  setNom(formatted);
};

const gererRechercheClient = (event) => {
  const valeur = event.target.value;
  const formatted = valeur.replace(/\b\w/g, (c) => c.toUpperCase());
  setRechercheClient(formatted);
};

  // =========================================================
  // CHARGER LES CLIENTS
  // =========================================================
  const chargerClients = async () => {
    try {
      setLoadingClients(true);
      setError('');

      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${API_BASE_URL}/clients/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          'Impossible de charger les clients.'
        );
      }

      const data = await response.json();

      const listeClients = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [];

      setClients(listeClients);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Erreur lors du chargement des clients.'
      );
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    chargerClients();
  }, []);

  // =========================================================
  // RECHERCHE DYNAMIQUE
  // =========================================================
  const clientsCorrespondants = useMemo(() => {
    const texte = rechercheClient
      .trim()
      .toLowerCase();

    if (!texte) {
      return [];
    }

    return clients.filter((client) => {
      const nomClient = String(
        client.nom || ''
      ).toLowerCase();

      const telephoneClient = String(
        client.telephone || ''
      ).toLowerCase();

      return (
        nomClient.includes(texte) ||
        telephoneClient.includes(texte)
      );
    });
  }, [clients, rechercheClient]);

  // =========================================================
  // FERMER LE MENU CLIC DROIT
  // =========================================================
  useEffect(() => {
    const fermerMenu = () => {
      setMenuContextuel(null);
    };

    document.addEventListener(
      'click',
      fermerMenu
    );

    return () => {
      document.removeEventListener(
        'click',
        fermerMenu
      );
    };
  }, []);

  // =========================================================
  // OUVRIR AJOUT CLIENT
  // =========================================================
  const ouvrirAjoutClient = () => {
    setInterfaceClient('ajout');

    setNom('');
    setTelephone('');
    setRechercheClient('');
    setClientAction(null);

    setError('');
    setSuccessMessage('');
    setMenuContextuel(null);
  };

  // =========================================================
  // RETOUR LISTE
  // =========================================================
  const retournerListe = () => {
    setInterfaceClient('liste');

    setNom('');
    setTelephone('');
    setRechercheClient('');
    setClientAction(null);

    setError('');
    setMenuContextuel(null);
  };

  // =========================================================
  // SÉLECTIONNER UN CLIENT
  // =========================================================
  const selectionnerClientListe = (client) => {
    setClientSelectionne(client);

    setError('');
    setSuccessMessage('');
    setMenuContextuel(null);
  };

  // =========================================================
  // CLIC DROIT SUR UN CLIENT
  // =========================================================
  const ouvrirMenuContextuel = (
    event,
    client
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setClientSelectionne(client);

    setMenuContextuel({
      x: event.clientX,
      y: event.clientY,
      client: client,
    });

    setError('');
    setSuccessMessage('');
  };

  // =========================================================
  // AJOUTER CLIENT
  // =========================================================
  const ajouterClient = async (event) => {
    event.preventDefault();

    const nomNettoye = nom.trim();

    const telephoneNettoye =
      controlerTelephone(
        telephone.trim()
      );

    if (!nomNettoye) {
      setError(
        'Veuillez saisir le nom du client.'
      );
      return;
    }

    if (!telephoneNettoye) {
      setError(
        'Veuillez saisir le téléphone du client.'
      );
      return;
    }

    if (
      telephoneNettoye.length >
      MAX_TELEPHONE
    ) {
      setError(
        'Le numéro de téléphone ne peut pas dépasser 10 caractères.'
      );
      return;
    }

    try {
      setAjoutLoading(true);
      setError('');
      setSuccessMessage('');

      const token =
        localStorage.getItem(
          'accessToken'
        );

      const response = await fetch(
        `${API_BASE_URL}/clients/`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            nom: nomNettoye,
            telephone:
              telephoneNettoye,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          'Erreur API :',
          data
        );

        if (
          typeof data ===
            'object' &&
          data !== null
        ) {
          const messages =
            Object.entries(data)
              .map(
                ([
                  champ,
                  message,
                ]) => {
                  const texteMessage =
                    Array.isArray(
                      message
                    )
                      ? message.join(
                          ', '
                        )
                      : String(
                          message
                        );

                  return `${champ} : ${texteMessage}`;
                }
              )
              .join(' | ');

          throw new Error(
            messages ||
              "Impossible d'ajouter le client."
          );
        }

        throw new Error(
          "Impossible d'ajouter le client."
        );
      }

      setClients(
        (anciensClients) => [
          data,
          ...anciensClients,
        ]
      );

      setClientSelectionne(data);

      setNom('');
      setTelephone('');
      setRechercheClient('');

      setSuccessMessage(
        'Client ajouté avec succès.'
      );

      setInterfaceClient('liste');

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Erreur lors de l'ajout du client."
      );
    } finally {
      setAjoutLoading(false);
    }
  };

  // =========================================================
  // SÉLECTIONNER DEPUIS LA RECHERCHE
  // =========================================================
  const selectionnerClientRecherche =
    (client) => {
      setClientSelectionne(client);

      setNom(
        client.nom || ''
      );

      setTelephone(
        controlerTelephone(
          client.telephone || ''
        )
      );

      setRechercheClient('');
      setError('');
    };

  // =========================================================
  // FAIRE UNE COMMANDE
  // =========================================================
  const faireCommande = (
    client
  ) => {
    setClientSelectionne(client);

    setMenuContextuel(null);
    setError('');
    setSuccessMessage('');

    setEtape(2);
  };

  // =========================================================
  // MODIFIER CLIENT
  // =========================================================
  const modifierClient = (
    client
  ) => {
    setMenuContextuel(null);

    setClientAction(client);

    setNom(
      client.nom || ''
    );

    setTelephone(
      controlerTelephone(
        client.telephone || ''
      )
    );

    setRechercheClient('');
    setError('');
    setSuccessMessage('');

    setInterfaceClient(
      'modifier'
    );
  };

  // =========================================================
  // ENREGISTRER MODIFICATION
  // =========================================================
  const enregistrerModification =
    async (event) => {
      event.preventDefault();

      if (!clientAction) {
        return;
      }

      const nomNettoye =
        nom.trim();

      const telephoneNettoye =
        controlerTelephone(
          telephone.trim()
        );

      if (!nomNettoye) {
        setError(
          'Veuillez saisir le nom du client.'
        );
        return;
      }

      if (!telephoneNettoye) {
        setError(
          'Veuillez saisir le téléphone du client.'
        );
        return;
      }

      if (
        telephoneNettoye.length >
        MAX_TELEPHONE
      ) {
        setError(
          'Le numéro de téléphone ne peut pas dépasser 10 caractères.'
        );
        return;
      }

      const id =
        clientAction.idClient ??
        clientAction.id;

      if (!id) {
        setError(
          'Identifiant du client introuvable.'
        );
        return;
      }

      try {
        setError('');
        setSuccessMessage('');

        const token =
          localStorage.getItem(
            'accessToken'
          );

        const response =
          await fetch(
            `${API_BASE_URL}/clients/${id}/`,
            {
              method: 'PUT',
              headers: {
                'Content-Type':
                  'application/json',
                ...(token
                  ? {
                      Authorization: `Bearer ${token}`,
                    }
                  : {}),
              },
              body: JSON.stringify({
                nom: nomNettoye,
                telephone:
                  telephoneNettoye,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          console.error(
            'Erreur modification :',
            data
          );

          if (
            typeof data ===
              'object' &&
            data !== null
          ) {
            const messages =
              Object.entries(data)
                .map(
                  ([
                    champ,
                    message,
                  ]) => {
                    const texteMessage =
                      Array.isArray(
                        message
                      )
                        ? message.join(
                            ', '
                          )
                        : String(
                            message
                          );

                    return `${champ} : ${texteMessage}`;
                  }
                )
                .join(' | ');

            throw new Error(
              messages ||
                'Impossible de modifier le client.'
            );
          }

          throw new Error(
            'Impossible de modifier le client.'
          );
        }

        setClients(
          (anciensClients) =>
            anciensClients.map(
              (client) => {
                const clientId =
                  client.idClient ??
                  client.id;

                return clientId ===
                  id
                  ? data
                  : client;
              }
            )
        );

        setClientSelectionne(
          data
        );

        setSuccessMessage(
          'Client modifié avec succès.'
        );

        setClientAction(null);
        setNom('');
        setTelephone('');

        setInterfaceClient(
          'liste'
        );

        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            'Erreur lors de la modification du client.'
        );
      }
    };

  // =========================================================
  // SUPPRIMER CLIENT
  // =========================================================
  const supprimerClient = async (
    client
  ) => {
    setMenuContextuel(null);

    const id =
      client.idClient ??
      client.id;

    if (!id) {
      setError(
        'Identifiant du client introuvable.'
      );
      return;
    }

    const confirmation =
      window.confirm(
        `Voulez-vous vraiment supprimer le client "${client.nom}" ?`
      );

    if (!confirmation) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      const token =
        localStorage.getItem(
          'accessToken'
        );

      const response =
        await fetch(
          `${API_BASE_URL}/clients/${id}/`,
          {
            method: 'DELETE',
            headers: {
              ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                  }
                : {}),
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          'Impossible de supprimer le client.'
        );
      }

      setClients(
        (anciensClients) =>
          anciensClients.filter(
            (element) =>
              (element.idClient ??
                element.id) !== id
          )
      );

      if (
        clientSelectionne &&
        (clientSelectionne.idClient ??
          clientSelectionne.id) ===
          id
      ) {
        setClientSelectionne(
          null
        );
      }

      setSuccessMessage(
        'Client supprimé avec succès.'
      );

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Erreur lors de la suppression du client.'
      );
    }
  };

  // =========================================================
  // DÉTAILS CLIENT
  // =========================================================
  const afficherDetails = (
    client
  ) => {
    setMenuContextuel(null);

    setClientAction(client);
    setError('');
    setSuccessMessage('');

    setInterfaceClient(
      'details'
    );
  };

  // =========================================================
  // PASSER À L'ÉTAPE SERVICE
  // =========================================================
  const passerAuService = () => {
    if (!clientSelectionne) {
      setError(
        'Veuillez sélectionner un client avant de continuer.'
      );

      return;
    }

    setError('');
    setMenuContextuel(null);
    setEtape(2);
  };

  // =========================================================
  // RETOUR CLIENT
  // =========================================================
  const retourClient = () => {
    setEtape(1);
    setInterfaceClient('liste');
    setError('');
    setMenuContextuel(null);
  };

  // =========================================================
  // OUTILS ÉTAPE 2
  // =========================================================
  const getToken = () =>
    localStorage.getItem(
      'accessToken'
    );

  const fetchJson = async (
    url,
    options = {}
  ) => {
    const token = getToken();

    const response = await fetch(
      url,
      {
        ...options,
        headers: {
          'Content-Type':
            'application/json',
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
          ...(options.headers || {}),
        },
      }
    );

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      let message = `Erreur HTTP ${response.status}`;

      if (
        data &&
        typeof data === 'object'
      ) {
        const messages =
          Object.entries(data)
            .map(
              ([champ, valeur]) =>
                `${champ} : ${
                  Array.isArray(valeur)
                    ? valeur.join(', ')
                    : valeur
                }`
            )
            .join(' | ');

        if (messages) {
          message = messages;
        }
      }

      throw new Error(message);
    }

    return data;
  };

  // =========================================================
  // CHARGER SERVICES
  // =========================================================
  const chargerServices = async () => {
    try {
      setLoadingServices(true);

      const data =
        await fetchJson(
          `${API_BASE_URL}/services/`
        );

      const liste =
        Array.isArray(data)
          ? data
          : Array.isArray(
              data?.results
            )
          ? data.results
          : [];

      setServices(liste);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Impossible de charger les services.'
      );
    } finally {
      setLoadingServices(false);
    }
  };

  // =========================================================
  // CHARGER TARIFS DU SERVICE SÉLECTIONNÉ
  // =========================================================
  const chargerTarifs = async (
    serviceId
  ) => {
    if (!serviceId) {
      setTarifs([]);
      return;
    }

    try {
      setLoadingTarifs(true);
      setTarifs([]);

      // IMPORTANT :
      // On demande directement au backend
      // uniquement les tarifs du service choisi.
      const data =
        await fetchJson(
          `${API_BASE_URL}/tarifs/?service=${encodeURIComponent(
            serviceId
          )}`
        );

      const liste =
        Array.isArray(data)
          ? data
          : Array.isArray(
              data?.results
            )
          ? data.results
          : [];

      setTarifs(liste);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Impossible de charger les tarifs.'
      );
    } finally {
      setLoadingTarifs(false);
    }
  };

  const initialiserEtape2 =
    async () => {
      setError('');
      setSuccessMessage('');
      setFactureGeneree(null);
      setCommandeCreee(null);

      await chargerServices();
    };

  useEffect(() => {
    if (etape === 2) {
      initialiserEtape2();
    }
  }, [etape]);

  // =========================================================
  // CHARGER TARIFS APRÈS CHOIX DU SERVICE
  // =========================================================
  useEffect(() => {
    if (serviceSelectionne) {
      const serviceId =
        serviceSelectionne.idService ??
        serviceSelectionne.id;

      chargerTarifs(serviceId);
    } else {
      setTarifs([]);
    }
  }, [serviceSelectionne]);

  // =========================================================
  // DATES
  // =========================================================
  const formaterDateLocale = (
    date
  ) => {
    if (!date) return '';

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      'fr-FR'
    );
  };

  const obtenirDatesEntre = (
    debut,
    fin
  ) => {
    if (
      !debut ||
      !fin ||
      debut > fin
    ) {
      return [];
    }

    const dates = [];

    const courant = new Date(
      `${debut}T00:00:00`
    );

    const dernier = new Date(
      `${fin}T00:00:00`
    );

    while (
      courant <= dernier
    ) {
      const annee =
        courant.getFullYear();

      const mois = String(
        courant.getMonth() + 1
      ).padStart(2, '0');

      const jour = String(
        courant.getDate()
      ).padStart(2, '0');

      dates.push(
        `${annee}-${mois}-${jour}`
      );

      courant.setDate(
        courant.getDate() + 1
      );
    }

    return dates;
  };

  const datesCommande =
    useMemo(
      () =>
        obtenirDatesEntre(
          dateDebut,
          dateFin
        ),
      [dateDebut, dateFin]
    );

  // =========================================================
  // INITIALISER LES HEURES POUR CHAQUE DATE
  // =========================================================
  useEffect(() => {
    if (
      !dateDebut ||
      !dateFin ||
      dateDebut > dateFin
    ) {
      setHeuresParDate({});
      setHeureTemporaire({});
      return;
    }

    setHeuresParDate(
      (ancien) => {
        const nouveau = {};

        datesCommande.forEach(
          (date) => {
            nouveau[date] =
              Array.isArray(
                ancien[date]
              )
                ? ancien[date]
                : [];
          }
        );

        return nouveau;
      }
    );
  }, [dateDebut, dateFin]);

  // =========================================================
  // AJOUTER UNE HEURE
  // =========================================================
  const ajouterHeure = (
    date
  ) => {
    const heure =
      heureTemporaire[date];

    if (!heure) {
      setError(
        `Veuillez choisir une heure pour le ${formaterDateLocale(
          date
        )}.`
      );
      return;
    }

    setHeuresParDate(
      (ancien) => {
        const existantes =
          Array.isArray(
            ancien[date]
          )
            ? ancien[date]
            : [];

        if (
          existantes.includes(
            heure
          )
        ) {
          setError(
            `L'heure ${heure} est déjà ajoutée pour le ${formaterDateLocale(
              date
            )}.`
          );

          return ancien;
        }

        return {
          ...ancien,
          [date]: [
            ...existantes,
            heure,
          ].sort(),
        };
      }
    );

    setHeureTemporaire(
      (ancien) => ({
        ...ancien,
        [date]: '',
      })
    );

    setError('');
  };

  // =========================================================
  // SUPPRIMER UNE HEURE
  // =========================================================
  const supprimerHeure = (
    date,
    heure
  ) => {
    setHeuresParDate(
      (ancien) => ({
        ...ancien,
        [date]: (
          ancien[date] || []
        ).filter(
          (element) =>
            element !== heure
        ),
      })
    );
  };

  // =========================================================
  // NOMBRE TOTAL DE DIFFUSIONS
  // =========================================================
  const nombreDiffusions =
    useMemo(
      () =>
        Object.values(
          heuresParDate
        ).reduce(
          (
            total,
            heures
          ) =>
            total +
            (heures?.length ||
              0),
          0
        ),
      [heuresParDate]
    );

  // =========================================================
  // PRIX UNITAIRE
  // =========================================================
  const prixUnitaire =
    Number(
      tarifSelectionne?.prix ??
        tarifSelectionne?.prixUnitaire ??
        tarifSelectionne?.tarifBase ??
        0
    );

  // =========================================================
  // MONTANT TOTAL
  // Prix du tarif × nombre de diffusions
  // =========================================================
  const montantTotalEtape2 =
    prixUnitaire *
    nombreDiffusions;

  // =========================================================
  // VALIDATION ÉTAPE 2
  // =========================================================
  const validerEtape2 = () => {
    if (!clientSelectionne) {
      setError(
        'Aucun client n’est sélectionné.'
      );
      return false;
    }

    if (!serviceSelectionne) {
      setError(
        'Veuillez sélectionner un service.'
      );
      return false;
    }

    if (!tarifSelectionne) {
      setError(
        'Veuillez sélectionner un tarif.'
      );
      return false;
    }

    if (
      !dateDebut ||
      !dateFin
    ) {
      setError(
        'Veuillez sélectionner la date de début et la date de fin.'
      );
      return false;
    }

    if (dateDebut > dateFin) {
      setError(
        'La date de fin doit être supérieure ou égale à la date de début.'
      );
      return false;
    }

    if (nombreDiffusions === 0) {
      setError(
        'Veuillez ajouter au moins une heure de diffusion.'
      );
      return false;
    }

    setError('');
    setEtape(3);

    return true;
  };

  // =========================================================
  // CRÉER LA COMMANDE ET GÉNÉRER LA FACTURE
  // =========================================================
  const genererFacture =
    async () => {
      if (!validerEtape2()) {
        return;
      }

      try {
        setGenerationFactureLoading(
          true
        );

        setError('');
        setSuccessMessage('');

        const clientId =
          clientSelectionne.idClient ??
          clientSelectionne.id;

        const serviceId =
          serviceSelectionne.idService ??
          serviceSelectionne.id;

        const tarifId =
          tarifSelectionne.idTarif ??
          tarifSelectionne.id;

        if (
          !clientId ||
          !serviceId ||
          !tarifId
        ) {
          throw new Error(
            'Identifiant client, service ou tarif introuvable.'
          );
        }

        // Utilisateur connecté
        
               // Utilisateur par défaut (admin)
const utilisateurId = 1;

        // =====================================================
        // UNE LIGNE DE COMMANDE PAR HEURE DE DIFFUSION
        // =====================================================
        const lignes = [];

        datesCommande.forEach(
          (date) => {
            (
              heuresParDate[
                date
              ] || []
            ).forEach(
              (heure) => {
                lignes.push({
                  service:
                    serviceId,

                  tarif:
                    tarifId,

                  designation:
                    tarifSelectionne.libelle ||
                    serviceSelectionne.nomService ||
                    'Service radio',

                  quantite: 1,

                  prixUnitaire:
                    prixUnitaire,

                  dateDebut:
                    dateDebut,

                  dateFin:
                    dateFin,

                 heureDiffusion:
  heure.length === 5 ? `${heure}:00` : heure,
                });
              }
            );
          }
        );

        // =====================================================
        // CRÉATION COMMANDE
        // =====================================================
        const commande =
          await fetchJson(
            `${API_BASE_URL}/commandes/`,
            {
              method: 'POST',

              body: JSON.stringify({
                client:
                  clientId,

                utilisateur:
                  utilisateurId,

                statut:
                  'En cours',

                observation:
                  observationCommande.trim() ||
                  null,

                lignes:
                  lignes,
              }),
            }
          );

        setCommandeCreee(
          commande
        );

        const commandeId =
          commande?.id;

        if (!commandeId) {
          throw new Error(
            'La commande a été créée mais son identifiant est introuvable.'
          );
        }

        // =====================================================
        // GÉNÉRATION FACTURE
        // =====================================================
        const facture =
          await fetchJson(
            `${API_BASE_URL}/commandes/${commandeId}/generer-facture/`,
            {
              method: 'POST',
              body: JSON.stringify(
                {}
              ),
            }
          );

      setFactureGeneree(
          facture?.facture ||
            facture
        );

        setSuccessMessage(
          'Commande enregistrée et facture générée avec succès.'
        );

        if (onFactureGeneree) {
          setTimeout(() => {
            onFactureGeneree(
              facture?.facture || facture
            );
          }, 1500);
        }
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            'Erreur lors de la génération de la facture.'
        );
      } finally {
        setGenerationFactureLoading(
          false
        );
      }
    };

  // =========================================================
  // NOUVELLE COMMANDE
  // =========================================================
  const nouvelleCommande =
    () => {
      setEtape(1);

      setClientSelectionne(
        null
      );

      setServiceSelectionne(
        null
      );

      setTarifSelectionne(
        null
      );

      setTarifs([]);

      setDateDebut('');
      setDateFin('');

      setHeuresParDate({});
      setHeureTemporaire({});

      setObservationCommande(
        ''
      );

      setCommandeCreee(null);
      setFactureGeneree(null);

      setError('');
      setSuccessMessage('');

      setInterfaceClient(
        'liste'
      );
    };

  // =========================================================
  // IMPRESSION FACTURE
  // =========================================================
  const imprimerFactureEtape3 =
    () => {
      window.print();
    };

  // =========================================================
  // PASSER À L'ÉTAPE 3
  // =========================================================
  const passerFacture = () => {
    validerEtape2();
  };

  // =========================================================
  // RENDU
  // =========================================================
  return (
    <div
      style={{
        minHeight:
          'calc(100vh - 90px)',
        backgroundColor:
          couleurs.fond,
        padding:
          '35px 45px 55px',
        color:
          couleurs.texte,
      }}
    >
      {/* =====================================================
          TITRE
      ====================================================== */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '30px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '38px',
            fontWeight: 800,
            color:
              couleurs.vert,
          }}
        >
          Commande
        </h1>
      </div>

      {/* =====================================================
          STEPPER
      ====================================================== */}
      <div
        style={{
          maxWidth: '1200px',
          margin:
            '0 auto 30px',
          backgroundColor:
            couleurs.carte,
          border: `1px solid ${couleurs.bordure}`,
          borderRadius: '12px',
          padding:
            '20px 30px',
          display: 'flex',
          alignItems:
            'center',
        }}
      >
        {/* ÉTAPE 1 */}
        <div
          style={{
            display: 'flex',
            alignItems:
              'center',
            gap: '10px',
            color:
              couleurs.vert,
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius:
                '50%',
              backgroundColor:
                couleurs.vert,
              color: '#FFFFFF',
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              fontWeight: 800,
              fontSize: '17px',
            }}
          >
            1
          </div>

          <strong>
            Client
          </strong>
        </div>

        <div
          style={{
            flex: 1,
            height: '2px',
            backgroundColor:
              couleurs.bordure,
            margin:
              '0 25px',
          }}
        />

        {/* ÉTAPE 2 */}
        <div
          style={{
            display: 'flex',
            alignItems:
              'center',
            gap: '10px',
            color:
              etape >= 2
                ? couleurs.vert
                : couleurs.texteSecondaire,
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius:
                '50%',
              backgroundColor:
                etape >= 2
                  ? couleurs.vert
                  : couleurs.bordure,
              color:
                etape >= 2
                  ? '#FFFFFF'
                  : couleurs.texteSecondaire,
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              fontWeight: 800,
              fontSize: '17px',
            }}
          >
            2
          </div>

          <strong>
            Service + Tarif
          </strong>
        </div>

        <div
          style={{
            flex: 1,
            height: '2px',
            backgroundColor:
              couleurs.bordure,
            margin:
              '0 25px',
          }}
        />

        {/* ÉTAPE 3 */}
        <div
          style={{
            display: 'flex',
            alignItems:
              'center',
            gap: '10px',
            color:
              etape >= 3
                ? couleurs.vert
                : couleurs.texteSecondaire,
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius:
                '50%',
              backgroundColor:
                etape >= 3
                  ? couleurs.vert
                  : couleurs.bordure,
              color:
                etape >= 3
                  ? '#FFFFFF'
                  : couleurs.texteSecondaire,
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              fontWeight: 800,
              fontSize: '17px',
            }}
          >
            3
          </div>

          <strong>
            Facture
          </strong>
        </div>
      </div>

      {/* =====================================================
          MESSAGES
      ====================================================== */}
      {error && (
        <div
          style={{
            maxWidth: '1200px',
            margin:
              '0 auto 20px',
            backgroundColor:
              darkMode
                ? '#451A1A'
                : '#FEF2F2',
            border:
              '1px solid #FECACA',
            color:
              couleurs.rouge,
            padding:
              '14px 18px',
            borderRadius: '8px',
            fontSize: '15px',
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            maxWidth: '1200px',
            margin:
              '0 auto 20px',
            backgroundColor:
              darkMode
                ? '#19352C'
                : '#F0FDF4',
            border: `1px solid ${couleurs.bordure}`,
            color:
              couleurs.texte,
            padding:
              '14px 18px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* =====================================================
          ÉTAPE 1 : CLIENT
          INONA NO NOTELOINA?
          TSY NISY.
      ====================================================== */}
      {etape === 1 && (
        <>
          {/* =================================================
              LISTE CLIENT
          ================================================== */}
          {interfaceClient ===
            'liste' && (
            <>
              <div
                style={{
                  maxWidth:
                    '1200px',
                  margin: '0 auto',
                  backgroundColor:
                    couleurs.carte,
                  border: `1px solid ${couleurs.bordure}`,
                  borderRadius:
                    '14px',
                  padding: '30px',
                  boxShadow:
                    darkMode
                      ? 'none'
                      : '0 4px 18px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    marginBottom:
                      '25px',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        '27px',
                      fontWeight:
                        800,
                    }}
                  >
                    Liste des
                    clients
                  </h2>

                  <button
                    type="button"
                    onClick={
                      ouvrirAjoutClient
                    }
                    style={{
                      border:
                        'none',
                      backgroundColor:
                        couleurs.vert,
                      color:
                        '#FFFFFF',
                      padding:
                        '13px 23px',
                      borderRadius:
                        '8px',
                      cursor:
                        'pointer',
                      fontWeight:
                        700,
                      fontSize:
                        '15px',
                    }}
                  >
                    + Ajouter un
                    client
                  </button>
                </div>

                <div
                  style={{
                    textAlign:
                      'center',
                    marginBottom:
                      '25px',
                    fontSize:
                      '20px',
                    fontWeight:
                      800,
                    color:
                      couleurs.texte,
                  }}
                >
                  {clients.length}{' '}
                  client
                  {clients.length >
                  1
                    ? 's'
                    : ''}
                </div>

                {loadingClients ? (
                  <div
                    style={{
                      textAlign:
                        'center',
                      padding:
                        '40px',
                      fontSize:
                        '17px',
                      color:
                        couleurs.texteSecondaire,
                    }}
                  >
                    Chargement
                    des clients...
                  </div>
                ) : clients.length ===
                  0 ? (
                  <div
                    style={{
                      textAlign:
                        'center',
                      padding:
                        '45px',
                      border: `1px dashed ${couleurs.bordure}`,
                      borderRadius:
                        '8px',
                      fontSize:
                        '16px',
                      color:
                        couleurs.texteSecondaire,
                    }}
                  >
                    Aucun client
                    enregistré.
                  </div>
                ) : (
                  <div
                    style={{
                      overflowX:
                        'auto',
                      border: `1px solid ${couleurs.bordure}`,
                      borderRadius:
                        '9px',
                    }}
                  >
                    <table
                      style={{
                        width:
                          '100%',
                        borderCollapse:
                          'collapse',
                        fontSize:
                          '15px',
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor:
                              couleurs.vert,
                            color:
                              '#FFFFFF',
                          }}
                        >
                          <th
                            style={{
                              padding:
                                '17px',
                              textAlign:
                                'left',
                            }}
                          >
                            Nom
                          </th>

                          <th
                            style={{
                              padding:
                                '17px',
                              textAlign:
                                'left',
                            }}
                          >
                            Téléphone
                          </th>

                          <th
                            style={{
                              padding:
                                '17px',
                              textAlign:
                                'left',
                            }}
                          >
                            Date de
                            création
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {clients.map(
                          (
                            client
                          ) => {
                            const id =
                              client.idClient ??
                              client.id;

                            const dateCreation =
                              client.dateCreation
                                ? new Date(
                                    client.dateCreation
                                  ).toLocaleDateString(
                                    'fr-FR'
                                  )
                                : '-';

                            const idSelectionne =
                              clientSelectionne
                                ? clientSelectionne.idClient ??
                                  clientSelectionne.id
                                : null;

                            const estSelectionne =
                              id ===
                              idSelectionne;

                            return (
                              <tr
                                key={
                                  id
                                }
                                onClick={() =>
                                  selectionnerClientListe(
                                    client
                                  )
                                }
                                onContextMenu={(
                                  event
                                ) =>
                                  ouvrirMenuContextuel(
                                    event,
                                    client
                                  )
                                }
                                style={{
                                  borderBottom: `1px solid ${couleurs.bordure}`,
                                  backgroundColor:
                                    estSelectionne
                                      ? couleurs.vertClair
                                      : 'transparent',
                                  cursor:
                                    'pointer',
                                  userSelect:
                                    'none',
                                }}
                              >
                                <td
                                  style={{
                                    padding:
                                      '17px',
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {client.nom ||
                                    '-'}
                                </td>

                                <td
                                  style={{
                                    padding:
                                      '17px',
                                  }}
                                >
                                  {client.telephone ||
                                    '-'}
                                </td>

                                <td
                                  style={{
                                    padding:
                                      '17px',
                                    color:
                                      couleurs.texteSecondaire,
                                  }}
                                >
                                  {
                                    dateCreation
                                  }
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {clientSelectionne && (
                  <div
                    style={{
                      marginTop:
                        '20px',
                      padding:
                        '15px 18px',
                      border: `1px solid ${couleurs.bordure}`,
                      borderRadius:
                        '8px',
                      backgroundColor:
                        couleurs.vertClair,
                      color:
                        couleurs.texte,
                      fontWeight:
                        700,
                    }}
                  >
                    Client
                    sélectionné :{' '}
                    <span
                      style={{
                        color:
                          couleurs.vert,
                      }}
                    >
                      {
                        clientSelectionne.nom
                      }
                    </span>
                    {' — '}
                    {
                      clientSelectionne.telephone ||
                      '-'
                    }
                  </div>
                )}
              </div>

              <div
                style={{
                  maxWidth:
                    '1200px',
                  margin:
                    '25px auto 0',
                  display:
                    'flex',
                  justifyContent:
                    'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={
                    passerAuService
                  }
                  disabled={
                    !clientSelectionne
                  }
                  style={{
                    border:
                      'none',
                    backgroundColor:
                      clientSelectionne
                        ? couleurs.vert
                        : '#9CA3AF',
                    color:
                      '#FFFFFF',
                    padding:
                      '13px 28px',
                    borderRadius:
                      '8px',
                    cursor:
                      clientSelectionne
                        ? 'pointer'
                        : 'not-allowed',
                    fontWeight:
                      700,
                    fontSize:
                      '16px',
                  }}
                >
                  Suivant →
                </button>
              </div>
            </>
          )}

          {/* =================================================
              AJOUT CLIENT
          ================================================== */}
          {interfaceClient ===
            'ajout' && (
            <div
              style={{
                maxWidth:
                  '900px',
                margin: '0 auto',
                backgroundColor:
                  couleurs.carte,
                border: `1px solid ${couleurs.bordure}`,
                borderRadius:
                  '14px',
                padding: '35px',
                boxShadow:
                  darkMode
                    ? 'none'
                    : '0 4px 18px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  textAlign:
                    'center',
                  marginBottom:
                    '30px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      '30px',
                    fontWeight:
                      800,
                    color:
                      couleurs.vert,
                  }}
                >
                  Ajouter un
                  client
                </h2>
              </div>

              <div
                style={{
                  marginBottom:
                    '30px',
                  position:
                    'relative',
                }}
              >
                <label
                  style={{
                    display:
                      'block',
                    marginBottom:
                      '9px',
                    fontWeight:
                      700,
                    fontSize:
                      '16px',
                  }}
                >
                  Client existant
                </label>

                <input
                     type="text"
                     value={rechercheClient}
                     onChange={gererRechercheClient}
                     placeholder="Écrire un nom ou un téléphone..."
                     autoFocus


                  style={{
                    width:
                      '100%',
                    boxSizing:
                      'border-box',
                    padding:
                      '14px 16px',
                    border: `1px solid ${couleurs.bordure}`,
                    borderRadius:
                      '8px',
                    backgroundColor:
                      darkMode
                        ? '#18181B'
                        : '#FFFFFF',
                    color:
                      couleurs.texte,
                    fontSize:
                      '16px',
                    outline:
                      'none',
                  }}
                />

                {rechercheClient.trim() !==
                  '' && (
                  <div
                    style={{
                      marginTop:
                        '6px',
                      border: `1px solid ${couleurs.bordure}`,
                      borderRadius:
                        '8px',
                      overflow:
                        'hidden',
                      backgroundColor:
                        couleurs.carte,
                    }}
                  >
                    {clientsCorrespondants.length ===
                    0 ? (
                      <div
                        style={{
                          padding:
                            '16px',
                          color:
                            couleurs.texteSecondaire,
                        }}
                      >
                        Aucun client
                        correspondant.
                      </div>
                    ) : (
                      clientsCorrespondants.map(
                        (
                          client
                        ) => {
                          const id =
                            client.idClient ??
                            client.id;

                          return (
                            <div
                              key={
                                id
                              }
                              style={{
                                display:
                                  'flex',
                                justifyContent:
                                  'space-between',
                                alignItems:
                                  'center',
                                padding:
                                  '14px 16px',
                                borderBottom: `1px solid ${couleurs.bordure}`,
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontWeight:
                                      700,
                                    fontSize:
                                      '15px',
                                  }}
                                >
                                  {
                                    client.nom
                                  }
                                </div>

                                <div
                                  style={{
                                    marginTop:
                                      '3px',
                                    color:
                                      couleurs.texteSecondaire,
                                    fontSize:
                                      '14px',
                                  }}
                                >
                                  {
                                    client.telephone ||
                                    '-'
                                  }
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  selectionnerClientRecherche(
                                    client
                                  )
                                }
                                style={{
                                  border: `1px solid ${couleurs.bordure}`,
                                  backgroundColor:
                                    'transparent',
                                  color:
                                    couleurs.vert,
                                  padding:
                                    '9px 16px',
                                  borderRadius:
                                    '7px',
                                  cursor:
                                    'pointer',
                                  fontWeight:
                                    700,
                                  fontSize:
                                    '14px',
                                }}
                              >
                                Sélectionner
                              </button>
                            </div>
                          );
                        }
                      )
                    )}
                  </div>
                )}
              </div>

              <form
                onSubmit={
                  ajouterClient
                }
              >
                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '22px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        display:
                          'block',
                        marginBottom:
                          '9px',
                        fontWeight:
                          700,
                        fontSize:
                          '16px',
                      }}
                    >
                      Nom
                    </label>

                    <input
                       type="text"
                       value={nom}
                       onChange={gererNom}
                       placeholder="Nom du client"


                      
                      style={{
                        width:
                          '100%',
                        boxSizing:
                          'border-box',
                        padding:
                          '14px 16px',
                        border: `1px solid ${couleurs.bordure}`,
                        borderRadius:
                          '8px',
                        backgroundColor:
                          darkMode
                            ? '#18181B'
                            : '#FFFFFF',
                        color:
                          couleurs.texte,
                        fontSize:
                          '16px',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display:
                          'block',
                        marginBottom:
                          '9px',
                        fontWeight:
                          700,
                        fontSize:
                          '16px',
                      }}
                    >
                      Téléphone
                    </label>

                    <input
                        type="text"
                        value={telephone}
                        onChange={gererTelephone}
                        onKeyDown={bloquerClavierTelephone}
                        maxLength={MAX_TELEPHONE}
                         placeholder="Ex : 0341234567"
                      
                      style={{
                        width:
                          '100%',
                        boxSizing:
                          'border-box',
                        padding:
                          '14px 16px',
                        border: `1px solid ${couleurs.bordure}`,
                        borderRadius:
                          '8px',
                        backgroundColor:
                          darkMode
                            ? '#18181B'
                            : '#FFFFFF',
                        color:
                          couleurs.texte,
                        fontSize:
                          '16px',
                      }}
                    />

                    <div
                      style={{
                        marginTop:
                          '6px',
                        textAlign:
                          'right',
                        fontSize:
                          '12px',
                        color:
                          couleurs.texteSecondaire,
                      }}
                    >
                      {
                        telephone.length
                      }
                      /
                      {
                        MAX_TELEPHONE
                      }
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop:
                      '18px',
                    padding:
                      '13px 15px',
                    backgroundColor:
                      darkMode
                        ? '#222225'
                        : '#F7F9F8',
                    border: `1px solid ${couleurs.bordure}`,
                    borderRadius:
                      '7px',
                    color:
                      couleurs.texteSecondaire,
                    fontSize:
                      '14px',
                  }}
                >
                  Date de création :
                  automatique lors
                  de
                  l'enregistrement.
                </div>

                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    marginTop:
                      '30px',
                    paddingTop:
                      '22px',
                    borderTop: `1px solid ${couleurs.bordure}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      retournerListe
                    }
                    style={{
                      border: `1px solid ${couleurs.bordure}`,
                      backgroundColor:
                        'transparent',
                      color:
                        couleurs.texte,
                      padding:
                        '13px 23px',
                      borderRadius:
                        '8px',
                      cursor:
                        'pointer',
                      fontWeight:
                        700,
                    }}
                  >
                    ← Retour
                  </button>

                  <button
                    type="submit"
                    disabled={
                      ajoutLoading
                    }
                    style={{
                      border:
                        'none',
                      backgroundColor:
                        couleurs.vert,
                      color:
                        '#FFFFFF',
                      padding:
                        '13px 25px',
                      borderRadius:
                        '8px',
                      cursor:
                        ajoutLoading
                          ? 'not-allowed'
                          : 'pointer',
                      fontWeight:
                        700,
                      fontSize:
                        '15px',
                    }}
                  >
                    {ajoutLoading
                      ? 'Enregistrement...'
                      : 'Ajouter le client'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =================================================
              MODIFIER CLIENT
          ================================================== */}
          {interfaceClient ===
            'modifier' &&
            clientAction && (
              <div
                style={{
                  maxWidth:
                    '900px',
                  margin: '0 auto',
                  backgroundColor:
                    couleurs.carte,
                  border: `1px solid ${couleurs.bordure}`,
                  borderRadius:
                    '14px',
                  padding: '35px',
                }}
              >
                <div
                  style={{
                    textAlign:
                      'center',
                    marginBottom:
                      '30px',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        '30px',
                      fontWeight:
                        800,
                      color:
                        couleurs.vert,
                    }}
                  >
                    Modifier le
                    client
                  </h2>
                </div>

                <form
                  onSubmit={
                    enregistrerModification
                  }
                >
                  <div
                    style={{
                      display:
                        'grid',
                      gridTemplateColumns:
                        '1fr 1fr',
                      gap: '22px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display:
                            'block',
                          marginBottom:
                            '9px',
                          fontWeight:
                            700,
                        }}
                      >
                        Nom
                      </label>

                      <input
                        type="text"
                        value={nom}
                        onChange={(
                          event
                        ) =>
                          setNom(
                            event.target
                              .value
                          )
                        }
                        style={{
                          width:
                            '100%',
                          boxSizing:
                            'border-box',
                          padding:
                            '14px 16px',
                          border: `1px solid ${couleurs.bordure}`,
                          borderRadius:
                            '8px',
                          backgroundColor:
                            darkMode
                              ? '#18181B'
                              : '#FFFFFF',
                          color:
                            couleurs.texte,
                          fontSize:
                            '16px',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display:
                            'block',
                          marginBottom:
                            '9px',
                          fontWeight:
                            700,
                        }}
                      >
                        Téléphone
                      </label>

                      <input
                        type="text"
                        value={
                          telephone
                        }
                        onChange={
                          gererTelephone
                        }
                        onKeyDown={
                          bloquerClavierTelephone
                        }
                        maxLength={
                          MAX_TELEPHONE
                        }
                        placeholder="Ex : 0341234567"
                        style={{
                          width:
                            '100%',
                          boxSizing:
                            'border-box',
                          padding:
                            '14px 16px',
                          border: `1px solid ${couleurs.bordure}`,
                          borderRadius:
                            '8px',
                          backgroundColor:
                            darkMode
                              ? '#18181B'
                              : '#FFFFFF',
                          color:
                            couleurs.texte,
                          fontSize:
                            '16px',
                        }}
                      />

                      <div
                        style={{
                          marginTop:
                            '6px',
                          textAlign:
                            'right',
                          fontSize:
                            '12px',
                          color:
                            couleurs.texteSecondaire,
                        }}
                      >
                        {
                          telephone.length
                        }
                        /
                        {
                          MAX_TELEPHONE
                        }
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      marginTop:
                        '30px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={
                        retournerListe
                      }
                      style={{
                        border: `1px solid ${couleurs.bordure}`,
                        backgroundColor:
                          'transparent',
                        color:
                          couleurs.texte,
                        padding:
                          '13px 23px',
                        borderRadius:
                          '8px',
                        cursor:
                          'pointer',
                        fontWeight:
                          700,
                      }}
                    >
                      ← Retour
                    </button>

                    <button
                      type="submit"
                      style={{
                        border:
                          'none',
                        backgroundColor:
                          couleurs.vert,
                        color:
                          '#FFFFFF',
                        padding:
                          '13px 25px',
                        borderRadius:
                          '8px',
                        cursor:
                          'pointer',
                        fontWeight:
                          700,
                      }}
                    >
                      Enregistrer les
                      modifications
                    </button>
                  </div>
                </form>
              </div>
            )}

          {/* =================================================
              DÉTAILS CLIENT
          ================================================== */}
          {interfaceClient ===
            'details' &&
            clientAction && (
              <div
                style={{
                  maxWidth:
                    '900px',
                  margin: '0 auto',
                  backgroundColor:
                    couleurs.carte,
                  border: `1px solid ${couleurs.bordure}`,
                  borderRadius:
                    '14px',
                  padding: '35px',
                }}
              >
                <div
                  style={{
                    textAlign:
                      'center',
                    marginBottom:
                      '30px',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        '30px',
                      fontWeight:
                        800,
                      color:
                        couleurs.vert,
                    }}
                  >
                    Détails du
                    client
                  </h2>
                </div>

                <div
                  style={{
                    border: `1px solid ${couleurs.bordure}`,
                    borderRadius:
                      '10px',
                    overflow:
                      'hidden',
                  }}
                >
                  <div
                    style={{
                      padding:
                        '18px 20px',
                      borderBottom: `1px solid ${couleurs.bordure}`,
                    }}
                  >
                    <strong>
                      Nom :
                    </strong>{' '}
                    {clientAction.nom ||
                      '-'}
                  </div>

                  <div
                    style={{
                      padding:
                        '18px 20px',
                      borderBottom: `1px solid ${couleurs.bordure}`,
                    }}
                  >
                    <strong>
                      Téléphone :
                    </strong>{' '}
                    {clientAction.telephone ||
                      '-'}
                  </div>

                  <div
                    style={{
                      padding:
                        '18px 20px',
                    }}
                  >
                    <strong>
                      Date de
                      création :
                    </strong>{' '}
                    {clientAction.dateCreation
                      ? new Date(
                          clientAction.dateCreation
                        ).toLocaleString(
                          'fr-FR'
                        )
                      : 'Non renseignée'}
                  </div>
                </div>

                <div
                  style={{
                    marginTop:
                      '30px',
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      retournerListe
                    }
                    style={{
                      border: `1px solid ${couleurs.bordure}`,
                      backgroundColor:
                        'transparent',
                      color:
                        couleurs.texte,
                      padding:
                        '13px 23px',
                      borderRadius:
                        '8px',
                      cursor:
                        'pointer',
                      fontWeight:
                        700,
                    }}
                  >
                    ← Retour
                  </button>
                </div>
              </div>
            )}
        </>
      )}

      {/* =====================================================
          ÉTAPE 2 : SERVICE + TARIF + DATES + HEURES
      ====================================================== */}
      {etape === 2 && (
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            backgroundColor:
              couleurs.carte,
            border: `1px solid ${couleurs.bordure}`,
            borderRadius: '14px',
            padding: '35px',
          }}
        >
          <h2
            style={{
              textAlign: 'center',
              marginTop: 0,
              fontSize: '30px',
              color:
                couleurs.vert,
            }}
          >
            Service + Tarif
          </h2>

          {/* CLIENT */}
          {clientSelectionne && (
            <div
              style={{
                marginBottom:
                  '25px',
                padding: '16px',
                backgroundColor:
                  darkMode
                    ? '#222225'
                    : '#F7F9F8',
                border: `1px solid ${couleurs.bordure}`,
                borderRadius:
                  '8px',
              }}
            >
              <strong>
                Client :
              </strong>{' '}
              {clientSelectionne.nom}{' '}
              —{' '}
              {clientSelectionne.telephone ||
                '-'}
            </div>
          )}

          {/* =================================================
              SERVICE + TARIF
          ================================================== */}
          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: '20px',
            }}
          >
            {/* SERVICE */}
            <div>
              <label
                style={{
                  display:
                    'block',
                  marginBottom:
                    '8px',
                  fontWeight:
                    700,
                  fontSize:
                    '16px',
                }}
              >
                Service
              </label>

              <select
                value={
                  serviceSelectionne
                    ? serviceSelectionne.idService ??
                      serviceSelectionne.id
                    : ''
                }
                onChange={(
                  event
                ) => {
                  const valeur =
                    event.target
                      .value;

                  const service =
                    services.find(
                      (element) =>
                        String(
                          element.idService ??
                            element.id
                        ) ===
                        String(
                          valeur
                        )
                    );

                  setServiceSelectionne(
                    service ||
                      null
                  );

                  // Dès qu'on change de service,
                  // l'ancien tarif ne doit plus rester.
                  setTarifSelectionne(
                    null
                  );

                  setTarifs([]);

                  setError('');
                }}
                disabled={
                  loadingServices
                }
                style={{
                  width:
                    '100%',
                  boxSizing:
                    'border-box',
                  padding:
                    '14px 15px',
                  borderRadius:
                    '8px',
                  border: `1px solid ${couleurs.bordure}`,
                  backgroundColor:
                    couleurs.carte,
                  color:
                    couleurs.texte,
                  fontSize:
                    '16px',
                  fontWeight:
                    600,
                  cursor:
                    loadingServices
                      ? 'wait'
                      : 'pointer',
                }}
              >
                <option value="">
                  {loadingServices
                    ? 'Chargement des services...'
                    : services.length ===
                      0
                    ? 'Aucun service disponible'
                    : 'Sélectionner un service'}
                </option>

                {services.map(
                  (service) => {
                    const serviceId =
                      service.idService ??
                      service.id;

                    return (
                      <option
                        key={
                          serviceId
                        }
                        value={
                          serviceId
                        }
                      >
                        {service.nomService ||
                          service.nom ||
                          `Service ${serviceId}`}
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            {/* TARIF */}
            <div>
              <label
                style={{
                  display:
                    'block',
                  marginBottom:
                    '8px',
                  fontWeight:
                    700,
                  fontSize:
                    '16px',
                }}
              >
                Tarif
              </label>

              <select
                value={
                  tarifSelectionne
                    ? tarifSelectionne.idTarif ??
                      tarifSelectionne.id
                    : ''
                }
                onChange={(
                  event
                ) => {
                  const tarif =
                    tarifs.find(
                      (element) =>
                        String(
                          element.idTarif ??
                            element.id
                        ) ===
                        String(
                          event.target
                            .value
                        )
                    );

                  setTarifSelectionne(
                    tarif ||
                      null
                  );

                  setError('');
                }}
                disabled={
                  !serviceSelectionne ||
                  loadingTarifs
                }
                style={{
                  width:
                    '100%',
                  boxSizing:
                    'border-box',
                  padding:
                    '14px 15px',
                  borderRadius:
                    '8px',
                  border: `1px solid ${couleurs.bordure}`,
                  backgroundColor:
                    couleurs.carte,
                  color:
                    couleurs.texte,
                  fontSize:
                    '16px',
                  fontWeight:
                    600,
                  cursor:
                    !serviceSelectionne ||
                    loadingTarifs
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                <option value="">
                  {!serviceSelectionne
                    ? 'Sélectionner d’abord un service'
                    : loadingTarifs
                    ? 'Chargement des tarifs...'
                    : tarifs.length ===
                      0
                    ? 'Aucun tarif pour ce service'
                    : 'Sélectionner un tarif'}
                </option>

                {tarifs.map(
                  (tarif) => {
                    const tarifId =
                      tarif.idTarif ??
                      tarif.id;

                    const prix =
                      Number(
                        tarif.prix ??
                          tarif.prixUnitaire ??
                          tarif.tarifBase ??
                          0
                      );

                    return (
                      <option
                        key={
                          tarifId
                        }
                        value={
                          tarifId
                        }
                      >
                        {tarif.libelle ||
                          tarif.nomTarif ||
                          'Tarif'}{' '}
                        —{' '}
                        {prix.toLocaleString(
                          'fr-FR'
                        )}{' '}
                        Ar
                      </option>
                    );
                  }
                )}
              </select>
            </div>
          </div>

          {/* =================================================
              PRIX UNITAIRE
          ================================================== */}
          {tarifSelectionne && (
            <div
              style={{
                marginTop:
                  '20px',
                padding:
                  '14px 16px',
                backgroundColor:
                  couleurs.vertClair,
                border: `1px solid ${couleurs.bordure}`,
                borderRadius:
                  '8px',
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
              }}
            >
              <strong>
                Prix unitaire
              </strong>

              <strong
                style={{
                  fontSize:
                    '18px',
                  color:
                    couleurs.vert,
                }}
              >
                {prixUnitaire.toLocaleString(
                  'fr-FR'
                )}{' '}
                Ar
              </strong>
            </div>
          )}

          {/* =================================================
              PÉRIODE
          ================================================== */}
          <div
            style={{
              marginTop:
                '30px',
            }}
          >
            <h3
              style={{
                marginBottom:
                  '15px',
                fontSize:
                  '20px',
              }}
            >
              Période de diffusion
            </h3>

            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: '20px',
              }}
            >
              {/* DATE DÉBUT */}
              <div>
                <label
                  style={{
                    display:
                      'block',
                    marginBottom:
                      '8px',
                    fontWeight:
                      700,
                  }}
                >
                  Date début
                </label>

                <input
                  type="date"
                  value={
                    dateDebut
                  }
                  onChange={(
                    event
                  ) => {
                    setDateDebut(
                      event.target
                        .value
                    );
                    setError('');
                  }}
                  style={{
                    width:
                      '100%',
                    boxSizing:
                      'border-box',
                    padding:
                      '14px',
                    borderRadius:
                      '8px',
                    border: `1px solid ${couleurs.bordure}`,
                    backgroundColor:
                      couleurs.carte,
                    color:
                      couleurs.texte,
                    fontSize:
                      '16px',
                    fontWeight:
                      700,
                  }}
                />
              </div>

              {/* DATE FIN */}
              <div>
                <label
                  style={{
                    display:
                      'block',
                    marginBottom:
                      '8px',
                    fontWeight:
                      700,
                  }}
                >
                  Date fin
                </label>

                <input
                  type="date"
                  min={
                    dateDebut ||
                    undefined
                  }
                  value={
                    dateFin
                  }
                  onChange={(
                    event
                  ) => {
                    setDateFin(
                      event.target
                        .value
                    );
                    setError('');
                  }}
                  style={{
                    width:
                      '100%',
                    boxSizing:
                      'border-box',
                    padding:
                      '14px',
                    borderRadius:
                      '8px',
                    border: `1px solid ${couleurs.bordure}`,
                    backgroundColor:
                      couleurs.carte,
                    color:
                      couleurs.texte,
                    fontSize:
                      '16px',
                    fontWeight:
                      700,
                  }}
                />
              </div>
            </div>
          </div>

          {/* =================================================
              HEURES DE DIFFUSION
          ================================================== */}
          {datesCommande.length >
            0 && (
            <div
              style={{
                marginTop:
                  '30px',
              }}
            >
              <h3
                style={{
                  marginBottom:
                    '15px',
                  fontSize:
                    '20px',
                }}
              >
                Heures de diffusion
              </h3>

              <div
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap: '14px',
                }}
              >
                {datesCommande.map(
                  (date) => {
                    const heures =
                      heuresParDate[
                        date
                      ] || [];

                    return (
                      <div
                        key={
                          date
                        }
                        style={{
                          padding:
                            '18px',
                          border: `1px solid ${couleurs.bordure}`,
                          borderRadius:
                            '10px',
                          backgroundColor:
                            darkMode
                              ? '#202023'
                              : '#FAFCFB',
                        }}
                      >
                        {/* DATE */}
                        <div
                          style={{
                            fontWeight:
                              800,
                            fontSize:
                              '17px',
                            marginBottom:
                              '13px',
                          }}
                        >
                          {formaterDateLocale(
                            date
                          )}
                        </div>

                        {/* AJOUT HEURE */}
                        <div
                          style={{
                            display:
                              'flex',
                            gap: '10px',
                            alignItems:
                              'center',
                            flexWrap:
                              'wrap',
                          }}
                        >
                          <input
                            type="time"
                            value={
                              heureTemporaire[
                                date
                              ] ||
                              ''
                            }
                            onChange={(
                              event
                            ) =>
                              setHeureTemporaire(
                                (
                                  ancien
                                ) => ({
                                  ...ancien,
                                  [date]:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            style={{
                              padding:
                                '12px',
                              borderRadius:
                                '8px',
                              border: `1px solid ${couleurs.bordure}`,
                              backgroundColor:
                                '#FFFFFF',
                              color:
                                '#1F2937',
                              fontSize:
                                '17px',
                              fontWeight:
                                600,
                            }}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              ajouterHeure(
                                date
                              )
                            }
                            style={{
                              border:
                                'none',
                              backgroundColor:
                                couleurs.vert,
                              color:
                                '#FFFFFF',
                              padding:
                                '12px 18px',
                              borderRadius:
                                '8px',
                              cursor:
                                'pointer',
                              fontWeight:
                                700,
                              fontSize:
                                '15px',
                            }}
                          >
                            + Ajouter l’heure
                          </button>
                        </div>

                        {/* =================================================
                            HEURES DÉJÀ AJOUTÉES
                            HORIZONTAL
                        ================================================== */}
                        {heures.length >
                          0 && (
                          <div
                            style={{
                              display:
                                'flex',
                              flexDirection:
                                'row',
                              alignItems:
                                'center',
                              gap: '10px',
                              flexWrap:
                                'wrap',
                              marginTop:
                                '15px',
                            }}
                          >
                            {heures.map(
                              (
                                heure
                              ) => (
                                <div
                                  key={
                                    heure
                                  }
                                  style={{
                                    display:
                                      'inline-flex',
                                    alignItems:
                                      'center',
                                    gap: '8px',
                                    padding:
                                      '9px 12px',
                                    borderRadius:
                                      '8px',
                                    backgroundColor:
                                      '#FFFFFF',
                                    border: `1px solid ${couleurs.bordure}`,
                                    color:
                                      '#1F2937',
                                    fontWeight:
                                      700,
                                    fontSize:
                                      '16px',
                                    whiteSpace:
                                      'nowrap',
                                  }}
                                >
                                  <span>
                                    {heure}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      supprimerHeure(
                                        date,
                                        heure
                                      )
                                    }
                                    style={{
                                      border:
                                        'none',
                                      background:
                                        'transparent',
                                      color:
                                        couleurs.rouge,
                                      cursor:
                                        'pointer',
                                      fontWeight:
                                        900,
                                      fontSize:
                                        '19px',
                                      padding:
                                        '0',
                                      lineHeight:
                                        1,
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* =================================================
              OBSERVATION
          ================================================== */}
          <div
            style={{
              marginTop:
                '25px',
            }}
          >
            <label
              style={{
                display:
                  'block',
                marginBottom:
                  '8px',
                fontWeight:
                  700,
                fontSize:
                  '16px',
              }}
            >
              Observation
              (facultatif)
            </label>

            <textarea
              value={
                observationCommande
              }
              onChange={(
                event
              ) =>
                setObservationCommande(
                  event.target
                    .value
                )
              }
              rows="3"
              placeholder="Observation concernant la commande..."
              style={{
                width:
                  '100%',
                boxSizing:
                  'border-box',
                resize:
                  'vertical',
                padding:
                  '14px',
                borderRadius:
                  '8px',
                border: `1px solid ${couleurs.bordure}`,
                backgroundColor:
                  couleurs.carte,
                color:
                  couleurs.texte,
                fontSize:
                  '17px',
                lineHeight:
                  1.5,
              }}
            />
          </div>

          {/* =================================================
              MONTANT TOTAL
          ================================================== */}
          <div
            style={{
              marginTop:
                '25px',
              padding:
                '20px',
              borderRadius:
                '10px',
              backgroundColor:
                couleurs.vertClair,
              border: `1px solid ${couleurs.bordure}`,
              display:
                'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center',
              flexWrap:
                'wrap',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontSize:
                  '16px',
              }}
            >
              <strong>
                Nombre de
                diffusions :
              </strong>{' '}
              {nombreDiffusions}
            </div>

            <div
              style={{
                fontSize:
                  '21px',
                fontWeight:
                  900,
              }}
            >
              Montant total :{' '}
              {montantTotalEtape2.toLocaleString(
                'fr-FR'
              )}{' '}
              Ar
            </div>
          </div>

          {/* =================================================
              BOUTONS
          ================================================== */}
          <div
            style={{
              display:
                'flex',
              justifyContent:
                'space-between',
              marginTop:
                '30px',
              gap: '15px',
            }}
          >
            <button
              type="button"
              onClick={
                retourClient
              }
              style={{
                border: `1px solid ${couleurs.bordure}`,
                backgroundColor:
                  'transparent',
                color:
                  couleurs.texte,
                padding:
                  '13px 25px',
                borderRadius:
                  '8px',
                cursor:
                  'pointer',
                fontWeight:
                  700,
                fontSize:
                  '15px',
              }}
            >
              ← Précédent
            </button>

            <button
              type="button"
              onClick={
                passerFacture
              }
              style={{
                border:
                  'none',
                backgroundColor:
                  couleurs.vert,
                color:
                  '#FFFFFF',
                padding:
                  '13px 28px',
                borderRadius:
                  '8px',
                cursor:
                  'pointer',
                fontWeight:
                  700,
                fontSize:
                  '15px',
              }}
            >
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          ÉTAPE 3 : FACTURE
      ====================================================== */}
      {etape === 3 && (
        <div
          style={{
            maxWidth:
              '1200px',
            margin:
              '0 auto',
            backgroundColor:
              couleurs.carte,
            border: `1px solid ${couleurs.bordure}`,
            borderRadius:
              '14px',
            padding:
              '35px',
          }}
        >
          <h2
            style={{
              textAlign:
                'center',
              marginTop: 0,
              fontSize:
                '30px',
              color:
                couleurs.vert,
              marginBottom:
                '30px',
            }}
          >
            Facture
          </h2>

          {/* =================================================
              RÉCAPITULATIF CLIENT / SERVICE / TARIF
          ================================================== */}
          <div
            style={{
              padding:
                '20px',
              border: `1px solid ${couleurs.bordure}`,
              borderRadius:
                '10px',
              marginBottom:
                '25px',
            }}
          >
            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap:
                  '15px 25px',
                fontSize:
                  '16px',
              }}
            >
              <div>
                <strong>
                  Client :
                </strong>{' '}
                {clientSelectionne?.nom ||
                  '-'}
              </div>

              <div>
                <strong>
                  Téléphone :
                </strong>{' '}
                {clientSelectionne?.telephone ||
                  '-'}
              </div>

              <div>
                <strong>
                  Service :
                </strong>{' '}
                {serviceSelectionne?.nomService ||
                  serviceSelectionne?.nom ||
                  '-'}
              </div>

              <div>
                <strong>
                  Tarif :
                </strong>{' '}
                {tarifSelectionne?.libelle ||
                  tarifSelectionne?.nomTarif ||
                  '-'}
              </div>

              <div>
                <strong>
                  Date début :
                </strong>{' '}
                {formaterDateLocale(
                  dateDebut
                )}
              </div>

              <div>
                <strong>
                  Date fin :
                </strong>{' '}
                {formaterDateLocale(
                  dateFin
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              DÉTAIL DES DIFFUSIONS
          ================================================== */}
          <div
            style={{
              overflowX:
                'auto',
            }}
          >
            <table
              style={{
                width:
                  '100%',
                borderCollapse:
                  'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor:
                      couleurs.vert,
                    color:
                      '#FFFFFF',
                  }}
                >
                  <th
                    style={{
                      textAlign:
                        'left',
                      padding:
                        '13px',
                    }}
                  >
                    Date
                  </th>

                  <th
                    style={{
                      textAlign:
                        'left',
                      padding:
                        '13px',
                    }}
                  >
                    Heures
                  </th>

                  <th
                    style={{
                      textAlign:
                        'right',
                      padding:
                        '13px',
                    }}
                  >
                    Nombre
                  </th>

                  <th
                    style={{
                      textAlign:
                        'right',
                      padding:
                        '13px',
                    }}
                  >
                    Montant
                  </th>
                </tr>
              </thead>

              <tbody>
                {datesCommande.map(
                  (date) => {
                    const heures =
                      heuresParDate[
                        date
                      ] || [];

                    if (
                      !heures.length
                    ) {
                      return null;
                    }

                    return (
                      <tr
                        key={
                          date
                        }
                      >
                        <td
                          style={{
                            padding:
                              '13px',
                            borderBottom: `1px solid ${couleurs.bordure}`,
                            fontWeight:
                              700,
                          }}
                        >
                          {formaterDateLocale(
                            date
                          )}
                        </td>

                        <td
                          style={{
                            padding:
                              '13px',
                            borderBottom: `1px solid ${couleurs.bordure}`,
                            fontWeight:
                              700,
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              flexWrap:
                                'wrap',
                              gap:
                                '7px',
                            }}
                          >
                            {heures.map(
                              (
                                heure
                              ) => (
                                <span
                                  key={
                                    heure
                                  }
                                  style={{
                                    backgroundColor:
                                      '#FFFFFF',
                                    color:
                                      '#1F2937',
                                    border: `1px solid ${couleurs.bordure}`,
                                    borderRadius:
                                      '6px',
                                    padding:
                                      '5px 9px',
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {
                                    heure
                                  }
                                </span>
                              )
                            )}
                          </div>
                        </td>

                        <td
                          style={{
                            padding:
                              '13px',
                            borderBottom: `1px solid ${couleurs.bordure}`,
                            textAlign:
                              'right',
                            fontWeight:
                              700,
                          }}
                        >
                          {
                            heures.length
                          }
                        </td>

                        <td
                          style={{
                            padding:
                              '13px',
                            borderBottom: `1px solid ${couleurs.bordure}`,
                            textAlign:
                              'right',
                            fontWeight:
                              700,
                          }}
                        >
                          {(
                            heures.length *
                            prixUnitaire
                          ).toLocaleString(
                            'fr-FR'
                          )}{' '}
                          Ar
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              TOTAL
          ================================================== */}
          <div
            style={{
              marginTop:
                '25px',
              padding:
                '20px',
              backgroundColor:
                couleurs.vertClair,
              borderRadius:
                '10px',
              border: `1px solid ${couleurs.bordure}`,
              textAlign:
                'right',
            }}
          >
            <div
              style={{
                fontSize:
                  '16px',
                marginBottom:
                  '6px',
              }}
            >
              Prix unitaire :{' '}
              <strong>
                {prixUnitaire.toLocaleString(
                  'fr-FR'
                )}{' '}
                Ar
              </strong>
            </div>

            <div
              style={{
                fontSize:
                  '16px',
                marginBottom:
                  '6px',
              }}
            >
              Nombre de
              diffusions :{' '}
              <strong>
                {
                  nombreDiffusions
                }
              </strong>
            </div>

            <div
              style={{
                fontSize:
                  '24px',
                fontWeight:
                  900,
                marginTop:
                  '10px',
              }}
            >
              Total :{' '}
              {montantTotalEtape2.toLocaleString(
                'fr-FR'
              )}{' '}
              Ar
            </div>
          </div>

          {/* =================================================
              OBSERVATION
          ================================================== */}
          {observationCommande && (
            <div
              style={{
                marginTop:
                  '20px',
                padding:
                  '15px',
                border: `1px solid ${couleurs.bordure}`,
                borderRadius:
                  '8px',
              }}
            >
              <strong>
                Observation :
              </strong>{' '}
              {
                observationCommande
              }
            </div>
          )}

          {/* =================================================
              FACTURE GÉNÉRÉE
          ================================================== */}
          {factureGeneree && (
            <div
              style={{
                marginTop:
                  '25px',
                padding:
                  '22px',
                border:
                  `2px solid ${couleurs.vert}`,
                borderRadius:
                  '10px',
                backgroundColor:
                  darkMode
                    ? '#19352C'
                    : '#F0FDF4',
              }}
            >
              <h3
                style={{
                  marginTop:
                    0,
                  color:
                    couleurs.vert,
                  fontSize:
                    '22px',
                }}
              >
                Facture générée
              </h3>

              <div
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap:
                    '15px',
                  fontSize:
                    '16px',
                }}
              >
                <div>
                  <strong>
                    Numéro :
                  </strong>{' '}
                  {factureGeneree.numeroFacture ||
                    factureGeneree.numero ||
                    '-'}
                </div>

                <div>
                  <strong>
                    Date :
                  </strong>{' '}
                  {factureGeneree.dateFacture
                    ? new Date(
                        factureGeneree.dateFacture
                      ).toLocaleString(
                        'fr-FR'
                      )
                    : '-'}
                </div>

                <div>
                  <strong>
                    Montant :
                  </strong>{' '}
                  {Number(
                    factureGeneree.montantTotal ??
                      montantTotalEtape2
                  ).toLocaleString(
                    'fr-FR'
                  )}{' '}
                  Ar
                </div>

                <div>
                  <strong>
                    Statut :
                  </strong>{' '}
                  <span
                    style={{
                      color:
                        couleurs.vert,
                      fontWeight:
                        800,
                    }}
                  >
                    {factureGeneree.statut ||
                      'Générée'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =================================================
              BOUTONS ÉTAPE 3
          ================================================== */}
          <div
            style={{
              display:
                'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center',
              marginTop:
                '30px',
              gap: '12px',
              flexWrap:
                'wrap',
            }}
          >
            {/* RETOUR À ÉTAPE 2 */}
            {!factureGeneree && (
              <button
                type="button"
                onClick={() =>
                  setEtape(2)
                }
                style={{
                  border: `1px solid ${couleurs.bordure}`,
                  backgroundColor:
                    'transparent',
                  color:
                    couleurs.texte,
                  padding:
                    '13px 25px',
                  borderRadius:
                    '8px',
                  cursor:
                    'pointer',
                  fontWeight:
                    700,
                  fontSize:
                    '15px',
                }}
              >
                ← Précédent
              </button>
            )}

            {/* AVANT GÉNÉRATION */}
            {!factureGeneree ? (
              <button
                type="button"
                onClick={
                  genererFacture
                }
                disabled={
                  generationFactureLoading
                }
                style={{
                  marginLeft:
                    'auto',
                  border:
                    'none',
                  backgroundColor:
                    couleurs.vert,
                  color:
                    '#FFFFFF',
                  padding:
                    '14px 25px',
                  borderRadius:
                    '8px',
                  cursor:
                    generationFactureLoading
                      ? 'wait'
                      : 'pointer',
                  fontWeight:
                    800,
                  fontSize:
                    '16px',
                  opacity:
                    generationFactureLoading
                      ? 0.7
                      : 1,
                }}
              >
                {generationFactureLoading
                  ? 'Génération en cours...'
                  : 'Générer la facture'}
              </button>
            ) : (
              <>
                {/* IMPRIMER */}
                <button
                  type="button"
                  onClick={
                    imprimerFactureEtape3
                  }
                  style={{
                    border: `1px solid ${couleurs.bordure}`,
                    backgroundColor:
                      'transparent',
                    color:
                      couleurs.texte,
                    padding:
                      '13px 25px',
                    borderRadius:
                      '8px',
                    cursor:
                      'pointer',
                    fontWeight:
                      700,
                    fontSize:
                      '15px',
                  }}
                >
                  🖨 Imprimer
                </button>

                {/* NOUVELLE COMMANDE */}
                <button
                  type="button"
                  onClick={
                    nouvelleCommande
                  }
                  style={{
                    marginLeft:
                      'auto',
                    border:
                      'none',
                    backgroundColor:
                      couleurs.vert,
                    color:
                      '#FFFFFF',
                    padding:
                      '13px 25px',
                    borderRadius:
                      '8px',
                    cursor:
                      'pointer',
                    fontWeight:
                      800,
                    fontSize:
                      '15px',
                  }}
                >
                  Nouvelle commande
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          MENU CLIC DROIT
      ====================================================== */}
      {menuContextuel && (
        <div
          onClick={(event) =>
            event.stopPropagation()
          }
          style={{
            position:
              'fixed',
            top:
              menuContextuel.y,
            left:
              menuContextuel.x,
            width:
              '210px',
            backgroundColor:
              couleurs.carte,
            border: `1px solid ${couleurs.bordure}`,
            borderRadius:
              '9px',
            boxShadow:
              '0 8px 25px rgba(0,0,0,0.18)',
            zIndex:
              9999,
            overflow:
              'hidden',
          }}
        >
          <button
            type="button"
            onClick={() =>
              modifierClient(
                menuContextuel.client
              )
            }
            style={{
              width:
                '100%',
              border:
                'none',
              backgroundColor:
                'transparent',
              color:
                couleurs.texte,
              padding:
                '13px 16px',
              textAlign:
                'left',
              cursor:
                'pointer',
              fontSize:
                '15px',
              fontWeight:
                600,
            }}
          >
            Modifier
          </button>

          <button
            type="button"
            onClick={() =>
              supprimerClient(
                menuContextuel.client
              )
            }
            style={{
              width:
                '100%',
              border:
                'none',
              backgroundColor:
                'transparent',
              color:
                couleurs.texte,
              padding:
                '13px 16px',
              textAlign:
                'left',
              cursor:
                'pointer',
              fontSize:
                '15px',
              fontWeight:
                600,
            }}
          >
            Supprimer
          </button>

          <button
            type="button"
            onClick={() =>
              afficherDetails(
                menuContextuel.client
              )
            }
            style={{
              width:
                '100%',
              border:
                'none',
              backgroundColor:
                'transparent',
              color:
                couleurs.texte,
              padding:
                '13px 16px',
              textAlign:
                'left',
              cursor:
                'pointer',
              fontSize:
                '15px',
              fontWeight:
                600,
            }}
          >
            Détails
          </button>

          <div
            style={{
              height:
                '1px',
              backgroundColor:
                couleurs.bordure,
            }}
          />

          <button
            type="button"
            onClick={() =>
              faireCommande(
                menuContextuel.client
              )
            }
            style={{
              width:
                '100%',
              border:
                'none',
              backgroundColor:
                couleurs.vertClair,
              color:
                couleurs.vert,
              padding:
                '14px 16px',
              textAlign:
                'left',
              cursor:
                'pointer',
              fontSize:
                '15px',
              fontWeight:
                800,
            }}
          >
            Faire une
            commande
          </button>
        </div>
      )}
    </div>
  );
}

export default Commandes;