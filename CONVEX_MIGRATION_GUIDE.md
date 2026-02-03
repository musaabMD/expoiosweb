# Safe Schema Migration Pattern for Convex

## The Problem
When you add a **required** field to an existing table with data, Convex will fail validation because existing documents don't have that field.

## The Solution: 3-Step Migration Pattern

### Step 1: Add Field as OPTIONAL
```typescript
// convex/schema.ts
questions: defineTable({
  // ... existing fields
  exam_name: v.optional(v.string()), // ✅ OPTIONAL first!
})
```

**Why?** Existing documents without `exam_name` will still pass validation.

### Step 2: Run Migration to Populate Data
```typescript
// convex/migrations.ts
export const addExamNameToQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db.query("questions").collect();
    
    for (const question of questions) {
      if (!question.exam_name) { // Only update if missing
        const exam = await ctx.db.get(question.exam_id);
        if (exam) {
          await ctx.db.patch(question._id, {
            exam_name: exam.name,
          });
        }
      }
    }
    
    return { success: true };
  },
});
```

Run it:
```bash
npx convex run migrations:addExamNameToQuestions '{}'
```

### Step 3: Make Field REQUIRED (Optional)
Once all documents have the field, you can make it required:

```typescript
// convex/schema.ts
questions: defineTable({
  // ... existing fields
  exam_name: v.string(), // ✅ Now required
})
```

**Note:** This step is optional. You can keep it as `v.optional()` if you want flexibility.

---

## Common Migration Scenarios

### Adding a New Field
```typescript
// ✅ SAFE: Add as optional
newField: v.optional(v.string())

// ❌ UNSAFE: Add as required (will break existing data)
newField: v.string()
```

### Renaming a Field
```typescript
// Step 1: Add new field as optional
newFieldName: v.optional(v.string())

// Step 2: Migrate data
for (const doc of docs) {
  await ctx.db.patch(doc._id, {
    newFieldName: doc.oldFieldName,
  });
}

// Step 3: Remove old field from schema
// (Convex will keep old data, but new docs won't have it)
```

### Changing Field Type
```typescript
// Step 1: Add new field with new type
fieldName_new: v.optional(v.number())

// Step 2: Migrate data with conversion
for (const doc of docs) {
  await ctx.db.patch(doc._id, {
    fieldName_new: parseInt(doc.fieldName), // Convert string to number
  });
}

// Step 3: Remove old field, rename new field
```

### Adding an Index
```typescript
// ✅ SAFE: Indexes can be added/removed anytime
.index("by_new_field", ["newField"])
```

---

## Best Practices

### 1. **Always Use Optional First**
```typescript
// ✅ DO THIS
newField: v.optional(v.string())

// ❌ DON'T DO THIS (if table has data)
newField: v.string()
```

### 2. **Use Schema Version Tracking**
```typescript
questions: defineTable({
  // ... fields
  schemaVersion: v.number(), // Track version per document
})

// In migration
if (question.schemaVersion < 2) {
  await ctx.db.patch(question._id, {
    newField: computeValue(),
    schemaVersion: 2,
  });
}
```

### 3. **Test Migrations in Dev First**
```bash
# Run in dev deployment
npx convex run migrations:yourMigration '{}'

# Check data in dashboard
# Then deploy to prod
npx convex deploy --prod
```

### 4. **Make Migrations Idempotent**
```typescript
// ✅ GOOD: Check if already migrated
if (!doc.newField) {
  await ctx.db.patch(doc._id, { newField: value });
}

// ❌ BAD: Always update (runs multiple times = bad)
await ctx.db.patch(doc._id, { newField: value });
```

### 5. **Batch Large Migrations**
```typescript
// For large tables, process in batches
const BATCH_SIZE = 100;
const questions = await ctx.db
  .query("questions")
  .take(BATCH_SIZE);

// Run multiple times until all done
```

---

## Migration Checklist

- [ ] Add new field as `v.optional()`
- [ ] Deploy schema change
- [ ] Write migration function
- [ ] Test migration in dev
- [ ] Run migration
- [ ] Verify data in dashboard
- [ ] (Optional) Make field required
- [ ] Update application code to use new field

---

## Example: Your Current Migration

### What Happened
1. ❌ Added `exam_name: v.string()` (required)
2. ❌ Existing 10 questions don't have `exam_name`
3. ❌ Schema validation failed

### Fix Applied
1. ✅ Changed to `exam_name: v.optional(v.string())`
2. ✅ Now existing questions pass validation
3. ✅ New questions will include `exam_name`
4. ✅ Can run migration later to backfill old questions

---

## Convex Auto-Migration Features

Convex automatically handles:
- ✅ Adding new tables
- ✅ Adding/removing indexes
- ✅ Adding optional fields
- ✅ Removing fields from schema (data stays in DB)

Convex DOES NOT auto-handle:
- ❌ Adding required fields to existing tables
- ❌ Changing field types
- ❌ Renaming fields
- ❌ Data transformations

**You must write migrations for these!**

---

## Summary

**Golden Rule:** When adding fields to tables with existing data, **ALWAYS start with `v.optional()`**, then migrate, then optionally make required.

This prevents data loss and schema validation errors! 🚀
