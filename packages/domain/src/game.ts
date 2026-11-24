import { samePoint, type Direction, type Point } from './direction';
import { createEnemy, type Enemy, type EnemyKind } from './enemies';
import { LEVELS, START, type LevelDef } from './levels';
import { DUNGEON, type Bounds } from './mover';
import { Player } from './player';
import { mathRandom, type RandomSource } from './random';
import { createWeapon, type ItemKind, type Weapon } from './weapons';

export type GameStatus = 'playing' | 'won' | 'lost';
export type LogTone = 'info' | 'good' | 'hit' | 'hurt';

export interface LogEntry {
  readonly id: number;
  readonly text: string;
  readonly tone: LogTone;
}

/** Fotos só de leitura que a tela desenha. Nenhuma delas deixa mexer no estado do jogo. */
export interface EnemyView {
  readonly id: number;
  readonly kind: EnemyKind;
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly hitPoints: number;
  readonly maxHitPoints: number;
  readonly maxDamage: number;
  readonly dead: boolean;
}

export interface ItemView {
  readonly kind: ItemKind;
  readonly name: string;
  readonly equipped: boolean;
}

export interface FloorItemView {
  readonly kind: ItemKind;
  readonly name: string;
  readonly x: number;
  readonly y: number;
}

export interface GameOptions {
  readonly random?: RandomSource;
  /** Troque os níveis nos testes; o padrão são os 7 do livro. */
  readonly levels?: readonly LevelDef[];
  readonly bounds?: Bounds;
}

const LOG_SIZE = 8;

/** O único objeto que a tela conhece: guarda jogador, inimigos, item do chão, nível e limites. */
export class Game {
  private readonly random: RandomSource;
  private readonly levels: readonly LevelDef[];
  private readonly area: Bounds;
  private player!: Player;
  private enemyList: Enemy[] = [];
  private floor: { weapon: Weapon; at: Point } | null = null;
  private levelIndex = 0;
  private state: GameStatus = 'playing';
  private turnCount = 0;
  private entries: LogEntry[] = [];
  private nextLogId = 1;

  constructor(options: GameOptions = {}) {
    this.random = options.random ?? mathRandom;
    this.levels = options.levels ?? LEVELS;
    this.area = options.bounds ?? DUNGEON;
    this.restart();
  }

  // ---------- leitura ----------
  get width(): number {
    return this.area.width;
  }

  get height(): number {
    return this.area.height;
  }

  get level(): number {
    return this.levelIndex + 1;
  }

  get levelCount(): number {
    return this.levels.length;
  }

  get status(): GameStatus {
    return this.state;
  }

  get turn(): number {
    return this.turnCount;
  }

  get playerPosition(): Point {
    return this.player.position;
  }

  get playerHitPoints(): number {
    return this.player.hitPoints;
  }

  get inventory(): readonly ItemView[] {
    const equipped = this.player.equipped?.kind;
    return this.player.inventory.map((kind) => ({
      kind,
      name: this.player.weaponName(kind),
      equipped: kind === equipped,
    }));
  }

  get equipped(): ItemKind | null {
    return this.player.equipped?.kind ?? null;
  }

  get enemies(): readonly EnemyView[] {
    return this.enemyList.map((e, id) => ({
      id,
      kind: e.kind,
      name: e.name,
      x: e.position.x,
      y: e.position.y,
      hitPoints: e.hitPoints,
      maxHitPoints: e.maxHitPoints,
      maxDamage: e.maxDamage,
      dead: e.dead,
    }));
  }

  get floorItem(): FloorItemView | null {
    if (!this.floor) return null;
    return { kind: this.floor.weapon.kind, name: this.floor.weapon.name, ...this.floor.at };
  }

  /** Últimas ações, da mais nova para a mais antiga. */
  get log(): readonly LogEntry[] {
    return this.entries;
  }

  // ---------- ações ----------
  restart(): void {
    this.player = new Player(START, this.area);
    this.levelIndex = 0;
    this.state = 'playing';
    this.turnCount = 0;
    this.entries = [];
    this.loadLevel();
    this.write('Você desceu à masmorra. Pegue a arma do chão!', 'info');
  }

  move(direction: Direction): void {
    if (this.state !== 'playing') return;
    if (!this.player.move(direction, (p) => this.enemyAt(p) !== undefined)) {
      this.write('O caminho está bloqueado.', 'info');
    }
    if (this.floor && samePoint(this.floor.at, this.player.position)) {
      this.player.pickUp(this.floor.weapon);
      this.write(`Você pegou: ${this.floor.weapon.name}.`, 'good');
      this.floor = null;
    }
    this.endTurn();
  }

  attack(direction: Direction): void {
    if (this.state !== 'playing') return;
    const result = this.player.attack(direction, this.enemyList, this.random);
    if (!result) {
      this.write('Você está de mãos vazias: pegue uma arma.', 'info');
      return;
    }
    if (result.healed > 0) this.write(`Você bebeu a poção: +${result.healed} de vida.`, 'good');
    else if (result.hits.length === 0) this.write('O golpe acertou o vento.', 'info');
    for (const hit of result.hits) {
      this.write(`Você acertou o ${hit.enemy}: -${hit.damage}${hit.killed ? ' (derrotado!)' : ''}`, 'hit');
    }
    this.endTurn();
  }

  /** Trocar de arma não gasta o turno. */
  equip(kind: ItemKind): boolean {
    if (this.state !== 'playing' || !this.player.equip(kind)) return false;
    this.write(`Equipou: ${this.player.weaponName(kind)}.`, 'info');
    return true;
  }

  // ---------- regras internas ----------
  private endTurn(): void {
    this.turnCount++;
    if (this.levelCleared()) {
      this.nextLevel();
      return;
    }
    // Fila de turnos: cada inimigo vivo anda e, se estiver colado no jogador, ataca.
    const queue = this.enemyList.filter((e) => !e.dead);
    while (queue.length > 0 && !this.player.dead) {
      const enemy = queue.shift()!;
      enemy.move(this.player.position, this.random, (p) => this.occupied(p, enemy));
      const damage = enemy.attack(this.player.position, this.random);
      if (damage > 0) {
        this.player.hit(damage);
        this.write(`${enemy.name} te acertou: -${damage}`, 'hurt');
      }
    }
    if (this.player.dead) {
      this.state = 'lost';
      this.write(`Você caiu no nível ${this.level}.`, 'hurt');
    }
  }

  private levelCleared(): boolean {
    return this.enemyList.every((e) => e.dead);
  }

  private nextLevel(): void {
    if (this.levelIndex === this.levels.length - 1) {
      this.state = 'won';
      this.write('Masmorra limpa: missão cumprida!', 'good');
      return;
    }
    this.levelIndex++;
    this.loadLevel();
    this.write(`Nível ${this.level}: novos inimigos à vista.`, 'info');
  }

  private loadLevel(): void {
    const def = this.levels[this.levelIndex]!;
    this.player.placeAt(START);
    this.enemyList = def.enemies.map((e) => createEnemy(e.kind, e.at, this.area));
    const kind = def.items.find((k) => !this.player.has(k));
    this.floor = kind ? { weapon: createWeapon(kind), at: def.itemAt } : null;
  }

  private enemyAt(point: Point): Enemy | undefined {
    return this.enemyList.find((e) => !e.dead && samePoint(e.position, point));
  }

  private occupied(point: Point, self: Enemy): boolean {
    if (samePoint(point, this.player.position)) return true;
    const other = this.enemyAt(point);
    return other !== undefined && other !== self;
  }

  private write(text: string, tone: LogTone): void {
    this.entries = [{ id: this.nextLogId++, text, tone }, ...this.entries].slice(0, LOG_SIZE);
  }
}
