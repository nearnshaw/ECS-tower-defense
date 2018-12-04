
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
    instance.name = (Math.random() * 10000).toString()
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
  humanScore: number = 0
  creepScore: number = 0
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
        if (creepData.pathPos >= path.length - 2){
          gameData.creepScore += 1
          log("LOOOSE "+ gameData.creepScore)
          scoreTextCreeps.get(TextShape).value = gameData.creepScore.toString()
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


export class killBlobs {
  update() {
    for (let trap of traps.entities){
      let trapData = trap.get(TrapData)
      if (trapData.trapState == TrapState.Fired){
        for( let creep of creeps.entities){
        
          let creepData = creep.get(CreepData)
          if( trapData.gridPos == creepData.gridPos
            && creepData.isDead == false){
              log("KILL")
              creepData.isDead = true
              engine.removeEntity(creep)
              scoreTextHumans.get(TextShape).value = gameData.humanScore.toString()
            }    
        }
      } 
    }    
  }
}

engine.addSystem(new killBlobs())

export class PushButton implements ISystem {
  update(dt: number) {
    for (let button of buttons.entities) {
      let transform = button.get(Transform)
      let state = button.get(ButtonData)
      if (state.pressed == true){
        if (state.fraction < 1){
          transform.position.z = Scalar.Lerp(state.zUp, state.zDown, state.fraction)
          state.fraction += 1/8
        }
        state.timeDown -= dt
        if (state.timeDown < 0){
          state.pressed = false
          state.timeDown = 2
        }
      }
      else if (state.pressed == false && state.fraction > 0){
        transform.position.z = Scalar.Lerp(state.zUp, state.zDown, state.fraction)
        state.fraction -= 1/8
      }
    }
  }
}

engine.addSystem(new PushButton)

//////////////////////////////////////////
// Add entities


const game = new Entity()
const gameData = new GameData()
game.set(gameData)

engine.addEntity(game)


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


let scoreBoard = new Entity()
scoreBoard.set(new GLTFShape("models/ScoreRock/ScoreRock.gltf"))
scoreBoard.set(new Transform())
scoreBoard.get(Transform).position.set(18.99, 0, 19)
engine.addEntity(scoreBoard)

let buttonMaterial = new Material()
buttonMaterial.albedoColor = Color3.FromHexString("#990000") 

const button = new Entity()
button.set(new Transform())
button.set(new CylinderShape())
button.set(buttonMaterial)
button.get(Transform).scale.set(.05, .2, .05)
button.get(Transform).rotation.eulerAngles = new Vector3(90, 0, 0)
button.get(Transform).position.set(0, 1, -0.3)
let buttonData = new ButtonData(-0.3, -0.2)
button.setParent(scoreBoard)
button.set(buttonData)
buttonData.label = "New Game"
button.set(
  new OnClick(e => {
    log("clicked")
    buttonData.pressed = true
    newGame()
    // button up
  })
)
engine.addEntity(button)

let buttonLabel = new Entity()
buttonLabel.setParent(scoreBoard)
buttonLabel.set(new TextShape("New game"))
buttonLabel.get(TextShape).fontSize = 50
buttonLabel.set(new Transform())
buttonLabel.get(Transform).position.set(0, 0.85, -.38)
engine.addEntity(buttonLabel)

let scoreText1 = new Entity()
scoreText1.setParent(scoreBoard)
scoreText1.set(new TextShape("humans"))
scoreText1.get(TextShape).fontSize = 50
scoreText1.set(new Transform())
scoreText1.get(Transform).position.set(-.4, .1, -.38)
engine.addEntity(scoreText1)

let scoreText2 = new Entity()
scoreText2.setParent(scoreBoard)
scoreText2.set(new TextShape("creps"))
scoreText2.get(TextShape).fontSize = 50
scoreText2.set(new Transform())
scoreText2.get(Transform).position.set(.4, .1, -.38)
engine.addEntity(scoreText2)

let scoreText3 = new Entity()
scoreText3.setParent(scoreBoard)
scoreText3.set(new TextShape("vs"))
scoreText3.get(TextShape).fontSize = 100
scoreText3.set(new Transform())
scoreText3.get(Transform).position.set(0, .35, -.38)
engine.addEntity(scoreText3)

let scoreTextHumans = new Entity()
scoreTextHumans.setParent(scoreBoard)
scoreTextHumans.set(new TextShape(gameData.humanScore.toString()))
scoreTextHumans.get(TextShape).fontSize = 200
scoreTextHumans.set(new Transform())
scoreTextHumans.get(Transform).position.set(-.4, .35, -.38)
engine.addEntity(scoreTextHumans)

let scoreTextCreeps = new Entity()
scoreTextCreeps.setParent(scoreBoard)
scoreTextCreeps.set(new TextShape(gameData.creepScore.toString()))
scoreTextCreeps.get(TextShape).fontSize = 200
scoreTextCreeps.set(new Transform())
scoreTextCreeps.get(Transform).position.set(.4, .35, -.38)
engine.addEntity(scoreTextCreeps)

///////////////////////////////////
// Functions

function newGame(){

  gameData.humanScore = 0
  gameData.creepScore = 0
  gameData.lost = false
  gameData.won = false
  gameData.creepInterval = 3

  // get rid of old path
  while(tiles.entities.length) {
    engine.removeEntity(tiles.entities[0])
  }
  
  // get rid of old creeps
  while(creeps.entities.length) {
    creeps.entities[0].get(CreepData).isDead = true;
    engine.removeEntity(creeps.entities[0])
  }

  // get rid of old traps
  while(traps.entities.length) {
    engine.removeEntity(traps.entities[0])
  }

  // create random path
  gameData.path = generatePath()
  
  // draw path with tiles
  for (let tile in gameData.path){
    let pos = gameData.path[tile]
    spawnTile(pos)
  }

  log('creating tiles')
  log(tiles.entities.length)

  // add traps
  placeTraps()

}




// Object pools

let tilePool = new Pool()
let creepPool = new Pool()
let trapPool = new Pool()
creepPool.max = MAX_CREEPS
trapPool.max = MAX_TRAPS

function spawnTrap(){
  const trap = trapPool.getEntity()
  engine.addEntity(trap) 

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
  
  if (!trap.children){
    const leftLever = new Entity()
    engine.addEntity(leftLever)
    const rightLever = new Entity()
    engine.addEntity(rightLever)   

    let lt = leftLever.getOrCreate(Transform)
    lt.position.set(-1.5, 0, 0)
    lt.rotation.eulerAngles = new Vector3(0, 90, 0)
  
  
    leftLever.set(new GLTFShape("models/Lever/LeverBlue.gltf"))
    const leverOffL = new AnimationClip("LeverOff", {loop: false})
    const leverOnL= new AnimationClip("LeverOn", {loop: false})
    const LeverDespawnL= new AnimationClip("LeverDeSpawn", {loop: false})
    leftLever.get(GLTFShape).addClip(leverOffL)
    leftLever.get(GLTFShape).addClip(leverOnL)
    leftLever.get(GLTFShape).addClip(LeverDespawnL)
  
  
    leftLever.setParent(trap)
    
    //if (!leftLever.has(OnClick)){
      leftLever.set(new OnClick(e => {
        operateLeftLever(leftLever)
      }))
    //}
  
    let rt = rightLever.getOrCreate(Transform)
    rt.position.set(1.5, 0, 0)
    rt.rotation.eulerAngles = new Vector3(0, 90, 0)
  
    
    rightLever.set(new GLTFShape("models/Lever/LeverRed.gltf"))
    const leverOffR = new AnimationClip("LeverOff", {loop: false})
    const leverOnR= new AnimationClip("LeverOn", {loop: false})
    const LeverDespawnR= new AnimationClip("LeverDeSpawn", {loop: false})
    rightLever.get(GLTFShape).addClip(leverOffR)
    rightLever.get(GLTFShape).addClip(leverOnR)
    rightLever.get(GLTFShape).addClip(LeverDespawnR)
  
  
    rightLever.setParent(trap)
    
    //if (!rightLever.has(OnClick)){
      rightLever.set(new OnClick(e => {
        operateLeftLever(rightLever)
      }))
    //}


  }

 

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
  let ent = creepPool.getEntity()
  if (!ent) return
  log("new creep")

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