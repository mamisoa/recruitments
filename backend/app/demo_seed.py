"""Demo / Example mode seeding.

When ``SEED_DEMO=1`` (see ``settings.seed_demo``), populate an *empty* database with
fictional-but-realistic data so the app looks like a real recruitment in progress —
useful for screenshots / blog material. Strictly opt-in and idempotent:

* It never runs unless the flag is set, so the real instance is never touched.
* It bails out if any ``Position`` already exists, so restarting the demo container
  doesn't duplicate anything (reset with ``docker compose ... down -v``).

Everything (company, the single open position, the 10 candidates with their interviews
and CV files) is generated here in code — no extra dependency. CVs are rendered to
``.pdf`` files (a tiny hand-built PDF, WinAnsi/Helvetica) and written into the upload
dir exactly like a real ``application/pdf`` upload.

The candidates form an international pool: their free-text fields (profile summary,
interview notes, interview summary) rotate through the app's five UI languages
(et, nl, de, fr, en) so screenshots naturally showcase the multilingual context.
"""

from __future__ import annotations

import os
import uuid
from datetime import date

from sqlmodel import Session, select

from app.config import settings
from app.db import engine
from app.models import (
    Candidate,
    Company,
    CustomEvaluation,
    CvFile,
    Interview,
    Position,
)

# --- Company (fictional — clearly distinct from any real company) ----------- #

COMPANY_NAME = "Transmind AI"
COMPANY_URL = "https://transmind.example"
COMPANY_PRESENTATION = """\
## Transmind AI

**Transmind AI** is a Tallinn-based applied-AI startup building **decision copilots** for
regulated industries (healthcare, insurance, public sector). Our platform turns dense,
domain-specific documents into auditable, source-grounded answers that professionals can
actually trust.

### Mission
Make expert knowledge instantly accessible and verifiable — *without* the hallucinations.
Every answer the product produces links back to the exact passage it came from.

### Product
- **Transmind Copilot** — a retrieval-grounded assistant embedded in our customers' tools.
- **Transmind Studio** — a no-code workspace to curate knowledge bases and evaluation sets.
- **Transmind Eval** — continuous, human-in-the-loop quality monitoring.

### Team & culture
A 24-person team across **Tallinn, Amsterdam and Berlin**, working remotely-first in English.
We value **rigor over hype**, **shipping over slideware**, and **kindness over ego**.

### Funding
Seed round closed in 2025 (€4.2M), led by a European deep-tech fund.
"""

# --- Position (one open role, all 10 candidates) ---------------------------- #

POSITION_TITLE = "Senior AI Solutions Engineer"
POSITION_JOB_SOURCE = """\
Senior AI Solutions Engineer — Transmind AI (remote, EU timezones)

You will partner with our enterprise customers to design, build and ship retrieval-grounded
AI assistants on top of the Transmind platform. You sit between product, engineering and the
customer: scoping use cases, building evaluation sets, tuning retrieval and prompts, and
owning quality in production.

What you'll do
- Lead technical discovery and solution design with healthcare / insurance customers.
- Build and tune RAG pipelines (chunking, retrieval, reranking, grounded generation).
- Define evaluation metrics and run human-in-the-loop quality reviews.
- Be the customer's trusted technical voice; turn feedback into product requirements.

What we look for
- Strong Python; hands-on with LLM APIs and a vector store.
- Comfort talking to non-technical stakeholders in clear language.
- Pragmatism: you ship, measure, and iterate.
- Working proficiency in English; an additional EU language is a real plus.
"""
POSITION_JOB_PRESENTATION = """\
## Senior AI Solutions Engineer

**Remote · EU timezones · full-time**

You are the bridge between Transmind's platform and the customers who depend on it. You design
and ship **retrieval-grounded assistants**, own their **quality in production**, and translate
messy real-world feedback into a better product.

### Responsibilities
- Lead technical discovery & solution design with regulated-industry customers.
- Build and tune **RAG pipelines** end to end: chunking → retrieval → reranking → grounded answers.
- Define **evaluation metrics** and run human-in-the-loop quality reviews.
- Be the customer's trusted technical partner.

### What we look for
- Strong **Python**, hands-on with **LLM APIs** and a **vector store**.
- Clear communication with non-technical stakeholders.
- A bias for **shipping, measuring, iterating**.
- Working **English**; an extra EU language is a real plus.
"""
POSITION_SELECTION_CRITERIA = """\
## Selection criteria

| Criterion | What "great" looks like |
| --- | --- |
| **Fluency** | Explains trade-offs clearly; structured, calm under questioning. |
| **Professionalism** | Reliable, prepared, owns outcomes; good references. |
| **Competence** | Real RAG/LLM depth; can whiteboard an eval strategy on the spot. |
| **Languages** | Fluent English; bonus for ET / NL / DE / FR. |
| **Custom** | Culture fit (rigor over hype) + a passing take-home test. |

> Competence and professionalism are weighted higher than the rest for this role.
"""
# Non-neutral weights to showcase the configurable global-score feature.
POSITION_SCORE_WEIGHTS = {
    "fluence": 1.0,
    "professionnalisme": 1.5,
    "competences": 2.0,
    "langues": 1.0,
    "custom": 1.0,
}


# --- Candidates ------------------------------------------------------------- #
# Each entry carries identity, a CV body (written to a .txt file), a profile summary,
# and a full interview. Free-text fields are written in the candidate's own language
# (lang) to exercise the app's i18n across screenshots.

CANDIDATES: list[dict] = [
    {
        "lang": "et",
        "nom": "Tamm",
        "prenom": "Kristjan",
        "ddn": date(1989, 3, 14),
        "email": "kristjan.tamm@example.com",
        "telephone": "+372 5123 4567",
        "isikukood": "38903142718",
        "statut_marital": "Abielus",
        "statut_etudiant": False,
        "cv": """\
KRISTJAN TAMM
Senior ML Engineer — Tallinn, Estonia

KOKKUVÕTE
8 aastat kogemust masinõppe ja NLP-süsteemide ehitamisel. Viimased 3 aastat
RAG-süsteemide ja vektorotsingu kallal reguleeritud valdkondades.

KOGEMUS
- Lead ML Engineer, Veriff (2021–2025): dokumenditöötluse RAG-torustik, hindamisraamistik.
- ML Engineer, Pipedrive (2018–2021): soovitussüsteemid, A/B-testimine.

OSKUSED
Python, PyTorch, FAISS, pgvector, FastAPI, LLM API-d (OpenAI, Anthropic).

KEELED
Eesti (emakeel), inglise (C1), vene (B2).
""",
        "profile_summary": """\
**Tugev tehniline profiil.** 8 aastat ML/NLP kogemust, viimased 3 aastat täpselt meie
valdkonnas (RAG, vektorotsing, reguleeritud andmed). Veriffis juhtis dokumenditöötluse
torustikku ja ehitas hindamisraamistiku — täpselt see, mida see roll vajab.
""",
        "interview": {
            "score_fluence": 8,
            "note_fluence": "Selge ja struktureeritud. Selgitab kompromisse rahulikult.",
            "score_professionnalisme": 9,
            "note_professionnalisme": "Väga ettevalmistatud, tugevad soovitajad Veriffist.",
            "score_competences": 9,
            "note_competences": "Joonistas tahvlile terve hindamisstrateegia. Sügav RAG-teadmine.",
            "score_langues": 8,
            "note_langues": "Inglise C1, eesti emakeel, vene B2.",
            "attentes_candidat": "Tehniline juhtroll, kaugtöö, ~€75–85k.",
            "specificites_candidat": "Saadaval 1 kuu etteteatamisega.",
            "interview_summary": """\
**Soovitus: tugev jah.** Kristjan on rolli üks tugevamaid kandidaate — sügav RAG-kogemus
reguleeritud valdkonnas, selge suhtleja, suurepärased soovitajad. Ainus väike risk on
juhtimiskogemuse ulatus, kuid tehniline tase kompenseerib selle.
""",
            "custom": [
                {"title": "Culture fit", "score": 9, "note": "« Rigor over hype » kehastunud."},
                {"title": "Take-home test", "score": 8, "note": "Puhas lahendus, head testid."},
            ],
        },
    },
    {
        "lang": "nl",
        "nom": "de Vries",
        "prenom": "Sanne",
        "ddn": date(1992, 7, 2),
        "email": "sanne.devries@example.com",
        "telephone": "+31 6 1234 5678",
        "isikukood": None,
        "statut_marital": "Samenwonend",
        "statut_etudiant": False,
        "cv": """\
SANNE DE VRIES
AI Solutions Engineer — Amsterdam, Netherlands

PROFIEL
6 jaar ervaring met het bouwen van LLM-gestuurde producten voor verzekeraars en banken.
Sterk in stakeholdermanagement en het vertalen van vage wensen naar werkende oplossingen.

ERVARING
- Solutions Engineer, Adyen (2020–2025): klantgerichte AI-integraties, evaluatiesets.
- Data Scientist, ING (2019–2020): risicomodellen, NLP voor klantenservice.

VAARDIGHEDEN
Python, LangChain, Weaviate, FastAPI, prompt-evaluatie.

TALEN
Nederlands (moedertaal), Engels (C2), Duits (B1).
""",
            "profile_summary": """\
**Sterke klantgerichte profiel.** 6 jaar in fintech/verzekeringen, precies onze doelmarkt.
Uitstekend in stakeholdermanagement — vertaalt vage wensen naar werkende RAG-oplossingen.
Iets minder diepe ML-fundamenten dan sommige anderen, maar zeer pragmatisch.
""",
        "interview": {
            "score_fluence": 9,
            "note_fluence": "Uitstekende communicatie, zeer gestructureerd.",
            "score_professionnalisme": 8,
            "note_professionnalisme": "Goed voorbereid, professioneel, duidelijke verwachtingen.",
            "score_competences": 7,
            "note_competences": "Solide RAG-ervaring; iets minder diep in retrieval-tuning.",
            "score_langues": 8,
            "note_langues": "Engels C2, Nederlands moedertaal, Duits B1.",
            "attentes_candidat": "Hybride werk (Amsterdam), ~€70k, groeipad naar lead.",
            "specificites_candidat": "Opzegtermijn van 1 maand.",
            "interview_summary": """\
**Aanbeveling: ja.** Sanne is een sterke, klantgerichte engineer met precies de juiste
domeinervaring. Communicatie is uitstekend. Lichte zorg over de diepte van retrieval-tuning,
maar dat is goed te ontwikkelen. Past goed in het team.
""",
            "custom": [
                {"title": "Culture fit", "score": 9, "note": "Pragmatisch, vriendelijk, ego-loos."},
                {"title": "Take-home test", "score": 7, "note": "Werkend, iets minder testdekking."},
            ],
        },
    },
    {
        "lang": "de",
        "nom": "Schneider",
        "prenom": "Lukas",
        "ddn": date(1987, 11, 23),
        "email": "lukas.schneider@example.com",
        "telephone": "+49 151 2345 6789",
        "isikukood": None,
        "statut_marital": "Verheiratet",
        "statut_etudiant": False,
        "cv": """\
LUKAS SCHNEIDER
Staff Engineer, ML Platforms — Berlin, Germany

PROFIL
10 Jahre Erfahrung im Aufbau von ML-Infrastruktur und produktionsreifen NLP-Systemen.
Schwerpunkt auf Skalierung, Evaluierung und Zuverlässigkeit.

ERFAHRUNG
- Staff Engineer, Zalando (2019–2025): ML-Plattform, RAG für interne Suche.
- Senior Engineer, SoundCloud (2015–2019): Empfehlungssysteme.

KENNTNISSE
Python, Go, Kubernetes, Qdrant, Triton, LLM-Serving, Evaluierungspipelines.

SPRACHEN
Deutsch (Muttersprache), Englisch (C1), Französisch (A2).
""",
            "profile_summary": """\
**Sehr erfahrenes Profil.** 10 Jahre ML-Infrastruktur, Staff-Level bei Zalando. Stark in
Skalierung, Serving und Evaluierung. Eher Plattform- als kundenorientiert — die größte Frage
ist, ob ihm die kundennahe Solutions-Rolle liegt. Tiefe Technik ist unbestreitbar.
""",
        "interview": {
            "score_fluence": 7,
            "note_fluence": "Präzise, aber eher technisch als kundenorientiert.",
            "score_professionnalisme": 9,
            "note_professionnalisme": "Sehr zuverlässig, Staff-Level-Reife, klare Struktur.",
            "score_competences": 10,
            "note_competences": "Außergewöhnliche Tiefe bei Serving, Evaluierung und Skalierung.",
            "score_langues": 7,
            "note_langues": "Englisch C1, Deutsch Muttersprache, Französisch A2.",
            "attentes_candidat": "Remote von Berlin, ~€90k, technische Tiefe statt Management.",
            "specificites_candidat": "Kündigungsfrist 3 Monate.",
            "interview_summary": """\
**Empfehlung: ja, mit Vorbehalt.** Technisch der stärkste Kandidat im Feld. Das einzige
Risiko ist die kundennahe Ausrichtung der Rolle — Lukas ist eher Plattform-Engineer. Wenn wir
ihm einen technisch tiefen Zuschnitt geben, ist er ein klarer Gewinn. Lange Kündigungsfrist.
""",
            "custom": [
                {"title": "Culture fit", "score": 7, "note": "Rigoros, aber etwas zurückhaltend."},
                {"title": "Take-home test", "score": 10, "note": "Makellos, vollständige Tests."},
            ],
        },
    },
    {
        "lang": "fr",
        "nom": "Laurent",
        "prenom": "Camille",
        "ddn": date(1994, 5, 9),
        "email": "camille.laurent@example.com",
        "telephone": "+33 6 12 34 56 78",
        "isikukood": None,
        "statut_marital": "Célibataire",
        "statut_etudiant": False,
        "cv": """\
CAMILLE LAURENT
Ingénieure IA — Paris, France

PROFIL
4 ans d'expérience sur des assistants conversationnels et des pipelines RAG.
Profil orienté produit, à l'aise avec les clients comme avec le code.

EXPÉRIENCE
- AI Engineer, Doctolib (2022–2025) : assistant interne RAG, jeux d'évaluation.
- Data Scientist, BlaBlaCar (2021–2022) : NLP, classification de tickets.

COMPÉTENCES
Python, LlamaIndex, pgvector, FastAPI, évaluation LLM, RGPD.

LANGUES
Français (langue maternelle), anglais (C1), espagnol (B1).
""",
            "profile_summary": """\
**Profil prometteur, orienté produit.** 4 ans d'expérience, dont du RAG en santé (Doctolib),
proche de notre domaine régulé. Très bonne aisance client. Moins de séniorité que d'autres,
mais une trajectoire rapide et une vraie sensibilité produit/conformité (RGPD).
""",
        "interview": {
            "score_fluence": 9,
            "note_fluence": "Excellente aisance, explique clairement, à l'écoute.",
            "score_professionnalisme": 8,
            "note_professionnalisme": "Préparée, attentes claires, bon suivi après l'entretien.",
            "score_competences": 7,
            "note_competences": "Bon RAG appliqué ; un peu moins de profondeur en retrieval avancé.",
            "score_langues": 8,
            "note_langues": "Anglais C1, français natif, espagnol B1.",
            "attentes_candidat": "Télétravail depuis Paris, ~€60k, montée en compétences.",
            "specificites_candidat": "Disponible sous 2 mois.",
            "interview_summary": """\
**Recommandation : oui.** Camille combine une vraie aisance client et une expérience RAG en
santé directement pertinente. Moins sénior que Kristjan ou Lukas, mais une progression rapide
et un excellent fit produit/conformité. Un bon pari à moyen terme.
""",
            "custom": [
                {"title": "Culture fit", "score": 9, "note": "Curieuse, humble, orientée impact."},
                {"title": "Test technique", "score": 7, "note": "Solution correcte, bien documentée."},
            ],
        },
    },
    {
        "lang": "en",
        "nom": "O'Brien",
        "prenom": "Niamh",
        "ddn": date(1990, 1, 27),
        "email": "niamh.obrien@example.com",
        "telephone": "+353 86 123 4567",
        "isikukood": None,
        "statut_marital": "Married",
        "statut_etudiant": False,
        "cv": """\
NIAMH O'BRIEN
AI Solutions Lead — Dublin, Ireland

SUMMARY
7 years building customer-facing AI in insurance and health-tech. Equally comfortable in a
sales-engineering call and a code review. Track record of shipping grounded assistants.

EXPERIENCE
- Solutions Lead, Intercom (2021–2025): RAG assistants, customer evaluation programs.
- ML Engineer, Aviva (2017–2021): NLP for claims, document extraction.

SKILLS
Python, Haystack, Pinecone, FastAPI, evaluation design, stakeholder management.

LANGUAGES
English (native), Irish (B1), French (A2).
""",
            "profile_summary": """\
**Excellent all-rounder.** 7 years of customer-facing AI in insurance/health — squarely our
market. Strong on both the sales-engineering and the hands-on sides, with real evaluation-design
experience. Slightly less raw ML depth than the platform engineers, but the closest fit to the
*solutions* shape of this role.
""",
        "interview": {
            "score_fluence": 10,
            "note_fluence": "Outstanding — crisp, persuasive, reads the room perfectly.",
            "score_professionnalisme": 9,
            "note_professionnalisme": "Highly prepared, excellent references, owns outcomes.",
            "score_competences": 8,
            "note_competences": "Strong applied RAG + evaluation design; less low-level depth.",
            "score_langues": 7,
            "note_langues": "Native English; some Irish and basic French.",
            "attentes_candidat": "Remote from Dublin, ~€80k, path to leading the SE team.",
            "specificites_candidat": "One month notice; open to occasional travel.",
            "interview_summary": """\
**Recommendation: strong yes.** Niamh is the best fit to the *solutions* nature of this role —
exceptional communication, real domain experience, and solid applied depth. The one gap is
low-level ML internals, which this role doesn't strictly need. A potential future SE lead.
""",
            "custom": [
                {"title": "Culture fit", "score": 9, "note": "Warm, rigorous, zero ego."},
                {"title": "Take-home test", "score": 8, "note": "Clean, well-tested, clear write-up."},
            ],
        },
    },
    {
        "lang": "et",
        "nom": "Saar",
        "prenom": "Mart",
        "ddn": date(1996, 9, 5),
        "email": "mart.saar@example.com",
        "telephone": "+372 5234 5678",
        "isikukood": "39609052731",
        "statut_marital": "Vallaline",
        "statut_etudiant": True,
        "cv": """\
MART SAAR
Junior ML Engineer / TalTech magistrant — Tallinn, Estonia

KOKKUVÕTE
2 aastat kogemust, lõpetan TalTechis andmeteaduse magistri. Entusiastlik, kiire õppija,
panustanud avatud lähtekoodiga RAG-projektidesse.

KOGEMUS
- Junior ML Engineer, Bolt (2023–2025, osakoormus): otsingu täiustamine.
- Praktikant, Starship Technologies (2022): arvutinägemine.

OSKUSED
Python, Hugging Face, Chroma, FastAPI, Git.

KEELED
Eesti (emakeel), inglise (B2), soome (B1).
""",
            "profile_summary": """\
**Andekas, kuid roheline.** 2 aastat kogemust + pooleliolev magister. Kiire õppija ja
avatud lähtekoodi panustaja, kuid selgelt junior-tasemel rolli jaoks, mis on määratletud
seniorina. Hea pikaajaline investeering, mitte kohene lahendus.
""",
        "interview": {
            "score_fluence": 6,
            "note_fluence": "Entusiastlik, kuid kohati laialivalguv vastustes.",
            "score_professionnalisme": 6,
            "note_professionnalisme": "Veidi kogenematu, kuid aus oma piiride suhtes.",
            "score_competences": 6,
            "note_competences": "Põhitõed olemas, sügavus puudub. Hea õppimisvõime.",
            "score_langues": 7,
            "note_langues": "Inglise B2, eesti emakeel, soome B1.",
            "attentes_candidat": "Paindlik (magistriõpe), ~€45k, mentorlus oluline.",
            "specificites_candidat": "Saadaval kohe, eelistab osalist kaugtööd.",
            "interview_summary": """\
**Soovitus: ei selle rolli jaoks.** Mart on andekas ja meeldiv, kuid seenioritase, mida see
roll nõuab, on praegu väljaspool tema ulatust. Tasub meeles pidada tulevase juuniori
ametikoha jaoks — potentsiaal on selgelt olemas.
""",
            "custom": [
                {"title": "Culture fit", "score": 8, "note": "Tagasihoidlik, õpihimuline."},
                {"title": "Take-home test", "score": 5, "note": "Töötab, kuid pinnapealne."},
            ],
        },
    },
    {
        "lang": "nl",
        "nom": "Jansen",
        "prenom": "Thijs",
        "ddn": date(1985, 4, 18),
        "email": "thijs.jansen@example.com",
        "telephone": "+31 6 9876 5432",
        "isikukood": None,
        "statut_marital": "Getrouwd",
        "statut_etudiant": False,
        "cv": """\
THIJS JANSEN
Engineering Manager / AI — Utrecht, Netherlands

PROFIEL
12 jaar ervaring, waarvan 4 als engineering manager. Sterk in mensen en proces; de laatste
jaren minder hands-on code, meer architectuur en stakeholders.

ERVARING
- Engineering Manager, Booking.com (2019–2025): AI-platformteam van 9 personen.
- Senior Engineer, TomTom (2013–2019): kaartdata-pipelines.

VAARDIGHEDEN
Python (roestig), systeemontwerp, teamleiding, stakeholdermanagement.

TALEN
Nederlands (moedertaal), Engels (C1), Duits (B2).
""",
            "profile_summary": """\
**Ervaren manager, maar mismatch.** 12 jaar ervaring, sterk in leiderschap en architectuur,
maar de laatste 4 jaar weinig hands-on. Deze rol is een hands-on IC-rol, geen managementrol.
Indrukwekkend cv, maar verkeerde vorm voor wat we nu zoeken.
""",
        "interview": {
            "score_fluence": 8,
            "note_fluence": "Vlot en zelfverzekerd, goede gesprekspartner.",
            "score_professionnalisme": 8,
            "note_professionnalisme": "Zeer professioneel, maar zoekt eigenlijk een managementrol.",
            "score_competences": 5,
            "note_competences": "Hands-on RAG-vaardigheden zijn verouderd; sterk in architectuur.",
            "score_langues": 8,
            "note_langues": "Engels C1, Nederlands moedertaal, Duits B2.",
            "attentes_candidat": "Leidinggevende rol, ~€95k — botst met deze IC-functie.",
            "specificites_candidat": "Opzegtermijn 2 maanden.",
            "interview_summary": """\
**Aanbeveling: nee.** Thijs is een capabele manager, maar deze vacature is een hands-on
individuele rol en zijn praktische RAG-vaardigheden zijn verouderd. Bovendien zoekt hij zelf
een leidinggevende positie. Een mismatch — eventueel relevant als we later een EM-rol openen.
""",
            "custom": [
                {"title": "Culture fit", "score": 7, "note": "Prettig, maar zoekt iets anders."},
                {"title": "Take-home test", "score": 4, "note": "Onvolledig, weinig recente praktijk."},
            ],
        },
    },
    {
        "lang": "de",
        "nom": "Weber",
        "prenom": "Lena",
        "ddn": date(1993, 12, 11),
        "email": "lena.weber@example.com",
        "telephone": "+49 160 9876 543",
        "isikukood": None,
        "statut_marital": "Ledig",
        "statut_etudiant": False,
        "cv": """\
LENA WEBER
NLP Engineer — München, Germany

PROFIL
5 Jahre Erfahrung mit NLP und LLM-Anwendungen, davon 2 Jahre im Gesundheitswesen.
Sorgfältig, evaluierungsgetrieben, mit Fokus auf Datenqualität.

ERFAHRUNG
- NLP Engineer, Siemens Healthineers (2022–2025): RAG für klinische Dokumentation.
- ML Engineer, Celonis (2020–2022): Prozess-NLP.

KENNTNISSE
Python, spaCy, Milvus, FastAPI, Evaluierung, klinische Daten.

SPRACHEN
Deutsch (Muttersprache), Englisch (C1), Italienisch (B1).
""",
            "profile_summary": """\
**Solides, domänennahes Profil.** 5 Jahre NLP, davon 2 im Gesundheitswesen (klinische RAG bei
Siemens Healthineers) — sehr relevant für unsere regulierte Zielgruppe. Sorgfältig und
evaluierungsgetrieben. Etwas weniger Kundenkontakt, aber starke fachliche Substanz.
""",
        "interview": {
            "score_fluence": 7,
            "note_fluence": "Klar und überlegt, etwas zurückhaltend, aber präzise.",
            "score_professionnalisme": 8,
            "note_professionnalisme": "Sehr sorgfältig und gut vorbereitet, glaubwürdig.",
            "score_competences": 8,
            "note_competences": "Starke klinische RAG- und Evaluierungserfahrung.",
            "score_langues": 7,
            "note_langues": "Englisch C1, Deutsch Muttersprache, Italienisch B1.",
            "attentes_candidat": "Remote von München, ~€72k, fachliche Weiterentwicklung.",
            "specificites_candidat": "Kündigungsfrist 2 Monate.",
            "interview_summary": """\
**Empfehlung: ja.** Lena bringt genau die domänennahe Substanz mit, die wir brauchen —
klinische RAG-Erfahrung und eine evaluierungsgetriebene Arbeitsweise. Etwas weniger
Kundenkontakt als Niamh oder Sanne, aber das lässt sich aufbauen. Verlässliche Wahl.
""",
            "custom": [
                {"title": "Culture fit", "score": 8, "note": "Gründlich, bescheiden, teamorientiert."},
                {"title": "Take-home test", "score": 8, "note": "Sauber, gute Evaluierungsmetriken."},
            ],
        },
    },
    {
        "lang": "fr",
        "nom": "Dubois",
        "prenom": "Hugo",
        "ddn": date(1991, 8, 30),
        "email": "hugo.dubois@example.com",
        "telephone": "+33 7 98 76 54 32",
        "isikukood": None,
        "statut_marital": "En couple",
        "statut_etudiant": False,
        "cv": """\
HUGO DUBOIS
Consultant IA freelance — Lyon, France

PROFIL
6 ans d'expérience, dont 3 en freelance sur des projets RAG et chatbots pour des PME.
Polyvalent, autonome, mais profils de missions parfois courts et hétérogènes.

EXPÉRIENCE
- Consultant IA indépendant (2022–2025) : 11 missions RAG / automatisation.
- Développeur backend, OVHcloud (2019–2022) : APIs, microservices.

COMPÉTENCES
Python, LangChain, Qdrant, FastAPI, intégrations, freelancing.

LANGUES
Français (langue maternelle), anglais (B2), allemand (A2).
""",
            "profile_summary": """\
**Polyvalent mais dispersé.** 6 ans dont 3 en freelance : large exposition RAG, mais des
missions courtes et hétérogènes, peu de profondeur sur un domaine. Autonome et débrouillard.
Le risque principal est l'adaptation à un poste salarié de long terme et focalisé.
""",
        "interview": {
            "score_fluence": 7,
            "note_fluence": "Bon contact, parfois trop commercial, manque de structure.",
            "score_professionnalisme": 6,
            "note_professionnalisme": "Autonome, mais parcours freelance morcelé, références mixtes.",
            "score_competences": 7,
            "note_competences": "Large mais peu profond ; beaucoup d'intégrations, peu d'éval rigoureuse.",
            "score_langues": 6,
            "note_langues": "Anglais B2, français natif, allemand A2.",
            "attentes_candidat": "TJM élevé ou ~€58k salarié, flexibilité maximale.",
            "specificites_candidat": "Disponible immédiatement.",
            "interview_summary": """\
**Recommandation : mitigé / non.** Hugo est débrouillard et a une large exposition RAG, mais
son parcours freelance morcelé et son manque de rigueur d'évaluation posent question pour un
poste salarié de long terme. À reconsidérer pour une mission ponctuelle plutôt qu'un CDI.
""",
            "custom": [
                {"title": "Culture fit", "score": 6, "note": "Sympathique mais profil plutôt solo."},
                {"title": "Test technique", "score": 6, "note": "Fonctionnel, peu de tests."},
            ],
        },
    },
    {
        "lang": "en",
        "nom": "Kowalski",
        "prenom": "Daniel",
        "ddn": date(1988, 6, 21),
        "email": "daniel.kowalski@example.com",
        "telephone": "+44 7700 900123",
        "isikukood": None,
        "statut_marital": "Single",
        "statut_etudiant": False,
        "cv": """\
DANIEL KOWALSKI
Senior Backend / AI Engineer — London, UK

SUMMARY
9 years backend engineering, last 3 focused on LLM-powered features at scale. Pragmatic,
reliable, strong on production quality and observability.

EXPERIENCE
- Senior Engineer, Monzo (2021–2025): RAG support assistant, eval + monitoring.
- Backend Engineer, Revolut (2016–2021): high-throughput services.

SKILLS
Python, TypeScript, pgvector, FastAPI, observability, production RAG.

LANGUAGES
English (C2), Polish (native), German (B1).
""",
            "profile_summary": """\
**Strong, production-minded profile.** 9 years backend with 3 years of production LLM features
at Monzo (RAG support assistant + monitoring). Pragmatic and reliable, with exactly the
ship-measure-iterate mindset the role asks for. A touch less customer-facing, but very solid.
""",
        "interview": {
            "score_fluence": 8,
            "note_fluence": "Clear, grounded, good at explaining production trade-offs.",
            "score_professionnalisme": 9,
            "note_professionnalisme": "Very reliable, strong references, owns quality end to end.",
            "score_competences": 9,
            "note_competences": "Excellent production RAG, eval and observability depth.",
            "score_langues": 8,
            "note_langues": "English C2, Polish native, German B1.",
            "attentes_candidat": "Remote from London, ~€85k, deep technical ownership.",
            "specificites_candidat": "Two months notice.",
            "interview_summary": """\
**Recommendation: yes.** Daniel pairs strong backend rigor with real production LLM experience
and a healthy obsession with evaluation and monitoring. Slightly less customer-facing than
Niamh, but a dependable, high-output engineer. Among the top of the field.
""",
            "custom": [
                {"title": "Culture fit", "score": 8, "note": "Pragmatic, low-ego, ships."},
                {"title": "Take-home test", "score": 9, "note": "Excellent — tested, observable, clean."},
            ],
        },
    },
]


def _build_cv_pdf(text: str) -> bytes:
    """Render plain CV text into a minimal single-page PDF (no dependency).

    Uses the base-14 Helvetica font with WinAnsiEncoding, so accented Latin text
    (õ ä ö ü é è à ç …) and common typography (— « » ' ') render correctly: the
    bytes are encoded as cp1252, which WinAnsiEncoding maps glyph-for-glyph.
    """
    # Soft-wrap long lines so they don't run off the page; CVs are short (1 page).
    lines: list[str] = []
    for raw in text.split("\n"):
        if len(raw) <= 95:
            lines.append(raw)
            continue
        cur = ""
        for word in raw.split(" "):
            if cur and len(cur) + len(word) + 1 > 95:
                lines.append(cur)
                cur = word
            else:
                cur = word if not cur else f"{cur} {word}"
        lines.append(cur)

    # Content stream: one text line per source line, 10pt Helvetica, 14pt leading.
    parts = [b"BT\n/F1 10 Tf\n14 TL\n50 800 Td\n"]
    for ln in lines:
        if ln.strip() == "":
            parts.append(b"T*\n")
            continue
        esc = ln.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        parts.append(b"(" + esc.encode("cp1252", "replace") + b") Tj T*\n")
    parts.append(b"ET")
    content = b"".join(parts)

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica "
        b"/Encoding /WinAnsiEncoding >>",
        b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n"
        + content + b"\nendstream",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets: list[int] = []
    for i, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += str(i).encode() + b" 0 obj\n" + body + b"\nendobj\n"

    xref_pos = len(out)
    size = len(objects) + 1
    out += b"xref\n0 " + str(size).encode() + b"\n0000000000 65535 f \n"
    for off in offsets:
        out += ("%010d 00000 n \n" % off).encode()
    out += (
        b"trailer\n<< /Size " + str(size).encode() + b" /Root 1 0 R >>\n"
        b"startxref\n" + str(xref_pos).encode() + b"\n%%EOF"
    )
    return bytes(out)


def _write_cv_pdf(prenom: str, nom: str, body: str) -> tuple[str, str, int]:
    """Render a CV body to a .pdf file, mirroring storage.save_upload conventions.

    Returns ``(original_name, stored_path, size_bytes)``. ``stored_path`` is absolute.
    """
    upload_dir = os.path.abspath(settings.upload_dir)
    os.makedirs(upload_dir, exist_ok=True)
    stored_path = os.path.join(upload_dir, f"{uuid.uuid4().hex}.pdf")
    data = _build_cv_pdf(body)
    with open(stored_path, "wb") as out:
        out.write(data)
    safe = f"{prenom}_{nom}_CV.pdf".replace(" ", "_").replace("'", "")
    return safe, stored_path, len(data)


def seed_demo() -> None:
    """Seed fictional demo data when SEED_DEMO=1 and the DB has no positions yet.

    No-op otherwise. Safe to call on every startup.
    """
    if not settings.seed_demo:
        return

    with Session(engine) as session:
        # Idempotence: if anything is already seeded, leave it alone.
        if session.exec(select(Position)).first() is not None:
            return

        # Company singleton (id=1) is created empty by _seed_company_singleton; fill it in.
        company = session.get(Company, 1)
        if company is None:  # defensive: create if somehow absent
            company = Company(id=1)
            session.add(company)
        company.name = COMPANY_NAME
        company.company_url = COMPANY_URL
        company.company_presentation = COMPANY_PRESENTATION

        position = Position(
            title=POSITION_TITLE,
            job_source=POSITION_JOB_SOURCE,
            job_is_url=False,
            job_presentation=POSITION_JOB_PRESENTATION,
            selection_criteria=POSITION_SELECTION_CRITERIA,
            score_weights=POSITION_SCORE_WEIGHTS,
        )
        session.add(position)
        session.flush()  # assign position.id

        for entry in CANDIDATES:
            candidate = Candidate(
                position_id=position.id,
                nom=entry["nom"],
                prenom=entry["prenom"],
                ddn=entry["ddn"],
                email=entry["email"],
                telephone=entry["telephone"],
                isikukood=entry["isikukood"],
                statut_marital=entry["statut_marital"],
                statut_etudiant=entry["statut_etudiant"],
                profile_summary=entry["profile_summary"],
            )
            session.add(candidate)
            session.flush()  # assign candidate.id

            iv = entry["interview"]
            interview = Interview(
                candidate_id=candidate.id,
                score_fluence=iv["score_fluence"],
                note_fluence=iv["note_fluence"],
                score_professionnalisme=iv["score_professionnalisme"],
                note_professionnalisme=iv["note_professionnalisme"],
                score_competences=iv["score_competences"],
                note_competences=iv["note_competences"],
                score_langues=iv["score_langues"],
                note_langues=iv["note_langues"],
                attentes_candidat=iv["attentes_candidat"],
                specificites_candidat=iv["specificites_candidat"],
                interview_summary=iv["interview_summary"],
                custom_evaluations=[CustomEvaluation(**c) for c in iv["custom"]],
            )
            session.add(interview)

            original_name, stored_path, size = _write_cv_pdf(
                entry["prenom"], entry["nom"], entry["cv"]
            )
            session.add(
                CvFile(
                    candidate_id=candidate.id,
                    original_name=original_name,
                    stored_path=stored_path,
                    content_type="application/pdf",
                    size_bytes=size,
                )
            )

        session.commit()
