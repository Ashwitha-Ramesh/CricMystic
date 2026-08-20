#!/usr/bin/env python3
"""
Generates crisp, high-resolution vector SVG team logos for all 16 historical & active IPL franchises.
"""
import os

os.makedirs("public/assets/teams", exist_ok=True)

TEAMS_SVG = {
    "rcb": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="rcbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E01E26" />
      <stop offset="100%" stop-color="#8B0000" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCE043" />
      <stop offset="100%" stop-color="#D4AF37" />
    </linearGradient>
  </defs>
  <!-- Shield Base -->
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#rcbGrad)" stroke="url(#goldGrad)" stroke-width="3" />
  <path d="M60 12 L100 24 C100 68 60 102 60 102 C60 102 20 68 20 24 Z" fill="#0D0D11" opacity="0.85" />
  <!-- Crown / Lion Icon -->
  <path d="M42 38 L48 48 L60 34 L72 48 L78 38 L84 56 L36 56 Z" fill="url(#goldGrad)" />
  <!-- Rampant Lion Graphic -->
  <path d="M60 52 C52 52 48 58 48 64 C48 72 54 76 60 76 C66 76 72 72 72 64 C72 58 68 52 60 52 Z" fill="#E01E26" />
  <!-- Typography -->
  <text x="60" y="92" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="2">RCB</text>
</svg>""",

    "csk": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="cskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFDD00" />
      <stop offset="100%" stop-color="#F29F05" />
    </linearGradient>
    <linearGradient id="cskBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0066CC" />
      <stop offset="100%" stop-color="#003366" />
    </linearGradient>
  </defs>
  <!-- Shield Base -->
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#cskGrad)" stroke="url(#cskBlue)" stroke-width="3" />
  <path d="M60 12 L100 24 C100 68 60 102 60 102 C60 102 20 68 20 24 Z" fill="#0A1833" opacity="0.88" />
  <!-- Roaring Lion Mane -->
  <path d="M60 30 C45 30 38 42 38 54 C38 68 48 76 60 76 C72 76 82 68 82 54 C82 42 75 30 60 30 Z" fill="url(#cskGrad)" />
  <path d="M50 48 Q60 38 70 48 Q60 58 50 48 Z" fill="url(#cskBlue)" />
  <text x="60" y="92" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="url(#cskGrad)" text-anchor="middle" letter-spacing="2">CSK</text>
</svg>""",

    "mi": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="miBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#004BA0" />
      <stop offset="100%" stop-color="#002244" />
    </linearGradient>
    <linearGradient id="miGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D1AB3E" />
      <stop offset="100%" stop-color="#B8860B" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#miBlue)" stroke="url(#miGold)" stroke-width="3" />
  <circle cx="60" cy="52" r="24" fill="none" stroke="url(#miGold)" stroke-width="3" stroke-dasharray="6,4" />
  <!-- Sudarshan Chakra Razor Blades -->
  <path d="M60 32 L64 46 L78 50 L66 58 L68 72 L56 64 L44 70 L48 56 L36 50 L50 46 Z" fill="url(#miGold)" />
  <text x="60" y="94" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">MI</text>
</svg>""",

    "kkr": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="kkrPurple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4B2067" />
      <stop offset="100%" stop-color="#260C38" />
    </linearGradient>
    <linearGradient id="kkrGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#DAA520" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#kkrPurple)" stroke="url(#kkrGold)" stroke-width="3" />
  <!-- Knight Helmet / Flame -->
  <path d="M60 28 L74 46 L60 40 L46 46 Z" fill="url(#kkrGold)" />
  <path d="M44 48 C44 64 52 72 60 74 C68 72 76 64 76 48 Z" fill="url(#kkrGold)" opacity="0.9" />
  <text x="60" y="93" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="url(#kkrGold)" text-anchor="middle" letter-spacing="2">KKR</text>
</svg>""",

    "rr": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="rrPink" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EA1A85" />
      <stop offset="100%" stop-color="#9C0A52" />
    </linearGradient>
    <linearGradient id="rrBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#254AA5" />
      <stop offset="100%" stop-color="#102558" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#rrPink)" stroke="url(#rrBlue)" stroke-width="3" />
  <path d="M60 12 L100 24 C100 68 60 102 60 102 C60 102 20 68 20 24 Z" fill="url(#rrBlue)" opacity="0.7" />
  <!-- Royal Crown -->
  <path d="M38 42 L46 54 L60 36 L74 54 L82 42 L84 64 L36 64 Z" fill="#FCE043" />
  <circle cx="38" cy="38" r="3" fill="#FCE043" />
  <circle cx="60" cy="32" r="3.5" fill="#FCE043" />
  <circle cx="82" cy="38" r="3" fill="#FCE043" />
  <text x="60" y="92" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">RR</text>
</svg>""",

    "srh": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="srhOrange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF822A" />
      <stop offset="100%" stop-color="#CC4E00" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#srhOrange)" stroke="#000000" stroke-width="3" />
  <path d="M60 12 L100 24 C100 68 60 102 60 102 C60 102 20 68 20 24 Z" fill="#111111" opacity="0.85" />
  <!-- Rising Eagle Wings & Sun -->
  <circle cx="60" cy="46" r="14" fill="url(#srhOrange)" />
  <path d="M34 50 Q60 32 86 50 Q60 62 34 50 Z" fill="#FCE043" />
  <text x="60" y="93" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="url(#srhOrange)" text-anchor="middle" letter-spacing="2">SRH</text>
</svg>""",

    "dc": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="dcBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#004C93" />
      <stop offset="100%" stop-color="#002147" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#dcBlue)" stroke="#E03B26" stroke-width="3" />
  <path d="M42 36 L60 26 L78 36 L78 60 L60 74 L42 60 Z" fill="#E03B26" />
  <path d="M50 44 L60 36 L70 44 L70 56 L60 64 L50 56 Z" fill="#FFFFFF" />
  <text x="60" y="94" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">DC</text>
</svg>""",

    "pbks": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="pbksRed" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DD1F2D" />
      <stop offset="100%" stop-color="#800000" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#pbksRed)" stroke="#C0C0C0" stroke-width="3" />
  <path d="M60 28 C50 28 44 38 44 50 C44 62 50 70 60 72 C70 70 76 62 76 50 C76 38 70 28 60 28 Z" fill="#C0C0C0" opacity="0.9" />
  <text x="60" y="93" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">PBKS</text>
</svg>""",

    "gt": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="gtNavy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1B2133" />
      <stop offset="100%" stop-color="#0B0E17" />
    </linearGradient>
    <linearGradient id="gtGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2C974" />
      <stop offset="100%" stop-color="#BCA96C" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#gtNavy)" stroke="url(#gtGold)" stroke-width="3" />
  <!-- Lightning Prism -->
  <path d="M60 28 L76 52 L60 50 L68 74 L44 50 L60 52 Z" fill="url(#gtGold)" />
  <text x="60" y="94" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="url(#gtGold)" text-anchor="middle" letter-spacing="3">GT</text>
</svg>""",

    "lsg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="lsgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0057B7" />
      <stop offset="100%" stop-color="#A72056" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#lsgGrad)" stroke="#FFB81C" stroke-width="3" />
  <path d="M38 46 Q60 30 82 46 Q60 58 38 46 Z" fill="#FFB81C" />
  <text x="60" y="93" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">LSG</text>
</svg>""",

    "dc_old": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="dcoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09244B" />
      <stop offset="100%" stop-color="#1A3B6E" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#dcoGrad)" stroke="#F2F4F7" stroke-width="3" />
  <!-- Charging Bull Horns -->
  <path d="M42 42 C48 32 54 36 60 44 C66 36 72 32 78 42 C72 58 60 68 60 68 C60 68 48 58 42 42 Z" fill="#F2F4F7" />
  <text x="60" y="92" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#F2F4F7" text-anchor="middle" letter-spacing="2">DC</text>
</svg>""",

    "rps": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="rpsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#D11D5B" />
      <stop offset="100%" stop-color="#7B2C79" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#rpsGrad)" stroke="#FCE043" stroke-width="3" />
  <path d="M40 44 L60 30 L80 44 L60 68 Z" fill="#FCE043" opacity="0.9" />
  <text x="60" y="93" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">RPS</text>
</svg>""",

    "gl": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="glGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E05021" />
      <stop offset="100%" stop-color="#3F5874" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#glGrad)" stroke="#FFFFFF" stroke-width="3" />
  <circle cx="60" cy="50" r="18" fill="#FFFFFF" opacity="0.85" />
  <text x="60" y="94" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="3">GL</text>
</svg>""",

    "pwi": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="pwiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#29ABE2" />
      <stop offset="100%" stop-color="#004A80" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#pwiGrad)" stroke="#FFFFFF" stroke-width="3" />
  <path d="M58 26 L62 26 L62 70 L58 70 Z" fill="#FFFFFF" />
  <path d="M48 38 L60 26 L72 38 Z" fill="#FFFFFF" />
  <text x="60" y="93" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">PWI</text>
</svg>""",

    "ktk": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <defs>
    <linearGradient id="ktkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6F2C91" />
      <stop offset="100%" stop-color="#FF6600" />
    </linearGradient>
  </defs>
  <path d="M60 6 L108 20 C108 72 60 112 60 112 C60 112 12 72 12 20 Z" fill="url(#ktkGrad)" stroke="#FFFFFF" stroke-width="3" />
  <!-- Elephant Tusk -->
  <path d="M46 54 C46 38 60 32 60 32 C60 32 74 38 74 54 C70 66 60 70 60 70 C60 70 50 66 46 54 Z" fill="#FFFFFF" opacity="0.9" />
  <text x="60" y="93" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">KTK</text>
</svg>"""
}

for key, svg_data in TEAMS_SVG.items():
    fpath = f"public/assets/teams/{key}.svg"
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(svg_data.strip())
    print(f"Generated team logo: {fpath}")

print("All 16 vector team logos generated successfully.")
