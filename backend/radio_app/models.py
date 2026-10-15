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
# PAD CONFIG
# ============================================================

class PadConfig(models.Model):
    idPadConfig = models.AutoField(primary_key=True)

    nomReseau = models.CharField(
        max_length=200,
        help_text="Nom du réseau (ex : onair, studio)"
    )

    dossier = models.CharField(
        max_length=200,
        help_text="Chemin partagé (ex : \\\\onair\\z)"
    )

    nomUtilisateur = models.CharField(
        max_length=200,
        help_text="Nom d'utilisateur réseau"
    )

    motDePasse = models.CharField(
        max_length=200,
        help_text="Mot de passe réseau"
    )

    dateCreation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pad_config'
        ordering = ['nomReseau']

    def __str__(self):
        return f"{self.nomReseau} ({self.dossier})"

# ============================================================
# FICHIER AUDIO
# ============================================================

class FichierAudio(models.Model):
    STATUT_CHOICES = [
        ('Disponible', 'Disponible'),
        ('Transféré', 'Transféré'),
        ('En attente', 'En attente'),
        ('Échec', 'Échec'),
        ('Archivé', 'Archivé'),
    ]

    PAD_MODE_CHOICES = [
        ('local', 'Local'),
        ('original', 'Original'),
    ]

    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name='fichiersAudio',
        db_column='idCommande',
    )

    # ═══ NOUVEAU : Configuration PAD ═══
    padMode = models.CharField(
        max_length=20,
        choices=PAD_MODE_CHOICES,
        default='local',
        help_text="Mode d'envoi : local ou original"
    )

    idPadConfig = models.ForeignKey(
        PadConfig,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fichiersAudio',
        db_column='idPadConfig',
        help_text="Configuration réseau utilisée (si padMode = original)"
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

    # ═══ NOUVEAU : Archive ═══
    dateEnvoiPAD = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Date du dernier envoi vers le PAD"
    )

    cheminArchive = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Chemin complet du fichier archivé"
    )

    dateArchive = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Date à laquelle le fichier a été archivé"
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
        r"""
        Transfert du fichier audio vers le PAD.

        Règles :
        - Copie UNIQUEMENT les diffusions de la SEMAINE EN COURS
          (Lundi → Dimanche)
        - Si 1 diffusion pour ce fichier un jour donné
          → copie directe : 5-ZOMA/fichier.m4a
        - Si 2+ diffusions pour ce fichier un même jour
          → sous-dossier par heure : 5-ZOMA/05h20/fichier.m4a
        """
        import os
        import shutil
        from collections import defaultdict
        from datetime import datetime, date as date_type, timedelta
        from django.conf import settings
        from django.utils import timezone

        # ═══ 1. Vérifier le fichier source ═══
        if (
            not self.cheminOrdinateur
            or not os.path.exists(self.cheminOrdinateur)
        ):
            self.statut = 'Échec'
            self.save(update_fields=['statut'])
            raise FileNotFoundError(
                f"Fichier introuvable : {self.cheminOrdinateur}"
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
                f"Format audio non supporté : {extension}"
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

        # ═══ 4. Récupérer les programmations de la commande ═══
        programmations = list(
            self.commande.programmations.all()
        ) if self.commande else []

        # ═══ 5. Grouper par date ═══
        par_date = defaultdict(list)
        for prog in programmations:
            if prog.dateDiffusion:
                par_date[prog.dateDiffusion].append(prog)

        # ═══ 6. Déterminer la SEMAINE EN COURS (Lundi → Dimanche) ═══
        aujourd_hui = date_type.today()

        # Alatsinainy = 0, Alahady = 6
        debut_semaine = aujourd_hui - timedelta(
            days=aujourd_hui.weekday()
        )
        fin_semaine = debut_semaine + timedelta(days=6)

        # ═══ 7. Filtrer les dates de la semaine ═══
        dates_semaine = [
            d for d in par_date.keys()
            if debut_semaine <= d <= fin_semaine
        ]
        dates_futures = [
            d for d in par_date.keys()
            if d > fin_semaine
        ]

        # ═══ Cas : Aucune diffusion cette semaine ═══
        if not dates_semaine:
            if dates_futures:
                self.statut = 'En attente'
                # ═══ Mettre à jour les Programmations ═══
                for prog in self.programmations.all():
                    if prog.statut in ('À venir', 'En attente', 'Envoyé au PAD'):
                        prog.statut = 'En attente'
                        prog.save(update_fields=['statut'])
            else:
                self.statut = 'Archivé'
                # ═══ Mettre à jour les Programmations ═══
                for prog in self.programmations.all():
                    if prog.statut in ('À venir', 'En attente', 'Envoyé au PAD'):
                        prog.statut = 'Archivé'
                        prog.dateTraitement = timezone.now()
                        prog.save(update_fields=['statut', 'dateTraitement'])
            self.save(update_fields=['statut'])
            return None

        # ═══ 8. Copier vers le PAD (Chronologique + FIFO) ═══
        chemins_envoyes = []

        try:
            # ═══ Récupérer TOUTES les programmations de la semaine ═══
            from radio_app.models import Programmation as Prog

            tous_prog = Prog.objects.filter(
                dateDiffusion__in=dates_semaine,
                fichierAudio__isnull=False,
            ).select_related('fichierAudio', 'commande')

            # ═══ Construire la liste avec toutes les infos ═══
            liste = []
            for p in tous_prog:
                liste.append({
                    'fichier_id': p.fichierAudio.id,
                    'fichier_nom': p.fichierAudio.nomFichier,
                    'date': p.dateDiffusion,
                    'heure': p.heureDiffusion,
                    'date_commande': (
                        p.commande.dateCommande
                        if p.commande else timezone.now()
                    ),
                })

            # ═══ Trier : par date → heure → date_commande (FIFO) ═══
            liste.sort(key=lambda x: (
                x['date'],
                x['heure'],
                x['date_commande'],
            ))

            # ═══ Traiter par jour ═══
            from itertools import groupby

            for date_diff, items_jour in groupby(
                liste, key=lambda x: x['date']
            ):
                items_jour = list(items_jour)

                jour_semaine = date_diff.weekday()
                dossier_jour = JOURS_DOSSIERS.get(
                    jour_semaine, '2-TALATA'
                )
                base_dir = os.path.join(
                    settings.PAD_LOCAL_PATH,
                    dossier_jour
                )

                # ═══ Grouper par heure ═══
                for heure, items_heure in groupby(
                    items_jour, key=lambda x: x['heure']
                ):
                    items_heure = list(items_heure)
                    heure_str = heure.strftime('%Hh%M')

                    # ═══ 1 seule diffusion à cette heure ═══
                    if len(items_heure) == 1:
                        item = items_heure[0]

                        # ═══ Ne traiter que CE fichier ═══
                        if item['fichier_id'] != self.id:
                            continue

                        os.makedirs(base_dir, exist_ok=True)

                        # Nom : heure_ + nom (pour tri chronologique)
                        nom_sortie = f"{heure_str}_{item['fichier_nom']}"
                        dest = os.path.join(base_dir, nom_sortie)

                        # Supprimer l'ancienne version si existe
                        for f in os.listdir(base_dir):
                            if f.endswith(item['fichier_nom']) and f != nom_sortie:
                                try:
                                    os.remove(os.path.join(base_dir, f))
                                except Exception:
                                    pass

                        shutil.copy2(self.cheminOrdinateur, dest)
                        chemins_envoyes.append(
                            f"{dossier_jour}/{nom_sortie}"
                        )

                    # ═══ 2+ diffusions à la même heure → FIFO ═══
                    else:
                        sous_dir = os.path.join(base_dir, heure_str)
                        os.makedirs(sous_dir, exist_ok=True)

                        for idx, item in enumerate(
                            items_heure, start=1
                        ):
                            # ═══ Ne traiter que CE fichier ═══
                            if item['fichier_id'] != self.id:
                                continue

                            prefix = f"{idx:02d}_"
                            nom_sortie = prefix + item['fichier_nom']
                            dest = os.path.join(sous_dir, nom_sortie)

                            # Supprimer l'ancienne version si existe
                            for f in os.listdir(sous_dir):
                                if f.endswith(item['fichier_nom']) and f != nom_sortie:
                                    try:
                                        os.remove(os.path.join(sous_dir, f))
                                    except Exception:
                                        pass

                            shutil.copy2(self.cheminOrdinateur, dest)
                            chemins_envoyes.append(
                                f"{dossier_jour}/{heure_str}/{nom_sortie}"
                            )

            # ═══ Mise à jour ═══
            self.cheminPAD = ', '.join(chemins_envoyes)
            self.dateEnvoiPAD = timezone.now()

            if dates_futures:
                self.statut = 'En attente'
            else:
                self.statut = 'Transféré'

            self.save(update_fields=[
                'cheminPAD', 'statut', 'dateEnvoiPAD'
            ])
         # ═══ Mise à jour des Programmations ═══
            for prog in self.programmations.all():
                if prog.statut in ('À venir', 'En attente', 'Envoyé au PAD'):
                    # Herinandro ankehitriny
                    if debut_semaine <= prog.dateDiffusion <= fin_semaine:
                        prog.statut = 'Envoyé au PAD'
                        prog.dateTransfert = timezone.now()
                        prog.save(update_fields=[
                            'statut', 'dateTransfert'
                        ])
                    # Herinandro manaraka
                    elif prog.dateDiffusion > fin_semaine:
                        prog.statut = 'En attente'
                        prog.save(update_fields=['statut'])

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
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
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

    # ═══ NOUVEAU : Données figées (indépendantes du Commande) ═══
    client_nom = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )
    client_telephone = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )
    service_nom = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )
    tarif_libelle = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )
    tarif_prix = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    dateDebut = models.DateField(blank=True, null=True)
    dateFin = models.DateField(blank=True, null=True)
    observation = models.TextField(blank=True, null=True)

    # Lignes de commande figées (JSON)
    lignes_json = models.TextField(
        blank=True,
        null=True,
        help_text="Lignes de commande en JSON (figées)"
    )

    class Meta:
        db_table = 'facture'
        ordering = ['-dateFacture']

    def __str__(self):
        return (
            f"{self.numeroFacture} - "
            f"{self.montantTotal} Ar"
        )