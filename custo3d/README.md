# Custo 3D

App React Native (Expo + TypeScript) para calcular o custo e o preço de venda de peças impressas em 3D.
Os dados ficam guardados no telemóvel (AsyncStorage). Sem contas, sem internet.

## Arrancar

```bash
npm run setup   # instala e alinha as versões de todas as dependências com o Expo
npm start       # abre o Expo; lê o QR code com o Expo Go
```

O projeto está na Expo SDK 57. Se o teu Expo Go já for da SDK 58, corre
`npx expo install expo@^58.0.0 --fix` e depois `npm start`.

## O que faz

- **Bobines**: cor, tipo (PLA, PETG, ABS…), peso e preço pago. Calcula €/kg e €/g.
- **Produtos**: nome, descrição, materiais (bobines registadas + gramas) e tempo de impressão.
  O custo e o preço de venda calculam-se ao vivo e o produto fica guardado.
- **Definições**: eletricidade (€/kWh), consumo (W), desgaste (€/h), margem para falhas (%),
  embalagem (€) e margem de lucro (%). Alterar uma definição atualiza todos os produtos.

### Fórmula

```
material   = Σ gramas × (preço da bobine ÷ peso da bobine)
eletricid. = (W ÷ 1000) × horas × €/kWh
desgaste   = horas × €/h
falhas     = (material + eletricidade + desgaste) × % falhas
custo      = material + eletricidade + desgaste + falhas + embalagem
preço      = custo × (1 + % margem de lucro)
```

Se apagares uma bobine usada num produto, o produto mantém o último custo/g guardado.
Se editares o preço de uma bobine, os produtos que a usam atualizam-se.

## Desempenho

- Animações com `Animated` + `useNativeDriver` (correm na thread nativa); respeitam "reduzir movimento".
- Store própria com `useSyncExternalStore`: cada ecrã só re-renderiza quando a sua fatia muda.
- Gravação com debounce e forçada ao sair da app; listas com `FlatList` e linhas memoizadas.
- Sem dependências de navegação nem de animação extra.

## Estrutura

```
App.tsx                  navegação (separadores + páginas de formulário)
src/lib/                 cálculo, formatação pt-PT, validação (lógica pura, testada)
src/store/createStore.ts store + persistência (testada)
src/store/appStore.ts    liga a store ao AsyncStorage e ao React
src/screens/             Bobines, Produtos, Definições e formulários
src/ui/                  componentes base
tests/                   testes da lógica
```

## Testes

```bash
npm test                 # 30 testes (Node 22+): cálculo, validação, persistência
npm run typecheck        # TypeScript estrito da app (depois do npm run setup)
```
