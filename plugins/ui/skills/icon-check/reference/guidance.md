# What makes an icon read at small sizes

Guidance for Step 3, learned from icons that looked fine at 512 px and fell apart in a tab. Each point names the row of the sheet that shows it.

## Favicons (16 and 32 px)

- **Fill the tile.** At 16 px every pixel counts. Padding that looks balanced at 512 px leaves a 10 px drawing in a 16 px slot. Let the tile, or the mark itself, reach the edges; the browser adds its own spacing. (Sheet: the 8× zoom; the script reports how much of the tile the drawing covers.)
- **Thicken strokes at small sizes.** A stroke that is 1/32 of the width is half a pixel at 16 px and turns to grey smear. Strokes of at least 2 px at 16 px (about 1/8 of the width) hold up. A separate, heavier small-size drawing is normal, not a compromise.
- **Draw 16 px by hand on the pixel grid when outlines blur.** Downscaling puts edges between pixels. If the 8× zoom shows soft grey edges where you want crisp ones, draw the 16 px version pixel by pixel (and 32 px too if it blurs) and ship them as PNGs.
- **Keep a pixel's gap between shapes.** Two glyphs or parts that touch at 16 px merge into one shape and can read as a different symbol (two letters as a third, a mark and a bar as a single block). Leave at least one clear pixel between them. (Sheet: the 8× zoom.)
- **Pick a tile colour that contrasts with both light and dark tab bars.** Browsers draw the favicon on light grey, white, near-black and dark grey. A mid-tone or saturated tile stands out on all four; white or black tiles vanish on one theme, and a transparent glyph in one colour vanishes on the bar of the same lightness. (Sheet: the four tab rows; the script reports the weakest contrast.)
- **Fewer details.** Drop thin outlines, gradients, small text and secondary marks from the small sizes. The small icon only has to be recognisable as yours.

## Which file the browser uses

- **An SVG favicon wins where it's supported.** Browsers that support SVG favicons choose the SVG over size-specific PNGs and scale it to every size, so a hand-tuned 16 px PNG linked beside it is never shown there. Either drop the SVG link and ship PNGs (plus an ICO), or make the SVG itself read at 16 px (a heavier drawing, a media query for dark mode).
- **Link 16 and 32 px PNGs** with `sizes`, and keep a `favicon.ico` (16 and 32 entries) at the web root: some tools and older browsers request `/favicon.ico` regardless of the links.

## App icons

- **Manifest "any" icons (192, 512)** are shown as drawn, in install dialogs, splash screens and some launchers. Transparent padding is fine here.
- **Maskable icon:** full-bleed (the background fills the square, no transparent corners), with everything important inside the central circle of 80% of the width. Launchers crop to circles, squircles and rounded squares; the safe circle survives all of them. (Sheet: the dashed circle and the two crops.)
- **Apple touch icon (180):** opaque, square corners (iOS rounds them and fills transparency with black), and a little padding, since iOS doesn't crop. (Sheet: the 60 px home-screen preview.)
