# Weekly Menu API Reference

Use this reference for the weekly menu system endpoints. All mutating endpoints return:

```json
{ "ok": true, "data": { ... } }
```

Errors return:

```json
{ "ok": false, "error": { "code": "...", "message": "...", "details": { ... } } }
```

---

## Public

### GET `/api/menu/weekly/current`
Returns the currently published weekly menu grouped by day.

**Response**
```json
{
  "ok": true,
  "data": {
    "menu": {
      "id": "uuid",
      "week_start_date": "2025-01-05",
      "order_deadline": "2025-01-08T07:59:59.999Z",
      "delivery_date": "2025-01-11",
      "template": { "name": "Traditional Week" },
      "day_menus": [
        {
          "dayOfWeek": 0,
          "dayName": "Sunday",
          "dishes": [
            { "id": "uuid", "meal_position": 1, "dish": { "name": "Mohinga" } }
          ]
        }
      ]
    }
  }
}
```

---

## Customer

### POST `/api/orders/weekly`
Creates a weekly order and Stripe PaymentIntent.

**Request**
```json
{
  "weekly_menu_id": "uuid",
  "package_id": "uuid",
  "delivery_address_id": "uuid",
  "delivery_window": "12 PM - 4 PM",
  "delivery_instructions": "Leave at the front desk"
}
```

**Response**
```json
{
  "ok": true,
  "data": {
    "order": { "id": "uuid", "status": "pending" },
    "client_secret": "pi_123_secret_abc"
  }
}
```

### POST `/api/orders/weekly/cancel`
Cancels a pending weekly order (only before driver assignment).

**Request**
```json
{ "order_id": "uuid" }
```

---

## Admin

### POST `/api/admin/menu-templates/with-dishes`
Creates a menu template and its 7×3 dish grid in one call.

**Request**
```json
{
  "name": "Traditional Mandalay Week",
  "theme": "traditional",
  "dishes": [
    { "dish_id": "uuid", "day_of_week": 0, "meal_position": 1 }
  ]
}
```

### POST `/api/admin/menus/generate`
Generates a weekly menu from a template.

**Request**
```json
{ "template_id": "uuid", "week_start_date": "2025-01-05" }
```

### POST `/api/admin/menus/status`
Updates weekly menu status (`draft`, `published`, etc.). Publishes notification emails.

**Request**
```json
{ "weekly_menu_id": "uuid", "status": "published" }
```

### POST `/api/admin/weekly-orders/update`
Assigns a driver and/or updates status.

**Request**
```json
{
  "weekly_order_id": "uuid",
  "status": "out_for_delivery",
  "driver_id": "uuid"
}
```

---

## Cron (requires `CRON_SECRET`)

### POST `/api/cron/weekly-orders/cleanup`
Cancels pending orders older than 1 hour.

### POST `/api/cron/weekly-orders/reconcile`
Reconciles pending orders against Stripe PaymentIntents.

### POST `/api/cron/weekly-orders/reminders`
Sends delivery reminders 24 hours before delivery.
