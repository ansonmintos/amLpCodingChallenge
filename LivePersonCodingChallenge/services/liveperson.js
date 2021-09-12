// contains all code for communicating with LivePerson server
import fetch from 'node-fetch';

class Liveperson {

    constructor(account_id) {
        this.account_id = account_id || '33246971';
    };

    async set_up() {
        await this.set_service_domains();
        await this.set_required_urls();
    }

    async set_service_domains() {
        this.domain_idp = await this.get_service_domain(this.account_id, 'idp'); //step 1
        this.domain_asyncMessagingEnt = await this.get_service_domain(this.account_id, 'asyncMessagingEnt');
    }

    async set_required_urls() {
        this.url_jwt = `https://${this.domain_idp}/api/account/${this.account_id}/signup`;
        this.url_ws = `wss://${this.domain_asyncMessagingEnt}/ws_api/account/${this.account_id}/messaging/consumer?v=3`;
    }

    async get_service_domain(account_id, service_name) {
        const url_domain_retrieval = `http://api.liveperson.net/api/account/${account_id}/service/${service_name}/baseURI.json?version=1.0`;
        var response = await fetch(url_domain_retrieval, {
            method: 'GET'
        })
            .then(response => response.json())  // convert to json
            .catch(err => console.log('Request Failed', err)); // Catch errors
        return response['baseURI'];
    };
    
    // POST request to get our json web token
    async get_jwt_from_liveperson(url_jwt) {
        // need the jwt before any further processing so wait for promise to be resolved
        const response = await fetch(url_jwt, {
            method: "POST",
            headers: {"Content-type": "application/json;charset=UTF-8"}
        })
            // Handle success
            .then(response => response.json())  // convert to json
            .catch(err => console.log('Request Failed', err)); // Catch errors

        return response['jwt']; // json web token to authorise our websocket connection
    };
    
    // websocket message to initiate the connection with jwt
    ws_request_init (jwt) {
        return {
            "kind": "req",
            "id": "0",
            "type": "InitConnection",
            "headers": [{
                "type": ".ams.headers.ClientProperties",
                "deviceFamily": "DESKTOP",
                "os": "WINDOWS"
            }, {
                "type": ".ams.headers.ConsumerAuthentication",
                "jwt": `${jwt}`
            }]
        }
    };

    // websocket message to request a conversation
    ws_request_conversation = {
        "kind":"req",
        "id":1,
        "type":"cm.ConsumerRequestConversation"
    };

    // websocket message to send text to an existing conversation
    ws_request_send_message (text, conversation_id) {
        return {
            "kind": "req",
            "id": "2",
            "type": "ms.PublishEvent",
            "body": {
                "dialogId": `${conversation_id}`,
                "event": {
                    "type": "ContentEvent",
                    "contentType": "text/plain",
                    "message": `${text}`
                }
            }
        }
    };
};

export default {Liveperson}