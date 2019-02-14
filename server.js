// server.js

const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;
const uuidv1 = require('uuid/v1');

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
  // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });

// number of clients connected
const clientsConnected = {
  type: 'incomingClientUpdate',
  number: 0
}

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (ws) => {
  console.log('Client connected');
  // broadcast updated number of clients connected when new client 
  clientsConnected.number++;
  wss.broadcast(JSON.stringify(clientsConnected));

  //set up a callback that handles users messages
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    let reponse = {};

    //create object that will be sent back to client, include id
    const id = uuidv1();

    switch(data.type){
      case 'postMessage': 
        console.log(`User ${data.username} said ${data.content}`);
        const imageRE = /(.*)\s?(http.*)\.(jpg|png|gif)$/;
        const image = data.content.match(imageRE);
        
        response = {
          type: 'incomingMessage',
          content: data.content,
          username: data.username,
          userColour: data.userColour,
          image,
          id
        }
        break;
      
      case 'postNotification':
        console.log(`${data.oldUsername} changed name to ${data.newUsername}`)
        response = {
          type: 'incomingNotification',
          oldUsername: data.oldUsername,
          newUsername: data.newUsername,
          id
        }
      break;
    }

    wss.broadcast(JSON.stringify(response));

  });

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    console.log('Client disconnected');
    clientsConnected.number--;
    wss.broadcast(JSON.stringify(clientsConnected));
  });
});