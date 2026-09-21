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
    service_nom = serializers.CharField(source='service.nomService', read_only=True)

    class Meta:
        model = Tarif
        fields = '__all__'
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
            'dateDebut',
            'dateFin',
            'heureDiffusion',
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
            'lignes',
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
    class Meta:
        model = FichierAudio
        fields = '__all__'


# ==========================================
# PROGRAMMATION
# ==========================================
class ProgrammationSerializer(serializers.ModelSerializer):
    fichier_nom = serializers.CharField(source='fichierAudio.nomFichier', read_only=True)

    class Meta:
        model = Programmation
        fields = '__all__'

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

    class Meta:
        model = Facture
        fields = '__all__'
        read_only_fields = (
            'numeroFacture',
            'dateFacture',
        )