import * as crypto from 'crypto'

// Transaction class
class Transaction {

    constructor(
        public amount: number,
        public payer: string,
        public payee: string
    ) {}

    // Serialise transaction as a string
    toString() {
        return JSON.stringify(this);
    }
}

// Block class
class Block {

    // Number only used once, used as the solution for mining
    public numOnlyUsedOnce = Math.round(Math.random() * 999999999);

    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ) {}

    // Getter method to return a hash of this block
    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex')
    }
}

// Chain class
class Chain {

    // Singleton instance as we only want 1 chain
    public static instance = new Chain();

    // The chain is a series of linked blocks
    chain: Block[];

    // Create genesis block
    constructor() {
        this.chain = [new Block('', new Transaction(100, 'genesis', 'godwin'))];
    }

    // Return the last block in the chain
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    // Mine a block to confirm it as a transaction on the blockchain
    mine(numOnlyUsedOnce: number) {
        let solution = 1;
        console.log('🐢 Mining transaction...')

        // Keep looping until solution is found
        while(true) {
            const hash = crypto.createHash('MD5');
            hash.update((numOnlyUsedOnce + solution).toString()).end();

            const attempt = hash.digest('hex')

            // Add more 0's to make it harder
            if (attempt.substr(0, 4) === '0000'){
                console.log(`---> Solved transaction with solution: ${solution}. Block is confirmed!\n`);
                return solution
            }

            solution += 1
        }
    }

    // Add a block to the blockchain
    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {

        console.log("🐢 Sending TurtleCoin...")

        // Verify a transaction before adding it
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        // If it is valid, create a block, mine it and add it to the blockchain
        if (isValid) {
            console.log("🐢 Transaction is valid!")
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.numOnlyUsedOnce);
            this.chain.push(newBlock);
        }
    }
}

// Wallet class
class Wallet {

    public publicKey: string;
    public privateKey: string;

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
    sendMoney(amount: number, payeePublicKey: string) {
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

console.log(Chain.instance)