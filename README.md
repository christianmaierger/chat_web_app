# Project Title

University of Bamberg Assignments to create Chat/Collaboration Web Apps

## Description

The assignments include first building client and server for a simple chat app, where clients can register on a server and participate in a group chat, WebRTC was used as connection mechanism. Please see folder WebRTCShowcase for a usable implementation, that was originaly assignment_02 from the university project, but has been significantly refined and refactored.

The other project from assignment_03 on included building a colaboration tool with text and video chat aswell as a simple drawing board that I implemented with creative use of event handlers and node module Automerge. It is a peer2peer app using PeerJS. See PeerJSShowcase folder, former assignment_6, for a usable implementation using PeerJs' Cloud solution as server.

## Getting Started

### Dependencies

Node and NPM

Then all can be installed with npm install
Notable Modules: 
https://www.npmjs.com/package/automerge
https://www.npmjs.com/package/peer
https://www.npmjs.com/package/webrtc

### Installing

Just run the following commands to get the both showcases up and running:

```
cd assignment_02_maier_christian/assignment_06_maier_christian

npm install

npm audit fix (optional)
```
### Executing program

For the server put host/port in the .env file, default is localhost and 8080

```
npm start (for server)

npm run start-client (to start up client in browser)
```

For Client in Browser just use host and port, default "localhost" and "8080"


### Executing with Docker

The faster way is just running the Server as Docker container with:

```
./build.sh 
./run.sh
```

That will build an image named websockets and run a container from it with ports mapped: 8080 to 8080

## Help

Please get in touch if you need any help or advice.

## Authors

ex. Tony Malzhacker (University HCI Chair)
ex. Christian Maier (Implementing Student)

