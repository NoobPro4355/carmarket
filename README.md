# Carmarket

CPM 1 / CPM 2 oyun içi araç pazarı. Cloudflare Workers (D1 veritabanı + statik dosya sunumu bir arada) üzerinde çalışır. Kurulumun hiçbir adımında kredi kartı istenmez.

## Kurulum

### 1. D1 veritabanını oluştur (eğer henüz yoksa)
1. Cloudflare panelinde **Storage & databases → D1 Database → Create Database**, adı `carmarket-db`.
2. Veritabanına gir, **Console** sekmesinde `schema.sql` dosyasının içeriğini çalıştır.
3. Aynı veritabanının **Overview** sayfasında görünen **Database ID**'yi kopyala.

### 2. wrangler.jsonc dosyasını tamamla
Bu klasördeki `wrangler.jsonc` dosyasını aç, içindeki `BURAYA_DATABASE_ID_YAPISTIR` yazan yeri 1. adımda kopyaladığın gerçek Database ID ile değiştir.

### 3. GitHub'a yükle
Bu klasördeki TÜM dosyaları (worker.js, wrangler.jsonc, index.html, app.js, styles.css, schema.sql, README.md) GitHub reponun köküne yükle/commit et. Eski `functions` klasörü varsa GitHub'dan sil (artık kullanılmıyor).

### 4. Cloudflare'i bağla / güncelle
- Proje zaten GitHub'a bağlıysa, bu commit otomatik yeni bir deployment tetikler. `wrangler.jsonc` içindeki D1 binding'i Cloudflare otomatik algılar, dashboard'da elle binding eklemene gerek kalmaz.
- Eğer proje hiç yoksa: Workers & Pages → Create application → Import a repository → GitHub reponu seç → deploy et.

Birkaç dakika içinde site adresi (`carmarket.<hesap-adın>.workers.dev`) üzerinden yayında olur ve herkesin eklediği ilanlar herkese görünür.
