"""
Commande Django : remplit la durée (en secondes) de tous les
fichiers audio existants qui n'ont pas encore de durée.

Usage : python manage.py remplir_durees
"""
import os
from django.core.management.base import BaseCommand
from radio_app.models import FichierAudio


class Command(BaseCommand):
    help = "Remplit la durée (secondes) des fichiers audio existants"

    def handle(self, *args, **options):
        try:
            import mutagen
        except ImportError:
            self.stdout.write(
                self.style.ERROR(
                    "[PAD] Le module 'mutagen' n'est pas installé. "
                    "Lancez : pip install mutagen"
                )
            )
            return

        fichiers = FichierAudio.objects.filter(
            duree__isnull=True
        ) | FichierAudio.objects.filter(duree=0)

        total = fichiers.count()

        self.stdout.write(
            self.style.WARNING(
                f"[PAD] {total} fichier(s) à traiter..."
            )
        )

        reussis = 0
        echecs = 0

        for f in fichiers:
            if not f.cheminOrdinateur or not os.path.exists(
                f.cheminOrdinateur
            ):
                echecs += 1
                continue

            try:
                audio = mutagen.File(f.cheminOrdinateur)

                if audio is not None and audio.info is not None:
                    f.duree = int(audio.info.length)
                    f.save(update_fields=['duree'])
                    reussis += 1

                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  ✓ {f.nomFichier} : "
                            f"{f.duree} sec ({f.duree // 60} min)"
                        )
                    )
                else:
                    echecs += 1

            except Exception as e:
                eches += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"  ✗ {f.nomFichier} : {e}"
                    )
                )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"[PAD] Terminé : {reussis} réussis, {echecs} échecs."
            )
        )