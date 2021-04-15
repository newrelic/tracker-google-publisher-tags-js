[![New Relic Experimental header](https://github.com/newrelic/opensource-website/raw/master/src/images/categories/Experimental.png)](https://opensource.newrelic.com/oss-category/#new-relic-experimental)

# New Relic GPT Tracker

New Relic monitoring for the Google Publishers Tag library.

## Requirements

This solution works on top of New Relic's **Browser Pro + SPA Agent**.

## Build

Install dependencies:

```
$ npm install
```

And build:

```
$ npm run build:dev
```

Or if you need a production build:

```
$ npm run build
```

## Usage

Include the scripts inside `dist` folder to your page. See `sample` folder for example.

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

## Support

New Relic has open-sourced this project. This project is provided AS-IS WITHOUT WARRANTY OR DEDICATED SUPPORT. Issues and contributions should be reported to the project here on GitHub.

We encourage you to bring your experiences and questions to the [Explorers Hub](https://discuss.newrelic.com) where our community members collaborate on solutions and new ideas.

## Contributing

We encourage your contributions to improve [Project Name]! Keep in mind when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. You only have to sign the CLA one time per project. If you have any questions, or to execute our corporate CLA, required if your contribution is on behalf of a company, please drop us an email at opensource@newrelic.com.

**A note about vulnerabilities**

As noted in our [security policy](../../security/policy), New Relic is committed to the privacy and security of our customers and their data. We believe that providing coordinated disclosure by security researchers and engaging with the security community are important means to achieve our security goals.

If you believe you have found a security vulnerability in this project or any of New Relic's products or websites, we welcome and greatly appreciate you reporting it to New Relic through [HackerOne](https://hackerone.com/newrelic).

## License

[Project Name] is licensed under the [Apache 2.0](http://apache.org/licenses/LICENSE-2.0.txt) License.
