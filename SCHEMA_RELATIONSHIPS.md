# Database Schema Relationships

## Visual Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USERS (Clerk Auth)                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ clerkId, email, name, firstName, lastName, imageUrl          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───┬─────────┬──────────┬──────────┬──────────┬────────────────────┘
    │         │          │          │          │
    │         │          │          │          │
    ▼         ▼          ▼          ▼          ▼
┌───────┐ ┌─────────┐ ┌──────┐ ┌──────────┐ ┌──────────┐
│subscr-│ │user_    │ │mock_ │ │flashcards│ │pdf_      │
│iptions│ │progress │ │exams │ │          │ │uploads   │
└───────┘ └─────────┘ └──────┘ └──────────┘ └──────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                              EXAMS                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ name, category, country, description, icon                   │   │
│  │ Examples: "USMLE Step 1", "SMLE", "TOEFL"                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───┬─────────┬──────────┬──────────┬────────────────────────────────┘
    │         │          │          │
    │         │          │          │
    ▼         ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌──────────┐ ┌──────┐
│questions│ │hy_notes│ │flashcards│ │mock_ │
│         │ │        │ │          │ │exams │
└────┬────┘ └────────┘ └──────────┘ └──────┘
     │
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           QUESTIONS                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ q_text, choices[], correct_choice_index, explanation         │   │
│  │ exam_id, subject, topic, ai_generated, verified              │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───┬─────────┬──────────┬──────────┬──────────┬────────────────────┘
    │         │          │          │          │
    │         │          │          │          │
    ▼         ▼          ▼          ▼          ▼
┌────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐ ┌────────┐
│hy_notes│ │flashcards│ │user_    │ │library│ │pdf_    │
│(1:1)   │ │(1:many)  │ │progress │ │(many: │ │uploads │
│        │ │          │ │(1:many) │ │many)  │ │(source)│
└────────┘ └──────────┘ └─────────┘ └───────┘ └────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    GENERATION_PROMPTS                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ name, prompt_template, model, success_rate                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ Referenced by
                            ▼
                      ┌─────────┐
                      │questions│
                      │.prompt_ │
                      │id       │
                      └─────────┘
```

## Detailed Relationships

### 1. User-Centric Relationships

```typescript
users (1) ──→ (many) subscriptions
users (1) ──→ (many) user_progress
users (1) ──→ (many) mock_exams
users (1) ──→ (many) flashcards
users (1) ──→ (many) pdf_uploads
```

**Example Queries:**
```typescript
// Get user's subscription
user → subscriptions.by_user_id

// Get user's progress on all questions
user → user_progress.by_user

// Get user's mock exams
user → mock_exams.by_user

// Get user's flashcards due today
user → flashcards.by_next_review
```

### 2. Exam-Centric Relationships

```typescript
exams (1) ──→ (many) questions
exams (1) ──→ (many) hy_notes
exams (1) ──→ (many) flashcards
exams (1) ──→ (many) mock_exams
```

**Example Queries:**
```typescript
// Get all questions for an exam
exam → questions.by_exam

// Get all HY notes for an exam
exam → hy_notes.by_exam

// Count questions by subject
exam → questions.by_exam_and_subject → group by subject
```

### 3. Question-Centric Relationships

```typescript
questions (1) ──→ (1) hy_notes
questions (1) ──→ (many) flashcards (per user)
questions (1) ──→ (many) user_progress (per user)
questions (many) ←─→ (many) library.related_question_ids
questions (many) ──→ (1) generation_prompts (optional)
questions (many) ──→ (1) pdf_uploads (optional)
```

**Example Queries:**
```typescript
// Get HY note for a question
question → hy_notes.by_question

// Get all user attempts on a question
question → user_progress.by_user_and_question

// Get flashcard for this question (for specific user)
question + user → flashcards.by_question
```

### 4. AI Generation Relationships

```typescript
generation_prompts (1) ──→ (many) questions
pdf_uploads (1) ──→ (many) questions
```

**Example Queries:**
```typescript
// Get all questions generated by a prompt
prompt → questions.by_generation_prompt_id

// Get all questions extracted from a PDF
pdf → questions.source_file_id
```

## Cardinality Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| `users` → `subscriptions` | 1:many | One user can have multiple subscriptions (history) |
| `users` → `user_progress` | 1:many | One user, many question attempts |
| `users` → `mock_exams` | 1:many | One user, many practice exams |
| `users` → `flashcards` | 1:many | One user, many flashcards |
| `users` → `pdf_uploads` | 1:many | One user, many uploaded files |
| `exams` → `questions` | 1:many | One exam, many questions |
| `exams` → `hy_notes` | 1:many | One exam, many HY notes |
| `exams` → `flashcards` | 1:many | One exam, many flashcards (across all users) |
| `exams` → `mock_exams` | 1:many | One exam, many practice instances |
| `questions` → `hy_notes` | 1:1 | Each question has one HY note |
| `questions` → `flashcards` | 1:many | One question, many flashcards (one per user) |
| `questions` → `user_progress` | 1:many | One question, many user attempts |
| `questions` ↔ `library` | many:many | Questions can be linked to multiple articles |
| `generation_prompts` → `questions` | 1:many | One prompt generates many questions |
| `pdf_uploads` → `questions` | 1:many | One PDF generates many questions |

## Data Flow Examples

### Example 1: User Takes a Quiz

```
1. User selects exam
   └─→ Query: exams.by_active

2. System fetches questions
   └─→ Query: questions.by_exam

3. User answers question
   └─→ Insert/Update: user_progress

4. System shows explanation
   └─→ Query: questions (includes explanation field)

5. System shows HY note
   └─→ Query: hy_notes.by_question
```

### Example 2: AI Generates Questions

```
1. Admin triggers generation
   └─→ Input: exam_id, subject, topic

2. System fetches prompt template
   └─→ Query: generation_prompts.by_active

3. AI generates questions
   └─→ External: OpenRouter API call

4. System stores questions
   └─→ Insert: questions (with generation_prompt_id)

5. System auto-generates HY notes
   └─→ Insert: hy_notes (linked to question_id)

6. System creates flashcards template
   └─→ Insert: flashcards (created when user first accesses)
```

### Example 3: User Uploads PDF

```
1. User uploads file
   └─→ Insert: pdf_uploads (status: "uploaded")
   └─→ Storage: _storage (Convex file storage)

2. System extracts text
   └─→ Update: pdf_uploads.extracted_text

3. AI generates questions from text
   └─→ Insert: questions (with source_file_id)

4. System links questions to upload
   └─→ Update: pdf_uploads.generated_question_ids[]

5. User reviews generated questions
   └─→ Query: questions.by_source_file_id
```

### Example 4: Spaced Repetition Review

```
1. User opens flashcard review
   └─→ Query: flashcards.by_next_review (where next_review <= now)

2. System shows flashcard
   └─→ Query: flashcards.by_user_and_exam

3. User rates difficulty (Easy/Hard)
   └─→ Update: flashcards (recalculate interval, ease_factor)

4. System schedules next review
   └─→ Update: flashcards.next_review (based on SM-2 algorithm)
```

## Index Usage Patterns

### High-Performance Queries

```typescript
// ✅ FAST: Uses index
questions.by_exam.eq(examId)

// ✅ FAST: Uses compound index
questions.by_exam_and_subject.eq(examId, subject)

// ✅ FAST: Uses index
user_progress.by_user_and_question.eq(userId, questionId)

// ✅ FAST: Uses index
flashcards.by_next_review.eq(userId).filter(q => q.lt(Date.now()))
```

### Queries to Avoid

```typescript
// ❌ SLOW: Full table scan
questions.filter(q => q.subject === "Cardiology")

// Instead use:
// ✅ FAST: Use index
questions.by_exam_and_subject.eq(examId, "Cardiology")
```

## Denormalization Strategy

### What's Denormalized?

1. **`subscriptions.clerkId`** - Copied from users for faster lookups
2. **`subscription_events.clerkId`** - Copied for faster filtering
3. **`flashcards.exam_id`** - Copied from questions for faster exam-level queries

### What's NOT Denormalized?

1. **Question counts** - Calculated dynamically via queries
2. **User progress stats** - Calculated on-demand
3. **Exam metadata** - Always fetched fresh

**Why?** Counts change frequently, so storing them would require constant updates.

## Migration-Safe Design

### Schema Version Tracking

Every table has `schemaVersion: v.number()` to track:

```typescript
// Version 1: Initial schema
{ schemaVersion: 1, ... }

// Version 2: Added difficulty field
{ schemaVersion: 2, difficulty: "medium", ... }

// Version 3: Added ai_confidence
{ schemaVersion: 3, ai_confidence: 0.95, ... }
```

### Safe Migration Pattern

```typescript
// 1. Add optional field
questions: defineTable({
  // ... existing fields
  new_field: v.optional(v.string()), // ✅ Safe
})

// 2. Run migration
export const migrateNewField = internalMutation({
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    for (const q of questions) {
      if (q.schemaVersion < 2) {
        await ctx.db.patch(q._id, {
          new_field: computeDefault(q),
          schemaVersion: 2,
        });
      }
    }
  },
});

// 3. Make required (later)
questions: defineTable({
  new_field: v.string(), // Now required
})
```

## Summary

**Total Tables:** 12
- **Core Content:** 5 (exams, questions, hy_notes, flashcards, library)
- **User Interaction:** 2 (user_progress, mock_exams)
- **AI Generation:** 2 (generation_prompts, pdf_uploads)
- **User/Auth:** 1 (users)
- **Subscriptions:** 3 (subscriptions, subscription_events, webhook_events)

**Total Indexes:** 35+
- All foreign keys indexed
- Compound indexes for common query patterns
- Optimized for real-time queries

**Design Principles:**
✅ Normalized where possible
✅ Denormalized for performance
✅ Migration-safe with version tracking
✅ AI-friendly field structure
✅ Cross-platform compatible
