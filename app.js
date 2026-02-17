// Chain Breaker App - Main JavaScript

class ChainBreakerApp {
    constructor() {
        this.data = this.loadData();
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.selectedMood = null;
        
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

        this.init();
    }

    // Initialize the app
    init() {
        this.bindEvents();
        this.updateUI();
        this.renderCalendar();
        this.renderLogs();
        this.showRandomQuote();
        this.registerServiceWorker();
    }

    // Load data from localStorage
    loadData() {
        const defaultData = {
            startDate: null,
            checkIns: {},  // { "2026-02-17": "success" | "fail" }
            logs: [],      // [{ id, date, mood, note, triggers }]
            settings: {
                monthlyGoal: 30
            }
        };

        try {
            const saved = localStorage.getItem('chainBreakerData');
            return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
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
        // Check-in button
        document.getElementById('checkInBtn').addEventListener('click', () => this.handleCheckIn());
        
        // Relapse button
        document.getElementById('relapseBtn').addEventListener('click', () => this.handleRelapse());
        
        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
        
        // Log modal
        document.getElementById('addLogBtn').addEventListener('click', () => this.openLogModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeLogModal());
        document.getElementById('cancelLog').addEventListener('click', () => this.closeLogModal());
        document.getElementById('saveLog').addEventListener('click', () => this.saveLog());
        
        // Mood selector
        document.querySelectorAll('.mood-btn').forEach(btn => {
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
        
        // Modal backdrop click
        document.getElementById('logModal').addEventListener('click', (e) => {
            if (e.target.id === 'logModal') this.closeLogModal();
        });
    }

    // Get today's date string
    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    // Handle check-in
    handleCheckIn() {
        const today = this.getTodayString();
        
        if (this.data.checkIns[today] === 'success') {
            this.showToast('Bugün zaten kayıt yaptın! 👍', 'success');
            return;
        }

        if (!this.data.startDate) {
            this.data.startDate = today;
        }

        this.data.checkIns[today] = 'success';
        this.saveData();
        this.updateUI();
        this.renderCalendar();
        
        const streak = this.calculateCurrentStreak();
        if (streak % 7 === 0 && streak > 0) {
            this.showToast(`🎉 Harika! ${streak} günlük seri!`, 'success');
        } else {
            this.showToast('Bugün başardın! 💪', 'success');
        }
    }

    // Handle relapse
    handleRelapse() {
        const today = this.getTodayString();
        
        if (confirm('Emin misin? Bu bugünü başarısız olarak işaretleyecek.')) {
            this.data.checkIns[today] = 'fail';
            this.saveData();
            this.updateUI();
            this.renderCalendar();
            this.showToast('Sorun değil, yarın yeni bir gün! 🌅', 'error');
        }
    }

    // Calculate current streak
    calculateCurrentStreak() {
        let streak = 0;
        let date = new Date();
        
        while (true) {
            const dateStr = date.toISOString().split('T')[0];
            
            if (this.data.checkIns[dateStr] === 'success') {
                streak++;
                date.setDate(date.getDate() - 1);
            } else if (this.data.checkIns[dateStr] === 'fail') {
                break;
            } else {
                // Bugün henüz kayıt yapılmamışsa, dünden devam et
                if (dateStr === this.getTodayString()) {
                    date.setDate(date.getDate() - 1);
                } else {
                    break;
                }
            }
        }
        
        return streak;
    }

    // Calculate longest streak
    calculateLongestStreak() {
        const dates = Object.keys(this.data.checkIns).sort();
        let longest = 0;
        let current = 0;

        for (const date of dates) {
            if (this.data.checkIns[date] === 'success') {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 0;
            }
        }

        return longest;
    }

    // Calculate total successful days
    calculateTotalDays() {
        return Object.values(this.data.checkIns).filter(v => v === 'success').length;
    }

    // Calculate monthly progress
    calculateMonthlyProgress() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let successDays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (this.data.checkIns[dateStr] === 'success') {
                successDays++;
            }
        }
        
        return Math.round((successDays / daysInMonth) * 100);
    }

    // Update UI elements
    updateUI() {
        const currentStreak = this.calculateCurrentStreak();
        const longestStreak = this.calculateLongestStreak();
        const totalDays = this.calculateTotalDays();
        const progress = this.calculateMonthlyProgress();
        const today = this.getTodayString();

        document.getElementById('currentStreak').textContent = currentStreak;
        document.getElementById('longestStreak').textContent = longestStreak;
        document.getElementById('totalDays').textContent = totalDays;
        document.getElementById('progressPercent').textContent = `${progress}%`;

        // Update progress ring
        const circumference = 2 * Math.PI * 90;
        const offset = circumference - (progress / 100) * circumference;
        document.getElementById('progressRing').style.strokeDashoffset = offset;

        // Update check-in button
        const checkInBtn = document.getElementById('checkInBtn');
        if (this.data.checkIns[today] === 'success') {
            checkInBtn.classList.add('checked');
            checkInBtn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Bugün Kayıt Yapıldı!</span>';
        } else if (this.data.checkIns[today] === 'fail') {
            checkInBtn.classList.remove('checked');
            checkInBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Tekrar Dene</span>';
        } else {
            checkInBtn.classList.remove('checked');
            checkInBtn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Bugün Dayanıyorum!</span>';
        }
    }

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
        
        // Pazartesi = 0, Pazar = 6 için ayarlama
        let startDay = firstDay.getDay() - 1;
        if (startDay === -1) startDay = 6;
        
        const today = new Date();
        const todayStr = this.getTodayString();
        
        let html = '';
        
        // Boş günler
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Ayın günleri
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const date = new Date(this.currentYear, this.currentMonth, day);
            
            let classes = ['calendar-day'];
            
            if (dateStr === todayStr) {
                classes.push('today');
            }
            
            if (date > today) {
                classes.push('future');
            } else if (this.data.checkIns[dateStr] === 'success') {
                classes.push('success');
            } else if (this.data.checkIns[dateStr] === 'fail') {
                classes.push('fail');
            }
            
            html += `<div class="${classes.join(' ')}" data-date="${dateStr}">${day}</div>`;
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

    // Open log modal
    openLogModal() {
        document.getElementById('logModal').classList.add('active');
        document.getElementById('logNote').value = '';
        document.getElementById('logTriggers').value = '';
        this.selectedMood = null;
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
    }

    // Close log modal
    closeLogModal() {
        document.getElementById('logModal').classList.remove('active');
    }

    // Select mood
    selectMood(btn) {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
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

        const moodEmojis = ['', '😢', '😕', '😐', '🙂', '😄'];
        
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
                        <span class="log-mood">${log.mood ? moodEmojis[log.mood] : ''}</span>
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

    // Show random quote
    showRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        document.getElementById('quoteText').textContent = `"${this.quotes[randomIndex]}"`;
    }

    // Export data
    exportData() {
        const exportData = {
            ...this.data,
            exportDate: new Date().toISOString(),
            appVersion: '1.0.0'
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

    // Import data
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!importedData.checkIns) {
                    throw new Error('Geçersiz veri formatı');
                }

                // Merge or replace data
                if (confirm('Mevcut verilerinizi değiştirmek mi yoksa birleştirmek mi istiyorsunuz?\n\nTamam = Değiştir\nİptal = Birleştir')) {
                    // Replace
                    this.data = {
                        startDate: importedData.startDate || this.data.startDate,
                        checkIns: importedData.checkIns || {},
                        logs: importedData.logs || [],
                        settings: importedData.settings || this.data.settings
                    };
                } else {
                    // Merge
                    this.data.checkIns = { ...this.data.checkIns, ...importedData.checkIns };
                    this.data.logs = [...importedData.logs || [], ...this.data.logs];
                    // Remove duplicate logs by id
                    const seen = new Set();
                    this.data.logs = this.data.logs.filter(log => {
                        if (seen.has(log.id)) return false;
                        seen.add(log.id);
                        return true;
                    });
                }

                this.saveData();
                this.updateUI();
                this.renderCalendar();
                this.renderLogs();
                this.showToast('Veriler içe aktarıldı! 📥', 'success');
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Veri içe aktarılamadı: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Register service worker
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
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
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'gradient');
    gradient.innerHTML = `
        <stop offset="0%" stop-color="#00d9a5"/>
        <stop offset="100%" stop-color="#00b894"/>
    `;
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);
});
