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
| `:` `^` `"` | see-through film (soap bubble): white at 14% / ink #1c1424 at 42% / white at 85% over whatever is behind, never outlined |

## Rendering (render.py `grid`)
1. No doorway for members (round 2): transparent; the card or seat is the backdrop. `door=True` still draws the old arch.
2. Figure: each key's color from `palette.palette`.
3. Sel-out: an empty pixel touching the figure (4-neighbours) becomes an outline. If the shape is to its right or
   below (the lit top-left side) it takes the shape's darkest step; otherwise the portrait's ONE shared outline,
   `outline_of(sphere step 1)`. Shadow side wins. Film keys and `!` never make an outline. Outlines between
   overlapping people are drawn into the px by `draw.Canvas.edge`.
4. Film keys render as '#rrggbbaa' and composite over the backdrop.

## Template
`template.py` holds the head boxes, eye lines and shoulder lines for 1, 2 and 3 people and the face rules;
`python3 template.py samples.json template-check.png` draws them over every portrait.

## Files
- `palette.py` color system (OKLCH ramps; port to src/v4/art/portrait.js as is)
- `draw.py` drawing toolkit (masks, terminator shading, rims, edges, overlays, orphan lint)
- `render.py` renderer and sheets; `build.py` builds samples.json from `src/*.py` and renders `_renders/`
- `before_after.py` -> `before-after.png` (old portraits from `old6.json`)
- `template.py` head-size template; `critique/` the critic's rounds
