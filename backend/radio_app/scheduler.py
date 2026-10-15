"""
Scheduler automatique pour Radio Tsiry.
Mandeha ao ambadiky ny Django rehefa mandeha ny runserver.
"""
import threading
import time
import logging

logger = logging.getLogger(__name__)


def _loop():
    """Loop isaky ny 60 sec — manao nettoyer_pad."""
    from django.core.management import call_command
    from django.db import connection

    # Miandry 10 sec aloha
    time.sleep(10)

    print("[SCHEDULER] Démarré — nettoyer_pad isaky ny 60 sec")

    while True:
        try:
            call_command('nettoyer_pad')
        except Exception as e:
            logger.error(f"[SCHEDULER] Erreur : {e}")
            print(f"[SCHEDULER] Erreur : {e}")
        finally:
            try:
                connection.close()
            except Exception:
                pass

        time.sleep(60)


def demarrer_scheduler():
    """Démarre le scheduler en arrière-plan."""
    t = threading.Thread(
        target=_loop,
        daemon=True,
        name='RadioTsiryScheduler',
    )
    t.start() 
