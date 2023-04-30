import Block from './block.js';

class Blockchain {
	constructor() {
		this.minedBlocks = new Map();
		this.unminedBlocksStopFuncs = new Map();
	}

	addBlock(prevHash, data, callback) {
		if (!(prevHash == null || this.minedBlocks.has(prevHash))) {
			throw Error('Invalid prevHash: ' + prevHash);
		}

		const block = new Block(
			prevHash,
			data,
			prevHash == null
				? 1
				: this.minedBlocks.get(prevHash).chainLength + 1
		);

		console.log('Mining block', prevHash, data);

		// this.unminedBlocks.set(block.prevHash + block.data, block);

		const stopFunc = block.mine(() => {
			this.minedBlocks.set(block.hash, block);

			this.unminedBlocksStopFuncs.delete(
				String(block.prevHash) + String(block.data)
			);

			console.log('Mined', block);

			if (typeof callback == 'function') {
				callback(block);
			}
		});

		this.unminedBlocksStopFuncs.set(
			String(block.prevHash) + String(block.data),
			[stopFunc, block]
		);
	}

	recievedMinedBlock(block) {
		// Object.setPrototypeOf(block, Block); // doesn't work
		block = Object.assign(new Block(), block);

		if (block.verifyIsMined()) {
			const [stopFunc, b] = this.unminedBlocksStopFuncs.get(
				String(block.prevHash) + String(block.data)
			);

			if (typeof stopFunc == 'function') {
				stopFunc();
			}

			this.minedBlocks.set(block.hash, block);
			this.unminedBlocksStopFuncs.delete(
				String(block.prevHash) + String(block.data)
			);
		}
	}

	tojson() {
		return JSON.stringify({
			minedBlocks: [...this.minedBlocks.values()].reverse(),
			unminedBlocks: [...this.unminedBlocksStopFuncs.values()].reverse().map((arr) => arr[1]),
		});
	}
}

export default Blockchain;
