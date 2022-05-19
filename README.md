# Test

```shell
npx hardhat compile
npx hardhat test
```

# Deploy on mainnet fork

Run a fork
```shell
npx hardhat node --fork https://cloudflare-eth.com
```

Deploy 
```shell
npx hardhat compile
npx hardhat run scripts/deploy.js
```

# Deploy on mainnet

```shell
npx hardhat run --network mainnet scripts/deploy.js
```

