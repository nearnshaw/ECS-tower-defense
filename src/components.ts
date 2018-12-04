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
  isDead: boolean
  pathPos: number
  lerpFraction: number
}

export const creeps = engine.getComponentGroup(CreepData)

@Component('trapdata')
export class TrapData {
  pathPos: number
  trapState: TrapState
  leftLever: boolean
  rightLever: boolean
  constructor(pathPos?: number) {
    this.pathPos = pathPos
    this.trapState = TrapState.Available
    this.leftLever = false
    this.rightLever = false
  }
  reset(pathPos: number) {
    this.pathPos = pathPos
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


export class Pool {
    pool: Entity[] = []
    max?: number = 1000
    constructor(max:number = 1000){
        this.pool = []
        this.max = max
    }
    getEntity() {
      for (let i = 0; i < this.pool.length; i++) {
        const entity = this.pool[i]
        if (!entity.alive) {
          return entity
        }
      }
      if (this.pool.length < this.max){
        return this.newEntity()
      } else {
        return null
      }
    }
    newEntity() {
      const instance = new Entity()
      instance.name = (Math.random() * 10000).toString()
      this.pool.push(instance)
      return instance
    }
  }