import { onRequestPost, onRequest, onTallyWebhookPost } from './functions/api/lead.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/lead') {
      if (request.method === 'POST') return onRequestPost({ request, env });
      return onRequest();
    }

    if (url.pathname === '/api/tally-webhook') {
      if (request.method === 'POST') return onTallyWebhookPost({ request, env });
      return onRequest();
    }

    return env.ASSETS.fetch(request);
  }
};
