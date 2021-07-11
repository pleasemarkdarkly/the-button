// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Button is Ownable, Pausable {    
    
    using SafeMath for uint256;    
    
    string public author = "Mark Phillips";
    uint256 public num_players;
    uint256 public entry_fee;    
    
    mapping(uint256 => address payable) public players; // count => address 
    mapping(address => uint256) public participated;    // address => block.number

    enum State { Accepting, Distributing, Paid }
    State internal state;

    receive() external payable {}
    fallback() external payable {}

    constructor(uint _entry_fee) Ownable() Pausable() { 
        require(_entry_fee > 0, "ENTRY FEE MUST BE NON-ZERO");
        state = State.Accepting;
        entry_fee = _entry_fee;
    }

    function set_entry_fee(uint _entry_fee) external onlyOwner isFinished {
        require(_entry_fee > 0, "ENTRY FEE MUST BE NON-ZERO");
        state = State.Accepting;
        entry_fee = _entry_fee;
    }

    modifier joinable(){
        require (state == State.Accepting, "STATE IS NOT JOINABLE");
        _;
    }
    modifier isFinished(){
        require (state == State.Distributing, "STATE IS FINISHED");
        _;
    }
    modifier restartable(){
        require (state == State.Paid, "STATE RESTARTABLE");
        _;
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    function press_button() external payable joinable whenNotPaused {                
        require(msg.value == entry_fee, "SENDER AMOUNT DOES NOT EQUAL ENTRY FEE");
        require(msg.sender != address(0), "INVALID ADDRESS");                
        require(participated[msg.sender] == uint256(0), "SINGLE ENTRY ALLOWED");
        console.log("button_pushed by %s contributing %s", msg.sender, msg.value);
        if(msg.value > 0){
            if(participated[msg.sender] == uint256(0)){
                players[num_players] = payable(msg.sender);
                participated[msg.sender] = block.number;
                num_players++;
                if (num_players == 3){
                    state = State.Distributing;
                }
            }            
        }                
    }

    function claim_treasure() external payable isFinished whenNotPaused {
        require(num_players == 3, "TREASURE CLAIM REQUIRES 3 PLAYERS"); 
        require(block.number >= participated[msg.sender] + 3, "PREMATURE TREASURE CLAIM");
        console.log("Winner Winner Chicken Dinner:%s of %s (wei)", players[num_players - 1], address(this).balance);
        console.log("Collection block no.:%s, current block no.:%s", participated[msg.sender] + 3, block.number);        
        state = State.Paid; 
        (bool sent, ) = payable(players[num_players - 1]).call{value: address(this).balance}("");
        require(sent, "FAILED TO SEND ETHER TO WINNER");
        if (sent){            
            restart();
        }
    }

    function restart() public restartable whenNotPaused {
        num_players = 0;
        address payable empty;
        for (uint i =0; i <= 2; i++){
            participated[players[i]] = 0;
            players[i] = empty;
        }
        state = State.Accepting;
    }
}