"""CIR chat server using websockets."""
import asyncio
import websockets
from websockets.asyncio.server import serve
import argparse


def checkArguments():
    """Check program arguments and return program parameters."""
    parser = argparse.ArgumentParser()
    parser.add_argument('-i', '--ip', default='localhost',
                        help='websockets server host / ip')
    parser.add_argument('-p', '--port', default=12345,
                        help='websockets server port')
    parser.add_argument('-v', '--verbose', action='store_false',
                        help='verbose mode')
    return parser.parse_args()


async def clientHandler(websocket):
    """Client Handler."""
    clients.add(websocket)

    if args.verbose:
        print(str(websocket.remote_address) + ' open connection')
    while True:
        try:
            message = await websocket.recv()
            if args.verbose:
                print(str(websocket.remote_address) + ' Message received: \"' +
                      message + '\"')
            for client in clients:
                await client.send(message)

        except websockets.ConnectionClosed:
            clients.remove(websocket)
            if args.verbose:
                print(str(websocket.remote_address) + ' close connection')
                break


async def main():
    """Main server loop."""
    async with serve(clientHandler, args.ip, args.port) as server:
        print('WebSockets server launch: ' + args.ip + ':' + str(args.port))
        await server.serve_forever()


clients = set()
args = checkArguments()
if args.ip == 'localhost':
    print('Warning: use real ip instead of localhost for external connections')
asyncio.run(main())
