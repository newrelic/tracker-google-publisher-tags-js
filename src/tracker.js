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
        return trackers[i]
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

    //TODO: move this functionality to _slotAttributes
    this.slots = {}
  }

  /** Resets all flags and chronos. */
  reset () {
    /**
     * List of Targeting keys to be included in the events.
     * @private
     */
    this._targetingKeys = []

    /**
     * Visibility trigger level.
     * @private
     */
    this._visibilityTriggerLevel = 50

    /**
     * Slot specific attributes.
     * @private
     */
    this._slotAttributes = {}

    /**
     * Time since last SLOT_HIDDEN event in milliseconds, by slot.
     * @private
     */
    this._timeSinceLastSlotHiddenBySlot = {}
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
   * Change visibility trigger level.
   * @param {integer} level Trigger level, percentage.
   */
  setVisibilityTriggerLevel (level) {
    if (level >= 0 && level <= 100) {
      this._visibilityTriggerLevel = level
    }
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
      libVersion: googletag.getVersion(),
      slotName: slot.getAdUnitPath(),
      slotId: slot.getSlotId().getId(),
      contentUrl: slot.getContentUrl(),
      elementId: slot.getSlotElementId(),
      trunc: truncState,
      serviceName: event.serviceName
    }

    // Get timers for current slot
    attr = this.generateTimerAttributesForSlot(slot.getSlotId().getId(), attr)

    if (responseInfo != null) {
      attr = Object.assign(attr, {
        advertiserId: responseInfo.advertiserId,
        campaignId: responseInfo.campaignId,
        creativeId: responseInfo.creativeId,
        creativeTemplateId: responseInfo.creativeTemplateId,
        lineItemId: responseInfo.lineItemId,
        isEmpty: event.isEmpty,
        size: event.size
      })
    }

    let dict = Object.assign(attr, this.parseTargetingKeys())

    return dict
  }

  /**
   * Generate timer attributes for a certain slot ID
   */
  generateTimerAttributesForSlot (slotId, attr) {
    if (this._slotAttributes[slotId] != undefined) {
      for (const [key, value] of Object.entries(this._slotAttributes[slotId])) {
        attr[key] = value.getDeltaTime()
      }
    }
    return attr
  }

  /**
   * Add last hidden timer to slot
   */
  addLastHiddenTimerToSlot (slotId) {
    let crono = new nrvideo.Chrono()
    crono.start()
    this._timeSinceLastSlotHiddenBySlot[slotId] = crono
  }

  /**
   * Get last hidden timer of a slot
   */
  getLastHiddenTimerFromSlot (slotId) {
    if (this._timeSinceLastSlotHiddenBySlot[slotId] instanceof nrvideo.Chrono) {
      return this._timeSinceLastSlotHiddenBySlot[slotId].getDeltaTime()
    }
    else {
      return null
    }
  }

  /**
   * Add timer to slot
   */
  addTimerToSlot (slotId, timerName) {
    let crono = new nrvideo.Chrono()
    crono.start()
    if (this._slotAttributes[slotId] == undefined) {
      this._slotAttributes[slotId] = {}
    }
    this._slotAttributes[slotId][timerName] = crono
  }

  /**
   * Append visibility related attributes
   */
  appendVisibilityAttributes (e, att) {
    att["visibilityTriggerLevel"] = this._visibilityTriggerLevel
    att["visibilityLevel"] = e.inViewPercentage
    return att
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
    let id = e.slot.getSlotId().getId()
    this.addTimerToSlot(id, "timeSinceSlotRendered")
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
        att = this.appendVisibilityAttributes(e, att)
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
    let id = e.slot.getSlotId().getId()
    this.addTimerToSlot(id, "timeSinceSlotLoad")
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
      if (slotState.visible && e.inViewPercentage < this._visibilityTriggerLevel) {
        let att = this.parseSlotAttributes(e)
        att.timeVisible = slotState.chrono.getDeltaTime()
        att = this.appendVisibilityAttributes(e, att)
        this.send('SLOT_HIDDEN', att)
        this.addLastHiddenTimerToSlot(id)

        slotState.visible = false
      } else if (!slotState.visible && e.inViewPercentage >= this._visibilityTriggerLevel) {
        let att = this.parseSlotAttributes(e)
        att.timeSinceLastSlotHidden = this.getLastHiddenTimerFromSlot(id)
        att = this.appendVisibilityAttributes(e, att)
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
    let id = e.slot.getSlotId().getId()
    this.addTimerToSlot(id, "timeSinceSlotRequested")
  }

  /**
   * Called once GPT fires 'onSlotResponseReceived' event.
   * @param {Event} e
   */
  onSlotResponseReceived (e) {
    nrvideo.Log.debug('onSlotResponseReceived', e)
    this.send('SLOT_RECEIVED', this.parseSlotAttributes(e))
    let id = e.slot.getSlotId().getId()
    this.addTimerToSlot(id, "timeSinceSlotReceived")
  }
}
