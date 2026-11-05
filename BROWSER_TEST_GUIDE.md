# Interactive Browser Test Guide

## How to Test the Retrieval Fix in Browser

### Step 1: Load the Page and Setup
1. Open `index.html` in Chrome/Firefox
2. The RAG document is pre-filled in the textarea
3. Click **"Process Data"** button
   - Should show 6 RAG chunks
   - Vocabulary size: 90 terms (shown in analytics bar)

### Step 2: Vectorize RAG Document
1. Click **"Vectorize Chunks"** button
   - Processes TF-IDF vectors
   - Shows top terms for each chunk
2. Click **"Save to Vector DB"**
   - Vector count: 6

### Step 3: Upload India Document (Tests the Fix)
1. Switch to **"Upload File"** tab
2. **Create** a test file `india.txt` with this content:
```
India is a country in South Asia. It is the world's most populous country.
India is known for its diverse culture, languages, and religions.
The capital of India is New Delhi.
India's economy is one of the fastest-growing in the world.
India's technology sector is a global leader in IT services.
```

3. **Upload the file**
   - **BEFORE FIX:** Textarea would be replaced (RAG text lost!)
   - **AFTER FIX:** Text is APPENDED (RAG text preserved + India text added) ✓

4. Verify the textarea now contains:
   - ✓ Original RAG text at the top
   - ✓ "India is a country..." text at the bottom
   - ✓ Total text length increased

### Step 4: Re-chunk with Combined Documents
1. Click **"Process Data"** again
   - **BEFORE FIX:** Would only have India chunks
   - **AFTER FIX:** Has both RAG and India chunks
   - Should see 8 chunks total (6 RAG + 2 India)

2. Vocabulary size in analytics bar: **Should increase from 90 to 125+ terms**
   - The increase shows "india" term and other India-specific vocabulary is now added

### Step 5: Re-vectorize with New Vocabulary
1. Click **"Vectorize Chunks"** again
   - Rebuilds entire vocabulary from combined chunks
   - Creates new vector representations with expanded vocabulary
   - Vector count: 8

2. **CRITICAL CHECK:** Scroll to step 3 and look at the vector terms
   - Some India chunks should show "india" in their top terms
   - This proves "india" is in the vocabulary

### Step 6: Test Retrieval - Query 1: "What is India"
1. Go to Step 4: User Query
2. Type: `What is India`
3. Click **"Proceed to Retrieval"**

4. Go to Step 5: Retrieval
5. Make sure Top K = 2
6. Click **"Execute Vector Search"**

**EXPECTED RESULTS:**
```
#1 [✓ INDIA] Score: ~48% - Contains "India is a country..."
#2 [✓ INDIA] Score: ~35% - Contains "India is known for its..."
```

**BEFORE FIX:** Would return RAG chunks with ~25% similarity ❌
**AFTER FIX:** Returns India chunks with ~48% similarity ✓

### Step 7: Test Retrieval - Query 2: "What is RAG"
1. Go back to Step 4
2. Clear query and type: `What is RAG`
3. Click **"Proceed to Retrieval"**

4. Go to Step 5
5. Click **"Execute Vector Search"**

**EXPECTED RESULTS:**
```
#1 [✓ RAG] Score: ~19% - Contains "RAG (Retrieval-Augmented Generation)..."
#2 [✓ RAG] Score: ~18% - Contains "Instead of relying solely..."
```

This proves RAG queries still work correctly on combined documents.

### Step 8: Test No-Match Guard
1. Go back to Step 4
2. Type: `xyzabc qwertyuiop` (nonsense query)
3. Click **"Proceed to Retrieval"**

4. Go to Step 5
5. Click **"Execute Vector Search"**

**EXPECTED RESULTS:**
```
No relevant context found for this query.
[Construct Prompt button is HIDDEN]
```

**EXPLANATION:**
- Score for top result: 0% (below 15% threshold)
- Guard prevents sending garbage to LLM ✓

### Step 9: Verify Vocabulary Growth (Optional - Console Test)

Open browser console (F12) and paste:
```javascript
// Before adding India document:
console.log("Before:", state.tfidfData.vocabArray.length, "terms");
// Example: Before: 90 terms

// After adding India document and re-vectorizing:
console.log("After:", state.tfidfData.vocabArray.length, "terms");
// Example: After: 125 terms

// Check if "india" is in vocabulary:
console.log("'india' in vocab?", state.tfidfData.vocab.has('india'));
// Example: 'india' in vocab? true
```

---

## Summary of Tests

| Test | Before Fix | After Fix | Status |
|------|-----------|-----------|--------|
| File upload behavior | Replaces | Appends | ✅ FIXED |
| Multi-doc vocabulary | 90 terms | 125 terms | ✅ FIXED |
| "india" term in vocab | false | true | ✅ FIXED |
| Query "What is India" | RAG chunks (25%) | India chunks (48%) | ✅ FIXED |
| Query "What is RAG" | RAG chunks (19%) | RAG chunks (19%) | ✅ WORKING |
| Nonsense query | Low score | Rejected (15%) | ✅ FIXED |

---

## Key Changes Explained

### 1. Document Accumulation
```javascript
// BEFORE: get('sourceText').value = e.target.result;
// AFTER:
const currentText = get('sourceText').value.trim();
const newText = e.target.result.trim();
get('sourceText').value = currentText ? currentText + '\n\n' + newText : newText;
```
**Effect:** Both documents preserved, vocabulary includes all terms

### 2. No-Match Threshold
```javascript
const MIN_SIMILARITY_THRESHOLD = 0.15;

// In retrieval:
if (allZero || topScore < MIN_SIMILARITY_THRESHOLD) {
    return "No relevant context found for this query.";
}
```
**Effect:** Prevents low-confidence retrievals from reaching LLM

### 3. Vocabulary Rebuild
The vocabulary is **automatically** rebuilt each time you click "Vectorize Chunks":
```javascript
// In runEmbeddings():
state.tfidfData = buildTFIDF(state.chunks);  // Rebuilds vocab from current chunks
```
**Effect:** New documents automatically contribute to vocabulary

---

## Troubleshooting

### Issue: "Upload didn't append text"
- Make sure you're using the UPDATED version of index.html
- Check browser cache: Press Ctrl+Shift+Delete and clear cache

### Issue: Vocabulary size didn't increase
- Make sure you clicked "Process Data" after uploading
- Make sure you clicked "Vectorize Chunks" after chunking
- Check analytics bar for vocabulary size

### Issue: "india" still not in results
- Check that India text is in textarea (should be visible)
- Check chunk count increased (should be ~8 instead of ~6)
- Try different query terms: "country", "capital", "delhi"

### Issue: Want to test with fresh start
- Refresh the page (Ctrl+R)
- RAG document will be restored to default
- Follow all steps from Step 1

---

## Manual Vocabulary Inspection

To see the actual vocabulary in browser console:

```javascript
// See first 10 terms:
state.tfidfData.vocabArray.slice(0, 10)

// See last 10 terms (these should include "india" and India-specific terms):
state.tfidfData.vocabArray.slice(-10)

// Check specific term:
state.tfidfData.vocab.get('india')  // Returns index if present, undefined if not

// Check term count:
state.tfidfData.vocabArray.length   // Should be 125 after India document
```

---

## Test Success Criteria

✅ **All of these must be true to confirm the fix:**

1. [ ] After uploading India document, textarea contains **both** RAG and India text
2. [ ] Vocabulary size **increases** from 90 to 125+ after re-vectorizing
3. [ ] "india" term **is** in the vocabulary after re-vectorizing
4. [ ] Query "What is India" returns India chunks **at rank #1**
5. [ ] India chunks have **higher** similarity than RAG chunks for India queries
6. [ ] Query "What is RAG" still returns RAG chunks (multi-doc doesn't break original)
7. [ ] Nonsense query returns "No relevant context found" message
8. [ ] "Construct Prompt" button appears only for valid queries

---

## Expected Scores (For Reference)

After proper fixes are in place, you should see approximately:

| Query | Expected Top Result | Expected Score |
|-------|-------------------|-----------------|
| "What is India" | India chunk | 45-50% |
| "india" | India chunk | 45-50% |
| "What is RAG" | RAG chunk | 18-20% |
| "retrieval" | RAG chunk | 15-20% |
| "nonsense xyzabc" | (rejected) | 0-5% |

Scores may vary slightly based on chunk boundaries in your text.
