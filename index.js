const request = require('request-promise-native')
const EventSource = require('eventsource')

const logger = require('./logger')
const settings = require('./settings').get()

const cookieJar = request.jar()
const req = request.defaults({
    baseUrl: settings.baseUrl,
    jar: cookieJar
})

const controller = require('./controller')

function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time))
}

let sse = null

async function onAction() {
    controller.peformAction()
}

function openSSE() {
    return new Promise((resolve, reject) => {
        sse = new EventSource(new URL('device/event', settings.baseUrl).href, {
            headers: { 'Cookie': cookieJar.getCookieString(settings.baseUrl) }
        })

        sse.onopen = e => {
            resolve()
        }
        sse.onmessage = async e => {
            switch (e.data) {
                case 'open':
                    break
                case 'action':
                    await onAction()
                    break
            }
        }
        sse.onerror = e => {
            sse.close()
            sse = null
            reject(new Error('sse disconnected'))
        }
    })
}

async function connect() {
    await req.post({
        url: '/device/login',
        form: { dvid: settings.dvid, pass: settings.pass }
    })

    if (sse === null) {
        await openSSE()
    }
}

async function mainLoop() {
    logger.info(`device running to server ${settings.baseUrl}`)

    while (true) {
        try {
            await connect()
            logger.info('connected')

            while (true) {
                await sleep(5000)

                const value = controller.readSensor()
                await req.post({
                    url: '/device/sensor',
                    form: { value: value }
                })
                logger.info(`sensor value ${value} reported`)
            }
        }
        catch (err) {
            if (sse !== null) {
                sse.close()
                sse = null
            }

            logger.info(`error: ${err.message}`)
            await sleep(1000)
        }
    }
}

mainLoop()
