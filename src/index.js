import * as nrvideo from 'newrelic-video-core'
import Tracker from './tracker'

nrvideo.GooglePublisherTagTracker = Tracker

document.addEventListener('readystatechange', (event) => {
    if (document.readyState === 'complete') {
        Tracker.init()
    }    
})

if (window.addEventListener) {
    window.addEventListener('load', Tracker.init, false)
} else if (window.attachEvent) {
    window.attachEvent('onload', Tracker.init)
}

module.exports = nrvideo
