// Chain Breaker App - Main JavaScript v2.0

class ChainBreakerApp {
    constructor() {
        this.data = this.loadData();
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.selectedMood = null;
        this.editingHabitId = null;
        
        this.quotes = [
            "Her gün, daha güçlü bir versiyonun için yeni bir fırsat.",
            "Düşmek başarısızlık değildir, düştüğün yerde kalmak başarısızlıktır.",
            "Bir adım daha. Sadece bir adım daha.",
            "Geçmişin hatalarını değiştiremezsin ama geleceğini şekillendirebilirsin.",
            "Güçlü insanlar zor günlerde yetişir.",
            "Bugün yarının temelini atıyorsun.",
            "Her 'hayır' dediğinde, kendine 'evet' demiş oluyorsun.",
            "Küçük zaferler büyük değişimlerin başlangıcıdır.",
            "Mükemmel olmak zorunda değilsin, sadece vazgeçme.",
            "İrade kası gibidir, kullandıkça güçlenir.",
            "Bugün zor olabilir ama imkansız değil.",
            "Kendine verdiğin sözleri tut.",
            "Her sabah yeni bir başlangıç.",
            "Acı geçici, gurur kalıcıdır.",
            "Bugünün fedakarlığı, yarının özgürlüğüdür."
        ];

        this.moodEmojis = ['', '😢', '😕', '😐', '🙂', '😄'];
        this.moodLabels = ['', 'Çok Kötü', 'Kötü', 'Normal', 'İyi', 'Çok İyi'];

        this.init();
    }

    // Initialize the app
    init() {
        this.bindEvents();
        this.renderHabits();
        this.renderDailyMood();
        this.updateStats();
        this.renderCalendar();
        this.renderLogs();
        this.showRandomQuote();
        this.registerServiceWorker();
    }

    // Load data from localStorage
    loadData() {
        const defaultData = {
            habits: [],
            dailyMoods: {},
            logs: [],
            settings: {
                monthlyGoal: 30
            }
        };

        try {
            const saved = localStorage.getItem('chainBreakerData');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Migration: eski format ise dönüştür
                if (parsed.checkIns && !parsed.habits) {
                    return {
                        ...defaultData,
                        habits: [{
                            id: 1,
                            name: 'Alışkanlık',
                            icon: '⛓️',
                            color: '#e94560',
                            checkIns: parsed.checkIns
                        }],
                        dailyMoods: {},
                        logs: parsed.logs || []
                    };
                }
                return { ...defaultData, ...parsed };
            }
            return defaultData;
        } catch (e) {
            console.error('Veri yüklenirken hata:', e);
            return defaultData;
        }
    }

    // Save data to localStorage
    saveData() {
        try {
            localStorage.setItem('chainBreakerData', JSON.stringify(this.data));
        } catch (e) {
            console.error('Veri kaydedilirken hata:', e);
            this.showToast('Veri kaydedilemedi!', 'error');
        }
    }

    // Bind all event listeners
    bindEvents() {
        // Add habit button
        document.getElementById('addHabitBtn').addEventListener('click', () => this.openHabitModal());
        
        // Habit modal
        document.getElementById('closeHabitModal').addEventListener('click', () => this.closeHabitModal());
        document.getElementById('cancelHabit').addEventListener('click', () => this.closeHabitModal());
        document.getElementById('saveHabit').addEventListener('click', () => this.saveHabit());
        
        // Icon selector
        document.querySelectorAll('.icon-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectIcon(e.target));
        });
        
        // Color selector
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectColor(e.target));
        });
        
        // Daily mood selector
        document.querySelectorAll('.daily-mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setDailyMood(parseInt(e.target.dataset.mood)));
        });
        
        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        
        // Log modal
        document.getElementById('addLogBtn').addEventListener('click', () => this.openLogModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeLogModal());
        document.getElementById('cancelLog').addEventListener('click', () => this.closeLogModal());
        document.getElementById('saveLog').addEventListener('click', () => this.saveLog());
        
        // Mood selector in log modal
        document.querySelectorAll('#moodSelector .mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMood(e.target));
        });
        
        // Quote refresh
        document.getElementById('refreshQuote').addEventListener('click', () => this.showRandomQuote());
        
        // Data management
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        
        // Modal backdrop clicks
        document.getElementById('logModal').addEventListener('click', (e) => {
            if (e.target.id === 'logModal') this.closeLogModal();
        });
        document.getElementById('habitModal').addEventListener('click', (e) => {
            if (e.target.id === 'habitModal') this.closeHabitModal();
        });
    }

    // Get today's date string
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    // ==================== HABITS ====================

    // Render habits list
    renderHabits() {
        const container = document.getElementById('habitsList');
        const today = this.getTodayString();

        if (this.data.habits.length === 0) {
            container.innerHTML = `
                <div class="no-habits">
                    <p>Henüz alışkanlık eklenmedi</p>
                    <p>İlk alışkanlığını eklemek için + butonuna tıkla</p>
                </div>
            `;
            return;
        }

        const html = this.data.habits.map(habit => {
            const streak = this.calculateStreak(habit);
            const isCheckedToday = habit.checkIns[today] === 'success';
            const isFailedToday = habit.checkIns[today] === 'fail';
            
            return `
                <div class="habit-card" style="--habit-color: ${habit.color}">
                    <div class="habit-header">
                        <div class="habit-info">
                            <span class="habit-icon">${habit.icon}</span>
                            <span class="habit-name">${habit.name}</span>
                        </div>
                        <div class="habit-streak">
                            <span class="streak-fire">🔥</span>
                            <span class="streak-count">${streak}</span>
                        </div>
                    </div>
                    <div class="habit-actions">
                        <button class="habit-check-btn ${isCheckedToday ? 'checked' : ''}" 
                                onclick="app.checkHabit(${habit.id})" 
                                ${isCheckedToday || isFailedToday ? 'disabled' : ''}>
                            ${isCheckedToday ? '✅ Yapıldı' : '✓ Bugün Yaptım'}
                        </button>
                        <button class="habit-fail-btn ${isFailedToday ? 'failed' : ''}" 
                                onclick="app.failHabit(${habit.id})"
                                ${isCheckedToday || isFailedToday ? 'disabled' : ''}>
                            ${isFailedToday ? '❌' : '✗'}
                        </button>
                        <button class="habit-menu-btn" onclick="app.showHabitMenu(${habit.id})">⋮</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    // Check habit for today
    checkHabit(habitId) {
        const habit = this.data.habits.find(h => h.id === habitId);
        if (!habit) return;

        const today = this.getTodayString();
        habit.checkIns[today] = 'success';
        this.saveData();
        this.renderHabits();
        this.updateStats();
        this.renderCalendar();

        const streak = this.calculateStreak(habit);
        if (streak % 7 === 0 && streak > 0) {
            this.showToast(`🎉 ${habit.name}: ${streak} günlük seri!`, 'success');
        } else {
            this.showToast(`${habit.icon} ${habit.name} tamamlandı!`, 'success');
        }
    }

    // Fail habit for today
    failHabit(habitId) {
        const habit = this.data.habits.find(h => h.id === habitId);
        if (!habit) return;

        if (confirm(`${habit.name} için bugünü başarısız olarak işaretlemek istediğine emin misin?`)) {
            const today = this.getTodayString();
            habit.checkIns[today] = 'fail';
            this.saveData();
            this.renderHabits();
            this.updateStats();
            this.renderCalendar();
            this.showToast('Yarın yeni bir gün! 🌅', 'error');
        }
    }

    // Show habit menu (edit/delete)
    showHabitMenu(habitId) {
        const habit = this.data.habits.find(h => h.id === habitId);
        if (!habit) return;

        const action = prompt(`${habit.name}\n\n1 - Düzenle\n2 - Sil\n\nSeçiminizi yazın (1 veya 2):`);
        
        if (action === '1') {
            this.editHabit(habitId);
        } else if (action === '2') {
            this.deleteHabit(habitId);
        }
    }

    // Edit habit
    editHabit(habitId) {
        const habit = this.data.habits.find(h => h.id === habitId);
        if (!habit) return;

        this.editingHabitId = habitId;
        document.getElementById('habitModalTitle').textContent = 'Alışkanlığı Düzenle';
        document.getElementById('habitName').value = habit.name;
        
        // Select icon
        document.querySelectorAll('.icon-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.icon === habit.icon);
        });
        
        // Select color
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.color === habit.color);
        });

        document.getElementById('habitModal').classList.add('active');
    }

    // Delete habit
    deleteHabit(habitId) {
        const habit = this.data.habits.find(h => h.id === habitId);
        if (!habit) return;

        if (confirm(`"${habit.name}" alışkanlığını silmek istediğine emin misin? Tüm veriler silinecek.`)) {
            this.data.habits = this.data.habits.filter(h => h.id !== habitId);
            this.saveData();
            this.renderHabits();
            this.updateStats();
            this.renderCalendar();
            this.showToast('Alışkanlık silindi', 'success');
        }
    }

    // Open habit modal
    openHabitModal() {
        this.editingHabitId = null;
        document.getElementById('habitModalTitle').textContent = 'Yeni Alışkanlık';
        document.getElementById('habitName').value = '';
        document.querySelectorAll('.icon-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('habitModal').classList.add('active');
    }

    // Close habit modal
    closeHabitModal() {
        document.getElementById('habitModal').classList.remove('active');
        this.editingHabitId = null;
    }

    // Select icon
    selectIcon(btn) {
        document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    }

    // Select color
    selectColor(btn) {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    }

    // Save habit
    saveHabit() {
        const name = document.getElementById('habitName').value.trim();
        const selectedIcon = document.querySelector('.icon-btn.selected');
        const selectedColor = document.querySelector('.color-btn.selected');

        if (!name) {
            this.showToast('Lütfen bir isim girin', 'error');
            return;
        }

        const icon = selectedIcon ? selectedIcon.dataset.icon : '⭐';
        const color = selectedColor ? selectedColor.dataset.color : '#e94560';

        if (this.editingHabitId) {
            // Update existing
            const habit = this.data.habits.find(h => h.id === this.editingHabitId);
            if (habit) {
                habit.name = name;
                habit.icon = icon;
                habit.color = color;
            }
        } else {
            // Create new
            const newHabit = {
                id: Date.now(),
                name: name,
                icon: icon,
                color: color,
                checkIns: {}
            };
            this.data.habits.push(newHabit);
        }

        this.saveData();
        this.renderHabits();
        this.updateStats();
        this.closeHabitModal();
        this.showToast(this.editingHabitId ? 'Alışkanlık güncellendi!' : 'Alışkanlık eklendi!', 'success');
    }

    // Calculate streak for a habit
    calculateStreak(habit) {
        let streak = 0;
        let date = new Date();
        
        while (true) {
            const dateStr = date.toISOString().split('T')[0];
            
            if (habit.checkIns[dateStr] === 'success') {
                streak++;
                date.setDate(date.getDate() - 1);
            } else if (habit.checkIns[dateStr] === 'fail') {
                break;
            } else {
                if (dateStr === this.getTodayString()) {
                    date.setDate(date.getDate() - 1);
                } else {
                    break;
                }
            }
        }
        
        return streak;
    }

    // ==================== DAILY MOOD ====================

    // Render daily mood selector
    renderDailyMood() {
        const today = this.getTodayString();
        const todayMood = this.data.dailyMoods[today];

        document.querySelectorAll('.daily-mood-btn').forEach(btn => {
            const mood = parseInt(btn.dataset.mood);
            btn.classList.toggle('selected', mood === todayMood);
        });

        const moodText = document.getElementById('currentMoodText');
        if (todayMood) {
            moodText.textContent = `Bugün: ${this.moodEmojis[todayMood]} ${this.moodLabels[todayMood]}`;
        } else {
            moodText.textContent = 'Duygu durumunu seç';
        }
    }

    // Set daily mood
    setDailyMood(mood) {
        const today = this.getTodayString();
        this.data.dailyMoods[today] = mood;
        this.saveData();
        this.renderDailyMood();
        this.renderCalendar();
        this.showToast(`${this.moodEmojis[mood]} Duygu durumun kaydedildi!`, 'success');
    }

    // ==================== STATS ====================

    // Update statistics
    updateStats() {
        let totalStreak = 0;
        let longestStreak = 0;
        let totalDays = 0;

        this.data.habits.forEach(habit => {
            const streak = this.calculateStreak(habit);
            totalStreak += streak;
            longestStreak = Math.max(longestStreak, this.calculateLongestStreak(habit));
            totalDays += Object.values(habit.checkIns).filter(v => v === 'success').length;
        });

        document.getElementById('currentStreak').textContent = totalStreak;
        document.getElementById('longestStreak').textContent = longestStreak;
        document.getElementById('totalDays').textContent = totalDays;

        const progress = this.calculateMonthlyProgress();
        document.getElementById('progressPercent').textContent = `${progress}%`;

        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (progress / 100) * circumference;
        document.getElementById('progressRing').style.strokeDashoffset = offset;
    }

    // Calculate longest streak for a habit
    calculateLongestStreak(habit) {
        const dates = Object.keys(habit.checkIns).sort();
        let longest = 0;
        let current = 0;

        for (const date of dates) {
            if (habit.checkIns[date] === 'success') {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 0;
            }
        }

        return longest;
    }

    // Calculate monthly progress
    calculateMonthlyProgress() {
        if (this.data.habits.length === 0) return 0;

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        
        let totalPossible = this.data.habits.length * today;
        let totalSuccess = 0;

        for (let day = 1; day <= today; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            this.data.habits.forEach(habit => {
                if (habit.checkIns[dateStr] === 'success') {
                    totalSuccess++;
                }
            });
        }
        
        return totalPossible > 0 ? Math.round((totalSuccess / totalPossible) * 100) : 0;
    }

    // ==================== CALENDAR ====================

    // Render calendar
    renderCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        const calendarTitle = document.getElementById('calendarTitle');
        
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                       'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        
        calendarTitle.textContent = `${months[this.currentMonth]} ${this.currentYear}`;
        
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        let startDay = firstDay.getDay() - 1;
        if (startDay === -1) startDay = 6;
        
        const today = new Date();
        const todayStr = this.getTodayString();
        
        let html = '';
        
        // Empty days
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const date = new Date(this.currentYear, this.currentMonth, day);
            
            let classes = ['calendar-day'];
            let content = `<span class="day-number">${day}</span>`;
            
            if (dateStr === todayStr) {
                classes.push('today');
            }
            
            if (date > today) {
                classes.push('future');
            } else {
                let successCount = 0;
                let failCount = 0;
                
                this.data.habits.forEach(habit => {
                    if (habit.checkIns[dateStr] === 'success') successCount++;
                    else if (habit.checkIns[dateStr] === 'fail') failCount++;
                });

                if (this.data.habits.length > 0) {
                    if (successCount === this.data.habits.length) {
                        classes.push('success');
                    } else if (successCount > 0 || failCount > 0) {
                        classes.push('partial');
                    }
                }

                const mood = this.data.dailyMoods[dateStr];
                if (mood) {
                    content += `<span class="day-mood">${this.moodEmojis[mood]}</span>`;
                }
            }
            
            html += `<div class="${classes.join(' ')}" data-date="${dateStr}">${content}</div>`;
        }
        
        calendarDays.innerHTML = html;
    }

    // Change month
    changeMonth(delta) {
        this.currentMonth += delta;
        
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        
        this.renderCalendar();
    }

    // ==================== LOGS ====================

    // Open log modal
    openLogModal() {
        document.getElementById('logModal').classList.add('active');
        document.getElementById('logNote').value = '';
        document.getElementById('logTriggers').value = '';
        this.selectedMood = null;
        document.querySelectorAll('#moodSelector .mood-btn').forEach(btn => btn.classList.remove('selected'));
    }

    // Close log modal
    closeLogModal() {
        document.getElementById('logModal').classList.remove('active');
    }

    // Select mood
    selectMood(btn) {
        document.querySelectorAll('#moodSelector .mood-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedMood = parseInt(btn.dataset.mood);
    }

    // Save log
    saveLog() {
        const note = document.getElementById('logNote').value.trim();
        const triggersInput = document.getElementById('logTriggers').value.trim();
        const triggers = triggersInput ? triggersInput.split(',').map(t => t.trim()).filter(t => t) : [];

        if (!note && !this.selectedMood) {
            this.showToast('Lütfen bir not veya ruh hali seçin', 'error');
            return;
        }

        const log = {
            id: Date.now(),
            date: this.getTodayString(),
            mood: this.selectedMood,
            note: note,
            triggers: triggers
        };

        this.data.logs.unshift(log);
        this.saveData();
        this.renderLogs();
        this.closeLogModal();
        this.showToast('Not kaydedildi! 📝', 'success');
    }

    // Render logs
    renderLogs() {
        const logsList = document.getElementById('logsList');
        
        if (this.data.logs.length === 0) {
            logsList.innerHTML = '<div class="no-logs">Henüz not yok. İlk notunu ekle!</div>';
            return;
        }
        
        const html = this.data.logs.slice(0, 10).map(log => {
            const date = new Date(log.date);
            const formattedDate = date.toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
            
            const triggersHtml = log.triggers.length > 0 
                ? `<div class="log-triggers">${log.triggers.map(t => `<span class="trigger-tag">${t}</span>`).join('')}</div>`
                : '';
            
            return `
                <div class="log-item" data-id="${log.id}">
                    <div class="log-header">
                        <span class="log-date">${formattedDate}</span>
                        <span class="log-mood">${log.mood ? this.moodEmojis[log.mood] : ''}</span>
                    </div>
                    ${log.note ? `<p class="log-note">${log.note}</p>` : ''}
                    ${triggersHtml}
                    <div class="log-actions">
                        <button class="log-action-btn" onclick="app.deleteLog(${log.id})">🗑️ Sil</button>
                    </div>
                </div>
            `;
        }).join('');
        
        logsList.innerHTML = html;
    }

    // Delete log
    deleteLog(id) {
        if (confirm('Bu notu silmek istediğine emin misin?')) {
            this.data.logs = this.data.logs.filter(log => log.id !== id);
            this.saveData();
            this.renderLogs();
            this.showToast('Not silindi', 'success');
        }
    }

    // ==================== QUOTES ====================

    showRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        document.getElementById('quoteText').textContent = `"${this.quotes[randomIndex]}"`;
    }

    // ==================== DATA MANAGEMENT ====================

    exportData() {
        const exportData = {
            ...this.data,
            exportDate: new Date().toISOString(),
            appVersion: '2.0.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `chain-breaker-backup-${this.getTodayString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Veriler dışa aktarıldı! 📤', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.habits && !importedData.checkIns) {
                    throw new Error('Geçersiz veri formatı');
                }

                // Migration for old format
                if (importedData.checkIns && !importedData.habits) {
                    importedData.habits = [{
                        id: 1,
                        name: 'Alışkanlık',
                        icon: '⛓️',
                        color: '#e94560',
                        checkIns: importedData.checkIns
                    }];
                    importedData.dailyMoods = {};
                }

                if (confirm('Mevcut verilerinizi değiştirmek mi yoksa birleştirmek mi istiyorsunuz?\n\nTamam = Değiştir\nİptal = Birleştir')) {
                    this.data = {
                        habits: importedData.habits || [],
                        dailyMoods: importedData.dailyMoods || {},
                        logs: importedData.logs || [],
                        settings: importedData.settings || this.data.settings
                    };
                } else {
                    importedData.habits?.forEach(importedHabit => {
                        const existing = this.data.habits.find(h => h.name === importedHabit.name);
                        if (existing) {
                            existing.checkIns = { ...existing.checkIns, ...importedHabit.checkIns };
                        } else {
                            this.data.habits.push(importedHabit);
                        }
                    });
                    
                    this.data.dailyMoods = { ...this.data.dailyMoods, ...importedData.dailyMoods };
                    
                    this.data.logs = [...importedData.logs || [], ...this.data.logs];
                    const seen = new Set();
                    this.data.logs = this.data.logs.filter(log => {
                        if (seen.has(log.id)) return false;
                        seen.add(log.id);
                        return true;
                    });
                }

                this.saveData();
                this.renderHabits();
                this.renderDailyMood();
                this.updateStats();
                this.renderCalendar();
                this.renderLogs();
                this.showToast('Veriler içe aktarıldı! 📥', 'success');
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Veri içe aktarılamadı: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // ==================== UTILITIES ====================

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ChainBreakerApp();
});

// Add gradient definition for progress ring
document.addEventListener('DOMContentLoaded', () => {
    const svg = document.querySelector('.progress-ring');
    if (svg) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'gradient');
        gradient.innerHTML = `
            <stop offset="0%" stop-color="#00d9a5"/>
            <stop offset="100%" stop-color="#00b894"/>
        `;
        defs.appendChild(gradient);
        svg.insertBefore(defs, svg.firstChild);
    }
});
