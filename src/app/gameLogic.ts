type PanelType = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'empty';

interface Panel {
  type: PanelType;
  row: number;
  col: number;
}

interface GameState {
  board: Panel[][];
  score: number;
  level: number;
  chain: number;
  startTime: number;
  elapsedTime: number;
}

export class Game {
  private gameInfoElement: HTMLElement;
  private state: GameState;
  private boardElement: HTMLElement;
  private startTime: number;

  constructor(boardElement: HTMLElement) {
    this.boardElement = boardElement;
    this.gameInfoElement = document.getElementById('game-info') as HTMLElement;
    this.state = {
      board: this.initializeBoard(),
      score: 0,
      level: 1,
      chain: 0,
      startTime: Date.now(),
      elapsedTime: 0
    };
    this.startTime = Date.now();
    this.updateGameInfo();
    setInterval(() => this.updateTime(), 1000);
  }

  private updateGameInfo() {
    this.gameInfoElement.innerHTML = `
      <h2>ゲーム情報</h2>
      <p>スコア: <span class="value">${this.state.score}</span></p>
      <p>レベル: <span class="value">${this.state.level}</span></p>
      <p>連鎖: <span class="value">${this.state.chain}</span></p>
      <p>プレイ時間: <span class="value">${Math.floor(this.state.elapsedTime / 60)}:${(this.state.elapsedTime % 60).toString().padStart(2, '0')}</span></p>
    `;
  }

  private updateTime() {
    this.state.elapsedTime = Math.floor((Date.now() - this.state.startTime) / 1000);
    this.updateGameInfo();
  }

  private initializeBoard(): Panel[][] {
    const rows = 12;
    const cols = 6;
    const board: Panel[][] = [];

    for (let row = 0; row < rows; row++) {
      board[row] = [];
      for (let col = 0; col < cols; col++) {
        board[row][col] = {
          type: 'empty',
          row,
          col
        };
      }
    }
    return board;
  }

  private getRandomPanelType(): PanelType {
    const types: PanelType[] = ['red', 'blue', 'green', 'yellow', 'purple'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private async handleMatches(matches: Panel[]) {
    this.state.chain++;
    const score = matches.length * 100 * this.state.chain * this.state.level;
    this.state.score += score;
    
    // パネルの削除
    matches.forEach(panel => {
      const element = document.querySelector(`[data-row="${panel.row}"][data-col="${panel.col}"]`);
      if (element) {
        element.remove();
      }
    });

    // パネルの落下
    await this.fallPanels();
    
    // 新しいパネルの生成
    this.generateNewPanels();
    
    this.updateGameInfo();
  }

  private async fallPanels() {
    const columns = this.state.board[0].length;
    const rows = this.state.board.length;

    for (let col = 0; col < columns; col++) {
      let emptyRow = rows - 1;
      for (let row = rows - 1; row >= 0; row--) {
        if (this.state.board[row][col].type !== 'empty') {
          if (emptyRow !== row) {
            this.state.board[emptyRow][col] = this.state.board[row][col];
            this.state.board[row][col] = { type: 'empty', row, col };
            
            const element = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (element) {
              element.setAttribute('data-row', emptyRow.toString());
              element.classList.add('falling');
              setTimeout(() => {
                element.classList.remove('falling');
              }, 200);
            }
          }
          emptyRow--;
        }
      }
    }
  }

  private generateNewPanels() {
    const columns = this.state.board[0].length;
    const rows = this.state.board.length;

    for (let col = 0; col < columns; col++) {
      let emptyCount = 0;
      for (let row = 0; row < rows; row++) {
        if (this.state.board[row][col].type === 'empty') {
          emptyCount++;
        }
      }

      for (let row = 0; row < emptyCount; row++) {
        const newPanel = {
          type: this.getRandomPanelType(),
          row: row,
          col: col
        };
        this.state.board[row][col] = newPanel;
        
        const element = document.createElement('div');
        element.className = `panel ${newPanel.type}`;
        element.setAttribute('data-row', row.toString());
        element.setAttribute('data-col', col.toString());
        element.classList.add('falling');
        this.boardElement.appendChild(element);
        
        setTimeout(() => {
          element.classList.remove('falling');
        }, 200);
      }
    }
  }
} 