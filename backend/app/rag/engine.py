import os
import json
import glob
import math
from typing import List, Dict, Any, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings
from app.rag.eval_data import RAG_EVALUATION_DATASET

CORPUS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/data/corpus"))

class GroundedRAGEngine:
    def __init__(self):
        self.corpus_chunks: List[Dict[str, Any]] = []
        self.documents_metadata: List[Dict[str, Any]] = []
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self._load_corpus()

    def _load_corpus(self):
        self.corpus_chunks = []
        self.documents_metadata = []

        if not os.path.exists(CORPUS_DIR):
            return

        json_files = glob.glob(os.path.join(CORPUS_DIR, "*.json"))
        for filepath in json_files:
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    doc = json.load(f)
                
                doc_id = doc.get("doc_id", os.path.basename(filepath))
                title = doc.get("title", "Pakistan Cyber Safety Document")
                source_url = doc.get("source_url", "")
                publisher = doc.get("publisher", "Government of Pakistan")
                retrieval_date = doc.get("retrieval_date", "2026-10-27")
                language = doc.get("language", "en")
                category = doc.get("category", "General Advisory")

                self.documents_metadata.append({
                    "doc_id": doc_id,
                    "title": title,
                    "source_url": source_url,
                    "publisher": publisher,
                    "retrieval_date": retrieval_date,
                    "language": language,
                    "category": category,
                    "sections_count": len(doc.get("sections", [])),
                    "file_size_bytes": os.path.getsize(filepath)
                })

                for sec in doc.get("sections", []):
                    sec_num = str(sec.get("section_number", ""))
                    heading = sec.get("heading", "")
                    legal_text = sec.get("legal_text", "")
                    summary = sec.get("summary", "")

                    chunk_text = f"{title}. Section {sec_num}: {heading}. {legal_text} {summary}"

                    self.corpus_chunks.append({
                        "chunk_id": f"{doc_id}_SEC_{sec_num}",
                        "doc_id": doc_id,
                        "doc_title": title,
                        "source_url": source_url,
                        "publisher": publisher,
                        "category": category,
                        "section_number": sec_num,
                        "heading": heading,
                        "legal_text": legal_text,
                        "summary": summary,
                        "searchable_text": chunk_text
                    })
            except Exception as e:
                print(f"[RAG Engine] Error loading {filepath}: {e}")

        if self.corpus_chunks:
            texts = [c["searchable_text"] for c in self.corpus_chunks]
            self.vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                sublinear_tf=True,
                max_features=5000,
                stop_words="english"
            )
            self.tfidf_matrix = self.vectorizer.fit_transform(texts)

    def retrieve(self, query: str, top_k: int = 3, threshold: float = 0.12) -> Tuple[List[Dict[str, Any]], bool]:
        if not self.corpus_chunks or self.vectorizer is None or not query.strip():
            return [], False

        q_vec = self.vectorizer.transform([query])
        sims = cosine_similarity(q_vec, self.tfidf_matrix).flatten()

        ranked_indices = sims.argsort()[::-1]
        results = []

        max_score = float(sims[ranked_indices[0]]) if len(ranked_indices) > 0 else 0.0
        is_grounded = max_score >= threshold

        if not is_grounded:
            return [], False

        for idx in ranked_indices[:top_k]:
            score = float(sims[idx])
            if score >= threshold:
                chunk = dict(self.corpus_chunks[idx])
                chunk["relevance_score"] = round(score, 4)
                results.append(chunk)

        return results, True

    def query(self, query: str, language: Optional[str] = "en") -> Dict[str, Any]:
        """Alias for answer_query for convenient API invocation."""
        return self.answer_query(query=query, user_language=language or "en")

    def answer_query(self, query: str, user_language: str = "en") -> Dict[str, Any]:
        """
        Executes grounded retrieval and generates sourced answer.
        Abstains clearly if question is out-of-scope or relevance is low.
        """
        chunks, is_grounded = self.retrieve(query, top_k=3, threshold=0.15)

        if not is_grounded or not chunks:
            if user_language == "ur":
                abstain_msg = "میرے پاس تصدیق شدہ پاکستانی سائبر کرائم، قوانین (PECA 2016) یا بینکنگ ریگولیشنز میں اس کا کوئی مصدقہ حوالہ موجود نہیں ہے۔"
            elif user_language == "ro":
                abstain_msg = "Mera paas tasdeeq shuda Pakistani cyber safety corpus (PECA / SBP / NCCIA) mein is sawal ka koi reliable source mojood nahi hai."
            else:
                abstain_msg = "I don't have a reliable source for that in my verified Pakistan cyber safety corpus (PECA 2016, NCCIA SOP, PKCERT Advisories, or SBP Directives)."

            return {
                "query": query,
                "is_grounded": False,
                "abstained": True,
                "answer": abstain_msg,
                "citations": [],
                "confidence_score": 0.0,
                "language": user_language
            }

        top_chunk = chunks[0]
        citations = []
        for c in chunks:
            citations.append({
                "doc_title": c["doc_title"],
                "document_title": c["doc_title"],
                "section": f"Section {c['section_number']}: {c['heading']}",
                "source_url": c["source_url"],
                "publisher": c["publisher"],
                "score": c["relevance_score"]
            })

        # Sourced deterministic generation
        primary_title = top_chunk["doc_title"]
        primary_sec = top_chunk["section_number"]
        primary_heading = top_chunk["heading"]
        primary_url = top_chunk["source_url"]
        summary = top_chunk["summary"]
        text = top_chunk["legal_text"]

        if user_language == "ur":
            answer = f"حوالہ: [{primary_title}]({primary_url}) — سیکشن {primary_sec}: {primary_heading}\n\n{text}\n\nخلاصہ: {summary}"
        elif user_language == "ro":
            answer = f"Tawajja / Hawala: [{primary_title}]({primary_url}) — Section {primary_sec}: {primary_heading}\n\n{summary}\n\nTafseel: {text}"
        else:
            answer = f"According to [{primary_title}]({primary_url}) ({top_chunk['publisher']}), Section {primary_sec} ({primary_heading}):\n\n\"{text}\"\n\n**Key Takeaway**: {summary}"

        return {
            "query": query,
            "is_grounded": True,
            "abstained": False,
            "answer": answer,
            "citations": citations,
            "confidence_score": top_chunk["relevance_score"],
            "language": user_language
        }


    def get_corpus_documents(self) -> List[Dict[str, Any]]:
        return self.documents_metadata

    def run_mini_evaluation(self) -> Dict[str, Any]:
        """
        Runs the 20-question evaluation benchmark against the grounded corpus.
        Computes in-scope retrieval hit rate and out-of-scope abstention precision.
        """
        results = []
        in_scope_hits = 0
        in_scope_total = 0
        abstention_success = 0
        abstention_total = 0

        for item in RAG_EVALUATION_DATASET:
            q = item["question"]
            should_abstain = item["should_abstain"]
            expected_doc = item["expected_doc_id"]
            expected_sec = item["expected_section"]

            chunks, is_grounded = self.retrieve(q, top_k=3, threshold=0.15)

            if should_abstain:
                abstention_total += 1
                passed = not is_grounded
                if passed:
                    abstention_success += 1
                results.append({
                    "id": item["id"],
                    "question": q,
                    "type": "OUT_OF_SCOPE",
                    "status": "PASSED" if passed else "FAILED_FALSE_POSITIVE",
                    "abstained": not is_grounded,
                    "score": chunks[0]["relevance_score"] if chunks else 0.0
                })
            else:
                in_scope_total += 1
                retrieved_docs = [c["doc_id"] for c in chunks]
                hit = expected_doc in retrieved_docs
                if hit:
                    in_scope_hits += 1
                results.append({
                    "id": item["id"],
                    "question": q,
                    "type": "IN_SCOPE",
                    "status": "PASSED" if hit else "FAILED_MISS",
                    "expected_doc": expected_doc,
                    "retrieved_docs": retrieved_docs,
                    "top_score": chunks[0]["relevance_score"] if chunks else 0.0
                })

        hit_rate = (in_scope_hits / in_scope_total) if in_scope_total > 0 else 1.0
        abstention_rate = (abstention_success / abstention_total) if abstention_total > 0 else 1.0
        overall_accuracy = ((in_scope_hits + abstention_success) / len(RAG_EVALUATION_DATASET))

        return {
            "total_questions": len(RAG_EVALUATION_DATASET),
            "in_scope_count": in_scope_total,
            "in_scope_hit_rate": round(hit_rate, 4),
            "out_of_scope_count": abstention_total,
            "abstention_rate": round(abstention_rate, 4),
            "overall_accuracy": round(overall_accuracy, 4),
            "detailed_results": results
        }

rag_engine = GroundedRAGEngine()
grounded_rag = rag_engine
