Açıklama
Uygulamanın veritabanı Render.com üzerinden deploy edilmiş durumda. Uzun süre kullanılmadığı zaman bu deployu bekleme moduna alınabiliyor. O nedenle ilk kayıt / giriş işlemi yaptıktan sonra birkaç saniye beklemek gerekebiliyor.
Git’te “Lokal” ve “APK” olmak üzere iki klasör var:
-	Lokal: Lokal veritabanı ile çalışıyor. Backend kaynak koduna buradan erişilebilir. Index.js çalıştırıldığı zaman backend çalışıyor.
-	APK: APK’nın derlendiği kaynak kodlar. Lokalden tek farkı local veritabanı yerine Render’daki veritabanına erişiyor. Kullandığı backend lokal ile birebir aynı olsa da yine de görmek isterseniz şu repoda:

Render Backend Repo’su: https://github.com/ss-ust/task-manager-backend
