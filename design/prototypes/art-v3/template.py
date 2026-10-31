# Head-size template for every member portrait (48x48). All 120 follow it; the critic checks it.
#   python3 template.py samples.json out.png    every portrait at 4x with its template drawn over it
#
# Boxes are (x0, y0, x1, y1) inclusive, the HEAD only (skin + hair mass, not hats or buns). eye = the row the eyes'
# lower lid sits on. shoulder = the row the shoulder line starts (the neck runs from chin+1 to shoulder-1).
# A head may move 1px sideways for a pose and a hat or hair may rise above the box, but never resize it. A behind-person
# who slumps or leans (asleep, drunk, on a shoulder) may drop up to 3px more; say so in the portrait's comment.
#
# FACE RECIPE (every head that shows its face; checked by the critic):
#   1. brow-shadow row: the row under the brows is one step darker across the eye sockets
#   2. side-of-nose shadow: the nose is a lit ridge plus a 1-2px shadow on its far side and a nostril pixel; no outline
#   3. cheek plane: one lit cluster (3+ px, step D) on the cheekbone nearest the light
#   4. chin shadow on the neck: the neck's top 2 rows are the darkest skin step
#   5. eyes: near 3-4px, far 2-3px; lid line in hair-dark or ink; pupil + at most one glint; BOTH eyes share one
#      expression (no wink, no half-lid smirk); mouth closed or a small oval, never a tooth bar
#   6. one head in three is a true 3/4 (far eye smaller, far cheek in the shadow plane, nose inside the far contour)
#   Light from the top-left; shadows as 1-2 big clusters, never single dark lines for wrinkles.
#
# MULTI-PERSON DEPTH RULE:
#   - the front person is the largest head, full value range, sphere steps 3-4 on the clothes
#   - each person behind: the template's smaller box (its eye line already sits 3px below the old "raised" spot),
#     clothes on sphere steps 1-2 only, skin one step darker (no D/L/T highlight step, base is the B/J/R step for
#     the lit side), and a sel-out edge (draw.Canvas.edge) where the front figure overlaps them
#   - never put the darkest-skinned person of a card behind, in shadow, and with the least friendly face: depth goes
#     by role, and tones are cast per card in audit.md
#   - colors: 22 per portrait, outlines included (build.py fails over it); people behind get 3 skin + 1-2 hair steps
#
# PROPS: one story prop per card, built from clusters of 3+ px that read at 1x.
TEMPLATE = {
    1: [dict(head=(15, 9, 32, 28), eye=19, shoulder=34)],
    2: [dict(head=(9, 11, 24, 28), eye=20, shoulder=35, note='front, left (mirror: x 23..38)'),
        dict(head=(27, 11, 39, 25), eye=20, shoulder=30, note='behind, right (mirror: x 8..20)')],
    3: [dict(head=(17, 13, 31, 29), eye=21, shoulder=36, note='front, centre'),
        dict(head=(4, 11, 15, 24), eye=18, shoulder=29, note='behind, left'),
        dict(head=(32, 11, 43, 24), eye=18, shoulder=29, note='behind, right')],
}

def slots(icon):
    n = min(3, max(1, len(icon.get('people') or [1])))
    t = TEMPLATE[n]
    if icon.get('mirror'):  # front person on the right
        t = [dict(s, head=(47 - s['head'][2], s['head'][1], 47 - s['head'][0], s['head'][3])) for s in t]
    return t

def guide(img, icon, sc):
    """Draw the template over a rendered portrait (cyan head boxes, magenta eye lines, yellow shoulder lines)."""
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)
    for s in slots(icon):
        x0, y0, x1, y1 = s['head']
        d.rectangle((x0 * sc, y0 * sc, (x1 + 1) * sc - 1, (y1 + 1) * sc - 1), outline=(0, 230, 230, 200))
        d.line((x0 * sc, (s['eye'] + 1) * sc - 1, (x1 + 1) * sc, (s['eye'] + 1) * sc - 1), fill=(255, 0, 200, 200))
        d.line((x0 * sc - 3 * sc, s['shoulder'] * sc, (x1 + 4) * sc, s['shoulder'] * sc), fill=(255, 220, 0, 200))

if __name__ == '__main__':
    import json, sys
    from PIL import Image
    import render
    icons = json.load(open(sys.argv[1]))
    im = Image.new('RGB', (len(icons) * (48 * 4 + 12) + 12, 48 * 4 + 24), render.P.CARD)
    for i, ic in enumerate(icons):
        t = render.image(ic, 4, bg=render.P.CARD); guide(t, ic, 4); im.paste(t, (12 + i * (48 * 4 + 12), 12))
    im.save(sys.argv[2])
