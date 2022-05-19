from collections import defaultdict
from itertools import zip_longest
import json

from eth_utils import encode_hex
from web3 import Web3
from eth_abi.packed import encode_abi_packed

class MerkleTree:
    def __init__(self, elements):
        self.elements = sorted(set(Web3.keccak(hexstr=el) for el in elements))
        self.layers = MerkleTree.get_layers(self.elements)

    @property
    def root(self):
        return self.layers[-1][0]

    def get_proof(self, el):
        el = Web3.keccak(hexstr=el)
        idx = self.elements.index(el)
        proof = []
        for layer in self.layers:
            pair_idx = idx + 1 if idx % 2 == 0 else idx - 1
            if pair_idx < len(layer):
                proof.append(encode_hex(layer[pair_idx]))
            idx //= 2
        return proof

    @staticmethod
    def get_layers(elements):
        layers = [elements]
        while len(layers[-1]) > 1:
            layers.append(MerkleTree.get_next_layer(layers[-1]))
        return layers

    @staticmethod
    def get_next_layer(elements):
        return [MerkleTree.combined_hash(a, b) for a, b in zip_longest(elements[::2], elements[1::2])]

    @staticmethod
    def combined_hash(a, b):
        if a is None:
            return b
        if b is None:
            return a
        return Web3.keccak(b''.join(sorted([a, b])))


def getMerkleJson(balances):
    elements = [(index, account, amount)
                for index, (account, amount) in enumerate(balances.items())]
    nodes = [encode_hex(encode_abi_packed(
        ['uint', 'address', 'uint'], el)) for el in elements]
    tree = MerkleTree(nodes)
    distribution = {
        'merkleRoot': encode_hex(tree.root),
        'tokenTotal': hex(sum(balances.values())),
        'claims': {
            user: {'index': index, 'amount': hex(
                amount), 'proof': tree.get_proof(nodes[index])}
            for index, user, amount in elements
        },
    }
    print(f'merkle root: {encode_hex(tree.root)}')
    return distribution

if __name__ == "__main__":
    balances={}
    balances["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"] = int(1e18)
    balances["0x70997970c51812dc3a010c7d01b50e0d17dc79c8"] = int(2e18)
    balances["0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc"] = int(3e18)
    merkle = getMerkleJson(balances)
    file_out = "merkle_fake.json"
    print("writing merkle tree to:",file_out)
    with open(file_out,"w") as f:
        json.dump(merkle,f, indent=4)