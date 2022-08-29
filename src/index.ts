import { Server as WebSocketServer } from 'ws';
// eslint-disable-next-line no-unused-vars
import { fork, ChildProcess } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { filter } from './filter/filter';

const serverPort: number = 3000;
const socket = new WebSocketServer({ port: serverPort });
const writeFile = promisify(fs.writeFile);
const deleteFile = promisify(fs.unlink);

console.log('starting');

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // eslint-disable-next-line no-bitwise
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

socket.on('connection', function (ws: any) {
  console.log('conn');

  let child: ChildProcess | null = null;

  ws.on('message', async (message: string) => {
    const filename = uuidv4();
    const filepath = `./tmp/${filename}.js`;
    console.log(message);

    const restrictedKeyword = filter(message);

    if (message === 'EXIT' && child !== null) {
      try {
        child.kill();
        ws.send(`--- end ---`);
      } catch (error) {
        console.log(error); // Useful in the docker logs
        ws.send(error);
      }

      return;
    } else if (restrictedKeyword) {
      try {
        ws.send(`Restricted keyword: ${restrictedKeyword}`);
      } catch (error) {
        console.log(error);
        ws.send(error);
      }
    } else {
      const fullCode = `(async () => {
        ${message}
      })()`;

      await writeFile(filepath, fullCode);

      child = fork(filepath, [], {
        silent: true,
      });

      child?.stdout?.on('data', (data) => {
        const output = data.toString();
        ws.send(output);
      });

      child?.stderr?.on('data', (data) => {
        const output = data.toString();
        ws.send(output);
      });

      child?.stdout?.on('end', async () => {
        await deleteFile(filepath);
        ws.send(`--- end ---`);
      });
    }
  });
});
