# create-your-own-blockchain

---

### Requirements

- Node JS version 12+
- Understanding of Node JS and Typescript

---

## Step-by-step guide

#### 1. Create and setup project

Open up VSCode (or whatever text editor you prefer) and initialise a Node JS project with:

    npm init -y

For this build, we are going to use `Typescript` to make use of object orientied programming principles to create the blockchain. To install typescript execute this command within your new project:

    npm install -D typescript @types/node

`@types/node` will help our code to appear more readable, so we install that too with the above command. Next we want to create a `tsconfig.json` file within the root of the project. Within this file, include the following JSON:

```
{
    "compilerOptions": {
        "lib": ["es2020"],
        "module": "commonjs",
        "target": "es2019",
        "types": ["node"],
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true
    }
}
```

Now we want to set up a script that compiles our typescript code and constantly compiles our code in the background into plain Javascript. To do this, open up `package.json` and and add a `scripts` object with a `dev` key to be able to run a dev script. The `scripts` key within this file should look like this:

```
"scripts": {
    "dev": "tsc -w"
  }
```

#### 2. Transaction class

`index.ts` will be the entry point for all of our source code for this blockchain and cryptocurrency. Create this file in the root of your project and start the dev script with:

    npm run dev

so that our `index.js` file is constantly being compilesd. Now open up `index.ts` and import the built in Node JS library used for cryptography called `crypto` with this line:

    import * as crypto from crypto;

Our code will include 4 classes, a `Transaction`, `Block`, `Chain` and `Wallet`. We will start by building the `Transaction`. A transaction object has 3 properties:

- Transaction amount (of your Cryptocurrency)
- Person paying the transaction
- Person receiving the transaction

The `Transaction` object will also include a method to serialise the object as a string, to make the cryptographic objects easier to work with. Here is the code for the `Transaction` class:

```
class Transaction {
    constructor(
        public amount: number,
        public payer: string,
        public payee: string
    ) {}

    toString() {
        return JSON.stringify(this);
    }
}
```

#### 3. Block class

A block is a container for multiple transactions. How many transactions exactly? A blockchain can be understood to be similar to a ledger, where transactions are logged continuously. However this ledger cannot be infinitely long if it's being stored digitally, because it would take up too much storage! So transactions are grouped together into blocks each storing 1MB of information. When a new transaction will exceed the amount of storage within each block, a new block is created with a link to the previous block. For this build, we will treat each block as 1 single transaction for simplicity.

Each block is similar to an element within a linked list, because each block has a reference to the previous blocks hash. A hash is a cryptographic representation of an input with a fixed length. The beauty of a hash is that you cannot reconstruct the original value with it, but you can compare two hashes to make sure they are the same. This provides the mechanism for us to be able to link together blocks without being manipulated.

The `Block` class has 4 properties:

- The previous blocks hash
- A single transaction
- A timestamp
- A `number only used once` AKA nonce

The last of these properties refers to the first number that a blockchain miner uses to discover the solution for confirming a block in the blockchain. Finding this number is extremely difficult, takes a lot of trial and error and a huge amount of computation. When a miner solves this computation, they are gifted cryptocurrency for their efforts. The reason why blocks need to be mined is because this effort of finding a solution validates each block on the blockchain. Therefore, by mining each block you're helping to secure and validate each transaction on the blockchain and the more times a block is confirmed, the better! Until a block has been mined, it is not considered as a valid transaction, hence the huge demand for mining!

When the `Block` is initialised we want a hash of the block to be returned. To do this, we can implement a getter to first stringify the block and then to create a hash from it using the `SHA256` algorithm. Finally, we want to return this hash value as a hexidecimal string. The code for the `Block` class should look like this:

```
class Block {

    public numOnlyUsedOnce = Math.round(Math.random() * 999999999);

    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ) {}

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex')
    }
}
```

The `Block` is simply a hash of the previous block, the current transaction, a nonce and a timestamp (to allow for the blockchain to be sorted in chronological order).

#### 4. Chain class

In this build we are only creating one `Chain`, so this class will start by initialise a singleton instance of the chain class.

    public static instance = new Chain();

The `Chain` is of course made up of a set of linked blocks, so we should also set up a property for the chain itself as an array of `Block`s.

    chain: Block[];

When initialising this class, we need to create a transaction (a block) to start things off. This is called the Genesis block and we can create this by instantiating the previously created `Block` class. However, there will be no previous hash to refer to since this is the first block. Feel free to add as much cryptocurrency as you like to this transaction... this is your cryptocurrency after all!

```
constructor() {
    this.chain = [new Block('', new Transaction(1000, 'genesis', 'agp'))];
}
```

We will quite often need to refer to the last block in the chain so we can add a getter to help with that too.

```
get lastBlock() {
    return this.chain[this.chain.length - 1];
}
```

We will need several methods within this class too. The first will be to add a new block to the blockchain. This method will take in a transaction, the sender of the transaction's public key and a signature that we can verify before adding a new block to the chain. However, to verify whether this is a legitimate transaction to securely send cryptocurrency we must first build the `Wallet` class. We will come back to the chain soon.

#### 5. Wallet class

The wallet is essentially a container for a users public key and private key. The public key is used for receiving money, the private key is used for spending money.

To generate this key pair, we're going to use another cryptographic algorithm called `RSA`. Unlike `SHA256` this algorithm allows you to encrypt data and then decrypt it as well to recover the original data, using public and private key respectively. However, we will use this key pair instead to create a digital signature.

First we create a hash of the data and then sign the hash with our private key. The message can be verified later using the public key. If anyone tried to change the message the hash would also change, and so the verification would fail. This is important for a cryptocurrency because without a signature, someone could intercept the message and change the amount or payee.

So to create the key pair we use the `RSA` algorithm and to format them as strings we can add some extra options for formatting. We do this within the constructor as the `Wallet` is initialised:

```
constructor() {
    const keypair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
}
```

With these keys, we can use them to send money to another user. For this we need a method that takes in an amount and the public key of the person that you're paying. Within this method we create a transaction and sign the transaction using the transaction string and signing it with the payers private key. This signature is almost like a 1 time password, it allows us to verify our identity because it depends on both the transaction and the private key, but it can be verified as authenticate using the public key.

Finally, we can add this transaction to the blockchain by adding a new block to our chain. The `Wallet` class should look like this:

```
class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
```

#### 6. Refactor Chain class

Now we have our `Wallet` set up, we can continue with our `Chain` class. For the method to add a block, we want to verify that the transaction was valid by verifying it with the senders public key and the signature itself. If it is valid, we can add this block to the blockchain:

```
addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(transaction.toString());

    const isValid = verifier.verify(senderPublicKey, signature);

    if (isValid) {
        const newBlock = new Block(this.lastBlock.hash, transaction);
        this.chain.push(newBlock);
    }
}
```

However, as mentioned before we need a way to validate each transaction on the blockchain. Therefore we need a proof of work system that allows users to mine blocks and to confirm each block on the chain. For this, we need to create a method to mine a block on the chain that takes a nonce value as an input.

The goal of this method is to attempt to find a number that when added to the nonce value, will produce a hash that starts with a specified number of zeros. The number of zeros we will use is 4. However in practice, this changes all the time. The number of zeros for bitcoin is currently at 20, and the length of these zeros is congruent to the difficulty of mining each block. The more zeros, the more difficult it is to mine each block. The only way to figure out the solution is with brute force by looping over values until we find it. When we find the solution, it is then sent to every other miner in the world for further confirmations. To create the hash for mining, we will use the `MD5` algorithm which is similar to `SHA256` but is only 128 bits and is faster to compute. The method should finally look like this:

```
mine(nonce: number) {
    let solution = 1;
    console.log('🐢 Mining TurtleCoin...')

    while(true) {
        const hash = crypto.createHash('MD5');
        hash.update((nonce + solution).toString()).end();

        const attempt = hash.digest('hex')

        if (attempt.substr(0, 4) === '0000'){
            console.log(`Solved block with solution: ${solution}`);
            return solution
        }

        solution += 1
    }
}
```

#### 7. Summary

To summarise all of the code for each class, the entire code is presented below, alternatively check out the `index.ts` file within this repo!

```
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
```

#### 8. Usage

We're now ready to use this blockchain, create some transactions with our own cryptocurrency and mine them and add them to out blockchain!

First, we need to add a new script to our `package.json` file:

    "start": "tsc && node ."

Now, add some transactions to the end of `index.ts` file and some logging to output the blockchain after these transactions have been confirmed:

```
const agp = new Wallet();
const jz = new Wallet();
const jb = new Wallet();

agp.sendMoney(50, jz.publicKey);
jz.sendMoney(23, jb.publicKey);
jb.sendMoney(5, jz.publicKey);

console.log(Chain.instance)
```

Finally, stop any previous scripts running and from the terminal execute:

    npm run start

You should see that your transactions are being mined and your blockchain is logged, showing a series of blocks that are linked to each other based on a hash of the previous block! Congratulations!

#### 9. Extra resources

- Bitcoin explorer! https://www.blockchain.com/explorer
- The Genesis block of Bitcoin! https://www.blockchain.com/btc/block/000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f
