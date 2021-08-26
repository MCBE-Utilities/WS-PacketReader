const WebSocket = require('ws')

const socket = 'ws://192.168.1.3:19131'

class WSSocket {
  constructor() {
    this.wssocket = new WebSocket.Server({ port: 5000 })
    this.server = undefined
    this.codemaker = undefined
    this.listener()
  }

  listener() {
    console.log('[INFO] Do /connect 127.0.0.1:5000')
    this.wssocket.on('connection', (server) => {
      this.server = server
      this.codemaker = new CodeMaker(this)
      this.socketListener()
    })
  }

  socketListener() {
    this.server.on('message', (data) => {
      console.log(data)
      this.codemaker.sendPacket(data)
    })
  }

  sendCommand(command, requestId) {
    this.server.send(JSON.stringify(
      {
        body: {
          commandLine: command,
          version: 1
        },
        header: {
          requestId: requestId,
          messagePurpose: "commandRequest",
          version: 1
        }
      }
    ))
  }

  sendBuffer(buffer) {
    this.server.send(buffer)
  }
}

class CodeMaker {
  constructor(wssocket) {
    this.socket = new WebSocket(socket, {
      perMessageDeflate: false
    })
    this.wssocket = wssocket
    this.publicKey = undefined
    this.salt = undefined
    this.listener()
  }

  listener() {
    this.socket.on('open', () => {})
    this.socket.on('error', () => {})
    this.socket.on('message', (data) => {
      console.log(data)
      if (data == undefined) return
      if (!data.includes('header')) return this.wssocket.sendBuffer(data)
      const parsedPacket = JSON.parse(data)
      if (parsedPacket.body.commandLine.startsWith('enableencryption')) {
        const token = parsedPacket.body.commandLine.replace('enableencryption ', '').split(' ')
        this.publicKey = token[0]
        this.salt = token[1]
      }
      this.wssocket.sendCommand(parsedPacket.body.commandLine, parsedPacket.header.requestId)
    })
  }

  sendPacket(packet) {
    this.socket.send(packet)
  }

}

new WSSocket()