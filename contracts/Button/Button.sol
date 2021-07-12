// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract Button is Ownable, Pausable {    
            
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

    modifier joinable(){
        require (state == State.Accepting, "BUTTON PUSHABLE");
        _;
    }
    modifier isFinished(){
        require (state == State.Distributing, "BUTTON ROUND FINISHED");
        _;
    }
    modifier restartable(){
        require (state == State.Paid, "BUTTON RESTARTING");
        _;
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    function press_button() external payable joinable whenNotPaused {                
        require(msg.value == entry_fee, "BUTTON PUSH REQUIRES ENTRY FEE");
        require(participated[msg.sender] == uint256(0), "SORRY SINGLE ENTRY ALLOWED");
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
        require(players[num_players - 1] == msg.sender, "YOU WERE NOT THE LAST BUTTON PUSHER");
        console.log("Winner Winner Chicken Dinner:%s of %s (wei)", players[num_players - 1], address(this).balance);
        require(block.number >= participated[msg.sender] + 3, "PREMATURE CLAIM TREASURE, PATIENCE");
        console.log("Current  block no.:%s, Treasure unlock block no.:%s", block.number, participated[msg.sender] + 3);        
        state = State.Paid; 
        (bool sent, ) = payable(players[num_players - 1]).call{value: address(this).balance}("");
        require(sent, "UNABLE TO SEND TREASURE TO WINNER");
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