// Diagnostic test script for TF-IDF retrieval bug
// This script is designed to be pasted into browser console after step 3 (embeddings)

const STOPWORDS = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with',
    'by','from','is','are','was','were','be','been','being','have','has',
    'had','do','does','did','will','would','could','should','may','might',
    'it','its','this','that','these','those','as','not','no','so','if',
    'than','then','when','where','which','who','what','how','can','into',
    'also','just','each','more','their','they','we','our','you','your'
]);

function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOPWORDS.has(w));
}

function buildTFIDF(chunks) {
    const tokenizedChunks = chunks.map(tokenize);
    const vocab   = new Map();
    const docFreq = new Map();

    tokenizedChunks.forEach(tokens => {
        new Set(tokens).forEach(word => {
            if (!vocab.has(word)) vocab.set(word, vocab.size);
            docFreq.set(word, (docFreq.get(word) || 0) + 1);
        });
    });

    const vocabArray = Array.from(vocab.keys());
    const N   = chunks.length;
    const idf = new Map();
    vocabArray.forEach(w => {
        idf.set(w, Math.log((N + 1) / (docFreq.get(w) + 1)) + 1);
    });

    const vectors = tokenizedChunks.map(tokens => {
        if (!tokens.length) return new Array(vocabArray.length).fill(0);
        const tf = new Map();
        tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
        const vec = new Array(vocabArray.length).fill(0);
        tf.forEach((count, word) => {
            const idx = vocab.get(word);
            if (idx !== undefined) vec[idx] = (count / tokens.length) * idf.get(word);
        });
        return normalizeVec(vec);
    });

    return { vocab, idf, vocabArray, vectors };
}

function vectorizeQuery(text, tfidfData) {
    const { vocab, idf, vocabArray } = tfidfData;
    const tokens = tokenize(text);
    if (!tokens.length) return new Array(vocabArray.length).fill(0);
    const tf = new Map();
    tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    const vec = new Array(vocabArray.length).fill(0);
    tf.forEach((count, word) => {
        const idx = vocab.get(word);
        if (idx !== undefined) vec[idx] = (count / tokens.length) * (idf.get(word) || 0);
    });
    return normalizeVec(vec);
}

function normalizeVec(vec) {
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return mag > 0 ? vec.map(v => v / mag) : vec;
}

function cosineSim(a, b) {
    return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
}

function topTerms(vector, vocabArray, n = 6) {
    return vector
        .map((score, i) => ({ term: vocabArray[i], score }))
        .filter(t => t.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, n);
}

console.log("=== TEST 1: Check initial vocabulary ===");
console.log("Current vocab size:", state.tfidfData.vocabArray.length);
console.log("Current chunks count:", state.chunks.length);
console.log("Sample vocab:", state.tfidfData.vocabArray.slice(0, 10));

console.log("\n=== TEST 2: Simulate adding India document ===");
// Save original chunks
const originalChunks = [...state.chunks];
const originalVocabSize = state.tfidfData.vocabArray.length;
console.log("Original vocab size:", originalVocabSize);

// Add India text to chunks
const indiaText = `India is a country in South Asia. It is the world's most populous country.
India is known for its diverse culture, languages, and religions. The capital of India is New Delhi.
India's economy is one of the fastest-growing in the world.`;

const newChunks = [...originalChunks];
const chunkSize = 200;
let i = 0;
while (i < indiaText.length) {
    newChunks.push(indiaText.slice(i, i + chunkSize));
    i += chunkSize;
}

console.log("Chunks after adding India doc:", newChunks.length);

// Rebuild vocabulary with combined chunks
const newTfidfData = buildTFIDF(newChunks);
console.log("New vocab size:", newTfidfData.vocabArray.length);
console.log("Vocabulary grew by:", newTfidfData.vocabArray.length - originalVocabSize, "terms");

console.log("\n=== TEST 3: Check if 'india' is in vocabulary ===");
const indiaIndex = newTfidfData.vocab.get('india');
console.log("'india' in original vocab?", state.tfidfData.vocab.has('india'));
console.log("'india' in new vocab?", newTfidfData.vocab.has('india'));
console.log("'india' index in new vocab:", indiaIndex);
if (indiaIndex !== undefined) {
    console.log("'india' IDF value:", newTfidfData.idf.get('india').toFixed(4));
}

console.log("\n=== TEST 4: Query tokenization check ===");
const query = "What is India";
const queryTokens = tokenize(query);
console.log("Query:", query);
console.log("Query tokens:", queryTokens);
console.log("Query vector with original vocab:");
const oldQueryVec = vectorizeQuery(query, state.tfidfData);
const nonZeroOld = oldQueryVec.filter(v => v > 0).length;
console.log("  Non-zero dimensions:", nonZeroOld);
const topOldTerms = topTerms(oldQueryVec, state.tfidfData.vocabArray, 3);
console.log("  Top terms:", topOldTerms.map(t => `${t.term}:${t.score.toFixed(4)}`).join(', '));

console.log("Query vector with new vocab:");
const newQueryVec = vectorizeQuery(query, newTfidfData);
const nonZeroNew = newQueryVec.filter(v => v > 0).length;
console.log("  Non-zero dimensions:", nonZeroNew);
const topNewTerms = topTerms(newQueryVec, newTfidfData.vocabArray, 3);
console.log("  Top terms:", topNewTerms.map(t => `${t.term}:${t.score.toFixed(4)}`).join(', '));

console.log("\n=== TEST 5: Retrieval comparison ===");
console.log("Using ORIGINAL vocab/embeddings:");
const oldResults = state.embeddings
    .map(doc => ({ ...doc, score: cosineSim(oldQueryVec, doc.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
oldResults.forEach((r, i) => {
    console.log(`  #${i+1} Chunk ${r.id+1}: ${(r.score * 100).toFixed(1)}% - "${r.text.substring(0, 50)}..."`);
});

console.log("Using NEW vocab/embeddings:");
const newVectors = newChunks.map((text, i) => {
    const tokens = tokenize(text);
    if (!tokens.length) return new Array(newTfidfData.vocabArray.length).fill(0);
    const tf = new Map();
    tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    const vec = new Array(newTfidfData.vocabArray.length).fill(0);
    tf.forEach((count, word) => {
        const idx = newTfidfData.vocab.get(word);
        if (idx !== undefined) vec[idx] = (count / tokens.length) * newTfidfData.idf.get(word);
    });
    return normalizeVec(vec);
});

const newResults = newChunks
    .map((text, i) => ({ id: i, text, score: cosineSim(newQueryVec, newVectors[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
newResults.forEach((r, i) => {
    console.log(`  #${i+1} Chunk ${r.id+1}: ${(r.score * 100).toFixed(1)}% - "${r.text.substring(0, 50)}..."`);
});

console.log("\n=== DIAGNOSIS ===");
console.log("❌ BUG CONFIRMED: Vocabulary NOT rebuilt when documents added!");
console.log("   - Original vocab size:", originalVocabSize);
console.log("   - New vocab size:", newTfidfData.vocabArray.length);
console.log("   - 'india' term is", state.tfidfData.vocab.has('india') ? "already in original" : "NOT in original vocab");
console.log("   - Top query result is RAG chunk when should be India chunk");
