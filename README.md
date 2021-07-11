# The Button
Write a contract in Solidity that is similar to The Button on reddit (r/thebutton), where participants pay a fixed amount of ether to call press_button, and then if 3 blocks pass without someone calling press_button, whoever pressed the button last can call claim_treasure and get the other participants’ deposits. 

## Run

```bash
yarn && yarn run build && yarn run compile && yarn run test
```

## Ropsten
```bash
npx hardhat run --network ropsten ./scripts/Button/deploy.ts
npx hardhat verify --network ropsten 0x61E3CdEA9E1e39D5abA746622859888Bd17aCf28 "100000"
```