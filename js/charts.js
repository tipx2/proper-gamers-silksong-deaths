function createPieCharts(datasets, colorMap) {
  const container = document.getElementById('playerCharts');
  let i = 0;
  for (const player in datasets) {
    const data = datasets[player];
    const sorted = Object.entries(data).sort((a,b) => b[1]-a[1]);
    const labels = sorted.map(x=>x[0]);
    const values = sorted.map(x=>x[1]);
    const colors = labels.map(l=>colorMap[l]);

    const div = document.createElement('div');
    div.className = 'chart-container';
    div.innerHTML = `
      <h2>${player}</h2>
      <canvas id="pie${i}"></canvas>
      <div class="stats">
        <p><b>Total tries:</b> ${values.reduce((a,b)=>a+b,0)}</p>
        <p><b>Unique bosses:</b> ${values.length}</p>
        <p><b>Toughest boss:</b> ${labels[0] || 'N/A'} (${values[0] || 0})</p>
        <p><b>Average tries per boss:</b> ${(values.reduce((a,b)=>a+b,0)/values.length).toFixed(2)}</p>
      </div>`;
    container.appendChild(div);

    new Chart(document.getElementById(`pie${i}`), {
      type: 'pie',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor:'#1e0f0f', borderWidth:2 }] },
      options: { responsive:true, maintainAspectRatio:true, plugins:{legend:{display:false}} }
    });
    i++;
  }
}

function createBossCharts(datasets, colorMap) {
  const container = document.getElementById('bossCharts');
  const allBosses = Object.keys(colorMap);
  let i=0;

  for (const boss of allBosses) {
    const playerData = Object.entries(datasets).filter(([p,d])=>d[boss]!==undefined)
                         .sort((a,b)=>b[1][boss]-a[1][boss]);
    if(!playerData.length) continue;

    const labels = playerData.map(x=>x[0]);
    const values = playerData.map(x=>x[1][boss]);

    const div = document.createElement('div');
    div.className='chart-container';
    div.innerHTML=`<h2>${boss}</h2><canvas id="bar${i}"></canvas>`;
    container.appendChild(div);

    new Chart(document.getElementById(`bar${i}`), {
      type:'bar',
      data: { labels, datasets:[{label:boss,data:values,backgroundColor:colorMap[boss],borderColor:'#1e0f0f',borderWidth:2}]},
      options:{
        responsive:true, maintainAspectRatio:true,
        plugins:{legend:{display:false}},
        scales:{
          y:{beginAtZero:true,ticks:{color:'#f2e9dc',stepSize:1},grid:{color:'rgba(242,233,220,0.2)'}},
          x:{ticks:{color:'#f2e9dc'},grid:{color:'rgba(242,233,220,0.2)'}}
        }
      }
    });
    i++;
  }
}

function createComparisonChart(datasets, colorMap = {}) {
  const p1Sel = document.getElementById('player1');
  const p2Sel = document.getElementById('player2');
  const ctx = document.getElementById('compareChart');

  if (!p1Sel || !p2Sel || !ctx) {
    console.error('createComparisonChart: missing #player1, #player2 or #compareChart in DOM');
    return;
  }

  // Populate selects (preserve previous selections if possible)
  const players = Object.keys(datasets);
  const prev1 = p1Sel.value;
  const prev2 = p2Sel.value;
  p1Sel.innerHTML = '';
  p2Sel.innerHTML = '';
  players.forEach(p => {
    const o1 = document.createElement('option');
    o1.value = p; o1.text = p;
    p1Sel.appendChild(o1);
    const o2 = o1.cloneNode(true);
    p2Sel.appendChild(o2);
  });

  if (prev1 && players.includes(prev1)) p1Sel.value = prev1;
  else p1Sel.value = players[0] || '';

  if (prev2 && players.includes(prev2)) p2Sel.value = prev2;
  else p2Sel.value = players.length > 1 ? players[1] : players[0] || '';

  // Destroy existing Chart (if any)
  let chart = Chart.getChart(ctx);
  if (chart) chart.destroy();

  // Create (empty) chart instance to keep consistent options object
  chart = new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: '#f2e9dc' } },
        tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.raw}` } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: '#f2e9dc', stepSize: 1 }, grid: { color: 'rgba(242,233,220,0.2)' } },
        x: { ticks: { color: '#f2e9dc' }, grid: { color: 'rgba(242,233,220,0.2)' } }
      }
    }
  });

  // Ensure there's a small note element under the chart for messages
  const container = ctx.closest('.compare-container') || document.body;
  let noteEl = container.querySelector('.compare-note');
  if (!noteEl) {
    noteEl = document.createElement('small');
    noteEl.className = 'compare-note';
    noteEl.style.display = 'block';
    noteEl.style.textAlign = 'center';
    noteEl.style.marginTop = '8px';
    noteEl.style.color = 'rgba(242,233,220,0.85)';
    container.appendChild(noteEl);
  }

  // Update function: compute common bosses, sort by combined tries, update chart
  function update() {
    const p1 = p1Sel.value;
    const p2 = p2Sel.value;

    // If neither selected, clear
    if (!p1 && !p2) {
      chart.data.labels = [];
      chart.data.datasets = [];
      chart.update();
      noteEl.textContent = '';
      return;
    }

    // Determine label list: common bosses if both selected, otherwise single player's bosses
    let labels = [];
    if (p1 && p2) {
      const b1 = Object.keys(datasets[p1] || {});
      const b2 = Object.keys(datasets[p2] || {});
      labels = b1.filter(b => b2.includes(b));
      // sort by total tries (desc) so the most relevant bosses are shown first
      labels.sort((a, b) => {
        const suma = (datasets[p1][a] || 0) + (datasets[p2][a] || 0);
        const sumb = (datasets[p1][b] || 0) + (datasets[p2][b] || 0);
        return sumb - suma;
      });
    } else if (p1) {
      labels = Object.keys(datasets[p1] || {}).sort((a,b)=> (datasets[p1][b]||0) - (datasets[p1][a]||0));
    } else { // only p2
      labels = Object.keys(datasets[p2] || {}).sort((a,b)=> (datasets[p2][b]||0) - (datasets[p2][a]||0));
    }

    if (!labels || labels.length === 0) {
      // show friendly message and clear chart
      chart.data.labels = ['No common bosses'];
      chart.data.datasets = [];
      chart.update();
      noteEl.textContent = (p1 && p2)
        ? 'No bosses in common between the two selected players.'
        : 'Selected player has no bosses recorded.';
      return;
    } else {
      noteEl.textContent = '';
    }

    const displayLabels = labels.map(l => l.replace(/\b\w/g, c => c.toUpperCase()));

    // Build datasets (gold and cream colors)
    const ds = [];
    if (p1) {
      ds.push({
        label: p1,
        data: labels.map(b => datasets[p1][b] || 0),
        backgroundColor: '#F5C16C',
        borderColor: '#C78F43',
        borderWidth: 1
      });
    }
    if (p2) {
      ds.push({
        label: p2,
        data: labels.map(b => datasets[p2][b] || 0),
        backgroundColor: '#F2E9DC',
        borderColor: '#CFC3AD',
        borderWidth: 1
      });
    }

    chart.data.labels = displayLabels;
    chart.data.datasets = ds;
    chart.update();
  }

  p1Sel.addEventListener('change', update);
  p2Sel.addEventListener('change', update);

  // initial update (select defaults were set above)
  update();
}


// Initialize all charts
createPieCharts(datasetsJS,colorMapJS);
createBossCharts(datasetsJS,colorMapJS);
createComparisonChart(datasetsJS,colorMapJS);