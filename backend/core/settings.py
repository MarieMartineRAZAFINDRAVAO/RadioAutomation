import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-radio-tsiry-secret-key'
DEBUG = True
ALLOWED_HOSTS = ['*']


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    # Local apps
    'radio_app',
]

# ⚠️ AUTH_USER_MODEL — ivelan'ny INSTALLED_APPS
AUTH_USER_MODEL = 'radio_app.Utilisateur'


MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'
WSGI_APPLICATION = 'core.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'automatisation',
        'USER': 'postgres',
        'PASSWORD': 'admin123',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=12),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}


CORS_ALLOW_ALL_ORIGINS = True
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Indian/Antananarivo'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ==========================================
# CONFIGURATION PAD (transfert des fichiers via SMB)
# ==========================================

# Mettre à True quand un vrai serveur SMB (le PAD) est disponible sur le réseau.
# Tant que c'est False, envoyerVersPAD() copie simplement le fichier dans
# PAD_LOCAL_PATH (utile pour développer/tester sans matériel radio réel).
PAD_SMB_ENABLED = False

PAD_SMB_SERVER_NAME = 'PAD-SERVER'
PAD_SMB_SERVER_IP = '192.168.1.50'
PAD_SMB_SHARE = 'diffusion'
PAD_SMB_USERNAME = 'radio'
PAD_SMB_PASSWORD = 'change-me'

PAD_LOCAL_PATH = os.path.join(BASE_DIR, 'pad_local')

# Grille des "lera" (créneaux horaires) disponibles chaque jour dans le PAD.
# ordreDiffusion (dans Programmation) correspond à l'index (1, 2, 3...) de cette liste.
PAD_LERA_SLOTS = [
    '06:00', '08:00', '10:00', '12:00',
    '14:00', '16:00', '18:00', '20:00',
]