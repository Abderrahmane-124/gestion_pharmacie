# Retrieval-Augmented Generation (RAG) in this Spring Boot Backend

This document explains the complete RAG pipeline implemented in the Spring Boot backend and how it collaborates with the external Python (FastAPI) RAG service to produce grounded answers. It also describes the purpose of each code file that participates in the RAG mechanism, their responsibilities, and how they relate to each other.

---

## High-level Overview

- Client (web/mobile/Postman) calls the Spring endpoint: `POST /api/rag/chat` with a natural-language prompt.
- Spring authenticates the user and builds a role-aware curated context from the database (Pharmacien or Fournisseur).
- Spring sends the prompt and the curated context (if any) to the Python FastAPI RAG service.
- The Python service optionally retrieves additional info (S3 CSV + FAISS), runs the LLM (LLaMA) with the augmented context, and returns a structured response including the source of the answer.
- Spring returns that structured response to the client.

Why RAG? The model is “grounded” by up-to-date, user-specific data (from Spring/DB) and 3rd-party corpus (S3 CSV) instead of relying only on general knowledge.

---

## Architecture Diagram

```
[Client / Postman]
    |
    v
[Spring Boot: /api/rag/chat]
    |  (JWT auth)
    |---> DatabaseQueryService (role-aware data)
    |---> CuratedContextService (plain-text context)
    |---> RagClient (HTTP call)
             |
             v
      [Python RAG (FastAPI)]
             |---> S3 CSV -> embeddings -> FAISS
             |---> LLaMA inference with context
             |
             v
      response: { response, context_used, sources[], answer_source }
    |
    v
[Spring returns JSON to client]
```

---

## Request Lifecycle (step-by-step)

1) Client sends request to Spring
- Endpoint: `POST /api/rag/chat`
- Requires Authorization header (JWT) because the curated context is user-specific.
- Body is represented by `ChatRequestDto`:
  - `message` (the prompt) [required]
  - `max_new_tokens`, `temperature`, `top_p` [optional]

2) Spring authenticates and builds curated context
- `RagController` reads the current user from `SecurityContext`.
- `DatabaseQueryService` detects the user’s role:
  - Pharmacien: owns meds and places commandes
  - Fournisseur: supplies meds and receives commandes
- Based on the prompt intent (keywords/verbs like supply/have/possess/provide/sell/offer/etc.), it collects the most relevant data:
  - Pharmacien: their medicaments, commandes, fournisseurs (from commandes), alertes, stats
  - Fournisseur: medicaments supplied (from commandes; fallback to owned meds), commandes, pharmaciens (clients), alertes, stats
- `CuratedContextService` converts that structured data into a concise list of plain-text strings (no entities/JSON), summarizing each medicament as a single line. It omits empty sections (no stray placeholders).

3) Spring calls Python RAG
- `RagClient` prepares a JSON payload and sends it to `${rag.base-url}/chat`:
  - `prompt`: the user’s original message
  - `external_context`: only if the curated context is non-empty (otherwise `use_rag=true` so Python retrieves from S3)
  - Generation parameters if provided
- `RagClient` also:
  - enforces connection/read timeouts
  - adds an optional `X-Service-Auth` header if configured
  - limits context size (max items and max chars per item) to keep the request lightweight
  - logs a sanitized summary of the request (prompt truncated, context size)

4) Python RAG service
- Loads a CSV corpus from S3, creates text chunks, embeds them with sentence-transformers, and indexes them in FAISS at startup.
- For each chat request:
  - If `external_context` is present: uses it and labels `answer_source: "springboot"`
  - Else if RAG retrieval used: pulls from S3/FAISS and labels `answer_source: "s3"`
  - Else: answers from general knowledge with `answer_source: "general_knowledge"`
- Returns a response:
  - `response`: final answer string
  - `context_used`: strings used to build the answer (either from Spring or S3)
  - `sources`: array indicating source per chunk
  - `answer_source`: springboot | s3 | general_knowledge
- Logs `[chat]` and `[source]` lines so you can verify which source path was used.

5) Spring returns the Python response to the client
- Just passes through the `RagResponse` fields.
- You can inspect `answer_source` and `sources` in Postman to confirm where the answer came from.

---

## Core Spring Files and Their Roles

- `rag/RagController.java`
  - REST controller for `POST /api/rag/chat`.
  - Validates auth and request body (`ChatRequestDto`).
  - Calls `DatabaseQueryService` to fetch role-aware data.
  - Calls `CuratedContextService` to convert DB data into plain text chunks.
  - Logs curated context size.
  - Invokes `RagClient` to call the Python RAG service and returns the result.

- `rag/ChatRequestDto.java`
  - DTO for incoming chat request.
  - Fields: `message`, `max_new_tokens`, `temperature`, `top_p`.
  - Replaces loosely typed `Map` so the input contract is explicit.

- `rag/RagClient.java`
  - Outbound HTTP client to the Python RAG service.
  - Enforces timeouts (connect/read).
  - Optional service-to-service auth header `X-Service-Auth` if `rag.service-token` is set.
  - Limits context (max items and max chars per item) before sending to the Python service.
  - Sends `external_context` only when non-empty; otherwise sets `use_rag=true`.
  - Logs a sanitized summary of the outgoing request.

- `rag/RagProperties.java`
  - Binds configuration values from `application.properties` / env:
    - `rag.base-url` (e.g., `http://<EC2_HOST>:8000`)
    - `rag.service-token` (optional)
    - `rag.context.max-items` (default: 10)
    - `rag.context.max-chars-per-item` (default: 1200)

- `rag/RagResponse.java`
  - DTO for the Python RAG response.
  - Fields:
    - `response`: model output text
    - `context_used`: plain context lines used downstream
    - `sources`: list with `source` labels per chunk (springboot|s3)
    - `answer_source`: high-level label for the overall answer

- `rag/CuratedContextService.java`
  - Adapts structured DB data to a compact list of strings for the RAG model.
  - Summarizes medicaments: `"Medicament: <Name> | <truncated indications>"`.
  - Skips the medicament section entirely if the list is empty (avoids `"Medicaments:\n"` placeholders).
  - Adds simple count/stat lines only when present.

- `Services/DatabaseQueryService.java`
  - Role-aware data collector:
    - Detects role from the authenticated email (Pharmacien or Fournisseur).
    - Lightweight intent detection (EN/FR variants) for meds/commandes/fournisseurs/pharmaciens/alertes/stats.
    - Pharmacien: collects own meds, commandes, fournisseurs, alertes, stats.
    - Fournisseur: collects meds from commandes (fallback to owned meds), commandes, pharmaciens, alertes, stats.
    - For “named” queries like “Do I supply DOLIPRANE?” it tries to extract the named medicine and filters if present.
  - Annotated `@Transactional(readOnly = true)` to safely access lazy-loaded relationships.

- Repositories (used by `DatabaseQueryService`)
  - `Repositorys/MedicamentRepository.java`: meds by utilisateur; public meds “en_vente”; keyword search.
  - `Repositorys/CommandeRepository.java`: commandes by pharmacien / fournisseur.
  - `Repositorys/LigneCommandeRepository.java`: lignes by commande (supports extracting meds supplied by a fournisseur).
  - `Repositorys/FournisseurRepository.java`, `Repositorys/PharmacienRepository.java`: lookup by email.
  - `Repositorys/AlerteRepository.java`: alertes by utilisateur or medicament.

- Entities (relevant subset)
  - `entites/Pharmacien.java`, `entites/Fournisseur.java`, `entites/Medicament.java`, `entites/Commande.java`, `entites/LigneCommande.java`
  - Define the DB model for pharmacien/fournisseur, meds, orders, and order lines.

---

## Configuration

- `backend_spring/src/main/resources/application.properties`:
  - `rag.base-url`: base URL of the Python RAG service (use `http://` unless you terminate TLS at that service)
  - `rag.service-token`: optional shared secret; sent as `X-Service-Auth` header
  - `rag.context.max-items`: maximum curated context lines to send (default: 10)
  - `rag.context.max-chars-per-item`: per-line character limit (default: 1200)

- Docker Compose
  - In containers, prefer the environment variable `RAG_BASE_URL` to point Spring to the EC2 FastAPI:
    - Example: `RAG_BASE_URL=http://<EC2_IP_OR_DNS>:8000`
  - Avoid `localhost` inside containers—it points to the container itself, not the host.

---

## Response Contract (from Python RAG)

A typical success payload looks like:

```json
{
  "response": "Paracetamol, Ibuprofen",
  "context_used": [
    "Medicament: Paracetamol | ...",
    "Medicament: Ibuprofen | ..."
  ],
  "sources": [
    { "source": "springboot" },
    { "source": "springboot" }
  ],
  "answer_source": "springboot"
}
```

- `answer_source` shows the primary data provenance:
  - `springboot`: used curated context from the DB via Spring
  - `s3`: used S3 CSV retrieval via FAISS
  - `general_knowledge`: neither source was used

---

## Security & Auth

- The Spring endpoint requires a valid JWT in the `Authorization: Bearer <token>` header.
- The Python endpoint may optionally require an `X-Service-Auth` shared token (configurable).
- Ensure your EC2 security group allows inbound traffic from the Spring host on the RAG port.

---

## Logging

- Spring
  - `RagClient` logs a sanitized line per call:
    - `[RAG] Sending prompt='...' ctxItems=N url=http://...`
  - `RagController` logs curated context item counts.

- Python RAG (FastAPI)
  - `[chat] Received external_context from Spring Boot with N items`
  - `[source] Using springboot context: items=N`
  - `[source] Using s3 context: k=K`
  - `[source] No context used; answer_source=general_knowledge`

Use these to debug whether Spring context was sent and which path the Python service took.

---

## Troubleshooting Guide

- I get `answer_source: "s3"` though I expected Spring data
  - Check Spring logs: is curated context size > 0?
  - Ensure the authenticated user actually has data (meds/commandes) in the DB.
  - Confirm Docker Compose uses the correct `RAG_BASE_URL` (not `localhost`).

- `context_used` contains only `Role: FOURNISSEUR` or empty
  - This indicates no meds were found. For suppliers, the service now:
    - pulls meds from commandes; if none, falls back to owned meds.
    - tries to filter by a specific named medicine if present in the question.
  - If still empty, your supplier may truly have no linked meds in DB.

- I asked “names only” and got a verbose answer
  - The Python service can be extended to return names-only deterministically when the prompt requests it and context is present. Ask to enable this optimization if needed.

- 502 Bad Gateway from Spring
  - The Python FastAPI is not reachable from the Spring container. Verify `RAG_BASE_URL`, EC2 security group, and that the Python service is running.

---

## Postman Quick Start

- URL: `http://localhost:8080/api/rag/chat`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_JWT>`
- Body examples:

List supplier meds (names implied by context):
```json
{ "message": "List the medicines I supply" }
```

List pharmacist meds (names only):
```json
{ "message": "List all the medicaments I possess (names only)" }
```

Counts and stats:
```json
{ "message": "How many meds and orders do I have?" }
```

Named lookup:
```json
{ "message": "Do I supply DOLIPRANE?" }
```

---

## Extensibility Ideas

- Deterministic “names-only” mode in Python when `external_context` is present and the prompt requests only names.
- Lightweight intent classifier (embeddings + cosine similarity) to replace keyword matching and support multi-intent queries.
- Expand curated context with availability, pricing, or stock status if/when those fields exist.

---

## Glossary

- Curated context: a compact, user-specific set of strings derived from the DB, sent to the RAG model.
- FAISS: similarity search library used by the Python service to find relevant S3 text chunks.
- `answer_source`: high-level indicator of whether the answer used Spring data, S3, or general knowledge.

---

If you need this document adapted for DevOps (deployment, TLS, networking), or for the FastAPI side, we can add separate sections.
