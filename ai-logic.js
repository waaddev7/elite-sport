// ============================================================
//  Elite Sport – AI Trainer Logic
//  كل القيم من الـ AI — مع validation يضمن المنطق
// ============================================================

document.querySelectorAll('.goal-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.goal-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });
});

function toggleDiseaseField(show) {
    const wrap = document.getElementById('disease-input-wrap');
    if (wrap) wrap.style.display = show ? 'block' : 'none';

    if (!show && document.getElementById('disease-details')) {
        document.getElementById('disease-details').value = "";
    }
}

async function generatePlan() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const age = parseInt(document.getElementById('age').value);

    const hasIssue = document.querySelector('input[name="health_issue"]:checked').value === "yes";
    const diseaseDetails = document.getElementById('disease-details').value.trim();

    const selectedGoal = document.querySelector('.goal-item.active');
    const goal = selectedGoal ? selectedGoal.dataset.goal : "Lose Weight";

    if (
        isNaN(weight) || weight < 20 || weight > 250 ||
        isNaN(height) || height < 110 || height > 230 ||
        isNaN(age) || age < 10 || age > 70
    ) {
        alert("Please enter valid metrics (Weight 20-250kg, Height 110-230cm, Age 10-70).");
        return;
    }

    if (hasIssue && !diseaseDetails) {
        alert("Please describe your health concern.");
        return;
    }

    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
    const bmiNum = parseFloat(bmi);

    // ── Smart BMI Goal Validation ───────────────────────────
    let finalGoal = goal;

    // إذا الشخص Underweight ممنوع خطة Lose Weight
    if (bmiNum < 18.5 && goal === "Lose Weight") {
        finalGoal = "Gain Muscle";
    }

    // إذا الشخص BMI عالي جدًا، نخلي الهدف Fitness آمن بدل عضلات مباشرة
    if (bmiNum > 35 && goal === "Gain Muscle") {
        finalGoal = "General Fitness";
    }

    const numDays =
        bmiNum < 18.5 ? 3 :
        hasIssue ? 3 :
        finalGoal === "Gain Muscle" ? 5 : 4;

    const tdee = Math.round((10 * weight + 6.25 * height - 5 * age + 5) * 1.55);

    document.getElementById('ai-form-section').style.display = 'none';
    document.getElementById('loading-section').style.display = 'block';

    const prompt = `You are a certified fitness AI coach. Generate a complete realistic fitness plan in valid JSON only.

User Profile:
- Age: ${age} years
- Weight: ${weight} kg
- Height: ${height} cm
- BMI: ${bmi} (${bmiNum < 18.5 ? 'Underweight' : bmiNum < 25 ? 'Normal' : bmiNum < 30 ? 'Overweight' : 'Obese'})
- Original Selected Goal: ${goal}
- Corrected Safe Goal: ${finalGoal}
- Health issues: ${hasIssue ? diseaseDetails : "None"}
- TDEE: ${tdee} kcal/day

STRICT RULES — follow exactly or the output will be rejected:

1. If BMI is under 18.5, NEVER create a weight loss plan, calorie deficit plan, fat loss plan, or weight decrease projection.
2. If BMI is under 18.5, planTitle MUST be about healthy weight gain, muscle gain, or recovery.
3. If BMI is under 18.5, weeklySummary MUST mention safe weight gain and strength building, NOT weight loss.
4. bodyStats.fat: realistic body fat % for this exact BMI and age. Underweight BMI: 10-15%, Normal BMI: 15-22%, Overweight: 23-30%, Obese: 30-40%.
5. bodyStats.muscle: realistic muscle mass % for this profile. Range 28-45%.
6. projections.weight: MUST be 4 numbers starting from exactly ${weight}.
   - If BMI < 18.5: each value MUST be HIGHER than previous (+0.2 to +0.5 each week).
   - Goal "Gain Muscle": each value MUST be HIGHER than previous (+0.2 to +0.5 each week).
   - Goal "Lose Weight" with BMI >= 18.5: each value MUST be LOWER than previous (-0.3 to -0.6 each week).
   - Goal "General Fitness": same or slightly higher (+0.0 to +0.2 each week). NO drops.
7. projections.muscle: MUST be 4 numbers.
   - If BMI < 18.5: each value MUST be HIGHER than previous.
   - Goal "Gain Muscle": each value MUST be HIGHER than previous.
   - Goal "Lose Weight": stable or very slight decrease.
   - Goal "General Fitness": same or slightly higher. NO drops.
8. days: exactly ${numDays} days with realistic names.
   - For BMI < 18.5: use gentle strength, mobility, resistance bands, walking, yoga. Avoid jogging, jumping jacks, HIIT, intense cardio.
   - For BMI < 18.5: cal per session 180-350 kcal only.
   - Normal cases: cal per session 300-700 kcal. Active Recovery: 150-220 kcal only.
   - duration: 25-60 min. Active Recovery: 20-40 min only.
9. history: exactly 5 named sessions matching the safe goal "${finalGoal}".
10. weightChange:
   - BMI < 18.5: "+X.Xkg"
   - Gain Muscle: "+X.Xkg"
   - Lose Weight: "-X.Xkg"
   - General Fitness: "±0.Xkg"
11. fatChange and muscleChange must match the safe goal.
12. Age < 16: youth-appropriate exercises only. No heavy barbell movements.
13. If health issues: safe exercises avoiding "${hasIssue ? diseaseDetails : 'N/A'}".

Respond ONLY with this exact JSON, no markdown:
{
  "planTitle": "string",
  "weeklySummary": "string",
  "bodyStats": {
    "fat": "X.X%",
    "muscle": "XX.X%",
    "fatChange": "string",
    "muscleChange": "string",
    "weightChange": "string"
  },
  "projections": {
    "weight": [number, number, number, number],
    "muscle": [number, number, number, number]
  },
  "history": [
    {"name": "string", "cal": "string", "dur": "string"},
    {"name": "string", "cal": "string", "dur": "string"},
    {"name": "string", "cal": "string", "dur": "string"},
    {"name": "string", "cal": "string", "dur": "string"},
    {"name": "string", "cal": "string", "dur": "string"}
  ],
  "days": [
    {
      "day": "string",
      "cal": "string",
      "duration": "string",
      "focus": "string",
      "intensity": "string",
      "ex": ["string", "string"],
      "diff": "X/10",
      "safety": "string"
    }
  ]
}`;

    try {
        const data = await apiRequest("/generate-plan", "POST", { prompt });
        if (data.error) throw new Error(data.error.message || "AI request failed");

        const rawText = data.choices[0].message.content.trim();
        const aiPlan = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);

        // ── Validation بعد الـ AI ─────────────────────────────
        aiPlan.projections.weight = fixWeightProjection(aiPlan.projections.weight, weight, finalGoal, bmiNum);
        aiPlan.projections.muscle = fixMuscleProjection(aiPlan.projections.muscle, finalGoal, bmiNum);
        aiPlan.bodyStats.fat = fixPercent(aiPlan.bodyStats.fat, 5, 50);
        aiPlan.bodyStats.muscle = fixPercent(aiPlan.bodyStats.muscle, 20, 55);

        aiPlan.planTitle = fixPlanTitle(aiPlan.planTitle, finalGoal, bmiNum);
        aiPlan.weeklySummary = fixWeeklySummary(aiPlan.weeklySummary, finalGoal, bmiNum);

        if (bmiNum < 18.5) {
            aiPlan.days = fixUnderweightDays(aiPlan.days);
            aiPlan.history = fixUnderweightHistory(aiPlan.history);
            aiPlan.bodyStats.weightChange = "+1.2kg";
            aiPlan.bodyStats.muscleChange = "+0.8% muscle";
            aiPlan.bodyStats.fatChange = "Healthy increase";
        }

        document.getElementById('loading-section').style.display = 'none';
        renderAIPlan(aiPlan, bmi, weight, finalGoal);

    } catch (error) {
        document.getElementById('loading-section').style.display = 'none';
        document.getElementById('ai-form-section').style.display = 'block';
        alert("AI Error: " + error.message);
        console.error(error);
    }
}

// ── Weight Projection Fix ───────────────────────────────────
function fixWeightProjection(proj, weight, goal, bmiNum) {
    if (!Array.isArray(proj) || proj.length !== 4) {
        return buildWeightFallback(weight, goal, bmiNum);
    }

    const nums = proj.map(v => parseFloat(v));
    if (nums.some(isNaN)) return buildWeightFallback(weight, goal, bmiNum);

    if (bmiNum < 18.5) {
        if (!(nums[1] > nums[0] && nums[2] > nums[1] && nums[3] > nums[2])) {
            return buildWeightFallback(weight, goal, bmiNum);
        }
    } else if (goal === "Gain Muscle") {
        if (!(nums[1] > nums[0] && nums[2] > nums[1] && nums[3] > nums[2])) {
            return buildWeightFallback(weight, goal, bmiNum);
        }
    } else if (goal === "Lose Weight") {
        if (!(nums[1] < nums[0] && nums[2] < nums[1] && nums[3] < nums[2])) {
            return buildWeightFallback(weight, goal, bmiNum);
        }
    } else {
        if (nums[1] < nums[0] || nums[2] < nums[1] || nums[3] < nums[2]) {
            return buildWeightFallback(weight, goal, bmiNum);
        }
    }

    nums[0] = weight;
    return nums;
}

function buildWeightFallback(weight, goal, bmiNum) {
    if (bmiNum < 18.5) {
        return [
            weight,
            +(weight + 0.4).toFixed(1),
            +(weight + 0.8).toFixed(1),
            +(weight + 1.2).toFixed(1)
        ];
    }

    if (goal === "Gain Muscle") {
        return [
            weight,
            +(weight + 0.3).toFixed(1),
            +(weight + 0.7).toFixed(1),
            +(weight + 1.2).toFixed(1)
        ];
    }

    if (goal === "Lose Weight") {
        return [
            weight,
            +(weight - 0.4).toFixed(1),
            +(weight - 0.9).toFixed(1),
            +(weight - 1.5).toFixed(1)
        ];
    }

    return [
        weight,
        +(weight + 0.1).toFixed(1),
        +(weight + 0.2).toFixed(1),
        +(weight + 0.3).toFixed(1)
    ];
}

// ── Muscle Projection Fix ───────────────────────────────────
function fixMuscleProjection(proj, goal, bmiNum) {
    if (!Array.isArray(proj) || proj.length !== 4) {
        return [32.5, 32.8, 33.1, 33.5];
    }

    const nums = proj.map(v => parseFloat(v));
    if (nums.some(isNaN)) return [32.5, 32.8, 33.1, 33.5];

    if (bmiNum < 18.5 || goal === "Gain Muscle") {
        if (!(nums[1] > nums[0] && nums[2] > nums[1] && nums[3] > nums[2])) {
            const base = nums[0] || 32.5;
            return [
                base,
                +(base + 0.3).toFixed(1),
                +(base + 0.6).toFixed(1),
                +(base + 1.0).toFixed(1)
            ];
        }
    }

    if (goal === "General Fitness") {
        if (nums[1] < nums[0] || nums[2] < nums[1] || nums[3] < nums[2]) {
            const base = nums[0] || 36;
            return [
                base,
                +(base + 0.2).toFixed(1),
                +(base + 0.4).toFixed(1),
                +(base + 0.5).toFixed(1)
            ];
        }
    }

    return nums;
}

// ── Percent Fix ─────────────────────────────────────────────
function fixPercent(val, min, max) {
    if (!val) return val;

    const num = parseFloat(val);
    if (isNaN(num)) return val;

    if (num < min) return min + "%";
    if (num > max) return max + "%";

    return val.toString().includes('%') ? val : val + "%";
}

// ── Plan Title Fix ──────────────────────────────────────────
function fixPlanTitle(title, goal, bmiNum) {
    if (bmiNum < 18.5) {
        return "Healthy Weight Gain Plan";
    }

    if (goal === "Gain Muscle") {
        return "Muscle Gain Plan";
    }

    if (goal === "Lose Weight") {
        return "Weight Loss Plan";
    }

    return "General Fitness Plan";
}

// ── Summary Fix ─────────────────────────────────────────────
function fixWeeklySummary(summary, goal, bmiNum) {
    if (bmiNum < 18.5) {
        return "A safe plan focused on healthy weight gain, light strength training, and gradual muscle improvement.";
    }

    if (goal === "Gain Muscle") {
        return "A structured plan to help you build strength and increase muscle mass safely.";
    }

    if (goal === "Lose Weight") {
        return "A balanced plan to help you lose weight safely through controlled exercise and consistency.";
    }

    return "A balanced fitness plan to improve energy, mobility, and overall health.";
}

// ── Fix Underweight Days ────────────────────────────────────
function fixUnderweightDays(days) {
    const safeDays = [
        {
            day: "Monday",
            cal: "250",
            duration: "40",
            focus: "Light Strength",
            intensity: "Low",
            ex: ["Resistance Band Exercises", "Assisted Squats"],
            diff: "3/10",
            safety: "Focus on controlled movement and rest between sets"
        },
        {
            day: "Wednesday",
            cal: "220",
            duration: "35",
            focus: "Mobility",
            intensity: "Low",
            ex: ["Yoga", "Light Stretching"],
            diff: "2/10",
            safety: "Gentle movements to improve flexibility"
        },
        {
            day: "Friday",
            cal: "280",
            duration: "45",
            focus: "Strength Recovery",
            intensity: "Low",
            ex: ["Light Dumbbell Exercises", "Walking"],
            diff: "3/10",
            safety: "Avoid intense cardio and focus on strength building"
        }
    ];

    return safeDays;
}

// ── Fix Underweight History ─────────────────────────────────
function fixUnderweightHistory(history) {
    return [
        { name: "Resistance Band Training", cal: "250", dur: "40" },
        { name: "Light Strength Session", cal: "280", dur: "45" },
        { name: "Yoga Mobility", cal: "200", dur: "35" },
        { name: "Assisted Bodyweight Training", cal: "260", dur: "40" },
        { name: "Recovery Walking", cal: "220", dur: "35" }
    ];
}

// ── Render AI Plan ──────────────────────────────────────────
function renderAIPlan(plan, bmi, weight, finalGoal) {
    const container = document.getElementById('plan-days-container');
    const title = document.getElementById('plan-title');
    const summary = document.getElementById('progress-summary');
    const metaInfo = document.getElementById('plan-meta-info');

    document.getElementById('results-section').style.display = 'block';
    container.innerHTML = "";

    const bmiNum = parseFloat(bmi);

    plan.planTitle = fixPlanTitle(plan.planTitle, finalGoal, bmiNum);
    plan.weeklySummary = fixWeeklySummary(plan.weeklySummary, finalGoal, bmiNum);

    title.innerText = plan.planTitle;
    summary.innerText = plan.weeklySummary;

    const totalCal = plan.days.reduce((sum, d) => sum + (parseInt(d.cal) || 0), 0);
    metaInfo.innerText = `📅 ${plan.days.length} days/week | 🔥 ~${totalCal} kcal/week | BMI: ${bmi}`;

    // BMI Warning
    const warningWrap = document.getElementById('bmi-warning-banner');

    if (warningWrap) {
        if (bmiNum < 16) {
            warningWrap.style.display = 'flex';
            warningWrap.innerHTML = `
                <div class="bmi-warn-icon">⚠️</div>
                <div class="bmi-warn-text">
                    <strong>Medical Warning – Critically Low BMI (${bmi})</strong><br>
                    Please consult a doctor before starting this plan.
                </div>
            `;
        } else if (bmiNum > 40) {
            warningWrap.style.display = 'flex';
            warningWrap.innerHTML = `
                <div class="bmi-warn-icon">⚠️</div>
                <div class="bmi-warn-text">
                    <strong>Medical Warning – High BMI (${bmi})</strong><br>
                    Please consult a doctor before starting this plan.
                </div>
            `;
        } else {
            warningWrap.style.display = 'none';
        }
    }

    plan.days.forEach((day, index) => {
        const intensityClass =
            (day.intensity || "").toLowerCase().includes('very') ? 'high' :
            (day.intensity || "").toLowerCase().includes('high') ? 'high' :
            (day.intensity || "").toLowerCase().includes('low') ? 'low' : 'medium';

        container.innerHTML += `
            <div class="premium-day-card">
                <div class="card-metrics-row">
                    <span class="metric-badge-ai">
                        <i class="fa-solid fa-fire"></i> ${day.cal} kcal
                    </span>
                    <span class="metric-badge-ai">
                        <i class="fa-solid fa-gauge-high"></i> ${day.diff} Diff
                    </span>
                </div>

                <div class="p-day-top-ai">
                    <div class="p-day-circle-ai">${index + 1}</div>

                    <div class="p-day-info-ai">
                        <h4>${day.day}</h4>
                        <p>${day.focus}</p>
                    </div>

                    <div class="p-day-badges-ai">
                        <span>⏱ ${day.duration}m</span>
                        <div class="p-badge-ai ${intensityClass}">
                            ${day.intensity || 'Medium'}
                        </div>
                    </div>
                </div>

                <ul class="p-ex-list-premium">
                    ${day.ex.map(e => `<li>${e}</li>`).join('')}
                </ul>

                ${day.safety ? `<div class="p-safety-premium">💡 AI Tip: ${day.safety}</div>` : ''}
            </div>
        `;
    });

    const trackBtn = document.querySelector('.btn-track-premium');

    if (trackBtn) {
        trackBtn.onclick = () => {
            const finalData = {
                ...plan,
                bmi: bmi,
                weight: weight,
                safeGoal: finalGoal
            };

            localStorage.setItem('elitePlanData', JSON.stringify(finalData));
            window.location.href = 'progress.html';
        };
    }
}

function resetForm() {
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('ai-form-section').style.display = 'block';
    window.scrollTo(0, 0);
}