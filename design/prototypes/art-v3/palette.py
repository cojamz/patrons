# Portrait color system v3 (Cory, 2026-10-29: "these pixel arts still look pretty bad"). Port to src/v4/art/portrait.js
# exactly: every color here is computed from a few base hexes with the same OKLCH math, no tables of tweaked values.
#
# Keys (one character each, see FORMAT.md):
#   1 2 3 4 5   the sphere ramp (clothes), dark to light; 3 is the mid tone the seat reads by
#   A B C D     skin of person 0 (front), dark to light     E F G H   hair of person 0
#   I J K L     skin of person 1                            M N O P   hair of person 1
#   Q R S T     skin of person 2                            U V W X   hair of person 2
#   a b c d     gold        e f g h  metal      i j k l  linen (off-white cloth)
#   m n o p     charcoal    q r s t  wood/leather          u v w x  accent (named per portrait, default red)
#   y eye white   z ink (pupils, lash line)   ! glint (pure highlight)   . empty (the doorway shows through)
# Every 4- or 5-step ramp comes from ramp(): lightness steps around the base, darks rotate hue toward violet-red
# (cool shadows; yellows and golds swing through orange instead of green), lights rotate toward warm yellow.
import math

SPHERES = {'gold': '#e2962c', 'red': '#e0645a', 'magenta': '#d4508f', 'green': '#5fb37c', 'silver': '#a3b3c2',
           'white': '#eef3f8', 'purple': '#9a62e6', 'yellow': '#d3dd48', 'blue': '#6aa6dc', 'colorless': '#8d9693'}
TABLE, CARD = '#191310', '#d9ceb6'

# skin: base tone (the C step); the ramp shifts shadows toward red-violet
SKINS = {  # light to very deep; undertone in the name where it matters (Cory, Oct 29: a wider variety of skin tones)
    'palepink': '#f3d2c8',   # pale, pink undertone
    'porcelain': '#f0d8c2',  # pale, neutral
    'freckled': '#eec4a2',   # fair, warm (the artist adds freckles in step B)
    'fair': '#e6b994',       # light, warm
    'golden': '#d9aa6c',     # light-medium, golden/yellow undertone
    'olive': '#c39c74',      # medium, olive (green-grey) undertone
    'warmtan': '#c4834f',    # medium, warm
    'tan': '#a87452',        # medium-deep, neutral
    'coolbrown': '#8c5e4e',  # deep, cool (red-violet) undertone
    'brown': '#80522f',      # deep, warm
    'deep': '#5e3a28',       # very deep, warm
    'verydeep': '#402822',   # darkest, neutral
}
# hair: base tone (the G step)
HAIRS = {'black': '#2e2630', 'darkbrown': '#4a3226', 'brown': '#6e4a30', 'auburn': '#8a3e26', 'ginger': '#c06a30',
         'blonde': '#d8b060', 'ash': '#9a8e80', 'grey': '#a8a4a4', 'white': '#e4e0dc', 'blueblack': '#22263a'}
# fixed materials: base tone (the third of four steps)
MATERIALS = {'gold': '#e0a83a', 'metal': '#a8acb4', 'linen': '#e2d8c4', 'charcoal': '#4a4650', 'wood': '#8a5a36'}
ACCENTS = {'red': '#c8423a', 'teal': '#3a9a94', 'orange': '#e07a32', 'navy': '#34487a', 'rose': '#d87890',
           'ochre': '#c89a3a', 'violet': '#7a4ab0', 'green': '#4a8a4a'}
INK, EYEWHITE, GLINT = '#1c1424', '#e8e0d4', '#fffbf0'

# ---------- OKLab ----------
def _lin(c): c /= 255; return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def _gam(c): c = 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055; return c * 255
def hex2rgb(h): return [int(h[i:i + 2], 16) for i in (1, 3, 5)]
def rgb2hex(r): return '#' + ''.join('%02x' % max(0, min(255, round(v))) for v in r)

def to_oklch(h):
    r, g, b = (_lin(v) for v in hex2rgb(h))
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    return L, math.hypot(A, B), math.degrees(math.atan2(B, A)) % 360

def _lab2rgb(L, A, B):
    l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
    m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
    s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]

def from_oklch(L, C, h):
    L = max(0.0, min(1.0, L))
    for _ in range(40):  # pull chroma in until the color fits sRGB
        A, B = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
        rgb = _lab2rgb(L, A, B)
        if all(-0.0005 <= v <= 1.0005 for v in rgb): break
        C *= 0.93
    return rgb2hex([_gam(max(0, min(1, v))) for v in rgb])

def mix(a, b, t):
    A, B = hex2rgb(a), hex2rgb(b); return rgb2hex([x + (y - x) * t for x, y in zip(A, B)])

def _toward(h, target, deg):
    d = ((target - h + 540) % 360) - 180  # shortest signed way round
    return h + max(-deg, min(deg, d))

SHADOW_HUE, LIGHT_HUE = 300.0, 95.0
SKIN_SHADOW_HUE = 22.0  # skin shadows turn toward warm red, never violet (violet skin reads sickly)  # OKLCH hue that darks lean to (violet), and lights lean to (warm yellow)

def ramp(base, dl, base_i, dark_shift=14, light_shift=8, dark_chroma=1.0, light_chroma=0.82, shadow_hue=None):
    """Steps dark to light. dl: lightness offsets from the base for each step (the base_i one is 0).
    Each step away from the base on the dark side turns the hue dark_shift degrees toward SHADOW_HUE; light side
    light_shift degrees toward LIGHT_HUE. Yellows and golds (hue 60-130) turn through orange, never green."""
    L0, C0, h0 = to_oklch(base)
    out = []
    for i, d in enumerate(dl):
        k = i - base_i
        if k == 0: out.append(base); continue
        if k < 0:
            tgt = SHADOW_HUE if shadow_hue is None else shadow_hue
            if shadow_hue is None and 55 <= h0 <= 135: tgt = 30.0  # yellow/gold shadows go orange-brown
            h = _toward(h0, tgt, dark_shift * -k); C = C0 * dark_chroma ** -k
        else:
            h = _toward(h0, LIGHT_HUE, light_shift * k); C = C0 * light_chroma ** k
        out.append(from_oklch(L0 + d, C, h))
    return out

def sphere_ramp(base):
    """5 steps, the base always at key 3 so every seat reads by the same key."""
    L0 = to_oklch(base)[0]
    if L0 > 0.84:  # white, yellow: little room above, so the lights are small warm steps and the darks go further
        room = max(0.0, 0.99 - L0)
        return ramp(base, [-0.36, -0.18, 0, room * 0.5, room], 2, dark_shift=17, light_shift=10, dark_chroma=1.0)
    return ramp(base, [-0.30, -0.17, 0, 0.09, 0.17], 2, dark_chroma=1.0)

def skin_ramp(base):
    """4 steps. Light skin gets deeper shadows (so a brim's shadow reads), deep skin shallower (so faces never go black)."""
    L0 = to_oklch(base)[0]
    dl = [-0.33, -0.14, 0, 0.05] if L0 > 0.78 else ([-0.19, -0.09, 0, 0.065] if L0 > 0.6 else [-0.12, -0.06, 0, 0.075])
    return ramp(base, dl, 2, dark_shift=10, light_shift=6, dark_chroma=1.1, light_chroma=0.88, shadow_hue=SKIN_SHADOW_HUE)
def hair_ramp(base):
    L0 = to_oklch(base)[0]
    lift = 0.13 if L0 < 0.45 else 0.08
    return ramp(base, [-0.16 if L0 > 0.3 else -0.08, -0.08 if L0 > 0.3 else -0.04, 0, lift], 2, dark_shift=10)
def mat_ramp(base): return ramp(base, [-0.24, -0.12, 0, 0.09], 2)

def outline_of(darkest):
    """The sel-out color on the shadow side: the darkest step pushed further down and toward violet."""
    L, C, h = to_oklch(darkest)
    return from_oklch(max(0.13, L * 0.62), C * 0.8, _toward(h, SHADOW_HUE, 10))

PERSON_KEYS = [('ABCD', 'EFGH'), ('IJKL', 'MNOP'), ('QRST', 'UVWX')]
MAT_KEYS = {'gold': 'abcd', 'metal': 'efgh', 'linen': 'ijkl', 'charcoal': 'mnop', 'wood': 'qrst', 'accent': 'uvwx'}

def ramps_for(portrait, sphere=None):
    """{ramp name: (keys, colors)} for one portrait. sphere overrides the portrait's own (the game recolors)."""
    sph = sphere or portrait.get('sphere', 'colorless')
    base = SPHERES.get(sph, sph if str(sph).startswith('#') else SPHERES['colorless'])
    R = {'sphere': ('12345', sphere_ramp(base))}
    people = portrait.get('people') or [{'skin': 'fair', 'hair': 'brown'}]
    for n, (sk, hk) in enumerate(PERSON_KEYS):
        p = people[min(n, len(people) - 1)]
        R[f'skin{n}'] = (sk, skin_ramp(SKINS[p['skin']]))
        R[f'hair{n}'] = (hk, hair_ramp(HAIRS[p['hair']]))
    for m, keys in MAT_KEYS.items():
        b = ACCENTS[portrait.get('accent', 'red')] if m == 'accent' else MATERIALS[m]
        R[m] = (keys, mat_ramp(b))
    return R

def palette(portrait, sphere=None):
    """key -> color, key -> lit-side outline, key -> shadow-side outline, and key -> (ramp keys, index)."""
    col, lit, shade, where = {}, {}, {}, {}
    R = ramps_for(portrait, sphere)
    out = outline_of(R['sphere'][1][0])  # ONE shadow-side outline per portrait, from the sphere's darkest step
    for name, (keys, colors) in R.items():
        for i, k in enumerate(keys):
            col[k] = colors[i]; lit[k] = colors[0]; shade[k] = out; where[k] = (keys, i)
    col.update({'y': EYEWHITE, 'z': INK, '!': GLINT})
    for k in 'yz!': lit[k] = INK; shade[k] = out
    return col, lit, shade, where

def panel(sphere=None):
    """The doorway behind a member: a dark panel tinted by the sphere, a lit wall on the left, a frame."""
    base = SPHERES.get(sphere, sphere if str(sphere or '').startswith('#') else SPHERES['colorless'])
    _, C, h = to_oklch(base)
    h = _toward(h, 30.0 if 55 <= h <= 135 else SHADOW_HUE, 25)  # the doorway is a shadow: same hue turn as the ramps
    c = min(C, 0.06) * 0.55
    return {'frame': from_oklch(0.16, c * 0.8, h), 'lip': from_oklch(0.34, c * 1.1, h),
            'back': from_oklch(0.235, c, h), 'lit': from_oklch(0.275, c, h)}

if __name__ == '__main__':
    for s, b in SPHERES.items(): print(s.ljust(10), sphere_ramp(b))
    for s, b in SKINS.items(): print(s.ljust(10), skin_ramp(b))
    for s, b in HAIRS.items(): print(s.ljust(10), hair_ramp(b))
