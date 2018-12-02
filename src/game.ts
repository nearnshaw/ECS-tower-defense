
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


class Pool {
  pool: Entity[] = []
  max?: number = 1000
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
    this.pool.push(instance)
    return instance
  }
}

const MAX_TRAPS = 2
const MAX_CREEPS = 4

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
  pathPos: number
  lerpFraction: number
}

const creeps = engine.getComponentGroup(CreepData)

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


export class moveBlobs {
  update() {
    for( let creep of creeps.entities){
      let transform = creep.get(Transform)
      let path =  gameData.path
      let creepData = creep.get(CreepData)
      if (creepData.lerpFraction < 1) {
          const pos2d = Vector2.Lerp(
          path[creepData.pathPos],
          path[creepData.pathPos + 1],
          creepData.lerpFraction
          )
        
          transform.position.set(pos2d.x, 0.25, pos2d.y)
          creepData.lerpFraction += 1 / 60
      } 
      else {
        log(creepData.pathPos)
        if (creepData.pathPos >= path.length - 2){
          gameData.creepScore += 1
          log("LOOOSE"+ gameData.creepScore)
          engine.removeEntity(creep)
        } 
        else {
          creepData.pathPos += 1     
          creepData.lerpFraction = 0
    
          //rotate.previousRot = transform.rotation
          //rotate.targetRot = fromToRotation(transform.position, path.target)
          //rotate.rotateFraction = 0
          let nextPos = new Vector3(path[creepData.pathPos + 1].x , 0.25, path[creepData.pathPos + 1].y)
          transform.lookAt(nextPos)
        }
       
      }

    }  
  }
}

engine.addSystem(new moveBlobs())

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


const floorMaterial = new Material
floorMaterial.albedoTexture = "materials/WoodFloor.png"

const groundMaterial = new Material
groundMaterial.albedoTexture = "materials/StoneFloor.png"

let ground = new Entity()
ground.set(new Transform())
ground.get(Transform).position.set(10, 0, 10)
ground.get(Transform).rotation.setEuler(90, 0, 0)
ground.get(Transform).scale.setAll(20)
ground.set(new PlaneShape)
ground.set(groundMaterial)
engine.addEntity(ground)





///////////////////////////////////
// Functions

function newGame(){

  gameData.humanScore = 0
  gameData.creepScore = 0
  gameData.lost = false
  gameData.won = false
  gameData.creepInterval = 3

  // get rid of old path
  //for (let i = 0; i < tileSpawner.tilePool.length; i++) {
  for(let tile of tiles.entities){

     engine.removeEntity(tile)
  }

  // get rid of old creeps
  for(let creep of creeps.entities){
    creep.get(CreepData).isDead = true;
    engine.removeEntity(creep)
  }

  for(let trap of traps.entities){
    engine.removeEntity(trap)
  }

  // create random path
  gameData.path = generatePath()
  log(gameData.path)
  
  // draw path with tiles
  for (let tile in gameData.path){
    let pos = gameData.path[tile]
    spawnTile(pos)
  }

  // add traps
  placeTraps()

}




// Object pools

let tilePool = new Pool()
let creepPool = new Pool()
let trapPool = new Pool()
creepPool.max = MAX_CREEPS
trapPool.max = MAX_TRAPS * 3

function spawnTrap(){
  const trap = trapPool.getEntity()
  engine.addEntity(trap) 
  const leftLever = trapPool.getEntity()
  engine.addEntity(leftLever)
  const rightLever = trapPool.getEntity()
  engine.addEntity(rightLever)

  let pos = randomTrapPosition()

  let t = trap.getOrCreate(Transform)
  t.position.set(pos.x, 0.11, pos.y)
  t.scale.setAll(0.5)

  let d = trap.getOrCreate(TrapData)
  d.gridPos = pos

  trap.set(new GLTFShape("models/SpikeTrap/SpikeTrap.gltf"))
  const spikeUp = new AnimationClip("SpikeUp", {loop: false})
  const despawn= new AnimationClip("Despawn", {loop: false})
  trap.get(GLTFShape).addClip(spikeUp)
  trap.get(GLTFShape).addClip(despawn)
  

  let lt = leftLever.getOrCreate(Transform)
  lt.position.set(-1.5, 0, 0)
  lt.rotation.eulerAngles = new Vector3(0, 90, 0)

  if (!leftLever.has(GLTFShape)){
    leftLever.set(new GLTFShape("models/Lever/LeverBlue.gltf"))
    const leverOff = new AnimationClip("LeverOff", {loop: false})
    const leverOn= new AnimationClip("LeverOn", {loop: false})
    const LeverDespawn= new AnimationClip("LeverDeSpawn", {loop: false})
    leftLever.get(GLTFShape).addClip(leverOff)
    leftLever.get(GLTFShape).addClip(leverOn)
    leftLever.get(GLTFShape).addClip(LeverDespawn)
  }

  leftLever.setParent(trap)
  
  if (!leftLever.has(OnClick)){
    leftLever.set(new OnClick(e => {
      operateLeftLever(leftLever)
    }))
  }

  let rt = rightLever.getOrCreate(Transform)
  rt.position.set(1.5, 0, 0)
  rt.rotation.eulerAngles = new Vector3(0, 90, 0)

  if (!rightLever.has(GLTFShape)){
    rightLever.set(new GLTFShape("models/Lever/LeverRed.gltf"))
    const leverOff = new AnimationClip("LeverOff", {loop: false})
    const leverOn= new AnimationClip("LeverOn", {loop: false})
    const LeverDespawn= new AnimationClip("LeverDeSpawn", {loop: false})
    rightLever.get(GLTFShape).addClip(leverOff)
    rightLever.get(GLTFShape).addClip(leverOn)
    rightLever.get(GLTFShape).addClip(LeverDespawn)
  }

  rightLever.setParent(trap)
  
  if (!rightLever.has(OnClick)){
    rightLever.set(new OnClick(e => {
      operateLeftLever(rightLever)
    }))
  }

  log("placed a trap in" + pos)
}


function spawnTile(pos: Vector2) {
  const ent = tilePool.getEntity()

  let t = ent.getOrCreate(Transform)
  t.position.set(pos.x, 0.1, pos.y)
  t.rotation.setEuler(90, 0, 0)

  let p = ent.getOrCreate(TilePos)
  p.gridPos = pos

  ent.set(new PlaneShape)
  ent.set(floorMaterial)

  engine.addEntity(ent)
}

function spawnCreep(){
  log("new creep")
  let ent = creepPool.getEntity()
  if (!ent) return

  let t = ent.getOrCreate(Transform)
  t.position.set(10, 0.25, 1)

  let d = ent.getOrCreate(CreepData)
  d.isDead = false
  d.gridPos = gameData.path[0]
  d.pathPos = 0
  d.lerpFraction = 0

  if (!ent.has(GLTFShape)){
    ent.set(new GLTFShape("models/BlobMonster/BlobMonster.gltf"))
    const clipWalk = new AnimationClip("Walking", {loop: true})
    const clipDie= new AnimationClip("Dying", {loop: false})
    ent.get(GLTFShape).addClip(clipWalk)
    ent.get(GLTFShape).addClip(clipDie)
    clipWalk.play()
  }
    
  engine.addEntity(ent)
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
    if(counter++ > 2000)
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

function placeTraps(){
  for (let i = 0; i < MAX_TRAPS; i ++)
  {
    spawnTrap()
  }
}


function operateLeftLever(lever: Entity){
  let data = lever.getParent().get(TrapData)
  if(data.leftLever){
    data.leftLever = false
    lever.get(GLTFShape).getClip("LeverOff").play()
  } else {
    data.leftLever = true
    lever.get(GLTFShape).getClip("LeverOn").play()
    if (data.rightLever){
      data.trapState = TrapState.Fired
      lever.getParent().get(GLTFShape).getClip("SpikeUp").play()
    }
  }
}

function operateRightLever(lever: Entity){
  let data = lever.getParent().get(TrapData)
  if(data.rightLever){
    data.rightLever = false
    lever.get(GLTFShape).getClip("LeverOff").play()
  } else {
    data.rightLever = true
    lever.get(GLTFShape).getClip("LeverOn").play()
    if (data.leftLever){
      data.trapState = TrapState.Fired
      lever.getParent().get(GLTFShape).getClip("SpikeUp").play()
    }
  }
}


function randomTrapPosition()
  {
    let counter = 0;
    while(true)
    {
      if(counter++ > 1000)
      {
        throw new Error("Invalid trap position, try again");
      }
      let path = gameData.path
      const posIndex = Math.floor(Math.random() * path.length)
      const position = gameData.path[posIndex]
      if( path.filter((p) => p.x == position.x - 1 && p.y == position.y).length == 0
        && path.filter((p) => p.x == position.x + 1 && p.y == position.y).length == 0
        && position.y > 2
        && position.y < 18
        && position.x > 2
        && position.x < 18
        && traps.entities.filter((t) => JSON.stringify(position) == JSON.stringify(t.get(TrapData).gridPos)).length == 0
      )
      {
        return position 
      }
    } 
  }