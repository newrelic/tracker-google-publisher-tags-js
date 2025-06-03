import { GooglePublisherTagTracker } from './tracker'

document.addEventListener('readystatechange', (event) => {
    if (document.readyState === 'complete') {
        GooglePublisherTagTracker.init()
    }
})

if (window.addEventListener) {
    window.addEventListener('load', GooglePublisherTagTracker.init, false)
} else if (window.attachEvent) {
    window.attachEvent('onload', GooglePublisherTagTracker.init)
}

export * from 'newrelic-video-core'
export { GooglePublisherTagTracker }