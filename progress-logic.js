// ============================================================
//  Elite Sport – Progress Page Script
//  All data from AI via localStorage
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const rawData = localStorage.getItem('elitePlanData');
    if (!rawData) return;
    const aiData = JSON.parse(rawData);

    // 1. العنوان من الـ AI
    document.getElementById('journey-title').innerHTML = `Your <span class="orange-text">${aiData.planTitle}</span>`;

    // 2. الأرقام العلوية — كلها من days (الخطة الأسبوعية الحالية)
    document.getElementById('top-total-workouts').innerText = aiData.days.length;

    const weekCal = aiData.days.reduce((a, b) => a + (parseInt(b.cal) || 0), 0);
    const weekDur = aiData.days.reduce((a, b) => a + (parseInt(b.duration) || 0), 0);

    document.getElementById('top-total-calories').innerText = weekCal.toLocaleString();
    document.getElementById('top-total-hours').innerText    = (weekDur / 60).toFixed(1);
    document.getElementById('top-bmi-display').innerText    = aiData.bmi;

    // 3. الـ Streak = عدد أيام الخطة من الـ AI
    const streakEl = document.getElementById('display-streak');
    if (streakEl) streakEl.innerText = aiData.days.length;

    // 4. Overview — رسوم من days
    const dayLabels = aiData.days.map(d => d.day.substring(0, 3));
    renderChart('caloriesChart', 'bar',  dayLabels, aiData.days.map(d => parseInt(d.cal)      || 0), '#ff6b35');
    renderChart('durationChart', 'line', dayLabels, aiData.days.map(d => parseInt(d.duration) || 0), '#ff6b35');

    // This Week Summary — نفس days لضمان التطابق مع الأعلى
    document.getElementById('sum-workouts').innerText = aiData.days.length;
    document.getElementById('sum-calories').innerText = weekCal.toLocaleString();
    document.getElementById('sum-duration').innerText = weekDur + "m";

    // 5. Body Metrics من الـ AI
    renderChart('weightChart', 'line', ['W1','W2','W3','W4'], aiData.projections.weight, '#ff6b35');
    renderChart('muscleChart', 'line', ['W1','W2','W3','W4'], aiData.projections.muscle, '#10b981');

    document.getElementById('m-weight').innerText     = aiData.weight + " kg";
    document.getElementById('m-fat-val').innerText    = aiData.bodyStats.fat;
    document.getElementById('m-muscle-val').innerText = aiData.bodyStats.muscle;
    document.getElementById('m-bmi').innerText        = aiData.bmi;

    document.getElementById('weight-change').innerText  = aiData.bodyStats.weightChange  + " projected";
    document.getElementById('fat-change').innerText     = aiData.bodyStats.fatChange     + " this month";
    document.getElementById('muscle-change').innerText  = aiData.bodyStats.muscleChange  + " this month";

    // 6. Workout History
    // ✅ history = جلسات سابقة مكتملة (مختلفة عن الخطة الحالية — هاد منطقي)
    // لذلك نعرض مجموعها بشكل منفصل تحت عنوان واضح
    const historyList = document.getElementById('history-list-container');
    if (historyList && aiData.history) {
        historyList.innerHTML = "";

        // ✅ حساب مجموع الـ history وعرضه كـ subtitle توضيحي
        const histTotalCal = aiData.history.reduce((a, b) => a + (parseInt(b.cal) || 0), 0);
        const histTotalDur = aiData.history.reduce((a, b) => a + (parseInt(b.dur) || 0), 0);

        // ✅ إضافة سطر ملخص فوق القائمة يوضح إن هاد سجل الجلسات السابقة
        historyList.innerHTML += `
            <div class="history-summary-bar">
                <span><i class="fa-solid fa-clock-rotate-left"></i> ${aiData.history.length} previous sessions</span>
                <span>${histTotalDur}m &nbsp;|&nbsp; ${histTotalCal.toLocaleString()} cal total</span>
            </div>`;

        aiData.history.forEach((session, i) => {
            historyList.innerHTML += `
                <div class="history-row">
                    <div class="h-circle"><i class="fa-solid fa-check"></i></div>
                    <div class="h-details">
                        <h5>${session.name}</h5>
                        <p>${i + 1} day${i > 0 ? 's' : ''} ago</p>
                    </div>
                    <div class="h-metrics">
                        <span>${session.dur}m</span>
                        <span>${session.cal} cal</span>
                    </div>
                </div>`;
        });
    }
});

// ─── Tab Switching ────────────────────────────────────────────
function switchTab(tab) {
    document.getElementById('section-overview').style.display = tab === 'overview' ? 'block' : 'none';
    document.getElementById('section-history').style.display  = tab === 'history'  ? 'block' : 'none';
    document.getElementById('section-metrics').style.display  = tab === 'metrics'  ? 'block' : 'none';
    document.querySelectorAll('.t-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
}

// ─── renderChart ──────────────────────────────────────────────
function renderChart(id, type, labels, data, color) {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const old = Chart.getChart(id);
    if (old) old.destroy();
    new Chart(ctx.getContext('2d'), {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: type === 'bar' ? color : color + '22',
                borderColor: color,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: color,
                borderWidth: 2
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#f0f0f0' }, ticks: { color: '#888' } },
                x: { grid: { display: false },   ticks: { color: '#888' } }
            }
        }
    });
}