# Carmarket

CPM 1 / CPM 2 oyun içi araç pazarı. İlanlar herkese açık, paylaşımlı bir veritabanında (Cloudflare D1) tutulur — fotoğraflar da aynı veritabanında saklanır. Kurulumun hiçbir adımında kredi kartı istenmez.

## Kurulum (tamamı Cloudflare dashboard üzerinden, ücretsiz, kartsız)

### 1. D1 veritabanını oluştur
1. Cloudflare panelinde sol menüden **Storage & databases → D1 Database**'e git.
2. **Create Database** ile `carmarket-db` adında bir veritabanı oluştur.
3. Veritabanına gir, **Console** sekmesini aç, bu klasördeki `schema.sql` dosyasının içeriğini yapıştırıp çalıştır (tabloyu oluşturur).

### 2. Siteyi yükle
1. **Workers & Pages → Create application → Pages → Upload assets**.
2. Bu klasörün TAMAMINI (içindeki `functions` klasörü dahil) sürükle bırak.
3. Proje adını `carmarket` yap ve yükle.

### 3. Veritabanını projeye bağla (binding)
1. Oluşan Pages projesine gir → **Settings → Functions**.
2. **D1 database bindings** kısmına bir binding ekle: değişken adı tam olarak `DB`, veritabanı olarak `carmarket-db` seç.
3. **Deployments** sekmesinden en son deployment'ı **Retry deployment** ile yeniden dağıt (binding'in aktif olması için gerekli).

Bundan sonra site `carmarket.pages.dev` gibi bir adreste yayında olur ve herkesin eklediği ilanlar herkese görünür — hiçbir aşamada kart bilgisi istenmez.
