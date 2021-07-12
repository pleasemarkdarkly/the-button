/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import hre from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

const VERBOSE = false;
const MAX = 1000000000000000;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const keys = async (obj: any) => {
    Object.keys(obj).toString().split(`,`).forEach(p => { process.stdout.write(`${p}` + `\n`); })
}

export const printPartyTxReceipt = async (receipt: any) => {
    process.stdout.write(
        `${receipt.from} => ${receipt.to} (gasUsed:${receipt.gasUsed})(${receipt.status})` + `\n` +
        `\ttx:${receipt.transactionHash} (block.no:${receipt.blockNumber})` + `\n`
    );
}

export const getRandomInt = (max: number): number => {
    return Math.floor(Math.random() * max);
}

export const getRandom = (): number => {
    let rand = Math.floor(Math.random() * MAX);
    if (rand === 0 || rand === undefined) rand = 987654321;
    return rand;
}

const advanceTimeAndBlock = async function (time: number) {
    process.stdout.write(`advancing:`);
    const currentBlockNum = await hre.ethers.provider.getBlockNumber();
    const currentBlock = await hre.ethers.provider.getBlock(currentBlockNum);
    const { hash, parentHash, number, timestamp, nonce, difficulty, gasLimit, gasUsed, miner, extraData, transactions } = currentBlock;
    const currentBlockTime = currentBlock.timestamp;
    const newBlockTime = currentBlockTime + time;
    await hre.ethers.provider.send('evm_mine', [newBlockTime]);
    process.stdout.write(`(${currentBlockNum}):` + `\n` +
        `\t` + `${parentHash}` + `\t` + `\n` +
        `\t` + `${hash}` + `\t` + `\n` +
        `\t` + `${timestamp}:${number}, ${nonce}, ${difficulty}` + `\t` + `\n` +
        `\t` + `${gasLimit}, ${gasUsed}` + `\t` + `\n` +
        `\t` + `tx:${transactions}` + `\t` + `\n` +
        `\t` + `current block time:${currentBlockTime} => adv block time:${newBlockTime}` + `\n`);
};

export function shouldBehaveLikeButton(): void {
    it("should return Button contract constructor initial state", async function () {
        const buttonAddress = await this.Button.address;
        const buttonBalance: BigNumber = await hre.ethers.provider.getBalance(buttonAddress);
        process.stdout.write(`deployed contract to => ` +
            `${await this.Button.address}:${buttonBalance} (wei)` + `\n`);        
        expect(await this.Button.address);
        expect(buttonBalance).to.equal(0);       
    });

    it("should display other unnamed addresses and balances", async function () {        
        const ad: SignerWithAddress = this.signers.admin;
        process.stdout.write(`(+)` + `\t` + `${await ad.address}:${await ad.getBalance()}` + `\n`);
        for (let i = 0; i < this.unnamedAccounts.length; i++) {
            const a: SignerWithAddress = this.unnamedAccounts[i];
            process.stdout.write(`(${i})` + `\t` + `${await a.address}:${await a.getBalance()}` + `\n`);
        }
        process.stdout.write(`🎉🎉🎉 Let's push buttons` + `\n`);
    });

    it("should display contract keys", async function () {        
        expect(await keys(this.Button));
    });

    it("should display contract properties", async function () {
        const entry_fee: string = await this.Button.entry_fee();        
        process.stdout.write(`minimum fee:${entry_fee}` + `\n`);
        expect(entry_fee).to.not.equal(0);
    });

    it("should demonstrate players, balances, wagers and pushing buttons", async function () {
        const numPlayers = 3;
        const winner = [] as SignerWithAddress[];
        let iterations = getRandomInt(10);

        for (let i = 0; i < iterations; i++) {
            for (let i = 0; i < numPlayers; i++) {
                const g: SignerWithAddress = this.unnamedAccounts[i];
                const entry_fee: string = await this.Button.entry_fee();
                process.stdout.write(
                    `${await g.address}:` +
                    `${await g.getBalance()}:` + `\n`);
                const tx = await this.Button.connect(g).press_button({ value: entry_fee });
                const receipt = await tx.wait();
                const { to, from, gasUsed, transactionHash, blockNumber } = receipt;
                process.stdout.write(`(${blockNumber})(${i}) ${from} ➡️  Button:${to}` + `\n` +
                    `\t` + `🎰 button push:${entry_fee} (⛽ ${gasUsed})` + `\n` +
                    `\t` + `tx:${transactionHash}:${blockNumber}` + `\n`
                );                
                if (i == numPlayers - 1) winner.push(g);
            }

            const buttonAddress = await this.Button.address;
            let buttonBalance = await hre.ethers.provider.getBalance(buttonAddress);
            const playerCount = await this.Button.num_players();

            process.stdout.write(`Button ${buttonAddress} contract balance:${buttonBalance}, ` +
                `playerCount:${playerCount}` + `\n`);
            process.stdout.write(`\n`);
                
            process.stdout.write(`Forward ${numPlayers} blocks:` + `\n`);
            for (let i = 0; i < numPlayers; i++) {
                const advance = 86400;
                await advanceTimeAndBlock(advance);
            }
        
            process.stdout.write(`\n` +
                `Winner Winner Chicken Dinner:${await winner[0].address} - let's claim_treasure.` + `\n`);                    
            const tx = await this.Button.connect(await winner[0]).claim_treasure();
            const receipt = await tx.wait();
            const { to, from, gasUsed, transactionHash, blockNumber } = receipt;
            process.stdout.write(`(${blockNumber}) ${await winner[0].address} => ` + `\n` +
                `\t` + `${await await winner[0].getBalance()} (⛽ ${gasUsed})` + `\n` +
                `\t` + `tx:${transactionHash}:${blockNumber}` + `\n`
            );

            buttonBalance = await hre.ethers.provider.getBalance(buttonAddress);
            process.stdout.write(`Button balance after payout => ${buttonBalance}`);
            expect(buttonBalance).to.equal(0);
            winner.pop();
            process.stdout.write(`\n`);
        }
    });

    it("should display unnamed addresses and balances again", async function () {
        const ad: SignerWithAddress = this.signers.admin;
        process.stdout.write(`\n` + `(+)` + `\t` + `${await ad.address}:${await ad.getBalance()}` + `\n`);
        for (let i = 0; i < this.unnamedAccounts.length; i++) {
            const a: SignerWithAddress = this.unnamedAccounts[i];
            if (i == 2) {
                process.stdout.write(`(${i})` + `\t` + `${await a.address}:${await a.getBalance()}` + `\n`);
            } else {
                process.stdout.write(`(${i})` + `\t` + `${await a.address}:${await a.getBalance()}` + `\n`);
            }
        }        
    });

};
