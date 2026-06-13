const axios = require('axios');

// Weighted random status simulator
// Simulates realistic delivery funnel: sent > delivered > opened > read > clicked > converted
function getRandomStatus() {
  const rand = Math.random();
  if (rand < 0.05) return 'failed';
  if (rand < 0.10) return 'sent';       // only sent (not delivered)
  if (rand < 0.30) return 'delivered';
  if (rand < 0.55) return 'opened';
  if (rand < 0.72) return 'read';
  if (rand < 0.88) return 'clicked';
  return 'converted';
}

// Build the delivery chain for a given final status
function getStatusChain(finalStatus) {
  const order = ['sent','delivered','opened','read','clicked','converted'];
  const failOrder = ['sent','failed'];
  if (finalStatus === 'failed') return failOrder;
  const idx = order.indexOf(finalStatus);
  return order.slice(0, idx + 1);
}

// Delay helper
const sleep = ms => new Promise(r => setTimeout(r, ms));

exports.send = async (req, res) => {
  const { campaign_id, channel, message, recipients, callback_url } = req.body;

  if (!campaign_id || !recipients?.length || !callback_url) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Acknowledge immediately
  res.json({
    success: true,
    message: `Processing ${recipients.length} ${channel} messages`,
    campaign_id,
  });

  // Process each recipient asynchronously with staggered delays
  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    const finalStatus = getRandomStatus();
    const chain = getStatusChain(finalStatus);

    // Process status chain with realistic delays
    ;(async () => {
      // Initial send delay (stagger by index)
      await sleep(500 + i * 300);

      for (const status of chain) {
        const delay = {
          sent:      0,
          failed:    200,
          delivered: 1000 + Math.random() * 2000,
          opened:    3000 + Math.random() * 5000,
          read:      1000 + Math.random() * 2000,
          clicked:   2000 + Math.random() * 3000,
          converted: 3000 + Math.random() * 5000,
        }[status] || 1000;

        await sleep(delay);

        try {
          await axios.post(callback_url, {
            campaign_id,
            customer_id: recipient.customer_id,
            channel,
            status,
            timestamp: new Date().toISOString(),
            metadata: {
              phone: recipient.phone,
              name:  recipient.name,
            },
          }, { timeout: 5000 });
        } catch (err) {
          console.error(`Callback failed for ${recipient.customer_id}: ${err.message}`);
        }
      }
    })();
  }
};

exports.health = (_req, res) => {
  res.json({ status: 'ok', service: 'channel-service', port: 6000 });
};
