import React, { useState, useCallback, useEffect } from 'react';

const BOARD_SIZE = 10;
type Player = 1 | 2;
type Piece = { player: Player; isKing: boolean };
type Board = (Piece | null)[][];
type Move = {
    to: { row: number; col: number };
    captures?: { row: number; col: number };
};
type Difficulty = 'easy' | 'medium' | 'hard';
type PieceSet = { p1: string; name1: string; p2: string; name2: string };

const pieceOptions: PieceSet[] = [
    { p1: '🐼', name1: 'Pandas', p2: '🦊', name2: 'Renards' },
    { p1: '🐰', name1: 'Lapins', p2: '🐻', name2: 'Ours' },
    { p1: '🐶', name1: 'Chiens', p2: '🐱', name2: 'Chats' },
];

interface CheckersGameProps {
    onBack: () => void;
}

const CheckersGame: React.FC<CheckersGameProps> = ({ onBack }) => {
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [pieceSet, setPieceSet] = useState<PieceSet>(pieceOptions[0]);
    const [board, setBoard] = useState<Board>([]);
    const [currentPlayer, setCurrentPlayer] = useState<Player>(1);
    const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
    const [validMoves, setValidMoves] = useState<Move[]>([]);
    const [winner, setWinner] = useState<Player | 'draw' | null>(null);
    const [turnMessage, setTurnMessage] = useState('');
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [lastMove, setLastMove] = useState<{ from: {row: number, col: number}, to: {row: number, col: number} } | null>(null);

    const initializeBoard = (): Board => {
        const newBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if ((row + col) % 2 !== 0) {
                    newBoard[row][col] = { player: 2, isKing: false };
                }
            }
        }
        for (let row = BOARD_SIZE - 4; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if ((row + col) % 2 !== 0) {
                    newBoard[row][col] = { player: 1, isKing: false };
                }
            }
        }
        return newBoard;
    };

    const findValidMoves = useCallback((row: number, col: number, currentBoard: Board, player: Player, forceCaptures: boolean): Move[] => {
        const piece = currentBoard[row]?.[col];
        if (!piece || piece.player !== player) return [];

        const moves: Move[] = [];
        const directions = piece.isKing
            ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
            : player === 1
                ? [[-1, -1], [-1, 1]]
                : [[1, -1], [1, 1]];

        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;

            // Simple move for kings
            if (piece.isKing) {
                while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                    if (currentBoard[r][c] === null) {
                        if (!forceCaptures) moves.push({ to: { row: r, col: c } });
                    } else {
                        // Potential capture
                        if (currentBoard[r][c]?.player !== player) {
                            const jumpR = r + dr;
                            const jumpC = c + dc;
                            if (jumpR >= 0 && jumpR < BOARD_SIZE && jumpC >= 0 && jumpC < BOARD_SIZE && currentBoard[jumpR][jumpC] === null) {
                                // Found a capture, stop looking for simple moves for this king
                                moves.push({ to: { row: jumpR, col: c + dc }, captures: { row: r, col: c } });
                            }
                        }
                        break; // Stop after finding any piece
                    }
                    r += dr;
                    c += dc;
                }
            } else { // Pawn moves
                // Simple move
                if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && currentBoard[r][c] === null) {
                    if (!forceCaptures) moves.push({ to: { row: r, col: c } });
                }
                // Capture move
                else if (currentBoard[r]?.[c]?.player !== player) {
                    const jumpR = r + dr;
                    const jumpC = c + dc;
                    if (jumpR >= 0 && jumpR < BOARD_SIZE && jumpC >= 0 && jumpC < BOARD_SIZE && currentBoard[jumpR][jumpC] === null) {
                        moves.push({ to: { row: jumpR, col: jumpC }, captures: { row: r, col: c } });
                    }
                }
            }
        }
        return moves;
    }, []);

    const getAllPlayerMoves = useCallback((player: Player, currentBoard: Board, pieceToMove: {row: number, col: number} | null = null): { piece: { row: number, col: number }, moves: Move[] }[] => {
        const allMoves: { piece: { row: number, col: number }, moves: Move[] }[] = [];
        
        if (pieceToMove) {
            const moves = findValidMoves(pieceToMove.row, pieceToMove.col, currentBoard, player, true).filter(m => m.captures);
            if(moves.length > 0) {
                 allMoves.push({ piece: pieceToMove, moves });
            }
            return allMoves;
        }

        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (currentBoard[r][c]?.player === player) {
                    const moves = findValidMoves(r, c, currentBoard, player, false);
                    if (moves.length > 0) {
                        allMoves.push({ piece: { row: r, col: c }, moves });
                    }
                }
            }
        }
        return allMoves;
    }, [findValidMoves]);

    const handleSquareClick = useCallback((row: number, col: number) => {
        if (winner || isAiThinking) return;
    
        // A piece is already selected
        if (selectedPiece) {
            // Case 1: Clicked on the selected piece again -> DESELECT
            if (selectedPiece.row === row && selectedPiece.col === col) {
                setSelectedPiece(null);
                setValidMoves([]);
                return;
            }
    
            // Case 2: Clicked a valid move -> EXECUTE MOVE
            const move = validMoves.find(m => m.to.row === row && m.to.col === col);
            if (move) {
                const newBoard = board.map(r => r.slice());
                const piece = newBoard[selectedPiece.row][selectedPiece.col]!;
                newBoard[selectedPiece.row][selectedPiece.col] = null;
                newBoard[row][col] = piece;
    
                // Promote to king if it reaches the last row
                if (!piece.isKing && ((piece.player === 1 && row === 0) || (piece.player === 2 && row === BOARD_SIZE - 1))) {
                    piece.isKing = true;
                }
    
                if (move.captures) {
                    newBoard[move.captures.row][move.captures.col] = null;
                }
    
                setBoard(newBoard);
                setLastMove({ from: selectedPiece, to: { row, col } });
    
                const canMultiJump = move.captures && findValidMoves(row, col, newBoard, currentPlayer, true).some(m => m.captures);
                
                if (canMultiJump) {
                    setSelectedPiece({ row, col });
                    setValidMoves(findValidMoves(row, col, newBoard, currentPlayer, true).filter(m => m.captures));
                    return; // Player's turn continues
                } else {
                    setSelectedPiece(null);
                    setValidMoves([]);
                    setCurrentPlayer(p => p === 1 ? 2 : 1);
                }
            } 
            // Case 3: Clicked one of my other pieces -> SWITCH SELECTION
            else if (board[row][col]?.player === currentPlayer) {
                const allPlayerMoves = getAllPlayerMoves(currentPlayer, board);
                const captureMoves = allPlayerMoves.flatMap(p => p.moves.filter(m => m.captures));
                
                let pieceMoves: Move[];
                if (captureMoves.length > 0) {
                    const movesForThisPiece = findValidMoves(row, col, board, currentPlayer, true).filter(m => m.captures);
                    if (movesForThisPiece.length > 0) {
                        setSelectedPiece({ row, col });
                        setValidMoves(movesForThisPiece);
                    }
                } else {
                    const movesForThisPiece = findValidMoves(row, col, board, currentPlayer, false);
                    if (movesForThisPiece.length > 0) {
                        setSelectedPiece({ row, col });
                        setValidMoves(movesForThisPiece);
                    } else {
                         setSelectedPiece(null);
                         setValidMoves([]);
                    }
                }
            } 
            // Case 4: Clicked an invalid square (empty or opponent) -> DESELECT
            else {
                setSelectedPiece(null);
                setValidMoves([]);
            }
        } 
        // Case 5: No piece is selected, so SELECT
        else {
            if (board[row][col]?.player === currentPlayer) {
                const allPlayerMoves = getAllPlayerMoves(currentPlayer, board);
                const captureMoves = allPlayerMoves.flatMap(p => p.moves.filter(m => m.captures));
    
                let pieceMoves: Move[];
                if (captureMoves.length > 0) {
                    pieceMoves = findValidMoves(row, col, board, currentPlayer, true).filter(m => m.captures);
                } else {
                    pieceMoves = findValidMoves(row, col, board, currentPlayer, false);
                }
    
                if (pieceMoves.length > 0) {
                    setSelectedPiece({ row, col });
                    setValidMoves(pieceMoves);
                }
            }
        }
    }, [board, currentPlayer, isAiThinking, selectedPiece, validMoves, winner, findValidMoves, getAllPlayerMoves]);
    
    const triggerAiTurn = useCallback(async () => {
        if (winner || currentPlayer !== 2) return;
    
        setIsAiThinking(true);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate thinking
    
        let currentBoard = board.map(r => r.slice());
        let pieceForMultiJump: { row: number, col: number } | null = null;
    
        while (true) {
            const allAiMoves = getAllPlayerMoves(2, currentBoard, pieceForMultiJump);
            const captureMoves = allAiMoves.filter(p => p.moves.some(m => m.captures));
            const possibleMoves = captureMoves.length > 0 ? captureMoves : allAiMoves;
    
            if (possibleMoves.length === 0) {
                break; // No more moves, AI turn ends
            }
    
            let bestMove: { piece: { row: number, col: number }, move: Move };
            
            // AI Logic to select a move
            if (difficulty === 'easy') {
                const randomPiece = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                const randomMove = randomPiece.moves[Math.floor(Math.random() * randomPiece.moves.length)];
                bestMove = { piece: randomPiece.piece, move: randomMove };
            } else if (difficulty === 'medium') {
                const movesWithCaptures = possibleMoves.flatMap(p => p.moves.filter(m => m.captures).map(m => ({ piece: p.piece, move: m })));
                if (movesWithCaptures.length > 0) {
                    bestMove = movesWithCaptures[Math.floor(Math.random() * movesWithCaptures.length)];
                } else {
                     const randomPiece = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                     const randomMove = randomPiece.moves[Math.floor(Math.random() * randomPiece.moves.length)];
                     bestMove = { piece: randomPiece.piece, move: randomMove };
                }
            } else { // hard
                let maxScore = -Infinity;
                let candidateMoves: { piece: { row: number; col: number; }; move: Move; }[] = [];
                for (const { piece, moves } of possibleMoves) {
                    for (const move of moves) {
                        const nextBoard = currentBoard.map(r => r.slice());
                        const p = nextBoard[piece.row][piece.col];
                        nextBoard[piece.row][piece.col] = null;
                        nextBoard[move.to.row][move.to.col] = p;
                        if(move.captures) nextBoard[move.captures.row][move.captures.col] = null;
                        
                        let score = 0;
                        for(let r=0; r<BOARD_SIZE; r++) for(let c=0; c<BOARD_SIZE; c++) {
                            if(nextBoard[r][c]?.player === 2) score += nextBoard[r][c]?.isKing ? 2 : 1;
                            if(nextBoard[r][c]?.player === 1) score -= nextBoard[r][c]?.isKing ? 2 : 1;
                        }
                        if(move.captures) score += 1.5;
                        if(p && !p.isKing && move.to.row === BOARD_SIZE - 1) score += 1;

                        if (score > maxScore) {
                            maxScore = score;
                            candidateMoves = [{ piece, move }];
                        } else if (score === maxScore) {
                            candidateMoves.push({ piece, move });
                        }
                    }
                }
                bestMove = candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
            }
    
            // Execute the chosen move on the temporary board
            const piece = currentBoard[bestMove.piece.row][bestMove.piece.col]!;
            currentBoard[bestMove.piece.row][bestMove.piece.col] = null;
            currentBoard[bestMove.move.to.row][bestMove.move.to.col] = piece;

            if (!piece.isKing && bestMove.move.to.row === BOARD_SIZE - 1) {
                piece.isKing = true;
            }
            if (bestMove.move.captures) {
                currentBoard[bestMove.move.captures.row][bestMove.move.captures.col] = null;
            }
            
            // Update UI
            setBoard(currentBoard);
            setLastMove({ from: bestMove.piece, to: bestMove.move.to });
    
            // Check for multi-jump
            const nextJumps = findValidMoves(bestMove.move.to.row, bestMove.move.to.col, currentBoard, 2, true).filter(m => m.captures);
    
            if (bestMove.move.captures && nextJumps.length > 0) {
                pieceForMultiJump = { row: bestMove.move.to.row, col: bestMove.move.to.col };
                await new Promise(resolve => setTimeout(resolve, 600)); // Pause between jumps
            } else {
                break; // End of turn
            }
        }
    
        // Finalize turn
        setCurrentPlayer(1);
        setIsAiThinking(false);
    
    }, [board, currentPlayer, difficulty, findValidMoves, getAllPlayerMoves, winner]);

    useEffect(() => {
        if (gameState === 'playing' && !winner) {
            const allPlayerMoves = getAllPlayerMoves(currentPlayer, board);
            if (allPlayerMoves.length === 0) {
                setWinner(currentPlayer === 1 ? 2 : 1);
                return;
            }

            const pieces = board.flat().filter(p => p !== null);
            if (!pieces.some(p => p.player === 1)) {
                setWinner(2);
                return;
            }
            if (!pieces.some(p => p.player === 2)) {
                setWinner(1);
                return;
            }

            if (currentPlayer === 2) {
                triggerAiTurn();
            }
        }
    }, [currentPlayer, board, gameState, winner, triggerAiTurn, getAllPlayerMoves]);

    useEffect(() => {
        if (winner) {
            setGameState('gameOver');
            let msg = '';
            if (winner === 'draw') {
                msg = "Match nul !";
            } else {
                msg = winner === 1 ? "Vous avez gagné !" : "L'IA a gagné !";
            }
            setTurnMessage(msg);
        } else {
            const playerLabel = currentPlayer === 1 ? `Votre tour (${pieceSet.name1})` : "L'IA réfléchit...";
            setTurnMessage(playerLabel);
        }
    }, [winner, currentPlayer, pieceSet]);

    useEffect(() => {
        if (currentPlayer === 1 && lastMove) {
            const timer = setTimeout(() => setLastMove(null), 700);
            return () => clearTimeout(timer);
        }
    }, [currentPlayer, lastMove]);
    
    const startGame = (diff: Difficulty) => {
        setDifficulty(diff);
        setBoard(initializeBoard());
        setCurrentPlayer(1);
        setSelectedPiece(null);
        setValidMoves([]);
        setWinner(null);
        setGameState('playing');
        setLastMove(null);
    };

    const handleReturnToMenu = () => {
        setBoard([]);
        setCurrentPlayer(1);
        setSelectedPiece(null);
        setValidMoves([]);
        setWinner(null);
        setLastMove(null);
        setIsAiThinking(false);
        setTurnMessage('');
        setGameState('menu');
    };

    const renderPiece = (piece: Piece | null) => {
        if (!piece) return null;
        const pieceEmoji = piece.player === 1 ? pieceSet.p1 : pieceSet.p2;

        return (
            <div className="relative text-4xl md:text-5xl transition-transform duration-300 transform group-hover:scale-110 flex items-center justify-center w-full h-full">
                <span className="relative z-10">{pieceEmoji}</span>
                {piece.isKing && (
                    <span 
                        className="absolute text-lg md:text-xl z-20"
                        style={{ top: '2px', right: '2px', textShadow: '0px 0px 4px rgba(255, 255, 255, 0.7)' }}
                        aria-label="Dame"
                    >
                        👑
                    </span>
                )}
            </div>
        );
    };

    if (gameState === 'menu') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl mx-auto text-center">
                <button onClick={onBack} className="text-blue-600 hover:underline mb-6 text-left w-full">&lt; Retour aux jeux</button>
                <h3 className="text-3xl font-bold text-gray-800 mb-6">Jeu de dames des animaux</h3>
                
                <div className="space-y-8">
                    <div>
                        <h4 className="text-xl font-semibold text-gray-700 mb-3">Choisissez vos pions</h4>
                        <div className="flex justify-center gap-4">
                            {pieceOptions.map(option => (
                                <button
                                    key={option.name1}
                                    onClick={() => setPieceSet(option)}
                                    className={`p-2 rounded-lg border-2 transition-all ${pieceSet.name1 === option.name1 ? 'border-blue-500 bg-blue-50 scale-110' : 'border-gray-200 hover:border-gray-400'}`}
                                >
                                    <span className="text-4xl">{option.p1}</span>
                                    <span className="text-2xl mx-1">vs</span>
                                    <span className="text-4xl">{option.p2}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xl font-semibold text-gray-700 mb-3">Choisissez la difficulté</h4>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => startGame('easy')} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">Facile</button>
                            <button onClick={() => startGame('medium')} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Moyen</button>
                            <button onClick={() => startGame('hard')} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Difficile</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    const initialPieceCount = 20;
    const player1Score = initialPieceCount - board.flat().filter(p => p?.player === 2).length;
    const player2Score = initialPieceCount - board.flat().filter(p => p?.player === 1).length;

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-grow">
                     <div className="grid grid-cols-10 border-2 border-slate-700 aspect-square">
                        {board.length > 0 && board.map((row, rIdx) =>
                            row.map((piece, cIdx) => {
                                const isDark = (rIdx + cIdx) % 2 !== 0;
                                const isSelected = selectedPiece?.row === rIdx && selectedPiece?.col === cIdx;
                                const isValidMove = validMoves.some(m => m.to.row === rIdx && m.to.col === cIdx);
                                const isLastMove = (lastMove?.from.row === rIdx && lastMove?.from.col === cIdx) || (lastMove?.to.row === rIdx && lastMove?.to.col === cIdx);

                                return (
                                    <div
                                        key={`${rIdx}-${cIdx}`}
                                        onClick={() => handleSquareClick(rIdx, cIdx)}
                                        className={`flex items-center justify-center relative group aspect-square
                                            ${isDark ? 'bg-slate-500' : 'bg-slate-200'}
                                            ${(isValidMove || (isDark && board[rIdx][cIdx]?.player === currentPlayer && !selectedPiece)) && !isAiThinking ? 'cursor-pointer' : ''}
                                        `}
                                    >
                                        {isLastMove && <div className="absolute inset-0 bg-yellow-400/50" />}
                                        {renderPiece(piece)}
                                        {isSelected && <div className="absolute inset-0 bg-blue-500/30 ring-4 ring-blue-500" />}
                                        {isValidMove && <div className="absolute w-1/3 h-1/3 bg-green-500/70 rounded-full" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="w-full md:w-72 flex-shrink-0 space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <h4 className="text-lg font-bold text-gray-800">Statut de la partie</h4>
                        <p className={`text-xl font-semibold mt-2 ${winner ? 'text-green-600' : 'text-blue-600'}`}>
                            {turnMessage}
                        </p>
                    </div>
                     <div className="bg-gray-100 p-4 rounded-lg">
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Scores</h4>
                        <div className="space-y-2">
                           <div className="flex justify-between items-center text-lg">
                               <span>{pieceSet.p1} {pieceSet.name1} (capturés):</span>
                               <span className="font-bold">{player1Score}</span>
                           </div>
                           <div className="flex justify-between items-center text-lg">
                               <span>{pieceSet.p2} {pieceSet.name2} (capturés):</span>
                               <span className="font-bold">{player2Score}</span>
                           </div>
                        </div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700">
                        <h4 className="text-lg font-bold text-gray-800 mb-2">Règles</h4>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Déplacement en diagonale avant sur les cases foncées.</li>
                            <li>Capture en sautant par-dessus un pion adverse.</li>
                            <li>Les prises sont obligatoires.</li>
                            <li>Un pion devient une "Dame" (👑) sur la dernière rangée et peut se déplacer dans toutes les diagonales.</li>
                        </ul>
                    </div>
                     <button onClick={handleReturnToMenu} className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">
                        {winner ? 'Rejouer' : 'Nouvelle partie'}
                    </button>
                    <button onClick={onBack} className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
                        Quitter le jeu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckersGame;