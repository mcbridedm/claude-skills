# Screenshot walk

The panel's fallback when the app can't be run for this review: no simulator, emulator, device, browser or local instance is available, or the run was told not to use one. Panelists walk the latest verification screenshots in the order a user would meet them, as if using the app, and report the same way. Everything else in the skill stays: the personas, the journeys, the check against the code, the report.

A screenshot walk sees less than a live run. It shows what a screen looked like, not what happens when you tap. It can't time anything, try an attack or reach a state nobody captured. So it says plainly what it saw and what it didn't, and never fills a gap with a guess.

## When it runs

- **Explicitly:** the `screenshots` argument (`/architecture:user-panel-review screenshots [focus]`), or `run_mode: screenshots` in the profile.
- **Automatically** (`run_mode: auto`, the default): Step 0 can't start the app's visual surface (the run command fails, or the device, simulator, emulator or browser it needs isn't there), or the user or the session's brief says not to use one. If no screenshot set can be found either, stop as before: a panel with neither is a doc review, not this.
- **Never** with `run_mode: run`: the skill stops if the app won't start.

Say which applied, and why, in the run's header.

Surfaces that do run are still used live. If the visual app can't run but its API or CLI can, the agent personas use those as usual, and only the people personas walk screenshots. If an agent persona's surface can't run either, drop that persona and say so.

## Finding the screenshot set

1. **The profile's `screenshot_folder`**, if set: a folder of dated sets, or one set. It may be outside the repository (verification tools often write their run folders elsewhere).
2. **Otherwise, discover:**
   - the run or evidence folder another verify skill's profile names (for example `mobile-verify`'s), or one the project's docs point to (a "done" or verification record that links screenshots);
   - folders named like `verify`, `verification`, `evidence`, `screenshots`, `snapshots`, `ui-tests` or `artifacts`, in the repository or beside it, that hold dated sets (sub-folders or file prefixes like `YYYY-MM-DD`, `YYYYMMDD-HHMM` or a timestamp) of images (`.png`, `.jpg`, `.jpeg`, `.webp`);
   - exported UI-test attachments, if the project keeps them.
   Ignore app assets (icons, store artwork, marketing images) and design mock-ups: they show what was meant, not what was built.
3. **Pick the newest set** by the date in its name, then by file times. Use one set. Don't mix in older sets to fill gaps unless the profile allows it (`## Screenshot walk`); a step taken from an older set is labelled with that set's date.
4. **Record** the set's path, its date, and the commit it was taken at if it says (a report, a manifest, the folder name). Count the commits since then that touched the app's UI (`git log --oneline <commit>..HEAD -- <UI paths>`, the paths from the profile's `## Screenshot walk`, else the folders that hold the screens and the words files). Many commits since means the walk may be stale: say so in the header.
5. Check each file is an image before reading it. Skip empty or unreadable files and list them.

## Building the walk

A walk is one ordered list of steps per journey. Build it before briefing anyone:

1. **The journeys** come from the profile (`## Journeys`, `## Personas`), or the defaults in Step P. Where the project has design docs (flows, screen lists, wireframe notes), use them to say what steps each journey has and in what order.
2. **Match screenshots to steps**, in this order of trust:
   - a manifest in the set (a report with an image list, a JSON or Markdown index, UI-test attachment names) that says which flow and screen each image is;
   - flow and screen names in the file names (e.g. `<platform>-<device>-<setting>-<state>.png`, `03-onboarding-permissions.png`), and number prefixes for order;
   - the design docs' screen names, matched to the file names;
   - what the image shows, as a last resort. Say which images you placed this way.
3. **For each step,** pick one primary image (the default device and settings: light, default text size, the most common screen size) and list the variants (dark, the largest text, landscape, tablet, folded and open, other platforms) as extra views. Panelists read the primary; variants go to the personas whose lens needs them (anyone with poor sight or a large text setting reads that one; anyone on a tablet or foldable reads those).
4. **Mark each step** shown (an image covers it) or **not shown** (no image does). A step the design docs or the journey call for, with no image, is not shown. Never describe a not-shown step from the code or the docs as if it had been seen.
5. **Mark each journey:**
   - **fully shown:** every step has an image;
   - **partly shown:** some steps have images;
   - **not shown:** none do.
   If the steps come only from the images themselves (no design docs, no profile journeys with steps), say "steps inferred from the screenshots": a missing step can't be seen then, only suspected.
6. Write the walk to `<RUN_DIR>/walk.md`: each journey, its status, and its steps in order, each with its image path and variants or "not shown". Copy or link the images into `<RUN_DIR>/screenshots/` if the profile's report folder is in the repository and the set isn't, so the review can be read later; otherwise link the set's paths.

## The words the app uses

Panelists read the app's own words from the screenshots first. Where the project has them, they may also read:
- **words files**: the string or localisation resources the app shows (e.g. `Localizable.strings` or a string catalogue, `strings.xml`, `en.json` or other locale files, a copy deck). These are the words a user sees, not code. Use them to read text too small or clipped in an image, and to find the message a state would show. A string in the file is not proof that a screen shows it: cite it as "from the words file", not as seen.
- **design docs** for the journeys: to know a step's place in the journey and what it's for. A design doc saying a step works is not evidence that it does. Judge what the images show.

Copy the words files and design docs a panelist may read into `<RUN_DIR>/public/` with the public documents, so the allowed view stays explicit.

## The panelist brief

Screenshot walkers need no shell: dispatch them as `architecture:reviewer` (read-only, and it reads images), falling back to a general-purpose agent if it isn't available. Use Step 1's brief with these changes:

- **Replace** the "Use only this instance" paragraph with:
  ```
  You can't run the app in this review. Instead you walk screenshots of it, in the order a
  user meets them: <RUN_DIR>/walk.md lists each journey's steps and the image for each.
  Open every image (read the file) and use the app as if you were holding it: say what you
  see, what you'd do next and what you expect to happen, then open the next step's image and
  compare. Read the words on screen. You may also read <WORDS FILES> and <DESIGN DOCS> in
  <RUN_DIR>/public/; cite them as such, never as something you saw.
  A step marked "not shown" has no image. Write "not shown" for it and what you'd have
  needed to see there. Don't imagine it, and don't fill it from the words files or docs.
  ```
- **Replace** "do them for real" with "walk them in order".
- **For the bad actor,** replace the attack paragraph with: list the attacks these screens invite (an open field, a limit you can see, another user's data in view, an action with no confirmation), each with what you'd try and what would show it worked. Mark every one "not tried": the lead checks them in the code.
- **In each finding,** name the image (path) or "not shown", and the step.
- **Add to the report** a section `### Not shown` (the steps you needed to see and couldn't, by journey) after the findings.

## What changes in the review

- **Step 2:** `panel.md`'s header says the panel ran from screenshots, with the set's path, date and commit.
- **Step 3:** findings are checked against the code as usual, and also against time: if the screen's code changed after the set's commit, check whether the finding still holds and say so. Each "not tried" attack is checked in the code: CONFIRMED (the code lets it through), PLAUSIBLE, or held (name the defence). A finding that only exists because a step wasn't shown is not a finding; it goes under "Not shown".
- **Step 5:** the README opens with the mode block (below), and gains a **Not shown** section: every step no image showed, by journey, and which personas needed it. These are the next verification run's shopping list.

## The mode block

At the top of the review's README, before the summary:

```
Mode: screenshot walk (<explicit: argument | profile> | <automatic: why the app couldn't run>)
Set: <path>, <date>, commit <sha> (<n> UI commits behind HEAD) | commit unknown
Fully shown: <journeys>
Partly shown: <journey (steps not shown)>, ...
Not shown: <journeys>
Live surfaces used: <API, CLI, ...> | none
```
