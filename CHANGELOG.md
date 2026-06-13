# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- Rendu markdown des textes de la fiche d'entretien : les champs rédigés en
  markdown (présentation entreprise, présentation poste, résumé du profil
  candidat et résumé d'entretien) sont désormais affichés en HTML mis en forme
  et lisible pour le recruteur, via un nouveau composant réutilisable
  `Markdown` (basé sur `react-markdown` + `remark-gfm`).
- Bascule **Aperçu / Modifier** sur le résumé d'entretien : affichage formaté
  par défaut, repassage au champ éditable à la demande.
- Clés d'internationalisation `interview.edit` et `interview.preview` (FR/EN).
