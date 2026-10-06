"""
Commande Django : envoie et nettoie le PAD
- Envoie les fichiers 'En attente' (nouvelle semaine)
- Archive les diffusions passées

Usage : python manage.py nettoyer_pad
"""
from django.core.management.base import BaseCommand
from radio_app.pad_service import (
    nettoyer_diffusions_passees,
    envoyer_fichiers_en_attente,
)


class Command(BaseCommand):
    help = "Envoie et archive les fichiers du PAD"

    def handle(self, *args, **options):

        # ═══ 1. Envoyer les fichiers en attente ═══
        resultats_envoi = envoyer_fichiers_en_attente()
        nb_envoyes = len(resultats_envoi['envoyes'])

        if nb_envoyes > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"[PAD] {nb_envoyes} fichier(s) envoyé(s) au PAD."
                )
            )

        # ═══ 2. Archiver les diffusions passées ═══
        resultats = nettoyer_diffusions_passees()

        nb_archives = len(resultats['archives'])
        nb_erreurs = len(resultats['erreurs'])

        if nb_archives > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"[PAD] {nb_archives} diffusion(s) archivée(s)."
                )
            )

        if nb_erreurs > 0:
            self.stdout.write(
                self.style.ERROR(
                    f"[PAD] {nb_erreurs} erreur(s)."
                )
            )
            for err in resultats['erreurs']:
                self.stdout.write(
                    self.style.ERROR(
                        f"  - {err['fichier']} : {err['erreur']}"
                    )
                )