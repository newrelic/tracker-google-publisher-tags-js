# newrelic-google-publisher-tag [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
#### [New Relic](http://newrelic.com) video tracking for google Publisher Tag

## Requirements
This video monitor solutions works on top of New Relic's **Browser Agent**.

## Usage
Just include the scripts inside `dist` folder to your page. See `sample` folder for example.

> If `dist` folder is not included, run `npm i && npm run build` to build it.

## Data Dictionary
The following event names are sent by the tracker as Browser Agent `Custom Events`.

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
    creativeId: responseInfo.creativeId,
    lineItemId: responseInfo.lineItemId,
    labelIds: responseInfo.labelIds,
    contentUrl: slot.getContentUrl(),
    elementId: slot.getSlotElementId()
  }
```
