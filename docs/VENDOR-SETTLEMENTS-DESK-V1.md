# Settlements Desk V1 — API & UI acceptance

**Status:** BE live · FE desk-only (compat removed)  
**Audience:** API + Admin panel  
**Date:** 2026-09-17  

Admin payday surface: queue safe payouts for many shops with minimal clicks.  
Vendors remain read-only on `/{shop}/withdraws`.

---

## 1. Product contract (V1)

> Admin sees every shop that can be paid, queues a safe payout in one click (or batch), exports for bank, then marks paid when money has moved — never double-queues, never pays unverified banks, never exceeds pending, never pays held shops or amounts &lt; ₹500.

**Copy:** use **Queue payout** / **Mark paid** (not “Pay”) until auto-transfer exists.

---

## 2. Admin UI — Settlements Desk `/withdraws`

### Tabs

| Tab | Filter |
|-----|--------|
| Ready to pay | `can_queue === true` |
| Needs attention | `can_queue === false` and (pending &gt; 0 or bank incomplete or on_hold) |
| Queued | Existing withdraws with status Pending |
| Paid | Existing withdraws with status Approved |

### Ready table columns

Shop · Pending · Bank · Open payout · Amount (editable, default = pending) · Queue payout

### Bulk

- Select rows → **Queue N payouts** (full pending only in V1)  
- Queued tab → **Export CSV** → **Mark paid** (batch)

### Row block reasons (must show)

`BELOW_MINIMUM` · `BANK_INCOMPLETE` · `BANK_UNVERIFIED` · `ALREADY_QUEUED` · `ON_HOLD` · `EXCEEDS_PENDING`

---

## 3. API contract (BE to ship)

Base: same auth as admin REST (`Authorization: Bearer`).

### 3.1 Desk feed

`GET /admin/vendor-settlements`

| Query | Type | Notes |
|-------|------|--------|
| `tab` | `ready` \| `attention` \| `all` | optional; default `all` |
| `search` | string | shop name/slug |
| `page` | number | |
| `limit` | number | default 20 |
| `min_pending` | number | optional |

**Response `data[]` item:**

```json
{
  "shop_id": 12,
  "shop_name": "Reload Fashion",
  "shop_slug": "reload-fashion",
  "pending": 12400,
  "received": 50000,
  "total_earnings": 62400,
  "todays_collection": 0,
  "total_collection": 62400,
  "settlement_eta_message": "Bank transfer may take up to 5 working days.",
  "bank": {
    "verification_status": "verified",
    "incomplete": false,
    "name": "Acme",
    "bank": "HDFC",
    "ifsc": "HDFC0001234",
    "masked_account": "****1234"
  },
  "open_payout": null,
  "on_hold": false,
  "can_queue": true,
  "block_reason": null,
  "min_payout_amount": 500
}
```

`open_payout` when present:

```json
{ "id": "uuid-or-id", "amount": 5000, "status": "PENDING", "status_key": "Pending" }
```

`block_reason` enum when `can_queue` is false:

`BELOW_MINIMUM` | `BANK_INCOMPLETE` | `BANK_UNVERIFIED` | `ALREADY_QUEUED` | `ON_HOLD` | `NO_PENDING` | `null`

**Paginator:** same shape as other list endpoints (`data` + paginator fields).

**Summary (optional, recommended on same response):**

```json
"meta": {
  "ready_count": 47,
  "attention_count": 12,
  "queued_count": 5,
  "total_pending_ready": 520000
}
```

---

### 3.2 Queue single payout (existing, tighten rules)

`POST /withdraws`  
`{ "shop_id": 12, "amount": 12400, "note": "optional" }`

**Must reject with stable `code` (or message containing code):**

| Code | When |
|------|------|
| `BELOW_MINIMUM` | amount &lt; 500 |
| `EXCEEDS_PENDING` | amount &gt; pending |
| `BANK_INCOMPLETE` | missing name/bank/account/IFSC |
| `BANK_UNVERIFIED` | not verified |
| `ALREADY_QUEUED` | shop already has Pending payout |
| `ON_HOLD` | shop settlement hold |

---

### 3.3 Batch queue

`POST /withdraws/batch`  
Header (recommended): `Idempotency-Key: <uuid>`

```json
{
  "items": [
    { "shop_id": 12, "amount": 12400, "note": null },
    { "shop_id": 15, "amount": 8200 }
  ]
}
```

**Response:**

```json
{
  "created": [ { "id": "...", "shop_id": 12, "amount": 12400, "status": "PENDING" } ],
  "failed": [ { "shop_id": 15, "code": "ALREADY_QUEUED", "message": "..." } ]
}
```

---

### 3.4 Batch mark paid

`POST /withdraws/mark-paid/batch`

```json
{ "ids": ["id1", "id2"], "note": "UTR batch 17 Sep" }
```

**Response:** `{ "updated": [...], "failed": [{ "id", "code", "message" }] }`  
Only `PENDING` → paid/Approved.

---

### 3.5 Cancel (existing)

`DELETE /withdraws/:id` — Pending only → cancelled.

---

### 3.6 Settlement hold

`PATCH /shops/:id/settlement-hold`  
`{ "on_hold": true }`

Or include on settlement update. Desk feed must reflect `on_hold`.

---

### 3.7 Export queued payouts

`GET /withdraws/export?status=pending`  
Returns CSV (or JSON array for FE to CSV):

`payout_id,shop_id,shop_name,amount,beneficiary_name,bank,account,ifsc,created_at`

---

## 4. FE acceptance checklist

### Ready tab
- [ ] Lists only `can_queue` shops when desk API available  
- [ ] Amount defaults to pending; cannot submit &lt; 500 or &gt; pending  
- [ ] Queue payout success → toast + row leaves Ready (or shows open payout)  
- [ ] Blocked shops never appear in Ready  

### Needs attention
- [ ] Shows `block_reason` human copy  
- [ ] Link to `/{slug}/edit` for bank issues  

### Queued
- [ ] Lists Pending withdraws  
- [ ] Export CSV downloads beneficiary fields  
- [ ] Bulk Mark paid updates rows to Approved  
- [ ] Cancel available per row  

### Paid
- [ ] Lists Approved payouts  

### Batch queue
- [ ] Select 3 ready shops → Queue → progress + failed list  
- [ ] Partial success does not hide failures  

### Vendor
- [ ] No create button on `/{shop}/withdraws`  
- [ ] History shows Pending / Approved  

### Errors
- [ ] API error codes map to toast / inline reason  
- [ ] Stale pending (EXCEEDS_PENDING) prompts refresh  

---

## 5. FE compatibility — removed

§5 shop+settlement derivation fallback has been removed.  
Desk, batch queue, batch mark-paid, and export call the live V1 endpoints only.

---

## 6. Out of scope (V1)

- RazorpayX / auto bank push  
- Scheduled payday  
- Multiple concurrent Pending payouts per shop  
- Finance role split  

---

## 7. Hand-off

1. ~~BE implements §3~~ ✅  
2. ~~FE desk ships with §5 fallback~~ ✅ (then removed)  
3. ~~Flip FE to desk-only~~ ✅  
4. Run §4 checklist jointly in staging  
