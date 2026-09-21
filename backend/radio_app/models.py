from django.db import models
from django.contrib.auth.models import AbstractUser


# ==========================================
# 1. UTILISATEUR
# ==========================================
class Utilisateur(AbstractUser):
    ROLE_CHOICES = [
        ('Accueil', 'Accueil'),
        ('Admin', 'Admin'),
        ('Technicien', 'Technicien'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='Accueil')

    class Meta:
        db_table = 'utilisateur'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.username} ({self.role})"


# ==========================================
# 2. CLIENT
# ==========================================
class Client(models.Model):
    nom = models.CharField(max_length=150)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    dateCreation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'client'
        ordering = ['-dateCreation']

    def __str__(self):
        return f"{self.nom} - {self.telephone}"


# ==========================================
# 3. SERVICE
# ==========================================
class Service(models.Model):
    nomService = models.CharField(max_length=150)
    typeService = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    modeTarification = models.CharField(max_length=50, blank=True, null=True)
    uniteFacturation = models.CharField(max_length=50, blank=True, null=True)
    statut = models.CharField(max_length=20, default='Actif')

    class Meta:
        db_table = 'service'
        ordering = ['id']

    def __str__(self):
        return self.nomService


# ==========================================
# 4. TARIF
# ==========================================
class Tarif(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='tarifs', db_column='idService')
    libelle = models.CharField(max_length=150)
    duree = models.IntegerField(default=0)
    unite = models.CharField(max_length=20, blank=True, null=True)
    prix = models.DecimalField(max_digits=12, decimal_places=2)
    statut = models.CharField(max_length=20, default='Actif')

    class Meta:
        db_table = 'tarif'
        ordering = ['service', 'prix']

    def __str__(self):
        return f"{self.service.nomService} - {self.libelle} ({self.prix} Ar)"


# ==========================================
# 5. COMMANDE
# ==========================================
class Commande(models.Model):
    STATUT_CHOICES = [
        ('En cours', 'En cours'),
        ('Validée', 'Validée'),
        ('Archivée', 'Archivée'),
        ('Annulée', 'Annulée'),
    ]
    client = models.ForeignKey(Client, on_delete=models.RESTRICT, related_name='commandes', db_column='idClient')
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.RESTRICT, related_name='commandes', db_column='idUtilisateur')
    dateCommande = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=50, choices=STATUT_CHOICES, default='En cours')
    observation = models.TextField(blank=True, null=True)
    montantTotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    class Meta:
        db_table = 'commande'
        ordering = ['-dateCommande']

    def __str__(self):
        return f"CMD-{self.id:04d} - {self.client.nom}"

    def calculerMontantTotal(self):
        total = sum(ligne.montant for ligne in self.lignes.all())
        self.montantTotal = total
        self.save(update_fields=['montantTotal'])
        return total

# ==========================================
# 6. LIGNE COMMANDE
# ==========================================
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

    # ==========================================
    # DATES ET HEURE DE DIFFUSION
    # ==========================================
    dateDebut = models.DateField(
        blank=True,
        null=True
    )

    dateFin = models.DateField(
        blank=True,
        null=True
    )

    heureDiffusion = models.TimeField(
        blank=True,
        null=True
    )

    class Meta:
        db_table = 'ligne_commande'
        ordering = ['id']

    def __str__(self):
        return f"Ligne {self.id} - {self.service.nomService}"

    def save(self, *args, **kwargs):
        self.montant = self.quantite * self.prixUnitaire
        super().save(*args, **kwargs)


# ==========================================
# 7. DOCUMENT
# ==========================================
class Document(models.Model):
    TYPE_CHOICES = [
        ('Papier', 'Document papier'),
        ('Numerique', 'Fichier numérique'),
    ]
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='documents', db_column='idCommande')
    typeDocument = models.CharField(max_length=50, choices=TYPE_CHOICES, default='Papier')
    designation = models.CharField(max_length=255, blank=True, null=True)
    observation = models.TextField(blank=True, null=True)
    fichier = models.FileField(upload_to='documents/', blank=True, null=True)
    dateCreation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document'
        ordering = ['-dateCreation']

    def __str__(self):
        return f"Doc {self.id} - {self.typeDocument}"


# ==========================================
# 8. FICHIER AUDIO
# ==========================================
class FichierAudio(models.Model):
    STATUT_CHOICES = [
        ('Disponible', 'Disponible'),
        ('Transféré', 'Transféré'),
        ('En attente', 'En attente'),
        ('Échec', 'Échec'),
    ]
    ligne = models.ForeignKey(LigneCommande, on_delete=models.CASCADE, related_name='fichiersAudio', db_column='idLigne')
    nomFichier = models.CharField(max_length=255)
    cheminOrdinateur = models.CharField(max_length=500, blank=True, null=True)
    cheminPAD = models.CharField(max_length=500, blank=True, null=True)
    format = models.CharField(max_length=10, default='mp3')
    taille = models.BigIntegerField(blank=True, null=True)
    duree = models.IntegerField(blank=True, null=True)
    dateCreation = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=50, choices=STATUT_CHOICES, default='Disponible')

    class Meta:
        db_table = 'fichier_audio'
        ordering = ['-dateCreation']

    def __str__(self):
        return f"{self.nomFichier} ({self.statut})"

    def envoyerVersPAD(self):
        """
        Transfère le fichier (déjà présent sur l'ordinateur, cf. cheminOrdinateur)
        vers le PAD, via SMB si PAD_SMB_ENABLED=True, sinon via une simple copie
        locale (mode développement/test).
        """
        import os
        import shutil
        from django.conf import settings

        if not self.cheminOrdinateur or not os.path.exists(self.cheminOrdinateur):
            self.statut = 'Échec'
            self.save(update_fields=['statut'])
            raise FileNotFoundError(
                f"Fichier introuvable sur l'ordinateur : {self.cheminOrdinateur}"
            )

        nom_fichier = os.path.basename(self.cheminOrdinateur)
        chemin_pad = f"/{nom_fichier}"

        try:
            if getattr(settings, 'PAD_SMB_ENABLED', False):
                # Nécessite le paquet "pysmb" (pip install pysmb)
                from smb.SMBConnection import SMBConnection

                conn = SMBConnection(
                    settings.PAD_SMB_USERNAME,
                    settings.PAD_SMB_PASSWORD,
                    'radio_tsiry_app',
                    settings.PAD_SMB_SERVER_NAME,
                    use_ntlm_v2=True,
                )
                conn.connect(settings.PAD_SMB_SERVER_IP, 445)

                with open(self.cheminOrdinateur, 'rb') as f:
                    conn.storeFile(settings.PAD_SMB_SHARE, chemin_pad, f)

                conn.close()
            else:
                os.makedirs(settings.PAD_LOCAL_PATH, exist_ok=True)
                shutil.copy(
                    self.cheminOrdinateur,
                    os.path.join(settings.PAD_LOCAL_PATH, nom_fichier),
                )

            self.cheminPAD = chemin_pad
            self.statut = 'Transféré'
            self.save(update_fields=['cheminPAD', 'statut'])

        except Exception:
            self.statut = 'Échec'
            self.save(update_fields=['statut'])
            raise

        return self.cheminPAD


# ==========================================
# 9. PROGRAMMATION
# ==========================================
class Programmation(models.Model):
    STATUT_CHOICES = [
        ('Programmé', 'Programmé'),
        ('Diffusé', 'Diffusé'),
        ('Expiré', 'Expiré'),
        ('Échec', 'Échec'),
    ]
    fichierAudio = models.ForeignKey(FichierAudio, on_delete=models.CASCADE, related_name='programmations', db_column='idFichierAudio')
    dateDiffusion = models.DateField()
    heureDiffusion = models.TimeField()
    ordreDiffusion = models.IntegerField(default=1)
    statut = models.CharField(max_length=50, choices=STATUT_CHOICES, default='Programmé')

    class Meta:
        db_table = 'programmation'
        ordering = ['dateDiffusion', 'heureDiffusion', 'ordreDiffusion']

    def __str__(self):
        return f"{self.dateDiffusion} {self.heureDiffusion} - {self.fichierAudio.nomFichier}"
# ==========================================
# 10. FACTURE
# ==========================================
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

    dateFacture = models.DateTimeField(
        auto_now_add=True
    )

    montantTotal = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    statut = models.CharField(
        max_length=50,
        default='Générée'
    )

    # ═══ CHAMPS VAOVAO ═══
    estArchive = models.BooleanField(
        default=False
    )

    dateSuppression = models.DateTimeField(
        blank=True,
        null=True
    )

    class Meta:
        db_table = 'facture'
        ordering = ['-dateFacture']

    def __str__(self):
        return f"{self.numeroFacture} - {self.montantTotal} Ar"