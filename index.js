var path = require('path'),
    fs = require('fs');

var util = require('./lib/util'),
    logger = require('./lib/logger');

var cwd = process.cwd(),
    defOpts = {
        cwd: cwd,
        dirname: __dirname,
        // Prepend to generated file to prevent being scanned again.
        magicNum: '// Built by eustia.',
        data: {},
        enableLog: false,
        debug: false,
        encoding: 'utf-8',
        errorLog: false,
        packInfo: require('./package.json')
    },
    errLogPath = path.resolve(cwd, './eustia-debug.log');

exportCmd();

function cmdFactory(cmdName)
{
    var cmd = require('./cmd/' + cmdName);

    return function (options, cb)
    {
        cb = cb || util.noop;
        options = util.defaults(options, defOpts, cmd.defOpts);

        if (options.enableLog) logger.enable();
        if (options.debug) logger.debug = true;

        cmd(options, function (err)
        {
            if (err)
            {
                logger.error(err);
                if (options.errorLog)
                {
                    // Need to exit immediately, so async fs is not used.
                    fs.writeFileSync(errLogPath, logger.history(), 'utf-8');
                    process.exit();
                }
            }

            if (options.errorLog)
            {
                fs.exists(errLogPath, function (result)
                {
                    if (result) fs.unlink(errLogPath);
                });
            }

            cb(err);
        });
    };
}

function exportCmd()
{
    const COMMANDS = ['build', 'docs', 'search', 'install', 'help', 'version'];
    COMMANDS.forEach(function (cmd)
    {
        exports[cmd] = cmdFactory(cmd);
    });
}
