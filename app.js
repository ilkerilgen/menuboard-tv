/* Passenger / SiteGround giriş dosyası.
 * SiteGround Node uygulaması varsayılan olarak app.js'i başlatır; o da bulut sunucusunu yükler.
 * Sunucu process.env.PORT'u kullanır (Passenger bunu verir). */
require("./cloud/server.js");
