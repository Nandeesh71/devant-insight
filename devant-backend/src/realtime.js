const { WebSocketServer } = require('ws');

let wss = null;

function safeParse(message) {
  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
}

function initRealtime(server) {
  if (wss) return wss;

  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket) => {
    socket.subscribedProjects = new Set();

    socket.send(JSON.stringify({ type: 'realtime.ready' }));

    socket.on('message', (raw) => {
      const data = safeParse(String(raw));
      if (!data || typeof data !== 'object') return;

      if (data.type === 'subscribe' && Array.isArray(data.projectIds)) {
        socket.subscribedProjects = new Set(data.projectIds.map((id) => String(id)));
        socket.send(JSON.stringify({ type: 'realtime.subscribed', projectIds: [...socket.subscribedProjects] }));
      }

      if (data.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong', at: Date.now() }));
      }
    });
  });

  return wss;
}

function broadcastProjectUpdate(projectId, event, payload = {}) {
  if (!wss) return;

  const pid = String(projectId || '');
  if (!pid) return;

  const message = JSON.stringify({
    type: 'project.update',
    event,
    projectId: pid,
    payload,
    at: new Date().toISOString(),
  });

  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;

    const subs = client.subscribedProjects;
    if (subs && subs.size > 0 && !subs.has(pid)) continue;

    client.send(message);
  }
}

module.exports = {
  initRealtime,
  broadcastProjectUpdate,
};
