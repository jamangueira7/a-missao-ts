# A Missão TS

Jogo de aventura por turnos numa masmorra, com 7 níveis, inimigos, armas e poções. Laboratório do **Use a Cabeça! C#** reescrito em **TypeScript**, com a mesma estrutura do
[corrida-cachorro-ts](https://github.com/jamangueira7/corrida-cachorro-ts): React + Vite, Fastify, Postgres com
Kysely, Vitest e tudo subindo com Docker.

> Status: Laboratório 2 jogável do nível 1 ao 7, com vitória, derrota e ranking no Postgres.

## Como jogar

A cada turno você **anda** ou **ataca** numa das 4 direções; depois cada inimigo vivo age (anda e, se estiver
colado em você, até na diagonal, ataca). Você começa com 10 de vida na casa da esquerda, no meio da sala. Pise na
arma do chão para pegá-la; limpe a sala para descer ao próximo nível. Vence quem limpa o nível 7.

- Teclado: **setas** andam, **W A S D** atacam, **1 a 5** equipam o item do inventário. Trocar de arma não gasta turno.
- Poções são "armas": equipe e ataque em qualquer direção para beber. Somem depois de usadas.

## Regras e decisões

- **Grade lógica de 10×6 casas.** O livro mede tudo em pixels com passo de 10; aqui 10 px = 1 casa. Espada alcança
  1 casa, maça 2, arco 3. Ninguém entra numa casa ocupada por outro personagem.
- **Dano sorteado de 1 até o máximo** (como o `Random.Next` do livro), com o aleatório injetado (`RandomSource`).

| Quem | Vida | Movimento | Dano |
| --- | --- | --- | --- |
| Morcego | 6 | metade das vezes vai até você, metade numa direção aleatória | até 2 |
| Fantasma | 8 | 1/3 das vezes vai até você, senão fica parado | até 3 |
| Zumbi | 10 | 2/3 das vezes vai até você, senão fica parado (decisão: o mais forte é o mais insistente) | até 4 |

| Item | Ataque |
| --- | --- |
| Espada | 1 casa, até 3; tenta a direção escolhida e depois as duas laterais (horário, anti-horário) |
| Arco | 3 casas, dano 1, só na direção escolhida |
| Maça | 2 casas, até 6, gira e acerta o primeiro inimigo de cada uma das 4 direções |
| Poção azul / vermelha | cura de 1 até 5 / 10 (sem teto de vida) |

### Os 7 níveis (tabela da pág. 325, posições fixas)

| Nível | Inimigos | Item no chão |
| --- | --- | --- |
| 1 | Morcego | Espada |
| 2 | Fantasma | Poção azul |
| 3 | Zumbi | Arco |
| 4 | Morcego e Fantasma | Arco se ainda não tem, senão Poção azul |
| 5 | Morcego e Zumbi | Poção vermelha |
| 6 | Fantasma e Zumbi | Maça |
| 7 | Morcego, Fantasma e Zumbi | Maça se ainda não tem, senão Poção vermelha |

Ranking: vitória primeiro, depois nível alcançado e vida final (desempate: quem chegou antes). `POST /api/runs`
valida o corpo com `validateRun` do domínio; `GET /api/runs/ranking` devolve as 10 melhores.

## Arquitetura (cap. 5 a 8)

`Game` é o único objeto que a tela usa (estado `private`, só *getters* e as ações `move`, `attack`, `equip`,
`restart`). Dentro do domínio: `abstract class Mover` (campos `protected`) → `Player` e `abstract class Enemy` →
`Bat`, `Ghost`, `Ghoul` (`override move()`); `abstract class Weapon` → `Sword`, `Bow`, `Mace`; `interface IPotion`
→ `BluePotion`, `RedPotion` com o *type guard* `isPotion`; `enum Direction`; inventário num `Map`; fila de turnos
dos inimigos; ranking ordenado com comparador (`compareRuns`).

## Rodar

Pré-requisito: Docker com Compose. Não precisa de Node na máquina.

```bash
docker compose up -d          # ou: make up
```

- App: http://localhost:5174
- API (pelo proxy do Vite): http://localhost:5174/api/health
- Banco: `docker compose exec db psql -U lab`
- Produção (nginx + Node compilado): `make prod` → http://localhost:8080

## Estrutura

```
packages/domain/   classes do livro em TS puro + testes (Vitest)
apps/web/          React + Vite
apps/api/          Fastify + Kysely, migrations em src/migrations
docs/cronograma.md plano dos três laboratórios
```

## Desenvolvimento

```bash
git config core.hooksPath .githooks   # ativa os hooks de commit e push
make check                            # ESLint + tsc + Vitest no container
```

Branches `feature/<nome>`, commits `tipo(escopo): descrição` com até 6 arquivos. Detalhes na skill
`.claude/skills/lab-ts/SKILL.md`.
