# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- Rappel du **statut marital** et du **statut étudiant** du candidat dans la carte
  « Faits sur le candidat » de la fiche d'entretien (en plus du nom, prénom et
  âge déjà présents), ces informations étant utiles à la rédaction du contrat.
  Ces statuts (ainsi que l'âge) sont désormais aussi transmis au contexte du
  résumé d'entretien généré par l'IA.
- Clés d'internationalisation `common.yes` et `common.no` (FR/EN).
- Champ **« Spécificités du candidat »** dans la fiche d'entretien, placé sous
  « Attentes du candidat » : zone de texte libre (ex. *proche du centre ville*)
  pour des informations contextuelles. Persisté dans une nouvelle colonne
  `specificites_candidat` de la table `interview` (migration additive légère au
  démarrage) et intégré au contexte du résumé d'entretien généré par l'IA.
- Clés d'internationalisation `interview.specificites` et
  `interview.specificitesPlaceholder` (FR/EN).
- Évaluations personnalisées dans la fiche d'entretien : en plus des 4 critères
  fixes, le recruteur peut désormais ajouter autant d'évaluations libres qu'il
  le souhaite, chacune suivant le même schéma (intitulé + note sur curseur 0-10
  + remarques). Les items s'ajoutent et se suppriment dynamiquement, sont
  persistés dans une colonne JSON `custom_evaluations` de la table `interview`
  et alimentent le contexte du résumé d'entretien généré par l'IA.
- Clés d'internationalisation `interview.customEvaluations`,
  `interview.addEvaluation`, `interview.removeEvaluation` et
  `interview.evaluationTitlePlaceholder` (FR/EN).
- Migration additive légère au démarrage (`_run_light_migrations`) qui ajoute la
  colonne `custom_evaluations` aux bases SQLite existantes sans recréation.
- Rendu markdown des textes de la fiche d'entretien : les champs rédigés en
  markdown (présentation entreprise, présentation poste, résumé du profil
  candidat et résumé d'entretien) sont désormais affichés en HTML mis en forme
  et lisible pour le recruteur, via un nouveau composant réutilisable
  `Markdown` (basé sur `react-markdown` + `remark-gfm`).
- Bascule **Aperçu / Modifier** sur le résumé d'entretien : affichage formaté
  par défaut, repassage au champ éditable à la demande.
- Clés d'internationalisation `interview.edit` et `interview.preview` (FR/EN).
- Affichage markdown des présentations de la fiche du poste : la présentation de
  l'entreprise et la présentation du poste s'affichent désormais en HTML mis en
  forme (lecture) au lieu d'une grande zone de texte. Un bouton **« Éditer »**
  ouvre un modal pour modifier le texte brut et l'enregistrer immédiatement via
  l'API, grâce à un nouveau composant réutilisable `EditableMarkdown`.
- Clé d'internationalisation `common.edit` (FR/EN).
