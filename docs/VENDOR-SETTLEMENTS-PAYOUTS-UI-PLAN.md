# Vendor panel — settlements & payouts UI plan

**Status:** Implemented (VP-0 → VP-4)  
**App:** `@marvel/admin-rest` at `pickbazar-react/admin/vendor admin panel rest`  
**Depends on API:** Phase 0–2 vendor settlements (already shipped in API)  
**Last updated:** 2026-09-17  

---

## Confirmed decisions

| Item | Choice |
|------|--------|
| Bank details | **C1** — shop form + IFSC + Verify |
| Admin create payout | **Global** `/withdraws` (+ `/withdraws/create` with shop picker) — not per-shop |
| Shop `/{shop}/withdraws` | Vendor settlement summary + history (read-focused) |
| Vendor sidebar | **Re-enable** Financial → Payouts |
| Ship order | VP-0 → VP-1 → VP-2 → VP-3 → VP-4 |

---

## Goal

Wire the vendor admin panel to settlement APIs:

| Role | Can see / do |
|------|----------------|
| **store_owner** | Settlement summary, payout history, edit bank details, Verify bank |
| **super_admin** | Same for any shop + **create payout** + **Mark paid** |

Preserve existing navigation (`/[shop]/withdraws`, shop dashboard balance cards, shop payment-info form); extend rather than replace.

---

## API ↔ UI mapping

| UI need | API |
|---------|-----|
| Settlement cards | `GET /vendor-settlements/:shopId` |
| Payout history | `GET /withdraws?shop_id=&page=&limit=` |
| Create payout (admin) | `POST /withdraws` `{ shop_id, amount, note?, balance_kind? }` |
| Mark paid (admin) | `POST /withdraws/:id/approve` `{ note? }` |
| Cancel pending | `DELETE /withdraws/:id` |
| Save bank details | `POST /vendor-settlements/:shopId/payment-info` |
| Verify bank | `POST /vendor-settlements/:shopId/payment-info/verify` |

**Fix:** approve URL from flat `approve-withdraw` → `withdraws/${id}/approve`.

---

## Phases

| Phase | Scope |
|-------|--------|
| **VP-0** | Types + endpoints + approve URL + settlement hooks |
| **VP-1** | Dashboard + withdraws summary from settlement API |
| **VP-2** | Admin-only create; Mark paid UX + UTR note |
| **VP-3** | IFSC + Verify on shop payment form (C1) |
| **VP-4** | i18n, empty states, error toasts; re-enable nav |

---

## Non-goals

- Customer invoice UI  
- RazorpayX auto-payout UI  
- Vendor “request withdraw” button  
- Changing mobile app  
