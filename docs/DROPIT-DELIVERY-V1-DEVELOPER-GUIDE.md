# Shievon Delivery (Dropit) — v1 Developer Guide

**For:** Customer Mobile App, Vendor Mobile App, Vendor Portal (Web)  
**Date:** 20 Aug 2026  
**API Base URL (dev):** `https://shievon.in/dev/api`  
**API Base URL (prod):** `https://shievon.in/api`  
**Auth:** All endpoints require `Authorization: Bearer <jwt>` unless noted.

---

## Table of Contents

1. [What is Dropit Delivery?](#1-what-is-dropit-delivery)
2. [What's in v1 and What's Not](#2-whats-in-v1-and-whats-not)
3. [Delivery Flow — End to End](#3-delivery-flow--end-to-end)
4. [Order Statuses & Fulfillment Statuses](#4-order-statuses--fulfillment-statuses)
5. [API Reference — Customer Mobile](#5-api-reference--customer-mobile)
6. [API Reference — Vendor Mobile & Portal](#6-api-reference--vendor-mobile--portal)
7. [API Reference — Shared (Order Read)](#7-api-reference--shared-order-read)
8. [Live Rider Tracking](#8-live-rider-tracking)
9. [Push Notifications](#9-push-notifications)
10. [UI/UX Guidelines Per Client](#10-uiux-guidelines-per-client)
11. [Dropit Operating Hours & Serviceability](#11-dropit-operating-hours--serviceability)

---

## 1. What is Dropit Delivery?

Dropit is a third-party courier service. When a customer places an order for physical products, Shievon can dispatch a Dropit rider to pick up from the vendor's shop and deliver to the customer's address.

The customer pays a **delivery fee** at checkout. The server handles all communication with Dropit — **no client app calls Dropit directly**.

---

## 2. What's in v1 and What's Not

### Included in v1

| Feature | Details |
|---|---|
| **Delivery for products** | Physical product orders only |
| **Delivery only** (no customer pickup choice) | When delivery is available, it is the fulfillment mode. Pickup remains for non-delivery areas |
| **Single-shop orders** | One order = one shop = one delivery |
| **Delivery fee** | Dropit live fare estimate + 20% margin, shown as a single total (raw estimate hidden) |
| **Fare stability** | Customer pays the checkout amount only — Shievon absorbs any fare change at booking time |
| **Wallet payment to Dropit** | Shievon's prefunded Dropit wallet is debited (customer already paid via Razorpay) |
| **10-minute dispatch delay** | After vendor marks items ready, system waits 10 min then books Dropit |
| **3 auto-retries** | If no rider found, system retries 3 times back-to-back |
| **Abort handling** | After 3 failures, order stays open — customer sees "Contact Shievon" |
| **Cancellation rules** | Before booking: full refund. After booking but before pickup: cancel + refund delivery fee. After pickup: ops-only |
| **Live tracking** | Order status + rider name/phone + vehicle number + **live map pin** (`pilot_location`) when Dropit sends `OrderTracking` webhooks |
| **Push notifications** | Rider assigned, out for delivery, delivered, failed/aborted |
| **Vehicle type** | Bike (2 Wheeler) only |
| **Address requirement** | Customer must provide lat/lng (map pin) for delivery |
| **Serviceability check** | Block checkout if pickup or drop location is outside Dropit service area |
| **Operating hours** | Dropit operates 08:00 AM – 08:00 PM |
| **No OTPs** | Pickup/drop OTPs are **not** sent to Dropit or shown to clients in v1 |

### Excluded from v1 (deferred to v2)

| Feature | Reason |
|---|---|
| Customer choosing pickup vs delivery | v1 is delivery-only when available |
| Multi-shop cart with delivery | One delivery = one shop only |
| Scheduled delivery (customer picks a time slot) | Dropit supports it, but deferred |
| COD (Cash on Delivery) | Not in this phase |
| OTPs (pickup/drop verification codes) | Disabled for v1 — not generated, not sent to Dropit |
| WebSocket / push of location ticks | Clients poll order read APIs for `pilot_location` (no dedicated live-location socket in v1) |
| Return delivery | Full return flow with Dropit (customer-initiated, RTO, wrong item) |
| Return fee charging | New Dropit estimate + 20% at return request time |
| Admin edge-case console | Manual retry / cancel for stuck deliveries |
| Customer reprice flow | If fare rises beyond 20% margin, Shievon absorbs (no second payment) |
| Service delivery | Services remain appointment-based (no courier) |
| Auto-pickup vehicle selection by weight | Always Bike in v1 |

---

## 3. Delivery Flow — End to End

```
CUSTOMER                        SERVER                          VENDOR                    DROPIT
   |                              |                               |                        |
   |-- POST checkout/verify ----->|                               |                        |
   |   (fulfillment_mode=delivery)|                               |                        |
   |                              |-- serviceability check ------>|                        |-->
   |                              |-- fare estimate ------------->|                        |-->
   |<-- delivery_available, fee --|                               |                        |
   |                              |                               |                        |
   |-- POST /orders ------------>|                               |                        |
   |   (fulfillment_mode=delivery)|                               |                        |
   |                              |-- re-estimate fare           |                        |
   |                              |-- create order (DB)          |                        |
   |<-- order (status=pending) ---|                               |                        |
   |                              |                               |                        |
   |-- POST /orders/payment ----->| (Razorpay pay)               |                        |
   |<-- order (status=processing)-|--- push to vendor ---------->|                        |
   |                              |                               |                        |
   |                              |   Vendor packs items          |                        |
   |                              |<-- POST mark-ready ----------|                        |
   |                              |                               |                        |
   |                              |   (10 min delay)              |                        |
   |                              |-- create Dropit order ------->|----------------------->|
   |                              |<-- OrderCreated webhook ------|<-----------------------|
   |                              |                               |                        |
   |                              |<-- OrderAccepted webhook -----|                        |
   |<-- push: rider assigned   ---|                               |<-- push: rider assigned|
   |                              |                               |                        |
   |                              |<-- OrderTracking (lat/lng) ---|  (every few seconds)   |
   |  poll order → pilot_location|                               |                        |
   |                              |                               |                        |
   |                              |<-- InProgress -- webhook -----|                        |
   |<-- push: out for delivery ---|                               |                        |
   |                              |                               |                        |
   |                              |<-- Completed --- webhook -----|                        |
   |<-- push: delivered        ---|                               |<-- push: delivered     |
   |                              |   order → completed           |                        |
```

---

## 4. Order Statuses & Fulfillment Statuses

### Order-level statuses (`order.status`)

| Status | Meaning | Who triggers |
|---|---|---|
| `pending` | Order placed, awaiting payment | System |
| `processing` | Paid, vendor preparing | System (on payment) |
| `ready-for-pickup` | All product lines ready (pickup orders) | System (on mark-ready) |
| `ready-for-delivery` | All product lines ready, Dropit dispatch pending/active | System (on mark-ready for delivery orders) |
| `out-for-delivery` | Rider has picked up, en route to customer | System (Dropit webhook) |
| `completed` | Delivered or picked up | System (Dropit webhook or vendor close) |
| `cancelled` | Cancelled | Customer/Admin |

### Product line fulfillment statuses (`product_fulfillment.lines[].fulfillment_status`)

| Status | Meaning |
|---|---|
| `preparing` | Vendor is preparing the item |
| `ready_for_pickup` | Ready for customer self-pickup |
| `ready_for_delivery` | Ready, Dropit dispatch scheduled (delivery orders) |
| `rider_requested` | Dropit order created, searching for rider |
| `rider_assigned` | Rider found and assigned |
| `out_for_delivery` | Rider picked up, delivering |
| `delivered` | Successfully delivered to customer |
| `delivery_failed` | Dropit failed after 3 retries |
| `picked_up` | Customer self-pickup confirmed |
| `unable_to_fulfill` | Vendor cannot fulfill this line |

### Delivery shipment statuses (`order.deliveries[].shipment_status`)

| Status | Meaning |
|---|---|
| `pending_dispatch` | Waiting for 10-min delay to pass |
| `pending` | Dropit order created, searching for rider |
| `accepted` | Rider assigned |
| `in_progress` | Rider picked up, delivering |
| `completed` | Delivered |
| `cancelled` | Cancelled (by system or admin) |
| `aborted` | No rider after 3 retries |
| `fallback_pickup` | Reverted to customer pickup |

### Fulfillment mode (`order.fulfillment_mode`)

| Value | Meaning |
|---|---|
| `pickup` | Customer self-pickup (default, existing behavior) |
| `delivery` | Dropit delivery |

---

## 5. API Reference — Customer Mobile

### 5.1 Verify Checkout (with delivery check)

Check if delivery is available and get the fare before placing the order.

```
POST /orders/checkout/verify
```

**Request:**

```json
{
  "amount": 1500,
  "products": [
    {
      "product_id": "uuid-of-product",
      "order_quantity": 2
    }
  ],
  "fulfillment_mode": "delivery",
  "shipping_address": {
    "street_address": "12 SG Highway",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "zip": "380054",
    "country": "India"
  },
  "customer_id": "uuid-of-customer"
}
```

**Key fields:**

- `fulfillment_mode`: Send `"delivery"` to check delivery availability. Omit or send `"pickup"` for pickup-only check.
- `shipping_address`: Required for delivery — must include coordinates on the address record (lat/lng from map pin).

**Response (delivery available):**

```json
{
  "total_tax": 0,
  "shipping_charge": 51.52,
  "unavailable_products": [],
  "unavailable_services": [],
  "wallet_currency": 0,
  "wallet_amount": 0,
  "delivery_available": true,
  "delivery_unavailable_reason": null,
  "delivery_legs": [
    {
      "shop_id": 5,
      "shop_name": "Fashion Store",
      "estimated_fare": 51.52,
      "distance_km": 2.19,
      "estimated_duration_min": 10,
      "goods_types": ["Clothing"],
      "vehicle_type_id": "2_Wheeler_t_Bike_b"
    }
  ],
  "fulfillment_modes_available": ["pickup", "delivery"]
}
```

**Response (delivery NOT available):**

```json
{
  "total_tax": 0,
  "shipping_charge": 0,
  "unavailable_products": [],
  "unavailable_services": [],
  "wallet_currency": 0,
  "wallet_amount": 0,
  "delivery_available": false,
  "delivery_unavailable_reason": "Delivery address is outside the serviceable area",
  "delivery_legs": [],
  "fulfillment_modes_available": ["pickup"]
}
```

**Important notes:**

- `shipping_charge` is the fare the customer will pay (Dropit estimate + 20% margin).
- **Do NOT show the raw Dropit estimate** — only show the total delivery fee to the customer.
- If `delivery_available` is `false`, **block the delivery option at checkout**. Show the `delivery_unavailable_reason` to the customer.

---

### 5.2 Create Order (with delivery)

```
POST /orders
Authorization: Bearer <jwt>
```

**Request:**

```json
{
  "products": [
    {
      "product_id": "uuid-of-product",
      "order_quantity": 2
    }
  ],
  "fulfillment_mode": "delivery",
  "delivery_fee": 51.52,
  "sales_tax": 0,
  "shipping_address": {
    "street_address": "12 SG Highway",
    "city": "Ahmedabad",
    "state": "Gujarat",
    "zip": "380054",
    "country": "India"
  },
  "payment_gateway": "razorpay"
}
```

**Key fields:**

- `fulfillment_mode`: `"delivery"` for Dropit delivery. The server **re-estimates the fare** server-side and ignores the client `delivery_fee` — the server-computed fare is authoritative.
- `shipping_address`: Must include lat/lng from the customer's map pin selection.

**Response:** Standard order object (see Section 7).

**Error responses:**

| HTTP | Message | When |
|---|---|---|
| 400 | `Delivery is only available for product orders; use fulfillment_mode=pickup` | Services-only order with delivery mode |
| 400 | `Delivery is not available for this address; choose pickup` | Address outside Dropit service area |

---

### 5.3 Cancel Order (Customer)

```
POST /my-orders/:id/cancel
Authorization: Bearer <jwt>
```

**Request:**

```json
{
  "cancellation_reason": "Changed my mind"
}
```

**Cancellation rules (v1):**

| When | What happens |
|---|---|
| Before payment | Order cancelled, no charge |
| After payment, before Dropit booking | Full refund (merchandise + delivery fee) |
| After Dropit booking, before rider picks up | Dropit cancelled + delivery fee refunded |
| After rider picks up (`out-for-delivery`) | **Cannot cancel from app** — show "Contact Shievon" message |

**Response when cancel is blocked:**

```json
{
  "statusCode": 400,
  "message": "Your order has already been packed and is ready for pickup. Please contact Shievon support."
}
```

---

### 5.4 Customer Order Status Display

Map the order fields to UI as follows:

| Field | How to use |
|---|---|
| `customer_status_label` | Primary status text (e.g., "Preparing", "Ready for pickup", "Out for delivery", "Delivered") |
| `fulfillment_mode` | `"delivery"` → show delivery UI; `"pickup"` → show pickup UI |
| `deliveries[0].shipment_status` | Detailed delivery status for tracking screen |
| `deliveries[0].pilot` | Rider info: `{ name, phone }` — show when not null |
| `deliveries[0].vehicle_number` | Rider's vehicle number — show when not null |
| `deliveries[0].pilot_location` | Live map pin: `{ latitude, longitude, updated_at }` — show on map when not null (see [§8](#8-live-rider-tracking)) |
| `delivery_fee` | The delivery charge paid by customer |

**When `fulfillment_mode = "delivery"`:**

- Show a delivery tracking section instead of pickup instructions
- Show rider details when `deliveries[0].pilot` is not null
- Show live rider marker on a map when `deliveries[0].pilot_location` is not null
- Poll the order read API while status is `accepted` / `in_progress` to refresh location (see §8)
- Show "Contact Shievon" button when `deliveries[0].shipment_status` is `aborted` or `delivery_failed`
- Do NOT show cancel button when `deliveries[0].shipment_status` is `in_progress`

---

## 6. API Reference — Vendor Mobile & Portal

### 6.1 Mark Product Lines Ready

This is the **only delivery action vendors take**. After packing, they mark items ready. The server then handles everything with Dropit automatically.

```
POST /orders/:id/product-lines/mark-ready
Authorization: Bearer <jwt>
Roles: store_owner, super_admin
```

**Request:**

```json
{
  "order_item_ids": ["uuid-line-1", "uuid-line-2"]
}
```

Or omit `order_item_ids` to mark ALL active product lines ready.

**What happens server-side for delivery orders:**

1. Lines are set to `ready_for_delivery`
2. Order status becomes `ready-for-delivery`
3. A 10-minute timer starts
4. After 10 minutes, the system automatically creates the Dropit order
5. Dropit searches for a rider

**Response:** Updated order object (see Section 7).

---

### 6.2 Vendor Order Status Display

| `fulfillment_mode` | What vendor sees | Vendor actions |
|---|---|---|
| `pickup` | Standard pickup flow | Mark ready → Confirm pickup → Close |
| `delivery` | Delivery flow | **Mark ready only** — everything else is automatic |

**For delivery orders, the vendor should:**

- See that this is a delivery order (badge/label)
- See the delivery status from `deliveries[0].shipment_status`
- See rider details when assigned
- Optionally show live rider map pin from `deliveries[0].pilot_location` (same field as customer)
- **NOT** have any Dropit action buttons (no "cancel delivery", no "re-request rider")
- Only action: "Mark Ready" + "Unable to Fulfill"

**Vendor notification flow for delivery orders:**

| Event | Notification |
|---|---|
| New paid order | "New order #ORD-xxx received" (same as today) |
| Rider assigned | "Rider assigned for order #ORD-xxx" |
| Rider picked up | "Rider picked up order #ORD-xxx" |
| Delivered | "Order #ORD-xxx delivered to customer" |
| Failed/Aborted | "Delivery failed for order #ORD-xxx — contact admin" |

---

## 7. API Reference — Shared (Order Read)

Clients read delivery status and live rider location from the existing order APIs. There is **no separate tracking endpoint** — use the order object's `deliveries[]` array.

### 7.1 Get order (vendor / admin)

```
GET /orders/:id
Authorization: Bearer <jwt>
Roles: store_owner, super_admin
```

**Path params:**

| Param | Type | Description |
|---|---|---|
| `id` | UUID or order number | Order id or `order_number` (e.g. `ORD-MT1GGC46-KMFA`) |

**Response (200)** — order object (wrapped by the global response interceptor when applicable). Delivery fields:

```json
{
  "id": "12f38e11-c38e-4e36-8793-800b5ae42a0d",
  "order_number": "ORD-MT1GGC46-KMFA",
  "status": "ready-for-delivery",
  "fulfillment_mode": "delivery",
  "delivery_fee": 71.07,
  "deliveries": [
    {
      "id": "uuid",
      "order_id": "12f38e11-c38e-4e36-8793-800b5ae42a0d",
      "shop_id": 119,
      "partner": "dropit",
      "external_order_id": "ORD-MT1GGC46-KMFA-S119",
      "shipment_status": "accepted",
      "partner_status": "Accepted",
      "vehicle_type_id": "2_Wheeler_t_Bike_b",
      "goods_types": ["Others"],
      "estimated_fare": 71.07,
      "actual_fare": 71.07,
      "distance_km": 6.328,
      "estimated_duration_min": 21,
      "pilot": {
        "name": "ManavMehta",
        "phone": "9000000036"
      },
      "pilot_location": {
        "latitude": 23.04392,
        "longitude": 72.6765267,
        "updated_at": "2026-08-20T11:50:06.397Z"
      },
      "vehicle_number": "GJ01AB9000002250",
      "dispatch_at": "2026-08-20T11:46:40.427Z",
      "fallback_to_pickup_at": null,
      "attempt_count": 1,
      "created_at": "2026-08-20T11:46:40.427Z",
      "updated_at": "2026-08-20T11:50:06.397Z"
    }
  ],
  "product_fulfillment": {
    "lines": [
      {
        "id": "uuid",
        "fulfillment_status": "rider_assigned",
        "quantity": 1,
        "picked_up_quantity": 0,
        "line_status": "active",
        "item_kind": "product"
      }
    ]
  },
  "customer_status_label": "Rider assigned",
  "...": "other existing fields unchanged"
}
```

### 7.2 List my orders (customer)

```
GET /my-orders
Authorization: Bearer <jwt>
```

**Query params:** same pagination/search as existing my-orders (`page`, `limit`, etc.).

**Response (200):**

```json
{
  "code": 200,
  "status": true,
  "message": "My orders retrieved successfully",
  "data": {
    "data": [
      {
        "id": "12f38e11-c38e-4e36-8793-800b5ae42a0d",
        "order_number": "ORD-MT1GGC46-KMFA",
        "fulfillment_mode": "delivery",
        "delivery_fee": 71.07,
        "deliveries": [
          {
            "shipment_status": "accepted",
            "pilot": { "name": "ManavMehta", "phone": "9000000036" },
            "pilot_location": {
              "latitude": 23.04392,
              "longitude": 72.6765267,
              "updated_at": "2026-08-20T11:50:06.397Z"
            },
            "vehicle_number": "GJ01AB9000002250"
          }
        ]
      }
    ],
    "total": 1,
    "current_page": 1,
    "per_page": 15,
    "last_page": 1
  }
}
```

Find the order by `id` / `order_number` in the list (or filter client-side). Each item uses the same `deliveries[]` shape as §7.1.

### 7.3 `deliveries[]` field reference

| Field | Type | Description |
|---|---|---|
| `fulfillment_mode` (order) | `"pickup"` \| `"delivery"` | How the order will be fulfilled |
| `deliveries` | `Array<Delivery>` | Dropit delivery legs (one per shop in v1) |
| `deliveries[].shipment_status` | `string` | See status table in Section 4 |
| `deliveries[].partner_status` | `string` \| `null` | Raw Dropit status (e.g. `Pending`, `Accepted`) |
| `deliveries[].external_order_id` | `string` | Id sent to Dropit (share with Dropit ops if needed) |
| `deliveries[].pilot` | `{ name, phone }` \| `null` | Rider details (`null` until assigned) |
| `deliveries[].pilot_location` | `{ latitude, longitude, updated_at }` \| `null` | Latest rider GPS from Dropit `OrderTracking` webhooks |
| `deliveries[].vehicle_number` | `string` \| `null` | Rider's vehicle plate |
| `deliveries[].estimated_fare` | `number` \| `null` | Fare used at estimate / booking |
| `deliveries[].actual_fare` | `number` \| `null` | Fare returned by Dropit on create (if present) |
| `deliveries[].distance_km` | `number` \| `null` | Distance in kilometers |
| `deliveries[].estimated_duration_min` | `number` \| `null` | Estimated duration in minutes |
| `deliveries[].dispatch_at` | ISO string \| `null` | When Dropit booking is/was due |
| `deliveries[].attempt_count` | `number` | Dropit booking attempts |
| `deliveries[].fallback_to_pickup_at` | ISO string \| `null` | Set when delivery failed and reverted to pickup |

**`pilot_location` nullability:**

- `null` before rider assignment / before first `OrderTracking` webhook
- Non-null while Dropit is sending tracking updates (`accepted` / `in_progress`)
- Clients should treat a stale `updated_at` as "last known position"

---

## 8. Live Rider Tracking

### 8.1 How it works

1. After Dropit accepts the order, Dropit posts **`OrderTracking`** webhooks to Shievon (server-side only).
2. Each tracking payload includes rider location: `{ latitude, longitude }`.
3. The server stores the latest coords on the delivery row (`pilot_latitude` / `pilot_longitude` / `pilot_location_updated_at`).
4. Clients read **`deliveries[0].pilot_location`** from the order APIs in §7 — there is no client→Dropit call and no separate tracking URL.

Webhook URL (Dropit → Shievon, **not** called by mobile/vendor apps):

```
POST /api/delivery/dropit/webhook
```

Auth: shared secret header configured on the server (`DROPIT_WEBHOOK_SECRETS_JSON`). Clients never call this.

### 8.2 Client polling (recommended)

While `shipment_status` is `accepted` or `in_progress`:

| Client | Endpoint | Interval |
|---|---|---|
| Customer mobile | `GET /my-orders` (locate order in list) or refresh order detail from list cache | Every **5–10 seconds** |
| Vendor mobile / portal | `GET /orders/:id` | Every **5–10 seconds** |

Stop polling when status becomes `completed`, `cancelled`, `aborted`, or `fallback_pickup`.

### 8.3 Example — map marker from response

```json
{
  "pilot": {
    "name": "ManavMehta",
    "phone": "9000000036"
  },
  "pilot_location": {
    "latitude": 23.04392,
    "longitude": 72.6765267,
    "updated_at": "2026-08-20T11:50:06.397Z"
  },
  "vehicle_number": "GJ01AB9000002250",
  "shipment_status": "accepted"
}
```

**UI:**

- Place a marker at `pilot_location.latitude` / `pilot_location.longitude`
- Show rider name + tap-to-call on `pilot.phone`
- Show vehicle number
- Optionally show "Last updated" from `pilot_location.updated_at` (converted to IST by the timezone interceptor when present on responses)

### 8.4 UAT confirmation (20 Aug 2026)

On `api-server-dev`, Dropit sent continuous `OrderTracking` events (~every 6s) for order `ORD-MT1GGC46-KMFA-S119` after `OrderAccepted`. Live coords were persisted and exposed via `pilot_location`.

---

## 9. Push Notifications

### Customer Notifications

| Event | Title | Body (example) |
|---|---|---|
| Rider assigned | Rider Assigned | "A rider has been assigned to your order #ORD-xxx" |
| Out for delivery | Out for Delivery | "Your order #ORD-xxx is on its way!" |
| Delivered | Order Delivered | "Your order #ORD-xxx has been delivered" |
| Delivery failed | Delivery Issue | "We couldn't deliver your order #ORD-xxx. Please contact Shievon support." |

### Vendor Notifications

| Event | Title | Body (example) |
|---|---|---|
| Rider assigned | Rider Assigned | "A rider has been assigned for order #ORD-xxx" |
| Rider picked up | Order Picked Up | "Rider has picked up order #ORD-xxx" |
| Delivered | Order Delivered | "Order #ORD-xxx has been delivered to the customer" |
| Failed/Aborted | Delivery Failed | "Delivery failed for order #ORD-xxx" |

> Location ticks are **not** pushed via FCM in v1. Use polling (§8.2) for the map.

---

## 10. UI/UX Guidelines Per Client

### Customer Mobile App

1. **Checkout screen:**
   - Call `POST /orders/checkout/verify` with `fulfillment_mode: "delivery"` and the customer's selected address (with lat/lng)
   - If `delivery_available: true` → show delivery fee in order summary
   - If `delivery_available: false` → show `delivery_unavailable_reason` and either hide delivery option or show as disabled with the reason
   - Show the delivery fee as a single line item (e.g., "Delivery Fee: Rs 52") — **do not break down** the raw fare

2. **Address selection:**
   - **Map pin is mandatory** for delivery — the address must have lat/lng
   - If the user enters a text address without selecting on the map, prompt them to place a pin
   - Show postal/PIN code field — required for delivery

3. **Order tracking screen (delivery orders):**
   - Show a delivery status timeline: Preparing → Ready → Rider Assigned → Out for Delivery → Delivered
   - When rider is assigned: show rider name, phone (tap to call), vehicle number
   - When `pilot_location` is present: show a **live map** with the rider marker; refresh via polling (§8)
   - When `shipment_status = "aborted"` or `"delivery_failed"`: show "Contact Shievon" button/message
   - Hide cancel button when `shipment_status = "in_progress"` (rider already picked up)

4. **Order list:**
   - Add a delivery/pickup badge based on `fulfillment_mode`
   - Show `customer_status_label` as the primary status

### Vendor Mobile App

1. **Order detail:**
   - Show "Delivery Order" badge when `fulfillment_mode = "delivery"`
   - Show delivery status from `deliveries[0].shipment_status`
   - Show rider info when available; optionally show live map from `pilot_location`
   - **Only action button: "Mark Ready"** — the rest is automatic

2. **Order list:**
   - Add delivery/pickup indicator
   - Delivery orders should be visually distinct

### Vendor Portal (Web)

1. **Order detail page:**
   - Show delivery section with shipment status, rider details, fare info, and live map when `pilot_location` is set
   - "Mark Ready" button triggers Dropit dispatch (after 10-min delay)
   - Read-only delivery tracking information
   - No "cancel delivery" or "re-request rider" buttons (v1)

2. **Order list:**
   - Add `fulfillment_mode` column/filter
   - Filter by delivery status if needed

---

## 11. Dropit Operating Hours & Serviceability

| Parameter | Value |
|---|---|
| Operating hours | 08:00 AM – 08:00 PM |
| Service area | Ahmedabad (may expand) |
| Vehicle | 2 Wheeler Bike (max 20 kg) |
| Goods types | Documents, Food, Clothing, F&B, Electronics, Tools and Hardware, Gadgets, Medical Supplies, Fragile Items, Household Items, Books and Stationery, Gift Articles, Sea-Food, Accessories |

**Client behavior outside operating hours:**

- `POST /orders/checkout/verify` will return `delivery_available: false` if the area is not serviceable
- Display the operating hours to the customer if delivery is unavailable due to timing

---

## Appendix A: Dropit Vehicle Types (from API)

| ID | Name | Max Weight |
|---|---|---|
| `2_Wheeler_t_Scooter_b` | 2 Wheeler Scooter | 20 kg |
| `2_Wheeler_t_Bike_b` | 2 Wheeler Bike | 20 kg |
| `3_Wheeler_t_Auto_b` | 3 Wheeler Auto | 90 kg |

v1 uses `2_Wheeler_t_Bike_b` only. Auto/scooter selection is v2.

---

## Appendix B: Dropit Goods Types (from API)

Documents, Food, Clothing, F&B, Electronics, Tools and Hardware, Gadgets, Medical Supplies, Fragile Items, Household Items, Books and Stationery, Gift Articles, Sea-Food, Accessories

The server maps product categories to these types automatically. No client action needed.

---

## Appendix C: Cancellation Reason Options

These are the valid cancellation reasons accepted by Dropit:

- Driver is not moving to pickup location
- Changed my mind
- Unable to contact driver
- Expected a shorter arrival time
- Driver asked me to cancel
- Driver asking for extra money
- Wrong / Inappropriate Vehicle
- Driver asked to settle offline (outside app)
- Booked by mistake
- No pilot assigned yet
- My reason is not listed

---

## Appendix D: Quick Reference — What Each Client Needs to Build

### Customer Mobile App

| Screen/Feature | Priority | Notes |
|---|---|---|
| Checkout: delivery fee display | Must have | Show `shipping_charge` from verify-checkout |
| Checkout: address with map pin | Must have | Lat/lng required for delivery |
| Checkout: `fulfillment_mode` param | Must have | Send `"delivery"` in create order |
| Checkout: serviceability error | Must have | Show `delivery_unavailable_reason` when blocked |
| Order detail: delivery tracking section | Must have | Show shipment status, rider, vehicle |
| Order detail: **live map** from `pilot_location` | Must have | Poll order while `accepted` / `in_progress` |
| Order detail: rider call button | Must have | Tap `pilot.phone` to call |
| Order detail: "Contact Shievon" on failure | Must have | When shipment is aborted/failed |
| Order detail: hide cancel after pickup | Must have | When `shipment_status = "in_progress"` |
| Order list: delivery/pickup badge | Nice to have | Based on `fulfillment_mode` |

### Vendor Mobile App

| Screen/Feature | Priority | Notes |
|---|---|---|
| Order detail: "Delivery Order" badge | Must have | When `fulfillment_mode = "delivery"` |
| Order detail: delivery status display | Must have | From `deliveries[0].shipment_status` |
| Order detail: rider info display | Must have | Name, phone, vehicle number |
| Order detail: live map (optional) | Nice to have | Same `pilot_location` field |
| Mark Ready button | Already exists | Same API, server handles delivery logic |

### Vendor Portal (Web)

| Screen/Feature | Priority | Notes |
|---|---|---|
| Order detail: delivery info section | Must have | Shipment status, rider, fare details |
| Order detail: live map | Nice to have | From `deliveries[0].pilot_location` |
| Order list: fulfillment mode column | Must have | Filter/sort by delivery vs pickup |
| Mark Ready button | Already exists | Same API, server handles delivery logic |
