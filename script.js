document.addEventListener('DOMContentLoaded', () => {
    const dictionaryBody = document.getElementById('dictionaryBody');
    const searchInput = document.getElementById('searchInput');
    const errorDisplay = document.getElementById('errorDisplay');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const loadingMessage = document.getElementById('loadingMessage');

    const sourceHtmlFile = 'fff.html'; // Kaynak HTML dosyasının adı
    let allDictionaryEntries = []; // Tüm sözlük girdilerini saklamak için global dizi

    async function fetchAndParseDictionary() {
        loadingMessage.style.display = 'block';
        errorDisplay.style.display = 'none';
        dictionaryBody.innerHTML = ''; // Tabloyu temizle

        try {
            const response = await fetch(sourceHtmlFile);
            if (!response.ok) {
                throw new Error(`'${sourceHtmlFile}' dosyası yüklenemedi. HTTP Durumu: ${response.status} ${response.statusText}. Tarayıcı konsolunu kontrol edin. Eğer 'file://' protokolü ile çalışıyorsanız, CORS hatası alabilirsiniz. Yerel bir web sunucusu kullanmayı deneyin.`);
            }
            const htmlText = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            
            const table = doc.querySelector('table');
            if (!table) {
                throw new Error(`'${sourceHtmlFile}' dosyası içinde <table> etiketi bulunamadı.`);
            }

            // thead içindeki satırları say (varsa) veya ilk satırı başlık kabul et
            let dataRowStartIndex = 0;
            const thead = table.querySelector('thead');
            if (thead && thead.querySelectorAll('tr').length > 0) {
                dataRowStartIndex = thead.querySelectorAll('tr').length;
            } else if (table.querySelectorAll('tr').length > 0 && table.querySelectorAll('tr')[0].querySelector('th')) {
                dataRowStartIndex = 1; // İlk satır th içeriyorsa başlık kabul et
            }


            const rows = Array.from(table.querySelectorAll('tr')).slice(dataRowStartIndex); // Başlık satır(lar)ını atla
            
            allDictionaryEntries = []; // Diziyi her yüklemede sıfırla

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) { // En az 2 hücre olmalı
                    const word = cells[0].textContent.trim();
                    const meaning = cells[1].textContent.trim();
                    if (word) { // Kelime boş olmamalı
                        allDictionaryEntries.push({ kelime: word, anlam: meaning });
                    }
                }
            });

            if (allDictionaryEntries.length === 0 && rows.length > 0) {
                 console.warn(`'${sourceHtmlFile}' dosyasındaki tablodan geçerli veri okunamadı. Tablo yapısını kontrol edin.`);
                 displayEntries([]); // Tabloyu boş göster ama yükleme mesajını kaldır
            } else if (allDictionaryEntries.length === 0 && rows.length === 0) {
                 console.warn(`'${sourceHtmlFile}' dosyasındaki tablo boş veya veri satırı içermiyor.`);
                 displayEntries([]);
            } else {
                displayEntries(allDictionaryEntries); // Tüm girdileri başlangıçta göster
            }

        } catch (error) {
            console.error("Sözlük verisi yüklenirken hata:", error);
            errorDisplay.textContent = error.message;
            errorDisplay.style.display = 'block';
            allDictionaryEntries = []; // Hata durumunda girdileri temizle
        } finally {
            loadingMessage.style.display = 'none'; // Her durumda yükleme mesajını kaldır
        }
    }

    function displayEntries(entries) {
        dictionaryBody.innerHTML = ''; // Önceki girdileri temizle
        noResultsMessage.style.display = 'none';

        if (entries.length === 0) {
            if (searchInput.value.trim() !== '' || allDictionaryEntries.length > 0) {
                // Arama yapıldı ve sonuç yoksa VEYA genel veri var ama filtrelenmiş sonuç yoksa
                noResultsMessage.style.display = 'block';
            } else if (allDictionaryEntries.length === 0 && errorDisplay.style.display === 'none') {
                // Hiç veri yüklenmediyse (ve hata mesajı da yoksa, ki bu zor bir durum)
                // ya da fff.html'den veri okunamadıysa
                dictionaryBody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#777;">Sözlükte gösterilecek veri bulunamadı veya kaynak dosya hatalı.</td></tr>';
            }
            return;
        }

        entries.forEach(entry => {
            const row = dictionaryBody.insertRow();
            const cellKelime = row.insertCell();
            const cellAnlam = row.insertCell();
            cellKelime.textContent = entry.kelime;
            cellAnlam.textContent = entry.anlam;
        });
    }

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        
        if (allDictionaryEntries.length === 0 && errorDisplay.style.display !== 'none') {
             // Veri yüklenememişse arama yapma
            return;
        }

        const filteredEntries = allDictionaryEntries.filter(entry => {
            return entry.kelime.toLowerCase().includes(query) || 
                   entry.anlam.toLowerCase().includes(query);
        });
        displayEntries(filteredEntries);
    });

    // Sayfa yüklendiğinde sözlük verilerini çek
    fetchAndParseDictionary();
});