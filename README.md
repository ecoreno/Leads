# AJM Courtage — site refondu (statique, prêt pour Netlify)

## Déployer
Glissez-déposez le dossier (ou le zip décompressé) dans Netlify, ou liez-le à votre dépôt Git.
Aucune étape de build : `netlify.toml` publie la racine telle quelle.

## Contenu
- `index.html` — accueil façon comparateur (onglets produits + code postal, bandeau d'engagements, étapes, produits, rappel, conseils, FAQ, contact)
- `devis.html` — devis en 3 étapes : choix de plusieurs besoins, besoins santé avec priorité sur 4 étoiles, coordonnées, récapitulatif
- 7 pages produit : `assurance-sante`, `prevoyance`, `assurance-auto`, `assurance-moto`, `assurance-chien-chat`, `assurance-habitation`, `assurance-emprunteur`
- `mentions-legales`, `confidentialite`, `cookies`, `404`
- `assets/` vos images et logo (logo détouré en PNG transparent, favicon, icônes)

## Formulaires
Les formulaires « devis » et « rappel » utilisent Netlify Forms (aucun serveur à écrire).
Après le premier déploiement : Netlify → Forms → activer les notifications e-mail.
Le champ `resume` de chaque demande contient un résumé lisible (besoins + priorités santé /4).
Hors Netlify (ouverture du fichier en local), l'envoi affiche un message d'erreur : c'est normal.

## À compléter avant la mise en ligne (obligations d'un courtier)
Repérez les commentaires `À COMPLÉTER` dans le pied de page (tous les fichiers) et `mentions-legales.html` :
n° ORIAS, garantie financière / RCP, coordonnées de l'ACPR et du médiateur de l'assurance,
adresse e-mail et téléphone de contact. Faites relire les pages légales par un juriste.
