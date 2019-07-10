import * as io from 'socket.io-client';
const port = process.env.PORT || 1944;
const api = `http://localhost:${port}`;

const mainSocket = io(api);


export function run() {
    mainSocket.emit('ack', 'ack');
}