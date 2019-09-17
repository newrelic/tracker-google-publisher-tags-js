import * as nrvideo from 'newrelic-video-core'
import Tracker from './tracker'

console.log('>>>>> INDEX <<<<<')

nrvideo.GooglePublisherTagTracker = Tracker

if (window.addEventListener) {
  window.addEventListener('load', Tracker.init, false)
} else if (window.attachEvent) {
  window.attachEvent('onload', Tracker.init)
}

module.exports = nrvideo
