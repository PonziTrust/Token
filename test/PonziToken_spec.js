
import checkPublicABI from './helpers/checkPublicABI';
import latestGasUsed from './helpers/latestGasUsed';
import { ZERO_ADDRESS } from './helpers/zeroAddress';
import { gasPrice } from './helpers/gasPrice';
import getAccounts from './helpers/getAccounts';
import latestTime from './helpers/latestTime';
import BigNumber from 'bignumber.js';
import getBalance from './helpers/getBalance';
import increaseTime, { duration } from './helpers/increaseTime';
import assertRevert from './helpers/assertRevert';
import assertInvalidOpcode from './helpers/assertInvalidOpcode';
import ether from './helpers/ether';
import expectThrow from './helpers/expectThrow';
import toPromise from './helpers/toPromise';

const PonziToken = artifacts.require('./contracts/PonziToken.sol');
const Token677ReceiverMock = artifacts.require('../contracts/mocks/Token677ReceiverMock.sol');
const NotERC677Compatible = artifacts.require('../contracts/mocks/NotERC677Compatible.sol');

let Accounts, owner, recipient, token, sender, bank, token677Receiver, nonERC677;

const State = Object.freeze({
  'PreSale': { num: 0, str: 'PreSale' },
  'Sale': { num: 0, str: 'Sale' },
  'PublicUse': { num: 0, str: 'PublicUse' },
});

contract('PonziToken', () => {
  before(async function () {
    Accounts = await getAccounts();
    owner = Accounts[0];
    recipient = Accounts[1];
    sender = Accounts[2];
    bank = Accounts[3];
  });

  describe('check initialization', () => {
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
    });

    it('has a limited public ABI', () => {
      let expectedABI = [
        // public functions
        'initContract',
        'allowance',
        'approve',
        'balanceOf',
        'decreaseApproval',
        'increaseApproval',
        'transfer',
        'transferAndCall',
        'transferAllAndCall',
        'transferFrom',
        'decimals',
        'name',
        'symbol',
        'totalSupply',
        'disown',
        'setState',
        'setAndFixTokenPriceInWei',
        'unfixTokenPriceInWei',
        'setPriceSetter',
        'setBank',
        // external
        'byTokens',
        'withdraw',
        'pendingWithdrawals',
        'state',
        'tokenPriceInWei',
        'bank',
        'firstEntranceToSaleStateUNIX',
        'priceSetter',
      ];
      checkPublicABI(PonziToken, expectedABI);
    });

    it('decimals must be 8', async () => {
      let decimals = await token.decimals.call();
      assert.equal(decimals.toString(), 8);
    });

    it('owner and bank of token is transaction sender', async () => {
      let addr = await token.bank.call();
      assert.equal(owner, addr);
    });

    it('initial state is PreSale', async () => {
      let state = await token.state.call();
      assert.equal(State.PreSale.str, state);
    });

    it('name must be Ponzi', async () => {
      let name = await token.name.call();
      assert.equal(name, 'Ponzi');
    });

    it('symbol must be Pt', async () => {
      let symbol = await token.symbol.call();
      assert.equal(symbol, 'PT');
    });

    context('initContract()', () => {
      it('throw on not owner`s calling ', async () => {
        await assertRevert(token.initContract({ from: sender }));
      });

      it('throw on recall', async () => {
        await token.initContract({ from: owner });
        await assertRevert(token.initContract({ from: owner }));
      });

      context('check data initialization', () => {
        beforeEach(async () => {
          await token.initContract({ from: owner });
        });

        it('totalSupply  must be 10^16', async () => {
          let totalSupply = await token.totalSupply.call();
          assert.equal(totalSupply.toString(), 1e+16);
        });

        it('70% 7*10^15 tokens of the balance to the owner', async () => {
          let balance = await token.balanceOf.call(owner);
          assert.equal(balance.toString(), 7 * 1e+15);
        });

        it('30% 3*10^15 tokens of the balance to the this', async () => {
          let balance = await token.balanceOf.call(token.address);
          assert.equal(balance.toString(), 3 * 1e+15);
        });

        it('allowed for owner transfer all tokesn from contract', async () => {
          let amount = await token.allowance.call(token.address, owner);
          assert.equal(amount.toString(), 3 * 1e+15);
        });

        it('first entrance to sale state UNIX time must by 0', async () => {
          let timestamp = await token.firstEntranceToSaleStateUNIX.call();
          assert.equal(timestamp.toString(), 0);
        });

        it('token price in wei must by 0', async () => {
          let price = await token.tokenPriceInWei.call();
          assert.equal(price.toString(), 0);
        });

        it('price setter must by address(0)', async () => {
          let addr = await token.priceSetter.call();
          assert.equal(addr, ZERO_ADDRESS);
        });
      });
    });
  });

  describe('setState(string)', () => {
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
    });

    it('set Sale State, check firstEntranceToSaleStateUNIX', async () => {
      let timestampBefore = await token.firstEntranceToSaleStateUNIX.call();
      await token.setState(State.Sale.str, { from: owner });
      let timestamp = latestTime();
      let timestampAfter = await token.firstEntranceToSaleStateUNIX.call();
      let state = await token.state.call();
      assert.equal(state, State.Sale.str);
      assert.equal(timestampBefore.toString(), timestampAfter.minus(timestamp).toString());
    });

    it('set PreSale State, check firstEntranceToSaleStateUNIX', async () => {
      let timestamp = await token.firstEntranceToSaleStateUNIX.call();
      await token.setState(State.PreSale.str, { from: owner });
      let state = await token.state.call();
      assert.equal(state, State.PreSale.str);
      assert.equal(timestamp.toString(), 0);
    });

    it('set PublicUse State, check firstEntranceToSaleStateUNIX', async () => {
      let timestamp = await token.firstEntranceToSaleStateUNIX.call();
      await token.setState(State.PublicUse.str, { from: owner });
      let state = await token.state.call();
      assert.equal(state, State.PublicUse.str);
      assert.equal(timestamp.toString(), 0);
    });

    it('throw on not owner`s calling', async () => {
      await assertRevert(token.setState(State.Sale.str, { from: sender }));
    });

    it('throw on not valid netState calling', async () => {
      await assertRevert(token.setState('not valid string', { from: owner }));
    });
  });

  describe('disown()', () => {
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
    });

    it('throw on not owner`s calling', async () => {
      await token.setState(State.PublicUse.str, { from: owner });
      await assertRevert(token.disown({ from: sender }));
    });

    it('throw when contract in PreSale', async () => {
      await token.setState(State.PreSale.str, { from: owner });
      await assertRevert(token.disown({ from: owner }));
    });

    it('throw when contract in Sale', async () => {
      await token.setState(State.Sale.str, { from: owner });
      await assertRevert(token.disown({ from: owner }));
    });

    it('calling and check access after', async () => {
      await token.setState(State.PublicUse.str, { from: owner });
      await token.disown({ from: owner });
      await assertRevert(token.setState(State.PublicUse.str, { from: owner }));
    });
  });

  describe('setBank(address)', () => {
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
    });

    it('throw on not owner`s calling', async () => {
      await assertRevert(token.setBank(bank, { from: sender }));
    });

    it('throw on not valid address newBank', async () => {
      await assertRevert(token.setBank(token.address, { from: owner }));
      await assertRevert(token.setBank(ZERO_ADDRESS, { from: owner }));
    });

    it('set newBank', async () => {
      await token.setBank(bank, { from: owner });
    });
  });

  describe('setPriceSetter(address)', () => {
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
    });

    it('throw on not owner`s calling', async () => {
      await assertRevert(token.setPriceSetter(bank, { from: sender }));
    });

    it('set newPriceSetter', async () => {
      let priceSetterBefore = await token.priceSetter({ from: owner });
      await token.setPriceSetter(bank, { from: owner });
      let priceSetterAfter = await token.priceSetter({ from: owner });
      assert.equal(priceSetterBefore, ZERO_ADDRESS);
      assert.equal(bank, priceSetterAfter);
    });
  });

  describe('setAndFixTokenPriceInWei(uint256)', () => {
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
    });

    it('throw on not owner`s calling', async () => {
      await assertRevert(token.setAndFixTokenPriceInWei(1, { from: sender }));
    });

    it('onwer calling', async () => {
      await token.setAndFixTokenPriceInWei(1, { from: owner });
      let priceAfter = await token.tokenPriceInWei.call();
      assert.equal(priceAfter, 1);
    });

    it('PriceSetter calling', async () => {
      await token.setPriceSetter(sender, { from: owner });
      await token.setAndFixTokenPriceInWei(1, { from: sender });
      let priceAfter = await token.tokenPriceInWei.call();
      assert.equal(priceAfter, 1);
    });
  });

  describe('unfixTokenPriceInWei()', () => {
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
    });

    it('throw on not owner`s calling', async () => {
      await assertRevert(token.unfixTokenPriceInWei({ from: sender }));
    });

    it('onwer calling', async () => {
      await token.unfixTokenPriceInWei({ from: owner });
    });

    it('PriceSetter calling', async () => {
      await token.setPriceSetter(sender, { from: owner });
      await token.unfixTokenPriceInWei({ from: sender });
    });
  });

  describe('transfer(address,uint256)', () => {
    let transferAmount;
    beforeEach(async () => {
      token677Receiver = await Token677ReceiverMock.new();
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
      await token.setState(State.PublicUse.str, { from: owner });
      transferAmount = 100;
      await token.transfer(sender, transferAmount, { from: owner });
      assert.equal(await token677Receiver.sentValue(), 0);
    });

    it('does not let you transfer to the null address', async () => {
      await assertRevert(token.transfer(ZERO_ADDRESS, transferAmount, { from: sender }));
    });

    it('does not let you transfer to the contract itself', async () => {
      await assertRevert(token.transfer(token.address, transferAmount, { from: sender }));
    });

    it('transfers the tokens', async () => {
      let balance = await token.balanceOf(token677Receiver.address);
      assert.equal(balance, 0);
      await token.transfer(token677Receiver.address, transferAmount, { from: sender });
      balance = await token.balanceOf(token677Receiver.address);
      assert.equal(balance.toString(), transferAmount.toString());
    });

    it('does NOT call the fallback on transfer', async () => {
      await token.transfer(token677Receiver.address, transferAmount, { from: sender });

      let calledFallback = await token677Receiver.calledFallback();
      assert(!calledFallback);
    });

    it('returns true when the transfer succeeds', async () => {
      let success = await token.transfer(token677Receiver.address, transferAmount, { from: sender });
      assert(success);
    });

    it('throws when the transfer fails', async () => {
      await assertInvalidOpcode(token.transfer(token677Receiver.address, 100000, { from: sender }));
    });

    context('when sending to a contract that is not ERC677 compatible', () => {
      beforeEach(async () => {
        nonERC677 = await NotERC677Compatible.new();
      });

      it('transfers the token', async () => {
        let balance = await token.balanceOf(nonERC677.address);
        assert.equal(balance, 0);
        await token.transfer(nonERC677.address, transferAmount, { from: sender });
        balance = await token.balanceOf(nonERC677.address);
        assert.equal(balance.toString(), transferAmount.toString());
      });
    });
  });

  describe('approve(address,uint256)', () => {
    let amount = 1000;
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
      await token.setState(State.PublicUse.str, { from: owner });
    });

    it('allows token approval amounts to be updated without first resetting to zero', async () => {
      let originalApproval = BigNumber(1000);
      await token.approve(recipient, originalApproval.toNumber(), { from: owner });
      let approvedAmount = await token.allowance.call(owner, recipient);
      assert.equal(approvedAmount.toString(), originalApproval.toString());
    });

    it('throw when approval is not zero already', async () => {
      let originalApproval = BigNumber(1000);
      await token.approve(recipient, originalApproval.toNumber(), { from: owner });
      let approvedAmount = await token.allowance.call(owner, recipient);

      let laterApproval = BigNumber(2000);
      await assertRevert(token.approve(recipient, laterApproval.toNumber(), { from: owner }));
      assert.equal(approvedAmount.toString(), originalApproval.toString());
    });

    it('throws an error when approving the null address', async () => {
      await assertRevert(token.approve(ZERO_ADDRESS, amount, { from: owner }));
    });

    it('throws an error when approving the token itself', async () => {
      await assertRevert(token.approve(token.address, amount, { from: owner }));
    });
  });

  context('increaseApproval(address,uint256)', function () {
    it('should start with zero', async function () {
      let preApproved = await token.allowance(owner, recipient);
      assert.equal(preApproved.toString(), 0);
    });

    it('should increase by 50', async function () {
      await token.increaseApproval(recipient, 50, { from: owner });
      let postIncrease = await token.allowance(owner, recipient);
      assert.equal(50, postIncrease.toString());
    });
  });

  context('decreaseApproval(address,uint256)', function () {
    let prevApprowal;
    beforeEach(async () => {
      prevApprowal = await token.allowance(owner, recipient);
    });

    it('should decrease by 50', async function () {
      await token.increaseApproval(recipient, 200, { from: owner });
      await token.decreaseApproval(recipient, 50, { from: owner });
      let postDecrease = await token.allowance(owner, recipient);
      assert.equal(prevApprowal.plus(150), postDecrease.toString());
    });

    it('when allowance lowest then decrease set 0', async function () {
      await token.decreaseApproval(recipient, prevApprowal.plus(300), { from: owner });
      let postDecrease = await token.allowance(owner, recipient);
      assert.equal(0, postDecrease.toString());
    });
  });

  describe('transferFrom(address,address,uint256)', () => {
    let amount = 1000;
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
      await token.setState(State.PublicUse.str, { from: owner });
      await token.transfer(recipient, amount, { from: owner });
      await token.approve(owner, amount, { from: recipient });
    });

    it('throws an error when transferring to the null address', async () => {
      await assertRevert(token.transferFrom(recipient, ZERO_ADDRESS, amount, { from: owner }));
    });

    it('throws an error when transferring to the token itself', async () => {
      await assertRevert(token.transferFrom(recipient, token.address, amount, { from: owner }));
    });

    it('throws when transferring from to sender if amount > aallowance', async () => {
      await assertRevert(token.transferFrom(recipient, token.address, 2 * amount, { from: owner }));
    });

    it('check if tokens was sended', async () => {
      let balanceBefore = await token.balanceOf(owner, { from: owner });
      await token.transferFrom(recipient, owner, amount, { from: owner });
      let balanceAfter = await token.balanceOf(owner, { from: owner });
      assert.equal(balanceBefore.toString(), balanceAfter.minus(amount).toString());
    });
  });

  describe('transferAndCall(address, uint, bytes)', () => {
    let token677Receiver;
    let amount = 100;
    let data;
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
      await token.setState(State.PublicUse.str, { from: owner });
      data = owner;
      token677Receiver = await Token677ReceiverMock.new();
    });

    it('transfers the tokens', async () => {
      let balanceBefore = await token.balanceOf(token677Receiver.address);
      await token.transferAndCall(token677Receiver.address, amount, data, { from: owner });
      let balanceAfter = await token.balanceOf(token677Receiver.address);
      assert.equal(balanceBefore.toString(), 0);
      assert.equal(balanceAfter.toString(), amount);
    });

    it('calls the token fallback function on transfer', async () => {
      await token.transferAndCall(token677Receiver.address, amount, data, { from: owner });

      let calledFallback = await token677Receiver.calledFallback();
      assert(calledFallback, true);

      let tokenSender = await token677Receiver.tokenSender();
      assert.equal(tokenSender, owner);

      let sentValue = await token677Receiver.sentValue();
      assert.equal(sentValue.toString(), amount);

      let tokenData = await token677Receiver.tokenData();
      assert.equal(tokenData, data);
    });

    context('when sending to a contract that is not ERC677 compatible', () => {
      beforeEach(async () => {
        nonERC677 = await NotERC677Compatible.new();
      });
      it('throws an error', async () => {
        await assertRevert(token.transferAndCall(nonERC677.address, amount, data, { from: owner }));
      });
    });
  });

  context('transferAllAndCall(address, uint, bytes)', () => {
    let data;
    beforeEach(async () => {
      data = owner;
      token677Receiver = await Token677ReceiverMock.new();
    });

    it('transfers the tokens', async () => {
      let balanceBefore = await token.balanceOf(owner);
      await token.transferAllAndCall(token677Receiver.address, data, { from: owner });
      let balanceAfter = await token.balanceOf(token677Receiver.address);
      let balanceZero = await token.balanceOf(owner);
      assert.equal(balanceZero.toString(), 0);
      assert.equal(balanceAfter.toString(), balanceBefore.toString());
    });
  });

  describe('byTokens()', () => {
    context('check balances of tokens', () => {
      beforeEach(async () => {
        token = await PonziToken.new({ from: owner });
        await token.initContract({ from: owner });
        await token.setState(State.Sale.str, { from: owner });
        await token.setBank(bank, { from: owner });
      });
      let value = ether(1).toNumber();
      let amount = 1000;
      it('by tokens on 1 eth = 1000*10^8 PT, check tokens on sender`s balance', async () => {
        let balanceBefore = await token.balanceOf.call(sender);
        await token.byTokens({ from: sender, value: value });
        let balanceAfter = await token.balanceOf.call(sender);
        assert.equal(balanceBefore.toString(), 0);
        assert.equal(balanceAfter.toString(), amount * 1e+8);
      });

      it('by tokens on 1 eth = 1000*10^8 PT, check tokens on contract`s balance', async () => {
        let balanceBefore = await token.balanceOf.call(token.address);
        await token.byTokens({ from: sender, value: value });
        let balanceAfter = await token.balanceOf.call(token.address);
        assert.equal(balanceAfter.toString(), balanceBefore.minus(amount * 1e+8).toString());
      });

      it('by tokens on 2 eth check max token per address', async () => {
        let balanceTokenBefore = await token.balanceOf.call(token.address);
        let balanceSenderBefore = await token.balanceOf.call(sender);
        await token.byTokens({ from: sender, value: 2 * value });
        let balanceTokenAfter = await token.balanceOf.call(token.address);
        let balanceSenderAfter = await token.balanceOf.call(sender);
        assert.equal(balanceTokenAfter.toString(), balanceTokenBefore.minus(amount * 1e+8).toString());
        assert.equal(balanceSenderAfter.toString(), balanceSenderBefore.plus(amount * 1e+8).toString());
      });

      it('by tokens on 0.5 eth check max token per address', async () => {
        let balanceTokenBefore = await token.balanceOf.call(token.address);
        let balanceSenderBefore = await token.balanceOf.call(sender);
        await token.byTokens({ from: sender, value: value / 2 });
        let balanceTokenAfter = await token.balanceOf.call(token.address);
        let balanceSenderAfter = await token.balanceOf.call(sender);
        assert.equal(balanceTokenAfter.toString(), balanceTokenBefore.minus(amount / 2 * 1e+8).toString());
        assert.equal(balanceSenderAfter.toString(), balanceSenderBefore.plus(amount / 2 * 1e+8).toString());
      });

      it('throw when try to by tokens and balance = max tokens per address ', async () => {
        await token.byTokens({ from: sender, value: value });
        await assertRevert(token.withdraw({ from: sender }));
      });
    });

    context('check balances of eth; check pending Withdrawals', () => {
      let value = ether(1).toNumber();
      beforeEach(async () => {
        token = await PonziToken.new({ from: owner });
        await token.initContract({ from: owner });
        await token.setState(State.Sale.str, { from: owner });
        await token.setBank(bank, { from: owner });
      });

      it('check eth transfering on by tokens 2eth(owner, token, bank sender) ', async () => {
        let balanceOwnerBefore = await getBalance(owner);
        let balanceSenderBefore = await getBalance(sender);
        let balanceBankBefore = await getBalance(bank);
        let balanceTokenBefore = await getBalance(token.address);
        await token.byTokens({ from: sender, value: 2 * value });
        let balanceOwnerAfter = await getBalance(owner);
        let balanceSenderAfter = await getBalance(sender);
        let balanceBankAfter = await getBalance(bank);
        let balanceTokenAfter = await getBalance(token.address);
        assert.equal(balanceOwnerBefore.toString(), balanceOwnerAfter.minus(5 / 100 * value));
        assert.equal(balanceBankBefore.toString(), balanceBankAfter.minus(95 / 100 * value));
        assert.equal(
          balanceSenderBefore.toString(),
          BigNumber(latestGasUsed()).multipliedBy(gasPrice).plus(2 * value).plus(balanceSenderAfter).toString()
        );
        assert.equal(balanceTokenBefore.toString(), balanceTokenAfter.toString() - value);
      });

      it('check eth transfering on by tokens 0.5 eth(owner, token, bank sender) ', async () => {
        let balanceOwnerBefore = await getBalance(owner);
        let balanceSenderBefore = await getBalance(sender);
        let balanceBankBefore = await getBalance(bank);
        let balanceTokenBefore = await getBalance(token.address);
        await token.byTokens({ from: sender, value: value / 2 });
        let balanceOwnerAfter = await getBalance(owner);
        let balanceSenderAfter = await getBalance(sender);
        let balanceBankAfter = await getBalance(bank);
        let balanceTokenAfter = await getBalance(token.address);
        assert.equal(balanceOwnerBefore.toString(), balanceOwnerAfter.minus(5 / 100 * value / 2).toString());
        assert.equal(balanceBankBefore.toString(), balanceBankAfter.minus(95 / 100 * value / 2).toString());
        assert.equal(
          balanceSenderBefore.toString(),
          BigNumber(latestGasUsed()).multipliedBy(gasPrice).plus(value / 2).plus(balanceSenderAfter).toString()
        );
        assert.equal(balanceTokenBefore.toString(), balanceTokenAfter.toString());
      });

      it('check pending Withdrawals 2eth', async () => {
        let pendingWithdrawalsBefore = await token.pendingWithdrawals.call(sender);
        await token.byTokens({ from: sender, value: 2 * value });
        let pendingWithdrawalsAfter = await token.pendingWithdrawals.call(sender);
        assert.equal(pendingWithdrawalsBefore.plus(value).toString(), pendingWithdrawalsAfter.toString());
      });

      it('check pending Withdrawals 0.5eth', async () => {
        let pendingWithdrawalsBefore = await token.pendingWithdrawals.call(sender);
        await token.byTokens({ from: sender, value: value / 2 });
        let pendingWithdrawalsAfter = await token.pendingWithdrawals.call(sender);
        assert.equal(pendingWithdrawalsBefore.toString(), pendingWithdrawalsAfter.toString());
      });

      it('throw when try to by tokens and eht < price for 1 token ', async () => {
        let price = await token.tokenPriceInWei.call();
        await assertRevert(token.byTokens({ from: sender, value: price.minus(100) }));
      });
    });

    context('fallback()', () => {
      let value = ether(0.5);
      before(async () => {
        token = await PonziToken.new({ from: owner });
        await token.initContract({ from: owner });
      });

      it('throw when contract no in Sale state', async () => {
        await expectThrow(
          toPromise(web3.eth.sendTransaction)({
            from: sender,
            to: token.address,
            value: value,
          }),
        );
      });

      it('successful send 0.5eth to contact and recive tokens', async () => {
        await token.setState(State.Sale.str, { from: owner });
        let balanceTokenBefore = await token.balanceOf.call(token.address);
        let balanceSenderBefore = await token.balanceOf.call(sender);
        let send = await web3.eth.sendTransaction({
          from: sender,
          to: token.address,
          value: value,
          gas: 500000,
        });
        let balanceTokenAfter = await token.balanceOf.call(token.address);
        let balanceSenderAfter = await token.balanceOf.call(sender);
        assert(send);
        assert.equal(balanceTokenAfter.toString(), balanceTokenBefore.minus(500 * 1e+8).toString());
        assert.equal(balanceSenderAfter.toString(), balanceSenderBefore.plus(500 * 1e+8).toString());
      });
    });
  });

  describe('withdraw() check balances of eth; check pending Withdrawals', () => {
    let value = ether(1).toNumber();
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
      await token.setState(State.Sale.str, { from: owner });
      await token.setBank(bank, { from: owner });
    });

    it('check eth transfering on by tokens 2eth(owner, token, bank sender) ', async () => {
      let balanceOwnerBefore = await getBalance(owner);
      let balanceSenderBefore = await getBalance(sender);
      let balanceBankBefore = await getBalance(bank);
      let balanceTokenBefore = await getBalance(token.address);
      await token.byTokens({ from: sender, value: 2 * value });
      let gasUsedByTokens = latestGasUsed() * gasPrice;
      await token.withdraw({ from: sender });
      let gasUsedWithdraw = latestGasUsed() * gasPrice;
      let balanceOwnerAfter = await getBalance(owner);
      let balanceSenderAfter = await getBalance(sender);
      let balanceBankAfter = await getBalance(bank);
      let balanceTokenAfter = await getBalance(token.address);
      assert.equal(balanceOwnerBefore.toString(), balanceOwnerAfter.minus(5 / 100 * value).toString());
      assert.equal(balanceBankBefore.toString(), balanceBankAfter.minus(95 / 100 * value).toString());
      assert.equal(
        balanceSenderBefore.toString(),
        BigNumber(gasUsedByTokens).plus(gasUsedWithdraw).plus(value).plus(balanceSenderAfter).toString()
      );
      assert.equal(balanceTokenBefore.toString(), balanceTokenAfter.toString());
    });

    it('check throw; check eth transfering on by tokens 0.5eth(owner, token, bank sender) ', async () => {
      let balanceOwnerBefore = await getBalance(owner);
      let balanceSenderBefore = await getBalance(sender);
      let balanceBankBefore = await getBalance(bank);
      let balanceTokenBefore = await getBalance(token.address);
      await token.byTokens({ from: sender, value: value / 2 });
      let gasUsedByTokens = latestGasUsed() * gasPrice;
      await assertRevert(token.withdraw({ from: sender }));
      let gasUsedWithdraw = latestGasUsed() * gasPrice;
      let balanceOwnerAfter = await getBalance(owner);
      let balanceSenderAfter = await getBalance(sender);
      let balanceBankAfter = await getBalance(bank);
      let balanceTokenAfter = await getBalance(token.address);
      assert.equal(balanceOwnerBefore.toString(), balanceOwnerAfter.minus(5 / 100 * value / 2).toString());
      assert.equal(balanceBankBefore.toString(), balanceBankAfter.minus(95 / 100 * value / 2).toString());
      assert.equal(
        balanceSenderBefore.toString(),
        BigNumber(gasUsedByTokens).plus(gasUsedWithdraw).plus(value / 2).plus(balanceSenderAfter).toString()
      );
      assert.equal(balanceTokenBefore.toString(), balanceTokenAfter.toString());
    });

    it('check pending Withdrawals = 1eth', async () => {
      let pendingWithdrawalsBefore = await token.pendingWithdrawals.call(sender);
      await token.byTokens({ from: sender, value: 2 * value });
      await token.withdraw({ from: sender });
      let pendingWithdrawalsAfter = await token.pendingWithdrawals.call(sender);
      assert.equal(pendingWithdrawalsBefore.toString(), pendingWithdrawalsAfter.toString());
    });

    it('throws when pending Withdrawals = 0', async () => {
      let pendingWithdrawalsBefore = await token.pendingWithdrawals.call(sender);
      await token.byTokens({ from: sender, value: value / 2 });
      await assertRevert(token.withdraw({ from: sender }));
      let pendingWithdrawalsAfter = await token.pendingWithdrawals.call(sender);
      assert.equal(pendingWithdrawalsBefore.toString(), pendingWithdrawalsAfter.toString());
    });
  });

  describe('checkAccess()', () => {
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
    });

    it('has access if m_firstEntranceToSaleStateUNIX == 0', async () => {
      await increaseTime(duration.days(145));
      await token.setState(State.Sale.str, { from: owner });
    });

    it('has access if now - m_firstEntranceToSaleStateUNIX <= DURATION_TO_ACCESS_FOR_OWNER', async () => {
      await token.setState(State.Sale.str, { from: owner });
      await increaseTime(duration.days(140));
      await token.setState(State.PublicUse.str, { from: owner });
    });

    it('has access if m_state != State.PublicUse', async () => {
      await token.setState(State.Sale.str, { from: owner });
      await increaseTime(duration.days(145));
      await token.setState(State.PublicUse.str, { from: owner });
    });

    it('throw on DURATION_TO_ACCESS_FOR_OWNER is expired and state == PublicUse', async () => {
      await token.setState(State.Sale.str, { from: owner });
      await token.setState(State.PublicUse.str, { from: owner });
      await increaseTime(duration.days(145));
      await assertRevert(token.setState(State.PublicUse.str, { from: owner }));
    });
  });

  describe('calcTokenPriceInWei()', () => {
    beforeEach(async () => {
      token = await PonziToken.new({ from: owner });
      await token.initContract({ from: owner });
      await token.setState(State.Sale.str, { from: owner });
    });

    it('price for 1 day = 1e+7', async () => {
      let price = await token.tokenPriceInWei({ from: owner });
      assert.equal(price.toString(), 1e+7);
    });

    it('price for 2 day = 2e+7', async () => {
      await increaseTime(duration.days(1) + 100);
      await token.setState(State.Sale.str, { from: owner });
      let price = await token.tokenPriceInWei({ from: owner });
      assert.equal(price.toString(), 2e+7);
    });

    it('price for 7 day = 7e+7', async () => {
      await increaseTime(duration.days(6) + 100);
      await token.setState(State.Sale.str, { from: owner });
      let price = await token.tokenPriceInWei({ from: owner });
      assert.equal(price.toString(), 7e+7);
    });

    it('price for 12 day = 12e+7', async () => {
      await increaseTime(duration.days(11) + 100);
      await token.setState(State.Sale.str, { from: owner });
      let price = await token.tokenPriceInWei({ from: owner });
      assert.equal(price.toString(), 12e+7);
    });

    it('price for >12 day = 12e+7', async () => {
      await increaseTime(duration.days(120));
      await token.setState(State.Sale.str, { from: owner });
      let price = await token.tokenPriceInWei({ from: owner });
      assert.equal(price.toString(), 12e+7);
    });
  });
});
