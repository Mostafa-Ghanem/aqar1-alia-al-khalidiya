import { onRequestPost, onRequest } from './functions/api/lead.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/lead') {
      if (request.method === 'POST') {
        return onRequestPost({ request, env });
      }
      return onRequest();
    }

    return env.ASSETS.fetch(request);
  }
};
