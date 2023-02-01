const { PeerServer } = require('peer');
const timeout = 5 * 60 * 1000; //5 Minutes
// empty config to use peers free cloud service or localhost config for testing, 
//hci server from js/videochat.js is unfortunatelly not running anymore
//const config = { host: "localhost", port: 9000, path: '/chat', allow_discovery: true, alive_timeout: timeout };
const config = { }
const server = PeerServer(config);
server.on("connection", (client) => { console.log('connected: ', client.id); })
server.on("disconnect", (client) => { console.log('disconnected: ', client.id); })

if (Boolean(config.host)) {
console.log(`PeerJS Server running at http://${config.host}:${config.port}${config.path}`)
} else { 
console.log(`PeerJS Server running at https://peerjs.com/peerserver Cloud Service`)
}