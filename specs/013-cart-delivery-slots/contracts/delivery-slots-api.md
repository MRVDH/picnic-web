# API Contract: Delivery Slots

**Feature**: 013-cart-delivery-slots | **Date**: 2026-04-15
**New endpoint**: `GET /api/cart/delivery-slots` and `POST /api/cart/delivery-slots`
**Extends**: `specs/006-cart-page/contracts/cart-api.md` (CartData gains delivery slot fields)

## Change Summary

1. **New API route**: `/api/cart/delivery-slots` with GET (fetch available slots) and POST (select a slot).
2. **CartData extension**: Two new fields (`selectedSlot`, `deliveryBannerText`) added to the existing `GET /api/cart` response.

---

## Endpoint: GET /api/cart/delivery-slots

Fetches all available delivery slots, grouped by day, with green-choice identification.

**Upstream**: Calls `client.cart.getDeliverySlots()` → `GET /cart/delivery_slots`

### Success Response (200)

**Content-Type**: `application/json`

```typescript
type DeliverySlotPickerData = {
  dayGroups: SlotDayGroup[];
  selectedSlot: SelectedSlotData | null;
};

type SlotDayGroup = {
  date: string;           // "2026-04-16"
  dayLabel: string;       // "Morgen" | "Donderdag" | "Vandaag"
  dateLabel: string;      // "16 apr"
  greenSlots: DeliverySlotData[];
  regularSlots: DeliverySlotData[];
};

type DeliverySlotData = {
  slotId: string;
  windowStart: string;    // ISO 8601
  windowEnd: string;      // ISO 8601
  cutOffTime: string;     // ISO 8601
  isAvailable: boolean;
  isSelected: boolean;
  isGreenChoice: boolean;
  minimumOrderValue: number | null;
};

type SelectedSlotData = {
  slotId: string;
  state: string;          // "IMPLICIT" | "ACTIVE" | "EXPLICIT"
  windowStart: string | null;
  windowEnd: string | null;
  isExplicitSelection: boolean;
};
```

**Example response**:

```json
{
  "dayGroups": [
    {
      "date": "2026-04-16",
      "dayLabel": "Morgen",
      "dateLabel": "16 apr",
      "greenSlots": [
        {
          "slotId": "61ad3a...",
          "windowStart": "2026-04-16T14:40:00+02:00",
          "windowEnd": "2026-04-16T17:40:00+02:00",
          "cutOffTime": "2026-04-16T10:00:00+02:00",
          "isAvailable": true,
          "isSelected": false,
          "isGreenChoice": true,
          "minimumOrderValue": 3500
        }
      ],
      "regularSlots": [
        {
          "slotId": "7bc42f...",
          "windowStart": "2026-04-16T14:40:00+02:00",
          "windowEnd": "2026-04-16T15:40:00+02:00",
          "cutOffTime": "2026-04-16T10:00:00+02:00",
          "isAvailable": true,
          "isSelected": false,
          "isGreenChoice": false,
          "minimumOrderValue": 3500
        }
      ]
    }
  ],
  "selectedSlot": {
    "slotId": "7bc42f...",
    "state": "IMPLICIT",
    "windowStart": "2026-04-16T14:40:00+02:00",
    "windowEnd": "2026-04-16T15:40:00+02:00",
    "isExplicitSelection": false
  }
}
```

### Error Responses

| Status | Body | When |
|--------|------|------|
| 401 | `{ "error": "Your token has expired", "code": "TOKEN_EXPIRED" }` | Missing/expired auth token |
| 502 | `{ "error": "Kan bezorgmomenten niet ophalen. Probeer het later opnieuw." }` | Upstream API failure |

---

## Endpoint: POST /api/cart/delivery-slots

Selects a delivery slot. Returns the full updated cart state (same shape as `GET /api/cart`).

**Upstream**: Calls `client.cart.setDeliverySlot(slotId)` → `POST /cart/set_delivery_slot`

### Request Body

```typescript
type SetDeliverySlotRequest = {
  slotId: string;
};
```

**Example**:

```json
{
  "slotId": "7bc42f..."
}
```

### Success Response (200)

**Content-Type**: `application/json`

Returns a full `CartData` object (same shape as `GET /api/cart` response, including the new `selectedSlot` and `deliveryBannerText` fields). The selected slot is reflected in the response.

### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{ "error": "Missing required field: slotId" }` | Missing `slotId` in request body |
| 401 | `{ "error": "Your token has expired", "code": "TOKEN_EXPIRED" }` | Missing/expired auth token |
| 502 | `{ "error": "Kan bezorgmoment niet instellen. Probeer het opnieuw." }` | Upstream API failure |

---

## CartData Extension (GET /api/cart)

Two new fields added to the existing `CartData` response:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `selectedSlot` | `SelectedSlotData \| null` | `null` | Summary of selected delivery slot |
| `deliveryBannerText` | `string` | `"Kies je bezorgmoment"` | Pre-formatted banner display text |

**Example** (with explicit selection):

```json
{
  "items": [...],
  "totalPrice": 2550,
  "totalCount": 5,
  "selectedSlot": {
    "slotId": "7bc42f...",
    "state": "EXPLICIT",
    "windowStart": "2026-04-16T14:40:00+02:00",
    "windowEnd": "2026-04-16T15:40:00+02:00",
    "isExplicitSelection": true
  },
  "deliveryBannerText": "Morgen 14:40 - 15:40"
}
```

**Example** (implicit/no selection):

```json
{
  "selectedSlot": {
    "slotId": "61ad3a...",
    "state": "IMPLICIT",
    "windowStart": "2026-04-16T14:40:00+02:00",
    "windowEnd": "2026-04-16T17:40:00+02:00",
    "isExplicitSelection": false
  },
  "deliveryBannerText": "Kies je bezorgmoment"
}
```

## Processing Pipeline

### GET /api/cart (updated)

```text
1. Read auth token from cookie
2. Build Picnic client
3. sendRequest("GET", "/cart") → raw unknown response
4. parseCartResponse(rawData) → CartData
   a-i. [existing steps unchanged]
   j. parseSelectedSlot(rawData) → selectedSlot            ← NEW
   k. computeDeliveryBannerText(selectedSlot) → string     ← NEW
5. Return CartData as JSON
```

### GET /api/cart/delivery-slots (new)

```text
1. Read auth token from cookie
2. Build Picnic client
3. client.cart.getDeliverySlots() → raw GetDeliverySlotsResult
4. parseDeliverySlotsPicker(rawResult) → DeliverySlotPickerData
   a. Extract delivery_slots array
   b. Filter by is_available and cut-off time
   c. Identify green choices (paired window_start heuristic)
   d. Group by calendar day
   e. Format day labels and date labels
   f. Extract selected_slot
5. Return DeliverySlotPickerData as JSON
```

### POST /api/cart/delivery-slots (new)

```text
1. Read auth token from cookie
2. Validate request body (slotId required)
3. Build Picnic client
4. client.cart.setDeliverySlot(slotId) → raw Cart response
5. parseCartResponse(rawCart) → CartData (includes updated selectedSlot + deliveryBannerText)
6. Return CartData as JSON
```

## Backward Compatibility

- **Additive only**: `CartData` gains two new fields. Existing consumers ignore unknown fields.
- **New endpoint**: `/api/cart/delivery-slots` is a new route. No existing routes are modified.
- **Default values**: `selectedSlot: null`, `deliveryBannerText: "Kies je bezorgmoment"` — banner component handles both gracefully.
