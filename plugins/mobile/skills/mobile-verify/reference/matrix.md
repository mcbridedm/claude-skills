# The device and settings matrix

Used by Step 1 when the profile has no `matrix`, and by Step 4 to judge each screenshot.

## Default matrix

Run the flow end to end on each platform's first device at default settings. Then capture the changed screens on the rest. Leave out what the app doesn't support (the profile's `supports`, else what the project declares: iPad support in the target's device family, orientations in `Info.plist` or the manifest), and say what was left out.

| Platform | Device | Settings |
|---|---|---|
| iOS | the newest standard iPhone | light, default text (the full flow) |
| iOS | the same iPhone | dark; the largest accessibility text size |
| iOS | the smallest iPhone the runtime offers | default |
| iOS | a foldable iPhone, if the runtime offers one | folded and open |
| iOS | an iPad, if the app supports it | portrait and landscape (a UI test rotates it); split view where the app supports multitasking |
| Android | a current phone profile, the newest API level installed | light, default font scale (the full flow) |
| Android | the same phone | dark; font scale 2.0 (or the largest offered); landscape |
| Android | a small phone profile | default |
| Android | a foldable profile, if the app supports large screens | folded and unfolded |
| Android | a tablet profile, if the app supports large screens | landscape |

`quick` runs only the first row of each platform.

## Foldables

A foldable is two layouts in one device, and the change between them is a bug source of its own. Where the platform lets you script it:
- capture the changed screen folded, then open it **with the app running**, then capture again: state (text typed, scroll position, the selected item) must survive;
- check which display a screenshot shows before judging it;
- an open foldable usually reports a wider size class than a phone: a layout built for phones only shows as a stretched single column.

When the posture can't be scripted, say so under "not checked" rather than guessing.

On the open screen, a phone layout scaled up (one stretched column, controls pinned to the far edges, a wide empty band) is a finding, not a pass, unless the project's design says the screen is meant to look that way.

## What to look for

For every screenshot, before the next:
- **Text:** nothing clipped, truncated without an ellipsis, or overlapping; at the largest text size the layout reflows (wraps, stacks, scrolls) rather than cutting off.
- **Safe areas:** nothing important under the status bar, camera cut-out or island, hinge, home indicator or navigation bar; nothing hidden behind the keyboard when a field has focus.
- **Size:** on tablets and open foldables, the layout uses the width (columns, a sidebar, a constrained reading width), not a stretched phone screen.
- **Dark mode:** no hard-coded white or black surfaces, no dark text on dark backgrounds, images and icons still visible.
- **Touch:** controls are large enough and far enough apart to hit; nothing interactive is only a few points high.
- **State:** the screen shows what the change promised, with real-looking data: the empty state, a long name, many items, an error, as Step 1 named.
- **Platform fit:** navigation, back behaviour, sheets, alerts and system controls behave as the platform's own apps do, unless the project's design guidelines say otherwise.

A finding names the screenshot, what's wrong, and where on the screen.
