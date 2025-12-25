# Backend RAG Data Flow Architecture

This document outlines the architecture and data flow for the RAG (Retrieval-Augmented Generation) system.

---


## 📊 Flux de Données Détaillé

### Étape 1: Requête Utilisateur
```
👤 User → 🖥️ Frontend → ☕ Spring Boot
```
| Composant | Action |
|-----------|--------|
| **Frontend** | Envoie `POST /api/rag/chat` avec le prompt |
| **RagController** | Reçoit la requête |
| **Spring Security** | Authentifie l'utilisateur (Pharmacien/Fournisseur) |

---

### Étape 2: Agrégation du Contexte SQL
```
☕ DatabaseQueryService → 📊 PostgreSQL
```
| Intent détecté | Données récupérées |
|----------------|-------------------|
| `"stock"`, `"médicament"` | `MedicamentRepository.findByUtilisateur()` |
| `"commande"` | `CommandeRepository.findByPharmacien()` |
| `"alerte"` | `AlerteRepository.findByUtilisateurId()` |
| `"vente"`, `"panier"` | `PanierRepository.findByPharmacien()` |

---

### Étape 3: Appel au Service RAG
```
☕ RagClient → 🐍 rag_server.py
```
**Payload envoyé:**
```json
{
  "prompt": "Quel médicament pour le diabète ?",
  "external_context": ["Medicament: Metformine 500mg | Stock: 20", ...],
  "use_rag": true,
  "max_new_tokens": 300
}
```

---

### Étape 4: Retrieval (S3/FAISS)

Cette phase extrait les informations pertinentes de la base de médicaments pour enrichir le contexte.

#### 4.1 Sentence Transformer (Embedding)

| Élément | Valeur |
|---------|--------|
| **Modèle** | `sentence-transformers/all-MiniLM-L6-v2` |
| **Entrée** | Prompt texte : `"Quel médicament pour le diabète ?"` |
| **Sortie** | Vecteur numpy de dimension 384 : `[0.023, -0.451, 0.127, ..., 0.872]` |

**Processus :**
```python
query_embedding = embedding_model.encode(["Quel médicament pour le diabète ?"])
# Résultat: numpy array shape (1, 384)
```

> [!NOTE]
> Le Sentence Transformer comprend le **sens sémantique** : "diabète" sera proche de "antidiabétique", "metformine", "glycémie" même si les mots sont différents.

---

#### 4.2 FAISS Index Search (Similarity Search)

| Élément | Valeur |
|---------|--------|
| **Type d'index** | `IndexFlatL2` (distance euclidienne exacte) |
| **Entrée** | Vecteur query (384D) + Index des 5000+ chunks |
| **Sortie** | Top-K indices + distances (similarité) |

**Processus :**
```python
distances, indices = faiss_index.search(query_embedding, k=3)
# distances: [[0.45, 0.52, 0.61]]  ← Plus petit = plus similaire
# indices:   [[1234, 892, 3401]]   ← Indices des chunks dans le CSV
```

**Fonctionnement interne :**
```
┌──────────────────────────────────────────────────────────────────┐
│  FAISS Index (créé au démarrage)                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Chunk 0: [0.12, -0.34, ...]  → "Doliprane 500mg, antalgique"│ │
│  │ Chunk 1: [0.08, -0.22, ...]  → "Amoxicilline, antibiotique" │ │
│  │ Chunk 2: [0.45, 0.12, ...]   → "Metformine, antidiabétique" │ │
│  │ ...                                                         │ │
│  │ Chunk 5052: [...]            → "Insuline Lantus"            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Query Vector: [0.42, 0.15, ...] ("diabète")                     │
│         ↓                                                        │
│  Calcul distance L2 avec TOUS les vecteurs                       │
│         ↓                                                        │
│  Top-3 plus proches: Chunk 2, Chunk 4521, Chunk 3892             │
└──────────────────────────────────────────────────────────────────┘
```

---

#### 4.3 Résultat : Top-K Chunks

| Élément | Valeur |
|---------|--------|
| **K** | 3 (configurable via `TOP_K_RESULTS`) |
| **Entrée** | Indices des chunks les plus similaires |
| **Sortie** | Liste de tuples `(texte, metadata, score)` |

**Exemple de sortie :**
```python
retrieved_chunks = [
    (
        "Nom: METFORMINE 500MG\nClasse: Antidiabétique\nIndications: Diabète type 2...",
        {"row_index": 1234, "source": "csv", "columns": ["Nom", "Classe", ...]},
        0.45  # distance (plus petit = plus pertinent)
    ),
    (
        "Nom: GLUCOPHAGE 850MG\nClasse: Antidiabétique\nIndications: Diabète type 2...",
        {"row_index": 892, "source": "csv", "columns": [...]},
        0.52
    ),
    (
        "Nom: JANUVIA 100MG\nClasse: Inhibiteur DPP-4\nIndications: Diabète type 2...",
        {"row_index": 3401, "source": "csv", "columns": [...]},
        0.61
    )
]
```


---

### Étape 5: Génération (LLaMA)
```
🧠 LLaMA 3.2 = Contexte SQL + Contexte S3 → Réponse
```
**Contexte combiné:**
- ✅ **Spring Boot** : Stock actuel, commandes, alertes (temps réel)
- ✅ **S3** : Indications, posologie, contre-indications (base complète)

---

### Étape 6: Réponse
```json
{
  "response": "Pour le diabète de type 2, je vous recommande METFORMINE 500mg...",
  "answer_source": "springboot+s3",
  "sources": [
    {"source": "springboot", "row_index": null},
    {"source": "s3", "row_index": 1234, "similarity_score": 0.45}
  ]
}
```

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
