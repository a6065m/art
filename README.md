# مشروع IPTV - مخطط قاعدة بيانات وواجهة API

هذا المستودع يحتوي على مخططات وقاعدة بداية لمشروع إدارة قنوات IPTV (M3U / Xtream) مع لوحة تحكم ومزايا للمستخدمين.

الملفات المضافة:
- docs/FSD.md — مواصفات وظيفية تفصيلية (بالعربية).
- db/schema.sql — SQL لإنشاء الجداول الأساسية (PostgreSQL).
- migrations/001-create-tables.sql — نفس SQL كمهاجرة.
- src/index.js — نقطة الدخول لتطبيق Express.
- src/models/index.js — تهيئة Sequelize والنماذج.
- src/models/*.js — نماذج أساسية (User, Subscription, Source, Channel, Category, Match, Stream, Favorite, UserStat).
- openapi.yaml — مواصفات API أساسية.
- .env.example — مثال متغيرات بيئة.

تشغيل محلي سريع:
1. انسخ .env.example إلى .env وعبّئ القيم.
2. npm install
3. إعداد قاعدة البيانات ثم تشغيل migration: psql < db/schema.sql
4. npm start

---

ملاحظات:
- اخترت استخدام Node.js + Express + Sequelize (PostgreSQL) لسهولة الانتشار والمرونة.
- هذا scaffold مبدئي: تحتاج إضافة التوثيق (JWT، hashing لكلمات المرور)، واختبارات، ونظام تحميل ملفات M3U وتجهيز Xtream.
