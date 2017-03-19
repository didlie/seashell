import Emitter from './Emitter'

class Context extends Emitter {
  constructor(socket, req){
    super();
    this.socket = socket;
    this.request = req;
    if (!req.hasOwnProperty('params')) this.request.params = {};
    this.response = {
      headers: req.headers,
      body: {},
      send: (packet) => {
        socket.emit('I_HAVE_HANDLE_THIS_REQUEST', {
          headers: this.response.headers,
          body: packet
        })
      },
      end: () => {
        this.state.isHandled = true;
        this.emit('end');
        socket.emit('I_HAVE_HANDLE_THIS_REQUEST', {
          headers: this.response.headers,
          body: this.response.body
        })
      }
    };
  }

  state = {
    isHandled: false
  };
}

export {
  Context
}