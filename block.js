import crypto from 'node:crypto';
import { minerID, totalMiners } from './server.js';

class Block {
	static computeHash(block) {
		return crypto
			.createHash('sha256')
			.update(String(block.prevHash))
			.update(String(block.data))
			.update(String(block.minerID))
			.update(String(block.nonce))
			.digest('hex');
	}

	constructor(prevHash, data, chainLength = -1) {
		this.prevHash = prevHash;
		this.data = data;
		// this.nonce = 0;
		this.nonce = minerID;
		this.minerID = minerID;
		this.chainLength = chainLength;

		this.hash = Block.computeHash(this);
	}

	verifyIsMined() {
		this.hash = Block.computeHash(this);
		return this.hash.startsWith('0000');
	}

	mine(callback) {
		let stopped = false;

		//
		const mineLoop = (callback) => {
			if (!this.hash.startsWith('0000')) {
				// this.nonce += 1;
				this.nonce += totalMiners;
				this.hash = Block.computeHash(this);

				if (!stopped) {
					setImmediate(() => mineLoop(callback));
				}
			} else {
				stopped = true;
				if (typeof callback == 'function') {
					callback(this);
				}
			}
		};

		mineLoop(callback);

		return () => {
			stopped = true;
		};
	}
}

export default Block;
