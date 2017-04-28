import * as log from './log'

const bindEventHandlers = function () {
  this.socket.on('open', () => {
    console.info(`[Seashell] connected`);
    this.appState = 2;
  });


  this.socket.on('message', (data, flags) => {
    data = typeof data === 'string' ? JSON.parse(data): data;
    if (data.headers.type ===  'YOUR_REGISTER_HAS_RESPONSE') {
      console.info(`[Seashell] registered`);
      this.appState = 3;
    } else if (data.headers.type === 'YOUR_REQUEST_HAS_RESPONSE') {
      this.onResponse(data, flags)
    } else if (data.headers.type === 'PLEASE_HANDLE_THIS_REQUEST') {
      this.onRequest(data, flags)
    } else {
      console.log('Unknown message: ')
      console.log(data)
    }
  });

  this.socket.on('error', (err) => {
    console.error(err)
  })

  /**
   * listing disconnect event
   */
  this.socket.on('close', () => {
    console.info(`[Seashell] lost connection`);
    this.appState = 0;
    this.connect(this.appOptions)
  });
};

export {
  bindEventHandlers
}
