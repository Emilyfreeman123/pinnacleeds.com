#!/usr/bin/env python3
"""Build every language version of pinnacleeds.com from _src/.

Run from anywhere:  python3 _src/build.py
Add a language:     add it to languages.json and create i18n/<code>.json (copy en.json).
Output goes to the repo root (index.html, <code>/index.html, accessibility pages, sitemap.xml).
"""
import html, json, re, sys
from datetime import date
from pathlib import Path

SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
SITE = "https://pinnacleeds.com"
LANGS = json.loads((SRC / "languages.json").read_text(encoding="utf-8"))
BASE = (SRC / "base.html").read_text(encoding="utf-8")
PAGES = {
    "home": (SRC / "home.html").read_text(encoding="utf-8"),
    "accessibility": (SRC / "accessibility.html").read_text(encoding="utf-8"),
}
FORM_JS = (SRC / "form.js").read_text(encoding="utf-8")
EN = json.loads((SRC / "i18n" / "en.json").read_text(encoding="utf-8"))


def prefix(code):
    return "/" if code == "en" else f"/{code}/"


def url_for(code, page):
    return prefix(code) + ("" if page == "home" else "accessibility/")


def render(tpl, ctx):
    def sub(m):
        key = m.group(1)
        if key not in ctx:
            raise KeyError(key)
        return ctx[key]
    return re.sub(r"\{\{([a-zA-Z0-9_]+)\}\}", sub, tpl)


def load(code):
    data = dict(EN)
    path = SRC / "i18n" / f"{code}.json"
    own = json.loads(path.read_text(encoding="utf-8"))
    missing = [k for k in EN if k not in own]
    if missing and code != "en":
        sys.exit(f"{code}: missing keys {missing}")
    data.update(own)
    return data


def build_page(lang, page):
    code = lang["code"]
    t = load(code)
    esc = {k: html.escape(v, quote=True) for k, v in t.items()}
    fonts = ["Inter:wght@400;500;600;700"] + lang["fonts"]
    font_url = "https://fonts.googleapis.com/css2?" + "&".join("family=" + f for f in fonts) + "&display=swap"

    hreflang = "\n".join(
        f'<link rel="alternate" hreflang="{l["code"]}" href="{SITE}{url_for(l["code"], page)}" />' for l in LANGS
    ) + f'\n<link rel="alternate" hreflang="x-default" href="{SITE}{url_for("en", page)}" />'
    og_alts = "\n".join(
        f'<meta property="og:locale:alternate" content="{l["locale"]}" />' for l in LANGS if l["code"] != code
    )
    items = []
    for l in LANGS:
        cur = ' aria-current="true"' if l["code"] == code else ""
        items.append(f'          <li><a href="{url_for(l["code"], page)}" lang="{l["code"]}" hreflang="{l["code"]}"{cur}>{l["name"]}</a></li>')

    ctx = dict(esc)
    ctx.update({
        "lang": code, "dir": lang["dir"], "lang_name": lang["name"], "og_locale": lang["locale"],
        "canonical": SITE + url_for(code, page), "hreflang": hreflang, "og_alternates": og_alts,
        "font_url": html.escape(font_url), "home": prefix(code), "a11y_href": url_for(code, "accessibility"),
        "lang_items": "\n".join(items),
        "f_ok_js": json.dumps(t["f_ok"], ensure_ascii=False),
        "f_err_js": json.dumps(t["f_err"], ensure_ascii=False),
    })
    if page == "home":
        ctx["page_title"], ctx["page_desc"] = esc["meta_title"], esc["meta_desc"]
        ctx["scripts_extra"] = render(FORM_JS, ctx)
        ld = {
            "@context": "https://schema.org", "@type": "ProfessionalService", "name": "Pinnacle EDS",
            "url": SITE, "email": "info@pinnacleeds.com", "foundingDate": "2026", "inLanguage": code,
            "description": t["meta_desc"],
            "areaServed": ["United States", "Qatar", "United Arab Emirates", "Saudi Arabia", "MENA Region"],
            "knowsAbout": ["Applied Behavior Analysis", "Special Education", "Government Education Reform",
                           "Institutional Compliance", "Trauma-Informed Practice"],
        }
        ctx["head_extra"] = '<script type="application/ld+json">\n' + json.dumps(ld, ensure_ascii=False, indent=2) + "\n</script>"
    else:
        ctx["page_title"], ctx["page_desc"] = esc["a11y_title"], esc["a11y_meta"]
        ctx["scripts_extra"] = ""
        ctx["head_extra"] = ""
    ctx["content"] = render(PAGES[page], ctx)
    out = render(BASE, ctx)
    dest = ROOT / (prefix(code).strip("/")) / ("" if page == "home" else "accessibility") / "index.html"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(out, encoding="utf-8")
    return dest


def build_sitemap():
    today = date.today().isoformat()
    rows = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for page in PAGES:
        for l in LANGS:
            rows.append("  <url>")
            rows.append(f"    <loc>{SITE}{url_for(l['code'], page)}</loc>")
            for a in LANGS:
                rows.append(f'    <xhtml:link rel="alternate" hreflang="{a["code"]}" href="{SITE}{url_for(a["code"], page)}" />')
            rows.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}{url_for("en", page)}" />')
            rows.append(f"    <lastmod>{today}</lastmod>")
            rows.append(f"    <priority>{'1.0' if page == 'home' and l['code'] == 'en' else '0.7' if page == 'home' else '0.3'}</priority>")
            rows.append("  </url>")
    rows.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(rows) + "\n", encoding="utf-8")


if __name__ == "__main__":
    built = [build_page(l, p) for l in LANGS if (SRC / "i18n" / f"{l['code']}.json").exists() for p in PAGES]
    build_sitemap()
    (ROOT / "site.js").write_text((SRC / "site.js").read_text(encoding="utf-8"), encoding="utf-8")
    print(f"built {len(built)} pages + sitemap.xml")
