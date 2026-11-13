# OVR Spice Powders storefront

A responsive, no-build storefront made from the supplied OVR brand and product images. Open `index.html` for the short home page or `products.html` for the full catalog. The home page has an automatically advancing six-spice carousel with manual arrows, dots and swipe controls. The catalog has six 100 g products, including Garam Masala, with search, filters, sorting and a shared shopping bag. Upload the folder as a static website, keeping the HTML, CSS, JavaScript, favicon, `assets` folder and source images together.

## Before taking orders

1. The WhatsApp number `+91 86060 70442` is set in `app.js`; the checkout opens a prefilled order chat with this number.
2. Update the `price` values in the `PRODUCTS` list to OVR's actual prices. The current INR prices are starter suggestions because no price list was supplied.
3. Confirm the actual prices and product weights before publishing. The new cropable product image shows 100 g tins, which is what the catalog currently displays.

The basket and order summary work in the browser and are shared between both pages. Orders are confirmed through WhatsApp; this site does not process online payments or calculate delivery charges. Payment and delivery details can be confirmed directly with the customer.
