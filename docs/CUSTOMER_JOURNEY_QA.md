# Customer Journey QA

## Account Flow
- Sign up with a new email.
- Request and verify OTP.
- Confirm login succeeds only after verification.
- Confirm account page loads saved addresses correctly.

## Shopping Flow
- Browse products and add multiple items to cart.
- Change quantity and remove an item.
- Enter a valid serviceable pincode and confirm shipping, GST, and ETA appear.
- Enter a non-serviceable pincode and confirm checkout is blocked with a clear message.

## Checkout Flow
- Place one `COD` order.
- Place one `Bank Transfer` order.
- Confirm the order shows subtotal, shipping, GST, total, invoice number, and ETA.
- Confirm business billing fields save correctly when GST invoice is requested.

## Fulfillment Flow
- Confirm admin can move `placed -> packed -> shipped -> delivered`.
- Confirm customer can cancel only before shipment.
- Confirm stock decreases on order placement.
- Confirm stock is restored on cancellation or refund.

## Communication Flow
- Confirm order placed email sends successfully.
- Confirm status update email sends for packed, shipped, delivered, cancelled, and refunded.
- Confirm SMS/WhatsApp provider or fallback logging works in production-like config.

## Invoice Flow
- Open invoice from customer order history.
- Confirm invoice includes billing details, GST, shipping, and product lines.
- Confirm admin can review invoice readiness for GST orders.
