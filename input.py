import json
from pathlib import Path

def parse_file(filename):
    data = {}
    with open(filename, "r", encoding="utf-8") as f:
        for line in f:
            if ":" in line:
                boss, deaths = line.strip().split(":", 1)
                data[boss.strip()] = int(deaths.strip())
    return data

def generate_color_map(datasets):
    bosses = sorted({boss for data in datasets.values() for boss in data})
    silksong_colors = [
        "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF",
        "#FF8C42", "#AA96DA", "#FF5D8F", "#00C2BA",
        "#FFE066", "#F72585",
    ]
    color_map = {}
    for i, boss in enumerate(bosses):
        color_map[boss] = silksong_colors[i % len(silksong_colors)]
    return color_map

def generate_html(datasets, color_map):
    # Build a list of all unique bosses across all datasets
    all_bosses = sorted({boss for data in datasets.values() for boss in data})

    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Boss Deaths Charts</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { 
      font-family: 'Cinzel', serif; 
      padding: 30px; 
      margin: 0;
      background: linear-gradient(135deg, #1e0f0f, #3b1d1d); 
      color: #f2e9dc;
    }
    h1 { 
      text-align: center; 
      margin-bottom: 40px; 
      color: #f5c16c; 
      text-shadow: 2px 2px 6px rgba(0,0,0,0.6);
    }
    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
      gap: 40px; 
      justify-content: center;
      max-width: 1400px;
      margin: 0 auto;
    }
    .chart-container { 
      width: 100%; 
      max-width: 400px;
      margin: 0 auto;
    }
    h2 { 
      text-align: center; 
      margin-bottom: 15px;
      color: #f5c16c;
    }
    canvas { 
      display: block;
      margin: 0 auto;
    }
    .bar-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 50px;
      margin-top: 50px;
      max-width: 1400px;
      margin-left: auto;
      margin-right: auto;
    }
  </style>
</head>
<body>
  <h1>Boss Deaths Pie Charts</h1>
  <div class="grid">
"""

    # Pie charts for each file
    for i, (filename, data) in enumerate(datasets.items()):
        labels = list(data.keys())
        values = list(data.values())
        colors = [color_map[boss] for boss in labels]

        html += f"""
    <div class="chart-container">
      <h2>{filename}</h2>
      <canvas id="pie{i}" width="300" height="300"></canvas>
    </div>
    <script>
      new Chart(document.getElementById('pie{i}'), {{
        type: 'pie',
        data: {{
          labels: {json.dumps(labels)},
          datasets: [{{
            data: {json.dumps(values)},
            backgroundColor: {json.dumps(colors)},
            borderColor: '#1e0f0f',
            borderWidth: 2
          }}]
        }},
        options: {{
          responsive: true,
          maintainAspectRatio: true,
          plugins: {{
            legend: {{
              display: false
            }}
          }}
        }}
      }});
    </script>
"""

    # Bar charts for each boss comparing files
    html += """
  </div>
  <div class="bar-grid">
"""

    for i, boss in enumerate(all_bosses):
        # Prepare values for this boss across all files
        values = [datasets[file].get(boss, 0) for file in datasets]
        labels = list(datasets.keys())
        color = color_map[boss]

        html += f"""
    <div class="chart-container">
      <h2>{boss}</h2>
      <canvas id="bar{i}" width="400" height="300"></canvas>
    </div>
    <script>
      new Chart(document.getElementById('bar{i}'), {{
        type: 'bar',
        data: {{
          labels: {json.dumps(labels)},
          datasets: [{{
            label: '{boss}',
            data: {json.dumps(values)},
            backgroundColor: '{color}',
            borderColor: '#1e0f0f',
            borderWidth: 2
          }}]
        }},
        options: {{
          responsive: true,
          maintainAspectRatio: true,
          plugins: {{
            legend: {{
              display: false
            }}
          }},
          scales: {{
            y: {{
              beginAtZero: true,
              ticks: {{
                color: '#f2e9dc',
                stepSize: 1
              }},
              grid: {{
                color: 'rgba(242, 233, 220, 0.2)'
              }}
            }},
            x: {{
              ticks: {{
                color: '#f2e9dc'
              }},
              grid: {{
                color: 'rgba(242, 233, 220, 0.2)'
              }}
            }}
          }}
        }}
      }});
    </script>
"""

    html += """
  </div>
</body>
</html>
"""
    return html

if __name__ == "__main__":
    data_folder = Path(__file__).parent / "data"

    if not data_folder.exists() or not data_folder.is_dir():
        print("Error: 'data' folder not found.")
        exit(1)

    datasets = {}
    for path in data_folder.glob("*.txt"):
        datasets[path.stem] = parse_file(path)

    if not datasets:
        print("No .txt files found in 'data' folder.")
        exit(1)

    color_map = generate_color_map(datasets)
    html = generate_html(datasets, color_map)

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)

    print("Finished: index.html generated")
