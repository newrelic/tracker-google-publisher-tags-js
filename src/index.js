import { Core } from 'newrelic-tracker-core'
import { GooglePublisherTagTracker } from './tracker'

Core.setEventType("GooglePublisherTagsEvent")

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

export * from 'newrelic-tracker-core'
export { GooglePublisherTagTracker }