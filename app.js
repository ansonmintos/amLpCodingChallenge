import Websocket_Handler from './services/websocket_handler.js';
import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url)); // set local directory

const app = express(); // create express app

// create a custom handler to handle the websocket connection to liveperson
var wsh = new Websocket_Handler.Websocket_Handler();

app.use(express.urlencoded({ extended: false })); // handle form data submitted in POST requests as application/x-www-form-urlencoded
app.use(express.static('./public')); // set public folder as static

// open the home page
app.get('/', (request, response) => {
    response.sendFile('./public/index.html', {root: __dirname});
});

// close the app
app.get('/api/close_app', (request, response) => {
    console.log('shutting down')
    server.close();
});

// direct to opening the connection and starting a conversation with liveperson
app.get('/api/open_connection', (request, response) => {
    console.log('opening connection...');
    wsh.open_liveperson_websocket_connection();
    response.redirect('/');
});

// direct to closing the connection to liveperson
app.get('/api/close_connection', (request, response) => {
    console.log('closing connection...');
    wsh.close_connection();
    response.redirect('/');
});

// direct to sending a message to liveperson
app.post('/api/send_text_to_liveperson', (request, response) => {
    console.log('sending message...')
    // console.log('sending text to live person', request.body['lp-input-text']);
    wsh.send_message(request.body['lp-input-text']);
    response.redirect('/');
});

var server = app.listen(3000, () => {
    console.log(`listening on port 3000`)
});