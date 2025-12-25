# Backend RAG Data Flow Architecture

This document outlines the architecture and data flow for the RAG (Retrieval-Augmented Generation) system, specifically focusing on the integration between the Spring Boot Backend and the Python AI Service.

## Global Architecture Schema

The system uses a **Push-based RAG approach** where the backend pre-fetches relevant context from its own relational database and "pushes" it to the AI service, rather than the AI service retrieving data independently.

![RAG Architecture Diagram](./rag_architecture_diagram.png)

## Detailed Data Flow Explanation

The process follows a strictly orchestrated flow where the Spring Boot application acts as the "Controller" of information.

### 1. Request Handling (Spring Boot)
*   **EntryPoint**: The user sends a request to the `RagController` (`/api/rag/chat`).
*   **Authentication**: The controller first verifies the user's identity (Pharmacist, Supplier, or Generic User) via Spring Security.

### 2. Context Aggregation (`DatabaseQueryService`)
Instead of generic retrieval, the system builds a highly specific context based on the user's role and query intent.
*   **Intent Detection**: The service analyzes the user's prompt using keyword matching (e.g., "stock", "commande", "alerte") to decide what data is relevant.
*   **Role-Based Data Fetching**:
    *   **Pharmacist**: Fetches their specific stock, recent orders, and alerts from the `SQL Database` using standard Repositories (`MedicamentRepository`, `CommandeRepository`, etc.).
    *   **Supplier**: Fetches purely the products they supply and their related order history.
*   **Formatting**: The raw database entities are converted into human-readable strings (e.g., `"Medicament: Doliprane | Quantite: 50"`).

### 3. AI Interaction (`RagClient`)
*   The `RagClient` bundles the user's original prompt along with this curated list of strings into a single JSON payload.
*   It sends this payload to the Python service via HTTP POST.
*   **Key Field**: `external_context`. This field carries the real-time database data.

### 4. Generation (Python Service)
*   The `rag_server.py` receives the request.
*   **Constraint Checking**: It checks for the presence of `external_context`.
*   **Bypass**: Since `external_context` is provided, the Python server **skips internal retrieval** (like S3/Vector DB). It assumes the backend has provided all necessary information.
*   **Prompt Engineering**: It constructs a system prompt that includes the injected context and instructs the LLaMA model to answer based *only* on that provided information.
*   **Inference**: The LLaMA model generates a natural language response.

### 5. Response Delivery
*   The generated text is returned to the Spring Boot Client.
*   The Spring Boot Controller relays the final answer to the user.

---

## Où est le Machine Learning ?

Le ML est **entièrement dans `rag_server.py`** (service Python). Trois composants sont utilisés :

### ML par Source de Données

| Source | Sentence Transformers | FAISS | LLaMA 3.2 |
|--------|:---------------------:|:-----:|:---------:|
| **S3 seul** | ✅ Embeddings | ✅ Retrieval | ✅ Génération |
| **Spring Boot seul** | ❌ Non utilisé | ❌ Non utilisé | ✅ Génération |
| **Spring Boot + S3** | ✅ Embeddings | ✅ Retrieval | ✅ Génération |

---

### Flux S3 (Retrieval complet)
```
Question → [Sentence Transformer] → [FAISS Search] → Top-K Chunks → [LLaMA] → Réponse
```
- **Embeddings** : Convertit la question en vecteur (`all-MiniLM-L6-v2`)
- **FAISS** : Trouve les chunks similaires dans le CSV indexé
- **LLaMA** : Génère la réponse à partir du contexte récupéré

---

### Flux Combiné Spring Boot + S3 (Recommandé)
```
Question + Contexte SQL → [+ FAISS Search] → Contexte Enrichi → [LLaMA] → Réponse
```
- **Spring Boot** : Fournit les données temps réel (stock, commandes, alertes)
- **S3/FAISS** : Ajoute les informations médicales détaillées (indications, posologie)
- **LLaMA** : Génère une réponse complète avec les deux sources

> [!TIP]
> Ce flux combiné permet de répondre à des questions comme : *"Quels médicaments ai-je en stock pour le diabète et comment les utiliser ?"*

---

### Composants ML

| Composant | Modèle | Rôle |
|-----------|--------|------|
| **LLM** | `meta-llama/Llama-3.2-3B-Instruct` | Génération de texte (toujours actif) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` | Vectorisation (S3) |
| **Vector Search** | FAISS (`IndexFlatL2`) | Recherche par similarité (S3) |

> [!NOTE]
> Le backend Spring Boot ne contient **aucun code ML**. Il collecte les données SQL et les transmet au service Python.

---

## Questions Supportées par le Chatbot

Le système RAG peut répondre aux questions basées sur le fichier CSV `medicaments_maroc.csv` contenant **5000+ médicaments marocains**.

### ✅ Questions avec Bonnes Réponses

#### 1. Maladies et Pathologies
| Question exemple | Données utilisées |
|------------------|-------------------|
| "Quel médicament pour le diabète de type 2 ?" | `Indication(s)` |
| "Traitement pour l'hypertension artérielle" | `Indication(s)`, `Classe thérapeutique` |
| "Médicament contre la polyarthrite rhumatoïde" | `Indication(s)` |
| "Traitement de l'ostéoporose" | `Indication(s)` |
| "Médicament pour l'asthme persistant" | `Indication(s)` |
| "Traitement du cancer de la prostate" | `Indication(s)` |
| "Médicament pour la schizophrénie" | `Indication(s)` |
| "Traitement de l'épilepsie" | `Indication(s)` |

#### 2. Infections
| Question exemple | Données utilisées |
|------------------|-------------------|
| "Antibiotique pour infection urinaire" | `Indication(s)`, `Classe thérapeutique` |
| "Traitement pour la pneumonie" | `Indication(s)` |
| "Médicament contre la sinusite bactérienne" | `Indication(s)` |
| "Antifongique pour candidose" | `Indication(s)`, `Composition` |
| "Antiviral pour le zona" | `Indication(s)` |
| "Traitement de l'otite moyenne" | `Indication(s)` |

#### 3. Allergies et Rhinites
| Question exemple | Données utilisées |
|------------------|-------------------|
| "Antihistaminique pour allergie" | `Classe thérapeutique` |
| "Traitement de la rhinite allergique" | `Indication(s)` |
| "Médicament contre l'urticaire chronique" | `Indication(s)` |
| "Traitement pour le rhume des foins" | `Indication(s)` |

#### 4. Douleurs et Inflammations
| Question exemple | Données utilisées |
|------------------|-------------------|
| "Anti-inflammatoire pour arthrose" | `Indication(s)`, `Classe thérapeutique` |
| "Antalgique pour douleurs post-opératoires" | `Indication(s)` |
| "Traitement des douleurs cancéreuses" | `Indication(s)` |
| "Médicament pour les contractures musculaires" | `Indication(s)` |

#### 5. Questions sur les Médicaments
| Question exemple | Données utilisées |
|------------------|-------------------|
| "Prix du Doliprane au Maroc" | `Nom`, `Prix (DHS)` |
| "Posologie de l'amoxicilline" | `Posologies et mode d'administration` |
| "Contre-indications du paracétamol" | `Contres-indication(s)` |
| "Composition de l'Augmentin" | `Composition` |
| "Quel est le générique de X ?" | `Princeps`, `Nom` |

#### 6. Questions Pédiatriques
| Question exemple | Données utilisées |
|------------------|-------------------|
| "Médicament pour enfant de 2 ans avec fièvre" | `Age minimal d'utilisation`, `Indication(s)` |
| "Sirop antibiotique pour enfant" | `Présentation`, `Age minimal` |
| "À partir de quel âge peut-on donner X ?" | `Age minimal d'utilisation` |

#### 7. Grossesse et Allaitement
| Question exemple | Données utilisées |
|------------------|-------------------|
| "Médicament autorisé pendant la grossesse" | `Grossesse` |
| "Peut-on prendre X pendant l'allaitement ?" | `Allaitement` |

---

### 📦 Questions via Backend Spring Boot (Données SQL)

Ces questions utilisent les données en temps réel de la base de données, envoyées via `external_context` :

#### Pour les Pharmaciens
| Question exemple | Données utilisées | Intent détecté |
|------------------|-------------------|----------------|
| "Quels médicaments ai-je en stock ?" | `medicaments` | `asksMeds` |
| "Combien de médicaments ai-je ?" | `stats.totalMedicaments` | `asksStats` |
| "Montre mes commandes récentes" | `commandes` | `asksCommandes` |
| "Quelles sont mes alertes ?" | `alertes` | `asksAlertes` |
| "État de mes ventes aujourd'hui" | `paniers` | `asksPaniers` |
| "Statistiques de ma pharmacie" | `stats` | `asksStats` |
| "Quels médicaments expirent bientôt ?" | `medicaments.date_expiration` | `asksMeds` |

#### Pour les Fournisseurs
| Question exemple | Données utilisées | Intent détecté |
|------------------|-------------------|----------------|
| "Quels médicaments je fournis ?" | `medicaments` | `asksMeds` |
| "Liste de mes commandes" | `commandes` | `asksCommandes` |
| "Quels pharmaciens travaillent avec moi ?" | `pharmaciens` | `asksPharmaciens` |
| "Alertes sur mes produits" | `alertes` | `asksAlertes` |
| "Combien de commandes ai-je reçu ?" | `stats.totalCommandes` | `asksStats` |

#### Pour les Utilisateurs Génériques
| Question exemple | Données utilisées |
|------------------|-------------------|
| "Quels médicaments sont en vente ?" | `medicaments (en_vente=true)` |
| "Combien de médicaments disponibles ?" | `stats.totalMedicamentsEnVente` |

> [!IMPORTANT]
> Ces questions nécessitent une **authentification**. Le système détecte automatiquement le rôle (Pharmacien, Fournisseur, Utilisateur) et renvoie les données appropriées.

---

### ❌ Questions Non Supportées

| Type de question | Raison |
|------------------|--------|
| "Quel est le meilleur médicament ?" | Jugement subjectif non présent dans les données |
| Diagnostic médical | Le système ne fait PAS de diagnostic |
| Interactions médicamenteuses | Données non présentes dans le CSV |
| Disponibilité en pharmacie | Données temps réel non disponibles |
