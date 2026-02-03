# 🚀 Quick Reference: Backend API

**Project:** iOS Test Prep Platform  
**Backend:** Convex  
**Status:** Production Ready ✅

---

## 📚 Table of Contents

1. [Exams](#exams)
2. [Questions](#questions)
3. [User Progress](#user-progress)
4. [Flashcards](#flashcards)
5. [Library](#library)
6. [Mock Exams](#mock-exams)

---

## 1. Exams

### **Queries**
```typescript
// Get all exams
api.exams.getExams()
// Returns: Array<{ _id, name, description, active_question_count, ... }>

// Get single exam
api.exams.getExam({ exam_id })
```

### **Mutations**
```typescript
// Create exam
api.exams.createExam({
  name: "SMLE",
  description: "Saudi Medical Licensing Exam",
  category: "Medical"
})

// Update exam
api.exams.updateExam({
  exam_id,
  name: "Updated Name"
})
```

---

## 2. Questions

### **Queries**
```typescript
// Get questions by exam
api.questions.getQuestionsByExam({ exam_id, limit: 50 })

// Get questions by subject
api.questions.getQuestionsBySubjectOnly({ subject: "Cardiology" })

// Get questions by topic
api.questions.getQuestionsByTopicOnly({ topic: "Heart Failure" })

// Get questions by exam name
api.questions.getQuestionsByExamName({ exam_name: "SMLE" })

// Get single question
api.questions.getQuestion({ question_id })
```

### **Mutations**
```typescript
// Create question
api.questions.createQuestion({
  exam_id,
  q_text: "A 68-year-old patient with...",
  choices: ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
  correct_choice_index: 1,
  explanation: "The correct answer is B because...",
  hy_summary: "ACE inhibitors cause hyperkalemia and dry cough",
  subject: "Pharmacology",
  topic: "Cardiovascular Drugs",
  source_type: "manual_entry",
  source_of_answer: "Goodman & Gilman's Pharmacology"
})
// ✅ Auto-increments exam.active_question_count
// ✅ Auto-populates exam_name

// Delete question (soft)
api.questions.deleteQuestion({ question_id })
// ✅ Auto-decrements exam.active_question_count

// Permanently delete
api.questions.permanentlyDeleteQuestion({ question_id })
// ✅ Auto-decrements if active

// Add feedback
api.questions.addQuestionFeedback({
  question_id,
  type: "wrong_answer",
  text: "The explanation is unclear"
})

// Verify question
api.questions.verifyQuestion({ question_id, verified: true })
```

---

## 3. User Progress

### **Queries**
```typescript
// Get my progress
api.userProgress.getMyProgress({ limit: 100 })

// Get progress by status
api.userProgress.getProgressByStatus({
  status: "incorrect", // or "correct", "flagged", "skipped"
  limit: 100
})

// Get statistics
api.userProgress.getProgressStats()
// Returns: {
//   total_questions_attempted,
//   correct, incorrect, flagged, skipped,
//   total_attempts, total_time_seconds,
//   accuracy
// }

// Get progress for specific question
api.userProgress.getQuestionProgress({ question_id })
```

### **Mutations**
```typescript
// Record answer
api.userProgress.recordAnswer({
  question_id,
  selected_choice_index: 1,
  is_correct: true,
  time_spent_seconds: 45
})
// ✅ Auto-creates or updates progress
// ✅ Auto-increments attempts
// ✅ Auto-updates status

// Flag question
api.userProgress.flagQuestion({
  question_id,
  flagged: true
})

// Reset progress
api.userProgress.resetQuestionProgress({ question_id })
```

---

## 4. Flashcards

### **Queries**
```typescript
// Get due flashcards
api.flashcards.getDueFlashcards({ limit: 50 })
// Returns: Cards with next_review <= now

// Get flashcard statistics
api.flashcards.getFlashcardStats()
// Returns: {
//   total, new, learning, review, relearning,
//   due_today
// }

// Get my flashcards
api.flashcards.getMyFlashcards({
  status: "learning", // optional
  limit: 100
})
```

### **Mutations**
```typescript
// Create flashcard
api.flashcards.createFlashcard({ question_id })
// ✅ Auto-initializes SM-2 values

// Review flashcard
api.flashcards.reviewFlashcard({
  flashcard_id,
  rating: "good" // "again", "hard", "good", "easy"
})
// ✅ Auto-calculates next_review (SM-2)
// ✅ Auto-updates interval, ease_factor, repetitions
// ✅ Auto-updates status

// Delete flashcard
api.flashcards.deleteFlashcard({ flashcard_id })

// Reset flashcard
api.flashcards.resetFlashcard({ flashcard_id })
```

---

## 5. Library

### **Queries**
```typescript
// Get all articles
api.library.getArticles({
  exam_id, // optional
  subject, // optional
  limit: 100
})

// Get children of item
api.library.getLibraryChildren({ parent_id })

// Get full tree
api.library.getLibraryTree({ article_id })
// Returns: Article with nested sections and cards

// Get single item
api.library.getLibraryItem({ item_id })

// Search library
api.library.searchLibrary({
  search_term: "hypertension",
  limit: 50
})
```

### **Mutations**
```typescript
// Create article
api.library.createLibraryItem({
  type: "article",
  title: "Hypertension (HTN)",
  content_md: "Comprehensive guide...",
  subject: "Cardiology",
  exam_id
})

// Create section
api.library.createLibraryItem({
  type: "section",
  title: "Definition",
  parent_id: article_id
})
// ✅ Auto-calculates order

// Create card
api.library.createLibraryItem({
  type: "card",
  title: "What is HTN?",
  content_md: "**Hypertension** is...",
  parent_id: section_id,
  source: "JNC 8 Guidelines",
  related_question_ids: [q1, q2]
})

// Update item
api.library.updateLibraryItem({
  item_id,
  title: "Updated Title",
  content_md: "Updated content..."
})

// Delete item
api.library.deleteLibraryItem({
  item_id,
  delete_children: true
})
// ✅ Auto-deletes children recursively

// Reorder items
api.library.reorderLibraryItems({
  item_id,
  new_order: 5
})

// Link question
api.library.addQuestionToLibrary({
  item_id,
  question_id
})

// Unlink question
api.library.removeQuestionFromLibrary({
  item_id,
  question_id
})
```

---

## 6. Mock Exams

### **Queries**
```typescript
// Get mock exam
api.mockExams.getMockExam({ mock_exam_id })
// Returns: Exam with questions

// Get my mock exams
api.mockExams.getMyMockExams({
  exam_id, // optional
  completed_only: true, // optional
  limit: 50
})

// Get statistics
api.mockExams.getMockExamStats({ exam_id })
// Returns: {
//   total_exams, avg_score,
//   highest_score, lowest_score,
//   total_questions_attempted
// }
```

### **Mutations**
```typescript
// Create mock exam
api.mockExams.createMockExam({
  exam_id,
  mode: "tutor", // or "timed", "untimed"
  selection_criteria: {
    source: "incorrect", // "all", "unused", "incorrect", "flagged", "custom"
    subjects: ["Cardiology", "Pharmacology"], // optional
    topics: ["Heart Failure"], // optional
    question_count: 40
  },
  has_timer: true,
  time_limit_minutes: 60,
  time_per_question_seconds: 90 // optional
})
// ✅ Auto-selects questions based on criteria
// ✅ Auto-shuffles questions
// ✅ Auto-initializes answers array

// Submit answer
api.mockExams.submitAnswer({
  mock_exam_id,
  question_id,
  selected_choice_index: 1,
  time_spent_seconds: 45
})
// ✅ Auto-checks if correct
// ✅ Auto-updates answers array

// Flag question in exam
api.mockExams.flagQuestionInExam({
  mock_exam_id,
  question_id,
  flagged: true
})

// Complete exam
api.mockExams.completeMockExam({ mock_exam_id })
// ✅ Auto-calculates score_percentage
// ✅ Auto-calculates correct/incorrect/skipped counts
// ✅ Auto-generates performance_by_subject
// Returns: {
//   score_percentage,
//   correct_count,
//   incorrect_count,
//   skipped_count,
//   performance_by_subject: [
//     { subject, correct, total, percentage }
//   ]
// }

// Delete mock exam
api.mockExams.deleteMockExam({ mock_exam_id })
```

---

## 🎯 Common Workflows

### **Workflow 1: User Takes Quiz**
```typescript
// 1. Create mock exam
const { mock_exam_id } = await createMockExam({
  exam_id,
  mode: "tutor",
  selection_criteria: {
    source: "unused",
    question_count: 20
  },
  has_timer: true,
  time_limit_minutes: 30
});

// 2. Get exam with questions
const exam = await getMockExam({ mock_exam_id });

// 3. User answers questions
for (const question of exam.questions) {
  await submitAnswer({
    mock_exam_id,
    question_id: question._id,
    selected_choice_index: userChoice,
    time_spent_seconds: timeSpent
  });
}

// 4. Complete exam
const results = await completeMockExam({ mock_exam_id });
// Results: score, breakdown by subject, etc.
```

### **Workflow 2: Flashcard Review**
```typescript
// 1. Get due flashcards
const dueCards = await getDueFlashcards({ limit: 20 });

// 2. User reviews each card
for (const card of dueCards) {
  // Show question
  // User rates difficulty
  await reviewFlashcard({
    flashcard_id: card._id,
    rating: userRating // "again", "hard", "good", "easy"
  });
  // ✅ Next review auto-scheduled
}

// 3. Check stats
const stats = await getFlashcardStats();
// Shows: new, learning, review, due_today
```

### **Workflow 3: Study Library**
```typescript
// 1. Browse articles
const articles = await getArticles({ subject: "Cardiology" });

// 2. View article tree
const tree = await getLibraryTree({ article_id });
// Returns: Article → Sections → Cards

// 3. View related questions
for (const card of tree.sections[0].cards) {
  if (card.related_question_ids.length > 0) {
    // Show linked questions
  }
}
```

---

## 🔄 Automatic Updates

### **What Updates Automatically:**

1. **Question Counts**
   - ✅ `exam.active_question_count` updates when questions added/removed

2. **User Statistics**
   - ✅ All stats computed from `user_progress` table
   - ✅ No stored counts

3. **Flashcard Scheduling**
   - ✅ `next_review` calculated by SM-2 algorithm
   - ✅ `interval`, `ease_factor`, `repetitions` auto-updated

4. **Mock Exam Scores**
   - ✅ Scores calculated from `answers` array
   - ✅ Subject breakdown auto-generated

5. **Library Ordering**
   - ✅ `order` auto-calculated for new items

6. **Exam Names**
   - ✅ `question.exam_name` auto-populated from `exam.name`

---

## 🚫 What's NOT Automated

### **Content Creation (Requires Human/AI):**
- ❌ Writing questions
- ❌ Creating explanations
- ❌ Writing library articles
- ❌ Selecting exam categories

**Future:** Will be automated via AI (OpenRouter)

---

## 📊 Data Relationships

```
exams
  ├─ questions (1:many)
  │   ├─ user_progress (1:many)
  │   ├─ flashcards (1:many)
  │   └─ library.related_question_ids (many:many)
  └─ mock_exams (1:many)

library (hierarchical)
  ├─ article (parent_id = null)
  │   ├─ section (parent_id = article_id)
  │   │   └─ card (parent_id = section_id)

users
  ├─ user_progress (1:many)
  ├─ flashcards (1:many)
  └─ mock_exams (1:many)
```

---

## 🎯 Performance Tips

### **Use Indexes:**
```typescript
// ✅ Fast (indexed)
getQuestionsByExam({ exam_id })
getQuestionsBySubjectOnly({ subject })
getProgressByStatus({ status: "incorrect" })
getDueFlashcards()

// ❌ Slow (not indexed)
// Filter by non-indexed fields
```

### **Batch Operations:**
```typescript
// ✅ Good: Get all questions once
const questions = await getQuestionsByExam({ exam_id });

// ❌ Bad: Get questions one by one
for (const id of questionIds) {
  const q = await getQuestion({ question_id: id });
}
```

### **Computed Stats:**
```typescript
// ✅ Stats are computed on query
// No need to update stored values
const stats = await getProgressStats();
```

---

## 🔒 Authentication

All mutations and queries require authentication via Clerk.

```typescript
// User must be logged in
// Convex automatically gets user from ctx.auth.getUserIdentity()
```

---

## 📝 Notes

- All timestamps are in milliseconds (Date.now())
- All IDs are Convex IDs (v.id("table_name"))
- All arrays use Convex array validators
- All optional fields use v.optional()

---

*Last Updated: February 3, 2026*  
*Backend Version: 1.0*  
*Status: Production Ready ✅*
