// Takvimde bugüne git
function todayMonth() {
    const today = new Date();
    APP_STATE.calendarMonth = today.getMonth();
    APP_STATE.calendarYear = today.getFullYear();
    renderCalendar();
}
// ==================== APP STATE ====================
const APP_STATE = {
    habits: [],
    dailyLogs: {},
    settings: {
        theme: 'dark'
    },
    currentPage: 'home',
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
    editingHabit: null,
    selectedDate: null,
    analyticsPeriod: 'week',
    forgeData: {},
    forgeSubTab: 'active',
    forgeExpandedId: null,
    forgeModal: { type: '', id: null },
};

// ==================== QUOTES ====================
const QUOTES = [
    "Küçük adımlar büyük değişimlere yol açar.",
    "Her gün yeni bir başlangıçtır.",
    "Disiplin özgürlüktür.",
    "Bugün yaptıkların yarınını şekillendirir.",
    "Başarı alışkanlıkların toplamıdır.",
    "Süreklilik mükemmeliyetten önemlidir.",
    "Bir gün değil, birinci gün.",
    "Zinciri kırma, güçlendır.",
    "Her deneme seni güçlendirir.",
    "Sadece bugüne odaklan.",
    "Küçük zaferler büyük başarılara dönüşür.",
    "Alışkanlıklar karakteri oluşturur.",
    "Bugün için şükret, yarın için çalış.",
    "İlerleme mükemmellik değil, hedeftir.",
    "Kendine verdiğin sözü tut."
];

const HABIT_ICONS = ['🏃', '📚', '💧', '🧘', '💪', '🎯', '✍️', '🎨', '🎵', '🌱', '💤', '🍎', '🧠', '❤️', '⭐'];
const HABIT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6'];
const MOOD_EMOJIS = { 1: '😢', 2: '😕', 3: '😐', 4: '😊', 5: '😄' };
const MOOD_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#10b981' };

// ==================== UTILITIES ====================
const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getDayOfWeek = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { weekday: 'long' });
};

const showToast = (message, type = 'info') => {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
};

const saveData = () => {
    localStorage.setItem('chainbreaker_habits', JSON.stringify(APP_STATE.habits));
    localStorage.setItem('chainbreaker_logs', JSON.stringify(APP_STATE.dailyLogs));
    localStorage.setItem('chainbreaker_settings', JSON.stringify(APP_STATE.settings));
    localStorage.setItem('chainbreaker_forge', JSON.stringify(APP_STATE.forgeData));
};

const loadData = () => {
    const habits = localStorage.getItem('chainbreaker_habits');
    const logs = localStorage.getItem('chainbreaker_logs');
    const settings = localStorage.getItem('chainbreaker_settings');
    const forge = localStorage.getItem('chainbreaker_forge');

    if (habits) APP_STATE.habits = JSON.parse(habits);
    if (logs) APP_STATE.dailyLogs = JSON.parse(logs);
    if (settings) APP_STATE.settings = JSON.parse(settings);
    if (forge) APP_STATE.forgeData = JSON.parse(forge);
};

// ==================== STREAK CALCULATION ====================
const calculateStreak = (habitId, type = 'current') => {
    const today = getToday();
    const dates = Object.keys(APP_STATE.dailyLogs).sort().reverse();
    let streak = 0;

    if (type === 'current') {
        for (const date of dates) {
            if (date > today) continue;
            const log = APP_STATE.dailyLogs[date];
            if (log?.habits?.[habitId]) {
                streak++;
            } else if (date < today) {
                break;
            }
        }
    } else if (type === 'monthly') {
        const thisMonth = today.substring(0, 7);
        for (const date of dates) {
            if (!date.startsWith(thisMonth)) continue;
            const log = APP_STATE.dailyLogs[date];
            if (log?.habits?.[habitId]) streak++;
        }
    }

    return streak;
};

const getTotalDailyStreak = () => {
    const today = getToday();
    const dates = Object.keys(APP_STATE.dailyLogs).sort().reverse();
    let streak = 0;

    for (const date of dates) {
        if (date > today) continue;
        const log = APP_STATE.dailyLogs[date];
        const allCompleted = APP_STATE.habits.length > 0 &&
            APP_STATE.habits.every(h => log?.habits?.[h.id]);

        if (allCompleted) {
            streak++;
        } else if (date < today) {
            break;
        }
    }

    return streak;
};

const getMonthlyStreak = () => {
    const today = getToday();
    const thisMonth = today.substring(0, 7);
    let count = 0;

    for (const date of Object.keys(APP_STATE.dailyLogs)) {
        if (!date.startsWith(thisMonth)) continue;
        const log = APP_STATE.dailyLogs[date];
        const allCompleted = APP_STATE.habits.length > 0 &&
            APP_STATE.habits.every(h => log?.habits?.[h.id]);
        if (allCompleted) count++;
    }

    return count;
};

// ==================== NAVIGATION ====================
const switchPage = (pageName) => {
    APP_STATE.currentPage = pageName;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${pageName}-page`).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    if (pageName === 'home') renderHome();
    else if (pageName === 'calendar') renderCalendar();
    else if (pageName === 'analytics') renderAnalytics();
    else if (pageName === 'forge') renderForge();
    else if (pageName === 'settings') renderSettings();

    requestAnimationFrame(() => {
        const container = document.querySelector('.pages-container');
        if (container) container.scrollTop = 0;
        window.scrollTo(0, 0);
    });
};

// ==================== HOME PAGE ====================
const renderHome = () => {
    renderTodayDate();
    renderProgress();
    renderStats();
    renderTodayMood();
    renderHabits();
    renderQuote();
    renderForgeWidget();
    renderXPBanner();
};

const renderTodayDate = () => {
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' };
    const dateStr = today.toLocaleDateString('tr-TR', options);
    const todayDateEl = document.getElementById('today-date');
    if (todayDateEl) {
        todayDateEl.textContent = dateStr;
    }
};

const renderProgress = () => {
    const today = getToday();
    const todayLog = APP_STATE.dailyLogs[today] || { habits: {} };
    const totalHabits = APP_STATE.habits.length;
    const completed = totalHabits > 0 ?
        APP_STATE.habits.filter(h => todayLog.habits?.[h.id]).length : 0;
    const percent = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;

    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percent / 100) * circumference;

    const progressRing = document.querySelector('.progress-ring-fill');
    if (progressRing) {
        progressRing.style.strokeDashoffset = offset;
    }

    const progressValue = document.querySelector('.progress-value');
    if (progressValue) {
        progressValue.textContent = `${completed}/${totalHabits}`;
    }
};

const renderStats = () => {
    const dailyStreak = getTotalDailyStreak();
    const monthlyStreak = getMonthlyStreak();

    document.getElementById('daily-streak').textContent = dailyStreak;
    document.getElementById('monthly-streak').textContent = monthlyStreak;
};

const renderTodayMood = () => {
    const today = getToday();
    const todayLog = APP_STATE.dailyLogs[today];
    const currentMood = todayLog?.mood;

    document.querySelectorAll('.mood-card .mood-btn').forEach(btn => {
        const mood = parseInt(btn.dataset.mood);
        btn.classList.toggle('selected', mood === currentMood);
    });
};

const renderHabits = () => {
    const container = document.getElementById('habits-list');
    const today = getToday();
    const todayLog = APP_STATE.dailyLogs[today] || { habits: {} };

    if (APP_STATE.habits.length === 0) {
        container.innerHTML = `
            <div class="no-habits">
                <p>Henüz alışkanlık eklemediniz</p>
                <p style="font-size: 0.85rem; margin-top: 8px;">+ butonuna tıklayarak başlayın</p>
            </div>
        `;
        return;
    }

    container.innerHTML = APP_STATE.habits.map(habit => {
        const isChecked = todayLog.habits?.[habit.id] || false;
        const streak = calculateStreak(habit.id);

        return `
            <div class="habit-item" style="--habit-color: ${habit.color}">
                <span class="habit-icon">${habit.icon}</span>
                <div class="habit-info">
                    <div class="habit-name">${habit.name}</div>
                    <div class="habit-streak">🔥 ${streak} gün</div>
                </div>
                <div class="habit-actions">
                    <button class="habit-check ${isChecked ? 'checked' : ''}" 
                            onclick="toggleHabit('${habit.id}')">
                        ${isChecked ? '✓' : ''}
                    </button>
                    <button class="habit-menu" onclick="openHabitMenu('${habit.id}')">⋮</button>
                </div>
            </div>
        `;
    }).join('');
};

const renderQuote = () => {
    const today = getToday();
    const index = today.split('-').reduce((a, b) => parseInt(a) + parseInt(b), 0) % QUOTES.length;
    document.getElementById('quote-text').textContent = `"${QUOTES[index]}"`;
};

const refreshQuote = () => {
    const index = Math.floor(Math.random() * QUOTES.length);
    const quoteEl = document.getElementById('quote-text');
    quoteEl.style.opacity = '0';
    setTimeout(() => {
        quoteEl.textContent = `"${QUOTES[index]}"`;
        quoteEl.style.opacity = '1';
    }, 200);
};

// ==================== MOOD ====================
const setMood = (mood) => {
    const today = getToday();
    if (!APP_STATE.dailyLogs[today]) {
        APP_STATE.dailyLogs[today] = { habits: {}, mood: null, note: '' };
    }
    APP_STATE.dailyLogs[today].mood = mood;
    saveData();
    renderTodayMood();
    showToast(`Duygu durumu: ${MOOD_EMOJIS[mood]}`, 'success');
};

// ==================== HABITS ====================
const toggleHabit = (habitId) => {
    const today = getToday();
    if (!APP_STATE.dailyLogs[today]) {
        APP_STATE.dailyLogs[today] = { habits: {}, mood: null, note: '' };
    }

    const current = APP_STATE.dailyLogs[today].habits[habitId] || false;
    APP_STATE.dailyLogs[today].habits[habitId] = !current;

    saveData();
    renderHabits();
    renderProgress();
    renderStats();
};

const openHabitModal = (habitId = null) => {
    APP_STATE.editingHabit = habitId;
    const modal = document.getElementById('habit-modal');
    const title = document.getElementById('habit-modal-title');
    const nameInput = document.getElementById('habit-name');
    const deleteBtn = document.getElementById('delete-habit-btn');

    if (habitId) {
        const habit = APP_STATE.habits.find(h => h.id === habitId);
        title.textContent = 'Alışkanlığı Düzenle';
        nameInput.value = habit.name;
        deleteBtn.style.display = 'block';

        document.querySelectorAll('.icon-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.icon === habit.icon);
        });
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.color === habit.color);
        });
    } else {
        title.textContent = 'Yeni Alışkanlık';
        nameInput.value = '';
        deleteBtn.style.display = 'none';

        document.querySelectorAll('.icon-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelector('.icon-btn')?.classList.add('selected');
        document.querySelector('.color-btn')?.classList.add('selected');
    }

    modal.classList.add('active');
};

const closeHabitModal = () => {
    document.getElementById('habit-modal').classList.remove('active');
    APP_STATE.editingHabit = null;
};

const saveHabit = () => {
    const name = document.getElementById('habit-name').value.trim();
    const icon = document.querySelector('.icon-btn.selected')?.dataset.icon || '🎯';
    const color = document.querySelector('.color-btn.selected')?.dataset.color || '#6366f1';

    if (!name) {
        showToast('Alışkanlık adı gerekli', 'error');
        return;
    }

    if (APP_STATE.editingHabit) {
        const habit = APP_STATE.habits.find(h => h.id === APP_STATE.editingHabit);
        habit.name = name;
        habit.icon = icon;
        habit.color = color;
        showToast('Alışkanlık güncellendi', 'success');
    } else {
        APP_STATE.habits.push({
            id: Date.now().toString(),
            name,
            icon,
            color,
            createdAt: getToday()
        });
        showToast('Alışkanlık eklendi', 'success');
    }

    saveData();
    closeHabitModal();
    renderHabits();
    renderProgress();
};

const deleteHabit = () => {
    if (!APP_STATE.editingHabit) return;

    if (confirm('Bu alışkanlığı silmek istediğinize emin misiniz?')) {
        APP_STATE.habits = APP_STATE.habits.filter(h => h.id !== APP_STATE.editingHabit);
        saveData();
        closeHabitModal();
        renderHabits();
        renderProgress();
        showToast('Alışkanlık silindi', 'success');
    }
};

const openHabitMenu = (habitId) => {
    openHabitModal(habitId);
};

// ==================== CALENDAR ====================
const renderCalendar = () => {
    const year = APP_STATE.calendarYear;
    const month = APP_STATE.calendarMonth;
    const today = getToday();

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    document.getElementById('calendar-title').textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    const container = document.getElementById('calendar-days');
    let html = '';

    // Empty cells
    for (let i = 0; i < adjustedFirstDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const log = APP_STATE.dailyLogs[dateStr];
        const isToday = dateStr === today;
        const isFuture = dateStr > today;

        let moodStyle = '';
        let moodClass = '';
        let indicator = '';

        if (log?.mood) {
            moodStyle = `background: ${MOOD_COLORS[log.mood]};`;
            moodClass = 'has-mood';
        }

        if (log?.habits && Object.values(log.habits).some(v => v)) {
            indicator = '<div class="day-indicator"></div>';
        }

        let noteIndicator = '';
        if (log?.note && log.note.trim()) {
            noteIndicator = '<div class="day-note-indicator">📝</div>';
        }

        const hasForgeCheckIn = Object.values(APP_STATE.forgeData).some(p =>
            (p.checkInDates || []).includes(dateStr)
        );
        const forgeIndicator = hasForgeCheckIn ? '<div class="day-forge-indicator">⚔️</div>' : '';

        html += `
            <div class="calendar-day ${moodClass} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}"
                 style="${moodStyle}"
                 onclick="${!isFuture ? `openDayModal('${dateStr}')` : ''}">
                <span class="day-number">${day}</span>
                ${indicator}
                ${noteIndicator}
                ${forgeIndicator}
            </div>
        `;
    }

    container.innerHTML = html;
};

const prevMonth = () => {
    APP_STATE.calendarMonth--;
    if (APP_STATE.calendarMonth < 0) {
        APP_STATE.calendarMonth = 11;
        APP_STATE.calendarYear--;
    }
    renderCalendar();
};

const nextMonth = () => {
    const today = new Date();
    const maxMonth = today.getMonth();
    const maxYear = today.getFullYear();

    if (APP_STATE.calendarYear < maxYear ||
        (APP_STATE.calendarYear === maxYear && APP_STATE.calendarMonth < maxMonth)) {
        APP_STATE.calendarMonth++;
        if (APP_STATE.calendarMonth > 11) {
            APP_STATE.calendarMonth = 0;
            APP_STATE.calendarYear++;
        }
        renderCalendar();
    }
};

const renderNotes = () => {
    const container = document.getElementById('notes-list');
    const notesWithDates = Object.entries(APP_STATE.dailyLogs)
        .filter(([_, log]) => log.note && log.note.trim())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 5);

    if (notesWithDates.length === 0) {
        container.innerHTML = '<div class="no-notes">Henüz not eklemediniz</div>';
        return;
    }

    container.innerHTML = notesWithDates.map(([date, log]) => `
        <div class="note-item">
            <div class="note-header">
                <span class="note-date">${formatDate(date)}</span>
                <span class="note-mood">${log.mood ? MOOD_EMOJIS[log.mood] : ''}</span>
            </div>
            <div class="note-text">${log.note}</div>
        </div>
    `).join('');
};

// ==================== DAY MODAL ====================
const openDayModal = (dateStr) => {
    APP_STATE.selectedDate = dateStr;
    const modal = document.getElementById('day-modal');
    const log = APP_STATE.dailyLogs[dateStr] || { habits: {}, mood: null, note: '' };

    document.getElementById('day-modal-title').textContent = formatDate(dateStr);
    document.getElementById('day-modal-subtitle').textContent = getDayOfWeek(dateStr);

    // Mood
    document.querySelectorAll('.modal-mood .mood-btn').forEach(btn => {
        const mood = parseInt(btn.dataset.mood);
        btn.classList.toggle('selected', mood === log.mood);
    });

    // Habits
    const habitsContainer = document.getElementById('day-habits-list');
    if (APP_STATE.habits.length === 0) {
        habitsContainer.innerHTML = '<div class="no-habits" style="padding: 10px;">Alışkanlık yok</div>';
    } else {
        habitsContainer.innerHTML = APP_STATE.habits.map(habit => {
            const isChecked = log.habits?.[habit.id] || false;
            return `
                <div class="day-habit-item">
                    <span class="habit-icon">${habit.icon}</span>
                    <span class="habit-name">${habit.name}</span>
                    <button class="day-habit-toggle ${isChecked ? 'checked' : ''}"
                            onclick="toggleDayHabit('${habit.id}')"></button>
                </div>
            `;
        }).join('');
    }

    // Forge check-ins for this day
    const forgeSections = CHALLENGES_DB.map(challenge => {
        const p = APP_STATE.forgeData[challenge.id];
        if (!p?.isActive) return null;
        const done = (p.checkInDates || []).includes(dateStr);
        return `
            <div class="day-habit-item">
                <span class="habit-icon">${challenge.emoji}</span>
                <span class="habit-name" style="color:${challenge.color}">${challenge.title}</span>
                <button class="day-habit-toggle ${done ? 'checked' : ''}"
                        onclick="toggleDayForge('${challenge.id}', '${dateStr}')"></button>
            </div>
        `;
    }).filter(Boolean).join('');

    if (forgeSections) {
        habitsContainer.innerHTML += `
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color)">
                <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">⚔️ FORGE GÖREVLERİ</div>
                ${forgeSections}
            </div>
        `;
    }

    // Note
    document.getElementById('day-note').value = log.note || '';

    modal.classList.add('active');
};

const closeDayModal = () => {
    document.getElementById('day-modal').classList.remove('active');
    APP_STATE.selectedDate = null;
};

const setDayMood = (mood) => {
    console.log('setDayMood called with mood:', mood, 'selectedDate:', APP_STATE.selectedDate);
    if (!APP_STATE.selectedDate) {
        console.error('selectedDate is null!');
        return;
    }

    if (!APP_STATE.dailyLogs[APP_STATE.selectedDate]) {
        APP_STATE.dailyLogs[APP_STATE.selectedDate] = { habits: {}, mood: null, note: '' };
    }
    APP_STATE.dailyLogs[APP_STATE.selectedDate].mood = mood;

    console.log('Updated dailyLogs:', APP_STATE.dailyLogs);

    document.querySelectorAll('.modal-mood .mood-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.mood) === mood);
    });

    saveData();
    renderCalendar();
    if (APP_STATE.selectedDate === getToday()) renderTodayMood();
};

const toggleDayHabit = (habitId) => {
    console.log('toggleDayHabit called with habitId:', habitId, 'selectedDate:', APP_STATE.selectedDate);
    if (!APP_STATE.selectedDate) {
        console.error('selectedDate is null!');
        return;
    }

    if (!APP_STATE.dailyLogs[APP_STATE.selectedDate]) {
        APP_STATE.dailyLogs[APP_STATE.selectedDate] = { habits: {}, mood: null, note: '' };
    }

    const current = APP_STATE.dailyLogs[APP_STATE.selectedDate].habits[habitId] || false;
    APP_STATE.dailyLogs[APP_STATE.selectedDate].habits[habitId] = !current;

    console.log('Updated dailyLogs:', APP_STATE.dailyLogs);

    // Update toggle button
    const btn = event.target;
    btn.classList.toggle('checked');

    saveData();
    renderCalendar();
    if (APP_STATE.selectedDate === getToday()) {
        renderHabits();
        renderProgress();
        renderStats();
    }
};

const toggleDayForge = (challengeId, dateStr) => {
    const p = APP_STATE.forgeData[challengeId];
    if (!p) return;

    if (!p.checkInDates) p.checkInDates = [];

    const idx = p.checkInDates.indexOf(dateStr);
    if (idx >= 0) {
        p.checkInDates.splice(idx, 1);
    } else {
        p.checkInDates.push(dateStr);
    }

    const challenge = CHALLENGES_DB.find(c => c.id === challengeId);
    const newDay = p.checkInDates.length;

    APP_STATE.forgeData[challengeId] = {
        ...p,
        currentDay: newDay,
        isCompleted: newDay >= challenge.duration,
        checkInDates: p.checkInDates,
    };

    saveData();
    openDayModal(dateStr);
    renderCalendar();
};

const saveDayNote = () => {
    if (!APP_STATE.selectedDate) return;

    const note = document.getElementById('day-note').value.trim();

    if (!APP_STATE.dailyLogs[APP_STATE.selectedDate]) {
        APP_STATE.dailyLogs[APP_STATE.selectedDate] = { habits: {}, mood: null, note: '' };
    }
    APP_STATE.dailyLogs[APP_STATE.selectedDate].note = note;

    saveData();
    closeDayModal();
    showToast('Kaydedildi', 'success');
};

// ==================== ANALYTICS ====================
const renderAnalytics = () => {
    console.log('[Analytics] Rendering with data:', {
        habits: APP_STATE.habits.length,
        logs: Object.keys(APP_STATE.dailyLogs).length,
        logDates: Object.keys(APP_STATE.dailyLogs)
    });
    renderWeekdayMoodAnalysis();
    renderWeekdayHabitsAnalysis();
    renderHabitAnalytics();
    renderOverallStats();
    renderHeatmap();
    renderForgeAnalytics();
    renderCorrelation();
};

// Haftanın günlerine göre mood analizi
const renderWeekdayMoodAnalysis = () => {
    const container = document.getElementById('weekday-mood-grid');
    if (!container) return;

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const dayMoods = [[], [], [], [], [], [], []]; // Her gün için mood listesi

    // Tüm logları tara
    Object.entries(APP_STATE.dailyLogs).forEach(([date, log]) => {
        if (!log.mood) return;
        const dayIndex = new Date(date).getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        dayMoods[adjustedIndex].push(log.mood);
    });

    container.innerHTML = dayNames.map((name, i) => {
        const moods = dayMoods[i];
        const avg = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;
        const avgRounded = Math.round(avg);
        const emoji = avgRounded > 0 ? MOOD_EMOJIS[avgRounded] : '—';

        return `
            <div class="weekday-item">
                <span class="weekday-label">${name}</span>
                <span class="weekday-mood-value">${emoji}</span>
                <span class="weekday-avg">${avg > 0 ? avg.toFixed(1) : '-'}</span>
            </div>
        `;
    }).join('');
};

// Haftanın günlerine göre alışkanlık analizi
const renderWeekdayHabitsAnalysis = () => {
    const container = document.getElementById('weekday-habits-grid');
    if (!container) return;

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const dayStats = [[], [], [], [], [], [], []]; // Her gün için completion oranları

    if (APP_STATE.habits.length === 0) {
        container.innerHTML = '<div class="no-habits" style="padding: 20px; grid-column: 1/-1;">Alışkanlık ekleyin</div>';
        return;
    }

    // Tüm logları tara
    Object.entries(APP_STATE.dailyLogs).forEach(([date, log]) => {
        const dayIndex = new Date(date).getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;

        const completed = APP_STATE.habits.filter(h => log.habits?.[h.id]).length;
        const percent = (completed / APP_STATE.habits.length) * 100;
        dayStats[adjustedIndex].push(percent);
    });

    container.innerHTML = dayNames.map((name, i) => {
        const stats = dayStats[i];
        const avg = stats.length > 0 ? stats.reduce((a, b) => a + b, 0) / stats.length : 0;
        const hue = (avg / 100) * 120; // 0=red, 120=green

        return `
            <div class="weekday-item">
                <span class="weekday-label">${name}</span>
                <div class="weekday-habit-bar">
                    <div class="weekday-habit-fill" style="height: ${avg}%; background: hsl(${hue}, 70%, 45%);"></div>
                </div>
                <span class="weekday-habit-percent">${Math.round(avg)}%</span>
            </div>
        `;
    }).join('');
};

// Alışkanlık başarı oranları (tüm zamanlar)
const renderHabitAnalytics = () => {
    const container = document.getElementById('habit-analytics');
    if (!container) return;

    if (APP_STATE.habits.length === 0) {
        container.innerHTML = '<div class="no-habits" style="padding: 20px;">Alışkanlık ekleyin</div>';
        return;
    }

    const allDates = Object.keys(APP_STATE.dailyLogs);
    if (allDates.length === 0) {
        container.innerHTML = '<div class="no-habits" style="padding: 20px;">Henüz veri yok</div>';
        return;
    }

    container.innerHTML = APP_STATE.habits.map(habit => {
        let completed = 0;
        let total = 0;

        allDates.forEach(date => {
            // Sadece bu alışkanlık oluşturulduktan sonraki günleri say
            if (habit.createdAt && date < habit.createdAt) return;
            total++;
            if (APP_STATE.dailyLogs[date]?.habits?.[habit.id]) completed++;
        });

        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        return `
            <div class="habit-stat">
                <span class="habit-stat-icon">${habit.icon}</span>
                <div class="habit-stat-info">
                    <div class="habit-stat-name">${habit.name}</div>
                    <div class="habit-stat-bar">
                        <div class="habit-stat-fill" style="width: ${percent}%; background: ${habit.color};"></div>
                    </div>
                </div>
                <span class="habit-stat-percent">${percent}%</span>
            </div>
        `;
    }).join('');
};

// Genel istatistikler
const renderOverallStats = () => {
    const allDates = Object.keys(APP_STATE.dailyLogs);

    // Toplam kayıtlı gün
    document.getElementById('total-logged-days').textContent = allDates.length;

    // Ortalama mood
    let totalMood = 0, moodCount = 0;
    allDates.forEach(date => {
        const mood = APP_STATE.dailyLogs[date]?.mood;
        if (mood) { totalMood += mood; moodCount++; }
    });
    const avgMood = moodCount > 0 ? (totalMood / moodCount).toFixed(1) : '-';
    document.getElementById('overall-avg-mood').textContent = avgMood;

    // En uzun seri
    const bestStreak = calculateBestStreak();
    document.getElementById('best-streak').textContent = bestStreak;

    // Genel başarı oranı
    let totalCompleted = 0, totalPossible = 0;
    if (APP_STATE.habits.length > 0) {
        allDates.forEach(date => {
            const log = APP_STATE.dailyLogs[date];
            APP_STATE.habits.forEach(habit => {
                if (habit.createdAt && date < habit.createdAt) return;
                totalPossible++;
                if (log?.habits?.[habit.id]) totalCompleted++;
            });
        });
    }
    const overallPercent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    document.getElementById('overall-completion').textContent = `${overallPercent}%`;
};

// En uzun seri hesapla
const calculateBestStreak = () => {
    if (APP_STATE.habits.length === 0) return 0;

    const dates = Object.keys(APP_STATE.dailyLogs).sort();
    let bestStreak = 0;
    let currentStreak = 0;
    let lastDate = null;

    dates.forEach(date => {
        const log = APP_STATE.dailyLogs[date];
        const allCompleted = APP_STATE.habits.every(h => log?.habits?.[h.id]);

        if (allCompleted) {
            if (lastDate) {
                const dayDiff = (new Date(date) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
                if (dayDiff === 1) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            } else {
                currentStreak = 1;
            }
            lastDate = date;
            bestStreak = Math.max(bestStreak, currentStreak);
        } else {
            currentStreak = 0;
            lastDate = null;
        }
    });

    return bestStreak;
};

// Isı haritası - Son 4 ay (GitHub tarzı)
const renderHeatmap = () => {
    const container = document.getElementById('heatmap-grid');
    if (!container) return;

    const today = new Date();
    const todayStr = getToday();

    // Bugünün haftanın hangi günü olduğunu bul (0=Paz, 1=Pzt, ...)
    const todayDayOfWeek = today.getDay();
    const adjustedToday = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1; // Pzt=0, Paz=6

    // 17 hafta göster (~4 ay)
    const totalWeeks = 17;
    const cells = [];

    // Her sütun bir hafta, her satır haftanın bir günü
    for (let week = totalWeeks - 1; week >= 0; week--) {
        for (let day = 0; day < 7; day++) { // Pzt=0, Paz=6
            // Bu hafta için bu güne kaç gün var
            const daysAgo = (week * 7) + (6 - day) + (6 - adjustedToday);

            // Bugünden sonraki günleri atla (sağ üst köşe)
            if (week === 0 && day > adjustedToday) {
                cells.push(`<div class="heatmap-cell level-0" style="opacity: 0.2;"></div>`);
                continue;
            }

            const d = new Date(today);
            d.setDate(d.getDate() - daysAgo);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            const log = APP_STATE.dailyLogs[dateStr];

            // Level hesapla: mood + habit completion
            let level = 0;
            if (log) {
                let score = 0;

                // Mood katkısı (0-2 puan)
                if (log.mood) {
                    score += (log.mood / 5) * 2;
                }

                // Habit katkısı (0-2 puan)
                if (APP_STATE.habits.length > 0) {
                    const completed = APP_STATE.habits.filter(h => log.habits?.[h.id]).length;
                    score += (completed / APP_STATE.habits.length) * 2;
                }

                // Level: 0-4
                if (score > 3) level = 4;
                else if (score > 2) level = 3;
                else if (score > 1) level = 2;
                else if (score > 0) level = 1;
            }

            cells.push(`<div class="heatmap-cell level-${level}" 
                            title="${formatDate(dateStr)}" 
                            data-date="${dateStr}"></div>`);
        }
    }

    container.innerHTML = cells.join('');
};

// ==================== SETTINGS ====================
const renderSettings = () => {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === APP_STATE.settings.theme);
    });
};

const setTheme = (theme) => {
    APP_STATE.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    saveData();
    renderSettings();
};

const exportData = () => {
    const data = {
        habits: APP_STATE.habits,
        dailyLogs: APP_STATE.dailyLogs,
        settings: APP_STATE.settings,
        exportDate: new Date().toISOString(),
        version: '2.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chainbreaker-backup-${getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Veriler dışa aktarıldı', 'success');
};

const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (data.habits) APP_STATE.habits = data.habits;
                if (data.dailyLogs) APP_STATE.dailyLogs = data.dailyLogs;
                if (data.settings) {
                    APP_STATE.settings = data.settings;
                    setTheme(APP_STATE.settings.theme);
                }

                saveData();
                renderHome();
                showToast('Veriler içe aktarıldı', 'success');
            } catch (err) {
                showToast('Dosya okunamadı', 'error');
            }
        };
        reader.readAsText(file);
    };

    input.click();
};

const deleteAllData = () => {
    if (confirm('Tüm verileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
        if (confirm('Son onay: Tüm alışkanlıklar ve loglar silinecek.')) {
            APP_STATE.habits = [];
            APP_STATE.dailyLogs = {};
            saveData();
            renderHome();
            showToast('Tüm veriler silindi', 'success');
        }
    }
};

// Test verisi oluştur
const generateTestData = () => {
    // Örnek alışkanlıklar
    APP_STATE.habits = [
        { id: 'h1', name: 'Egzersiz', icon: '🏃', color: '#22c55e', createdAt: '2026-01-01' },
        { id: 'h2', name: 'Kitap Oku', icon: '📚', color: '#6366f1', createdAt: '2026-01-01' },
        { id: 'h3', name: 'Su İç', icon: '💧', color: '#06b6d4', createdAt: '2026-01-01' },
        { id: 'h4', name: 'Meditasyon', icon: '🧘', color: '#8b5cf6', createdAt: '2026-01-01' }
    ];

    // Son 60 gün için rastgele veri
    const today = new Date();
    for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // %70 ihtimalle log oluştur
        if (Math.random() > 0.3) {
            APP_STATE.dailyLogs[dateStr] = {
                habits: {
                    h1: Math.random() > 0.3,
                    h2: Math.random() > 0.4,
                    h3: Math.random() > 0.2,
                    h4: Math.random() > 0.5
                },
                mood: Math.floor(Math.random() * 5) + 1,
                note: ''
            };
        }
    }

    saveData();
    renderHome();
    showToast('Test verisi oluşturuldu! Analytics\'e gidin.', 'success');
    console.log('[Test] Generated data:', APP_STATE.dailyLogs);
};

// ==================== INITIALIZATION ====================
const initApp = () => {
    loadData();

    // Apply theme
    document.documentElement.setAttribute('data-theme', APP_STATE.settings.theme);

    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchPage(item.dataset.page));
    });

    // Setup mood buttons (home)
    document.querySelectorAll('.mood-card .mood-btn').forEach(btn => {
        btn.addEventListener('click', () => setMood(parseInt(btn.dataset.mood)));
    });

    // Setup modal mood buttons
    document.querySelectorAll('.modal-mood .mood-btn').forEach(btn => {
        btn.addEventListener('click', () => setDayMood(parseInt(btn.dataset.mood)));
    });

    // Setup icon/color selection
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // Setup period tabs
    document.querySelectorAll('.period-tab').forEach(tab => {
        tab.addEventListener('click', () => setAnalyticsPeriod(tab.dataset.period));
    });

    // Setup theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => setTheme(btn.dataset.theme));
    });

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Render initial page
    renderHome();

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('SW registered'))
            .catch(err => console.log('SW error:', err));
    }
};

// Start app
document.addEventListener('DOMContentLoaded', initApp);

// ==================== FORGE / DİSİPLİN ====================

const CHALLENGES_DB = [
    {
        id: 'skill', title: '90 Günlük Yetenek Ustalığı', duration: 90, emoji: '🧠',
        description: 'Bir beceri seç ve 90 gün boyunca günde 1 saatini buna ayır. 90 gün sonra uzman olmayacaksın ama yetkin olacaksın. Çaba gösterdiğinde her şeyi öğrenebileceğinin kanıtı olacak.',
        isStrict: false, color: '#6366f1',
    },
    {
        id: 'journal', title: '365 Günlük Günlük Tutma', duration: 365, emoji: '📓',
        description: 'Her gece 3 şey yaz: Günün bir başarısı, öğrenilen bir ders ve şükrettiğin bir şey. Sadece 5 dakika sürer. Yıl sonunda belgelenmiş 365 büyüme anın olacak.',
        isStrict: false, color: '#f59e0b',
    },
    {
        id: 'walking', title: 'Yürüyüş Meditasyonu', duration: 30, emoji: '🚶',
        description: 'Her gün telefon, müzik veya podcast olmadan 30 dakika yürü. Sadece sen ve düşüncelerin. Zihinsel sağlığın için yapabileceğin en güçlü şeylerden biri.',
        isStrict: false, color: '#22c55e',
    },
    {
        id: 'nocomplaint', title: '21 Gün Şikayet Etmeme', duration: 21, emoji: '🤐',
        description: 'Hiçbir şey hakkında şikayet etmeden 21 gün geçir. Kendini şikayet ederken yakalarsan, birinci günden yeniden başla. Bitirenler sorunlar yerine çözümler bulmaya başlar.',
        isStrict: true, color: '#ef4444',
    },
    {
        id: 'digital', title: 'Dijital Çevre Detoksu', duration: 30, emoji: '📵',
        description: '30 gün boyunca çevrimiçi tükettiklerin konusunda bilinçli ol. Seni oyalayan şeyleri çıkar, yerine sana bir şeyler öğreten içerikler koy.',
        isStrict: false, color: '#8b5cf6',
    },
    {
        id: 'coldshower', title: 'Soğuk Duş Meydan Okuması', duration: 30, emoji: '🚿',
        description: 'Her duşu en az iki dakikalık soğuk suyla bitir. İlk başta kötüdür ama sonrasında güne zinde başlarsın. Stresle daha iyi başa çıkarsın.',
        isStrict: false, color: '#06b6d4',
    },
    {
        id: 'dopamine', title: '30 Gün Dopamin Detoksu', duration: 30, emoji: '⚡',
        description: 'Ucuz dopamin sağlayan her şeyi kes. Sosyal medya, Netflix, video oyunları veya abur cubur yok. Odak süren geri gelecek, zihnin uyanacak.',
        isStrict: false, color: '#a855f7',
    },
    {
        id: '75hard', title: '75 Hard', duration: 75, emoji: '💪',
        description: 'Günde 2 antrenman (biri dışarıda), sıfır alkol/hile öğünü olan diyet, 4 litre su, 10 sayfa kitap. Birini kaçırırsan baştan başlarsın.',
        isStrict: true, color: '#f97316',
    },
];

const renderForge = () => {
    const page = document.getElementById('forge-page');
    const subTab = APP_STATE.forgeSubTab;
    const forgeData = APP_STATE.forgeData;

    const activeChallenges = CHALLENGES_DB.filter(c => forgeData[c.id]?.isActive);
    const inactiveChallenges = CHALLENGES_DB.filter(c => !forgeData[c.id]?.isActive);

    let html = `<div class="page-content">
        <div class="forge-subtabs">
            <button class="forge-subtab ${subTab === 'active' ? 'active' : ''}" onclick="setForgeSubTab('active')">
                Aktif Görevler${activeChallenges.length > 0 ? ` (${activeChallenges.length})` : ''}
            </button>
            <button class="forge-subtab ${subTab === 'discover' ? 'active' : ''}" onclick="setForgeSubTab('discover')">
                Keşfet
            </button>
        </div>`;

    if (subTab === 'active') {
        if (activeChallenges.length === 0) {
            html += `<div class="forge-empty">
                <span class="forge-empty-icon">🎯</span>
                <h3>Henüz Aktif Görev Yok</h3>
                <p>Kendini zorla, alışkanlık değil — karakter inşa et. İlk görevi seç.</p>
                <button class="btn primary" onclick="setForgeSubTab('discover')">Görevleri Keşfet</button>
            </div>`;
        } else {
            activeChallenges.forEach(challenge => {
                const p = forgeData[challenge.id];
                const percent = Math.min(100, Math.round((p.currentDay / challenge.duration) * 100));
                const isExpanded = APP_STATE.forgeExpandedId === challenge.id;
                const logs = p.logs || [];

                html += `<div class="forge-card">
                    ${p.isCompleted ? `
                    <div class="forge-completed-overlay">
                        <span style="font-size:2.5rem">🏆</span>
                        <h3>Tebrikler!</h3>
                        <p><strong>${challenge.title}</strong> görevini tamamladın. İradeni kanıtladın!</p>
                        <button class="btn primary" style="margin-top:10px;width:100%" onclick="openForgeModal('reset','${challenge.id}')">🔄 Yeniden Başla</button>
                        <button class="btn secondary" style="margin-top:8px;width:100%" onclick="abandonChallenge('${challenge.id}')">Listeden Kaldır</button>
                    </div>` : ''}
                    <div class="forge-card-inner">
                        <div class="forge-card-top">
                            <div class="forge-icon" style="background:${challenge.color}22;color:${challenge.color}">${challenge.emoji}</div>
                            <div class="forge-title-block">
                                <div class="forge-title">${challenge.title}</div>
                                ${challenge.isStrict ? '<span class="forge-strict-badge">⚡ ZORLU MOD</span>' : ''}
                            </div>
                            <div class="forge-day-counter">
                                <span class="forge-day-num" style="color:${challenge.color}">${p.currentDay}</span>
                                <span class="forge-day-total">/ ${challenge.duration} gün</span>
                            </div>
                        </div>
                        <div class="forge-progress-label">
                            <span>İlerleme</span>
                            <span style="color:${challenge.color};font-weight:600">${percent}%</span>
                        </div>
                        <div class="forge-progress-bg">
                            <div class="forge-progress-fill" style="width:${percent}%;background:${challenge.color}"></div>
                        </div>
                        <div class="forge-actions">
                            <button class="forge-checkin-btn" style="background:${challenge.color}" onclick="openForgeModal('checkin','${challenge.id}')">
                                ✅ Günü Tamamla
                            </button>
                            <button class="forge-ghost-btn ${isExpanded ? 'expanded' : ''}" onclick="toggleForgeExpand('${challenge.id}')">📋</button>
                            ${challenge.isStrict ? `<button class="forge-ghost-btn" onclick="openForgeModal('reset','${challenge.id}')" title="Kuralı bozdum">🔄</button>` : ''}
                        </div>
                    </div>
                    ${isExpanded ? `
                    <div class="forge-logs">
                        <div class="forge-logs-header">
                            <span>📅 Kayıtlar</span>
                            <span class="forge-logs-count">${logs.length} gün</span>
                        </div>
                        ${logs.length === 0
                            ? '<p class="forge-no-logs">Henüz kayıt yok. İlk günü tamamla!</p>'
                            : `<div class="forge-logs-list">${logs.map(log => `
                                <div class="forge-log-item">
                                    <div class="forge-log-header">
                                        <span class="forge-log-day" style="color:${challenge.color}">Gün ${log.day}</span>
                                        <span class="forge-log-date">${new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(log.date))}</span>
                                    </div>
                                    ${log.note ? `<p class="forge-log-note">"${log.note}"</p>` : ''}
                                </div>`).join('')}
                            </div>`}
                        <button class="forge-abandon-btn" onclick="openForgeModal('abandon','${challenge.id}')">🗑️ Görevi Sil</button>
                    </div>` : ''}
                </div>`;
            });
        }
    } else {
        if (inactiveChallenges.length === 0) {
            html += `<div class="forge-empty">
                <span class="forge-empty-icon">🏆</span>
                <h3>Tüm Görevler Aktif!</h3>
                <p>Listede keşfedilecek yeni görev kalmadı. Aktif görevlerine odaklan.</p>
            </div>`;
        } else {
            inactiveChallenges.forEach(challenge => {
                html += `<div class="forge-discover-card">
                    <div class="forge-discover-header">
                        <div class="forge-icon" style="background:${challenge.color}22;color:${challenge.color}">${challenge.emoji}</div>
                        <div>
                            <div class="forge-title">${challenge.title}</div>
                            <span class="forge-duration-badge">${challenge.duration} Günlük Süreç</span>
                        </div>
                    </div>
                    <p class="forge-description">${challenge.description}</p>
                    ${challenge.isStrict ? `
                    <div class="forge-strict-notice">
                        ⚡ <strong>Zorlu Mod:</strong> Bir kuralı bile bozarsan 1. Günden tekrar başlamak zorundasın.
                    </div>` : ''}
                    <button class="btn primary forge-start-btn" onclick="startChallenge('${challenge.id}')">▶ Bu Görevi Başlat</button>
                </div>`;
            });
        }
    }

    html += '</div>';
    page.innerHTML = html;
};

const setForgeSubTab = (tab) => {
    APP_STATE.forgeSubTab = tab;
    APP_STATE.forgeExpandedId = null;
    renderForge();
};

const toggleForgeExpand = (id) => {
    APP_STATE.forgeExpandedId = APP_STATE.forgeExpandedId === id ? null : id;
    renderForge();
};

const startChallenge = (id) => {
    APP_STATE.forgeData[id] = {
        currentDay: 0, isActive: true, isCompleted: false,
        logs: [], checkInDates: [], startedAt: new Date().toISOString(),
    };
    APP_STATE.forgeSubTab = 'active';
    saveData();
    renderForge();
    showToast('Görev başlatıldı! 🚀', 'success');
};

const abandonChallenge = (id) => {
    delete APP_STATE.forgeData[id];
    saveData();
    renderForge();
    showToast('Görev silindi.', 'success');
};

const openForgeModal = (type, challengeId) => {
    APP_STATE.forgeModal = { type, id: challengeId };

    const title = document.getElementById('forge-modal-title');
    const body = document.getElementById('forge-modal-body');
    const footer = document.getElementById('forge-modal-footer');

    if (type === 'checkin') {
        title.textContent = '✅ Günü Tamamla';
        body.innerHTML = `
            <p style="color:var(--text-secondary);margin-bottom:12px">Bugün nasıldı? Gelecekteki sana not bırak. <span style="color:var(--text-muted)">(isteğe bağlı)</span></p>
            <textarea id="forge-note-input" placeholder="Çok zorlandım ama bırakmadım…" style="width:100%;padding:12px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-input);color:var(--text-primary);font-family:inherit;font-size:0.95rem;resize:none;min-height:100px;outline:none"></textarea>`;
        footer.innerHTML = `
            <button class="btn secondary" onclick="closeForgeModal()">İptal</button>
            <button class="btn primary" onclick="forgeCheckIn()">Kaydet</button>`;
    } else if (type === 'reset') {
        title.textContent = '🔄 Kuralı Bozdun Mu?';
        body.innerHTML = `<p style="color:var(--text-secondary)">Tüm ilerleme ve notlar sıfırlanacak. Emin misin?</p>`;
        footer.innerHTML = `
            <button class="btn secondary" onclick="closeForgeModal()">İptal</button>
            <button class="btn" style="background:var(--danger);color:white;flex:1" onclick="forgeReset()">Evet, Başa Dön</button>`;
    } else if (type === 'abandon') {
        title.textContent = '🗑️ Görevi Sil';
        body.innerHTML = `<p style="color:var(--text-secondary)">Tüm kayıtlar kalıcı olarak silinecek. Emin misin?</p>`;
        footer.innerHTML = `
            <button class="btn secondary" onclick="closeForgeModal()">İptal</button>
            <button class="btn" style="background:var(--danger);color:white;flex:1" onclick="confirmAbandonChallenge()">Evet, Sil</button>`;
    }

    document.getElementById('forge-modal').classList.add('active');
};

const closeForgeModal = () => {
    document.getElementById('forge-modal').classList.remove('active');
    APP_STATE.forgeModal = { type: '', id: null };
};

const forgeCheckIn = () => {
    const { id } = APP_STATE.forgeModal;
    if (!id) return;

    const noteEl = document.getElementById('forge-note-input');
    const note = noteEl ? noteEl.value.trim() : '';

    const p = APP_STATE.forgeData[id];
    if (!p || p.isCompleted) return;

    const challenge = CHALLENGES_DB.find(c => c.id === id);
    const nextDay = p.currentDay + 1;

    const todayStr = getToday();
    if (!p.checkInDates) p.checkInDates = [];
    if (!p.checkInDates.includes(todayStr)) {
        p.checkInDates.push(todayStr);
    }

    APP_STATE.forgeData[id] = {
        ...p,
        currentDay: nextDay,
        isCompleted: nextDay >= challenge.duration,
        logs: [{ day: nextDay, date: new Date().toISOString(), note }, ...(p.logs || [])],
        checkInDates: p.checkInDates,
    };

    saveData();
    closeForgeModal();
    renderForge();
    renderForgeWidget();
    showToast(`Gün ${nextDay} tamamlandı! 🎯`, 'success');
};

const forgeReset = () => {
    const { id } = APP_STATE.forgeModal;
    if (!id) return;

    APP_STATE.forgeData[id] = {
        currentDay: 0, isActive: true, isCompleted: false,
        logs: [], checkInDates: [], startedAt: new Date().toISOString(),
    };

    saveData();
    closeForgeModal();
    renderForge();
    showToast('Görev sıfırlandı. Baştan başla! 💪', 'success');
};

const confirmAbandonChallenge = () => {
    const { id } = APP_STATE.forgeModal;
    closeForgeModal();
    abandonChallenge(id);
};

// ==================== FORGE WIDGET (HOME) ====================
const renderForgeWidget = () => {
    const container = document.getElementById('forge-widget-container');
    if (!container) return;

    const activeForge = CHALLENGES_DB.filter(c => {
        const p = APP_STATE.forgeData[c.id];
        return p?.isActive && !p?.isCompleted;
    });

    if (activeForge.length === 0) {
        container.innerHTML = '';
        return;
    }

    const itemsHtml = activeForge.map(challenge => {
        const p = APP_STATE.forgeData[challenge.id];
        const percent = Math.min(100, Math.round((p.currentDay / challenge.duration) * 100));
        return `
            <div class="forge-widget-item" onclick="switchPage('forge')">
                <span class="forge-widget-emoji">${challenge.emoji}</span>
                <div class="forge-widget-info">
                    <div class="forge-widget-title">${challenge.title}</div>
                    <div class="forge-progress-bg" style="margin-top:4px">
                        <div class="forge-progress-fill" style="width:${percent}%;background:${challenge.color}"></div>
                    </div>
                </div>
                <div class="forge-widget-day" style="color:${challenge.color}">${p.currentDay}<span>/${challenge.duration}</span></div>
                <button class="habit-check" onclick="event.stopPropagation(); quickForgeCheckIn('${challenge.id}')"></button>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <section class="habits-card">
            <div class="card-header">
                <h3 class="card-title">⚔️ Aktif Görevler</h3>
            </div>
            <div class="habits-list">
                ${itemsHtml}
            </div>
        </section>
    `;
};

const quickForgeCheckIn = (id) => {
    openForgeModal('checkin', id);
};

const renderXPBanner = () => {
    // XP Faz 4
};

// ==================== FORGE ANALYTICS ====================
const renderForgeAnalytics = () => {
    const container = document.getElementById('forge-analytics');
    if (!container) return;

    const activeForge = CHALLENGES_DB.filter(c => APP_STATE.forgeData[c.id]?.isActive);

    if (activeForge.length === 0) {
        container.innerHTML = '<div class="no-habits" style="padding:20px">Aktif Forge görevi yok.</div>';
        return;
    }

    container.innerHTML = activeForge.map(challenge => {
        const p = APP_STATE.forgeData[challenge.id];
        const percent = Math.min(100, Math.round((p.currentDay / challenge.duration) * 100));

        let estimatedEnd = '—';
        if (p.startedAt) {
            const end = new Date(p.startedAt);
            end.setDate(end.getDate() + challenge.duration);
            estimatedEnd = end.toLocaleDateString('tr-TR');
        }

        return `
            <div class="habit-stat">
                <span class="habit-stat-icon">${challenge.emoji}</span>
                <div class="habit-stat-info">
                    <div class="habit-stat-name">${challenge.title}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${p.currentDay}/${challenge.duration} gün · Tahmini bitiş: ${estimatedEnd}</div>
                    <div class="habit-stat-bar">
                        <div class="habit-stat-fill" style="width:${percent}%;background:${challenge.color}"></div>
                    </div>
                </div>
                <span class="habit-stat-percent">${percent}%</span>
            </div>
        `;
    }).join('');
};

// ==================== CORRELATION ====================
const renderCorrelation = () => {
    const container = document.getElementById('correlation-section');
    if (!container) return;

    const days = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const log = APP_STATE.dailyLogs[dateStr];
        if (!log || !log.mood) continue;

        const habitCount = APP_STATE.habits.filter(h => log.habits?.[h.id]).length;
        const habitPct = APP_STATE.habits.length > 0 ? Math.round((habitCount / APP_STATE.habits.length) * 100) : 0;
        days.push({ dateStr, mood: log.mood, habitPct });
    }

    if (days.length < 7) {
        container.innerHTML = '<div class="no-habits" style="padding:20px">📊 Yeterli veri yok — birkaç gün daha kayıt gir.</div>';
        return;
    }

    const highHabitDays = days.filter(d => d.habitPct >= 70);
    const avgMoodHighHabit = highHabitDays.length > 0
        ? (highHabitDays.reduce((a, b) => a + b.mood, 0) / highHabitDays.length).toFixed(1)
        : null;

    const scatterHtml = days.map(d => {
        const x = d.habitPct;
        const y = ((5 - d.mood) / 4) * 100;
        return `<div style="position:absolute;left:${x}%;top:${y}%;width:8px;height:8px;border-radius:50%;background:${MOOD_COLORS[d.mood]};transform:translate(-50%,-50%);opacity:0.8"></div>`;
    }).join('');

    const insightHtml = avgMoodHighHabit
        ? `<p style="font-size:0.85rem;color:var(--text-secondary);margin-top:12px">Alışkanlıklarını %70+ tamamladığın günlerde ortalama ruh halin: <strong style="color:var(--text-primary)">${avgMoodHighHabit} ${MOOD_EMOJIS[Math.round(parseFloat(avgMoodHighHabit))]}</strong></p>`
        : '';

    container.innerHTML = `
        <div style="position:relative;height:120px;background:var(--bg-input);border-radius:8px;margin:8px 0;overflow:hidden">
            ${scatterHtml}
        </div>
        <div style="text-align:center;font-size:0.75rem;color:var(--text-muted)">0% ← Alışkanlık Oranı → 100%</div>
        ${insightHtml}
    `;
};
