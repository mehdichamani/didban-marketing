# استقرار Didban Marketing روی Cloudflare Workers

پیکربندی KV و فایل‌های پروژه در [wrangler.json](wrangler.json) از قبل تنظیم شده‌اند.

---

### ۱. ورود به کلودفلر (در صورت نیاز)
```bash
wrangler login
```

---

### ۲. تست محلی
```bash
wrangler dev
```
- صفحه اصلی: `http://localhost:8787/`
- کاتالوگ امنیتی: `http://localhost:8787/security`
- پنل ادمین: `http://localhost:8787/admin`

---

### ۳. تنظیم رمز پنل ادمین (Secret)
```bash
wrangler secret put ADMIN_PASSWORD
```

---

### ۴. دیپلوی نهایی روی ورکر
```bash
wrangler deploy
```
