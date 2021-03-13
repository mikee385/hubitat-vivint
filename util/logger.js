var winston = require('winston')

var logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'debug',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.metadata(),
                winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
                winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message.trim()} ${Object.keys(info.metadata).length ? JSON.stringify(info.metadata, undefined, 4) : ''}`)
            ),
        }),
        new winston.transports.File({
            filename: './logs/all.log',
            level: 'debug',
            format: winston.format.combine(
                winston.format.metadata(),
                winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
                winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message.trim()} ${Object.keys(info.metadata).length ? JSON.stringify(info.metadata, undefined, 4) : ''}`)
            ),
        })
    ]
})
logger.stream = {
    write: function(message, encoding){
        logger.info(message)
    }
}

module.exports = logger
