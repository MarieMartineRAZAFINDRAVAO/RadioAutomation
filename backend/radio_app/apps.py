from django.apps import AppConfig


class RadioAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'radio_app'

    def ready(self):
        import os
        import sys

        if 'runserver' not in sys.argv:
            return

        if os.environ.get('RUN_MAIN') != 'true':
            return

        from .scheduler import demarrer_scheduler
        demarrer_scheduler()