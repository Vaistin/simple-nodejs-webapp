document.addEventListener('DOMContentLoaded', async()=>{
    const ctx = document.getElementById('pieChart');
    const awards = await getOscarsByAward()

    const labels = [];
    awards.forEach(element =>{
        labels.push(element.Award);
    })

    const awardCount = [];
    awards.forEach(element =>{
        awardCount.push(element.Count);
    })
    
    const data = {
        labels: labels
        ,
        datasets: [{
          label: 'Number of oscars by type',
          data: awardCount
          ,
          backgroundColor: [
            'rgb(255, 0, 0)',
            'rgb(0, 9, 255)',
            'rgb(12, 129, 20)'
          ],
          hoverOffset: 4
        }]
      };
    const config = {
        type: 'pie',
        data: data
    }
    new Chart(ctx, config);
})

async function getOscarsByAward(){
    const response = await fetch('/api/oscarsByAward');
    const awards = await response.json()
    return awards;
}