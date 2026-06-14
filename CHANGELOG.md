# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Modifié
- Le **résumé d'entretien** généré par l'IA est désormais rédigé dans la langue de
  l'interface : français si l'UI est en français, anglais sinon (auparavant toujours
  en anglais). La langue courante est transmise au backend via un paramètre `lang`
  sur `POST /candidates/{id}/interview/summary/generate`, qui ajoute une consigne de
  langue au prompt.

### Corrigé
- Erreur 500 à la génération du résumé d'entretien
  (`POST /candidates/{id}/interview/summary/generate`) : le contexte IA lisait
  `candidate.age`, un champ calculé qui n'existe que sur le schéma de lecture, pas
  sur le modèle `Candidate` en base. L'âge est désormais calculé via `compute_age`
  à partir de `ddn`.
- Les modales d'édition markdown (`EditableMarkdown` : résumé du candidat,
  présentations et critères de sélection du poste) ne dépassent plus la hauteur
  de l'écran lorsque le texte est long. La modale est désormais bornée à la
  hauteur du viewport, l'en-tête et le bouton **Enregistrer** restent visibles,
  et seul le textarea défile en interne. Un plafond de hauteur + `overflow-y-auto`
  ont aussi été ajoutés au primitif `DialogContent` comme filet de sécurité.

### Modifié
- Le champ **« Résumé du candidat »** de la fiche candidat s'affiche désormais en
  markdown formaté (comme les présentations de la fiche du poste). Un bouton
  « Éditer » ouvre une modale pour modifier le texte brut, enregistré immédiatement
  via l'API (composant réutilisable `EditableMarkdown`).

### Ajouté
- Champ **« Critères de sélection »** dans la fiche du poste, sous les présentations
  entreprise et poste : champ markdown éditable (même composant et même édition par
  modale que les présentations), saisi manuellement (non produit par le bouton
  « Générer avec l'IA »). Persisté dans une nouvelle colonne `selection_criteria` de
  la table `position` (migration additive légère au démarrage) et intégré au contexte
  du résumé d'entretien généré par l'IA.
- Clé d'internationalisation `position.selectionCriteria` (FR/EN).
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
