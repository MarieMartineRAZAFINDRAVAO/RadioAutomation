from django.core.management.base import BaseCommand
from radio_app.models import Service, Tarif


class Command(BaseCommand):
    help = "Initialise ny services sy tarifs rehetra"

    def handle(self, *args, **kwargs):
        # Fafao aloha raha efa misy
        Tarif.objects.all().delete()
        Service.objects.all().delete()

        data = [
            {
                'nomService': 'Annonce',
                'typeService': 'Publicité',
                'description': "Diffusion d'annonces parlées ou lues",
                'modeTarification': 'Par ligne',
                'uniteFacturation': 'ligne',
                'tarifs': [
                    ('Moins de 10 lignes', 10, 'ligne', 3000),
                    ('20 lignes', 20, 'ligne', 4000),
                    ('Plus de 20 lignes', 21, 'ligne', 5000),
                ]
            },
            {
                'nomService': 'Spot Publicitaire',
                'typeService': 'Publicité',
                'description': 'Spots publicitaires audio classiques',
                'modeTarification': 'Par durée/tranche',
                'uniteFacturation': 'secondes',
                'tarifs': [
                    ('heures normales 30s', 30, 's', 5000),
                    ('heures normales 55s max', 55, 's', 7000),
                    ('prime time 30s', 30, 's', 6000),
                    ('prime time 55s max', 55, 's', 8000),
                    ('dans agnatsihitany 30s', 30, 's', 10000),
                    ('dans agnatsihitany 60s', 60, 's', 15000),
                ]
            },
            {
                'nomService': 'Diffusion Publi-Reportage / Sketch (PAD)',
                'typeService': 'Diffusion',
                'description': 'Diffusion de reportages ou sketches audio pré-enregistrés',
                'modeTarification': 'Par durée',
                'uniteFacturation': 'secondes',
                'tarifs': [
                    ('heures normales 1mn30s', 90, 's', 13000),
                    ('heures normales 3mn30s', 210, 's', 25000),
                    ('prime time 1mn30s', 90, 's', 15000),
                    ('prime time 2mn30s', 150, 's', 30000),
                    ('Diffusion 3mn', 180, 's', 30000),
                ]
            },
            {
                'nomService': 'Conception Spot / Sketch',
                'typeService': 'Production',
                'description': 'Création et production de spots publicitaires ou sketches',
                'modeTarification': 'Forfait par durée',
                'uniteFacturation': 'minutes',
                'tarifs': [
                    ('Moins de 05mn', 0, 'mn', 60000),
                    ('05mn', 5, 'mn', 80000),
                    ('10mn', 10, 'mn', 100000),
                    ('15mn', 15, 'mn', 150000),
                    ('30mn', 30, 'mn', 240000),
                ]
            },
            {
                'nomService': 'Traduction en Betsileo',
                'typeService': 'Traduction',
                'description': 'Traduction audio du contenu en dialecte Betsileo',
                'modeTarification': 'Forfait par durée',
                'uniteFacturation': 'minutes',
                'tarifs': [
                    ('Moins de 05mn', 0, 'mn', 60000),
                    ('05mn', 5, 'mn', 80000),
                    ('10mn', 10, 'mn', 100000),
                    ('15mn', 15, 'mn', 150000),
                    ('30mn', 30, 'mn', 240000),
                ]
            },
            {
                'nomService': 'Top horaire',
                'typeService': 'Sponsoring',
                'description': 'Sponsoring du signal horaire de la radio',
                'modeTarification': 'Par diffusion',
                'uniteFacturation': 'secondes',
                'tarifs': [
                    ('Top horaire 10s', 10, 's', 2000),
                ]
            },
            {
                'nomService': 'Chanson publicitaire',
                'typeService': 'Production',
                'description': 'Diffusion ou conception de chanson à titre publicitaire',
                'modeTarification': 'Forfait',
                'uniteFacturation': 'unité',
                'tarifs': [
                    ('Chanson publicitaire', 0, 'mn', 10000),
                ]
            },
            {
                'nomService': 'Diffusion Emission Special - PAD',
                'typeService': 'Diffusion',
                'description': "Diffusion d'emission speciale prete a diffuser (PAD)",
                'modeTarification': 'Par duree',
                'uniteFacturation': 'minutes',
                'tarifs': [
                    ('5mn', 5, 'mn', 15000),
                    ('10mn', 10, 'mn', 25000),
                    ('15mn', 15, 'mn', 35000),
                    ('30mn', 30, 'mn', 80000),
                    ('45mn', 45, 'mn', 130000),
                    ('60mn', 60, 'mn', 150000),
                ]
            },
            {
                'nomService': 'Diffusion Emission Special - Prise de son',
                'typeService': 'Production & Diffusion',
                'description': 'Emission speciale necessitant une prise de son studio/direct',
                'modeTarification': 'Par duree',
                'uniteFacturation': 'minutes',
                'tarifs': [
                    ('5mn', 5, 'mn', 5000),
                    ('10mn', 10, 'mn', 10000),
                    ('15mn', 15, 'mn', 15000),
                    ('20mn', 20, 'mn', 20000),
                    ('30mn', 30, 'mn', 20000),
                    ('45mn', 45, 'mn', 30000),
                    ('60mn', 60, 'mn', 30000),
                ]
            },
        ]

        for s in data:
            tarifs = s.pop('tarifs')
            service = Service.objects.create(**s)
            for libelle, duree, unite, prix in tarifs:
                Tarif.objects.create(
                    service=service,
                    libelle=libelle,
                    duree=duree,
                    unite=unite,
                    prix=prix
                )

        self.stdout.write(self.style.SUCCESS(
            f"✅ Services: {Service.objects.count()} | Tarifs: {Tarif.objects.count()}"
        ))