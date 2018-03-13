# PONZI Token Contracts
[![Coverage Status](https://coveralls.io/repos/github/PonziTrust/Token/badge.svg?branch=master)](https://coveralls.io/github/PonziTrust/Token?branch=master)
[![Build Status](https://travis-ci.org/PonziTrust/Token.svg?branch=master)](https://travis-ci.org/PonziTrust/Token)

The PONZI token implement [EIP20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) and [ERC667](https://github.com/ethereum/EIPs/issues/677) token standards with additional functionality - sells tokens.

The total supply of the token is 100,000,000, and each token is divisibe up to 8 decimal places.

Some [EIP20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) implementationt get from [Zeppelin Solidity library](https://github.com/OpenZeppelin/zeppelin-solidity/tree/master/contracts/token/ERC20)

For all computational operations [Zeppelin Solidity SafeMath](https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/math/SafeMath.sol) library was used.

To prevent accidental burns, the token does not allow transfers to the contract itself and to 0x0.

The contract implements [Withdrawal](http://solidity.readthedocs.io/en/develop/common-patterns.html#withdrawal-from-contracts), [Restricting Access](http://solidity.readthedocs.io/en/develop/common-patterns.html#restricting-access), [State Machine](http://solidity.readthedocs.io/en/develop/common-patterns.html#state-machine) patterns.

## The contract`s states of work:
- PreSale: only owner has access to transfer tokens
- Sale: sells tokens by func byToken() or fallback, only owner or itself has access to transfer tokens
- PublicUse: anyone can transfer tokens


## Details
- Address: [0xc2807533832807bf15898778d8a108405e9edfb1](https://etherscan.io/token/0xc2807533832807bf15898778d8a108405e9edfb1)
- Decimals: 8
- Name: Ponzi
- Symbol: PT


### Full JSON ABI:
```
[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newBank","type":"address"}],"name":"setBank","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newTokenPriceInWei","type":"uint256"}],"name":"setAndFixTokenPriceInWei","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"disown","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"priceSetter","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokenPriceInWei","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"},{"name":"extraData","type":"bytes"}],"name":"transferAndCall","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newPriceSetter","type":"address"}],"name":"setPriceSetter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newState","type":"string"}],"name":"setState","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"bank","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"initContract","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"firstEntranceToSaleStateUNIX","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"state","outputs":[{"name":"stateString","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"extraData","type":"bytes"}],"name":"transferAllAndCall","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"byTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"owner","type":"address"}],"name":"pendingWithdrawals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unfixTokenPriceInWei","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"who","type":"address"},{"indexed":false,"name":"newState","type":"uint8"}],"name":"StateChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"who","type":"address"},{"indexed":false,"name":"newPrice","type":"uint256"},{"indexed":false,"name":"isFixed","type":"bool"}],"name":"PriceChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"numberOfTokens","type":"uint256"},{"indexed":true,"name":"purchasedBy","type":"address"},{"indexed":true,"name":"priceInWei","type":"uint256"}],"name":"TokensSold","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"sumInWei","type":"uint256"}],"name":"Withdrawal","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"},{"indexed":false,"name":"data","type":"bytes"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"}]
```

## Installation
```
npm install
```

## Testing
Run test:
```
npm run test
```
Run coverage:
```
npm run coverage
```

## License
Code released under the [MIT License](https://github.com/PonziTrust/Token/blob/master/LICENSE).
