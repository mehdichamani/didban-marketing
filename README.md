# راهنمای استقرار Didban Marketing روی Cloudflare Workers

تمام فایل‌های مورد نیاز شامل پیکربندی `wrangler.json`، فایل سرور `worker.js` و وابستگی‌های پروژه ساخته شده‌اند.

---

### ۱. ساخت KV Namespace برای ذخیره فرم‌های دمو

از آنجا که فرم ثبت دمو (`/api/demo`) و پنل مدیریت (`/admin`) اطلاعات را در Cloudflare KV ذخیره می‌کنند، یک Namespace بسازید:

```bash
bun x wrangler kv namespace create DEMO_KV
```

خروجی دستوری شبیه زیر به شما می‌دهد:
```json
{ binding = "DEMO_KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

شناسه تولید شده (`id`) را کپی کرده و در فایل [wrangler.json](file:///home/unreal/projects/didban-marketing/wrangler.json) جایگزین مقدار `"DEMO_KV_ID_PLACEHOLDER"` کنید:

```json
"kv_namespaces": [
  {
    "binding": "DEMO_KV",
    "id": "شناسه_دریافت_شده"
  }
]
```

*(اختیاری) اگر برای تست محلی هم نیاز به KV دارید:*
```bash
bun x wrangler kv:namespace create DEMO_KV --preview
```

---

### ۲. تنظیم رمز عبور پنل مدیریت (اختیاری)

رمز پیش‌فرض ادمین برای ورود به `/admin` برابر با `didban@admin123` قرار داده شده است.  
برای تغییر آن می‌توانید مقدار `"ADMIN_PASSWORD"` را در [wrangler.json](file:///home/unreal/projects/didban-marketing/wrangler.json) تغییر دهید یا به عنوان سکرت امن ست کنید:

```bash
bun x wrangler secret put ADMIN_PASSWORD
```

---

### ۳. ورود و احراز هویت در Cloudflare

اگر قبلاً با wrangler لاگین نکرده‌اید:

```bash
bun x wrangler login
```

---

### ۴. تست و اجرای محلی (Local Development)

برای مشاهده و تست عملکرد صفحات و API به صورت محلی:

```bash
bun run dev
# یا
bun x wrangler dev
```

سپس آدرس `http://localhost:8787` را باز کنید:
- صفحه اصلی: `http://localhost:8787/`
- کاتالوگ امنیتی: `http://localhost:8787/security`
- پنل مدیریت درخواست‌ها: `http://localhost:8787/admin`

---

### ۵. دیپلوی نهایی روی ورکر (Production Deploy)

```bash
bun run deploy
# یا
bun x wrangler deploy
```

پس از اجرای موفق، ورکر روی ساب‌دامین `workers.dev` یا دامنه سفارشی شما در دسترس خواهد بود.
