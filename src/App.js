import uuid from 'uuid'
import SocketIOClient from 'socket.io-client'
import Router from './Router'
import Emitter from './Emitter'

class App extends Router {

  state = {
    /**
     * 是否启动
     */
    isStarted: false,
    /**
     * 是否已经连接上hub
     */
    isOnline: false,
    /**
     * 是否已经注册, 只有注册后才能调用其他service
     */
    isRegistered: false,

    importEmitterStack: {}
  }

  /**
   * receive & handle message from hub
   * @param req
   */
  handleRequest = async (req) => {
    const {socket} = this.state
    const {handleLoop, exportActionStack} = this
    console.log('handle request: '+JSON.stringify(req))
    const res = {
      headers: {
        appId: req.headers.appId,
        callbackId: req.headers.callbackId
      },
      body: {},
      end: () => {
        socket.emit('I_HAVE_HANDLE_THIS_REQUEST', res)
      }
    }
    const next = (err, req, res, index, pathname) => {
      if (index < exportActionStack.length) {
        return handleLoop(err, req, res, next, index, pathname)
      }
      res.body.error = 'NOT_FOUND'
      res.end()
    }
    next(null, req, res, 0, req.headers.originUrl)
  }


  /**
   * push a request to MQ hub.
   * @param url `/${appname}/${originUrl}`
   * @param data
   * @returns {Promise}
   *
   * use `socket.emit` to push request
   * push a event callback to importEmitterStack every request
   * listening on `RESPONSE` event and return data
   */
  request = (url, data) => {
    const {socket, importEmitterStack, appId} = this.state
    return new Promise( (resolve, reject)=>{
      try {
        if (!this.state.isOnline) return reject("YOUR_SERVICE_IS_OFFLINE")
        /**
         * parse url, create req object
         */
        const callbackId = uuid.v4()
        const req = {
          body: data,
          headers: {
            appId: appId,
            callbackId: callbackId
          }
        }
        const s = url.search('/')
        if ( s < 0 ) {
          req.headers.importAppName = url
          req.headers.originUrl = '/'
        } else {
          const sUrl = s==0?url.substr(1):url
          let ss = sUrl.search('/')
          req.headers.importAppName = sUrl.substring(0, ss)
          req.headers.originUrl = sUrl.substring(ss)
        }


        console.log(`Start request servicehub, data: ${JSON.stringify(req)}`)

        /**
         * set callback
         * @type {Emitter}
         */
        importEmitterStack[callbackId] = new Emitter()
        importEmitterStack[callbackId].on('RESPONSE', (res) => {
          resolve(res)
          delete importEmitterStack[callbackId]
          return null
        })

        /**
         * send request
         */
        socket.emit('I_HAVE_A_REQUEST', req)
      } catch(e) {
        console.log(e)
        console.log(e.stack)
        reject(e)
      }
    })
  }


  /**
   * connect to MQ hub.
   * @param opts
   * @returns {boolean}
   */
  connect = (opts={}) => {
    if (this.state.isStarted) return false
    console.log(opts)
    const app = this
    const {handleRequest} = this
    const socket = SocketIOClient(opts.url)
    this.setState({
      opts: opts,
      appId: opts.key.appId,
      isStarted: true,
      socket: socket
    })

    socket.on('connect', () => {
      console.log('connected')
      console.log('start register')
      app.setState({isOnline: true})

      /**
       * IMPORTANT, every service should registered to work.
       */
      socket.emit('REGISTER', opts.key)
    })

    /**
     * handle hub's response about register
     * if there's some error, means register has failed
     * otherwise, it succeed
     */
    socket.on('YOUR_REGISTER_HAS_RESPONSE', (response) => {
      app.setState({
        isRegistered: true
      })
    })

    /**
     * handle response
     * response should have `callbackId` key.
     */
    socket.on('YOUR_REQUEST_HAS_RESPONSE', (res) => {
      const {importEmitterStack} = this.state
      const {callbackId} = res.headers
      importEmitterStack[callbackId].emit('RESPONSE', res)
      delete importEmitterStack[callbackId]
      app.setState({
        importEmitterStack: importEmitterStack
      })
    })

    /**
     * handle request
     */
    socket.on('PLEASE_HANDLE_THIS_REQUEST', handleRequest)

    /**
     * listing disconnect event
     */
    socket.on('disconnect', () => {
      console.log('disconnected')
      app.setState({isOnline: false})
    })
  }
}

export default App