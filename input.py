import sys
import json
from pathlib import Path

def parse_file(filename):
    """Parse a boss: deaths file into a dict."""
    data = {}
    with open(filename, "r", encoding="utf-8") as f:
        for line in f:
            if ":" in line:
                boss, deaths = line.strip().split(":", 1)
                data[boss.strip()] = int(deaths.strip())
    return data

def generate_html(datasets):
    """Generate an HTML page with one pie chart per dataset, without legend."""
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Boss Deaths Charts</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; }
    .chart-container { width: 500px; margin: 40px auto; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h2 { text-align: center; }
  </style>
</head>
<body>
  <h1 style="text-align:center;">Boss Deaths Pie Charts</h1>
"""

    for i, (filename, data) in enumerate(datasets.items()):
        labels = list(data.keys())
        values = list(data.values())
        html += f"""
  <div class="chart-container">
    <h2>{filename}</h2>
    <canvas id="chart{i}"></canvas>
  </div>
  <script>
    new Chart(document.getElementById('chart{i}'), {{
      type: 'pie',
      data: {{
        labels: {json.dumps(labels)},
        datasets: [{{
          data: {json.dumps(values)},
          backgroundColor: Array.from({json.dumps(values)}, (_, j) => `hsl(${{j * 360 / {len(values)}}}, 70%, 60%)`)
        }}]
      }},
      options: {{
        plugins: {{
          legend: {{
            display: false
          }}
        }}
      }}
    }});
  </script>
"""
    html += """
</body>
</html>
"""
    return html

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    datasets = {}
    for filename in sys.argv[1:]:
        path = Path(filename)
        datasets[path.stem] = parse_file(filename)

    html = generate_html(datasets)

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)

    print("Finished")
