const chai = require("chai");
const { ethers } = require("hardhat");
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised)
const expect = chai.expect;

const wallet1 = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'); //do not use in for a real usage
const wallet2 = new ethers.Wallet('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'); //do not use in for a real usage


describe("Claim testing ", function () {

	let dummy, distributor;

	beforeEach(async function() {
		const [deployer,] = await ethers.getSigners();

		const Dummy = await ethers.getContractFactory("DummyToken");
		dummy = await Dummy.deploy("DummyToken", "DT", ethers.BigNumber.from("0x53444835ec580000"));
		await dummy.deployed();

		const Distributor = await ethers.getContractFactory("MerkleDistributor");
		distributor = await Distributor.deploy(deployer.address, dummy.address);
		await distributor.deployed();

		const transfer = await dummy.transfer(distributor.address, ethers.BigNumber.from("0x53444835ec580000"));
		await transfer.wait();

		const setMerkle = await distributor.setMerkleRoot('0xef34a453dc84c8f17f34dedc58a66dcd2558aaac344cb41f33c0a244f8bf49a0');
		await setMerkle.wait();
	});

	it("Should be able to claim, normal case", async function () {

		const claim1 = await distributor.claim(0, ethers.BigNumber.from('0xde0b6b3a7640000'), [
			"0x3aa71a64876aa3c4d41ce2052c0cb0ef88d6edf35efc8906c6992a50807f5f0c",
			"0xf4b517885b5dba85cede2c4269628bc0fecea60652707cfe6b82554377342c22"
		], {from: wallet1.address});
		await claim1.wait();

		const balance = await dummy.balanceOf(wallet1.address);

		expect(balance.eq(ethers.BigNumber.from('0xde0b6b3a7640000')), "Wrong amount received").to.equal(true);
	});

	it("Should not be able to claim twice", async function () {

		const claim1 = await distributor.claim(0, ethers.BigNumber.from('0xde0b6b3a7640000'), [
			"0x3aa71a64876aa3c4d41ce2052c0cb0ef88d6edf35efc8906c6992a50807f5f0c",
			"0xf4b517885b5dba85cede2c4269628bc0fecea60652707cfe6b82554377342c22"
		], {from: wallet1.address});
		await claim1.wait();
		
		await expect(distributor.claim(0, ethers.BigNumber.from('0xde0b6b3a7640000'), [
			"0x3aa71a64876aa3c4d41ce2052c0cb0ef88d6edf35efc8906c6992a50807f5f0c",
			"0xf4b517885b5dba85cede2c4269628bc0fecea60652707cfe6b82554377342c22"
		], {from: wallet1.address})).to.eventually.be.rejectedWith(Error);
	});

	it("Should not be able to claim a wrong amount", async function () {
		
		await expect(distributor.claim(0, ethers.BigNumber.from('0x6b3a7640000'), [
			"0x3aa71a64876aa3c4d41ce2052c0cb0ef88d6edf35efc8906c6992a50807f5f0c",
			"0xf4b517885b5dba85cede2c4269628bc0fecea60652707cfe6b82554377342c22"
		], {from: wallet1.address})).to.be.rejectedWith(Error);
	});

	it("Should not be able to claim another wallet aidrop", async function () {
		
		await expect(distributor.claim(1, ethers.BigNumber.from('0x1bc16d674ec80000'), [
			"0x1f1d6ec39606c41306449c5e005e94a750b2c71cd3b9baa55b452004201fc643",
		], {from: wallet1.address})).to.be.rejectedWith(Error);
	});

	it("Should not be able to claim when paused", async function () {

		const pause = await distributor.pause();
		await pause.wait();

		await expect(distributor.claim(0, ethers.BigNumber.from('0xde0b6b3a7640000'), [
			"0x3aa71a64876aa3c4d41ce2052c0cb0ef88d6edf35efc8906c6992a50807f5f0c",
			"0xf4b517885b5dba85cede2c4269628bc0fecea60652707cfe6b82554377342c22"
		], {from: wallet1.address})).to.be.rejectedWith(Error);
		
	});

	it("Should be able to claim when new root set ", async function () {

		const pause = await distributor.pause();
		await pause.wait();

		const setMerkle = await distributor.setMerkleRoot('0xef34a453dc84c8f17f34dedc58a66dcd2558aaac344cb41f33c0a244f8bf49a0');
		await setMerkle.wait();
		
		await expect(distributor.claim(0, ethers.BigNumber.from('0xde0b6b3a7640000'), [
			"0x3aa71a64876aa3c4d41ce2052c0cb0ef88d6edf35efc8906c6992a50807f5f0c",
			"0xf4b517885b5dba85cede2c4269628bc0fecea60652707cfe6b82554377342c22"
		], {from: wallet1.address})).to.not.be.rejectedWith(Error);

		const balance = await dummy.balanceOf(wallet1.address);
		expect(balance.eq(ethers.BigNumber.from('0xde0b6b3a7640000')), "Wrong amount received").to.equal(true);
	});

	it("Not admin should not be use admin functions", async function () {
		await expect(distributor.pause({from: wallet2.address}), "Pause").to.be.rejectedWith(Error);
		await (await distributor.pause()).wait();
		await expect(distributor.setMerkleRoot('0xef34a453dc84c8f17f34dedc58a66dcd2558aaac344cb41f33c0a244f8bf49a0', {from: wallet2.address}), "setMerkle").to.be.rejectedWith(Error);
		await expect(distributor.setAuthority(wallet2.address, {from: wallet2.address}), "Authority").to.be.rejectedWith(Error);
	});

	it("Should not be able to set a new merkle if not paused", async function () {
		await expect(distributor.setMerkleRoot('0xef34a453dc84c8f17f34dedc58a66dcd2558aaac344cb41f33c0a244f8bf49a0'), "setMerkle").to.be.rejectedWith(Error);
		await (await distributor.pause()).wait();
		await expect(distributor.setMerkleRoot('0xef34a453dc84c8f17f34dedc58a66dcd2558aaac344cb41f33c0a244f8bf49a0'), "setMerkle").to.not.be.rejectedWith(Error);

	});

});
