const { execPromise, emojMap } = require('./_exec');
const path = require('path');
const kill = require('kill-port');

module.exports = (filePath, port) => {
  var cmd = path.basename(filePath, '.js');
  return {
    description: `runs the ${cmd} service`,
    builder: (yargs) => {
      yargs.option('port', {
        description: 'port to listen on',
        default: port || 8080
      }).example(`$0 run ${cmd}`);
    },
    command: `${cmd}`,
    handler: async(args, moreEnv = {}) => {
      try { await kill(port); }
      catch (e) {}
      var newEnv = {
        ...process.env,
        ...moreEnv,
        ZEUS_ARGS: JSON.stringify(args)
      }
      if (!args.skip_daemon)
        newEnv.DAEMONIZE_PROCESS = true;
      console.log(emojMap.cloud + 'Running service:', cmd.blue, "port:", port.toString().yellow);
      var stdout = await execPromise(`PORT=${port} node services/${cmd}/index.js`, {
        env: newEnv,
        printErrCB: console.error,
        printOutCB: console.log
      });
    }
  };
};
