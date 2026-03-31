
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const storage = require('./storage');

const app = express();
app.use(cors());

const TARGET = process.env.TARGET_API || "https://jsonplaceholder.typicode.com";

const server = app.listen(3000);
const wss = new WebSocketServer({ server });

let clients = [];
wss.on('connection', ws => clients.push(ws));

function broadcast(data){
  clients.forEach(c => c.send(JSON.stringify(data)));
}

app.use('*', async (req,res)=>{
  const start = Date.now();
  const response = await axios({
    method:req.method,
    url: TARGET + req.originalUrl
  });

  const latency = Date.now() - start;

  const log = {
    id: uuidv4(),
    url: req.originalUrl,
    status: response.status,
    latency,
    timestamp: new Date().toISOString()
  };

  storage.save(log);
  broadcast(log);

  res.json(response.data);
});

app.get('/logs', (req,res)=> res.json(storage.getAll()));

app.get('/dashboard', (req,res)=>{
res.send(`
<!DOCTYPE html>
<html>
<head>
<title>API Time Machine</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
body{background:#0f172a;color:white;font-family:sans-serif}
.container{padding:20px}
</style>
</head>
<body>
<div class="container">
<h2>🚀 API Time Machine Dashboard</h2>
<canvas id="chart"></canvas>
</div>

<script>
const ctx=document.getElementById('chart');
const chart=new Chart(ctx,{
 type:'line',
 data:{labels:[],datasets:[{label:'Latency',data:[]}]}
});

const ws=new WebSocket('ws://'+location.host);
ws.onmessage=(msg)=>{
 const log=JSON.parse(msg.data);
 chart.data.labels.push('');
 chart.data.datasets[0].data.push(log.latency);
 chart.update();
}
</script>
</body>
</html>
`);
});
