"""Импорт слов и знаков HSK 1 из официального PDF (syllabus.pdf) -> content/data/hsk1.raw.json.
Водяные знаки (крупный шрифт 66) отбрасываются по размеру символа."""
import json, re, sys, pathlib
import pdfplumber

ROOT = pathlib.Path(__file__).resolve().parents[2]
PDF = ROOT / "content/sources/syllabus.pdf"
OUT = ROOT / "content/data/hsk1.raw.json"

def clean_text(page):
    f = page.filter(lambda o: o.get("object_type") != "char" or o["size"] < 20)
    return f.extract_text() or ""

ROW = re.compile(r"^(\d{1,3}) (\d)(（[\d）（]+）)? (.+)$")
HAN = re.compile(r"[一-鿿]")
LEVEL_TAIL = re.compile(r"^(?P<word>\S+(?: \S+)*?) (?P<py>[A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü' ]+?)(?: (?P<pos>[一-鿿、（）,，后前缀]+.*))?$")

def parse_word_line(rest):
    # rest: "爱 ài 动" | "不客气 bú kèqi" | "本1 běn 量"
    toks = rest.split(" ")
    # слово = подряд идущие токены, начинающиеся с иероглифа (+ цифра-омоним)
    i = 0
    word_parts = []
    while i < len(toks) and HAN.match(toks[i][:1]):
        word_parts.append(toks[i]); i += 1
        # иероглифы слова из нескольких токенов встречаются редко ("打 电话" нет) – одно слово
        break
    word_tok = word_parts[0]
    word = re.sub(r"\d+$", "", word_tok)
    note = word_tok[len(word):]
    pinyin_parts = []
    while i < len(toks) and not HAN.search(toks[i]) and not toks[i].startswith("（"):
        pinyin_parts.append(toks[i]); i += 1
    pos = " ".join(toks[i:])
    return word, note, " ".join(pinyin_parts), pos

def main():
    words, rec, wri = [], [], []
    with pdfplumber.open(PDF) as pdf:
        for pn in range(80, 88):
            for line in clean_text(pdf.pages[pn - 1]).splitlines():
                m = ROW.match(line.strip())
                if not m or m.group(2) != "1":
                    continue
                n = int(m.group(1))
                word, note, py, pos = parse_word_line(m.group(4))
                words.append({"officialSerial": n, "hanzi": word, "pinyin": py, "pos": pos,
                              "sourceNote": (m.group(3) or "") + (("|омоним:" + note) if note else ""), "sourcePage": pn})
        for pn in (356, 357):
            txt = clean_text(pdf.pages[pn - 1])
            for m in re.finditer(r"(\d{1,3})\s*\.\s*([一-鿿])", txt):
                rec.append({"officialSerial": int(m.group(1)), "char": m.group(2), "sourcePage": pn})
        txt = clean_text(pdf.pages[377 - 1])
        for m in re.finditer(r"(\d{1,3})\s*\.\s*([一-鿿])", txt):
            wri.append({"officialSerial": int(m.group(1)), "char": m.group(2), "group": "1-2", "sourcePage": 377})
    words.sort(key=lambda x: x["officialSerial"])
    rec.sort(key=lambda x: x["officialSerial"]); wri.sort(key=lambda x: x["officialSerial"])
    for w in words: w["id"] = "HSK-V%05d" % w["officialSerial"]
    for r in rec: r["id"] = "HSK-1-character_recognition-%04d" % r["officialSerial"]
    for r in wri: r["id"] = "HSK-1-2-character_handwriting-%04d" % r["officialSerial"]
    OUT.write_text(json.dumps({"words": words, "charactersRecognition": rec, "charactersWriting": wri},
                              ensure_ascii=False, indent=1), encoding="utf-8")
    print(len(words), len(rec), len(wri))

if __name__ == "__main__":
    main()
