document.addEventListener('DOMContentLoaded', async()=>{
    const ctx = document.getElementById('lineChart');
    const year_points = await getOscarsPer5Years();
    const labels = [];
    year_points.forEach(point =>{
      labels.push(point["Year"]);
    })

    const values = [];
    year_points.forEach(point =>{
      values.push(point["OscarNum"]);
    })

    const data = {
      labels: labels,
      datasets: [{
        label: 'Number of Oscars per 5 years',
        data: values,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };

    const config ={
      type: 'line',
      data: data
    }
    new Chart(ctx, config);
});

async function getOscarsPer5Years(){
    const response = await fetch('/api/oscarsPer5Years');
    const awards = await response.json()
    return awards;
}