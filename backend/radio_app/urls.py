from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    ClientViewSet,
    ServiceViewSet,
    TarifViewSet,
    CommandeViewSet,
    LigneCommandeViewSet,
    DocumentViewSet,
    FichierAudioViewSet,
    ProgrammationViewSet,
    FactureViewSet,
    pad_config,
    me,
    changer_mot_de_passe
)


# ==========================================
# ROUTER
# ==========================================

router = DefaultRouter()

router.register(
    r'clients',
    ClientViewSet,
    basename='client'
)

router.register(
    r'services',
    ServiceViewSet,
    basename='service'
)

router.register(
    r'tarifs',
    TarifViewSet,
    basename='tarif'
)

router.register(
    r'commandes',
    CommandeViewSet,
    basename='commande'
)

router.register(
    r'lignes',
    LigneCommandeViewSet,
    basename='ligne'
)

router.register(
    r'documents',
    DocumentViewSet,
    basename='document'
)

router.register(
    r'fichiers-audio',
    FichierAudioViewSet,
    basename='fichier-audio'
)

router.register(
    r'programmations',
    ProgrammationViewSet,
    basename='programmation'
)

router.register(
    r'factures',
    FactureViewSet,
    basename='facture'
)


# ==========================================
# URLS
# ==========================================

urlpatterns = [

    # Création de compte
    path(
        'register/',
        RegisterView.as_view(),
        name='register'
    ),

    # Configuration du PAD (lera / créneaux horaires)
    path(
        'pad-config/',
        pad_config,
        name='pad-config'
    ),

    # Profil de l'utilisateur connecté
    path(
        'me/',
        me,
        name='me'
    ),

    path(
        'me/changer-mot-de-passe/',
        changer_mot_de_passe,
        name='changer-mot-de-passe'
    ),

    # Toutes les routes du router
    path(
        '',
        include(router.urls)
    ),
]