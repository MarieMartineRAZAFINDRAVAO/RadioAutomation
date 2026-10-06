"""
Commande Django : régénère le fichier historique_archives.csv
+ historique_archives.xlsx depuis les Programmation archivées.

Usage : python manage.py regenerer_historique
"""
import os
import csv
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from radio_app.models import Programmation
from radio_app.pad_service import (
    ENTETES_HISTORIQUE,
    DOSSIER_ARCHIVES,
    FICHIER_HISTORIQUE,
    exporter_historique_excel,
)


class Command(BaseCommand):
    help = "Régénère l'historique des archives depuis la base"

    def handle(self, *args, **options):

        dossier_archives = os.path.join(
            settings.PAD_LOCAL_PATH,
            DOSSIER_ARCHIVES
        )
        os.makedirs(dossier_archives, exist_ok=True)

        chemin_csv = os.path.join(
            dossier_archives, FICHIER_HISTORIQUE
        )

        # ═══ 1. Récupérer les programmations archivées ═══
        programmations = Programmation.objects.filter(
            statut='Archivé'
        ).select_related(
            'commande__client', 'fichierAudio'
        ).order_by('dateDiffusion', 'heureDiffusion')

        self.stdout.write(
            self.style.WARNING(
                f"[PAD] {programmations.count()} programmation(s) archivée(s) "
                f"à traiter..."
            )
        )

        # ═══ 2. Écrire le CSV ═══
        lignes = []

        for prog in programmations:
            commande = prog.commande
            client = commande.client if commande else None

            nom_client = client.nom if client else '-'
            telephone_client = client.telephone if client else '-'

            date_diff = prog.dateDiffusion.strftime('%d/%m/%Y')
            heure_diff = prog.heureDiffusion.strftime('%H:%M')

            # ═══ Date/heure archive = FIN de diffusion ═══
            dt_diff = datetime.combine(
                prog.dateDiffusion,
                prog.heureDiffusion
            )

            duree_sec = (
                prog.fichierAudio.duree
                if prog.fichierAudio and prog.fichierAudio.duree
                else 0
            )

            dt_archive = dt_diff + timedelta(seconds=duree_sec)

            date_archive = dt_archive.strftime('%d/%m/%Y')
            heure_archive = dt_archive.strftime('%H:%M')

            nom_fichier = (
                prog.fichierAudio.nomFichier
                if prog.fichierAudio else '-'
            )

            # Retrouver le nom du fichier archive sur le disque
            # (pattern : YYYY-MM-DD_HHhMM_Client_Tel_Nom.ext)
            fichier_archive = self._trouver_archive(
                dossier_archives,
                prog.dateDiffusion,
                prog.heureDiffusion,
                nom_client,
            )

            lignes.append([
                date_archive,        # 1. Date archive
                date_diff,           # 2. Date diffusion
                heure_diff,          # 3. Heure diffusion
                heure_archive,       # 4. Heure archive
                nom_client,          # 5. Client
                telephone_client,    # 6. Téléphone
                nom_fichier,         # 7. Nom fichier
                fichier_archive,     # 8. Fichier archive
            ])

        # ═══ 3. Écrire le CSV ═══
        with open(
            chemin_csv, mode='w', newline='', encoding='utf-8-sig'
        ) as f:
            writer = csv.writer(f, delimiter=';')
            writer.writerow(ENTETES_HISTORIQUE)
            writer.writerows(lignes)

        self.stdout.write(
            self.style.SUCCESS(
                f"[PAD] {len(lignes)} ligne(s) écrite(s) dans le CSV."
            )
        )

        # ═══ 4. Régénérer l'Excel ═══
        try:
            exporter_historique_excel()
            self.stdout.write(
                self.style.SUCCESS(
                    "[PAD] Fichier Excel régénéré."
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f"[PAD] Erreur Excel : {e}"
                )
            )

    def _trouver_archive(
        self, dossier, date_diff, heure_diff, nom_client
    ):
        """
        Retrouve le nom du fichier archive sur le disque.
        """
        if not os.path.isdir(dossier):
            return '-'

        # Pattern : 2026-10-05_08h20_Client_...
        prefix = (
            f"{date_diff.strftime('%Y-%m-%d')}_"
            f"{heure_diff.strftime('%Hh%M')}_"
        )

        # Nettoyer le nom client (remplacer espaces)
        nom_client_clean = str(nom_client).replace(' ', '_')

        for nom in os.listdir(dossier):
            if nom.startswith(prefix) and nom_client_clean in nom:
                return nom

        return '-'