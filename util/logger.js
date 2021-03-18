var winston = require('winston')

const commonFormat = winston.format.combine(
    winston.format.metadata(),
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    winston.format.printf((info) => {
        let text = ""
    
        if (info.timestamp) {
            text += `${info.timestamp}\t`
        }
    
        text += `${info.level}:`
    
        if (typeof info.message === 'string' || info.message instanceof String) {
            text += `\t${info.message.trim()}`
        } else {
            text += `\t${info.message}`
        }
        
        if (info.metadata && Object.keys(info.metadata).length) {
            if (info.metadata.stack) {
                text += `\n${info.metadata.stack}`
            } else {
                text += ` ${JSON.stringify(info.metadata, undefined, 4)}`
            }
        }
    
        if (info.stack) {
            text += `\n${info.stack}`
        }
    
        return text
    })
)

var logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize(),
                commonFormat
            )
        }),
        new winston.transports.File({
            filename: './logs/debug.log',
            level: 'debug',
            format: commonFormat
        }),
        new winston.transports.File({
            filename: './logs/error.log',
            level: 'warn',
            format: commonFormat
        })
    ]
})
logger.stream = {
    write: function(message, encoding){
        logger.info(message)
    }
}

module.exports = logger
