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
tracker.setTargetingKey("age")
tracker.setTargetingKey("gender")
```

If no targeting keys are selected, all are captured by default.

You can also change the visibility level to set when `SLOT_VIEWABLE` and `SLOT_HIDDEN` are triggered:

```
// Set trigger level to 10%
tracker.setVisibilityTriggerLevel(10)
```

## Data Model
### Actions
The following event names are sent by the tracker as Browser Agent `Custom Events`.

| Action Name | Description | GPT Event |
|---|---|---|
| `SLOT_REQUESTED ` | An ad has been requested for a particular slot. | *slotRequested* |
| `SLOT_RECEIVED ` | An ad response has been received for a particular slot. | *slotResponseReceived* |
| `SLOT_LOAD ` | The slot has been loaded for the first time. | *slotOnload* |
| `SLOT_RENDERED ` | The slot has been rendered for the first time. | *slotRenderEnded* |
| `SLOT_VIEWABLE` | The slot is more viewable on the user screen (default 50%, it can be changed with `setVisibilityTriggerLevel()`). | *impressionViewable*, *slotVisibilityChanged* |
| `SLOT_HIDDEN ` | The slot that previously fired a `SLOT_VIEWABLE` is no longer viewable (default less than 50%, it can be changed with `setVisibilityTriggerLevel()`). | *slotVisibilityChanged* |

### Attributes

#### Common attributes
This is the list of attributes sent along with all `SLOT_` actions.

| Attribute | Description | Example |
|---|---|---|
| `libVersion` | GPT version. | *2020022701* |
| `slotName ` | Slot name. | */6355419/Travel/Europe/France/Paris* |
| `slotId` | Slot ID. | */6355419/Travel/Europe/France/Paris_0* |
| `contentUrl` | Content URL. | *https://securepubads.g....* |
| `elementId` | ID of DIV that contains the slot. | *banner1* |
| `trunc` | Request URL exceeded the character limit. | *True* |
| `advertiserId` | Advertiser ID. | *123456* |
| `campaignId` | Campaign ID. | *123456* |
| `creativeId` | Creative ID. | *123456* |
| `creativeTemplateId` | Creative template ID. | *123456* |
| `lineItemId` | Line item ID. | *123456* |
| `serviceName` | Name of the service that triggered the event. | *publisher_ads* |
| `targXXX` | Targeting keys with a "targ" prefix. | *targAge* |
| `timeSinceSlotRendered` | Time since `SLOT_RENDERED` of current slot was sent. In millis. | *12345* |
| `timeSinceSlotLoad` | Time since `SLOT_LOAD` of current slot was sent. In millis. | *12345* |
| `timeSinceSlotRequested` | Time since `SLOT_REQUESTED` of current slot was sent. In millis. | *12345* |
| `timeSinceSlotReceived` | Time since `SLOT_RECEIVED` of current slot was sent. In millis. | *12345* |

#### Action specific attributes
These attributes are sent along with specific actions.

| Attribute | Description | Example | Actions |
|---|---|---|---|
| `isEmpty` | Rendered slot is empty. | *False* | `SLOT_RENDERED` |
| `size` | Size of Ad slot. | *[200,200]* | `SLOT_RENDERED` |
| `timeSinceLastSlotHidden` | Time since `SLOT_HIDDEN` of current slot was sent. In millis. | *12345* | `SLOT_VIEWABLE` |
| `timeVisible` | Time during the slot was visible. In millis. | *12345* | `SLOT_HIDDEN` |
| `visibilityTriggerLevel` | Current visibility trigger level. | *50* | `SLOT_VIEWABLE`, `SLOT_HIDDEN` |
| `visibilityLevel` | Current visibility level of slot. | *100* | `SLOT_VIEWABLE`, `SLOT_HIDDEN` |

## Tracker Public API
Public functions to configure some options and tracking behaviour.

```
static init ()

Description: This static methods initializes the GPT tracker. Will be automatically called.

Arguments: None.

Return: {object} Tracker reference.
```

```
setTargetingKey (key)

Description: Add a targeting key to be sent as an attribute. If no one is set, by default all targetting keys ar sent.

Arguments:
	key: {string} The targeting key.

Return: Nothing.
```

```
getTargetingKeys ()

Description: Get targeting keys set with setTargetingKey().

Arguments: None.

Return: {object} Targeting keys.
```

```
flushTargetingKeys ()

Description: Remove all targeting keys set with setTargetingKey().

Arguments: None.

Return: Nothing.
```

```
setVisibilityTriggerLevel (level)

Description: Change visibility trigger level.

Arguments:
	level: {integer} Trigger level, percentage.

Return: Nothing.
```
