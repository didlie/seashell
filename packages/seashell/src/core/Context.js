import Emitter from 'events'
import {I_HAVE_HANDLE_THIS_REQUEST} from './emit-types'
import {clearUnsafeHeaders} from './clearUnsafeHeaders'
import defaults from 'lodash/defaults'

class Context extends Emitter {
  constructor(socket, req){
    super();
    this.socket = socket;
    this.request = req;
    defaults(this.request, {params: {}});
    this.response = {
      headers: req.headers,
      body: {},
      end: () => {
        if (this.state.isHandled) throw new Error('ctx.response.end has been called!');
        this.state.isHandled = true;
        socket.send(clearUnsafeHeaders({
          headers: {...this.response.headers, type: 'I_HAVE_HANDLE_THIS_REQUEST'},
          body: this.response.body
        }));
        this.emit('close');
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