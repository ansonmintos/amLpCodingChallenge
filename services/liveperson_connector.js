// contains all code for communicating with LivePerson server
import fetch from 'node-fetch';

class Liveperson {

    constructor(account_id) {
        this.account_id = account_id || '33246971';
    };

    // gets domains and URLs required to connect to liveperson
    async set_up() {
        await this.set_service_domains();
        await this.set_required_urls();
    };

    // get the domains required to open a conversation with liveperson - idp and asyncmessagingent
    // use async to force waiting for the domains to be returned before attempting to open a connection
    async set_service_domains() {
        this.domain_idp = await this.get_service_domain(this.account_id, 'idp');
        this.domain_asyncMessagingEnt = await this.get_service_domain(this.account_id, 'asyncMessagingEnt');
    };

    // use the domains to set the url endpoints for obtaining the jwt and opening the websocket
    async set_required_urls() {
        this.url_jwt = `https://${this.domain_idp}/api/account/${this.account_id}/signup`; // jwt url
        this.url_ws = `wss://${this.domain_asyncMessagingEnt}/ws_api/account/${this.account_id}/messaging/consumer?v=3`; // ws url
    };

    // domain retrievel API call
    async get_service_domain(account_id, service_name) {
        const url_domain_retrieval = `http://api.liveperson.net/api/account/${account_id}/service/${service_name}/baseURI.json?version=1.0`;
        var response = await fetch(url_domain_retrieval, {
            method: 'GET'
        })
            .then(response => response.json())  // convert to json
            .catch(err => console.log('Request Failed', err)); // Catch errors
        return response['baseURI'];
    };
    
    // POST request to get json web token
    // need the jwt before any further processing so wait for promise to be resolved using async
    async get_jwt_from_liveperson(url_jwt) {
        const response = await fetch(url_jwt, {
            method: "POST",
            headers: {"Content-type": "application/json;charset=UTF-8"}
        })
            .then(response => response.json())  // convert to json if successful
            .catch(err => console.log('Request Failed', err)); // Catch errors

        return response['jwt']; // json web token to authorise our websocket connection
    };
    
    // create the websocket request json to initiate the connection with the previously retrieved jwt
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

    // websocket request json to request a conversation
    ws_request_conversation = {
        "kind":"req",
        "id":1,
        "type":"cm.ConsumerRequestConversation"
    };

    // websocket request json to send text to an existing conversation
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

    ws_request_close_conversation(conversation_id) {
        return {
            "kind": "req",
            "id": "3",
            "type": "cm.UpdateConversationField",
            "body": {
                "conversationId": `${conversation_id}`,
                "conversationField": [{
                    "field": "ConversationStateField",
                    "conversationState": "CLOSE"
                }]
            }
        }
    };
};

export default {Liveperson}