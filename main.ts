import * as io from 'socket.io-client';
import * as json from 'jsonfile';
import { SSL_OP_EPHEMERAL_RSA } from 'constants';

const port = process.env.PORT || 1944;
const api = `http://localhost:${port}`;
const mainSocket = io(`${api}`);
const configFile = './config.json';
const config = json.readFileSync(configFile);
const http = require('http');
const fs = require('fs');

console.log(port);


mainSocket.on('connect', () => {
	process.on('SIGINT', () => {
		console.log('Shutting Down');
		mainSocket.emit('close', config.config.id);
		process.exit(0);
	})
    const id = config.config.id;
    mainSocket.emit('register', config.config);

    getAllFiles(config.files);
    fs.watchFile(`./files/${config.config.id}.ts`, (curr, prev) => {
        runMainFile();
    });

    mainSocket.on('command', command => {
        console.log(`New Command ${command}`);
        const fileToRun = findCommandFile(command);
        if (fileToRun)
            runFile(fileToRun);
    });
});

function getAllFiles(files: Object[]) {
    files.forEach(file => {
        var filename = file['title'] as string;
        var url = file['url'];

        let stream = fs.createWriteStream(`./files/${filename}`);
        http.get(`${api}/${url}`, response => {
            response.pipe(stream);
        });
    });
}

function runFile(fileName: string) {
    let file = require(`./files/${fileName}`);
    var data = file.run();
}

function findCommandFile(command: string): string | undefined {
    let commands = config.commands as Object[];
    let fileName = commands.find(c => c['command'] === command)['file'];

    return fileName;
}

function runMainFile() {
    let file = require(`./files/${config.config.id}`);
    setInterval(() => {
        let data = file.run();
        // Do something with the sensor data, possible over and over again
        emitNewData(data);
    }, 60000);
}

function emitNewData(data: any) {
    mainSocket.emit('data', {
        title: 'Temperature',
        value: data,
        type: 'number'
    });
}