/* -------------------------------------------
   Low Quality Milk Detector (Domo ProCode)
   - Region slicer from dataset f042...906
   - Detect => run Workflow v1.0.1 + show latest suggestions
   - Send   => run Workflow v1.0.2
   - Uses Domo SDK if present; falls back to fetch
   ------------------------------------------- */

// If your ProCode build supports modules, you can also do:
// import domo from 'ryuu.js'; // optional; wrapper below still works

const app = document.getElementById("app");


const locationFilter = document.getElementById('regionSelect');
const detectBtn = document.getElementById('detectBtn');
const sendBtn = document.getElementById('sendBtn')



// ================= location filter ======================================
domo.get('/data/v1/regiondataset')
.then((res) => {

  const unique = new Set(res.map((val) => val.Region))
  let output;

  unique.forEach((val) => {
    output += `<option value="${val}">${val}</option>`
  })
  locationFilter.innerHTML = output;
})
.catch((err) => {
  console.log(err)
})
// =================================================================


detectBtn.addEventListener('click', () => {
  domo.post(
    `/domo/workflow/v1/models/LQM/start`,
    {
      'Region': locationFilter.value
    }
  ).then((res) => {
    console.log(res)
  })
  .catch((err) => {
    console.log(err)
  })

})
//========================================================================
sendBtn.addEventListener('click', () => {
  domo.post(
    `/domo/workflow/v1/models/MailTrigger/start`,
    {
      'Region': locationFilter.value
    }
  ).then((res) => {
    console.log(res)
  })
  .catch((err) => {
    console.log(err)
  })

})