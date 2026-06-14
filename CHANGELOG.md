# Changelog

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Modifié
- **`README.md` mis à jour** pour refléter l'ensemble des changements : entité Entreprise
  singleton et navigation en cascade, critères de sélection et évaluations personnalisées,
  champs « Spécificités du candidat », rendu/édition markdown, résumé d'entretien dans la
  langue de l'UI, cinq langues d'interface (FR/EN/ET/DE/NL), nouveaux endpoints et
  arborescence modulaire (modèles backend en package, hooks de formulaire côté frontend).
- Le **sélecteur de langue** est déplacé du coin supérieur droit de la page vers le **bas du
  volet latéral gauche** (sidebar).

### Ajouté
- **Pondérations du score global configurables par poste.** Le tableau de bord propose un
  panneau de réglage (curseurs 0–3) pour ajuster l'importance de chacun des 4 critères et,
  globalement, du groupe d'évaluations personnalisées. Le score global devient une **moyenne
  pondérée** (un poids ne compte que si le critère est renseigné, donc un score manquant ne
  pénalise pas) ; les évals perso sont d'abord moyennées puis pondérées une seule fois pour ne
  pas avantager un candidat très évalué. Les poids sont **persistés sur la Position** (nouveau
  champ `score_weights`, migration SQLite additive automatique) et le classement se recalcule en
  direct pendant le réglage. Par défaut tous les poids valent 1 (comportement inchangé).
- **Tableau de bord de résultats par poste** (`/positions/:id/dashboard`) pour comparer les
  candidats et faciliter la décision. Trois visualisations : (1) un **classement** trié sur un
  **score global** (moyenne des 4 critères + évaluations personnalisées) avec badge coloré
  (vert ≥7 / ambre / rouge) et mini-barres par critère ; (2) un **radar** des forces/faiblesses
  d'un candidat ; (3) une **comparaison côte à côte de 2 candidats** (radar superposé, barres
  par critère, résumés et évaluations en regard). Accessible depuis un bouton **« Tableau de
  bord »** sur la page d'un poste. Nouvel endpoint agrégé `GET /positions/{id}/candidates/scores`
  et ajout de la dépendance `recharts`.
- **Traductions estonienne (et), allemande (de) et néerlandaise (nl)** ajoutées en plus du
  français et de l'anglais. Le **sélecteur de langue** affiche désormais l'ensemble des langues
  prises en charge et détecte la langue active de manière robuste (gestion des variantes
  régionales type `en-US`).
- **Navigation en cascade par sidebar** (Entreprise → Postes → Candidats) en remplacement
  de la navigation par étapes en haut de page. Une **sidebar latérale persistante** propose
  deux sections : **1 · Entreprise** et **2 · Postes** (la section Postes reste active sur les
  pages de détail d'un poste). En mobile, la sidebar se replie en barre horizontale en haut.
- **Entité Entreprise (singleton)** : la description d'entreprise et sa génération par IA
  vivent désormais dans une **page Entreprise dédiée** (`/company`), partagée par tous les
  postes, au lieu d'être dupliquée sur chaque poste. Nouveaux endpoints `GET /company`,
  `PUT /company` et `POST /company/generate`. La racine `/` redirige vers `/company`.
- Bouton **« Voir le prompt »** sur la carte du résumé d'entretien : il affiche, dans
  une modale en lecture seule et rendu en markdown, le prompt complet (prompt système
  + message utilisateur) reconstruit à partir des données enregistrées — soit ce qui
  sera envoyé à l'IA lors du prochain **Régénérer**. Nouvel endpoint en lecture seule
  `GET /candidates/{id}/interview/summary/prompt` (paramètre `lang`).

### Modifié
- **Refactor structurel (isolation de compétence, fichiers < 300 lignes)** : aucun fichier
  applicatif ne dépasse désormais 300 lignes. Les pages volumineuses ont été découpées —
  une compétence par fichier — sans changement de comportement :
  - `routes/InterviewPage.tsx` (372 → ~70) : logique et état extraits dans
    `components/interview/useInterviewForm.ts`, et UI répartie en cartes dédiées
    (`InterviewContextCards`, `InterviewScoresCard`, `CustomEvaluations`, `InterviewSummaryCard`),
    constantes/types dans `criteria.ts`.
  - `routes/CandidatePage.tsx` (364 → ~115) : `components/candidate/useCandidateForm.ts`,
    `schema.ts`, `CandidateIdentityCard`, `CandidateCvCard`.
  - `routes/PositionDetail.tsx` (256 → ~120) : `components/position/usePositionForm.ts`
    et `CandidatesCard`.
  - Backend : `app/models.py` (286) éclaté en package `app/models/` (un module par entité :
    `common`, `company`, `position`, `candidate`, `cv`, `interview`, `aggregates`), avec
    ré-export complet dans `__init__.py` — les imports `from app.models import X` restent
    inchangés.
  - **Lint propre (`eslint .` → 0 erreur)** : la synchronisation des données serveur vers
    l'état de formulaire local (pages Entreprise/Poste/Entretien) se fait désormais en phase
    de rendu via une valeur précédente suivie, au lieu d'un `useEffect` (règle
    `react-hooks/set-state-in-effect`) ; les constantes `*Variants` non utilisées hors de
    leur fichier ne sont plus exportées par `ui/button`, `ui/badge`, `ui/tabs`
    (règle `react-refresh/only-export-components`).
- **Sidebar collante** : son contenu reste visible au défilement (sticky en haut sur
  desktop). Le **sélecteur de langue** est désormais épinglé en haut à droite du viewport
  (position fixe) au lieu d'être en bas de la sidebar.
- **Page détail du poste** allégée : l'URL et la présentation de l'entreprise ont migré
  vers la page Entreprise. Le poste ne contient plus que la source de l'annonce + génération
  IA (présentation du poste uniquement), la présentation du poste, les critères de sélection
  et la liste des candidats. Le contexte d'entretien lit la présentation d'entreprise depuis
  le singleton Entreprise.
- **Page détail du poste** réorganisée pour la lisibilité : la configuration (source de
  l'annonce, génération) et chacune des sections générées — présentation du poste, critères
  de sélection — sont désormais présentées dans des **cartes distinctes** au lieu d'un seul
  bloc. Le titre de chaque section sert d'en-tête de carte (le label redondant de l'éditeur
  markdown est masqué via une nouvelle prop `hideLabel`).
- Le **résumé d'entretien** généré par l'IA s'appuie désormais explicitement sur les
  **critères de sélection** du poste : lorsque la position en définit, le prompt
  demande une section dédiée évaluant le candidat critère par critère, suivie d'une
  recommandation globale (avis go / no-go nuancé). Les critères étaient déjà transmis
  au contexte ; c'est l'instruction d'en faire une évaluation argumentée qui est ajoutée.
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
