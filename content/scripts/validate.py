"""Проверка данных курса. Выход ≠ 0 при ошибках."""
import csv, json, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]
d = json.loads((ROOT/"content/data/hsk1.json").read_text(encoding="utf-8"))
errs = []
def chk(c, m):
    if not c: errs.append(m)
idx = list(csv.DictReader(open(ROOT/"docs/source/data/06-source-reference-index.csv", encoding="utf-8-sig")))
ref = {k: {r["reference_id"] for r in idx if r["kind"] == k and r["level"] == lv}
       for k, lv in (("vocabulary_row","1"),("character_recognition","1"),("character_handwriting","1-2"))}
chk(len(d["words"]) == 300, f"слов {len(d['words'])} ≠ 300")
chk(len(d["charactersRecognition"]) == 246, "знаков узнавания ≠ 246")
chk(len(d["charactersWriting"]) == 100, "знаков письма ≠ 100")
PY = re.compile(r"^[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü’' /]+$")
seen = set()
for i, w in enumerate(d["words"], 1):
    chk(w["officialSerial"] == i, f"{w['id']}: номер")
    chk(w["id"] not in seen, f"{w['id']}: дубль"); seen.add(w["id"])
    chk(PY.match(w["pinyin"]) is not None, f"{w['id']}: пиньинь «{w['pinyin']}»")
    chk(w["hanzi"] and w["meaningsRu"] and w["meaningRuShort"], f"{w['id']}: пусто")
    chk((ROOT/"content"/w["audio"]).exists(), f"{w['id']}: нет звука")
if ref["vocabulary_row"]:
    chk({w["id"] for w in d["words"]} == ref["vocabulary_row"], "id слов не совпадают с индексом")
    chk({c["id"] for c in d["charactersRecognition"]} == ref["character_recognition"], "id знаков узнавания не совпадают с индексом")
    chk({c["id"] for c in d["charactersWriting"]} == ref["character_handwriting"], "id знаков письма не совпадают с индексом")
rec = {c["char"] for c in d["charactersRecognition"]}
missing = sorted({ch for w in d["words"] for ch in w["chars"]} - rec)
if missing: print("Иероглифы слов вне списка узнавания (допустимо):", "".join(missing))
if errs: print("ОШИБКИ:\n" + "\n".join(errs)); sys.exit(1)
print("Данные в порядке: 300 / 246 / 100")
