const hardhat = require("hardhat");

async function main() {
	await hardhat.run('compile');

	const [deployer,] = await hardhat.ethers.getSigners();
		
	const sdDeployer = "0xb36a0671B3D49587236d7833B01E79798175875f";
	const SDT = "0x73968b9a57c6e53d41345fd57a6e6ae27d6cdb2f";

	const Distributor = await hardhat.ethers.getContractFactory("MerkleDistributor");
	const distributor = await Distributor.deploy(sdDeployer, SDT);

	await distributor.deployed();

	console.log("MerkleDistributor deployed to:", distributor.address);
	console.log("Owner is:", sdDeployer);

	// verify the action
    await run("verify:verify", {
        address: distributor.address.address,
        network: ethers.provider.network,
        constructorArguments: [
            sdDeployer,
			SDT,
        ]
    });
	console.log("Contract verified on Etherscan")
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
