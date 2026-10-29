# Portrait format v3

`samples.json` is a list of portraits:

```
{ "id": "market.doorman", "name": "Doorman", "kind": "member", "sphere": "blue",
  "people": [ {"skin": "fair", "hair": "grey"}, ... ],   // person 0 = front, 1 and 2 behind
  "accent": "red",                                       // the uvwx ramp (ACCENTS in palette.py)
  "px": [48 strings of 48 keys] }
```

- `sphere`: a key of `SPHERES`. The game may pass another sphere at render time; only keys 1-5 and the doorway change.
- `people[n].skin` / `.hair`: names in `SKINS` / `HAIRS`. A missing person reuses the last listed one.
- `accent`: name in `ACCENTS` (headscarf, tie, cigar ember).

## Keys
| keys | ramp (dark to light) |
|---|---|
| `1 2 3 4 5` | sphere (clothes); `3` is always the sphere's own color |
| `A B C D` / `E F G H` | skin / hair of person 0 |
| `I J K L` / `M N O P` | skin / hair of person 1 |
| `Q R S T` / `U V W X` | skin / hair of person 2 |
| `a b c d` | gold · `e f g h` metal · `i j k l` linen · `m n o p` charcoal · `q r s t` wood · `u v w x` accent |
| `y` eye white · `z` ink · `!` glint | fixed |
| `.` | empty: the doorway shows through |
| `:` `^` `"` | see-through film (soap bubble): the doorway lightened 12% / 26% / 62%, never outlined |

## Rendering (render.py `grid`)
1. Doorway: round-topped arch in a 1px margin; frame ring, a lighter 2px lip on the right jamb, a lit wedge top-left,
   all from `palette.panel(sphere)` (dark, low-chroma, hue turned like a shadow).
2. Figure: each key's color from `palette.palette`.
3. Sel-out: an empty pixel touching the figure (4-neighbours) becomes that shape's outline. If the shape is to its
   right or below (the lit top-left side) it takes the shape's darkest step; otherwise `outline_of(darkest)`.
   Film keys and `!` never make an outline. Outlines between overlapping people are drawn into the px by
   `draw.Canvas.edge`.

## Files
- `palette.py` color system (OKLCH ramps; port to src/v4/art/portrait.js as is)
- `draw.py` drawing toolkit (masks, terminator shading, rims, edges, overlays, orphan lint)
- `render.py` renderer and sheets; `build.py` builds samples.json from `src/*.py` and renders `_renders/`
- `before_after.py` -> `before-after.png`
