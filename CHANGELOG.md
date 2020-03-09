# CHANGELOG

## Unreleased

## [0.9.0] - 2020/03/09
### Add
- Attribute `libVersion`.
- Attribute `serviceName` to all actions instead of only SLOT_VIEWABLE.
- Method to configure visibility trigger level.

### Change
- All attributes timeSinceXXX are now per slot.
- Some tweaks forced by GPT lib changes in latest versions.

### Documentation
- Updated and improved docs.

## [0.8.0] - 2020/02/26
### Change
- Rename attribute `name` to `slotName` to avoid clash.

## [0.7.0] - 2020/01/21
### Add
- Attribute `isEmpty` to action SLOT_RENDERED.
- Attribute `size` to action SLOT_RENDERED.
- Attribute `timeSinceSlotRequested`.

## [0.6.0] - 2019/10/25
### Change
- Fix misspelled event name.

## [0.5.1] - 2019/10/01
### Change
- Fix bug in tracker initialization.

## [0.5.0] - 2019/10/01
### Add
- Attribute `trunc`.
- Method to select targeting keys.
- Attribute `timeSinceLastSlotHidden`.
- Attribute `timeSinceSlotLoad`.
- Attribute `timeSinceSlotReceived`.
- Attribute `timeSinceSlotRendered`.

### Change
- Improve tracker initialization.
- Include targeting keys as attributes.

## [0.4.0] - 2019/09/20
### Add
- Attribute `creativeTemplateId`.
- New GPT events: googletag.events.SlotRequestedEvent and googletag.events.SlotResponseReceived.

### Change
- Init method.
- Fix calls to GPT deprecated functions.

## [0.3.0] - 2018/05/24
### Add
- `SLOT_LOAD` event.

## [0.2.0] - 2018/05/23
### Add
- `SLOT_RENDERED` event.

### Change
- `SLOT_VISIBLE` is now called `SLOT_VIEWABLE`.

### Documentation
- Added Data Dictionary to `README.md`.

## [0.1.0]
- First Version