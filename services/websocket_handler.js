import EventEmitter from 'events';
import WebSocket from 'ws';
import Liveperson from './liveperson_connector.js';

// to open the connection to liveperson follow steps
// step 1 - get the required domains and construct required urls
// step 2 - request a jwt
// step 3 - open a websocket connection

var ws;
const eventEmitter = new EventEmitter();

class Websocket_Handler {
    async open_liveperson_websocket_connection () {
        var conversation_id;
        
        const lp = new Liveperson.Liveperson();
        await lp.set_up();

        const jwt = await lp.get_jwt_from_liveperson(lp.url_jwt);

        ws = new WebSocket(lp.url_ws);

        // upon opening the connection, initialise it with the jwt and start the conversation 
        ws.onopen = function(e) {
            console.log("[open] Establishing Connection", ws.readyState);
            // initiate the connection with the jwt
            ws.send(JSON.stringify(lp.ws_request_init(jwt)));
            // request a conversation id
            ws.send(JSON.stringify(lp.ws_request_conversation));
        };
        
        // handle messages received from LivePerson
        ws.onmessage = function(event) {
            var data = JSON.parse(event.data);
            console.log(`[message] Data received from server: ${event.data}`);
            // handle success (code=200)
            if (data['code'] == (200)) {
                switch (data['reqId']) {
                    case '0':
                        // connection opened. Nothing more to do
                        break;
                    case '1':
                        // conversation opened. Retrieve the conversation ID
                        conversation_id = data['body']['conversationId'];
                        console.log('conversation_id:',conversation_id);
                        break;
                    case '2':
                        // a message has been sent to the conversation successfully
                        console.log('received response with ID 2');
                        break;
                    case '3':
                        // the conversation has been closed successfully
                        console.log('received response with ID 3');
                        break;
                    default:
                        console.log('unknown event ID in received message');
                }
            // if there was an error, close the connection
            } else {
                console.log('failed with code', data['code']);
                ws.close();
            }
        };

        // send a message with conversation text to LivePerson when receiving the 'send message' event
        eventEmitter.on('send_message', (text_to_send) => {
            if (text_to_send) {
                // ensure the websocket is open and connected
                if (ws.readyState == 1) {
                    ws.send(JSON.stringify(lp.ws_request_send_message(text_to_send, conversation_id)));
                    console.log(`sent text <${text_to_send}> to liveperson conversation`)
                } else {
                    console.log('cannot send text, websocket not in open state. Try opening the conversation first')
                }
            } else {
                // the text to be sent was empty, so ignore the call
                console.log('no text sent. Try sending more text')
            }
        });

        eventEmitter.on('close_connection', () => {
            // ensure the websocket is open and connected
            if (ws.readyState == 1) {
                ws.send(JSON.stringify(lp.ws_request_close_conversation(conversation_id)));
                console.log(`liveperson conversation closed`)
            } else {
                console.log('cannot close conversation, websocket already closed.')
            }
        });
    };

    // alert the websocket to send a message to the conversation
    send_message(message) {
        eventEmitter.emit('send_message', message)
    };

    // alert the websocket to close the connection, if it is open, otherwise ignore
    close_connection() {
        eventEmitter.emit('close_connection')
    };
}

export default {Websocket_Handler}