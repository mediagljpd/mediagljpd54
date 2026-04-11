import React, { useState, useCallback, useEffect, useRef } from 'react';
import { XIcon } from '../../Icons';

type PlayerBoardCell = { state: 'empty' | 'filled' | 'crossed' };
type PicrossGameState = 'menu' | 'playing' | 'won';
type PicrossDifficulty = 'easy' | 'medium' | 'hard';
type PicrossSize = 5 | 10 | 15;
type ColorPalette = { name: string, filled: string, empty: string, hover: string };

const COLOR_PALETTES: ColorPalette[] = [
    { name: "Classique", filled: '#333333', empty: '#FFFFFF', hover: 'bg-gray-100' },
    { name: "Forêt", filled: '#2E7D32', empty: '#F1F8E9', hover: 'bg-green-50' },
    { name: "Océan", filled: '#1565C0', empty: '#E3F2FD', hover: 'bg-blue-50' },
    { name: "Feu", filled: '#E65100', empty: '#FFF3E0', hover: 'bg-orange-50' },
    { name: "Électrique", filled: '#FBC02D', empty: '#FFFDE7', hover: 'bg-yellow-50' },
    { name: "Psy", filled: '#7B1FA2', empty: '#F3E5F5', hover: 'bg-purple-50' }
];

const PICROSS_PATTERNS: Record<string, Record<string, Record<string, number[][]>>> = {
    '5': {
        'easy': {
            'Pokéball': [[0,1,1,1,0],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,0,1],[0,1,1,1,0]],
        },
        'medium': {
            'Voltorbe': [[0,1,1,1,0],[1,1,1,1,1],[1,0,1,0,1],[1,1,1,1,1],[0,1,1,1,0]],
        },
        'hard': {
            'Superball': [[0,1,1,1,0],[1,1,0,1,1],[1,0,1,0,1],[1,1,0,1,1],[0,1,1,1,0]],
        },
    },
    '10': {
        'easy': {
            'Pikachu': [[0,0,1,0,0,0,0,1,0,0],[0,1,1,1,0,0,1,1,1,0],[1,1,0,1,0,0,1,0,1,1],[1,1,0,1,1,1,1,0,1,1],[1,0,1,0,0,0,0,1,0,1],[0,1,0,1,1,1,1,0,1,0],[0,0,1,0,0,0,0,1,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,1,1,0,0,0,0]],
        },
        'medium': {
            'Bulbizarre': [[0,0,0,1,1,0,0,0,0,0],[0,0,1,1,1,1,0,0,0,0],[0,1,1,1,1,1,1,0,0,0],[1,1,1,1,1,1,1,1,0,0],[0,1,0,1,1,0,1,1,1,0],[0,0,1,1,1,1,1,0,1,0],[0,0,1,0,1,1,0,1,0,0],[0,1,0,0,1,1,0,1,0,0],[0,1,0,0,1,0,0,1,0,0],[0,0,0,0,1,0,0,1,0,0]],
        },
        'hard': {
            'Ectoplasma': [[0,1,0,0,0,0,0,0,1,0],[1,1,1,0,1,1,0,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,1,0,1,1,0,1,0,0],[0,0,1,0,1,1,0,1,0,0],[0,1,1,1,0,0,1,1,1,0],[0,1,0,1,0,0,1,0,1,0],[0,0,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,1,1,0,0,0,0]],
        }
    },
    '15': {
        'easy': {
            'Ronflex': [[0,0,0,0,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,1,1,0,0,0,0,0,1,1,0,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,1,0,0],[0,1,0,0,1,0,0,0,0,1,0,0,0,1,0],[0,1,0,0,1,0,0,0,0,1,0,0,0,1,0],[1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],[1,0,0,0,1,1,1,1,1,1,1,0,0,0,1],[1,0,0,1,0,0,0,0,0,0,1,0,0,0,1],[1,0,1,0,0,0,0,0,0,0,0,1,0,0,1],[1,0,1,0,0,0,0,0,0,0,0,1,0,0,1],[0,1,0,1,1,1,1,1,1,1,1,0,1,0,0],[0,1,0,0,1,1,1,1,1,1,1,0,1,0,0],[0,0,1,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,0,0,0,0]],
        },
        'medium': {
            'Salamèche': [[0,0,0,0,0,0,0,1,1,0,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],[0,0,0,0,0,1,1,0,0,0,0,0,0,0,0],[0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,1,1,0,1,1,0,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,1,0,1,1,1,1,1,1,0,1,0,0,0],[0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0],[0,0,0,0,1,1,1,0,1,1,1,0,0,0,0],[0,0,0,0,0,1,1,0,1,1,0,0,0,0,0],[0,0,0,0,0,1,1,0,1,1,0,0,0,0,0],[0,0,0,0,0,0,1,0,0,1,0,0,0,0,0]],
        },
        'hard': {
            'Mewtwo': [[0,0,0,0,0,0,0,1,1,0,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,0,0,0,0,0],[0,0,0,1,1,0,1,1,1,0,1,1,0,0,0],[0,0,1,1,1,0,1,1,1,0,1,1,1,0,0],[0,0,0,1,1,1,1,1,1,1,1,1,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,0,0,0,0,0],[0,0,0,0,0,0,1,1,1,1,0,0,0,1,1],[0,0,0,0,0,0,1,1,1,1,0,1,1,1,1],[0,0,0,0,0,0,1,1,1,1,1,1,1,0,0],[0,0,0,0,0,0,1,1,1,1,1,0,0,0,0],[0,0,0,0,0,1,1,0,0,1,1,0,0,0,0],[0,0,0,0,1,1,0,0,0,0,1,1,0,0,0],[0,0,0,1,1,0,0,0,0,0,0,1,1,0,0]],
        }
    }
};

const POKEMON_COLOR_MAP: Record<string, string> = {
    'Pokéball': 'Feu',
    'Voltorbe': 'Feu',
    'Superball': 'Océan',
    'Pikachu': 'Électrique',
    'Bulbizarre': 'Forêt',
    'Ectoplasma': 'Psy',
    'Ronflex': 'Océan',
    'Salamèche': 'Feu',
    'Mewtwo': 'Psy'
};

interface PicrossGameProps {
    onBack: () => void;
}

const PicrossGame: React.FC<PicrossGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<PicrossGameState>('menu');
    const [size, setSize] = useState<PicrossSize>(10);
    const [difficulty, setDifficulty] = useState<PicrossDifficulty>('medium');
    const [colorPalette, setColorPalette] = useState<ColorPalette>(COLOR_PALETTES[0]);
    const [solution, setSolution] = useState<number[][]>([]);
    const [patternName, setPatternName] = useState('');
    const [playerBoard, setPlayerBoard] = useState<PlayerBoardCell[][]>([]);
    const [rowClues, setRowClues] = useState<number[][]>([]);
    const [colClues, setColClues] = useState<number[][]>([]);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<number | null>(null);
    const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    
    // States for drag-and-drop interaction
    const [isDragging, setIsDragging] = useState(false);
    const [dragAction, setDragAction] = useState<'filled' | 'crossed' | 'empty' | null>(null);

    const generateClues = useCallback((board: number[][]): { rowClues: number[][], colClues: number[][] } => {
        const boardSize = board.length;
        const rClues: number[][] = [];
        const cClues: number[][] = [];

        // Row clues
        for (let r = 0; r < boardSize; r++) {
            const row = board[r];
            const clues: number[] = [];
            let count = 0;
            for (let c = 0; c < boardSize; c++) {
                if (row[c] === 1) count++;
                else {
                    if (count > 0) clues.push(count);
                    count = 0;
                }
            }
            if (count > 0) clues.push(count);
            if (clues.length === 0) clues.push(0);
            rClues.push(clues);
        }

        // Column clues
        for (let c = 0; c < boardSize; c++) {
            const clues: number[] = [];
            let count = 0;
            for (let r = 0; r < boardSize; r++) {
                if (board[r][c] === 1) count++;
                else {
                    if (count > 0) clues.push(count);
                    count = 0;
                }
            }
            if (count > 0) clues.push(count);
            if (clues.length === 0) clues.push(0);
            cClues.push(clues);
        }
        return { rowClues: rClues, colClues: cClues };
    }, []);

    const checkWinCondition = useCallback(() => {
        if (!solution.length || !playerBoard.length) return false;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const isSolutionFilled = solution[r][c] === 1;
                const isPlayerFilled = playerBoard[r][c].state === 'filled';
                if (isSolutionFilled !== isPlayerFilled) return false;
            }
        }
        return true;
    }, [playerBoard, solution, size]);
    
    useEffect(() => {
      if (gameState === 'playing' && timerRef.current === null) {
        timerRef.current = window.setInterval(() => setTimer(t => t + 1), 1000);
      } else if (gameState !== 'playing' && timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }, [gameState]);

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsDragging(false);
            setDragAction(null);
        };
        if (gameState === 'playing') {
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [gameState]);


    const handleStartGame = () => {
        const patternsOfSizeAndDifficulty = PICROSS_PATTERNS[size.toString()][difficulty];
        const availablePatternNames = Object.keys(patternsOfSizeAndDifficulty);
        const randomPatternName = availablePatternNames[Math.floor(Math.random() * availablePatternNames.length)];
        const pattern = patternsOfSizeAndDifficulty[randomPatternName];
        
        setPatternName(randomPatternName);
        const colorName = POKEMON_COLOR_MAP[randomPatternName] || 'Classique';
        const newPalette = COLOR_PALETTES.find(p => p.name === colorName) || COLOR_PALETTES[0];
        setColorPalette(newPalette);

        setSolution(pattern);
        setPlayerBoard(
            Array.from({ length: size }, () => 
                Array.from({ length: size }, () => ({ state: 'empty' }))
            )
        );
        const { rowClues, colClues } = generateClues(pattern);
        setRowClues(rowClues);
        setColClues(colClues);
        setTimer(0);
        setValidationMessage(null);
        setGameState('playing');
    };

    const applyActionToCell = useCallback((row: number, col: number, action: 'filled' | 'crossed' | 'empty') => {
        setPlayerBoard(prevBoard => {
            if (prevBoard[row]?.[col]?.state === action) return prevBoard;
            const newBoard = prevBoard.map(r => r.slice());
            newBoard[row][col] = { state: action };
            return newBoard;
        });
    }, []);
    
    const handleCellInteractionStart = (row: number, col: number, event: React.MouseEvent) => {
        event.preventDefault();
        setIsDragging(true);

        const currentCellState = playerBoard[row][col].state;
        let newAction: 'filled' | 'crossed' | 'empty' | null = null;
        
        if (event.button === 0) { // Left click
            newAction = currentCellState === 'filled' ? 'empty' : 'filled';
        } else if (event.button === 2) { // Right click
            newAction = currentCellState === 'crossed' ? 'empty' : 'crossed';
        }

        if (newAction) {
            setDragAction(newAction);
            applyActionToCell(row, col, newAction);
        }
    };

    const handleCellInteractionMove = (row: number, col: number) => {
        if (!isDragging || !dragAction) return;
        applyActionToCell(row, col, dragAction);
    };

    const handleValidate = () => {
        if (checkWinCondition()) {
            setGameState('won');
        } else {
            setValidationMessage('Il y a des erreurs dans votre grille. Essayez encore !');
            setTimeout(() => setValidationMessage(null), 3000);
        }
    };

    const handleShowSolution = () => {
        if (window.confirm("Êtes-vous sûr de vouloir voir la solution ? Votre partie sera terminée.")) {
            setPlayerBoard(solution.map(row => row.map(cellValue => ({
                state: cellValue === 1 ? 'filled' : 'empty'
            }))));
            setGameState('won');
        }
    };

    const renderMenu = () => (
        <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-800 mb-6">Configuration du Picross Pokémon</h3>
            <div className="max-w-xl mx-auto space-y-6">
                 <div>
                    <label className="font-semibold text-lg">Taille de la grille</label>
                    <div className="flex justify-center gap-4 mt-2">
                        {[5, 10, 15].map(s => (
                            <button key={s} onClick={() => setSize(s as PicrossSize)} className={`px-4 py-2 text-lg rounded-lg ${size === s ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{s}x{s}</button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="font-semibold text-lg">Difficulté</label>
                    <div className="flex justify-center gap-4 mt-2">
                        {(['easy', 'medium', 'hard'] as PicrossDifficulty[]).map(d => (
                             <button key={d} onClick={() => setDifficulty(d)} className={`px-4 py-2 text-lg rounded-lg capitalize ${difficulty === d ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{d === 'easy' ? 'Facile' : d === 'medium' ? 'Moyen' : 'Difficile'}</button>
                        ))}
                    </div>
                </div>
                <button onClick={handleStartGame} className="w-full bg-green-500 text-white font-bold py-3 text-xl rounded-lg hover:bg-green-600">Jouer</button>
            </div>
            <button onClick={onBack} className="text-blue-600 hover:underline mt-8">&lt; Retour aux jeux</button>
        </div>
    );
    
    const RulesPanel = () => (
      <div className="w-64 flex-shrink-0 bg-gray-50 p-4 rounded-lg border self-start">
        <h4 className="font-bold text-lg mb-2">Comment jouer ?</h4>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Le but est de noircir les cases pour révéler une image cachée.</li>
          <li>Les nombres indiquent des séries de cases noires consécutives sur cette ligne ou colonne.</li>
          <li>Les séries de nombres sont séparées par au moins une case vide.</li>
          <li><strong>Clic gauche</strong> pour remplir une case.</li>
          <li><strong>Clic droit</strong> pour marquer d'une croix.</li>
          <li>Vous pouvez <strong>maintenir le clic</strong> pour interagir avec plusieurs cases à la suite.</li>
        </ul>
      </div>
    );

    const renderGame = () => {
        const maxColClues = Math.max(1, ...colClues.map(c => c.length));
        const maxRowClues = Math.max(1, ...rowClues.map(r => r.length));
        
        const cellSize = size === 15 ? 32 : 40; // in pixels
        const clueFontSize = size === 15 ? 'text-xs' : 'text-sm';
        const colClueContainerHeight = maxColClues * (size === 15 ? 16 : 20);
        const rowClueContainerWidth = maxRowClues * (size === 15 ? 10 : 12);

        return (
            <div className="flex flex-col items-center">
                 <div className="flex justify-between items-center mb-4 flex-wrap gap-4 w-full">
                    <button onClick={() => setGameState('menu')} className="text-blue-600 hover:underline">&lt; Nouveau jeu</button>
                    <div className="text-sm text-center bg-gray-100 px-3 py-1 rounded-lg">
                        <p><strong>Clic gauche :</strong> Remplir / Vider | <strong>Clic droit :</strong> Marquer X / Effacer</p>
                    </div>
                    <div className="text-lg">
                        <span>Temps: <span className="font-bold">{new Date(timer * 1000).toISOString().substr(14, 5)}</span></span>
                    </div>
                </div>

                <div className="flex justify-center items-center gap-4 my-4">
                    <button onClick={handleValidate} className="px-4 py-2 rounded-lg text-lg font-medium bg-green-500 text-white hover:bg-green-600 transition-colors">Valider ma grille</button>
                    <button onClick={handleShowSolution} className="px-4 py-2 rounded-lg text-lg font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition-colors">Voir la solution</button>
                </div>
                {validationMessage && <p className="text-center text-red-500 font-semibold mb-4 animate-pulse">{validationMessage}</p>}
                
                <div className="flex justify-center items-start gap-8 mt-4">
                    <div
                        className="grid border-r border-b border-gray-400"
                        style={{
                            gridTemplateColumns: `${rowClueContainerWidth}px minmax(0, 1fr)`,
                            gridTemplateRows: `${colClueContainerHeight}px minmax(0, 1fr)`,
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                        onMouseLeave={() => setHoveredCell(null)}
                    >
                        {/* Top-left empty space */}
                        <div className="border-l border-t border-gray-400" />
                        
                        {/* Column clues */}
                        <div className="flex border-t border-gray-400">
                            {colClues.map((clue, c) => (
                                <div key={c} className={`flex flex-col items-center justify-end p-1 border-l border-gray-300 font-bold ${clueFontSize} ${ c > 0 && c % 5 === 4 && c < size-1 ? 'border-r-2 border-gray-400' : ''}`} style={{width: `${cellSize}px`}}>
                                    {clue.map((item, i) => <div key={i}>{item === 0 ? '' : item}</div>)}
                                </div>
                            ))}
                        </div>

                        {/* Row clues */}
                        <div className="flex flex-col border-l border-gray-400">
                            {rowClues.map((clue, r) => (
                                <div key={r} className={`flex items-center justify-end p-1 border-t border-gray-300 font-bold ${clueFontSize} ${ r > 0 && r % 5 === 4 && r < size-1 ? 'border-b-2 border-gray-400' : ''}`} style={{height: `${cellSize}px`}}>
                                    {clue.map((item, i) => <div key={i} className="ml-1">{item === 0 ? '' : item}</div>)}
                                </div>
                            ))}
                        </div>
                      
                        {/* The actual grid */}
                        <div style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} className="grid">
                            {playerBoard.map((row, r) => row.map((cell, c) => {
                                 const isHovered = hoveredCell && (hoveredCell.row === r || hoveredCell.col === c);
                                 const borderTop = r > 0 && r % 5 === 0 ? 'border-t-2 border-gray-400' : 'border-t border-gray-300';
                                 const borderLeft = c > 0 && c % 5 === 0 ? 'border-l-2 border-gray-400' : 'border-l border-gray-300';
                                 const hoverClass = isHovered ? colorPalette.hover : '';
                                 const cellBg = cell.state === 'filled' ? colorPalette.filled : colorPalette.empty;
                                 
                                 return(
                                    <div key={`${r}-${c}`}
                                        onMouseDown={(e) => handleCellInteractionStart(r, c, e)}
                                        onMouseEnter={() => { handleCellInteractionMove(r, c); setHoveredCell({row: r, col: c}); }}
                                        className={`flex items-center justify-center cursor-pointer ${borderTop} ${borderLeft} ${hoverClass}`}
                                        style={{backgroundColor: cellBg, width: `${cellSize}px`, height: `${cellSize}px`}}>
                                            {cell.state === 'crossed' && <XIcon className="w-full h-full text-gray-400 p-1" />}
                                    </div>
                                 )
                            }))}
                        </div>
                    </div>

                    <RulesPanel />
                </div>
            </div>
        );
    };

    const renderWinScreen = () => {
        return (
             <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setGameState('menu')}>
                <div className="bg-white p-8 rounded-lg shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-4xl font-bold text-green-500 mb-2">Bravo !</h2>
                    <p className="text-xl text-gray-700 mb-4">Vous avez révélé un <strong className="text-indigo-600">{patternName}</strong> !</p>
                    <div className="inline-grid border-gray-400 border-2 mb-6" style={{gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`}}>
                        {playerBoard.map((row, r) => row.map((cell, c) => (
                             <div key={`${r}-${c}`} className="w-8 h-8" style={{backgroundColor: cell.state === 'filled' ? colorPalette.filled : colorPalette.empty}} />
                        )))}
                    </div>
                    <p>Temps: {new Date(timer * 1000).toISOString().substr(14, 5)}</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <button onClick={onBack} className="bg-gray-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-gray-600">Retour aux jeux</button>
                        <button onClick={() => setGameState('menu')} className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-600">Jouer à nouveau</button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-7xl mx-auto">
            {gameState === 'menu' && renderMenu()}
            {gameState === 'playing' && renderGame()}
            {gameState === 'won' && renderGame()}
            {gameState === 'won' && renderWinScreen()}
        </div>
    );
};

export default PicrossGame;
