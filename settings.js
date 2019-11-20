const fs = require('fs')
const path = require('path')
const joi = require('@hapi/joi')

const confFilePath = path.join(__dirname, 'etc/settings.json')

let settings = null

module.exports.get = function() {
    if (settings !== null) {
        return settings
    }

    try {
        settings = JSON.parse(fs.readFileSync(confFilePath))

        const schema = joi.object({
            dvid: joi.number().required().strict().integer().min(1),
            pass: joi.string().required(),
            baseUrl: joi.string().required().uri()
        })
        const result = schema.validate(settings)
        if (result.error !== undefined) {
            throw result.error
        }

        return settings
    }
    catch (e) {
        console.log(`etc/settings.json is invalid: ${e.message}`)
        process.exit(1)
    }
}
