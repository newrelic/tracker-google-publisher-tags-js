import * as nrvideo from 'newrelic-video-core'
import { version } from '../package.json'

export default class GooglePublisherTagTracker extends nrvideo.Tracker {
  /**
   * This static methods initializes the GPT tracker. Will be automatically called.
   * @static
   */
  static init () {
    let tracker = new GooglePublisherTagTracker()
    nrvideo.Core.addTracker(tracker)
    tracker.registerListeners()
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
   * Parses slot object to create attributes to send to new relic.
   */
  parseSlotAttributes (slot) {
    let responseInfo = slot.getResponseInformation()
    return {
      name: slot.getAdUnitPath(),
      slotId: slot.getSlotId().getId(),
      advertiserId: responseInfo.advertiserId,
      campaignId: responseInfo.campaignId,
      creativeId: responseInfo.creativeId,
      creativeTemplateId: responseInfo.creativeTemplateId,
      lineItemId: responseInfo.lineItemId,
      labelIds: responseInfo.labelIds,
      contentUrl: slot.getContentUrl(),
      elementId: slot.getSlotElementId(),
      timeSinceSlotLoad: this._timeSinceSlotLoad.getDeltaTime(),
      timeSinceSlotReceived: this._timeSinceSlotReceived.getDeltaTime(),
      timeSinceSlotRendered: this._timeSinceSlotRendered.getDeltaTime()
    }
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
        pubads.addEventListener('slotRequestedEvent', this.onSlotRequestedEvent.bind(this))
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
    this.send('SLOT_RENDERED', this.parseSlotAttributes(e.slot))
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
        let att = this.parseSlotAttributes(e.slot)
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
    this.send('SLOT_LOAD', this.parseSlotAttributes(e.slot))    
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
        let att = this.parseSlotAttributes(e.slot)
        att.serviceName = e.serviceName
        att.timeVisible = slotState.chrono.getDeltaTime()

        this.send('SLOT_HIDDEN', att)
        this._timeSinceLastSlotHidden.start()

        slotState.visible = false
      } else if (!slotState.visible && e.inViewPercentage >= 50) {
        let att = this.parseSlotAttributes(e.slot)
        att.serviceName = e.serviceName

        this.send('SLOT_VIEWABLE', att)

        slotState.chrono.start()
        slotState.visible = true
      }
    }
  }

  /**
   * Called once GPT fires 'onSlotRequestedEvent' event.
   * @param {Event} e
   */
  onSlotRequestedEvent (e) {
    nrvideo.Log.debug('onSlotRequestedEvent', e)
    this.send('SLOT_REQUESTED', this.parseSlotAttributes(e.slot))
  }

  /**
   * Called once GPT fires 'onSlotResponseReceived' event.
   * @param {Event} e
   */
  onSlotResponseReceived (e) {
    nrvideo.Log.debug('onSlotResponseReceived', e)
    this.send('SLOT_RECEIVED', this.parseSlotAttributes(e.slot))
    this._timeSinceSlotReceived.start()
  }
}
