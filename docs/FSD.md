# مواصفات وظيفية (FSD) — مشروع IPTV

## لمحة عامة
نظام لإدارة بث القنوات والمباريات عبر M3U وXtream Codes، يتضمن:
- واجهة مستخدم مجانية لعرض القنوات والمباريات والبحث وإدارة المفضلات.
- لوحة تحكم للمسؤول لإدارة المستخدمين، اشتراكاتهم، مصادر M3U/Xtream، القنوات، التصنيفات، المباريات والإحصاءات.

## المستخدمون والأدوار
- ROLE_USER: مستخدم عادي (free أو مدفوع).
- ROLE_ADMIN: مسؤول لوحة التحكم.

## الميزات الأساسية
1. للمستخدمين (واجهة عامة مجانية):
   - مشاهدة القنوات الحيّة والبث.
   - البحث عن القنوات.
   - إدارة قائمة المفضلة.
   - عرض معلومات المباريات (التي تم ربطها بقناة أو stream).

2. لوحة تحكم المسؤول:
   - إضافة/تعديل/حذف المستخدمين وإدارة اشتراكاتهم.
   - إدخال بيانات اشتراك M3U أو Xtream Codes (مصادر).
   - إضافة أو تحديث روابط M3U أو Xtream واستجلاب/تحديث القنوات تلقائياً.
   - إدارة القنوات والتصنيفات.
   - إدارة المباريات والربط ببث قناة.
   - عرض إحصائيات المستخدمين (وقت المشاهدة، عدد المشاهدات، اشتراكات).

## نموذج قاعدة البيانات (مختصر)
- users(id, username, email, password_hash, role, created_at)
- subscriptions(id, user_id, type, source_m3u_id, source_xtream_id, start_at, end_at, active)
- m3u_sources(id, name, url, last_fetched_at)
- xtream_sources(id, name, host, port, username, password_encrypted)
- categories(id, name, parent_id)
- channels(id, source_type, source_id, source_channel_id, name, category_id, logo, metadata)
- streams(id, channel_id, url, quality, is_active)
- matches(id, home_team, away_team, start_time, status, channel_id)
- favorites(id, user_id, channel_id)
- user_stats(id, user_id, watch_minutes, last_seen_at)

## واجهات API أساسية (REST)
- POST /auth/login — تسجيل الدخول (يرجع JWT).
- POST /auth/register — تسجيل مستخدم جديد.
- GET /channels — قائمة القنوات مع فلترة بالتصنيف/مصدر.
- GET /channels/:id — تفاصيل القناة + البث المتاح.
- POST /users/:id/favorites — إضافة للقائمة.
- GET /admin/sources — إدارة المصادر (Admin).
- POST /admin/import/m3u — استيراد M3U من URL.

## مهام لاحقة مقترحة
- إضافة مصادقة JWT كاملة وعمليات refresh tokens.
- مكون لاستيراد M3U وفك الحزم وتحطيم القنوات تلقائياً.
- تكامل مع Xtream API لاستيراد القنوات/المباريات.
- واجهة واجهات أمامية (React/Next.js) وSPA.
- اختبارات وحدات وتكامُل.

