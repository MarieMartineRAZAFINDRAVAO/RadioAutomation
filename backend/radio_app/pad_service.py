"""
Service PAD — Logique métier pour :
- Copie des fichiers vers les dossiers jour
- Archivage automatique des diffusions passées
- Historique Excel des archives
"""
import os
import shutil
import re
import csv
from datetime import datetime, date as date_type, timedelta
from django.conf import settings
from django.utils import timezone


# ═══════════════════════════════════════════════════
# MAPPING JOURS → DOSSIERS PAD
# ═══════════════════════════════════════════════════
JOURS_DOSSIERS = {
    0: '1-ALATSINAINY',   # Lundi
    1: '2-TALATA',        # Mardi
    2: '3-ALAROBIA',      # Mercredi
    3: '4-ALAKAMISY',     # Jeudi
    4: '5- ZOMA',         # Vendredi
    5: '6- SABOTSY',      # Samedi
    6: '0- ALAHADY',      # Dimanche
}

DOSSIER_ARCHIVES = 'archives'
FICHIER_HISTORIQUE = 'historique_archives.csv'
FICHIER_EXCEL = 'historique_archives.xlsx'


# ═══════════════════════════════════════════════════
# EN-TÊTES DU FICHIER HISTORIQUE
# ═══════════════════════════════════════════════════
ENTETES_HISTORIQUE = [
    'Date archive',
    'Date diffusion',
    'Heure diffusion',
    'Heure archive',
    'Client',
    'Téléphone',
    'Nom fichier',
    'Fichier archive',
]


# ═══════════════════════════════════════════════════
# NETTOYER UN NOM DE FICHIER
# ═══════════════════════════════════════════════════
def nettoyer_nom(texte):
    """Enlève les caractères interdits dans un nom de fichier Windows."""
    if not texte:
        return 'Inconnu'
    texte = re.sub(r'[<>:"/\\|?*]', '_', str(texte))
    texte = texte.strip().replace(' ', '_')
    return texte[:50] or 'Inconnu'


# ═══════════════════════════════════════════════════
# 1. COPIER UN FICHIER VERS LE DOSSIER DU JOUR
# ═══════════════════════════════════════════════════
def copier_vers_dossier_jour(chemin_source, nom_fichier, date_diffusion):
    """
    Copie le fichier source vers le dossier correspondant
    au jour de la semaine de `date_diffusion`.
    """
    if not os.path.exists(chemin_source):
        raise FileNotFoundError(
            f"Fichier source introuvable : {chemin_source}"
        )

    jour_semaine = date_diffusion.weekday()
    dossier_jour = JOURS_DOSSIERS.get(jour_semaine, '2-TALATA')

    dossier_destination = os.path.join(
        settings.PAD_LOCAL_PATH,
        dossier_jour
    )
    os.makedirs(dossier_destination, exist_ok=True)

    chemin_destination = os.path.join(dossier_destination, nom_fichier)
    shutil.copy2(chemin_source, chemin_destination)

    return f"{dossier_jour}/{nom_fichier}"

# ═══════════════════════════════════════════════════
# 2. ARCHIVER UNE DIFFUSION
# ═══════════════════════════════════════════════════
def archiver_diffusion(prog):
    """
    Archive UNE diffusion (Programmation).
    - Copie le fichier dans archives/ avec un nom daté
    - Supprime la copie du PAD (dossier jour)
    - Ajoute une ligne dans l'historique
    - Met à jour le statut de la Programmation
    - Si toutes les diffusions sont archivées → FichierAudio = 'Archivé'
    """
    from django.utils import timezone as tz

    fichier = prog.fichierAudio

    # Fallback : chercher via la commande
    if not fichier and prog.commande:
        fichier = prog.commande.fichiersAudio.first()

    if not fichier:
        raise ValueError(
            f"Aucun fichier audio pour la programmation #{prog.id}"
        )

    if not fichier.cheminOrdinateur:
        raise FileNotFoundError("cheminOrdinateur manquant")

    if not os.path.exists(fichier.cheminOrdinateur):
        raise FileNotFoundError(
            f"Fichier introuvable : {fichier.cheminOrdinateur}"
        )

    # ═══ 1. Infos client ═══
    commande = prog.commande
    client = commande.client if commande else None

    nom_client = nettoyer_nom(client.nom if client else 'Inconnu')
    tel_client = nettoyer_nom(
        client.telephone if client else '0000000000'
    )

    # ═══ 2. Nom du fichier ═══
    nom_original = os.path.basename(fichier.cheminOrdinateur)
    nom_sans_ext, extension = os.path.splitext(nom_original)
    nom_sans_ext = nettoyer_nom(nom_sans_ext)

    # ═══ 3. Date/heure de DIFFUSION ═══
    date_str = prog.dateDiffusion.strftime('%Y-%m-%d')
    heure_str = prog.heureDiffusion.strftime('%Hh%M')

    # ═══ 4. Nom final archive ═══
    nom_archive = (
        f"{date_str}_{heure_str}_"
        f"{nom_client}_{tel_client}_"
        f"{nom_sans_ext}{extension}"
    )

    # ═══ 5. Dossier archives ═══
    dossier_archives = os.path.join(
        settings.PAD_LOCAL_PATH,
        DOSSIER_ARCHIVES
    )
    os.makedirs(dossier_archives, exist_ok=True)

    chemin_archive = os.path.join(dossier_archives, nom_archive)

    # ═══ 6. Copier vers archives ═══
    shutil.copy2(fichier.cheminOrdinateur, chemin_archive)

       # ═══ 7. Supprimer du PAD (avec préfixe) ═══
    jour_semaine = prog.dateDiffusion.weekday()
    dossier_jour = JOURS_DOSSIERS.get(jour_semaine, '2-TALATA')
    base_dir = os.path.join(
        settings.PAD_LOCAL_PATH,
        dossier_jour
    )

    heure_str = prog.heureDiffusion.strftime('%Hh%M')

    # ═══ 7a. Chercher dans le sous-dossier heure ═══
    sous_dir = os.path.join(base_dir, heure_str)
    supprime = False

    if os.path.isdir(sous_dir):
        for item in os.listdir(sous_dir):
            if item.endswith(nom_original):
                try:
                    os.remove(os.path.join(sous_dir, item))
                    print(f"[PAD] Supprimé : {dossier_jour}/{heure_str}/{item}")
                    supprime = True
                except Exception as e:
                    print(f"[PAD] Erreur suppression : {e}")

        # Supprimer le sous-dossier s'il est vide
        try:
            if os.path.isdir(sous_dir) and not os.listdir(sous_dir):
                os.rmdir(sous_dir)
                print(f"[PAD] Sous-dossier supprimé : {dossier_jour}/{heure_str}")
        except Exception as e:
            print(f"[PAD] Erreur suppression sous-dossier : {e}")

    # ═══ 7b. Si pas trouvé → chercher dans le dossier jour ═══
    if not supprime and os.path.isdir(base_dir):
        for item in os.listdir(base_dir):
            chemin_item = os.path.join(base_dir, item)

            # Skip les sous-dossiers
            if not os.path.isfile(chemin_item):
                continue

            if item.endswith(nom_original):
                try:
                    os.remove(chemin_item)
                    print(f"[PAD] Supprimé : {dossier_jour}/{item}")
                    supprime = True
                except Exception as e:
                    print(f"[PAD] Erreur suppression : {e}")
    # ═══ 8. Mise à jour Programmation ═══
    prog.statut = 'Archivé'
    prog.dateTraitement = tz.now()
    prog.save(update_fields=['statut', 'dateTraitement'])

    # ═══ 9. Historique ═══
    try:
        ajouter_ligne_historique(prog, chemin_archive)
    except Exception as e:
        print(f"[PAD] Erreur historique : {e}")

    # ═══ 10. Vérifier si TOUTES les diffusions sont archivées ═══
    if commande:
        reste = commande.programmations.exclude(
            statut='Archivé'
        ).exists()

        if not reste:
            fichier.statut = 'Archivé'
            fichier.dateArchive = tz.now()
            fichier.save(update_fields=['statut', 'dateArchive'])

    return chemin_archive


# ═══════════════════════════════════════════════════
# 3. NETTOYER LES DIFFUSIONS PASSÉES
# ═══════════════════════════════════════════════════
def nettoyer_diffusions_passees():
    """
    Parcourt TOUTES les Programmation terminées
    et archive CHAQUE diffusion (une par une).

    Retourne un dict : {'archives': [...], 'erreurs': [...]}
    """
    from .models import Programmation

    maintenant = timezone.now()
    resultats = {
        'archives': [],
        'erreurs': [],
    }

    # ═══ Récupérer les programmations non archivées ═══
    programmations = Programmation.objects.filter(
        statut__in=[
            'À venir',
            'Envoyé au PAD',
            'Transfert en cours',
            'Archivé',  # ← ampiana mba hanamarina ny fichier
        ]
    ).select_related('commande__client', 'fichierAudio')

    for prog in programmations:
        # ═══ Si pas de fichierAudio, essayer de le trouver via la commande ═══
        fichier = prog.fichierAudio

        if not fichier and prog.commande:
            fichier = prog.commande.fichiersAudio.first()

        if not fichier:
            # Aucun fichier pour cette commande → skip
            continue

        # ═══ Attacher le fichier à la programmation si pas encore fait ═══
        if not prog.fichierAudio:
            prog.fichierAudio = fichier
            prog.save(update_fields=['fichierAudio'])

        # ═══ Calculer dt_fin = diffusion + durée ═══
        dt_diffusion = datetime.combine(
            prog.dateDiffusion,
            prog.heureDiffusion
        )
        dt_diffusion = timezone.make_aware(
            dt_diffusion,
            timezone.get_current_timezone()
        )

        # ═══ Durée depuis le FICHIER AUDIO (en secondes) ═══
        duree_sec = fichier.duree or 0

        # ═══ dt_fin = diffusion + durée + 1 minute (marge) ═══
        dt_fin = (
            dt_diffusion
            + timedelta(seconds=duree_sec)
            + timedelta(minutes=1)
        )

        # Si pas encore terminé → skip
        if dt_fin > maintenant:
            continue

        # ═══ Si déjà archivé → vérifier si le fichier existe dans archives/ ═══
        if prog.statut == 'Archivé':
            dossier_archives = os.path.join(
                settings.PAD_LOCAL_PATH,
                DOSSIER_ARCHIVES
            )

            # Chercher le fichier archive
            prefix = (
                f"{prog.dateDiffusion.strftime('%Y-%m-%d')}_"
                f"{prog.heureDiffusion.strftime('%Hh%M')}_"
            )

            existe = False
            if os.path.isdir(dossier_archives):
                for nom in os.listdir(dossier_archives):
                    if nom.startswith(prefix):
                        existe = True
                        break

            if existe:
                # Fichier déjà dans archives → skip
                continue
            else:
                # Statut 'Archivé' mais fichier absent → re-archiver
                print(
                    f"[PAD] Prog #{prog.id} marquée 'Archivé' "
                    f"mais fichier absent → ré-archivage..."
                )
        # ═══ Archiver cette diffusion ═══
        try:
            chemin = archiver_diffusion(prog)
            resultats['archives'].append({
                'programmation': prog.id,
                'fichier': (
                    prog.fichierAudio.nomFichier
                    if prog.fichierAudio else '-'
                ),
                'archive': chemin,
            })
        except FileNotFoundError as e:
            # ═══ Fichier source introuvable → 'Échéance passée' ═══
            print(f"[PAD] Fichier introuvable Prog #{prog.id} : {e}")
            prog.statut = 'Échéance passée'
            prog.messageErreur = str(e)
            prog.dateTraitement = timezone.now()
            prog.save(update_fields=[
                'statut', 'messageErreur', 'dateTraitement'
            ])
            resultats['erreurs'].append({
                'programmation': prog.id,
                'fichier': (
                    prog.fichierAudio.nomFichier
                    if prog.fichierAudio else '-'
                ),
                'erreur': f"Fichier introuvable : {e}",
            })
        except Exception as e:
            # ═══ Autre erreur → 'Échec' ═══
            print(f"[PAD] Erreur archivage Prog #{prog.id} : {e}")
            prog.statut = 'Échec'
            prog.messageErreur = str(e)
            prog.dateTraitement = timezone.now()
            prog.save(update_fields=[
                'statut', 'messageErreur', 'dateTraitement'
            ])
            resultats['erreurs'].append({
                'programmation': prog.id,
                'fichier': (
                    prog.fichierAudio.nomFichier
                    if prog.fichierAudio else '-'
                ),
                'erreur': str(e),
            })    
     # ═══ NORMALISATION : anciens fichiers sans préfixe ═══
    try:
        resultats['normalisation'] = _normaliser_pad()
    except Exception as e:
        print(f"[PAD] Erreur normalisation : {e}")
        resultats['normalisation'] = {'renommes': [], 'erreurs': [str(e)]}


    # ═══ FANADIOVANA : fichiers orphelins ao amin'ny PAD ═══
    try:
        resultats['nettoyage'] = _nettoyer_pad_orphelins()
    except Exception as e:
        print(f"[PAD] Erreur nettoyage : {e}")
        resultats['nettoyage'] = {'supprimes': [], 'erreurs': [str(e)]}

    return resultats


def _nettoyer_pad_orphelins():
    """
    Mandeha amin'ny dossier andro rehetra ary mamafa ny fichiers
    izay EFA MISY ao amin'ny archives/ (mitovy date + heure).

    Ny fichiers "orphelins" dia :
    - Mijanona tao amin'ny PAD
    - Fa efa voarchive ny diffusion-ny (raha misy fichier hafa)
    """
    import re

    dossier_archives = os.path.join(
        settings.PAD_LOCAL_PATH,
        DOSSIER_ARCHIVES
    )

    resultats = {
        'supprimes': [],
        'erreurs': [],
    }

    if not os.path.isdir(dossier_archives):
        return resultats

    # ═══ 1. Lister ny prefixes an'ny archives (YYYY-MM-DD_HHhMM) ═══
    prefixes = set()

    for nom in os.listdir(dossier_archives):
        if nom in (FICHIER_HISTORIQUE, FICHIER_EXCEL):
            continue

        chemin = os.path.join(dossier_archives, nom)
        if not os.path.isfile(chemin):
            continue

        # Extraire "2026-10-09_05h20" avy amin'ny anarana
        match = re.match(
            r'^(\d{4}-\d{2}-\d{2}_\d{2}h\d{2})_',
            nom
        )
        if match:
            prefixes.add(match.group(1))

    if not prefixes:
        return resultats

    # ═══ 2. Mandeha amin'ny dossier andro rehetra ═══
    for dossier_jour in JOURS_DOSSIERS.values():
        chemin_jour = os.path.join(
            settings.PAD_LOCAL_PATH,
            dossier_jour
        )

        if not os.path.isdir(chemin_jour):
            continue

        # ═══ 2a. Fichiers ao amin'ny dossier andro (direct) ═══
        for item in os.listdir(chemin_jour):
            chemin_item = os.path.join(chemin_jour, item)

            if os.path.isfile(chemin_item):
                continue  # Fichier direct — tsy fafana (mbola ilaina)

            # ═══ 2b. Sous-dossier (05h20/, 12h30/, ...) ═══
            heure_sous = item.strip()

            for nom_fichier in os.listdir(chemin_item):
                chemin_fichier = os.path.join(
                    chemin_item, nom_fichier
                )

                if not os.path.isfile(chemin_fichier):
                    continue

                # ═══ Jereo raha misy archive amin'io heure io ═══
                for prefix in prefixes:
                    if prefix.endswith(f"_{heure_sous}"):
                        # ═══ Voafafa ao amin'ny PAD ═══
                        try:
                            os.remove(chemin_fichier)
                            resultats['supprimes'].append(
                                f"{dossier_jour}/{heure_sous}/{nom_fichier}"
                            )
                            print(
                                f"[PAD] Orphelin nettoyé : "
                                f"{dossier_jour}/{heure_sous}/{nom_fichier}"
                            )
                        except Exception as e:
                            resultats['erreurs'].append(
                                f"{chemin_fichier} : {e}"
                            )
                        break

            # ═══ 2c. Esory ny sous-dossier raha foana ═══
            try:
                if (
                    os.path.isdir(chemin_item)
                    and not os.listdir(chemin_item)
                ):
                    os.rmdir(chemin_item)
                    print(
                        f"[PAD] Sous-dossier supprimé : "
                        f"{dossier_jour}/{heure_sous}"
                    )
            except Exception:
                pass

    return resultats

def _normaliser_pad():
    """
    Détecte les fichiers dans le PAD qui n'ont PAS le bon préfixe
    (heure_ ou NN_) et relance envoyerVersPAD() pour les recréer.
    """
    from .models import FichierAudio
    from datetime import date as date_type, timedelta

    resultats = {'renommes': [], 'erreurs': []}

    aujourd_hui = date_type.today()
    debut_semaine = aujourd_hui - timedelta(days=aujourd_hui.weekday())
    fin_semaine = debut_semaine + timedelta(days=6)

    fichiers = FichierAudio.objects.filter(
        programmations__dateDiffusion__gte=debut_semaine,
        programmations__dateDiffusion__lte=fin_semaine,
        statut__in=['Transféré', 'En attente', 'Disponible'],
    ).distinct()

    for f in fichiers:
        try:
            if not f.cheminPAD:
                continue

            besoin_renommer = False

            for chemin in f.cheminPAD.split(', '):
                chemin = chemin.strip()
                if not chemin:
                    continue

                chemin_complet = os.path.join(
                    settings.PAD_LOCAL_PATH,
                    *chemin.replace('\\', '/').split('/')
                )

                if not os.path.exists(chemin_complet):
                    continue

                nom = os.path.basename(chemin_complet)

                if not re.match(r'^(\d{2}h\d{2}_|\d{2}_)', nom):
                    besoin_renommer = True
                    break

            if besoin_renommer:
                f.envoyerVersPAD()
                resultats['renommes'].append(f.nomFichier)
                print(f"[PAD] Normalisé : {f.nomFichier}")

        except Exception as e:
            resultats['erreurs'].append(f"{f.nomFichier} : {e}")

    return resultats


# ═══════════════════════════════════════════════════
# 4. ENVOYER LES FICHIERS EN ATTENTE
# ═══════════════════════════════════════════════════
def envoyer_fichiers_en_attente():
    """
    Cherche tous les fichiers avec statut 'En attente' et
    tente de les envoyer vers le PAD si leur diffusion
    tombe dans la semaine en cours.

    Appelé par le scheduler chaque minute.
    """
    from .models import FichierAudio
    from datetime import date as date_type, timedelta

    resultats = {
        'envoyes': [],
        'erreurs': [],
    }

    # ═══ Semaine en cours ═══
    aujourd_hui = date_type.today()
    debut_semaine = aujourd_hui - timedelta(days=aujourd_hui.weekday())
    fin_semaine = debut_semaine + timedelta(days=6)

    fichiers = FichierAudio.objects.filter(
        statut='En attente'
    ).select_related('commande__client')

    for fichier in fichiers:
        try:
            # ═══ Jereo raha misy diffusion amin'ity herinandro ity ═══
            progs_semaine = fichier.programmations.filter(
                dateDiffusion__gte=debut_semaine,
                dateDiffusion__lte=fin_semaine,
            )

            if not progs_semaine.exists():
                # Mbola tsy tonga ny herinandro → skip
                continue

            # ═══ Alefa ny fichier ═══
            fichier.statut = 'Disponible'  # reset mba handeha
            fichier.cheminPAD = None
            fichier.save(update_fields=['statut', 'cheminPAD'])

            chemin = fichier.envoyerVersPAD()

            if chemin:
                resultats['envoyes'].append({
                    'fichier': fichier.nomFichier,
                    'chemins': chemin,
                })
                print(f"[PAD] Envoyé (semaine) : {fichier.nomFichier}")

        except Exception as e:
            resultats['erreurs'].append({
                'fichier': fichier.nomFichier,
                'erreur': str(e),
            })

    return resultats


# ═══════════════════════════════════════════════════
# 4. LISTER LES ARCHIVES
# ═══════════════════════════════════════════════════



def lister_archives():
    """
    Retourne la liste des fichiers dans le dossier archives/.
    (Sans le CSV et le Excel)
    """
    dossier_archives = os.path.join(
        settings.PAD_LOCAL_PATH,
        DOSSIER_ARCHIVES
    )

    if not os.path.isdir(dossier_archives):
        return []

    fichiers = []
    for nom in sorted(os.listdir(dossier_archives), reverse=True):

        # Ignorer les fichiers historique
        if nom in (FICHIER_HISTORIQUE, FICHIER_EXCEL):
            continue

        chemin = os.path.join(dossier_archives, nom)
        if not os.path.isfile(chemin):
            continue

        try:
            stat = os.stat(chemin)
            fichiers.append({
                'nom': nom,
                'chemin': chemin,
                'taille': stat.st_size,
                'dateModif': datetime.fromtimestamp(
                    stat.st_mtime
                ).isoformat(),
            })
        except Exception:
            continue

    return fichiers


def ajouter_ligne_historique(prog, chemin_archive):
    """
    Ajoute une ligne dans historique_archives.csv
    avec TRI : voarchive farany → ambony.

    - Si le CSV est libre → écrire dedans
    - Si le CSV est ouvert dans Excel (locked)
      → écrire dans un fichier _temp
    """
    dossier_archives = os.path.join(
        settings.PAD_LOCAL_PATH,
        DOSSIER_ARCHIVES
    )
    os.makedirs(dossier_archives, exist_ok=True)

    chemin_csv = os.path.join(
        dossier_archives, FICHIER_HISTORIQUE
    )

    # ═══ 1. Infos client ═══
    commande = prog.commande
    client = commande.client if commande else None

    nom_client = client.nom if client else '-'
    telephone_client = client.telephone if client else '-'

    # ═══ 2. Date/heure diffusion ═══
    date_diff = prog.dateDiffusion.strftime('%d/%m/%Y')
    heure_diff = prog.heureDiffusion.strftime('%H:%M')

    # ═══ 3. Date/heure archive = fin de diffusion ═══
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

    # ═══ 4. Nom du fichier ═══
    nom_fichier = (
        prog.fichierAudio.nomFichier
        if prog.fichierAudio else '-'
    )

    # ═══ 5. Préparer la ligne ═══
    ligne = [
        date_archive,
        date_diff,
        heure_diff,
        heure_archive,
        nom_client,
        telephone_client,
        nom_fichier,
        os.path.basename(chemin_archive),
    ]

    # ═══ 6. Essayer d'écrire dans le CSV principal (avec tri) ═══
    try:
        _ecrire_csv_trie(chemin_csv, ligne)
        print(f"[PAD] Ligne ajoutée dans CSV principal")

    except PermissionError:
        # ═══ CSV ouvert dans Excel → écrire dans _temp ═══
        chemin_temp = chemin_csv.replace('.csv', '_temp.csv')

        try:
            _ecrire_csv_trie(chemin_temp, ligne)
            print(
                f"[PAD] CSV principal locked → ligne ajoutée dans "
                f"{os.path.basename(chemin_temp)}"
            )
        except Exception as e:
            print(f"[PAD] Impossible d'écrire le CSV temp : {e}")

    # ═══ 7. Essayer de fusionner le _temp avec le principal ═══
    _fusionner_csv_temp(chemin_csv)

    return chemin_csv


def _ecrire_csv_trie(chemin_csv, nouvelle_ligne):
    """
    Écrit une ligne dans le CSV en gardant le TRI :
    voarchive farany → ambony (desc).

    Raha tsy misy ny fichier → mamorona azy.
    Raha misy → mamaky ny données, manampy, mandamina, manoratra.
    """
    # ═══ 1. Lire les lignes existantes ═══
    lignes = []

    if os.path.exists(chemin_csv):
        with open(
            chemin_csv, mode='r', encoding='utf-8-sig'
        ) as f:
            reader = csv.reader(f, delimiter=';')
            for l in reader:
                if l:
                    lignes.append(l)

    # ═══ 2. Retirer les en-têtes ═══
    entetes = []
    if lignes and lignes[0] == ENTETES_HISTORIQUE:
        entetes = lignes[0]
        lignes = lignes[1:]
    else:
        entetes = ENTETES_HISTORIQUE

    # ═══ 3. Ajouter la nouvelle ligne ═══
    lignes.append(nouvelle_ligne)

    # ═══ 4. Trier par Date archive (desc) puis Heure archive (desc) ═══
    def cle_tri(l):
        date = l[0] if len(l) > 0 else ''
        heure = l[3] if len(l) > 3 else ''
        try:
            j, m, a = date.split('/')
            return f"{a}-{m}-{j} {heure}"
        except Exception:
            return ''

    lignes.sort(key=cle_tri, reverse=True)

    # ═══ 5. Écrire (en-têtes + lignes triées) ═══
    with open(
        chemin_csv, mode='w', newline='', encoding='utf-8-sig'
    ) as f:
        writer = csv.writer(f, delimiter=';')
        writer.writerow(entetes)
        writer.writerows(lignes)

def _fusionner_csv_temp(chemin_csv):
    """
    Fusionne le fichier _temp avec le CSV principal
    si le CSV principal n'est plus verrouillé (Excel fermé).

    Re-tri automatiquement après fusion.
    """
    chemin_temp = chemin_csv.replace('.csv', '_temp.csv')

    if not os.path.exists(chemin_temp):
        return

    # ═══ Essayer d'ouvrir le CSV principal en écriture ═══
    try:
        with open(
            chemin_csv, mode='a', newline='', encoding='utf-8-sig'
        ) as f:
            pass

        print(
            f"[PAD] Fusion de {os.path.basename(chemin_temp)} "
            f"→ CSV principal"
        )

        # ═══ Lire TOUTES les lignes (principal + temp) ═══
        lignes = []

        if os.path.exists(chemin_csv):
            with open(
                chemin_csv, mode='r', encoding='utf-8-sig'
            ) as f:
                reader = csv.reader(f, delimiter=';')
                for l in reader:
                    if l:
                        lignes.append(l)

        with open(
            chemin_temp, mode='r', encoding='utf-8-sig'
        ) as f:
            reader = csv.reader(f, delimiter=';')
            for l in reader:
                if l:
                    lignes.append(l)

        # ═══ Retirer les en-têtes en double ═══
        entetes = ENTETES_HISTORIQUE
        data = [l for l in lignes if l != ENTETES_HISTORIQUE]

        # ═══ Trier ═══
        def cle_tri(l):
            date = l[0] if len(l) > 0 else ''
            heure = l[3] if len(l) > 3 else ''
            try:
                j, m, a = date.split('/')
                return f"{a}-{m}-{j} {heure}"
            except Exception:
                return ''

        data.sort(key=cle_tri, reverse=True)

        # ═══ Écrire ═══
        with open(
            chemin_csv, mode='w', newline='', encoding='utf-8-sig'
        ) as f:
            writer = csv.writer(f, delimiter=';')
            writer.writerow(entetes)
            writer.writerows(data)

        os.remove(chemin_temp)
        print(f"[PAD] Fichier _temp fusionné et trié")

    except PermissionError:
        pass

    except Exception as e:
        print(f"[PAD] Erreur fusion : {e}")

# ═══════════════════════════════════════════════════
# 6. EXPORTER L'HISTORIQUE EN EXCEL
# ═══════════════════════════════════════════════════
def exporter_historique_excel():
    """
    Lit le CSV et génère un fichier Excel .xlsx
    dans le dossier archives/.
    """
    import openpyxl
    from openpyxl.styles import (
        Font, PatternFill, Alignment, Border, Side
    )
    from openpyxl.utils import get_column_letter

    dossier_archives = os.path.join(
        settings.PAD_LOCAL_PATH,
        DOSSIER_ARCHIVES
    )
    chemin_csv = os.path.join(dossier_archives, FICHIER_HISTORIQUE)
    chemin_xlsx = os.path.join(dossier_archives, FICHIER_EXCEL)

    if not os.path.exists(chemin_csv):
        return None

    # ═══ 1. Lire le CSV ═══
    lignes = []
    with open(chemin_csv, mode='r', encoding='utf-8-sig') as f:
        reader = csv.reader(f, delimiter=';')
        for ligne in reader:
            if ligne:
                lignes.append(ligne)

    if not lignes:
        return None

    # ═══ 2. Créer le classeur Excel ═══
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Historique Archives'

    # ═══ 3. Styles ═══
    title_font = Font(
        name='Calibri', size=16, bold=True, color='007A4D'
    )
    header_font = Font(
        name='Calibri', size=11, bold=True, color='FFFFFF'
    )
    header_fill = PatternFill(
        start_color='007A4D', end_color='007A4D', fill_type='solid'
    )
    cell_font = Font(name='Calibri', size=10)
    thin_border = Border(
        left=Side(style='thin', color='CCCCCC'),
        right=Side(style='thin', color='CCCCCC'),
        top=Side(style='thin', color='CCCCCC'),
        bottom=Side(style='thin', color='CCCCCC'),
    )
    center_align = Alignment(horizontal='center', vertical='center')
    left_align = Alignment(horizontal='left', vertical='center')

    # ═══ 4. Titre ═══
    nb_colonnes = len(lignes[0])
    ws.merge_cells(
        start_row=1, start_column=1,
        end_row=1, end_column=nb_colonnes
    )
    ws.cell(row=1, column=1).value = (
        'RADIO TSIRY — Historique des Archives'
    )
    ws.cell(row=1, column=1).font = title_font
    ws.cell(row=1, column=1).alignment = center_align
    ws.row_dimensions[1].height = 30

    # ═══ 5. En-têtes (ligne 3) ═══
    row_start = 3
    for col_idx, valeur in enumerate(lignes[0], start=1):
        cell = ws.cell(row=row_start, column=col_idx, value=valeur)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_align
        cell.border = thin_border
    ws.row_dimensions[row_start].height = 22

    # ═══ 5bis. Trier les données par date + heure archive (desc) ═══
    donnees = lignes[1:]  # sans en-têtes

    def cle_tri(ligne):
        # Structure :
        #   ligne[0] = Date archive (jj/mm/aaaa)
        #   ligne[1] = Date diffusion
        #   ligne[2] = Heure diffusion
        #   ligne[3] = Heure archive
        date = ligne[0] if len(ligne) > 0 else ''
        heure = ligne[3] if len(ligne) > 3 else ''
        try:
            j, m, a = date.split('/')
            return f"{a}-{m}-{j} {heure}"
        except Exception:
            return ''

    donnees = sorted(donnees, key=cle_tri, reverse=True)

    # ═══ 6. Données ═══
    for row_offset, ligne in enumerate(donnees, start=1):
        row_num = row_start + row_offset
        for col_idx, valeur in enumerate(ligne, start=1):
            cell = ws.cell(row=row_num, column=col_idx, value=valeur)
            cell.font = cell_font
            cell.border = thin_border
            # Colonnes centrées : Date archive, Date diffusion,
            # Heure diffusion, Heure archive, Téléphone
            if col_idx in (1, 2, 3, 4, 6):
                cell.alignment = center_align
            else:
                cell.alignment = left_align

    # ═══ 7. Largeur des colonnes ═══
    largeurs = [14, 14, 20, 16, 14, 14, 40, 55]
    for i, largeur in enumerate(largeurs[:nb_colonnes], start=1):
        ws.column_dimensions[get_column_letter(i)].width = largeur

    # ═══ 8. Sauvegarder ═══
    try:
        wb.save(chemin_xlsx)
        return chemin_xlsx
    except PermissionError:
        # Le fichier est ouvert dans Excel
        # → Sauvegarder dans un fichier avec suffixe "_new"
        try:
            chemin_new = chemin_xlsx.replace(
                '.xlsx', '_new.xlsx'
            )
            wb.save(chemin_new)
            print(
                f"[PAD] Excel ouvert — sauvegardé dans : "
                f"{os.path.basename(chemin_new)}"
            )
            return chemin_new
        except Exception as e:
            print(f"[PAD] Impossible d'écrire l'Excel : {e}")
            return None