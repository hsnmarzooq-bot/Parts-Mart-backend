# Parts Mart — الخادم الخلفي (Backend)

خادم API حقيقي وبسيط، **بدون أي مكتبات خارجية** (لا يحتاج `npm install`) — يعمل مباشرة بأمر واحد.

## التشغيل

```bash
node server.js
```

سيعمل على: `http://localhost:3001`

البيانات تُحفظ في ملف `db.json` بجانب الخادم (يُقرأ ويُكتب في كل عملية). هذا حل بسيط للمرحلة الحالية — **يجب استبداله بقاعدة بيانات حقيقية (PostgreSQL أو MySQL) قبل الإطلاق الفعلي**، لأن ملف JSON لا يتحمل عددًا كبيرًا من المستخدمين المتزامنين.

## نقاط النهاية (API Endpoints)

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/api/parts?partName=&carMake=&carModel=&year=&partNumber=&lang=ar` | بحث عن القطع (يدعم الأسماء البديلة ومطابقة تقريبية) |
| POST | `/api/parts` | إضافة قطعة جديدة (الإدارة) |
| GET | `/api/suppliers` | قائمة الموردين |
| POST | `/api/suppliers` | إنشاء حساب مورد (الإدارة فقط) |
| POST | `/api/customers` | تسجيل عميل جديد |
| GET | `/api/customers` | قائمة العملاء (الإدارة) |
| POST | `/api/orders` | إنشاء طلب جديد |
| GET | `/api/orders` | كل الطلبات |
| PATCH | `/api/orders/:id` | تحديث حالة الطلب، مثال body: `{"stage": 2}` |
| POST | `/api/part-requests` | تسجيل طلب قطعة غير متوفرة |
| GET | `/api/part-requests` | قائمة طلبات القطع الناقصة |
| PATCH | `/api/part-requests/:id` | تحديد الطلب كمتوفر، body: `{"fulfilled": true}` |
| POST | `/api/ai/parse-voice` | تحليل نص البحث الصوتي بالذكاء الاصطناعي (انظر أدناه) |

## البحث الصوتي بالذكاء الاصطناعي — الآن على الخادم وليس المتصفح

في النموذج التجريبي كان استدعاء الذكاء الاصطناعي يتم من المتصفح مباشرة، وهذا غير آمن لأن أي شخص يمكنه رؤية طريقة الاستدعاء. الآن أصبح على الخادم:

1. أنشئ مفتاح API من https://console.anthropic.com
2. شغّل الخادم مع المفتاح:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-xxxxx node server.js
   ```
3. الواجهة (Frontend) ترسل النص المسموع فقط إلى:
   ```
   POST /api/ai/parse-voice
   Body: { "transcript": "أبغى فحمات فرامل تويوتا كامري 2020" }
   ```
   والخادم يرد بـ: `{ "partName": "...", "carMake": "...", "carModel": "...", "year": "...", "partNumber": "..." }`

## ربط الواجهة (React) بهذا الخادم

في ملف الواجهة، استبدل التعامل مع `useState` المحلي باستدعاءات `fetch` لهذه النقاط. مثال:

```js
// بدل: setParts(INITIAL_PARTS)
useEffect(() => {
  fetch(`http://localhost:3001/api/parts?lang=${lang}`)
    .then(res => res.json())
    .then(setParts);
}, [lang]);
```

## الخطوات التالية قبل الإطلاق الحقيقي

1. **استبدال db.json بقاعدة بيانات حقيقية** (PostgreSQL موصى بها).
2. **إضافة مصادقة حقيقية** (تسجيل دخول بكلمة مرور أو رمز SMS)، خصوصًا لحماية نقاط الإدارة (`POST /api/suppliers`, `POST /api/parts`, إلخ) — حالياً أي شخص يستطيع استدعاءها.
3. **رفع الصور الفعلي**: إضافة نقطة `POST /api/upload` تستقبل الصورة وتخزنها (محليًا أو في خدمة مثل S3) بدل base64.
4. **استضافة الخادم** على منصة مثل Railway أو Render أو VPS، بدل تشغيله محليًا.
5. **بوابة دفع إلكتروني حقيقية** عند تفعيل الدفع.
