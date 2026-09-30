# Escritório virtual

Prévia visual, somente front-end, de um escritório em pixel art (estilo Gather)
para acompanhar a operação da agência. Sem backend, sem autenticação, sem
Supabase. Todos os dados são fictícios.

## Rodar

```bash
npm install
npm run dev     # abre em http://localhost:5173
npm run build   # tsc -b + vite build
npm run lint    # eslint
```

## Stack

React 19 e TypeScript cuidam da interface. Phaser 3 cuida do mapa. As duas
metades só conversam pelo bus de eventos em `src/game/bus.ts`, então nenhum
componente importa Phaser e nenhuma cena importa componentes.

## Estrutura

```
src/
  types.ts              tipos de domínio, sem dependência de UI ou engine
  data/
    mock.ts             dados fictícios (5 clientes, 33 itens)
    source.ts           camada de acesso: interface + ponto único de troca
  lib/status.ts         rótulos, cores e regra de atraso
  hooks/useOfficeData.ts  carrega pela camada source, agrupa por mesa
  game/
    palette.ts          paleta única e cor de identidade de cada sala
    layout.ts           planta do andar: salas, portas, mesas, decoração
    textures.ts         geração dos sprites em canvas
    OfficeScene.ts      cena Phaser: tilemap, colisão, personagem, câmera
    bus.ts              canal de eventos React <-> Phaser
    PhaserGame.tsx      monta e destrói a instância do Phaser
  components/           barra superior, painel da mesa, resumo da Diretoria
```

## Trocar o mock por dados reais

`src/data/source.ts` define a interface `OfficeDataSource` e exporta
`officeData`. Hoje `officeData` aponta para a implementação que lê de
`mock.ts`. Para ligar no Supabase:

1. Criar um objeto que implemente `OfficeDataSource` consultando as tabelas.
2. Trocar a atribuição de `officeData` no fim do arquivo.

Nada mais precisa mudar. O filtro de cliente já chega como consulta
(`listWorkItems({ clientId })`), e não como filtro local, então uma fonte real
pode resolvê-lo no servidor.

## Sprites

O projeto não traz arquivos de imagem: tileset, mobiliário, plantas e
personagem são desenhados em canvas por `src/game/textures.ts`. Para usar
sprites de verdade, basta carregá-los no `preload` da cena mantendo as chaves
declaradas no objeto `TEX`; o resto da cena não muda.

## Mapa

Oito salas em uma grade 3x3, com praça central aberta e corredores de 4 tiles
ligando tudo: Conteúdo, Sala de Reunião, Sites, SEO Local, Mídia Paga,
Revisão, Recepção (entrada de tarefas) e Diretoria. Tiles de 32px, 59x50
tiles no total.

## Interação

- WASD ou setas movem o personagem, com colisão em paredes e mobiliário.
- A câmera segue o personagem. Os botões `+` e `-` ajustam o zoom e
  "Visão geral" enquadra o andar inteiro. Andar em visão geral devolve a
  câmera ao personagem.
- Clicar em uma mesa abre o painel lateral com título, cliente, status,
  responsável e prazo de cada item. `Esc` fecha.
- O seletor de cliente no topo filtra os itens exibidos nas mesas.
- Mesa com item atrasado recebe marcador vermelho pulsante.
- Entrar na Diretoria abre o painel resumo com total por status e atrasados,
  respeitando o filtro de cliente ativo.
