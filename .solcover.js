module.exports = {
    norpc: false,
    testCommand: 'SOLIDITY_COVERAGE=true ../node_modules/.bin/truffle test --network coverage',
    skipFiles: [
        'SafeMath',
        'mocks'
    ],
    port: 8555
}
