module.exports = {
    norpc: false,
    testCommand: 'SOLIDITY_COVERAGE=true ../node_modules/.bin/truffle test --network coverage',
    skipFiles: [
        'lifecycle/Migrations.sol',
        'mocks'
    ]
}
