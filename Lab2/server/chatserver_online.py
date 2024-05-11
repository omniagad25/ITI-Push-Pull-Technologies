import json

from simple_websocket_server import WebSocket, WebSocketServer


def get_message_content(message):
    message = json.loads(message)
    return message


def prepare_message(message_obj, clients):
    online_users = [client.username for client in clients]
    message = {"online": online_users}
    username = message_obj['name']
    message['sender'] = username
    if 'login' in message_obj and message_obj['login']:
        message['content'] = f'{username} has been connected'
    elif 'body' in message_obj and message_obj['body']:
        message['content'] = f"{username}: {message_obj['body']}"
    return json.dumps(message)


class ChatServer(WebSocket):
    clients = []

    @classmethod
    def send_message_to_all(cls, message):
        for client in cls.clients:
            client.send_message(message)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.username = None
        self.room = None

    def handle(self):
        received_message = get_message_content(self.data)
        if 'login' in received_message:
            self.username = received_message['name']
        elif 'private' in received_message:
            recipient = received_message['private']
            for client in self.__class__.clients:
                if client.username == recipient:
                    client.send_message(prepare_message(received_message, [self]))
                    break
        else:
            new_message = prepare_message(received_message, self.__class__.clients)
            self.__class__.send_message_to_all(new_message)

    def connected(self):
        print(f"New client connected: {self}")
        self.__class__.clients.append(self)

    def handle_close(self):
        print(f"Client {self.username} closed")
        message = {"content": f'{self.username} has been disconnected'}
        self.__class__.clients.remove(self)
        online_users = [client.username for client in self.__class__.clients]
        message['online'] = online_users
        message['logout'] = True
        self.__class__.send_message_to_all(json.dumps(message))


if __name__ == '__main__':
    server = WebSocketServer('', 8000, ChatServer)
    print(server)
    server.serve_forever()
