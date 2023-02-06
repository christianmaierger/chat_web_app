# Project Title

University of Bamberg Assignments to create Chat/Collaboration Web Apps

## Description

The assignments include first building client and server for a simple chat app, where clients can register on a server and participate in a group chat, WebRTC was used as connection mechanism. Please see folder WebRTCShowcase for a usable implementation, that was originaly assignment_02 from the university project, but has been significantly refined and refactored. Express was added, so clients making an http request on the server get all static files and can then connect to the ws to chat. Also the app now can be run as Docker container.

The other project from assignment_03 on included building a colaboration tool with text and video chat aswell as a simple drawing board that I implemented with creative use of event handlers and node module Automerge. It is a peer2peer app using PeerJS. See assignment_06 folder for a usable implementation using PeerJs' Cloud solution as server.

## Getting Started

### Dependencies

Node/Npm and optionally Docker if you want to run as container

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
You can spare this steps, if you just want to build a Docker Image and run app in a container

### Executing program

For the server put host/port in the .env/Dockerfile file, default is localhost and 8080 (websocket), 3000 (express)

```
npm start (for server)
```

Then visit host:port/index in your browser - default running on your machine it would be: localhost:3000/index
For connection to chat in Browser just use host and port, default "localhost" and "8080"


### Executing with Docker

The faster way to run assignment_02 is just running the Server as Docker container with:

```
./build.sh 
./run.sh
```

That will build an image named websockets and run a container from it with ports mapped: 8080 to 8080 (for ws) and 3000 to 3000
(for sending the static files to client with express)
By changing the scripts you could also change naming and ports, but keep in mind to also change ports in Dockerfile.

In browser open url: localhost:3000/index, those are the default values when running on your local machine

## Help

Please get in touch if you need any help or advice.

## Authors

ex. Tony Malzhacker (University HCI Chair)
ex. Christian Maier (Implementing Student)
