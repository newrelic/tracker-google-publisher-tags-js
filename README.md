# newrelic-google-publisher-tag [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
#### [New Relic](http://newrelic.com) monitoring for Google Publishers Tag

## Requirements
This solution works on top of New Relic's **Browser Pro + SPA Agent**.

## Usage
Include the scripts inside `dist` folder to your page. See `sample` folder for example.

> If `dist` folder is not included, run `npm i && npm run build` to build it.

To initialize the tracker, call method `init()` right after `enableServices()`:

```
...
googletag.enableServices()

let tracker = nrvideo.GooglePublisherTagTracker.init()
```

After having initialized the tracker, you can optionally select the targeting keys you want to be captured and sent over:

```
if (tracker != null) {
	tracker.setTargetingKey("age")
	tracker.setTargetingKey("gender")
	...
}
```

If no targeting keys are selected, all are captured by default.

## Data Dictionary
The following event names are sent by the tracker as Browser Agent `Custom Events`.

* `SLOT_REQUESTED`: An ad has been requested for a particular slot.
* `SLOT_RECEIVED`: An ad response has been received for a particular slot.
* `SLOT_LOAD`: The slot has been loaded for the first time.
* `SLOT_RENDERED`: The slot has been rendered for the first time.
* `SLOT_VIEWABLE`: The slot is more than 50% viewable on the user screen.
* `SLOT_HIDDEN`: The slot that previously fired a `SLOT_VIEWABLE` is no longer viewable (less than 50%).

### Common Attributes
This is how the attributes that are passed on every event are calculated:

```
  const responseInfo = slot.getResponseInformation()
  return {
    name: slot.getName(),
    slotId: slot.getSlotId().getId(),
    advertiserId: responseInfo.advertiserId,
    campaignId: responseInfo.campaignId,
    creativeTemplateId: responseInfo.creativeTemplateId,
    creativeId: responseInfo.creativeId,
    lineItemId: responseInfo.lineItemId,
    labelIds: responseInfo.labelIds,
    contentUrl: slot.getContentUrl(),
    elementId: slot.getSlotElementId(),
    trunc: truncState //True if contentURL contains "trunc=1"
  }
```
