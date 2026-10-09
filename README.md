# **RAG Pipeline: Interactive Visualization**

A step-by-step, interactive visualization of how Retrieval-Augmented Generation works: from raw text to grounded AI response. Every intermediate output is visible and tuneable. Built with real TF-IDF vectorization and cosine similarity, not mock data.

**Live Demo:** [https://prodxsg.github.io/RAG/](https://prodxsg.github.io/RAG-Pipeline-Interactive-Visualization/)

---

## **What It Does**

Walk through each stage of a RAG pipeline, with real math running at every step:

* **Ingestion:** paste text or upload a file as your knowledge base
* **Chunking:** split into chunks with configurable size and overlap
* **TF-IDF Vectorization:** each chunk becomes a normalized sparse vector over the corpus vocabulary. Top terms by TF-IDF weight are shown per chunk
* **User Query:** enter a natural language question
* **Cosine Similarity Retrieval:** query is vectorized against the same vocabulary, ranked by cosine similarity against all chunks
* **Prompt Construction:** see the exact prompt assembled with retrieved context injected
* **Generation:** optionally send the final prompt to the Anthropic Claude API for real LLM responses, or use a context-aware mock response

Tracks source tokens, vocabulary size, system latency, and vector count throughout.

---

## **What's Real vs. Simulated**

| **Component**       | **Implementation**                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Chunking**        | Real: character-level with configurable overlap                                                             |
| **Vectorization**   | Real: TF-IDF with stopword removal, term frequency, inverse document frequency, L2 normalization            |
| **Retrieval**       | Real: cosine similarity (dot product on normalized vectors)                                                 |
| **Prompt Assembly** | Real: system instruction + retrieved context + user query                                                   |
| **Generation**      | Optional: Anthropic Claude API integration for real responses, otherwise uses a context-aware mock response |

---

## **Why I Built This**

Most RAG explanations are abstract diagrams. I wanted to see every intermediate step: what chunks look like after splitting, how TF-IDF weights distribute across terms, what cosine similarity scores actually mean, and what the assembled prompt looks like before it hits the model. This tool makes each decision point in the pipeline visible and tuneable.

---

## **Tech Stack**

**HTML · CSS · JavaScript · Optional Anthropic Claude API integration**

Single-file, zero dependencies, no build step. Open `index.html` and it runs.
