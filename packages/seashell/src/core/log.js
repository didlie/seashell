import chalk from 'chalk'

const SeashellChalk = (color) => (msg) => {
  const log = chalk[color].bold(`[Seashell] ${msg}`);
  console.log(log)
};

const info = SeashellChalk('white');
const error = SeashellChalk('red');
const warn = SeashellChalk('yellow');

const SeashellDebug = (type, ...logs) => {
  let result = `[${type}]`;
  logs.forEach((log, index) => {
    if (index > 0) result += '\n';
    if (typeof log === 'string') {
      result += log;
    } else if (typeof log === 'object') {
      if (log.name && log.message && log.stack) {
        result += `[ERROR]:${'\n'}${log.stack}`
      } else {
        result += `[JSON]:${'\n'}${JSON.stringify(log)}`;
      }
    }
  });

  type === 'ERROR' ?
    error(result):
    info(result)

};

export {
  SeashellDebug
}