import { mutation } from "./_generated/server";

/**
 * Seed sample library content: Hypertension (HTN) article
 */
export const seedHTNLibrary = mutation({
    args: {},
    handler: async (ctx) => {
        // Get SMLE exam
        const smle = await ctx.db
            .query("exams")
            .filter((q) => q.eq(q.field("name"), "SMLE"))
            .first();

        if (!smle) {
            throw new Error("SMLE exam not found");
        }

        const now = Date.now();

        // Create Article: Hypertension
        const htnId = await ctx.db.insert("library", {
            type: "article",
            title: "Hypertension (HTN)",
            content_md: "Comprehensive guide to hypertension diagnosis and management.",
            exam_id: smle._id,
            subject: "Cardiology",
            topic: "Hypertension",
            related_question_ids: [],
            order: 0,
            ai_generated: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // Section 1: Definition
        const defSectionId = await ctx.db.insert("library", {
            parent_id: htnId,
            type: "section",
            title: "Definition",
            exam_id: smle._id,
            subject: "Cardiology",
            topic: "Hypertension",
            related_question_ids: [],
            order: 0,
            ai_generated: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // Cards under Definition
        await ctx.db.insert("library", {
            parent_id: defSectionId,
            type: "card",
            title: "What is Hypertension?",
            content_md: `**Hypertension** is sustained elevation of blood pressure:
- **Systolic BP** ≥140 mmHg, OR
- **Diastolic BP** ≥90 mmHg

Measured on ≥2 occasions in a clinical setting.`,
            source: "JNC 8 Guidelines",
            exam_id: smle._id,
            subject: "Cardiology",
            related_question_ids: [],
            order: 0,
            ai_generated: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("library", {
            parent_id: defSectionId,
            type: "card",
            title: "Classification",
            content_md: `### Blood Pressure Categories

| Category | Systolic (mmHg) | Diastolic (mmHg) |
|----------|----------------|------------------|
| Normal | <120 | <80 |
| Elevated | 120-129 | <80 |
| Stage 1 HTN | 130-139 | 80-89 |
| Stage 2 HTN | ≥140 | ≥90 |
| Hypertensive Crisis | >180 | >120 |`,
            source: "ACC/AHA 2017 Guidelines",
            exam_id: smle._id,
            subject: "Cardiology",
            related_question_ids: [],
            order: 1,
            ai_generated: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // Section 2: Pathophysiology
        const pathoSectionId = await ctx.db.insert("library", {
            parent_id: htnId,
            type: "section",
            title: "Pathophysiology",
            exam_id: smle._id,
            subject: "Cardiology",
            topic: "Hypertension",
            related_question_ids: [],
            order: 1,
            ai_generated: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("library", {
            parent_id: pathoSectionId,
            type: "card",
            title: "Mechanisms",
            content_md: `### Key Mechanisms

1. **Increased Cardiac Output**
   - Increased heart rate
   - Increased stroke volume

2. **Increased Peripheral Resistance**
   - Vasoconstriction
   - Arterial stiffness

3. **RAAS Activation**
   - Renin → Angiotensin II → Aldosterone
   - Sodium and water retention

4. **Sympathetic Nervous System**
   - Increased catecholamines
   - Vasoconstriction`,
            source: "Harrison's Internal Medicine, 21st Ed",
            exam_id: smle._id,
            subject: "Cardiology",
            related_question_ids: [],
            order: 0,
            ai_generated: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("library", {
            parent_id: pathoSectionId,
            type: "card",
            title: "Risk Factors",
            content_md: `### Non-Modifiable
- Age (>65 years)
- Family history
- Race (African American)
- Gender (men > women before menopause)

### Modifiable
- **Obesity** (BMI >30)
- **High sodium intake** (>2.3g/day)
- **Physical inactivity**
- **Excessive alcohol** (>2 drinks/day)
- **Smoking**
- **Stress**`,
            source: "AHA Guidelines",
            exam_id: smle._id,
            subject: "Cardiology",
            related_question_ids: [],
            order: 1,
            ai_generated: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        // Section 3: Treatment
        const txSectionId = await ctx.db.insert("library", {
            parent_id: htnId,
            type: "section",
            title: "Treatment",
            exam_id: smle._id,
            subject: "Cardiology",
            topic: "Hypertension",
            related_question_ids: [],
            order: 2,
            ai_generated: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("library", {
            parent_id: txSectionId,
            type: "card",
            title: "Lifestyle Modifications",
            content_md: `### DASH Diet
- **D**ietary **A**pproaches to **S**top **H**ypertension
- High fruits, vegetables, low-fat dairy
- Reduce sodium to <1.5g/day

### Exercise
- 150 min/week moderate aerobic activity
- Resistance training 2x/week

### Weight Loss
- Target BMI 18.5-24.9
- 5-10% weight loss → 5 mmHg BP reduction

### Limit Alcohol
- Men: ≤2 drinks/day
- Women: ≤1 drink/day`,
            source: "AHA Lifestyle Guidelines",
            exam_id: smle._id,
            subject: "Cardiology",
            related_question_ids: [],
            order: 0,
            ai_generated: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.insert("library", {
            parent_id: txSectionId,
            type: "card",
            title: "First-Line Medications",
            content_md: `### Initial Therapy (Stage 1 HTN)

**Monotherapy Options:**

1. **ACE Inhibitors** (-pril)
   - Lisinopril, Enalapril
   - SE: Dry cough, hyperkalemia

2. **ARBs** (-sartan)
   - Losartan, Valsartan
   - SE: Hyperkalemia (no cough)

3. **Calcium Channel Blockers**
   - Amlodipine (DHP)
   - SE: Peripheral edema

4. **Thiazide Diuretics**
   - Hydrochlorothiazide
   - SE: Hypokalemia, hyperglycemia

### Stage 2 HTN
Start with **2 drugs** from different classes`,
            source: "JNC 8 Guidelines",
            exam_id: smle._id,
            subject: "Cardiology",
            related_question_ids: [],
            order: 1,
            ai_generated: false,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });

        return {
            success: true,
            message: "HTN library article created with 3 sections and 7 cards",
            article_id: htnId,
        };
    },
});
