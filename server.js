import http from 'node:http';
import Blockchain from './blockchain.js';

const totalMiners = 3;

const minerID = parseInt(process.argv[2]);
const port = 8000 + minerID;

const peers = Array(totalMiners)
	.fill()
	.map((_, i) => i)
	.filter((id) => id != minerID);

console.log(`Peers: [${peers}]`);

const blockchain = new Blockchain();

http.createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
	res.setHeader('Access-Control-Max-Age', 2592000); // 30 days

	if (req.method === 'OPTIONS') {
		res.statusCode = 204;
		res.end();
	} else if (req.method === 'GET' && req.url == '/blocks') {
		res.statusCode = 200;
		res.write(blockchain.tojson());
		res.end();
	} else if (req.method === 'POST') {
		const body = [];
		req.on('data', (chunk) => {
			body.push(chunk);
		}).on('end', () => {
			const block = JSON.parse(Buffer.concat(body).toString());

			console.log('POST', req.url);

			if (req.url == '/addblock' || req.url == '/unminedblock') {
				blockchain.addBlock(
					block.prevHash,
					block.data,
					(minedBlock) => {
						peers.forEach(async (peerID) =>
							fetch(
								`http://localhost:${8000 + peerID}/minedblock`,
								{
									method: 'POST',
									body: JSON.stringify(minedBlock),
								}
							)
						);
					}
				);

				if (req.url == '/addblock') {
					peers.forEach(async (peerID) =>
						fetch(
							`http://localhost:${8000 + peerID}/unminedblock`,
							{
								method: 'POST',
								body: JSON.stringify(block),
							}
						)
					);
				}
			} else if (req.url == '/minedblock') {
				blockchain.recievedMinedBlock(block);
			}

			res.statusCode = 200;
			res.end();
		});
	} else {
		res.statusCode = 405;
		res.end();
	}
}).listen(port, '127.0.0.1', () => {
	console.log(`server listening at 127.0.0.1:${port}`);
});

export { minerID, totalMiners };
