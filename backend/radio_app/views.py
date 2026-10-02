from rest_framework import viewsets, status, serializers
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from django.db.models import Q, Sum
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from rest_framework.views import APIView


from .models import (
    Utilisateur, Client, Service, Tarif,
    Commande, LigneCommande, Document,
    FichierAudio, Programmation, Facture
)

from .serializers import (
    UtilisateurSerializer, ClientSerializer, ServiceSerializer, TarifSerializer,
    CommandeSerializer, LigneCommandeSerializer, DocumentSerializer,
    FichierAudioSerializer, ProgrammationSerializer, FactureSerializer
)


# ==========================================
# UTILISATEUR ACTUEL DU PROJET
# ==========================================
User = get_user_model()


# ==========================================
# CREATION DE COMPTE
# ==========================================
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')

        if not username or not password:
            return Response(
                {'error': 'Nom d’utilisateur et mot de passe requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        username = username.strip()

        if not username:
            return Response(
                {'error': 'Le nom d’utilisateur est obligatoire.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Ce nom d’utilisateur existe déjà.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(password)
        except ValidationError as e:
            return Response(
                {'error': e.messages},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name
        )

        return Response(
            {
                'message': 'Compte créé avec succès.',
                'username': user.username
            },
            status=status.HTTP_201_CREATED
        )


# ==========================================
# AUTOCOMPLETE CLIENT
# ==========================================
@api_view(['GET'])
def rechercher_clients(request):
    q = request.GET.get('q', '').strip()

    if not q:
        return Response([])

    clients = Client.objects.filter(
        Q(nom__icontains=q) |
        Q(telephone__icontains=q)
    )[:10]

    serializer = ClientSerializer(clients, many=True)
    return Response(serializer.data)


# ==========================================
# VIEWSETS
# ==========================================

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def recherche(self, request):
        return rechercher_clients(request)


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]


class TarifViewSet(viewsets.ModelViewSet):
    queryset = Tarif.objects.all()
    serializer_class = TarifSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Tarif.objects.all()
        service_id = self.request.query_params.get('service')

        if service_id:
            queryset = queryset.filter(service_id=service_id)

        return queryset


class CommandeViewSet(viewsets.ModelViewSet):
    queryset = Commande.objects.select_related(
        'client',
        'utilisateur'
    ).prefetch_related(
        'lignes__service',
        'lignes__tarif',
        'programmations'
    )

    serializer_class = CommandeSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        utilisateur = None

        if self.request.user.is_authenticated:
            utilisateur = self.request.user

        if utilisateur is None:
            utilisateur = Utilisateur.objects.first()

        if utilisateur is None:
            raise serializers.ValidationError(
                "Aucun utilisateur disponible."
            )

        # ═══ 1. Mamorona ny Commande ═══
        commande = serializer.save(utilisateur=utilisateur)

        # ═══ 2. Mamorona ny Programmation ho an'ny diffusion tsirairay ═══
        programmations = self.request.data.get('programmations', [])

        for prog in programmations:
            date_diff = prog.get('dateDiffusion')
            heure_diff = prog.get('heureDiffusion')

            if not date_diff or not heure_diff:
                continue

            if len(heure_diff) == 5:
                heure_diff = f"{heure_diff}:00"

            Programmation.objects.create(
                commande=commande,
                dateDiffusion=date_diff,
                heureDiffusion=heure_diff,
                statut='À venir'
            )

    @action(detail=True, methods=['post'], url_path='generer-facture')
    def generer_facture(self, request, pk=None):
        commande = self.get_object()

        if hasattr(commande, 'facture'):
            return Response(
                FactureSerializer(commande.facture).data,
                status=status.HTTP_200_OK
            )

        numero = f"FAC-{commande.id:04d}"

        facture = Facture.objects.create(
            commande=commande,
            numeroFacture=numero,
            montantTotal=commande.montantTotal,
            statut='Générée'
        )

        return Response(
            FactureSerializer(facture).data,
            status=status.HTTP_201_CREATED
        )


class LigneCommandeViewSet(viewsets.ModelViewSet):
    queryset = LigneCommande.objects.all()
    serializer_class = LigneCommandeSerializer
    permission_classes = [AllowAny]


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [AllowAny]


# ==========================================
# FICHIER AUDIO — VIEWSET AVEC ACTIONS
# ==========================================
class FichierAudioViewSet(viewsets.ModelViewSet):
    queryset = FichierAudio.objects.select_related(
        'commande__client'
    )
    serializer_class = FichierAudioSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = FichierAudio.objects.select_related(
            'commande__client'
        )

        commande_id = self.request.query_params.get('commande')
        if commande_id:
            queryset = queryset.filter(commande_id=commande_id)

        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)

        return queryset

    @action(
        detail=False,
        methods=['get'],
        url_path='par-commande/(?P<commande_id>[^/.]+)'
    )
    def par_commande(self, request, commande_id=None):
        """
        Récupère tous les fichiers audio d'une commande donnée.
        """
        fichiers = FichierAudio.objects.filter(
            commande_id=commande_id
        ).select_related('commande__client')

        serializer = FichierAudioSerializer(fichiers, many=True)
        return Response(serializer.data)

    # ═══════════════════════════════════════════════════════════
    # UPLOAD D'UN FICHIER MP3
    # ═══════════════════════════════════════════════════════════
    @action(detail=False, methods=['post'], url_path='upload')
    def upload(self, request):
        """
        Upload d'un fichier MP3 vers le serveur.
        Le fichier est stocké dans media/fichiers/
        """
        import os
        from django.conf import settings

        # ═══ Récupérer les données ═══
        fichier = request.FILES.get('fichier')
        commande_id = request.data.get('commande')

        if not fichier:
            return Response(
                {'error': 'Aucun fichier reçu.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not commande_id:
            return Response(
                {'error': 'Aucune commande spécifiée.'},
                status=status.HTTP_400_BAD_REQUEST
            )

         # ═══ Vérifier le type (audio) ═══
        nom_fichier = fichier.name
        extensions_audio = [
            '.mp3', '.wav', '.m4a', '.aac',
            '.ogg', '.flac', '.wma', '.opus',
        ]
        extension = os.path.splitext(nom_fichier)[1].lower()

        if extension not in extensions_audio:
            return Response(
                {
                    'error': (
                        f'Format audio non supporté : {extension}. '
                        f'Formats acceptés : {", ".join(extensions_audio)}'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ═══ Créer le dossier media/fichiers/ si absent ═══
        dossier_media = os.path.join(settings.MEDIA_ROOT, 'fichiers')
        os.makedirs(dossier_media, exist_ok=True)

        # ═══ Sauvegarder le fichier ═══
        chemin_relatif = f"fichiers/{nom_fichier}"
        chemin_complet = os.path.join(settings.MEDIA_ROOT, chemin_relatif)

        # Si le fichier existe déjà, on le remplace
        if os.path.exists(chemin_complet):
            os.remove(chemin_complet)

        with open(chemin_complet, 'wb+') as destination:
            for chunk in fichier.chunks():
                destination.write(chunk)

        # ═══ Vérifier que la commande existe ═══
        try:
            commande = Commande.objects.get(id=commande_id)
        except Commande.DoesNotExist:
            return Response(
                {'error': 'Commande introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # ═══ Créer le FichierAudio ═══
        fichier_audio = FichierAudio.objects.create(
            commande=commande,
            nomFichier=nom_fichier,
            cheminOrdinateur=chemin_complet,
            format='mp3',
            taille=fichier.size,
            statut='Disponible',
        )

        serializer = FichierAudioSerializer(fichier_audio)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ═══════════════════════════════════════════════════════════
    # ENVOYER VERS LE PAD
    # ═══════════════════════════════════════════════════════════
    @action(detail=True, methods=['post'], url_path='envoyer-pad')
    def envoyer_pad(self, request, pk=None):
        fichier = self.get_object()

        try:
            fichier.envoyerVersPAD()
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            FichierAudioSerializer(fichier).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='envoyer-jour')
    def envoyer_jour(self, request):
        """
        Envoie toutes les diffusions du jour vers le PAD.
        """
        from datetime import date as date_type
        from .models import Programmation

        aujourd_hui = date_type.today()

        # Récupérer toutes les programmations du jour
        programmations = Programmation.objects.filter(
            dateDiffusion=aujourd_hui
        ).select_related('commande')

        if not programmations.exists():
            return Response(
                {'message': "Aucune diffusion prévue pour aujourd'hui."},
                status=status.HTTP_200_OK
            )

        # Grouper par commande
        commandes_ids = set(
            prog.commande_id
            for prog in programmations
            if prog.commande_id
        )

        resultats = {
            'succes': [],
            'echecs': [],
        }

        for commande_id in commandes_ids:
            fichiers = FichierAudio.objects.filter(
                commande_id=commande_id,
                statut='Disponible',
            )

            for fichier in fichiers:
                try:
                    fichier.envoyerVersPAD()
                    resultats['succes'].append({
                        'commande': commande_id,
                        'fichier': fichier.nomFichier,
                    })
                except Exception as e:
                    resultats['echecs'].append({
                        'commande': commande_id,
                        'fichier': fichier.nomFichier,
                        'erreur': str(e),
                    })

        return Response(resultats, status=status.HTTP_200_OK)
    # ═══════════════════════════════════════════════════════════
    # OUVRIR LE PAD (génère un fichier .bat)
    # ═══════════════════════════════════════════════════════════
    @action(detail=True, methods=['get'], url_path='ouvrir-pad')
    def ouvrir_pad(self, request, pk=None):
        """
        Génère un fichier .bat qui ouvre le dossier du PAD :
        - Mode LOCAL : ouvre D:\RadioAutomation\PAD-LOCAL
        - Mode SMB   : se connecte au réseau et ouvre \\10.10.0.10\Z
        """
        from django.http import HttpResponse
        from django.conf import settings

        fichier = self.get_object()

        # ═══ Déterminer le mode ═══
        smb_enabled = getattr(settings, 'PAD_SMB_ENABLED', False)

        if smb_enabled:
            # ═══════════════════════════════════════════
            # MODE SMB (PRODUCTION)
            # ═══════════════════════════════════════════
            username = request.query_params.get(
                'username',
                settings.PAD_SMB_USERNAME
            )
            password = request.query_params.get(
                'password',
                settings.PAD_SMB_PASSWORD
            )
            server_ip = settings.PAD_SMB_SERVER_IP
            share = settings.PAD_SMB_SHARE

            chemin_cible = f"\\\\{server_ip}\\{share}"

            contenu = f'''@echo off
chcp 65001 >nul
title Ouverture du PAD (SMB) - Radio Tsiry
color 0A

echo ================================================
echo    RADIO TSIRY - OUVERTURE DU PAD (SMB)
echo ================================================
echo.
echo Fichier : {fichier.nomFichier}
echo Serveur : {server_ip}
echo Partage : {share}
echo Chemin  : {chemin_cible}
echo.

REM === Se connecter au lecteur reseau ===
echo Connexion au lecteur reseau...
net use \\\\{server_ip}\\{share} /user:{username} {password} >nul 2>&1

if errorlevel 1 (
    echo [ERREUR] Echec de connexion.
    echo Verifiez vos identifiants.
    pause
    exit /b 1
)

echo [OK] Connexion reussie.
echo.

REM === Ouvrir la racine du PAD ===
echo Ouverture du PAD dans l'Explorateur...
start "" "{chemin_cible}"

echo.
echo ================================================
echo    PAD OUVERT - Vous pouvez fermer ceci
echo ================================================
timeout /t 3 >nul
'''

        else:
            # ═══════════════════════════════════════════
            # MODE LOCAL (SOUTENANCE)
            # ═══════════════════════════════════════════
            local_path = settings.PAD_LOCAL_PATH

            contenu = f'''@echo off
chcp 65001 >nul
title Ouverture du PAD (LOCAL) - Radio Tsiry
color 0A

echo ================================================
echo    RADIO TSIRY - OUVERTURE DU PAD (LOCAL)
echo ================================================
echo.
echo Fichier : {fichier.nomFichier}
echo Chemin  : {local_path}
echo Mode    : LOCAL (développement / soutenance)
echo.

REM === Ouvrir le dossier local ===
echo Ouverture du dossier local dans l'Explorateur...
start "" "{local_path}"

echo.
echo ================================================
echo    PAD LOCAL OUVERT - Vous pouvez fermer ceci
echo ================================================
timeout /t 3 >nul
'''

        # ═══ Réponse HTTP ═══
        response = HttpResponse(
            contenu,
            content_type='application/bat; charset=utf-8'
        )

        nom_fichier_bat = f"ouvrir_pad_{fichier.id}.bat"
        response['Content-Disposition'] = (
            f'attachment; filename="{nom_fichier_bat}"'
        )

        return response

# ==========================================
# PROFIL UTILISATEUR CONNECTE
# ==========================================
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user

    if request.method == 'PATCH':
        for champ in ('first_name', 'last_name', 'email'):
            if champ in request.data:
                setattr(user, champ, request.data[champ])
        user.save()

    return Response({
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'role': user.role,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def changer_mot_de_passe(request):
    ancien = request.data.get('ancien_mot_de_passe', '')
    nouveau = request.data.get('nouveau_mot_de_passe', '')

    if not request.user.check_password(ancien):
        return Response(
            {'error': "L'ancien mot de passe est incorrect."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(nouveau) < 6:
        return Response(
            {'error': 'Le nouveau mot de passe doit contenir au moins 6 caractères.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    request.user.set_password(nouveau)
    request.user.save()

    return Response({'message': 'Mot de passe modifié avec succès.'})


# ==========================================
# CONFIGURATION DU PAD
# ==========================================
@api_view(['GET'])
def pad_config(request):
    from django.conf import settings

    return Response({
        'smb_enabled': settings.PAD_SMB_ENABLED,
        'server_ip': settings.PAD_SMB_SERVER_IP,
        'local_path': settings.PAD_LOCAL_PATH,
        'dossiers': [
            '0- ALAHADY',
            '1-ALATSINAINY',
            '2-TALATA',
            '3-ALAROBIA',
            '4-ALAKAMISY',
            '5- ZOMA',
            '6- SABOTSY',
            '8 PUBLICITES',
            '9- FILAZANA',
        ],
    })

# ==========================================
# PROGRAMMATION — VIEWSET AVEC ACTIONS
# ==========================================
class ProgrammationViewSet(viewsets.ModelViewSet):
    queryset = Programmation.objects.select_related(
        'fichierAudio__commande__client'
    )
    serializer_class = ProgrammationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Programmation.objects.select_related(
            'fichierAudio__commande__client'
        )

        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)

        date_diffusion = self.request.query_params.get('date')
        if date_diffusion:
            queryset = queryset.filter(dateDiffusion=date_diffusion)

        return queryset

    @action(detail=False, methods=['get'], url_path='aujourd-hui')
    def aujourd_hui(self, request):
        aujourd_hui = timezone.now().date()
        programmations = Programmation.objects.filter(
            dateDiffusion=aujourd_hui
        ).select_related('fichierAudio__commande__client')

        serializer = ProgrammationSerializer(programmations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='a-envoyer')
    def a_envoyer(self, request):
        programmations = Programmation.objects.filter(
            statut__in=['À venir', 'À envoyer']
        ).select_related('fichierAudio__commande__client')

        serializer = ProgrammationSerializer(programmations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='envoyer-pad')
    def envoyer_pad(self, request, pk=None):
        programmation = self.get_object()

        try:
            programmation.statut = 'Transfert en cours'
            programmation.save(update_fields=['statut'])

            fichier = programmation.fichierAudio
            fichier.envoyerVersPAD()

            programmation.statut = 'Envoyé au PAD'
            programmation.dateTransfert = timezone.now()
            programmation.dateTraitement = timezone.now()
            programmation.save(update_fields=[
                'statut', 'dateTransfert', 'dateTraitement'
            ])

        except Exception as e:
            programmation.statut = 'Échec'
            programmation.messageErreur = str(e)
            programmation.dateTraitement = timezone.now()
            programmation.save(update_fields=[
                'statut', 'messageErreur', 'dateTraitement'
            ])

            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            ProgrammationSerializer(programmation).data,
            status=status.HTTP_200_OK
        )
    @action(detail=False, methods=['post'], url_path='envoyer-jour')
    def envoyer_jour(self, request):
        """
        Envoie toutes les diffusions du jour vers le PAD.
        """
        from datetime import date as date_type
        aujourd_hui = date_type.today()

        # Récupérer toutes les programmations du jour
        from .models import Programmation

        programmations = Programmation.objects.filter(
            dateDiffusion=aujourd_hui
        ).select_related('commande', 'commande__client')

        if not programmations.exists():
            return Response(
                {'message': 'Aucune diffusion prévue pour aujourd\'hui.'},
                status=status.HTTP_200_OK
            )

        # Grouper par commande
        commandes_ids = set(
            prog.commande_id
            for prog in programmations
            if prog.commande_id
        )

        resultats = {
            'succes': [],
            'echecs': [],
        }

        for commande_id in commandes_ids:
            # Récupérer les fichiers audio de cette commande
            fichiers = FichierAudio.objects.filter(
                commande_id=commande_id,
                statut='Disponible',
            )

            for fichier in fichiers:
                try:
                    fichier.envoyerVersPAD()
                    resultats['succes'].append({
                        'commande': commande_id,
                        'fichier': fichier.nomFichier,
                    })
                except Exception as e:
                    resultats['echecs'].append({
                        'commande': commande_id,
                        'fichier': fichier.nomFichier,
                        'erreur': str(e),
                    })

        return Response(resultats, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='marquer-diffuse')
    def marquer_diffuse(self, request, pk=None):
        programmation = self.get_object()
        programmation.statut = 'Échéance passée'
        programmation.save(update_fields=['statut'])

        return Response(
            ProgrammationSerializer(programmation).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='archiver')
    def archiver(self, request, pk=None):
        programmation = self.get_object()
        programmation.statut = 'Archivé'
        programmation.save(update_fields=['statut'])

        return Response(
            ProgrammationSerializer(programmation).data,
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='envoyer-aujourd-hui')
    def envoyer_aujourd_hui(self, request):
        aujourd_hui = timezone.now().date()

        programmations = Programmation.objects.filter(
            dateDiffusion=aujourd_hui,
            statut__in=['À venir', 'À envoyer']
        ).select_related('fichierAudio__commande')

        succes = 0
        echecs = 0
        erreurs = []

        for prog in programmations:
            try:
                prog.statut = 'Transfert en cours'
                prog.save(update_fields=['statut'])

                fichier = prog.fichierAudio
                fichier.envoyerVersPAD()

                prog.statut = 'Envoyé au PAD'
                prog.dateTransfert = timezone.now()
                prog.dateTraitement = timezone.now()
                prog.save(update_fields=[
                    'statut', 'dateTransfert', 'dateTraitement'
                ])

                succes += 1
            except Exception as e:
                prog.statut = 'Échec'
                prog.messageErreur = str(e)
                prog.dateTraitement = timezone.now()
                prog.save(update_fields=[
                    'statut', 'messageErreur', 'dateTraitement'
                ])

                echecs += 1
                erreurs.append({
                    'programmation': prog.id,
                    'fichier': prog.fichierAudio.nomFichier,
                    'erreur': str(e),
                })

        return Response({
            'succes': succes,
            'echecs': echecs,
            'erreurs': erreurs,
        }, status=status.HTTP_200_OK)


# ==========================================
# FACTURE — VIEWSET AVEC ACTIONS
# ==========================================
class FactureViewSet(viewsets.ModelViewSet):

    queryset = Facture.objects.select_related('commande__client')
    serializer_class = FactureSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Facture.objects.select_related('commande__client')

        archive = self.request.query_params.get('archive')

        if archive == 'true':
            queryset = queryset.filter(estArchive=True)
        elif archive == 'false':
            queryset = queryset.filter(estArchive=False)

        return queryset

    @action(detail=True, methods=['post'], url_path='marquer-paye')
    def marquer_paye(self, request, pk=None):
        facture = self.get_object()
        facture.statut = 'Payé'
        facture.save(update_fields=['statut'])

        return Response(
            FactureSerializer(facture).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='archiver')
    def archiver(self, request, pk=None):
        facture = self.get_object()

        facture.estArchive = True
        facture.dateSuppression = timezone.now()
        facture.save(update_fields=['estArchive', 'dateSuppression'])

        return Response(
            FactureSerializer(facture).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='restaurer')
    def restaurer(self, request, pk=None):
        facture = self.get_object()

        facture.estArchive = False
        facture.dateSuppression = None
        facture.save(update_fields=['estArchive', 'dateSuppression'])

        return Response(
            FactureSerializer(facture).data,
            status=status.HTTP_200_OK
        )

    # =========================================================
    # EXPORT PDF — AVEC RÉSUMÉ
    # =========================================================
    @action(detail=False, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request):
        from django.http import HttpResponse
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT

        annee = request.query_params.get('annee')
        mois = request.query_params.get('mois')

        queryset = Facture.objects.select_related(
            'commande__client'
        ).filter(estArchive=False)

        if annee:
            queryset = queryset.filter(dateFacture__year=annee)
        if mois:
            queryset = queryset.filter(dateFacture__month=mois)

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="factures.pdf"'

        doc = SimpleDocTemplate(
            response,
            pagesize=A4,
            leftMargin=1.5 * cm,
            rightMargin=1.5 * cm,
            topMargin=1.5 * cm,
            bottomMargin=1.5 * cm,
        )

        styles = getSampleStyleSheet()

        titre_style = ParagraphStyle(
            'Titre',
            parent=styles['Title'],
            fontSize=22,
            textColor=colors.HexColor('#007A4D'),
            alignment=TA_CENTER,
            spaceAfter=6,
            fontName='Helvetica-Bold',
        )

        sous_titre_style = ParagraphStyle(
            'SousTitre',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#333333'),
            alignment=TA_CENTER,
            spaceAfter=2,
            fontName='Helvetica-Bold',
        )

        info_style = ParagraphStyle(
            'Info',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#666666'),
            alignment=TA_CENTER,
            spaceAfter=2,
        )

        periode_style = ParagraphStyle(
            'Periode',
            parent=styles['Normal'],
            fontSize=14,
            textColor=colors.HexColor('#007A4D'),
            alignment=TA_CENTER,
            spaceBefore=14,
            spaceAfter=16,
            fontName='Helvetica-Bold',
        )

        story = []

        story.append(Paragraph("RADIO TSIRY", titre_style))
        story.append(Paragraph("Ecar Diosezy Fianarantsoa — FM 105", sous_titre_style))
        story.append(Paragraph("ambalapaiso-Ambony, Fianarantsoa (301)", info_style))
        story.append(Paragraph("Tel : 75 522 53 — radiotsiry@gmail.com", info_style))

        if annee or mois:
            noms_mois = [
                '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ]
            periode = []
            if mois:
                periode.append(noms_mois[int(mois)])
            if annee:
                periode.append(annee)
            story.append(
                Paragraph(f"Liste des factures — {' '.join(periode)}", periode_style)
            )
        else:
            story.append(Paragraph("Liste des factures", periode_style))

        total_general = 0
        clients_set = set()
        nb_factures = 0

        for facture in queryset:
            montant = float(facture.montantTotal or 0)
            total_general += montant
            nb_factures += 1
            if facture.commande and facture.commande.client:
                clients_set.add(facture.commande.client.nom)

        clients_str = ', '.join(sorted(clients_set)) if clients_set else '-'

        resume_data = [
            ['Nombre de factures', str(nb_factures)],
            ['Montant total', f"{total_general:,.0f} Ar".replace(',', ' ')],
            ['Client(s)', clients_str],
        ]

        resume_table = Table(
            resume_data,
            colWidths=[5 * cm, 12 * cm],
        )
        resume_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#007A4D')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EAF7F1')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#007A4D')),
            ('INNERGRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#CCCCCC')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ]))

        story.append(resume_table)
        story.append(Spacer(1, 0.6 * cm))

        data = [[
            'N° Facture',
            'Client',
            'Date commande',
            'Montant',
            'Statut',
        ]]

        for facture in queryset:
            date_cmd = '-'
            if facture.commande and facture.commande.dateCommande:
                date_cmd = facture.commande.dateCommande.strftime('%d/%m/%Y')

            montant = float(facture.montantTotal or 0)

            data.append([
                facture.numeroFacture or '-',
                facture.commande.client.nom if facture.commande and facture.commande.client else '-',
                date_cmd,
                f"{montant:,.0f} Ar".replace(',', ' '),
                facture.statut or '-',
            ])

        data.append(['', '', 'TOTAL', f"{total_general:,.0f} Ar".replace(',', ' '), ''])

        table = Table(
            data,
            colWidths=[3.2 * cm, 4.5 * cm, 3.5 * cm, 3.8 * cm, 2.5 * cm],
            repeatRows=1,
        )

        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#007A4D')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -2), 10),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('ALIGN', (2, 1), (2, -1), 'CENTER'),
            ('ALIGN', (3, 1), (3, -1), 'RIGHT'),
            ('ALIGN', (4, 1), (4, -1), 'CENTER'),
            ('TOPPADDING', (0, 1), (-1, -2), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -2), 8),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 11),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#007A4D')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#EAF7F1')),
            ('ALIGN', (2, -1), (2, -1), 'RIGHT'),
            ('ALIGN', (3, -1), (3, -1), 'RIGHT'),
            ('TOPPADDING', (0, -1), (-1, -1), 10),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [
                colors.white,
                colors.HexColor('#F5F8F6'),
            ]),
        ]))

        story.append(table)

        doc.build(story)
        return response

    # =========================================================
    # EXPORT EXCEL — TABLEAU SIMPLE
    # =========================================================
    @action(detail=False, methods=['get'], url_path='export-excel')
    def export_excel(self, request):
        import openpyxl
        from openpyxl.styles import (
            Font, PatternFill, Alignment, Border, Side
        )
        from django.http import HttpResponse

        annee = request.query_params.get('annee')
        mois = request.query_params.get('mois')

        queryset = Facture.objects.select_related(
            'commande__client'
        ).filter(estArchive=False)

        if annee:
            queryset = queryset.filter(dateFacture__year=annee)
        if mois:
            queryset = queryset.filter(dateFacture__month=mois)

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = 'Factures'

        title_font = Font(name='Calibri', size=18, bold=True, color='007A4D')
        subtitle_font = Font(name='Calibri', size=11, bold=True, color='333333')
        header_font = Font(name='Calibri', size=11, bold=True, color='FFFFFF')
        header_fill = PatternFill(start_color='007A4D', end_color='007A4D', fill_type='solid')
        total_font = Font(name='Calibri', size=11, bold=True, color='007A4D')
        total_fill = PatternFill(start_color='EAF7F1', end_color='EAF7F1', fill_type='solid')
        thin_border = Border(
            left=Side(style='thin', color='CCCCCC'),
            right=Side(style='thin', color='CCCCCC'),
            top=Side(style='thin', color='CCCCCC'),
            bottom=Side(style='thin', color='CCCCCC'),
        )
        center_align = Alignment(horizontal='center', vertical='center')
        right_align = Alignment(horizontal='right', vertical='center')
        left_align = Alignment(horizontal='left', vertical='center')

        ws.merge_cells('A1:E1')
        ws['A1'] = 'RADIO TSIRY'
        ws['A1'].font = title_font
        ws['A1'].alignment = center_align
        ws.row_dimensions[1].height = 30

        ws.merge_cells('A2:E2')
        ws['A2'] = 'Ecar Diosezy Fianarantsoa — FM 105'
        ws['A2'].font = subtitle_font
        ws['A2'].alignment = center_align

        ws.merge_cells('A3:E3')
        ws['A3'] = 'ambalapaiso-Ambony, Fianarantsoa (301) — Tel : 75 522 53'
        ws['A3'].font = subtitle_font
        ws['A3'].alignment = center_align

        ws.merge_cells('A4:E4')
        ws['A4'] = 'radiotsiry@gmail.com'
        ws['A4'].font = subtitle_font
        ws['A4'].alignment = center_align

        noms_mois = [
            '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ]
        periode = []
        if mois:
            periode.append(noms_mois[int(mois)])
        if annee:
            periode.append(annee)
        periode_str = ' '.join(periode) if periode else 'Toutes les factures'

        ws.merge_cells('A5:E5')
        ws['A5'] = f'Liste des factures — {periode_str}'
        ws['A5'].font = Font(size=12, bold=True, color='007A4D')
        ws['A5'].alignment = center_align
        ws.row_dimensions[5].height = 22

        ws.append([])

        headers = ['N° Facture', 'Client', 'Date commande', 'Montant (Ar)', 'Statut']
        ws.append(headers)

        header_row = ws.max_row
        for col_idx in range(1, 6):
            cell = ws.cell(row=header_row, column=col_idx)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_align
            cell.border = thin_border
        ws.row_dimensions[header_row].height = 25

        total_general = 0

        for facture in queryset:
            date_cmd = '-'
            if facture.commande and facture.commande.dateCommande:
                date_cmd = facture.commande.dateCommande.strftime('%d/%m/%Y')

            montant = float(facture.montantTotal or 0)
            total_general += montant

            ws.append([
                facture.numeroFacture or '-',
                facture.commande.client.nom if facture.commande and facture.commande.client else '-',
                date_cmd,
                montant,
                facture.statut or '-',
            ])

            current_row = ws.max_row
            for col_idx in range(1, 6):
                cell = ws.cell(row=current_row, column=col_idx)
                cell.border = thin_border
                cell.font = Font(size=10)
                if col_idx in (1, 3, 5):
                    cell.alignment = center_align
                elif col_idx == 4:
                    cell.alignment = right_align
                    cell.number_format = '#,##0'
                else:
                    cell.alignment = left_align

        ws.append(['', '', 'TOTAL', total_general, ''])
        total_row = ws.max_row

        for col_idx in range(1, 6):
            cell = ws.cell(row=total_row, column=col_idx)
            cell.font = total_font
            cell.fill = total_fill
            cell.border = thin_border
            if col_idx in (3, 4):
                cell.alignment = right_align
                if col_idx == 4:
                    cell.number_format = '#,##0'

        ws.column_dimensions['A'].width = 18
        ws.column_dimensions['B'].width = 22
        ws.column_dimensions['C'].width = 18
        ws.column_dimensions['D'].width = 20
        ws.column_dimensions['E'].width = 15

        response = HttpResponse(
            content_type=(
                'application/vnd.openxmlformats-'
                'officedocument.spreadsheetml.sheet'
            )
        )
        response['Content-Disposition'] = 'attachment; filename="factures.xlsx"'

        wb.save(response)
        return response