# Chain Breaker ⛓️‍💥

Kötü alışkanlıklarını kırmana yardımcı olan mobil-uyumlu web uygulaması.

## 🚀 Özellikler

- **📱 Mobil Uyumlu PWA**: Telefonunuza yükleyebilirsiniz (Ana ekrana ekle)
- **🔥 Seri Takibi**: Kaç gündür dayanıyorsunuz gösterir
- **📅 Takvim Görünümü**: Başarılı ve başarısız günlerinizi görün
- **📝 Günlük Notlar**: Ruh halinizi ve tetikleyicileri kaydedin
- **💾 Veri Aktarımı**: JSON formatında dışa/içe aktarma ile cihazlar arası transfer
- **🌐 Çevrimdışı Çalışır**: İnternet olmadan da kullanabilirsiniz
- **🎨 Karanlık Tema**: Göz yormayan modern tasarım

## 📲 Kurulum

### Yerel Sunucu ile Çalıştırma

1. Projeyi bir klasöre kopyalayın
2. Terminalde klasöre gidin
3. Bir HTTP sunucusu başlatın:

```bash
# Python 3 ile
python3 -m http.server 8000

# Node.js ile
npx serve

# VS Code Live Server eklentisi ile
# index.html'e sağ tıklayıp "Open with Live Server" seçin
```

4. Tarayıcıda `http://localhost:8000` adresine gidin

### Telefona Yükleme (PWA)

1. Uygulamayı tarayıcıda açın
2. **iPhone**: Safari'de "Paylaş" → "Ana Ekrana Ekle"
3. **Android**: Chrome'da menü (⋮) → "Ana ekrana ekle" veya "Uygulamayı yükle"

## 💾 Veri Aktarımı (Cihaz Değişikliği)

### Verileri Dışa Aktarma
1. "📦 Veri Yönetimi" bölümüne gidin
2. "📤 Dışa Aktar" butonuna tıklayın
3. JSON dosyası indirilecek

### Verileri İçe Aktarma
1. Yeni cihazda uygulamayı açın
2. "📦 Veri Yönetimi" bölümüne gidin
3. "📥 İçe Aktar" butonuna tıklayın
4. Daha önce indirdiğiniz JSON dosyasını seçin
5. Verileri değiştirmek veya birleştirmek isteyip istemediğinizi seçin

## 🎯 Kullanım

### Günlük Check-in
- Her gün "✅ Bugün Dayanıyorum!" butonuna tıklayın
- Başarısız olduysanız "😔 Bugün Başarısız Oldum" butonunu kullanın

### Not Ekleme
- "📝 Günlük Notlar" bölümündeki "+ Ekle" butonuna tıklayın
- Ruh halinizi seçin (😢 → 😄)
- Not yazın
- Tetikleyicileri virgülle ayırarak ekleyin (örn: "stres, yalnızlık, sıkıntı")

## 📁 Dosya Yapısı

```
Chain Breaker/
├── index.html      # Ana HTML dosyası
├── styles.css      # Stil dosyası
├── app.js          # Ana uygulama JavaScript'i
├── sw.js           # Service Worker (PWA/Çevrimdışı)
├── manifest.json   # PWA manifest dosyası
├── icons/          # Uygulama ikonları
│   ├── icon.svg
│   ├── generate-icons.html
│   └── icon-*.png
└── README.md       # Bu dosya
```

## 🛠️ İkon Oluşturma

İkonları oluşturmak için:
1. `icons/generate-icons.html` dosyasını tarayıcıda açın
2. "Tüm İkonları İndir" butonuna tıklayın
3. İndirilen PNG dosyalarını `icons/` klasörüne koyun

## 🔒 Gizlilik

- Tüm veriler **yalnızca cihazınızda** saklanır (localStorage)
- Hiçbir veri sunucuya gönderilmez
- Verileriniz tamamen size aittir

## 💡 İpuçları

- Her gün aynı saatte check-in yapmayı alışkanlık haline getirin
- Tetikleyicilerinizi not edin, böylece zaman içinde örüntüleri görebilirsiniz
- Düzenli yedekleme yapın (Dışa Aktar)
- Motivasyon sözlerini okumak için 🔄 butonuna tıklayın

## 🚀 Gelecek Özellikler

- [ ] Hatırlatma bildirimleri
- [ ] Çoklu alışkanlık takibi
- [ ] Grafikler ve istatistikler
- [ ] Bulut senkronizasyonu
- [ ] Topluluk desteği

## 📜 Lisans

MIT Lisansı - İstediğiniz gibi kullanabilirsiniz!

---

**Sen yapabilirsin! 💪**
