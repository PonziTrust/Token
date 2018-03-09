pragma solidity ^0.4.8;


contract Token677ReceiverMock {
  address public tokenSender;
  uint public sentValue;
  bytes public tokenData;
  bool public calledFallback = false;

  function tokenFallback(
    address sender, 
    uint value, 
    bytes data)
    public 
  {
    calledFallback = true;

    tokenSender = sender;
    sentValue = value;
    tokenData = data;
  }
}
