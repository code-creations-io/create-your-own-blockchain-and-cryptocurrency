"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = __importStar(require("crypto"));
// Transaction class
class Transaction {
    constructor(amount, payer, payee) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    // Serialise transaction as a string
    toString() {
        return JSON.stringify(this);
    }
}
// Block class
class Block {
    constructor(prevHash, transaction, ts = Date.now()) {
        this.prevHash = prevHash;
        this.transaction = transaction;
        this.ts = ts;
        // Number only used once, used as the solution for mining
        this.numOnlyUsedOnce = Math.round(Math.random() * 999999999);
    }
    // Getter method to return a hash of this block
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }
}
// Chain class
class Chain {
    // Create genesis block
    constructor() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'godwin'))];
    }
    // Return the last block in the chain
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    // Mine a block to confirm it as a transaction on the blockchain
    mine(numOnlyUsedOnce) {
        let solution = 1;
        console.log('🐢 Mining transaction...');
        // Keep looping until solution is found
        while (true) {
            const hash = crypto.createHash('MD5');
            hash.update((numOnlyUsedOnce + solution).toString()).end();
            const attempt = hash.digest('hex');
            // Add more 0's to make it harder
            if (attempt.substr(0, 4) === '0000') {
                console.log(`---> Solved transaction with solution: ${solution}. Block is confirmed!\n`);
                return solution;
            }
            solution += 1;
        }
    }
    // Add a block to the blockchain
    addBlock(transaction, senderPublicKey, signature) {
        console.log("🐢 Sending TurtleCoin...");
        // Verify a transaction before adding it
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        // If it is valid, create a block, mine it and add it to the blockchain
        if (isValid) {
            console.log("🐢 Transaction is valid!");
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.numOnlyUsedOnce);
            this.chain.push(newBlock);
        }
    }
}
// Singleton instance as we only want 1 chain
Chain.instance = new Chain();
// Wallet class
class Wallet {
    // Generate key pair when a new wallet is created
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }
    // Send money from users wallet to another
    sendMoney(amount, payeePublicKey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
const agp = new Wallet();
const jz = new Wallet();
const jb = new Wallet();
agp.sendMoney(50, jz.publicKey);
jz.sendMoney(23, jb.publicKey);
jb.sendMoney(5, jz.publicKey);
console.log(Chain.instance);
