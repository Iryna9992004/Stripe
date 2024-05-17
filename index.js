require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

const itemKeys = [1, 2];
const itemValues = [
  { priceInCents: 100, name: 'Learn' },
  { priceInCents: 200, name: 'Hello' },
];

const storeItems = new Map(itemKeys.map((key, index) => [key, itemValues[index]]));

app.post('/pay', async (req, res) => {
  try {
    if (!req.body.items) {
      return res.status(400).json({ message: 'Missing items in request body' });
    }

    const lineItems = [];
    for (const item of req.body.items) {
      const storeItem = storeItems.get(item.id);
      if (storeItem) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: storeItem.name,
            },
            unit_amount: storeItem.priceInCents,
          },
          quantity: item.quantity,
        });
      } else {
        console.error('Invalid item ID:', item.id);
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.SERVER_URL}/success.html`,
      cancel_url: `${process.env.SERVER_URL}/err.html`,
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000);