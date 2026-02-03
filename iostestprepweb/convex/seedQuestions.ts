import { mutation } from "./_generated/server";

/**
 * Seed sample SMLE questions
 * Creates 10 high-quality medical questions across different subjects
 */
export const seedSMLEQuestions = mutation({
    args: {},
    handler: async (ctx) => {
        // Get SMLE exam
        const smle = await ctx.db
            .query("exams")
            .filter((q) => q.eq(q.field("name"), "SMLE"))
            .first();

        if (!smle) {
            throw new Error("SMLE exam not found. Please run seedSCFHSExams first.");
        }

        const now = Date.now();
        const questions = [
            // Question 1: Cardiology
            {
                q_text: "A 55-year-old male with a history of hypertension presents to the emergency department with severe chest pain radiating to the left arm. ECG shows ST-segment elevation in leads II, III, and aVF. What is the most likely diagnosis?",
                choices: [
                    "A. Anterior wall myocardial infarction",
                    "B. Inferior wall myocardial infarction",
                    "C. Lateral wall myocardial infarction",
                    "D. Unstable angina"
                ],
                correct_choice_index: 1,
                explanation: "ST-segment elevation in leads II, III, and aVF indicates inferior wall myocardial infarction, typically caused by occlusion of the right coronary artery. Anterior MI would show changes in V1-V4, and lateral MI in I, aVL, V5-V6.",
                source_of_answer: "AHA STEMI Guidelines 2023",
                hy_summary: "Inferior MI shows ST elevation in leads II, III, aVF (right coronary artery territory)",
                exam_id: smle._id,
                exam_name: smle.name,
                subject: "Cardiology",
                topic: "Acute Coronary Syndrome",
                ai_generated: false,
                source_type: "manual_entry" as const,
                verified: true,
                feedback: [],
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },

            // Question 2: Pharmacology
            {
                q_text: "A 68-year-old patient with heart failure is started on an ACE inhibitor. Which of the following adverse effects should be monitored?",
                choices: [
                    "A. Hypokalemia and metabolic alkalosis",
                    "B. Hyperkalemia and dry cough",
                    "C. Hypoglycemia and weight gain",
                    "D. Thrombocytopenia and bleeding"
                ],
                correct_choice_index: 1,
                explanation: "ACE inhibitors commonly cause hyperkalemia (by reducing aldosterone) and dry cough (due to bradykinin accumulation). Hypokalemia is associated with diuretics, not ACE inhibitors.",
                source_of_answer: "Goodman & Gilman's Pharmacology, 14th Edition",
                hy_summary: "ACE inhibitors cause hyperkalemia and dry cough (bradykinin accumulation)",
                exam_id: smle._id,
                exam_name: smle.name,
                subject: "Pharmacology",
                topic: "Cardiovascular Drugs",
                ai_generated: false,
                source_type: "manual_entry" as const,
                verified: true,
                feedback: [],
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },

            // Question 3: Endocrinology
            {
                q_text: "A 35-year-old female presents with weight gain, moon facies, buffalo hump, and purple striae. Laboratory tests show elevated 24-hour urinary free cortisol. What is the next best step in diagnosis?",
                choices: [
                    "A. MRI of the pituitary gland",
                    "B. Low-dose dexamethasone suppression test",
                    "C. High-dose dexamethasone suppression test",
                    "D. CT scan of the adrenal glands"
                ],
                correct_choice_index: 1,
                explanation: "After confirming hypercortisolism with elevated 24-hour urinary cortisol, the low-dose dexamethasone suppression test is used to confirm Cushing's syndrome. High-dose test and imaging come later to determine the cause.",
                source_of_answer: "Endocrine Society Clinical Practice Guidelines",
                hy_summary: "Cushing's diagnosis: elevated urinary cortisol → low-dose dexamethasone test → determine cause",
                exam_id: smle._id,
                exam_name: smle.name,
                subject: "Endocrinology",
                topic: "Cushing Syndrome",
                ai_generated: false,
                source_type: "manual_entry" as const,
                verified: true,
                feedback: [],
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },

            // Question 4: Infectious Disease
            {
                q_text: "A 25-year-old man presents with fever, headache, and a petechial rash that does not blanch on pressure. Lumbar puncture shows elevated WBCs with predominant neutrophils, low glucose, and high protein. Gram stain shows gram-negative diplococci. What is the most appropriate initial treatment?",
                choices: [
                    "A. Vancomycin",
                    "B. Ceftriaxone",
                    "C. Ampicillin",
                    "D. Doxycycline"
                ],
                correct_choice_index: 1,
                explanation: "This presentation is classic for Neisseria meningitidis meningitis (gram-negative diplococci with petechial rash). Ceftriaxone is the first-line treatment. Vancomycin is used for gram-positive organisms.",
                source_of_answer: "CDC Meningitis Guidelines 2024",
                hy_summary: "Meningococcal meningitis: gram-negative diplococci + petechiae → treat with ceftriaxone",
                exam_id: smle._id,
                exam_name: smle.name,
                subject: "Infectious Disease",
                topic: "Bacterial Meningitis",
                ai_generated: false,
                source_type: "manual_entry" as const,
                verified: true,
                feedback: [],
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },

            // Question 5: Nephrology
            {
                q_text: "A 45-year-old diabetic patient has a serum creatinine of 2.5 mg/dL and proteinuria of 3.5 g/day. Kidney biopsy shows nodular glomerulosclerosis (Kimmelstiel-Wilson lesions). What is the diagnosis?",
                choices: [
                    "A. Minimal change disease",
                    "B. Focal segmental glomerulosclerosis",
                    "C. Diabetic nephropathy",
                    "D. Membranous nephropathy"
                ],
                correct_choice_index: 2,
                explanation: "Kimmelstiel-Wilson lesions (nodular glomerulosclerosis) are pathognomonic for diabetic nephropathy. The patient has nephrotic-range proteinuria (>3.5 g/day) and chronic kidney disease.",
                source_of_answer: "KDIGO Diabetes and CKD Guidelines",
                hy_summary: "Kimmelstiel-Wilson lesions (nodular glomerulosclerosis) = diabetic nephropathy",
                exam_id: smle._id,
                exam_name: smle.name,
                subject: "Nephrology",
                topic: "Diabetic Nephropathy",
                ai_generated: false,
                source_type: "manual_entry" as const,
                verified: true,
                feedback: [],
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },

            // Question 6: Hematology
            {
                q_text: "A 30-year-old African American male presents with fatigue and jaundice. Blood tests show hemoglobin 8 g/dL, elevated reticulocyte count, and indirect bilirubin. Peripheral smear shows sickle-shaped cells. What is the most appropriate long-term management?",
                choices: [
                    "A. Blood transfusions only",
                    "B. Hydroxyurea",
                    "C. Iron supplementation",
                    "D. Splenectomy"
                ],
                correct_choice_index: 1,
                explanation: "Hydroxyurea increases fetal hemoglobin (HbF) production, which reduces sickling and decreases the frequency of vaso-occlusive crises in sickle cell disease. It is the mainstay of long-term management.",
                source_of_answer: "ASH Sickle Cell Disease Guidelines",
                hy_summary: "Sickle cell disease: hydroxyurea increases HbF and reduces crises",
                exam_id: smle._id,
                exam_name: smle.name,
                subject: "Hematology",
                topic: "Sickle Cell Disease",
                ai_generated: false,
                source_type: "manual_entry" as const,
                verified: true,
                feedback: [],
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },

            // Question 7: Gastroenterology
            {
                q_text: "A 50-year-old man with chronic alcohol use presents with hematemesis. Endoscopy reveals dilated submucosal veins in the lower esophagus. What is the most appropriate initial treatment?",
                choices: [
                    "A. Proton pump inhibitors",
                    "B. Octreotide and endoscopic band ligation",
                    "C. Antibiotics only",
                    "D. Emergency surgery"
                ],
                correct_choice_index: 1,
                explanation: "Esophageal varices from portal hypertension require octreotide (reduces portal pressure) and endoscopic band ligation for acute bleeding. PPIs are not effective for variceal bleeding.",
                source_of_answer: "AASLD Portal Hypertension Guidelines",
                hy_summary: "Variceal bleeding: octreotide + endoscopic band ligation (not PPIs)",
                exam_id: smle._id,
                exam_name: smle.name,
                subject: "Gastroenterology",
                topic: "Esophageal Varices",
                ai_generated: false,
                source_type: "manual_entry" as const,
                verified: true,
                feedback: [],
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },

            // Question 8: Pulmonology
            {
                q_text: "A 65-year-old smoker presents with progressive dyspnea. Spirometry shows FEV1/FVC ratio <0.7 and reduced FEV1. Chest X-ray shows hyperinflation and flattened diaphragm. What is the diagnosis?",
                choices: [
                    "A. Asthma",
                    "B. Chronic obstructive pulmonary disease (COPD)",
                    "C. Interstitial lung disease",
                    "D. Pulmonary embolism"
                ],
                correct_choice_index: 1,
                explanation: "FEV1/FVC <0.7 with reduced FEV1 indicates obstructive lung disease. Combined with smoking history and hyperinflation, this is diagnostic of COPD. Asthma typically shows reversibility with bronchodilators.",
                source_of_answer: "GOLD COPD Guidelines 2024",
                hy_summary: "COPD diagnosis: FEV1/FVC <0.7 + smoking history + hyperinflation",
                exam_id: smle._id,
                exam_name: smle.name,
                subject: "Pulmonology",
                topic: "COPD",
                ai_generated: false,
                source_type: "manual_entry" as const,
                verified: true,
                feedback: [],
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },

            // Question 9: Neurology
            {
                q_text: "A 70-year-old woman presents with resting tremor, bradykinesia, and rigidity. Symptoms improve with levodopa. What is the underlying pathophysiology?",
                choices: [
                    "A. Loss of dopaminergic neurons in substantia nigra",
                    "B. Accumulation of beta-amyloid plaques",
                    "C. Demyelination of motor neurons",
                    "D. Cerebellar degeneration"
                ],
                correct_choice_index: 0,
                explanation: "Parkinson's disease is caused by loss of dopaminergic neurons in the substantia nigra pars compacta, leading to decreased dopamine in the striatum. This explains why levodopa (dopamine precursor) is effective.",
                source_of_answer: "Movement Disorders Society PD Guidelines",
                hy_summary: "Parkinson's disease: loss of dopaminergic neurons in substantia nigra → responds to levodopa",
                exam_id: smle._id,
                exam_name: smle.name,
                subject: "Neurology",
                topic: "Parkinson Disease",
                ai_generated: false,
                source_type: "manual_entry" as const,
                verified: true,
                feedback: [],
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },

            // Question 10: Obstetrics
            {
                q_text: "A 28-year-old pregnant woman at 32 weeks gestation presents with severe headache, visual disturbances, and blood pressure of 160/110 mmHg. Urinalysis shows 3+ proteinuria. What is the most appropriate management?",
                choices: [
                    "A. Expectant management until 37 weeks",
                    "B. Immediate delivery",
                    "C. Magnesium sulfate and antihypertensives, plan delivery at 34 weeks",
                    "D. Bed rest and observation only"
                ],
                correct_choice_index: 2,
                explanation: "This is severe preeclampsia. Management includes magnesium sulfate (seizure prophylaxis), antihypertensives, and delivery planning. At 32 weeks, stabilization with delivery at 34 weeks (after corticosteroids) is appropriate.",
                source_of_answer: "ACOG Hypertension in Pregnancy Guidelines",
                hy_summary: "Severe preeclampsia: MgSO4 + antihypertensives + plan delivery (not immediate if <34 weeks)",
                exam_id: smle._id,
                exam_name: smle.name,
                subject: "Obstetrics",
                topic: "Preeclampsia",
                ai_generated: false,
                source_type: "manual_entry" as const,
                verified: true,
                feedback: [],
                isActive: true,
                createdAt: now,
                updatedAt: now,
                schemaVersion: 1,
            },
        ];

        // Insert all questions
        const insertedIds = [];
        for (const question of questions) {
            const id = await ctx.db.insert("questions", question);
            insertedIds.push(id);
        }

        // Update SMLE exam question count
        await ctx.db.patch(smle._id, {
            active_question_count: smle.active_question_count + questions.length,
            updatedAt: now,
        });

        return {
            success: true,
            inserted: insertedIds.length,
            message: `Successfully seeded ${insertedIds.length} SMLE questions`,
            exam: smle.name,
        };
    },
});
