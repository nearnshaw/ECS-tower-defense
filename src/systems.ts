
import { CreepData, TrapData, TrapState, ButtonData, GameData, TilePos, Pool } from "./components"
import { creeps, traps, buttons, tiles } from "./components"
import { gameData, scoreTextCreeps, scoreTextHumans, spawnCreep} from "./game";


export class SpawnCreeps implements ISystem {
    update(dt: number) {
      gameData.creepInterval -= dt
      if (gameData.creepInterval < 0){
        spawnCreep()
        gameData.creepInterval = 3 + Math.random() * 3
      }
    }
  }

  export class moveBlobs implements ISystem {
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
            log("LOOOSE "+ gameData.creepScore)
            gameData.creepScore += 1
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


  export class killBlobs implements ISystem {
    update() {
      for (let trap of traps.entities){
        let trapData = trap.get(TrapData)
        if (trapData.trapState == TrapState.Fired){
          for( let creep of creeps.entities){
          
            let creepData = creep.get(CreepData)
            if( trapData.pathPos == creepData.pathPos
              && creepData.isDead == false){
                log("KILL")
                creepData.isDead = true
                creep.get(GLTFShape).getClip("clipDie")
                engine.removeEntity(creep)
                gameData.humanScore += 1
                scoreTextHumans.get(TextShape).value = gameData.humanScore.toString()
              }    
          }
        } 
      }    
    }
  }

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



engine.addSystem(new SpawnCreeps())

engine.addSystem(new moveBlobs())

engine.addSystem(new killBlobs())

engine.addSystem(new PushButton())