"""raw + русские значения -> content/data/hsk1.json (и копия в web/public/data)."""
import json, pathlib, re, unicodedata
ROOT = pathlib.Path(__file__).resolve().parents[2]
raw = json.loads((ROOT/"content/data/hsk1.raw.json").read_text(encoding="utf-8"))
ru = {}
for line in (ROOT/"content/data/meanings_ru.txt").read_text(encoding="utf-8").splitlines():
    n, m = line.split("|", 1); ru[int(n)] = m.strip()
HAN = re.compile(r"[一-鿿]")
TONE = {"ā":("a",1),"á":("a",2),"ǎ":("a",3),"à":("a",4),"ē":("e",1),"é":("e",2),"ě":("e",3),"è":("e",4),
        "ī":("i",1),"í":("i",2),"ǐ":("i",3),"ì":("i",4),"ō":("o",1),"ó":("o",2),"ǒ":("o",3),"ò":("o",4),
        "ū":("u",1),"ú":("u",2),"ǔ":("u",3),"ù":("u",4),"ǖ":("v",1),"ǘ":("v",2),"ǚ":("v",3),"ǜ":("v",4)}
def numeric(py):
    out = []
    for syl in re.split(r"[ ’'/]+", py):
        t = ""; s = ""
        for ch in syl:
            if ch in TONE: s += TONE[ch][0]; t = str(TONE[ch][1])
            else: s += "v" if ch == "ü" else ch
        out.append(s.lower() + (t or "5"))
    return " ".join(out)
rec = {c["char"] for c in raw["charactersRecognition"]}
words = []
for w in raw["words"]:
    n = w["officialSerial"]; ms = [x.strip() for x in ru[n].split(";")]
    pos = [p for p in re.split(r"[、]", re.sub(r"[（）]", "", w["pos"])) if p]
    words.append({**w, "level": "1", "pos": pos,
        "meaningsRu": ms, "meaningRuShort": ms[0], "audio": f"audio/{w['id']}.m4a",
        "chars": [c for c in w["hanzi"] if HAN.match(c)],
        "status": {"meaning": "generated", "audio": "generated", "reviewedBy": None, "reviewedAt": None}})
data = {"schemaVersion": 1, "curriculum": {"id": "hsk3.0", "edition": "2025-11/2026-07",
        "sourceSha256": "d8b6646599bc9a0c9616a4cb06d4b37461f8792f70a3171016d00fcd8eda09ad"},
        "words": words, "charactersRecognition": raw["charactersRecognition"], "charactersWriting": raw["charactersWriting"]}
s = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
(ROOT/"content/data/hsk1.json").write_text(s, encoding="utf-8")
print("ok", len(words))
