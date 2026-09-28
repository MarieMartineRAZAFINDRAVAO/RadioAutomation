from django.core.management.base import BaseCommand
from django.utils import timezone

from radio_app.models import Programmation


class Command(BaseCommand):
    help = 'Envoie les programmations du jour vers le PAD'

    def handle(self, *args, **options):
        aujourd_hui = timezone.now().date()

        programmations = Programmation.objects.filter(
            dateDiffusion=aujourd_hui,
            statut__in=['À venir', 'À envoyer']
        ).select_related('fichierAudio__commande')

        total = programmations.count()

        self.stdout.write(
            f'[INFO] {total} programmations a envoyer pour le {aujourd_hui}'
        )

        succes = 0
        echecs = 0

        for prog in programmations:
            try:
                prog.statut = 'Transfert en cours'
                prog.save(update_fields=['statut'])

                fichier = prog.fichierAudio
                fichier.envoyerVersPAD()

                prog.statut = 'Envoye au PAD'
                prog.dateTransfert = timezone.now()
                prog.dateTraitement = timezone.now()
                prog.save(update_fields=[
                    'statut', 'dateTransfert', 'dateTraitement'
                ])

                succes += 1
                self.stdout.write(
                    f'  [OK] {fichier.nomFichier} -> {fichier.cheminPAD}'
                )
            except Exception as e:
                prog.statut = 'Echec'
                prog.messageErreur = str(e)
                prog.dateTraitement = timezone.now()
                prog.save(update_fields=[
                    'statut', 'messageErreur', 'dateTraitement'
                ])

                echecs += 1
                self.stdout.write(
                    f'  [ERREUR] {prog.fichierAudio.nomFichier} : {e}'
                )

        self.stdout.write(
            f'[RESULTAT] {succes} succes, {echecs} echecs'
        )