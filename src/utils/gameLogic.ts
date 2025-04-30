import { Panel, PanelType, GameConfig, Grid } from '../types/game';

export const createEmptyGrid = (config: GameConfig): Grid => {
  return Array(config.rows).fill(null).map(() =>
    Array(config.columns).fill(null)
  );
};

export const generateRandomPanel = (x: number, y: number, config: GameConfig, grid: Grid): Panel => {
  const availableTypes = [...config.panelTypes];
  
  // 左のパネルと同じ色を避ける
  if (x > 0 && grid[y][x - 1]) {
    const leftType = grid[y][x - 1]!.type;
    const leftIndex = availableTypes.indexOf(leftType);
    if (leftIndex !== -1) {
      availableTypes.splice(leftIndex, 1);
    }
  }
  
  // 上のパネルと同じ色を避ける
  if (y > 0 && grid[y - 1][x]) {
    const upType = grid[y - 1][x]!.type;
    const upIndex = availableTypes.indexOf(upType);
    if (upIndex !== -1) {
      availableTypes.splice(upIndex, 1);
    }
  }
  
  // 下のパネルと同じ色を避ける
  if (y < config.rows - 1 && grid[y + 1][x]) {
    const downType = grid[y + 1][x]!.type;
    const downIndex = availableTypes.indexOf(downType);
    if (downIndex !== -1) {
      availableTypes.splice(downIndex, 1);
    }
  }
  
  // 左2つが同じ色の場合、その色を避ける
  if (x > 1 && grid[y][x - 1] && grid[y][x - 2] && grid[y][x - 1]!.type === grid[y][x - 2]!.type) {
    const leftType = grid[y][x - 1]!.type;
    const leftIndex = availableTypes.indexOf(leftType);
    if (leftIndex !== -1) {
      availableTypes.splice(leftIndex, 1);
    }
  }
  
  // 上2つが同じ色の場合、その色を避ける
  if (y > 1 && grid[y - 1][x] && grid[y - 2][x] && grid[y - 1][x]!.type === grid[y - 2][x]!.type) {
    const upType = grid[y - 1][x]!.type;
    const upIndex = availableTypes.indexOf(upType);
    if (upIndex !== -1) {
      availableTypes.splice(upIndex, 1);
    }
  }
  
  // 下2つが同じ色の場合、その色を避ける
  if (y < config.rows - 2 && grid[y + 1][x] && grid[y + 2][x] && grid[y + 1][x]!.type === grid[y + 2][x]!.type) {
    const downType = grid[y + 1][x]!.type;
    const downIndex = availableTypes.indexOf(downType);
    if (downIndex !== -1) {
      availableTypes.splice(downIndex, 1);
    }
  }
  
  // 残りの色からランダムに選択
  const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  return { type, x, y };
};

export const initializeGrid = (config: GameConfig): Grid => {
  const grid = createEmptyGrid(config);
  
  console.log('\n=== 初期グリッド生成開始 ===');
  
  // 下から上に向かってパネルを配置
  for (let y = config.rows - 1; y >= config.rows - config.initialFilledRows; y--) {
    for (let x = 0; x < config.columns; x++) {
      let attempts = 0;
      let panel;
      let isValid = false;
      
      do {
        panel = generateRandomPanel(x, y, config, grid);
        attempts++;
        
        // 配置が有効かチェック
        isValid = true;
        
        // 横方向のチェック
        if (x >= 2 && grid[y][x - 1] && grid[y][x - 2]) {
          if (grid[y][x - 1]!.type === grid[y][x - 2]!.type && grid[y][x - 1]!.type === panel.type) {
            isValid = false;
            console.log(`無効な配置: 横方向に3つ並び (${x},${y})`);
          }
        }
        
        // 縦方向のチェック（上方向）
        if (y >= 2 && grid[y - 1][x] && grid[y - 2][x]) {
          if (grid[y - 1][x]!.type === grid[y - 2][x]!.type && grid[y - 1][x]!.type === panel.type) {
            isValid = false;
            console.log(`無効な配置: 縦方向（上）に3つ並び (${x},${y})`);
          }
        }
        
        // 縦方向のチェック（下方向）
        if (y < config.rows - 2 && grid[y + 1][x] && grid[y + 2][x]) {
          if (grid[y + 1][x]!.type === grid[y + 2][x]!.type && grid[y + 1][x]!.type === panel.type) {
            isValid = false;
            console.log(`無効な配置: 縦方向（下）に3つ並び (${x},${y})`);
          }
        }
        
      } while (!isValid && attempts < 10);

      grid[y][x] = panel;
    }
  }
  
  // 初期グリッド状態をログ出力
  console.log('\n初期グリッド状態:');
  for (let y = 0; y < config.rows; y++) {
    const row = grid[y].map(p => p ? p.type : 'null');
    console.log(`Row ${y}:`, row);
  }
  
  console.log('=== 初期グリッド生成終了 ===\n');
  
  return grid;
};

export const findMatches = (grid: Grid): Panel[] => {
  const matches = new Set<string>(); // 位置を文字列として保存
  const rows = grid.length;
  const columns = grid[0].length;

  // デバッグ用の関数
  const addMatch = (x: number, y: number, type: string, direction: string, startPos: string) => {
    const key = `${x},${y}`;
    if (!matches.has(key)) {
      console.log(`マッチを検出: (${x}, ${y}) type=${type}`);
      console.log(`  方向: ${direction}`);
      console.log(`  検出開始位置: ${startPos}`);
      matches.add(key);
    }
  };

  // 横方向のマッチを検索
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns - 2; x++) {
      const panel = grid[y][x];
      if (!panel) continue;

      const type = panel.type;
      let matchCount = 1;
      let currentX = x + 1;

      // 右方向に同じタイプのパネルを探す
      while (currentX < columns && grid[y][currentX]?.type === type) {
        matchCount++;
        currentX++;
      }

      // 3つ以上連続している場合、マッチとして登録
      if (matchCount >= 3) {
        console.log(`\n横方向のマッチを検出 (開始位置: x=${x}, y=${y})`);
        for (let i = 0; i < matchCount; i++) {
          addMatch(x + i, y, type, '横', `(${x}, ${y})`);
        }
      }
    }
  }

  // 縦方向のマッチを検索
  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows - 2; y++) {
      const panel = grid[y][x];
      if (!panel) continue;

      const type = panel.type;
      let matchCount = 1;
      let currentY = y + 1;

      // 下方向に同じタイプのパネルを探す
      while (currentY < rows && grid[currentY][x]?.type === type) {
        matchCount++;
        currentY++;
      }

      // 3つ以上連続している場合、マッチとして登録
      if (matchCount >= 3) {
        console.log(`\n縦方向のマッチを検出 (開始位置: x=${x}, y=${y})`);
        for (let i = 0; i < matchCount; i++) {
          addMatch(x, y + i, type, '縦', `(${x}, ${y})`);
        }
      }
    }
  }

  // マッチしたパネルの配列を生成
  const matchArray = Array.from(matches).map(key => {
    const [x, y] = key.split(',').map(Number);
    const panel = grid[y][x];
    if (!panel) {
      console.error(`エラー: パネルが見つかりません (${x}, ${y})`);
      return null;
    }
    return { ...panel, x, y };  // パネルの位置情報を正しく設定
  }).filter((panel): panel is Panel => panel !== null);

  console.log('\n検出されたマッチの総数:', matchArray.length);
  console.log('マッチの詳細:', matchArray.map(m => `(${m.x}, ${m.y}) type=${m.type}`));
  return matchArray;
};

export const removeMatches = (grid: Grid, matches: Panel[]): Grid => {
  console.log('\n=== パネル削除処理開始 ===');
  console.log('削除前のグリッド状態:');
  grid.forEach((row, y) => {
    console.log(`Row ${y}:`, row.map(p => p ? p.type : 'null'));
  });

  // グリッドの深いコピーを作成
  const newGrid = grid.map(row => row.map(panel => panel ? {...panel} : null));
  
  // マッチしたパネルを削除
  let deletedCount = 0;
  matches.forEach(match => {
    const { x, y } = match;
    console.log(`\n削除対象のパネル: (${x}, ${y})`);
    console.log(`  タイプ: ${match.type}`);
    console.log(`  現在のグリッド上のパネル:`, grid[y][x]);
    
    if (grid[y][x] && grid[y][x]!.type === match.type) {
      console.log(`パネルを削除: (${x}, ${y}) type=${newGrid[y][x]?.type}`);
      newGrid[y][x] = null;
      deletedCount++;
    } else {
      console.log(`警告: パネルの位置またはタイプが一致しません`);
    }
  });
  
  console.log('\n削除後のグリッド状態:');
  newGrid.forEach((row, y) => {
    console.log(`Row ${y}:`, row.map(p => p ? p.type : 'null'));
  });
  
  console.log(`\n削除されたパネルの総数: ${deletedCount}`);
  console.log('=== パネル削除処理終了 ===\n');

  return newGrid;
};

export const applyGravity = (grid: Grid): Grid => {
  // グリッドの深いコピーを作成
  const newGrid = grid.map(row => [...row]);
  const columns = grid[0].length;
  const rows = grid.length;

  // 各列に対して下から上に処理
  for (let x = 0; x < columns; x++) {
    let emptyY = rows - 1; // 空きスペースの位置

    // 下から上にパネルを移動
    for (let y = rows - 1; y >= 0; y--) {
      if (newGrid[y][x]) {
        // パネルがある場合、空きスペースに移動
        if (y !== emptyY) {
          newGrid[emptyY][x] = { ...newGrid[y][x]!, y: emptyY };
          newGrid[y][x] = null;
        }
        emptyY--;
      }
    }
  }

  return newGrid;
};

export const swapPanels = (grid: Grid, x1: number, y1: number, x2: number, y2: number): Grid => {
  // グリッドの深いコピーを作成
  const newGrid = grid.map(row => [...row]);
  
  // パネルの入れ替え
  const temp = newGrid[y1][x1];
  newGrid[y1][x1] = newGrid[y2][x2];
  newGrid[y2][x2] = temp;
  
  return newGrid;
};

export const canSwap = (grid: Grid, x1: number, y1: number, x2: number, y2: number): boolean => {
  // グリッドの範囲内かチェック
  if (x1 < 0 || x1 >= grid[0].length || x2 < 0 || x2 >= grid[0].length ||
      y1 < 0 || y1 >= grid.length || y2 < 0 || y2 >= grid.length) {
    return false;
  }
  
  // 両方ともパネルがない場合は入れ替え不可
  if (!grid[y1][x1] && !grid[y2][x2]) {
    return false;
  }
  
  // 隣接するパネル同士のみ入れ替え可能
  if (Math.abs(x1 - x2) === 1 && y1 === y2) {
    return true;
  }
  
  return false;
};

export const riseGrid = (grid: Grid, config: GameConfig): Grid => {
  const newGrid = grid.map(row => [...row]);
  
  // 既存のパネルを1行上に移動
  for (let y = 0; y < grid.length - 1; y++) {
    for (let x = 0; x < config.columns; x++) {
      if (grid[y + 1][x]) {
        newGrid[y][x] = { ...grid[y + 1][x]!, y };
      } else {
        newGrid[y][x] = null;
      }
    }
  }
  
  // 一番下の行に新しいパネルを生成
  for (let x = 0; x < config.columns; x++) {
    newGrid[grid.length - 1][x] = generateRandomPanel(x, grid.length - 1, config, newGrid);
  }
  
  return newGrid;
};

export const calculateScore = (matches: number, chain: number, level: number): number => {
  // 基本スコア = マッチ数 * 10
  const baseScore = matches * 10;
  
  // 連鎖ボーナス（連鎖数が増えるほど指数関数的に増加）
  const chainBonus = Math.pow(2, chain - 1);
  
  // レベルボーナス
  const levelBonus = level * 0.5;
  
  // 最終スコア = 基本スコア * 連鎖ボーナス * (1 + レベルボーナス)
  return Math.floor(baseScore * chainBonus * (1 + levelBonus));
};

export const shouldLevelUp = (score: number, level: number, levelUpScore: number): boolean => {
  // レベルが上がるごとに必要スコアが増加
  const requiredScore = level * levelUpScore;
  return score >= requiredScore;
};

export const calculateNewSpeed = (currentSpeed: number, level: number, speedUpFactor: number): number => {
  // 最低速度は10000ms（10秒）
  const minSpeed = 10000;
  // レベルが上がるごとに徐々に速くなる（ただし最低速度は保持）
  return Math.max(minSpeed, currentSpeed - (level * speedUpFactor));
}; 