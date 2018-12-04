////////////////////////////////////
// Custom components



export const enum TrapState 
{
  Available,
  PreparedOne,
  PreparedBoth,
  Fired,
  NotAvailable,
}

@Component('buttonData')
export class ButtonData {
  label: string
  pressed: boolean
  zUp: number = 0
  zDown: number = 0
  fraction: number
  timeDown: number
  constructor(zUp: number, zDown: number){
    this.zUp = zUp
    this.zDown = zDown
    this.pressed = false
    this.fraction = 0
    this.timeDown = 2
  }
}

export const buttons = engine.getComponentGroup(ButtonData)

@Component('tilePos')
export class TilePos {
  gridPos: Vector2
}

export const tiles = engine.getComponentGroup(TilePos)

@Component('creepData')
export class CreepData {
  gridPos: Vector2
  isDead: boolean
  pathPos: number
  lerpFraction: number
}

export const creeps = engine.getComponentGroup(CreepData)

@Component('trapdata')
export class TrapData {
  gridPos: Vector2
  trapState: TrapState
  leftLever: boolean
  rightLever: boolean
  constructor(gridPos?: Vector2) {
    this.gridPos = gridPos
    this.trapState = TrapState.Available
    this.leftLever = false
    this.rightLever = false
  }
  reset(gridPos: Vector2) {
    this.gridPos = gridPos
    this.trapState = TrapState.Available
    this.leftLever = false
    this.rightLever = false
  }
}

export const traps = engine.getComponentGroup(TrapData)

@Component('gameData')
export class GameData {
  won: boolean
  lost: boolean
  path: Vector2[]
  creeps: Entity[]
  traps: Entity[]
  humanScore: number = 0
  creepScore: number = 0
  creepInterval: number
}