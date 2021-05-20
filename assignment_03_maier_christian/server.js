const { PeerServer } = require('peer');
const timeout = 5 * 60 * 1000; //5 Minutes
const config = { host: "localhost", port: 9000, path: '/chat', allow_discovery: true, alive_timeout: timeout };
const server = PeerServer(config);
server.on("connection", (client) => { console.log('connected: ', client.id); })
server.on("disconnect", (client) => { console.log('disconnected: ', client.id); })
console.log(`PeerJS Server running at http://${config.host}:${config.port}${config.path}`)