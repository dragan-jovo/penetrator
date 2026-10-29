import {
  PlayerShip,
  Laser,
  Bomb,
  Enemy,
  Particle,
  FloatingText,
  StageData,
  PaletteMode,
  Point,
} from '../types/game';
import { getInterpolatedY } from './stages';
import { sound } from '../audio/soundEngine';

export interface GameEngineCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onFuelChange: (fuel: number) => void;
  onShieldChange: (shield: number) => void;
  onStageChange: (stageIndex: number) => void;
  onGameOver: (finalScore: number, stage: number) => void;
  onVictory: (finalScore: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  // Game state
  public score: number = 0;
  public lives: number = 3;
  public currentStageIndex: number = 0;
  public stages: StageData[] = [];
  public currentStage!: StageData;
  public cameraX: number = 0;
  public isRunning: boolean = false;
  public isPaused: boolean = false;

  // Entities
  public ship!: PlayerShip;
  public lasers: Laser[] = [];
  public bombs: Bomb[] = [];
  public enemies: Enemy[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  // Hitstop & Camera shake
  private hitstopTimer: number = 0;
  private shakeIntensity: number = 0;
  private shakeDecay: number = 0.9;
  private shakeX: number = 0;
  private shakeY: number = 0;

  // Reactor core meltdown sequence
  public isMeltdown: boolean = false;
  public meltdownTimer: number = 0;
  private escapeFlashing: number = 0;

  // Low fuel alarm timer
  private fuelAlarmTimer: number = 0;

  // Inputs
  private keysHeld: Record<string, boolean> = {};
  private keysJustPressed: Record<string, boolean> = {};
  private laserCooldown: number = 0;
  private bombCooldown: number = 0;

  // Touch virtual inputs
  public touchInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
    bomb: false,
  };

  // Visual settings
  public paletteMode: PaletteMode = 'zx_spectrum';
  public crtFilter: boolean = true;
  private callbacks: GameEngineCallbacks;

  // Next entity IDs
  private nextEntityId: number = 1;

  constructor(
    canvas: HTMLCanvasElement,
    stages: StageData[],
    callbacks: GameEngineCallbacks,
    initialStageIndex = 0
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.stages = stages;
    this.currentStageIndex = initialStageIndex;
    this.callbacks = callbacks;

    this.bindEvents();
    this.resetStage(this.currentStageIndex);
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    sound.setThrust(false);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleWindowBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent default scroll on arrow keys and space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
      e.preventDefault();
    }
    if (!this.keysHeld[e.code]) {
      this.keysJustPressed[e.code] = true;
    }
    this.keysHeld[e.code] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld[e.code] = false;
  };

  private handleWindowBlur = () => {
    this.keysHeld = {};
    this.keysJustPressed = {};
    this.touchInput = { up: false, down: false, left: false, right: false, fire: false, bomb: false };
    sound.setThrust(false);
  };

  public resetStage(stageIndex: number) {
    this.currentStageIndex = stageIndex % this.stages.length;
    this.currentStage = this.stages[this.currentStageIndex];
    this.cameraX = 0;
    this.isMeltdown = false;
    this.meltdownTimer = 0;
    this.escapeFlashing = 0;

    // Reset player ship
    const startY = (getInterpolatedY(this.currentStage.ceiling, 100) + getInterpolatedY(this.currentStage.floor, 100)) / 2;
    this.ship = {
      x: 100,
      y: startY,
      vx: 0,
      vy: 0,
      width: 32,
      height: 14,
      shield: 100,
      fuel: 100,
      invulnerableTime: 2.0, // 2 seconds of grace
    };

    // Clean entities
    this.lasers = [];
    this.bombs = [];
    this.particles = [];
    this.floatingTexts = [];

    // Instantiate enemies from stage definition
    this.enemies = this.currentStage.enemies.map((def) => {
      let ey = 300;
      let eWidth = 24;
      let eHeight = 24;
      let health = 1;
      let points = 100;

      if (def.attachTo === 'floor') {
        const floorY = getInterpolatedY(this.currentStage.floor, def.x);
        ey = floorY - 18;
      } else if (def.attachTo === 'ceiling') {
        const ceilY = getInterpolatedY(this.currentStage.ceiling, def.x);
        ey = ceilY + 6;
      } else if (def.y !== undefined) {
        ey = def.y;
      }

      if (def.type === 'missile') {
        eWidth = 14;
        eHeight = 26;
        points = 150;
      } else if (def.type === 'radar') {
        eWidth = 28;
        eHeight = 22;
        points = 200;
      } else if (def.type === 'fuel') {
        eWidth = 26;
        eHeight = 26;
        points = 250;
      } else if (def.type === 'interceptor') {
        eWidth = 24;
        eHeight = 16;
        points = 300;
      } else if (def.type === 'turret') {
        eWidth = 22;
        eHeight = 18;
        points = 200;
      } else if (def.type === 'reactor') {
        eWidth = 56;
        eHeight = 44;
        health = 3;
        points = 5000;
      }

      return {
        id: this.nextEntityId++,
        type: def.type,
        x: def.x,
        y: ey,
        width: eWidth,
        height: eHeight,
        health,
        points,
        active: true,
        launched: false,
        launchTimer: 0,
        vy: 0,
        vx: 0,
        angle: 0,
        targetY: ey,
        sineOffset: Math.random() * Math.PI * 2,
      };
    });

    this.callbacks.onStageChange(this.currentStageIndex);
    this.callbacks.onFuelChange(this.ship.fuel);
    this.callbacks.onShieldChange(this.ship.shield);
  }

  public startNewGame() {
    this.score = 0;
    this.lives = 3;
    this.callbacks.onScoreChange(this.score);
    this.callbacks.onLivesChange(this.lives);
    this.resetStage(0);
    this.start();
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  public pause() {
    this.isPaused = true;
    sound.setThrust(false);
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  private gameLoop = (currentTime: number) => {
    if (!this.isRunning) return;

    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    // Clamp frame delta time strictly to prevent physics tunneling
    const dt = Math.min(rawDt, 0.05);

    if (!this.isPaused) {
      this.update(dt);
    }

    this.render();

    // Reset single-frame edge triggers
    this.keysJustPressed = {};

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(dt: number) {
    // Hitstop freeze handling
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    // Camera shake decay
    if (this.shakeIntensity > 0.01) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 12;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 12;
      this.shakeIntensity *= Math.pow(this.shakeDecay, dt * 60);
    } else {
      this.shakeIntensity = 0;
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Advance camera scroll
    const scrollSpeed = this.isMeltdown ? this.currentStage.scrollSpeed * 1.6 : this.currentStage.scrollSpeed;
    this.cameraX += scrollSpeed * dt;

    // Fuel consumption
    this.ship.fuel = Math.max(0, this.ship.fuel - dt * 2.8);
    this.callbacks.onFuelChange(Math.round(this.ship.fuel));

    if (this.ship.fuel <= 20) {
      this.fuelAlarmTimer += dt;
      if (this.fuelAlarmTimer >= 0.7) {
        this.fuelAlarmTimer = 0;
        sound.playWarning();
      }
    }

    if (this.ship.fuel <= 0) {
      // Out of fuel! Ship falls into terrain
      this.ship.vy += 380 * dt;
    }

    if (this.ship.invulnerableTime > 0) {
      this.ship.invulnerableTime -= dt;
    }

    // Player inputs
    this.handlePlayerInput(dt);

    // Update Player Ship position
    this.ship.x += this.ship.vx * dt;
    this.ship.y += this.ship.vy * dt;

    // Keep ship within camera horizontal bounds
    const minX = this.cameraX + 40;
    const maxX = this.cameraX + this.canvas.width * 0.75;
    if (this.ship.x < minX) this.ship.x = minX;
    if (this.ship.x > maxX) this.ship.x = maxX;

    // Apply damping to player velocity
    this.ship.vx *= 0.92;
    this.ship.vy *= 0.92;

    // Laser & Bomb weapon cooldowns
    if (this.laserCooldown > 0) this.laserCooldown -= dt;
    if (this.bombCooldown > 0) this.bombCooldown -= dt;

    // Player terrain collision check
    this.checkTerrainCollision();

    // Update weapons
    this.updateLasers(dt);
    this.updateBombs(dt);

    // Update enemies
    this.updateEnemies(dt);

    // Update particles & floating texts
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // Meltdown escape sequence logic
    if (this.isMeltdown) {
      this.meltdownTimer -= dt;
      this.escapeFlashing += dt * 8;
      if (Math.floor(this.escapeFlashing) % 2 === 0) {
        sound.playReactorAlarm();
      }

      // Check if player escaped past the end of the base tunnel
      if (this.ship.x >= this.currentStage.length + 300) {
        // Successful escape!
        this.completeStage();
        return;
      }

      if (this.meltdownTimer <= 0) {
        // Meltdown exploded!
        this.triggerExplosion(this.ship.x, this.ship.y, 'large');
        this.killPlayer('REACTOR MELTDOWN DETONATED!');
        return;
      }
    } else {
      // Normal stage completion (for stages 1-4)
      if (this.cameraX > this.currentStage.length - this.canvas.width * 0.5) {
        this.completeStage();
      }
    }
  }

  private handlePlayerInput(dt: number) {
    const isUp = this.keysHeld['KeyW'] || this.keysHeld['ArrowUp'] || this.touchInput.up;
    const isDown = this.keysHeld['KeyS'] || this.keysHeld['ArrowDown'] || this.touchInput.down;
    const isLeft = this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft'] || this.touchInput.left;
    const isRight = this.keysHeld['KeyD'] || this.keysHeld['ArrowRight'] || this.touchInput.right;

    const isFire =
      this.keysHeld['Space'] ||
      this.keysHeld['KeyJ'] ||
      this.keysHeld['KeyZ'] ||
      this.touchInput.fire;

    const isBomb =
      this.keysJustPressed['KeyB'] ||
      this.keysJustPressed['KeyM'] ||
      this.keysJustPressed['KeyK'] ||
      this.keysJustPressed['KeyX'] ||
      this.touchInput.bomb;

    const moveSpeed = 240;

    if (isUp) {
      this.ship.vy -= moveSpeed * dt * 8;
    }
    if (isDown) {
      this.ship.vy += moveSpeed * dt * 8;
    }
    if (isLeft) {
      this.ship.vx -= moveSpeed * dt * 6;
    }
    if (isRight) {
      this.ship.vx += moveSpeed * dt * 6;
    }

    const isMoving = isUp || isDown || isLeft || isRight;
    sound.setThrust(isMoving);

    // Spawn exhaust particles from engine rear
    if (Math.random() < 0.6) {
      this.particles.push({
        id: this.nextEntityId++,
        x: this.ship.x - 14,
        y: this.ship.y + (Math.random() - 0.5) * 4,
        vx: -150 - Math.random() * 80,
        vy: (Math.random() - 0.5) * 30,
        color: this.isMeltdown ? '#FF0055' : '#00FFFF',
        size: Math.random() * 3 + 2,
        life: 0.25,
        maxLife: 0.25,
        alpha: 1,
      });
    }

    // Fire laser pulses
    if (isFire && this.laserCooldown <= 0) {
      this.fireLaser();
      this.laserCooldown = 0.14; // rapid burst
    }

    // Drop bomb
    if (isBomb && this.bombCooldown <= 0) {
      this.dropBomb();
      this.bombCooldown = 0.32;
    }
  }

  private fireLaser() {
    sound.playLaser();
    this.lasers.push({
      id: this.nextEntityId++,
      x: this.ship.x + 18,
      y: this.ship.y,
      vx: 750,
      vy: 0,
      length: 18,
    });
  }

  private dropBomb() {
    sound.playBombDrop();
    this.bombs.push({
      id: this.nextEntityId++,
      x: this.ship.x + 4,
      y: this.ship.y + 6,
      vx: this.currentStage.scrollSpeed * 0.85 + (this.ship.vx > 0 ? this.ship.vx * 0.5 : 0),
      vy: 80,
    });
  }

  private checkTerrainCollision() {
    if (this.ship.invulnerableTime > 0) return;

    const shipLeft = this.ship.x - this.ship.width / 2;
    const shipRight = this.ship.x + this.ship.width / 2;
    const shipTop = this.ship.y - this.ship.height / 2;
    const shipBottom = this.ship.y + this.ship.height / 2;

    const ceilY = getInterpolatedY(this.currentStage.ceiling, this.ship.x);
    const floorY = getInterpolatedY(this.currentStage.floor, this.ship.x);

    // Collide with ceiling or floor
    if (shipTop <= ceilY || shipBottom >= floorY) {
      this.triggerExplosion(this.ship.x, this.ship.y, 'large');
      this.killPlayer('CRASHED INTO CAVERN WALL');
    }
  }

  private updateLasers(dt: number) {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.x += laser.vx * dt;

      // Check collision with ceiling / floor
      const ceilY = getInterpolatedY(this.currentStage.ceiling, laser.x);
      const floorY = getInterpolatedY(this.currentStage.floor, laser.x);

      if (laser.y <= ceilY || laser.y >= floorY) {
        this.triggerSpark(laser.x, laser.y, '#FFFFFF');
        this.lasers.splice(i, 1);
        continue;
      }

      // Check collision with enemies
      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (!e.active) continue;

        if (
          laser.x >= e.x - e.width / 2 &&
          laser.x <= e.x + e.width / 2 &&
          laser.y >= e.y - e.height / 2 &&
          laser.y <= e.y + e.height / 2
        ) {
          e.health--;
          hit = true;
          this.triggerSpark(laser.x, laser.y, '#FFCC00');

          if (e.health <= 0) {
            this.destroyEnemy(e, j);
          }
          break;
        }
      }

      if (hit) {
        this.lasers.splice(i, 1);
        continue;
      }

      // Remove laser off-screen
      if (laser.x > this.cameraX + this.canvas.width + 100) {
        this.lasers.splice(i, 1);
      }
    }
  }

  private updateBombs(dt: number) {
    const gravity = 460;

    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.vy += gravity * dt;
      bomb.x += bomb.vx * dt;
      bomb.y += bomb.vy * dt;

      // Small smoke trail
      if (Math.random() < 0.4) {
        this.particles.push({
          id: this.nextEntityId++,
          x: bomb.x,
          y: bomb.y,
          vx: -20,
          vy: -10,
          color: '#AAAAAA',
          size: 2,
          life: 0.2,
          maxLife: 0.2,
          alpha: 0.6,
        });
      }

      // Check floor impact
      const floorY = getInterpolatedY(this.currentStage.floor, bomb.x);
      let hitGround = bomb.y >= floorY;

      // Check enemy impact
      let hitEnemy = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (!e.active) continue;

        if (
          bomb.x >= e.x - e.width / 2 - 4 &&
          bomb.x <= e.x + e.width / 2 + 4 &&
          bomb.y >= e.y - e.height / 2 - 4 &&
          bomb.y <= e.y + e.height / 2 + 4
        ) {
          e.health--;
          hitEnemy = true;
          this.triggerExplosion(bomb.x, bomb.y, 'medium');

          if (e.health <= 0) {
            this.destroyEnemy(e, j);
          }
          break;
        }
      }

      if (hitEnemy || hitGround) {
        if (!hitEnemy && hitGround) {
          this.triggerExplosion(bomb.x, floorY, 'small');
        }
        this.bombs.splice(i, 1);
        continue;
      }

      // Despawn off-screen
      if (bomb.y > this.canvas.height + 50 || bomb.x < this.cameraX - 100) {
        this.bombs.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number) {
    const playerBox = {
      left: this.ship.x - this.ship.width / 2,
      right: this.ship.x + this.ship.width / 2,
      top: this.ship.y - this.ship.height / 2,
      bottom: this.ship.y + this.ship.height / 2,
    };

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.active) continue;

      // Missile launch logic
      if (e.type === 'missile') {
        const distanceToPlayer = e.x - this.ship.x;

        // When ship approaches within ~350 units, missile launches vertically!
        if (!e.launched && distanceToPlayer > 0 && distanceToPlayer < 360) {
          e.launched = true;
          e.vy = -180;
          sound.playMissileLaunch();
        }

        if (e.launched) {
          e.vy! -= 150 * dt; // Accelerate upwards
          e.y += e.vy! * dt;

          // Homing / horizontal drift towards player in higher stages
          if (this.currentStageIndex >= 1 && distanceToPlayer > 40) {
            e.x -= 40 * dt;
          }

          // Launch smoke puff
          if (Math.random() < 0.6) {
            this.particles.push({
              id: this.nextEntityId++,
              x: e.x + (Math.random() - 0.5) * 4,
              y: e.y + 12,
              vx: (Math.random() - 0.5) * 30,
              vy: 60 + Math.random() * 40,
              color: '#FF6600',
              size: Math.random() * 4 + 2,
              life: 0.35,
              maxLife: 0.35,
              alpha: 0.9,
            });
          }

          // Check if missile hits ceiling
          const ceilY = getInterpolatedY(this.currentStage.ceiling, e.x);
          if (e.y <= ceilY) {
            this.triggerExplosion(e.x, e.y, 'small');
            e.active = false;
            continue;
          }
        }
      }

      // Interceptor flight logic (flies left towards player with sinusoidal wave)
      if (e.type === 'interceptor') {
        // Activate when within screen range
        if (e.x < this.cameraX + this.canvas.width + 100) {
          e.x -= 220 * dt;
          e.sineOffset = (e.sineOffset || 0) + dt * 4;
          e.y = (e.targetY || 240) + Math.sin(e.sineOffset) * 40;

          // Keep in cavern bounds
          const ceilY = getInterpolatedY(this.currentStage.ceiling, e.x) + 20;
          const floorY = getInterpolatedY(this.currentStage.floor, e.x) - 20;
          e.y = Math.max(ceilY, Math.min(floorY, e.y));
        }
      }

      // Check collision with player
      if (
        this.ship.invulnerableTime <= 0 &&
        playerBox.right >= e.x - e.width / 2 &&
        playerBox.left <= e.x + e.width / 2 &&
        playerBox.bottom >= e.y - e.height / 2 &&
        playerBox.top <= e.y + e.height / 2
      ) {
        if (e.type === 'fuel') {
          // Fuel pickup bonus!
          this.destroyEnemy(e, i);
        } else {
          // Collision with enemy!
          this.triggerExplosion(this.ship.x, this.ship.y, 'large');
          this.destroyEnemy(e, i);
          this.killPlayer('COLLIDED WITH ENEMY');
          break;
        }
      }
    }
  }

  private destroyEnemy(e: Enemy, index: number) {
    e.active = false;
    this.addScore(e.points, e.x, e.y);

    if (e.type === 'fuel') {
      sound.playFuelPickup();
      this.ship.fuel = Math.min(100, this.ship.fuel + 35);
      this.callbacks.onFuelChange(Math.round(this.ship.fuel));
      this.floatingTexts.push({
        id: this.nextEntityId++,
        text: 'FUEL +35',
        x: e.x,
        y: e.y - 10,
        color: '#00FF66',
        life: 0.9,
        maxLife: 0.9,
      });
      this.triggerSpark(e.x, e.y, '#00FF66');
    } else if (e.type === 'reactor') {
      // THE REACTOR HIT! Meltdown initiation!
      sound.playExplosion('large');
      this.hitstopTimer = 0.08;
      this.shakeIntensity = 1.0;
      this.isMeltdown = true;
      this.meltdownTimer = 18.0; // 18 seconds to escape
      this.floatingTexts.push({
        id: this.nextEntityId++,
        text: 'REACTOR MELTDOWN! ESCAPE NOW!',
        x: e.x,
        y: e.y - 30,
        color: '#FF0055',
        life: 2.5,
        maxLife: 2.5,
      });
      // Massive explosion cloud
      for (let k = 0; k < 40; k++) {
        this.particles.push({
          id: this.nextEntityId++,
          x: e.x,
          y: e.y,
          vx: (Math.random() - 0.5) * 350,
          vy: (Math.random() - 0.5) * 350,
          color: k % 2 === 0 ? '#FF0055' : '#FFFF00',
          size: Math.random() * 8 + 4,
          life: 1.2,
          maxLife: 1.2,
          alpha: 1,
        });
      }
    } else {
      sound.playExplosion('medium');
      this.triggerExplosion(e.x, e.y, 'medium');
    }
  }

  private addScore(points: number, x: number, y: number) {
    this.score += points;
    this.callbacks.onScoreChange(this.score);

    this.floatingTexts.push({
      id: this.nextEntityId++,
      text: `+${points}`,
      x,
      y: y - 12,
      color: '#FFFF00',
      life: 0.7,
      maxLife: 0.7,
    });
  }

  private triggerExplosion(x: number, y: number, size: 'small' | 'medium' | 'large') {
    sound.playExplosion(size);
    const count = size === 'small' ? 12 : size === 'medium' ? 24 : 45;
    const speed = size === 'small' ? 120 : size === 'medium' ? 220 : 320;
    this.shakeIntensity = Math.max(this.shakeIntensity, size === 'small' ? 0.2 : size === 'medium' ? 0.45 : 0.85);

    if (size === 'large') {
      this.hitstopTimer = 0.05;
    }

    const colors = ['#FF3300', '#FF9900', '#FFFF00', '#FFFFFF'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const mag = (Math.random() * 0.8 + 0.2) * speed;
      this.particles.push({
        id: this.nextEntityId++,
        x,
        y,
        vx: Math.cos(angle) * mag,
        vy: Math.sin(angle) * mag,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 2,
        life: Math.random() * 0.4 + 0.3,
        maxLife: 0.7,
        alpha: 1,
      });
    }
  }

  private triggerSpark(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        id: this.nextEntityId++,
        x,
        y,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        color,
        size: 2,
        life: 0.18,
        maxLife: 0.18,
        alpha: 1,
      });
    }
  }

  private killPlayer(reason: string) {
    sound.playGameOver();
    this.lives--;
    this.callbacks.onLivesChange(this.lives);

    this.floatingTexts.push({
      id: this.nextEntityId++,
      text: reason,
      x: this.ship.x,
      y: this.ship.y,
      color: '#FF0033',
      life: 1.8,
      maxLife: 1.8,
    });

    if (this.lives <= 0) {
      this.isRunning = false;
      this.callbacks.onGameOver(this.score, this.currentStageIndex + 1);
    } else {
      // Respawn slightly back in safer air
      this.cameraX = Math.max(0, this.cameraX - 350);
      const respawnX = this.cameraX + 120;
      const ceilY = getInterpolatedY(this.currentStage.ceiling, respawnX);
      const floorY = getInterpolatedY(this.currentStage.floor, respawnX);

      this.ship.x = respawnX;
      this.ship.y = (ceilY + floorY) / 2;
      this.ship.vx = 0;
      this.ship.vy = 0;
      this.ship.fuel = Math.max(50, this.ship.fuel);
      this.ship.invulnerableTime = 3.0; // 3 seconds flashing invulnerability
    }
  }

  private completeStage() {
    sound.playVictoryFanfare();
    if (this.currentStageIndex >= this.stages.length - 1) {
      // Finished all 5 stages including reactor core!
      this.isRunning = false;
      this.callbacks.onVictory(this.score);
    } else {
      // Advance to next stage!
      this.currentStageIndex++;
      this.resetStage(this.currentStageIndex);
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y -= 25 * dt;
    }
  }

  // ----------------------------------------------------
  // RENDERING
  // ----------------------------------------------------

  private render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Palette theme styles
    let skyBg = '#000000';
    let terrainStroke = '#00FF66';
    let terrainFill = '#002B18';
    let wireframeOnly = false;

    if (this.paletteMode === 'zx_spectrum') {
      skyBg = '#000000';
      terrainStroke = this.currentStage.palette.mountainStroke;
      terrainFill = this.currentStage.palette.mountainFill;
    } else if (this.paletteMode === 'c64') {
      skyBg = '#1E1233';
      terrainStroke = '#6C5EB5';
      terrainFill = '#352879';
    } else if (this.paletteMode === 'green_phosphor') {
      skyBg = '#031005';
      terrainStroke = '#33FF33';
      terrainFill = '#07240C';
      wireframeOnly = true;
    } else if (this.paletteMode === 'amber_phosphor') {
      skyBg = '#140A00';
      terrainStroke = '#FFB000';
      terrainFill = '#2A1700';
      wireframeOnly = true;
    }

    // Meltdown alarm flashing background
    if (this.isMeltdown && Math.floor(this.escapeFlashing) % 2 === 0) {
      skyBg = '#330008';
    }

    // Clear canvas
    ctx.fillStyle = skyBg;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Apply camera shake
    ctx.translate(this.shakeX, this.shakeY);

    // 1. Draw Starfield / Background Grid
    this.renderStarfield(ctx, width, height);

    // 2. Draw Cavern Terrain (Ceiling and Floor)
    this.renderCavernTerrain(ctx, width, height, terrainStroke, terrainFill, wireframeOnly);

    // 3. Draw Enemies
    this.renderEnemies(ctx);

    // 4. Draw Lasers & Bombs
    this.renderWeapons(ctx);

    // 5. Draw Player Ship
    this.renderPlayerShip(ctx);

    // 6. Draw Particles
    this.renderParticles(ctx);

    // 7. Draw Floating Texts
    this.renderFloatingTexts(ctx);

    ctx.restore();

    // 8. Draw Radar Mini-Map at bottom
    this.renderRadarStrip(ctx, width, height);
  }

  private renderStarfield(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = '#FFFFFF';
    const starCount = 35;
    // Parallax stars
    for (let i = 0; i < starCount; i++) {
      const starX = ((i * 137.5 + this.cameraX * 0.15) % width);
      const starY = (i * 63) % (height - 80);
      const size = (i % 3 === 0) ? 2 : 1;
      ctx.globalAlpha = (i % 2 === 0) ? 0.7 : 0.35;
      ctx.fillRect(starX, starY, size, size);
    }
    ctx.globalAlpha = 1.0;
  }

  private renderCavernTerrain(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    strokeColor: string,
    fillColor: string,
    wireframeOnly: boolean
  ) {
    const ceiling = this.currentStage.ceiling;
    const floor = this.currentStage.floor;
    const offsetX = -this.cameraX;

    // A. Render Ceiling
    ctx.beginPath();
    ctx.moveTo(0, 0);

    for (let i = 0; i < ceiling.length; i++) {
      const screenX = ceiling[i].x + offsetX;
      if (screenX >= -100 && screenX <= width + 100) {
        ctx.lineTo(screenX, ceiling[i].y);
      }
    }
    ctx.lineTo(width, 0);
    ctx.closePath();

    if (!wireframeOnly) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // B. Render Floor
    ctx.beginPath();
    ctx.moveTo(0, height - 70);

    for (let i = 0; i < floor.length; i++) {
      const screenX = floor[i].x + offsetX;
      if (screenX >= -100 && screenX <= width + 100) {
        ctx.lineTo(screenX, floor[i].y);
      }
    }
    ctx.lineTo(width, height - 70);
    ctx.closePath();

    if (!wireframeOnly) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Vector cross-hatching or stalactite lines for that retro 1982 Penetrator look
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    const step = 80;
    const startX = Math.floor(this.cameraX / step) * step;
    for (let x = startX; x < this.cameraX + width; x += step) {
      const scrX = x + offsetX;
      const cY = getInterpolatedY(ceiling, x);
      const fY = getInterpolatedY(floor, x);
      // Down vertical hatch from ceiling
      ctx.beginPath();
      ctx.moveTo(scrX, 0);
      ctx.lineTo(scrX, cY);
      ctx.stroke();
      // Up vertical hatch from floor
      ctx.beginPath();
      ctx.moveTo(scrX, fY);
      ctx.lineTo(scrX, height - 70);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    const offsetX = -this.cameraX;

    for (const e of this.enemies) {
      if (!e.active) continue;
      const scrX = e.x + offsetX;
      if (scrX < -60 || scrX > this.canvas.width + 60) continue;

      ctx.save();
      ctx.translate(scrX, e.y);

      if (e.type === 'missile') {
        // Red/white surface-to-air missile
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-3, -12, 6, 20);
        // Warhead nosecone
        ctx.fillStyle = '#FF0033';
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(5, -11);
        ctx.lineTo(-5, -11);
        ctx.closePath();
        ctx.fill();
        // Fins
        ctx.fillStyle = '#FFCC00';
        ctx.fillRect(-7, 2, 4, 6);
        ctx.fillRect(3, 2, 4, 6);
        // Base silo
        if (!e.launched) {
          ctx.fillStyle = '#555555';
          ctx.fillRect(-10, 8, 20, 6);
        }
      } else if (e.type === 'radar') {
        // Rotating radar dish with base
        ctx.fillStyle = '#888888';
        ctx.fillRect(-12, 6, 24, 6); // base
        // Dish arc
        ctx.strokeStyle = '#00FFCC';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const sweep = (Date.now() / 300) % (Math.PI * 2);
        ctx.arc(0, 0, 10, -Math.PI * 0.8 + Math.sin(sweep) * 0.3, -Math.PI * 0.2 + Math.sin(sweep) * 0.3);
        ctx.stroke();
        // Mast
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-2, 0, 4, 7);
      } else if (e.type === 'fuel') {
        // Glowing FUEL depot canister
        ctx.fillStyle = '#00FF66';
        ctx.fillRect(-11, -11, 22, 22);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-11, -11, 22, 22);
        // Letter 'F' in pixel font
        ctx.fillStyle = '#000000';
        ctx.fillRect(-5, -7, 10, 3);
        ctx.fillRect(-5, -7, 3, 14);
        ctx.fillRect(-5, -1, 7, 3);
      } else if (e.type === 'interceptor') {
        // Sleek alien interceptor fighter
        ctx.fillStyle = '#FF0055';
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(10, -7);
        ctx.lineTo(12, 0);
        ctx.lineTo(10, 7);
        ctx.closePath();
        ctx.fill();
        // Cockpit
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(-2, -3, 6, 6);
      } else if (e.type === 'turret') {
        // Ceiling turret
        ctx.fillStyle = '#AAAAAA';
        ctx.fillRect(-10, -8, 20, 6);
        ctx.fillStyle = '#FF3300';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        // Barrel aiming down
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 12);
        ctx.stroke();
      } else if (e.type === 'reactor') {
        // The NEUTRON REACTOR CORE!
        // Pulsing core aura
        const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 0, 200, ${pulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();

        // Massive Bunker Frame
        ctx.fillStyle = '#333333';
        ctx.fillRect(-26, -18, 52, 36);
        ctx.strokeStyle = '#FF00E1';
        ctx.lineWidth = 3;
        ctx.strokeRect(-26, -18, 52, 36);

        // Core Rods
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(-16, -12, 8, 24);
        ctx.fillRect(8, -12, 8, 24);

        // Central Warning Trefoil / Core Sphere
        ctx.fillStyle = '#FF0055';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderWeapons(ctx: CanvasRenderingContext2D) {
    const offsetX = -this.cameraX;

    // Lasers
    ctx.fillStyle = '#FFFF33';
    ctx.shadowColor = '#FFCC00';
    ctx.shadowBlur = 8;
    for (const l of this.lasers) {
      const scrX = l.x + offsetX;
      ctx.fillRect(scrX, l.y - 2, l.length, 4);
    }
    ctx.shadowBlur = 0;

    // Bombs
    for (const b of this.bombs) {
      const scrX = b.x + offsetX;
      ctx.save();
      ctx.translate(scrX, b.y);
      // Oval bomb shape with fins
      ctx.fillStyle = '#FFCC00';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 4, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(-5, -4, 3, 3);
      ctx.restore();
    }
  }

  private renderPlayerShip(ctx: CanvasRenderingContext2D) {
    const scrX = this.ship.x - this.cameraX;

    // Flashing when invulnerable
    if (this.ship.invulnerableTime > 0) {
      if (Math.floor(Date.now() / 80) % 2 === 0) return;
    }

    ctx.save();
    ctx.translate(scrX, this.ship.y);

    // Subtle pitch tilt depending on vertical movement
    const tilt = (this.ship.vy / 280) * 0.15;
    ctx.rotate(tilt);

    // Iconic Penetrator vector jet silhouette
    // Fuselage & Delta Wings
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(18, 0); // Sharp nose
    ctx.lineTo(-8, -6);
    ctx.lineTo(-14, -10); // Wing tip top
    ctx.lineTo(-12, -2);
    ctx.lineTo(-16, 0); // Engine exhaust
    ctx.lineTo(-12, 2);
    ctx.lineTo(-14, 10); // Wing tip bottom
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();

    // Wing accents & outline
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cockpit canopy
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.moveTo(4, -2);
    ctx.lineTo(12, 0);
    ctx.lineTo(4, 2);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Engine thrust jet flame
    const flameSize = Math.random() * 8 + 8;
    ctx.fillStyle = '#FF9900';
    ctx.beginPath();
    ctx.moveTo(-16, -3);
    ctx.lineTo(-16 - flameSize, 0);
    ctx.lineTo(-16, 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    const offsetX = -this.cameraX;
    for (const p of this.particles) {
      const scrX = p.x + offsetX;
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(scrX - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    const offsetX = -this.cameraX;
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';

    for (const ft of this.floatingTexts) {
      const scrX = ft.x + offsetX;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.fillText(ft.text, scrX, ft.y);
    }
    ctx.globalAlpha = 1.0;
  }

  private renderRadarStrip(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const radarH = 50;
    const radarY = height - radarH;

    // Background of radar strip
    ctx.fillStyle = '#040E0A';
    ctx.fillRect(0, radarY, width, radarH);

    // Top border line
    ctx.strokeStyle = '#00FF66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, radarY);
    ctx.lineTo(width, radarY);
    ctx.stroke();

    // Scale world stage length to radar width
    const stageLen = this.currentStage.length;
    const scaleX = width / stageLen;
    const scaleY = (radarH - 12) / height;

    // Mini terrain profile
    ctx.strokeStyle = '#008833';
    ctx.lineWidth = 1;

    // Mini floor
    ctx.beginPath();
    for (let i = 0; i < this.currentStage.floor.length; i++) {
      const p = this.currentStage.floor[i];
      const rx = p.x * scaleX;
      const ry = radarY + p.y * scaleY;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.stroke();

    // Mini ceiling
    ctx.beginPath();
    for (let i = 0; i < this.currentStage.ceiling.length; i++) {
      const p = this.currentStage.ceiling[i];
      const rx = p.x * scaleX;
      const ry = radarY + p.y * scaleY;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.stroke();

    // Mini enemy dots
    for (const e of this.enemies) {
      if (!e.active) continue;
      const rx = e.x * scaleX;
      const ry = radarY + e.y * scaleY;
      ctx.fillStyle = e.type === 'reactor' ? '#FF00E1' : e.type === 'fuel' ? '#00FF66' : '#FF0033';
      ctx.fillRect(rx - 1.5, ry - 1.5, 3, 3);
    }

    // Mini player ship dot & viewport box
    const playerRx = this.ship.x * scaleX;
    const playerRy = radarY + this.ship.y * scaleY;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(playerRx - 2, playerRy - 2, 4, 4);

    // Viewport box
    const vpLeft = this.cameraX * scaleX;
    const vpWidth = width * scaleX;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.strokeRect(vpLeft, radarY + 2, vpWidth, radarH - 4);

    // Radar scanline sweep effect
    const scanX = (Date.now() / 15) % width;
    ctx.fillStyle = 'rgba(0, 255, 100, 0.15)';
    ctx.fillRect(scanX, radarY, 15, radarH);

    // Radar label
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#00FF66';
    ctx.textAlign = 'left';
    ctx.fillText('RADAR SCANNER', 8, radarY + 12);
  }
}
