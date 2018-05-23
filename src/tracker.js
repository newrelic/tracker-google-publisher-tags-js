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

    this.slots = {}
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
      name: slot.getName(),
      slotId: slot.getSlotId().getId(),
      advertiserId: responseInfo.advertiserId,
      campaignId: responseInfo.campaignId,
      creativeId: responseInfo.creativeId,
      lineItemId: responseInfo.lineItemId,
      labelIds: responseInfo.labelIds,
      contentUrl: slot.getContentUrl(),
      elementId: slot.getSlotElementId()
    }
  }

  /**
   * Register listeners.
   */
  registerListeners () {
    if (typeof googletag !== 'undefined') {
      googletag.cmd.push(() => {
        let pubads = googletag.pubads()
        pubads.addEventListener('slotRenderEnded', this.onSlotRenderEnded.bind(this))
        pubads.addEventListener('impressionViewable', this.onImpressionViewable.bind(this))
        pubads.addEventListener('slotOnload', this.onSlotOnload.bind(this))
        pubads.addEventListener('slotVisibilityChanged', this.onSlotVisibilityChanged.bind(this))
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

        slotState.visible = false
      } else if (!slotState.visible && e.inViewPercentage >= 50) {
        let att = this.parseSlotAttributes(e.slot)
        att.serviceName = e.serviceName

        this.send('SLOT_VISIBLE', att)

        slotState.chrono.start()
        slotState.visible = true
      }
    }
  }
}
