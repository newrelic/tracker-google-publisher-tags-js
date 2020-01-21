import * as nrvideo from 'newrelic-video-core'
import { version } from '../package.json'

export default class GooglePublisherTagTracker extends nrvideo.Tracker {
  /**
   * This static methods initializes the GPT tracker. Will be automatically called.
   * @static
   * @returns {object} Tracker reference.
   */
  static init () {
    let trackers = nrvideo.Core.getTrackers()
    for (let i = 0 ; i < trackers.length ; i++) {
      if (trackers[i] instanceof GooglePublisherTagTracker) {
        return null
      }
    }

    let tracker = new GooglePublisherTagTracker()
    nrvideo.Core.addTracker(tracker)
    tracker.registerListeners()
    return tracker
  }

  /**
   * Constructor
   */
  constructor (options) {
    super(options)

    this.reset()

    this.slots = {}
  }

  /** Resets all flags and chronos. */
  reset () {
    /**
     * Time since last SLOT_RECEIVED event, in milliseconds.
     * @private
     */
    this._timeSinceSlotReceived = new nrvideo.Chrono()

    /**
     * Time since last SLOT_RENDERED event, in milliseconds.
     * @private
     */
    this._timeSinceSlotRendered = new nrvideo.Chrono()

    /**
     * Time since last SLOT_LOAD event, in milliseconds.
     * @private
     */
    this._timeSinceSlotLoad = new nrvideo.Chrono()

    /**
     * Time since last SLOT_HIDDEN event, in milliseconds.
     * @private
     */
    this._timeSinceLastSlotHidden = new nrvideo.Chrono()

    /**
     * Time since last SLOT_REQUESTED event, in milliseconds.
     * @private
     */
    this._timeSinceSlotRequested = new nrvideo.Chrono()

    /**
     * List of Targeting keys to be included in the events.
     * @private
     */
    this._targetingKeys = []
  }

  /**
   * Returns tracker name.
   * @returns {String} Tracker name.
   */
  getTrackerName () {
    return 'google-publisher-tag'
  }

  /**
   * Returns tracker version. Fetched from package.
   * @returns {String} Tracker version.
   */
  getTrackerVersion () {
    return version
  }

  /**
   * Returns given slot info, or creates a new one.
   * @param {string} slotId Unique slot id.
   */
  getSlotState (slotId) {
    if (!this.slots[slotId]) { // first time
      this.slots[slotId] = {
        chrono: new nrvideo.Chrono(),
        visible: false
      }
    }
    return this.slots[slotId]
  }

  /**
   * Returns list of Targeting keys
   * @returns {Array} Targeting keys.
   */
  getTargetingKeys () {
    return this._targetingKeys
  }

  /**
   * Add a targeting key.
   * @param {string} ley Targeting key.
   */
  setTargetingKey (key) {
    this._targetingKeys.push(key)
  }

  /**
   * Flush targeting keys.
   */
  flushTargetingKeys () {
    this._targetingKeys = []
  }

  /**
   * Obtain targeting options.
   */
  parseTargetingKeys () {
    let dict = {}
    let keys = this._targetingKeys
    if (keys.length == 0) {
      keys = googletag.pubads().getTargetingKeys()
    }
    keys.forEach(key => {
      let targKey = 'targ' + key.charAt(0).toUpperCase() + key.slice(1)
      let value = googletag.pubads().getTargeting(key)
      if (Array.isArray(value)) {
        if (value.length > 0) {
          dict[targKey] = value.join(",")
        }
      }
      else {
        dict[targKey] = value
      }
    })
    return dict
  }

  /**
   * Parses slot object to create attributes to send to new relic.
   */
  parseSlotAttributes (event) {
    let slot = event.slot
    let responseInfo = slot.getResponseInformation()

    let contentUrl = new URL(slot.getContentUrl())
    let searchParams = new URLSearchParams(contentUrl.search)
    let truncState = false;

    for (const [key, value] of searchParams.entries()) {
      if (key == "trunc" && value == "1") {
        truncState = true
        break
      }
    }

    let attr = {
      name: slot.getAdUnitPath(),
      slotId: slot.getSlotId().getId(),
      contentUrl: slot.getContentUrl(),
      elementId: slot.getSlotElementId(),
      timeSinceSlotLoad: this._timeSinceSlotLoad.getDeltaTime(),
      timeSinceSlotReceived: this._timeSinceSlotReceived.getDeltaTime(),
      timeSinceSlotRendered: this._timeSinceSlotRendered.getDeltaTime(),
      timeSinceSlotRequested: this._timeSinceSlotRequested.getDeltaTime(),
      trunc: truncState
    }

    if (responseInfo != null) {
      attr = Object.assign(attr, {
        advertiserId: responseInfo.advertiserId,
        campaignId: responseInfo.campaignId,
        creativeId: responseInfo.creativeId,
        creativeTemplateId: responseInfo.creativeTemplateId,
        lineItemId: responseInfo.lineItemId,
        labelIds: responseInfo.labelIds,
        isEmpty: event.isEmpty,
        size: event.size
      })
    }

    let dict = Object.assign(attr, this.parseTargetingKeys())

    return dict
  }

  /**
   * Register listeners.
   */
  registerListeners () {
    if (window.googletag && googletag.apiReady) {
      googletag.cmd.push(() => {
        let pubads = googletag.pubads()
        pubads.addEventListener('slotRenderEnded', this.onSlotRenderEnded.bind(this))
        pubads.addEventListener('impressionViewable', this.onImpressionViewable.bind(this))
        pubads.addEventListener('slotOnload', this.onSlotOnload.bind(this))
        pubads.addEventListener('slotVisibilityChanged', this.onSlotVisibilityChanged.bind(this))
        pubads.addEventListener('slotRequested', this.onSlotRequested.bind(this))
        pubads.addEventListener('slotResponseReceived', this.onSlotResponseReceived.bind(this))
      })
    }
  }

  /**
   * Called once GPT fires 'onSlotRenderEnded' event.
   * @param {Event} e
   */
  onSlotRenderEnded (e) {
    nrvideo.Log.debug('onSlotRenderEnded', e)
    this.send('SLOT_RENDERED', this.parseSlotAttributes(e))
    this._timeSinceSlotRendered.start()
  }

  /**
   * Called once GPT fires 'onImpressionViewable' event.
   * @param {Event} e
   */
  onImpressionViewable (e) {
    nrvideo.Log.debug('onImpressionViewable', e)
    if (e && e.slot) {
      let id = e.slot.getSlotId().getId()
      let slotState = this.getSlotState(id)

      if (!slotState.visible) {
        let att = this.parseSlotAttributes(e)
        att.serviceName = e.serviceName

        this.send('SLOT_VIEWABLE', att)

        slotState.chrono.start()
        slotState.visible = true
      }
    }
  }

  /**
   * Called once GPT fires 'onSlotOnload' event.
   * @param {Event} e
   */
  onSlotOnload (e) {
    nrvideo.Log.debug('onSlotOnload', e)
    this.send('SLOT_LOAD', this.parseSlotAttributes(e))    
    this._timeSinceSlotLoad.start()
  }

  /**
   * Called once GPT fires 'onSlotVisibilityChanged' event.
   * @param {Event} e
   */
  onSlotVisibilityChanged (e) {
    nrvideo.Log.debug('onSlotVisibilityChanged', e)
    if (e && e.slot) {
      let id = e.slot.getSlotId().getId()
      let slotState = this.getSlotState(id)
      if (slotState.visible && e.inViewPercentage < 50) {
        let att = this.parseSlotAttributes(e)
        att.serviceName = e.serviceName
        att.timeVisible = slotState.chrono.getDeltaTime()

        this.send('SLOT_HIDDEN', att)
        this._timeSinceLastSlotHidden.start()

        slotState.visible = false
      } else if (!slotState.visible && e.inViewPercentage >= 50) {
        let att = this.parseSlotAttributes(e)
        att.serviceName = e.serviceName
        att.timeSinceLastSlotHidden = this._timeSinceLastSlotHidden.getDeltaTime()
        this.send('SLOT_VIEWABLE', att)

        slotState.chrono.start()
        slotState.visible = true
      }
    }
  }

  /**
   * Called once GPT fires 'onSlotRequested' event.
   * @param {Event} e
   */
  onSlotRequested (e) {
    nrvideo.Log.debug('onSlotRequested', e)
    this.send('SLOT_REQUESTED', this.parseSlotAttributes(e))
    this._timeSinceSlotRequested.start()
  }

  /**
   * Called once GPT fires 'onSlotResponseReceived' event.
   * @param {Event} e
   */
  onSlotResponseReceived (e) {
    nrvideo.Log.debug('onSlotResponseReceived', e)
    this.send('SLOT_RECEIVED', this.parseSlotAttributes(e))
    this._timeSinceSlotReceived.start()
  }
}
