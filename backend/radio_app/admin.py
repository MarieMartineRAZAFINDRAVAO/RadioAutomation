from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Utilisateur, Client, Service, Tarif,
    Commande, LigneCommande, Document,
    FichierAudio, Programmation, Facture
)


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ('username', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (('Rôle Radio Tsiry', {'fields': ('role',)}),)


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'telephone', 'dateCreation')
    search_fields = ('nom', 'telephone')


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('id', 'nomService', 'typeService', 'statut')


@admin.register(Tarif)
class TarifAdmin(admin.ModelAdmin):
    list_display = ('id', 'service', 'libelle', 'duree', 'unite', 'prix', 'statut')
    list_filter = ('service', 'statut')


class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 1


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'utilisateur', 'dateCommande', 'statut', 'montantTotal')
    list_filter = ('statut',)
    inlines = [LigneCommandeInline]


@admin.register(LigneCommande)
class LigneCommandeAdmin(admin.ModelAdmin):
    list_display = ('id', 'commande', 'service', 'tarif', 'quantite', 'montant')


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'commande', 'typeDocument', 'designation')


@admin.register(FichierAudio)
class FichierAudioAdmin(admin.ModelAdmin):
    list_display = ('id', 'nomFichier', 'ligne', 'statut')


@admin.register(Programmation)
class ProgrammationAdmin(admin.ModelAdmin):
    list_display = ('id', 'fichierAudio', 'dateDiffusion', 'heureDiffusion', 'ordreDiffusion', 'statut')


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ('id', 'numeroFacture', 'commande', 'montantTotal', 'statut')