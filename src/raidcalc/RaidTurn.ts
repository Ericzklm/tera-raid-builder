import { State } from "../calc/state";
import { calculate, Field, Generations, Move, Pokemon } from "../calc";
import { MoveData, RaidMoveOptions, RaidState, RaidTurnResult, RaidMoveResult, RaidTurnInfo } from "./interface";
import { getModifiedStat } from "../calc/mechanics/util";
import { Raider } from "./interface";
import { RaidMove } from "./RaidMove";

const gen = Generations.get(9);

export class RaidTurn {
    raidState:      RaidState;
    raiderID:       number;
    targetID:       number;
    raiderMoveData!: MoveData;
    bossMoveData!:   MoveData;
    raiderOptions:  RaidMoveOptions;
    bossOptions:    RaidMoveOptions;

    //options should include crit, boosts/drops, status effect, min/max damage roll

    _raiderMovesFirst!: boolean;
    _raider!:         Raider;
    _boss!:           Raider;  
    _raiderMove!:     Move;
    _bossMove!:       Move;

    _result1!:        RaidMoveResult;
    _result2!:        RaidMoveResult;
    _raidState!:      RaidState;


    constructor(raidState: RaidState, info: RaidTurnInfo) {
        this.raidState = raidState;
        this.raiderID = info.moveInfo.userID;
        this.targetID = info.moveInfo.targetID;
        this.raiderMoveData = info.moveInfo.moveData;
        this.bossMoveData = info.bossMoveInfo.moveData;

        this.raiderOptions = info.moveInfo.options || {};
        this.bossOptions = info.bossMoveInfo.options || {};
    }

    public result(): RaidTurnResult {
        this._raiderMove = new Move(9, this.raiderMoveData.name, this.raiderOptions);
        if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
        if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
        this._bossMove = new Move(9, this.bossMoveData.name, this.bossOptions);
        if (this.raiderOptions.crit) this._raiderMove.isCrit = true;
        if (this.raiderOptions.hits !== undefined) this._raiderMove.hits = this.raiderOptions.hits;
        this.setTurnOrder();
        this._raidState = this.raidState.clone();
        if (this._raiderMovesFirst) {
            this._result1 = new RaidMove(
                this.raiderMoveData, 
                this._raiderMove, 
                this._raidState, 
                this.raiderID, 
                this.targetID,
                this.raiderID,
                this._raiderMovesFirst,
                this.raiderOptions).result();
            this._raidState = this._result1.state;
            this._result2 = new RaidMove(
                this.bossMoveData, 
                this._bossMove, 
                this._raidState, 
                0, 
                this.raiderID,
                this.raiderID,
                this._raiderMovesFirst,
                this.bossOptions).result();
            this._raidState = this._result2.state;
        } else {
            this._result1 = new RaidMove(
                this.bossMoveData, 
                this._bossMove, 
                this._raidState, 
                0, 
                this.raiderID,
                this.raiderID,
                this._raiderMovesFirst,
                this.raiderOptions).result();
            this._raidState = this._result1.state;
            this._result2 = new RaidMove(
                this.raiderMoveData, 
                this._raiderMove, 
                this._raidState, 
                this.raiderID, 
                this.targetID,
                this.raiderID,
                this._raiderMovesFirst,
                this.bossOptions).result();
            this._raidState = this._result2.state;
        }
        return {
            state: this._raidState,
            results: [this._result1, this._result2],
            raiderMovesFirst: this._raiderMovesFirst
        }

    }

    private setTurnOrder() {
        this._raider = this.raidState.raiders[this.raiderID];
        this._boss = this.raidState.raiders[0];
        // first compare priority
        const raiderPriority = this._raiderMove.priority;
        const bossPriority = this._bossMove.priority;
        if (raiderPriority > bossPriority) {
            this._raiderMovesFirst = true;
        } else if (bossPriority < raiderPriority) {
            this._raiderMovesFirst = false;
        } else {
            // if priority is the same, compare speed
            let raiderSpeed = getModifiedStat(this._raider.stats.spe, this._raider.boosts.spe, gen);
            let bossSpeed = getModifiedStat(this._boss.stats.spe, this._boss.boosts.spe, gen);
            const bossField = this.raidState.fields[0];
            const raiderField = this.raidState.fields[this.raiderID];
            if (raiderField.attackerSide.isTailwind) { raiderSpeed *= 2 };
            if (bossField.attackerSide.isTailwind) { bossSpeed *= 2 };
            this._raiderMovesFirst = bossField.isTrickRoom ? (raiderSpeed < bossSpeed) : (raiderSpeed > bossSpeed);
        }
    }
    
}