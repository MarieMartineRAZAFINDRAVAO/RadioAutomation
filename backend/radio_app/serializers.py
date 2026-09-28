from rest_framework import serializers
from .models import (
    Utilisateur, Client, Service, Tarif,
    Commande, LigneCommande, Document,
    FichierAudio, Programmation, Facture
)


# ==========================================
# UTILISATEUR
# ==========================================
class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role']


# ==========================================
# CLIENT
# ==========================================
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


# ==========================================
# SERVICE
# ==========================================
class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


# ==========================================
# TARIF
# ==========================================
class TarifSerializer(serializers.ModelSerializer):
    service_nom = serializers.CharField(
        source='service.nomService',
        read_only=True
    )

    class Meta:
        model = Tarif
        fields = '__all__'


# ==========================================
# PROGRAMMATION
# ==========================================
class ProgrammationSerializer(serializers.ModelSerializer):
    fichier_nom = serializers.CharField(
        source='fichierAudio.nomFichier',
        read_only=True
    )
    commande_nom = serializers.SerializerMethodField()
    client_nom = serializers.SerializerMethodField()

    class Meta:
        model = Programmation
        fields = '__all__'
        read_only_fields = ['commande']

    def get_commande_nom(self, obj):
        if obj.commande:
            return f"CMD-{obj.commande.id:04d}"
        if obj.fichierAudio and obj.fichierAudio.commande:
            return f"CMD-{obj.fichierAudio.commande.id:04d}"
        return None

    def get_client_nom(self, obj):
        if obj.commande and obj.commande.client:
            return obj.commande.client.nom
        if (
            obj.fichierAudio
            and obj.fichierAudio.commande
            and obj.fichierAudio.commande.client
        ):
            return obj.fichierAudio.commande.client.nom
        return None


# ==========================================
# LIGNE COMMANDE
# ==========================================
class LigneCommandeSerializer(serializers.ModelSerializer):
    service_nom = serializers.CharField(
        source='service.nomService',
        read_only=True
    )

    tarif_libelle = serializers.CharField(
        source='tarif.libelle',
        read_only=True
    )

    class Meta:
        model = LigneCommande
        fields = [
            'id',
            'commande',
            'service',
            'service_nom',
            'tarif',
            'tarif_libelle',
            'designation',
            'quantite',
            'prixUnitaire',
            'montant',
        ]

        read_only_fields = [
            'montant',
            'service_nom',
            'tarif_libelle',
            'commande',
        ]


# ==========================================
# COMMANDE
# ==========================================
class CommandeSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(
        source='client.nom',
        read_only=True
    )

    client_telephone = serializers.CharField(
        source='client.telephone',
        read_only=True
    )

    utilisateur_nom = serializers.CharField(
        source='utilisateur.username',
        read_only=True
    )

    lignes = LigneCommandeSerializer(
        many=True,
        required=False
    )

    programmations = ProgrammationSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Commande
        fields = [
            'id',
            'client',
            'client_nom',
            'client_telephone',
            'utilisateur',
            'utilisateur_nom',
            'dateCommande',
            'statut',
            'observation',
            'montantTotal',
            'dateDebut',
            'dateFin',
            'lignes',
            'programmations',
        ]

        read_only_fields = [
            'montantTotal',
            'dateCommande',
        ]

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes', [])

        commande = Commande.objects.create(
            **validated_data
        )

        for ligne_data in lignes_data:
            LigneCommande.objects.create(
                commande=commande,
                **ligne_data
            )

        commande.calculerMontantTotal()

        return commande

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if lignes_data is not None:
            instance.lignes.all().delete()

            for ligne_data in lignes_data:
                LigneCommande.objects.create(
                    commande=instance,
                    **ligne_data
                )

            instance.calculerMontantTotal()

        return instance


# ==========================================
# DOCUMENT
# ==========================================
class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'


# ==========================================
# FICHIER AUDIO
# ==========================================
class FichierAudioSerializer(serializers.ModelSerializer):
    commande_nom = serializers.SerializerMethodField()
    client_nom = serializers.CharField(
        source='commande.client.nom',
        read_only=True
    )
    service_nom = serializers.SerializerMethodField()

    class Meta:
        model = FichierAudio
        fields = '__all__'

    def get_commande_nom(self, obj):
        if obj.commande:
            return f"CMD-{obj.commande.id:04d}"
        return None

    def get_service_nom(self, obj):
        if not obj.commande:
            return None
        premiere_ligne = obj.commande.lignes.first()
        if premiere_ligne:
            return premiere_ligne.service.nomService
        return None


# ==========================================
# FACTURE
# ==========================================
class FactureSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(
        source='commande.client.nom',
        read_only=True
    )

    client_telephone = serializers.CharField(
        source='commande.client.telephone',
        read_only=True
    )

    commande_id = serializers.IntegerField(
        source='commande.id',
        read_only=True
    )

    service_nom = serializers.SerializerMethodField()
    tarif_libelle = serializers.SerializerMethodField()
    tarif_prix = serializers.SerializerMethodField()

    lignes = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = '__all__'
        read_only_fields = (
            'numeroFacture',
            'dateFacture',
        )

    def get_service_nom(self, obj):
        if obj.commande:
            premiere = obj.commande.lignes.first()
            if premiere and premiere.service:
                return premiere.service.nomService
        return '-'

    def get_tarif_libelle(self, obj):
        if obj.commande:
            premiere = obj.commande.lignes.first()
            if premiere and premiere.tarif:
                return premiere.tarif.libelle
        return '-'

    def get_tarif_prix(self, obj):
        if obj.commande:
            premiere = obj.commande.lignes.first()
            if premiere:
                return float(premiere.prixUnitaire)
        return 0

    def get_lignes(self, obj):
        """
        Grouper les lignes par service + tarif.
        Retourne : [{nbr, service_nom, tarif_libelle, prixUnitaire, montant}]
        """
        from collections import defaultdict

        groupes = defaultdict(lambda: {
            'nbr': 0,
            'service_nom': '',
            'tarif_libelle': '',
            'prixUnitaire': 0,
            'montant': 0,
        })

        for ligne in obj.commande.lignes.all():
            cle = f"{ligne.service_id}-{ligne.tarif_id}"
            g = groupes[cle]
            g['nbr'] += 1
            g['montant'] += float(ligne.montant)
            g['service_nom'] = ligne.service.nomService
            g['tarif_libelle'] = ligne.tarif.libelle
            g['prixUnitaire'] = float(ligne.prixUnitaire)

        return list(groupes.values())