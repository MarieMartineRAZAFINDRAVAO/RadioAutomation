from django.db import models
from django.contrib.auth.models import AbstractUser


# ============================================================
# UTILISATEUR
# ============================================================

class Utilisateur(AbstractUser):
    ROLE_CHOICES = [
        ('Accueil', 'Accueil'),
        ('Admin', 'Admin'),
        ('Technicien', 'Technicien'),
    ]

    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        default='Accueil'
    )

    class Meta:
        db_table = 'utilisateur'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.username} ({self.role})"


# ============================================================
# CLIENT
# ============================================================

class Client(models.Model):
    nom = models.CharField(max_length=150)
    telephone = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )
    dateCreation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'client'
        ordering = ['-dateCreation']

    def __str__(self):
        return f"{self.nom} - {self.telephone}"


# ============================================================
# SERVICE
# ============================================================

class Service(models.Model):
    nomService = models.CharField(max_length=150)
    typeService = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    description = models.TextField(
        blank=True,
        null=True
    )
    modeTarification = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )
    uniteFacturation = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )
    statut = models.CharField(
        max_length=20,
        default='Actif'
    )

    class Meta:
        db_table = 'service'
        ordering = ['id']

    def __str__(self):
        return self.nomService


# ============================================================
# TARIF
# ============================================================

class Tarif(models.Model):
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='tarifs',
        db_column='idService'
    )
    libelle = models.CharField(max_length=150)
    duree = models.IntegerField(default=0)
    unite = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )
    prix = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    statut = models.CharField(
        max_length=20,
        default='Actif'
    )

    class Meta:
        db_table = 'tarif'
        ordering = ['service', 'prix']

    def __str__(self):
        return (
            f"{self.service.nomService} - "
            f"{self.libelle} ({self.prix} Ar)"
        )


# ============================================================
# COMMANDE
# ============================================================

class Commande(models.Model):
    STATUT_CHOICES = [
        ('En cours', 'En cours'),
        ('Validée', 'Validée'),
        ('Archivée', 'Archivée'),
        ('Annulée', 'Annulée'),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.RESTRICT,
        related_name='commandes',
        db_column='idClient'
    )

    utilisateur = models.ForeignKey(
        Utilisateur,
        on_delete=models.RESTRICT,
        related_name='commandes',
        db_column='idUtilisateur'
    )

    dateCommande = models.DateTimeField(auto_now_add=True)

    # ═══ PÉRIODE DE DIFFUSION ═══
    dateDebut = models.DateField(
        blank=True,
        null=True
    )

    dateFin = models.DateField(
        blank=True,
        null=True
    )

    statut = models.CharField(
        max_length=50,
        choices=STATUT_CHOICES,
        default='En cours'
    )

    observation = models.TextField(
        blank=True,
        null=True
    )

    montantTotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )

    class Meta:
        db_table = 'commande'
        ordering = ['-dateCommande']

    def __str__(self):
        return (
            f"CMD-{self.id:04d} - "
            f"{self.client.nom}"
        )

    def calculerMontantTotal(self):
        total = sum(
            ligne.montant
            for ligne in self.lignes.all()
        )

        self.montantTotal = total

        self.save(update_fields=['montantTotal'])

        return total


# ============================================================
# LIGNE COMMANDE
# ============================================================

class LigneCommande(models.Model):
    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name='lignes',
        db_column='idCommande'
    )

    service = models.ForeignKey(
        Service,
        on_delete=models.RESTRICT,
        related_name='lignes',
        db_column='idService'
    )

    tarif = models.ForeignKey(
        Tarif,
        on_delete=models.RESTRICT,
        related_name='lignes',
        db_column='idTarif'
    )

    designation = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    quantite = models.PositiveIntegerField(default=1)

    prixUnitaire = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )

    class Meta:
        db_table = 'ligne_commande'
        ordering = ['id']

    def __str__(self):
        return (
            f"Ligne {self.id} - "
            f"{self.service.nomService}"
        )

    def save(self, *args, **kwargs):
        self.montant = self.quantite * self.prixUnitaire
        super().save(*args, **kwargs)


# ============================================================
# DOCUMENT
# ============================================================

class Document(models.Model):
    TYPE_CHOICES = [
        ('Papier', 'Document papier'),
        ('Numerique', 'Fichier numérique'),
    ]

    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name='documents',
        db_column='idCommande'
    )

    typeDocument = models.CharField(
        max_length=50,
        choices=TYPE_CHOICES,
        default='Papier'
    )

    designation = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    observation = models.TextField(
        blank=True,
        null=True
    )

    fichier = models.FileField(
        upload_to='documents/',
        blank=True,
        null=True
    )

    dateCreation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document'
        ordering = ['-dateCreation']

    def __str__(self):
        return (
            f"Doc {self.id} - "
            f"{self.typeDocument}"
        )


# ============================================================
# FICHIER AUDIO
# ============================================================

class FichierAudio(models.Model):
    STATUT_CHOICES = [
        ('Disponible', 'Disponible'),
        ('Transféré', 'Transféré'),
        ('En attente', 'En attente'),
        ('Échec', 'Échec'),
    ]

    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name='fichiersAudio',
        db_column='idCommande',
    )

    nomFichier = models.CharField(max_length=255)

    cheminOrdinateur = models.CharField(
        max_length=500,
        blank=True,
        null=True
    )

    cheminPAD = models.CharField(
        max_length=500,
        blank=True,
        null=True
    )

    format = models.CharField(
        max_length=10,
        default='mp3'
    )

    taille = models.BigIntegerField(
        blank=True,
        null=True
    )

    duree = models.IntegerField(
        blank=True,
        null=True
    )

    dateCreation = models.DateTimeField(auto_now_add=True)

    statut = models.CharField(
        max_length=50,
        choices=STATUT_CHOICES,
        default='Disponible'
    )

    class Meta:
        db_table = 'fichier_audio'
        ordering = ['-dateCreation']

    def __str__(self):
        return (
            f"{self.nomFichier} "
            f"({self.statut})"
        )

    def envoyerVersPAD(self):
        """
        Transfert du fichier audio vers le PAD.

        - Mode LOCAL : copie vers D:\RadioAutomation\PAD-LOCAL
        - Mode SMB   : copie vers \\10.10.0.10\Z

        Le fichier est copié dans le dossier correspondant au
        jour de la semaine de CHAQUE diffusion (Programmation).
        """
        import os
        from datetime import datetime, date as date_type
        from django.conf import settings

        # ═══ 1. Vérifier le fichier source ═══
        if (
            not self.cheminOrdinateur
            or not os.path.exists(self.cheminOrdinateur)
        ):
            self.statut = 'Échec'
            self.save(update_fields=['statut'])
            raise FileNotFoundError(
                "Fichier introuvable sur "
                f"l'ordinateur : {self.cheminOrdinateur}"
            )

        nom_fichier = os.path.basename(self.cheminOrdinateur)

                # ═══ 2. Vérifier extension audio ═══
        extensions_audio = [
            '.mp3', '.wav', '.m4a', '.aac',
            '.ogg', '.flac', '.wma', '.opus',
            '.mp4', '.webm',
        ]
        extension = os.path.splitext(nom_fichier)[1].lower()

        if extension not in extensions_audio:
            self.statut = 'Échec'
            self.save(update_fields=['statut'])
            raise ValueError(
                f"Format audio non supporté : {extension}. "
                f"Formats acceptés : {', '.join(extensions_audio)}"
            )

        # ═══ 3. Mapping jours → dossiers PAD ═══
        JOURS_DOSSIERS = {
            0: '1-ALATSINAINY',   # Lundi
            1: '2-TALATA',        # Mardi
            2: '3-ALAROBIA',      # Mercredi
            3: '4-ALAKAMISY',     # Jeudi
            4: '5- ZOMA',         # Vendredi
            5: '6- SABOTSY',      # Samedi
            6: '0- ALAHADY',      # Dimanche
        }

        # ═══ 4. Récupérer toutes les dates de diffusion ═══
        programmations = (
            self.commande.programmations.all()
            if self.commande
            else []
        )

        # ═══ 5. INITIALISER dates_diffusion (AVANT le filtre) ═══
        dates_diffusion = []

        if programmations:
            vues = set()
            for prog in programmations:
                if prog.dateDiffusion and prog.dateDiffusion not in vues:
                    dates_diffusion.append(prog.dateDiffusion)
                    vues.add(prog.dateDiffusion)
        else:
            if self.commande and self.commande.dateDebut:
                dates_diffusion.append(self.commande.dateDebut)
            else:
                dates_diffusion.append(datetime.now().date())

        # ═══ 6. FILTRER : garder uniquement les dates ≤ aujourd'hui ═══
        aujourd_hui = date_type.today()

        dates_diffusion = [
            d for d in dates_diffusion
            if d <= aujourd_hui
        ]

        if not dates_diffusion:
            self.statut = 'En attente'
            self.save(update_fields=['statut'])
            raise ValueError(
                "Aucune diffusion à envoyer aujourd'hui. "
                "Les dates de diffusion sont dans le futur."
            )

        # ═══ 7. Envoyer vers chaque dossier correspondant ═══
        chemins_envoyes = []

        try:
            if getattr(settings, 'PAD_SMB_ENABLED', False):
                # ═══ Mode SMB2/SMB3 avec smbprotocol ═══
                import smbclient

                # Nettoyer le cache
                try:
                    smbclient.reset_connection_cache()
                except Exception:
                    pass

                # Enregistrer une nouvelle session SMB
                smbclient.register_session(
                    settings.PAD_SMB_SERVER_IP,
                    username=settings.PAD_SMB_USERNAME,
                    password=settings.PAD_SMB_PASSWORD,
                )

                for date_diffusion in dates_diffusion:
                    jour_semaine = date_diffusion.weekday()
                    dossier_jour = JOURS_DOSSIERS.get(jour_semaine, '2-TALATA')

                    # Chemin UNC Windows
                    chemin_unc = (
                        f"\\\\{settings.PAD_SMB_SERVER_IP}\\"
                        f"{settings.PAD_SMB_SHARE}\\"
                        f"{dossier_jour}\\"
                        f"{nom_fichier}"
                    )

                    # Copier le fichier via SMB
                    with open(self.cheminOrdinateur, 'rb') as src:
                        data = src.read()

                    with smbclient.open_file(chemin_unc, mode='wb') as dst:
                        dst.write(data)

                    chemins_envoyes.append(f"{dossier_jour}/{nom_fichier}")

            else:
                # ═══ Mode local (développement) ═══
                import shutil

                for date_diffusion in dates_diffusion:
                    jour_semaine = date_diffusion.weekday()
                    dossier_jour = JOURS_DOSSIERS.get(jour_semaine, '2-TALATA')

                    dossier_local = os.path.join(
                        settings.PAD_LOCAL_PATH,
                        dossier_jour
                    )
                    os.makedirs(dossier_local, exist_ok=True)

                    shutil.copy(
                        self.cheminOrdinateur,
                        os.path.join(dossier_local, nom_fichier)
                    )

                    chemins_envoyes.append(f"{dossier_jour}/{nom_fichier}")

            # ═══ Mise à jour ═══
            self.cheminPAD = ', '.join(chemins_envoyes)
            self.statut = 'Transféré'
            self.save(update_fields=['cheminPAD', 'statut'])

        except Exception as e:
            self.statut = 'Échec'
            self.save(update_fields=['statut'])
            raise e

        return self.cheminPAD


# ============================================================
# PROGRAMMATION
# ============================================================

class Programmation(models.Model):
    STATUT_CHOICES = [
        ('À venir', 'À venir'),
        ('À envoyer', 'À envoyer'),
        ('Transfert en cours', 'Transfert en cours'),
        ('Envoyé au PAD', 'Envoyé au PAD'),
        ('Échéance passée', 'Échéance passée'),
        ('Archivé', 'Archivé'),
        ('Échec', 'Échec'),
    ]

    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name='programmations',
        db_column='idCommande',
        null=True,
        blank=True
    )

    fichierAudio = models.ForeignKey(
        FichierAudio,
        on_delete=models.SET_NULL,
        related_name='programmations',
        db_column='idFichierAudio',
        null=True,
        blank=True
    )

    dateDiffusion = models.DateField()
    heureDiffusion = models.TimeField()
    ordreDiffusion = models.IntegerField(default=1)
    statut = models.CharField(
        max_length=50,
        choices=STATUT_CHOICES,
        default='À venir'
    )
    dateTransfert = models.DateTimeField(blank=True, null=True)
    dateTraitement = models.DateTimeField(blank=True, null=True)
    messageErreur = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'programmation'
        ordering = [
            'dateDiffusion',
            'heureDiffusion',
            'ordreDiffusion'
        ]

    def __str__(self):
        fichier_nom = (
            self.fichierAudio.nomFichier
            if self.fichierAudio
            else 'Sans fichier'
        )
        return (
            f"{self.dateDiffusion} "
            f"{self.heureDiffusion} - "
            f"{fichier_nom}"
        )


# ============================================================
# FACTURE
# ============================================================

class Facture(models.Model):
    commande = models.OneToOneField(
        Commande,
        on_delete=models.CASCADE,
        related_name='facture',
        db_column='idCommande'
    )

    numeroFacture = models.CharField(
        max_length=50,
        unique=True
    )

    dateFacture = models.DateTimeField(auto_now_add=True)

    montantTotal = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    statut = models.CharField(
        max_length=50,
        default='Générée'
    )

    estArchive = models.BooleanField(default=False)

    dateSuppression = models.DateTimeField(
        blank=True,
        null=True
    )

    class Meta:
        db_table = 'facture'
        ordering = ['-dateFacture']

    def __str__(self):
        return (
            f"{self.numeroFacture} - "
            f"{self.montantTotal} Ar"
        )