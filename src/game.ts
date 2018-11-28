
export enum ButtonState
{
  Normal,
  Pressed,
}

export const enum TrapState 
{
  Available,
  PreparedOne,
  PreparedBoth,
  Fired,
  NotAvailable,
}

////////////////////////////////////
// Custom components

@Component('buttonData')
export class ButtonData {
  state: ButtonState
  label: string
}

const buttons = engine.getComponentGroup(ButtonData)

@Component('tilePos')
export class TilePos {
  gridPos: Vector2
}

const tiles = engine.getComponentGroup(TilePos)

@Component('creepData')
export class CreepData {
  gridPos: Vector2
  isDead: boolean
}

const creeps = engine.getComponentGroup(CreepData)

@Component('trapdata')
export class TrapData {
  gridPos: Vector2
  trapState: TrapState
}

const traps = engine.getComponentGroup(TrapData)

@Component('gameData')
export class GameData {
  won: boolean
  lost: boolean
  path: Vector2[]
  creeps: Entity[]
  traps: Entity[]
  humanScore: number
  creepScore: number
  creepInterval: number
}

////////////////////////////////////////
// Systems

export class SpawnCreeps implements ISystem {
  update(dt: number) {
    gameData.creepInterval -= dt
    if (gameData.creepInterval < 0){
      spawnCreep()
      gameData.creepInterval = 3 + Math.random() * 3
    }
  }
}

engine.addSystem(new SpawnCreeps)


//////////////////////////////////////////
// Add entities


const game = new Entity()
const gameData = new GameData()
game.set(gameData)

const button = new Entity()
button.set(new Transform())
button.set(new BoxShape())
button.get(Transform).position.set(18.65, 0.7, 18.75)
let buttonData = new ButtonData()
button.set(buttonData)
buttonData.label = "New Game"
buttonData.state = ButtonState.Normal
button.set(
  new OnClick(e => {
    log("clicked")
    buttonData.state = ButtonState.Pressed
    newGame()
    // button up
  })
)

engine.addEntity(game)
engine.addEntity(button)



///////////////////////////////////
// Functions

function newGame(){
  for(let creep of creeps.entities)
  {
    creep.get(CreepData).isDead = true;
  }

  gameData.humanScore = 0
  gameData.creepScore = 0
  gameData.lost = false
  gameData.won = false
  gameData.creepInterval = 3

  // while(true)
  // {
  //   try 
  //   {
      gameData.path = generatePath()
      log(gameData.path)
      spawnTrap()
      spawnTrap()
  //     break;
  //   }
  //   catch {}
  // }

}


function spawnTrap(){
  log("new trap")
}

function spawnCreep(){
  log("new creep")
}



function generatePath(): Vector2[]
{
  const path: Vector2[] = []
  let position = new Vector2(10, 1)
  path.push(JSON.parse(JSON.stringify(position)))
  for(let i = 0; i < 2; i++)
  {
    position.y++
    path.push(JSON.parse(JSON.stringify(position)))
  }

  let counter = 0
  while(position.y < 18)
  {
    if(counter++ > 1000)
    {
      throw new Error("Invalid path, try again")
    }
    let nextPosition = new Vector2(position.x, position.y)
    switch(Math.floor(Math.random() * 3))
    {
      case 0:
        nextPosition.x += 1
        break
      case 1:
        nextPosition.x -= 1
        break
      default:
        nextPosition.y += 1
    }
    if(!isValidPosition(nextPosition) 
      || path.filter((p) => p.x == nextPosition.x && p.y == nextPosition.y).length > 0
      || getNeighborCount(path, nextPosition) > 1)
    {
      continue;
    }
    position = nextPosition;
    path.push(JSON.parse(JSON.stringify(position)))
  }
  position.y++;
  path.push(JSON.parse(JSON.stringify(position)));
  return path;
}

function isValidPosition(position: Vector2)
{
  return position.x >= 1 
    && position.x < 19 
    && position.y >= 1 
    && position.y < 19
    && (position.x < 18 || position.y < 18)
    && (position.x > 1 || position.y > 1);
}

function getNeighborCount(path: Vector2[], position: Vector2)
{
  const neighbors: {x: number, y: number}[] = [
    {x: position.x + 1, y: position.y},
    {x: position.x - 1, y: position.y},
    {x: position.x, y: position.y + 1},
    {x: position.x, y: position.y - 1},
  ];

  let count = 0;
  for(const neighbor of neighbors)
  {
    if(path.filter((p) => p.x == neighbor.x && p.y == neighbor.y).length > 0)
    {
      count++;
    }
  }

  return count;
}