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
        'lignes__tarif'
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

        serializer.save(utilisateur=utilisateur)

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


class FichierAudioViewSet(viewsets.ModelViewSet):
    queryset = FichierAudio.objects.all()
    serializer_class = FichierAudioSerializer
    permission_classes = [AllowAny]

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
        'lera_slots': settings.PAD_LERA_SLOTS,
    })


class ProgrammationViewSet(viewsets.ModelViewSet):
    queryset = Programmation.objects.all()
    serializer_class = ProgrammationSerializer
    permission_classes = [AllowAny]


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

    @action(detail=False, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request):
        from django.http import HttpResponse
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas

        mois = request.query_params.get('mois')

        queryset = Facture.objects.select_related(
            'commande__client'
        ).filter(estArchive=False)

        if mois:
            annee, mois_num = mois.split('-')
            queryset = queryset.filter(
                dateFacture__year=annee,
                dateFacture__month=mois_num
            )

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="factures.pdf"'

        p = canvas.Canvas(response, pagesize=A4)
        largeur, hauteur = A4

        y = hauteur - 50

        p.setFont('Helvetica-Bold', 16)
        p.drawString(50, y, 'RADIO TSIRY — LISTE DES FACTURES')
        y -= 30

        p.setFont('Helvetica', 10)

        for facture in queryset:
            if y < 60:
                p.showPage()
                y = hauteur - 50
                p.setFont('Helvetica', 10)

            ligne = (
                f"{facture.numeroFacture} | "
                f"{facture.commande.client.nom} | "
                f"{facture.montantTotal} Ar | "
                f"{facture.statut}"
            )

            p.drawString(50, y, ligne)
            y -= 18

        p.showPage()
        p.save()

        return response

    @action(detail=False, methods=['get'], url_path='export-excel')
    def export_excel(self, request):
        import openpyxl
        from django.http import HttpResponse

        mois = request.query_params.get('mois')

        queryset = Facture.objects.select_related(
            'commande__client'
        ).filter(estArchive=False)

        if mois:
            annee, mois_num = mois.split('-')
            queryset = queryset.filter(
                dateFacture__year=annee,
                dateFacture__month=mois_num
            )

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = 'Factures'

        ws.append(['N° Facture', 'Client', 'Date', 'Montant', 'Statut'])

        for facture in queryset:
            ws.append([
                facture.numeroFacture,
                facture.commande.client.nom,
                facture.dateFacture.strftime('%d/%m/%Y %H:%M'),
                float(facture.montantTotal),
                facture.statut,
            ])

        response = HttpResponse(
            content_type=(
                'application/vnd.openxmlformats-'
                'officedocument.spreadsheetml.sheet'
            )
        )
        response['Content-Disposition'] = 'attachment; filename="factures.xlsx"'

        wb.save(response)

        return response