import {SeashellDebug} from './debug'
import {Context} from './App/Context'
import {splitUrl} from './App/splitUrl'

const requestIntegration = function(url, body) {
  try {
    const headers = Object.assign({
      isFromIntegration: true,
    }, splitUrl(url));
    const {handleLoop} = this.integrations[headers.importAppName];
    return new Promise(async (resolve, reject) => {
      // SeashellDebug('INFO', 'handle integrate request', req);
      try {
        const ctx = new Context({
          emit: (type) => {
            if (type == 'I_HAVE_HANDLE_THIS_REQUEST') {
              resolve(ctx.response)
            } else {
              reject()
            }
          }
        }, {headers, body});
        handleLoop(ctx);
      } catch(e){
        reject(e)
      }

    });
  } catch(e){
    throw e
  }

};

export {
  requestIntegration
}