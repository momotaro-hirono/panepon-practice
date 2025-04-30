"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, GameConfig, Grid } from '../types/game';
import {
  initializeGrid,
  findMatches,
  removeMatches,
  applyGravity,
  canSwap,
  swapPanels,
  riseGrid,
  calculateScore,
  shouldLevelUp,
  calculateNewSpeed
} from '../utils/gameLogic';

const config: GameConfig = {
  columns: 6,
  rows: 12,
  panelTypes: ['red', 'blue', 'green', 'yellow', 'purple'],
  initialRiseSpeed: 5000,
  riseSpeedIncrement: 200,
  chainDelay: 500,
  initialFilledRows: 5,
  levelUpScore: 1000,
  speedUpFactor: 100
};

const PanelPonGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [chainEffect, setChainEffect] = useState(false);
  const [cursor, setCursor] = useState({ x: 3, y: 6 });
  const [movingPanels, setMovingPanels] = useState<{[key: string]: string}>({});
  const [autoRise, setAutoRise] = useState<NodeJS.Timeout | null>(null);
  const [riseProgress, setRiseProgress] = useState(0);
  const [shakingPanels, setShakingPanels] = useState<Set<string>>(new Set());

  // クライアントサイドでのみ初期化
  useEffect(() => {
    initializeGame();
  }, []);

  // 自動上昇の制御
  useEffect(() => {
    if (gameState && !gameState.gameOver && !isAnimating) {
      if (autoRise) {
        clearTimeout(autoRise);
      }
      
      const timer = setTimeout(() => {
        handleRise();
      }, gameState.riseSpeed);
      
      setAutoRise(timer);
    }
    
    return () => {
      if (autoRise) {
        clearTimeout(autoRise);
      }
    };
  }, [gameState, isAnimating]);

  const initializeGame = useCallback(() => {
    setGameState({
      grid: initializeGrid(config),
      score: 0,
      chain: 0,
      maxChain: 0,
      gameOver: false,
      selectedPanel: null,
      riseSpeed: config.initialRiseSpeed,
      lastRiseTime: Date.now(),
      level: 1
    });
    setCursor({ x: 3, y: 6 });
    setIsAnimating(false);
    setChainEffect(false);
    setMovingPanels({});
    setRiseProgress(0);
    setShakingPanels(new Set());
  }, []);

  const handleRise = useCallback(() => {
    if (!gameState || gameState.gameOver || isAnimating) return;

    // せり上がりアニメーション
    setRiseProgress(prev => {
      const newProgress = prev + 0.1;
      if (newProgress >= 1) {
        setGameState(prev => {
          if (!prev) return null;
          const newGrid = riseGrid(prev.grid, config);
          
          // ゲームオーバーチェック（天井に触れた場合）
          const isGameOver = newGrid[0].some(panel => panel !== null);
          
          if (isGameOver) {
            return { ...prev, gameOver: true };
          }

          // レベルアップチェック
          const newLevel = Math.min(99, Math.floor(prev.score / 1000) + 1);
          const newRiseSpeed = Math.max(100, config.initialRiseSpeed - (newLevel * 50));

          return {
            ...prev,
            grid: newGrid,
            lastRiseTime: Date.now(),
            level: newLevel,
            riseSpeed: newRiseSpeed
          };
        });
        return 0;
      }
      return newProgress;
    });
  }, [gameState, isAnimating]);

  const processChain = useCallback((grid: Grid, chainCount: number) => {
    const matches = findMatches(grid);
    
    if (matches.length > 0) {
      setIsAnimating(true);
      setChainEffect(true);
      
      setTimeout(() => {
        const gridAfterRemoval = removeMatches(grid, matches);
        const gridAfterMatches = applyGravity(gridAfterRemoval);
        
        setGameState(prev => {
          if (!prev) return null;
          const newScore = prev.score + calculateScore(matches.length, chainCount, prev.level);
          const shouldLevel = shouldLevelUp(newScore, prev.level, config.levelUpScore);
          
          return {
            ...prev,
            grid: gridAfterMatches,
            score: newScore,
            chain: chainCount,
            maxChain: Math.max(prev.maxChain, chainCount),
            level: shouldLevel ? prev.level + 1 : prev.level,
            riseSpeed: shouldLevel ? calculateNewSpeed(prev.riseSpeed, prev.level + 1, config.speedUpFactor) : prev.riseSpeed
          };
        });
        
        // 次の連鎖をチェック
        setTimeout(() => {
          processChain(gridAfterMatches, chainCount + 1);
        }, 300);
        
      }, config.chainDelay);
    } else {
      setIsAnimating(false);
      setChainEffect(false);
    }
  }, []);

  const handlePanelSwap = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    if (!gameState || gameState.gameOver || isAnimating) return;

    if (canSwap(gameState.grid, x1, y1, x2, y2)) {
      // 移動アニメーションの方向を設定
      const newMovingPanels: {[key: string]: string} = {};
      if (x2 > x1) {
        newMovingPanels[`${x1},${y1}`] = 'right';
        newMovingPanels[`${x2},${y2}`] = 'left';
      } else {
        newMovingPanels[`${x1},${y1}`] = 'left';
        newMovingPanels[`${x2},${y2}`] = 'right';
      }
      setMovingPanels(newMovingPanels);

      const newGrid = swapPanels(gameState.grid, x1, y1, x2, y2);
      const gridAfterGravity = applyGravity(newGrid);
      
      // まずグリッドを更新
      setGameState(prev => {
        if (!prev) return null;
        return { ...prev, grid: gridAfterGravity };
      });

      // アニメーション終了後に移動状態をリセット
      setTimeout(() => {
        setMovingPanels({});

        // マッチングチェック
        const matches = findMatches(gridAfterGravity);
        if (matches.length > 0) {
          setIsAnimating(true);
          
          // マッチしたパネルに揺れアニメーションを適用
          const matchPositions = new Set<string>();
          matches.forEach(match => {
            matchPositions.add(`${match.x},${match.y}`);
          });
          setShakingPanels(matchPositions);
          
          setTimeout(() => {
            const gridAfterRemoval = removeMatches(gridAfterGravity, matches);
            const newGridAfterGravity = applyGravity(gridAfterRemoval);
            
            setGameState(prev => {
              if (!prev) return null;
              const newScore = prev.score + calculateScore(matches.length, prev.chain + 1, prev.level);
              const newLevel = Math.min(99, Math.floor(newScore / 1000) + 1);
              const newRiseSpeed = Math.max(100, config.initialRiseSpeed - (newLevel * 50));
              
              return {
                ...prev,
                grid: newGridAfterGravity,
                score: newScore,
                chain: prev.chain + 1,
                maxChain: Math.max(prev.maxChain, prev.chain + 1),
                level: newLevel,
                riseSpeed: newRiseSpeed
              };
            });

            processChain(newGridAfterGravity, 1);
            
            setIsAnimating(false);
            setShakingPanels(new Set()); // アニメーション終了後にリセット
          }, config.chainDelay);
        }
      }, 200);
    }
  }, [gameState, isAnimating]);

  // キーボード操作の処理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState || gameState.gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          setCursor(prev => ({ ...prev, x: Math.max(0, prev.x - 1) }));
          break;
        case 'ArrowRight':
          setCursor(prev => ({ ...prev, x: Math.min(config.columns - 2, prev.x + 1) }));
          break;
        case 'ArrowUp':
          setCursor(prev => ({ ...prev, y: Math.max(0, prev.y - 1) }));
          break;
        case 'ArrowDown':
          setCursor(prev => ({ ...prev, y: Math.min(config.rows - 1, prev.y + 1) }));
          break;
        case 'f':
        case 'F':
          handleRise();
          break;
        case 'a':
        case 'A':
        case 'z':
        case 'Z':
          handlePanelSwap(cursor.x, cursor.y, cursor.x + 1, cursor.y);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, cursor, isAnimating, handleRise, handlePanelSwap]);

  // パネルのクリック処理
  const handlePanelClick = useCallback((x: number, y: number) => {
    if (gameState && gameState.gameOver) return;

    if (gameState && gameState.selectedPanel) {
      const { x: prevX, y: prevY } = gameState.selectedPanel;
      
      if (Math.abs(x - prevX) === 1 && y === prevY) {
        handlePanelSwap(prevX, prevY, x, y);
      }
      
      setGameState(prev => {
        if (!prev) return null;
        return { ...prev, selectedPanel: null };
      });
    } else {
      setGameState(prev => {
        if (!prev) return null;
        return { ...prev, selectedPanel: { x, y } };
      });
    }
  }, [gameState, handlePanelSwap]);

  // スコア表示のメモ化
  const scoreDisplay = useMemo(() => {
    if (!gameState) return null;
    return (
    <div className="flex flex-col items-center bg-gray-900 text-white p-4 rounded-lg shadow-lg">
      <div className="text-2xl font-bold">Score: {gameState.score}</div>
      <div className="text-xl">Chain: {gameState.chain}</div>
      <div className="text-xl">Level: {gameState.level}</div>
      <div className="text-xl">Max Chain: {gameState.maxChain}</div>
    </div>
    );
  }, [gameState?.score, gameState?.chain, gameState?.level, gameState?.maxChain]);

  if (!gameState) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex">
      {chainEffect && <div className="chain-effect" />}
      
      <div className="flex flex-col items-center text-white p-4">
        <div className="text-xl">操作方法</div>
        <div className="text-xl">十字キー: カーソル移動</div>
        <div className="text-xl">A/Zキー: パネル入れ替え</div>
        <div className="text-xl">Fキー: パネル上昇</div>
      </div>

      <div className="relative bg-gray-800 p-4 rounded-lg">
        <div className="grid grid-cols-6 gap-1" style={{ transform: `translateY(${-riseProgress * 48}px)` }}>
          {gameState.grid.map((row, y) =>
            row.map((panel, x) => (
              <div
                key={`${x}-${y}`}
                className={`panel ${panel ? `panel-${panel.type}` : 'bg-gray-700'} ${
                  (x === cursor.x || x === cursor.x + 1) && y === cursor.y
                    ? 'cursor-highlight'
                    : ''
                } ${isAnimating ? 'animate-pulse' : ''} ${
                  movingPanels[`${x},${y}`] ? `moving-${movingPanels[`${x},${y}`]}` : ''
                } ${
                  gameState.selectedPanel?.x === x && gameState.selectedPanel?.y === y
                    ? 'panel-selected'
                    : ''
                } ${shakingPanels.has(`${x},${y}`) ? 'animate-shake' : ''}`}
                onClick={() => handlePanelClick(x, y)}
              >
                {panel && (
                  <div className="panel-symbol">
                    {panel.type === 'red' && '♥'}
                    {panel.type === 'yellow' && '★'}
                    {panel.type === 'blue' && '●'}
                    {panel.type === 'green' && '◆'}
                    {panel.type === 'purple' && '▲'}
                  </div>
                )}
                {(x === cursor.x || x === cursor.x + 1) && y === cursor.y && (
                  <>
                    {x === cursor.x && (
                      <>
                        <div className="cursor-top" />
                        <div className="cursor-left" />
                        <div className="corner-bottom-left" />
                      </>
                    )}
                    {x === cursor.x + 1 && (
                      <>
                        <div className="corner-top-right" />
                        <div className="corner-bottom-right" />
                      </>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="ml-4">
    {scoreDisplay}
  </div>

      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="text-xl mb-4">Final Score: {gameState.score}</p>
            <p className="text-xl mb-4">Max Chain: {gameState.maxChain}</p>
            <p className="text-xl mb-4">Level: {gameState.level}</p>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              onClick={initializeGame}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelPonGame; 