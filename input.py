# generate_html.py
import json
from pathlib import Path
import colorsys

def parse_file(filename):
    data = {}
    with open(filename, "r", encoding="utf-8") as f:
        for line in f:
            if ":" in line:
                boss, tries = line.strip().split(":", 1)
                boss_norm = boss.strip().lower()
                try:
                    v = int(tries.strip())
                except:
                    continue
                data[boss_norm] = data.get(boss_norm, 0) + v
    return data

def generate_color_map(datasets):
    bosses = sorted({boss for data in datasets.values() for boss in data})
    n = len(bosses) or 1
    colors = []
    for i in range(n):
        hue = (i * 0.618033988749895) % 1.0  # golden-ratio for good spread
        r, g, b = colorsys.hsv_to_rgb(hue, 0.6, 0.95)
        colors.append("#{0:02X}{1:02X}{2:02X}".format(int(r*255), int(g*255), int(b*255)))
    return {bosses[i]: colors[i] for i in range(len(bosses))}

if __name__ == "__main__":
    data_folder = Path("data")
    if not data_folder.exists():
        print("No data/ folder found. Create it and add player .txt files.")
        raise SystemExit(1)

    datasets = {}
    for p in sorted(data_folder.glob("*.txt")):
        datasets[p.stem] = parse_file(p)

    if not datasets:
        print("No .txt files found in data/.")
        raise SystemExit(1)

    color_map = generate_color_map(datasets)
    out = Path("js/data.js")
    out.parent.mkdir(parents=True, exist_ok=True)
    js = "const datasetsJS = " + json.dumps(datasets, indent=2) + ";\n"
    js += "const colorMapJS = " + json.dumps(color_map, indent=2) + ";\n"
    out.write_text(js, encoding="utf-8")
    print("Wrote js/data.js")
