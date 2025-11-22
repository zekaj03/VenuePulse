# Stripe Integration Setup Guide

Diese Anleitung hilft Ihnen, Stripe in VenuePulse zu integrieren, um Premium-Abonnements zu ermöglichen.

## Voraussetzungen

- Ein Stripe-Konto (kostenlos unter [stripe.com](https://stripe.com) erstellen)
- Node.js und npm installiert
- VenuePulse-Projekt bereits eingerichtet

## Schritt 1: Stripe-Konto einrichten

1. **Stripe-Konto erstellen**
   - Besuchen Sie [stripe.com](https://stripe.com)
   - Registrieren Sie sich für ein kostenloses Konto
   - Verifizieren Sie Ihre E-Mail-Adresse

2. **API-Keys abrufen**
   - Gehen Sie zu [Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
   - Kopieren Sie den **Publishable Key** (beginnt mit `pk_test_...`)
   - Kopieren Sie den **Secret Key** (beginnt mit `sk_test_...`)
   - ⚠️ **WICHTIG**: Teilen Sie niemals Ihren Secret Key öffentlich!

## Schritt 2: Produkt und Preis erstellen

1. **Premium-Produkt erstellen**
   - Gehen Sie zu [Dashboard → Products](https://dashboard.stripe.com/products)
   - Klicken Sie auf "Add product"
   - Name: `VenuePulse Premium`
   - Beschreibung: `Premium subscription for VenuePulse`

2. **Preis einrichten**
   - Pricing model: `Recurring`
   - Price: `12.00 CHF`
   - Billing period: `Monthly`
   - Klicken Sie auf "Save product"
   - Kopieren Sie die **Price ID** (beginnt mit `price_...`)

## Schritt 3: Umgebungsvariablen konfigurieren

### Backend (.env)

1. Kopieren Sie `.env.example` zu `.env`:
   ```bash
   cp .env.example .env
   ```

2. Bearbeiten Sie `.env` und fügen Sie Ihre Stripe-Keys ein:
   ```env
   STRIPE_SECRET_KEY=sk_test_IHR_SECRET_KEY
   STRIPE_PUBLISHABLE_KEY=pk_test_IHR_PUBLISHABLE_KEY
   STRIPE_PREMIUM_PRICE_ID=price_IHR_PRICE_ID
   STRIPE_WEBHOOK_SECRET=whsec_IHR_WEBHOOK_SECRET

   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

### Frontend (.env.local)

1. Erstellen Sie `.env.local` basierend auf `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Bearbeiten Sie `.env.local`:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_IHR_PUBLISHABLE_KEY
   VITE_STRIPE_PREMIUM_PRICE_ID=price_IHR_PRICE_ID
   VITE_API_URL=http://localhost:3001
   ```

## Schritt 4: Webhook einrichten

Webhooks ermöglichen es Stripe, Ihre Anwendung über erfolgreiche Zahlungen zu informieren.

### Lokale Entwicklung (mit Stripe CLI)

1. **Stripe CLI installieren**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (mit Scoop)
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe

   # Linux
   # Siehe: https://stripe.com/docs/stripe-cli
   ```

2. **CLI authentifizieren**
   ```bash
   stripe login
   ```

3. **Webhook forwarding starten**
   ```bash
   stripe listen --forward-to localhost:3001/webhook
   ```

4. Kopieren Sie den **Webhook Signing Secret** (beginnt mit `whsec_...`) in Ihre `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_IHR_WEBHOOK_SECRET
   ```

### Produktion (Stripe Dashboard)

1. Gehen Sie zu [Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Klicken Sie auf "Add endpoint"
3. Endpoint URL: `https://ihre-domain.com/webhook`
4. Events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Kopieren Sie den **Signing secret** in Ihre Produktions-Umgebungsvariablen

## Schritt 5: Anwendung starten

### Beide Server gleichzeitig starten

```bash
npm start
```

Dies startet:
- **Frontend** auf `http://localhost:5173`
- **Backend** auf `http://localhost:3001`

### Oder separat starten

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server
```

**Terminal 3 - Stripe Webhooks (optional, nur für lokale Entwicklung):**
```bash
stripe listen --forward-to localhost:3001/webhook
```

## Schritt 6: Testen

### Test-Kreditkarten

Stripe stellt Test-Kreditkarten bereit:

- **Erfolgreiche Zahlung**: `4242 4242 4242 4242`
- **Abgelehnte Zahlung**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Verwenden Sie:
- Beliebiges zukünftiges Ablaufdatum (z.B. `12/34`)
- Beliebige 3-stellige CVC (z.B. `123`)
- Beliebige PLZ (z.B. `12345`)

### Zahlungsablauf testen

1. Öffnen Sie `http://localhost:5173`
2. Klicken Sie auf das Abonnement-Symbol
3. Wählen Sie eine Zahlungsmethode
4. Verwenden Sie eine Test-Kreditkarte
5. Bestätigen Sie die Zahlung
6. Sie werden zurück zur App weitergeleitet
7. Premium sollte jetzt aktiviert sein!

## API-Endpunkte

Der Backend-Server stellt folgende Endpunkte bereit:

- `POST /api/create-checkout-session` - Erstellt eine Checkout-Session
- `POST /api/create-payment-intent` - Erstellt einen Payment Intent
- `GET /api/subscription/:customerId` - Ruft Abonnementstatus ab
- `POST /api/cancel-subscription` - Kündigt ein Abonnement
- `POST /webhook` - Webhook-Endpunkt für Stripe-Events
- `GET /health` - Health-Check-Endpunkt

## Sicherheitshinweise

⚠️ **WICHTIG:**

1. **Niemals den Secret Key im Frontend verwenden!**
   - Der Secret Key darf nur im Backend verwendet werden
   - Verwenden Sie im Frontend nur den Publishable Key

2. **Umgebungsvariablen schützen**
   - `.env` ist bereits in `.gitignore` enthalten
   - Committen Sie **niemals** `.env` oder Ihre API-Keys

3. **HTTPS in Produktion**
   - Verwenden Sie in Produktion immer HTTPS
   - Stripe lehnt Webhook-Lieferungen an HTTP-Endpunkte ab

4. **Webhook-Signaturen verifizieren**
   - Der Code verifiziert bereits Webhook-Signaturen
   - Entfernen Sie diese Verifizierung nicht!

## Von Test zu Produktion wechseln

1. **Live-API-Keys abrufen**
   - Aktivieren Sie Ihr Stripe-Konto vollständig
   - Gehen Sie zu [Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
   - Wechseln Sie von "Test mode" zu "Live mode"
   - Kopieren Sie die Live-Keys (`pk_live_...` und `sk_live_...`)

2. **Live-Produkt erstellen**
   - Erstellen Sie das Produkt erneut im Live-Modus
   - Notieren Sie die neue Live Price ID

3. **Produktions-Umgebungsvariablen aktualisieren**
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_PREMIUM_PRICE_ID=price_live_...
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   NODE_ENV=production
   FRONTEND_URL=https://ihre-domain.com
   ```

4. **Webhook-Endpunkt registrieren**
   - Fügen Sie Ihren Produktions-Webhook-Endpunkt im Dashboard hinzu
   - Verwenden Sie den neuen Signing Secret

## Fehlerbehebung

### "Stripe failed to load"
- Überprüfen Sie, ob `VITE_STRIPE_PUBLISHABLE_KEY` in `.env.local` gesetzt ist
- Stellen Sie sicher, dass Sie den Frontend-Dev-Server neu gestartet haben

### "Failed to create checkout session"
- Überprüfen Sie, ob der Backend-Server läuft (`http://localhost:3001/health`)
- Verifizieren Sie, dass `STRIPE_SECRET_KEY` in `.env` korrekt ist
- Prüfen Sie die Browser-Konsole und Server-Logs auf Fehler

### "Webhook signature verification failed"
- Stellen Sie sicher, dass `STRIPE_WEBHOOK_SECRET` korrekt ist
- Verwenden Sie den Secret vom `stripe listen`-Befehl für die lokale Entwicklung
- Verwenden Sie den Dashboard-Secret für die Produktion

### CORS-Fehler
- Überprüfen Sie, dass `FRONTEND_URL` in `.env` korrekt gesetzt ist
- Standard ist `http://localhost:5173`

## Weitere Ressourcen

- [Stripe Dokumentation](https://stripe.com/docs)
- [Stripe API Referenz](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

## Support

Bei Problemen:
1. Überprüfen Sie die Stripe-Logs im [Dashboard](https://dashboard.stripe.com/logs)
2. Sehen Sie sich die Browser-Konsole an
3. Prüfen Sie die Server-Logs
4. Konsultieren Sie die Stripe-Dokumentation

---

**Viel Erfolg mit Ihrer Stripe-Integration! 🚀**
