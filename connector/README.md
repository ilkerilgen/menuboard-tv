# MenuBoard Connector (ArtıPOS / POS PAYMENTS)

POS'ta **kiosk için seçilmiş** ürünleri (`variables.isVisibleOnKiosk = true`) okuyup standart
MenuBoard feed'ine çevirerek buluta **push** eden küçük ajan. Zincir:

```
[ArtıPOS/POS PAYMENTS :3001] → [connector] → [MenuBoard Cloud] → [Player]
```

Player POS'un dilini bilmez; tüm POS-özel mantık burada. (Bkz. `docs/PLATFORM-PLAN.md` §5.1 — CLOUD-FIRST.)

## Çalıştırma
Node 18+ gerekir. Cihaz önce panelden eşlenmeli (DEVICE_ID = eşli cihazın id'si).

```bash
DEVICE_ID=<eşli-cihaz-id> \
POS_BASE=http://localhost:3001 \
CLOUD_BASE=https://menubord.com.tr \
node connector.js
```

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `DEVICE_ID` | — (zorunlu) | Push yapılacak eşli cihaz |
| `POS_BASE` | `http://localhost:3001` | ArtıPOS/POS PAYMENTS API |
| `CLOUD_BASE` | `http://localhost:4000` | MenuBoard Cloud |
| `INTERVAL_MS` | `30000` | Tazeleme aralığı |
| `POS_TOKEN` | — | Gerekirse Bearer token (LAN'da genelde gerekmez) |

## Eşleme
- `name` / `pricing.basePrice.price` / `description` / `unit` / `category` / `order` alanları okunur.
- Ürünler kategoriye göre gruplanır; birim `kg→KG`, ikon kategori adına göre seçilir.
- `variables.isVisibleOnKiosk=false` olanlar **dışlanır**.

## Test (gerçek POS olmadan)
```bash
node mock-pos.js            # :3001'de sahte ArtıPOS
# başka terminalde:
DEVICE_ID=<id> node connector.js
```

## Yapılacak (sonra)
- Öne çıkan (featured) ürünleri görsel + rozetle map etmek (favoriler).
- Şube/çoklu-cihaz: tek cihaz yerine "işletme" bazlı push.
- ArtıPOS auth (gerekirse device token).
