import React, { useState, useCallback, useEffect } from 'react';
import { PuzzlePieceIcon } from '../../Icons';

interface MemoryCard {
  id: number;
  seed: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const shuffleArray = (array: any[]) => {
  return array.sort(() => Math.random() - 0.5);
};

interface MemoryGameProps {
    onBack: () => void;
}

const MemoryGame: React.FC<MemoryGameProps> = ({ onBack }) => {
    const [catSeeds, setCatSeeds] = useState<string[]>(['miaou', 'ronron', 'chaton', 'felin', 'patte', 'griffe', 'moustache', 'tigre']);
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [matchedSeeds, setMatchedSeeds] = useState<Set<string>>(new Set());
    const [moves, setMoves] = useState(0);
    const [isGameWon, setIsGameWon] = useState(false);
    const [isChecking, setIsChecking] = useState(false); // To prevent clicks during check

    const setupGame = useCallback(() => {
        const pairedSeeds = [...catSeeds, ...catSeeds];
        const shuffled = shuffleArray(pairedSeeds);
        const initialCards: MemoryCard[] = shuffled.map((seed, index) => ({
            id: index,
            seed: seed,
            isFlipped: false,
            isMatched: false,
        }));

        setCards(initialCards);
        setFlippedIndices([]);
        setMatchedSeeds(new Set());
        setMoves(0);
        setIsGameWon(false);
        setIsChecking(false);
    }, [catSeeds]);

    useEffect(() => {
        setupGame();
    }, [setupGame]);

    useEffect(() => {
        if (flippedIndices.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = flippedIndices;
            const firstCard = cards[firstIndex];
            const secondCard = cards[secondIndex];

            if (firstCard.seed === secondCard.seed) {
                // Match
                setMatchedSeeds(prev => new Set(prev).add(firstCard.seed));
                setCards(prevCards => prevCards.map(card => 
                    card.seed === firstCard.seed ? { ...card, isMatched: true } : card
                ));
                setFlippedIndices([]);
                setIsChecking(false);
            } else {
                // No match
                setTimeout(() => {
                    setCards(prevCards => prevCards.map((card, index) => 
                        index === firstIndex || index === secondIndex ? { ...card, isFlipped: false } : card
                    ));
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 1000);
            }
            setMoves(m => m + 1);
        }
    }, [flippedIndices, cards]);
    
    const handleGameWon = useCallback(() => {
        setIsGameWon(true);
    }, []);

    useEffect(() => {
        if (catSeeds.length > 0 && matchedSeeds.size === catSeeds.length) {
            handleGameWon();
        }
    }, [matchedSeeds, catSeeds.length, handleGameWon]);

    const handleCardClick = (index: number) => {
        if (isChecking || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length === 2) {
            return;
        }

        setCards(prevCards => prevCards.map((card, i) => 
            i === index ? { ...card, isFlipped: true } : card
        ));
        setFlippedIndices(prev => [...prev, index]);
    };

    const handleNewImages = useCallback(() => {
        setCatSeeds(Array.from({ length: 8 }, () => Math.random().toString(36).substring(7)));
    }, []);

    const handleReplay = () => {
        handleNewImages();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="text-blue-600 hover:underline">&lt; Retour aux jeux</button>
                <h3 className="text-2xl font-bold text-gray-700">Memory des chats</h3>
                <div className="flex items-center gap-4">
                    <p className="text-lg font-medium">Coups: <span className="font-bold text-blue-600">{moves}</span></p>
                    <button onClick={handleNewImages} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Nouvelles images</button>
                    <button onClick={setupGame} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Recommencer</button>
                </div>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-4 gap-4 aspect-square">
                {cards.map((card, index) => (
                    <div key={card.id} className="perspective" onClick={() => handleCardClick(index)}>
                        <div
                            className={`w-full h-full relative preserve-3d transition-transform duration-500 ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}
                        >
                            {/* Card Back */}
                            <div className="absolute w-full h-full backface-hidden rounded-lg bg-blue-400 hover:bg-blue-500 cursor-pointer flex items-center justify-center">
                                <PuzzlePieceIcon className="w-1/2 h-1/2 text-blue-100" />
                            </div>
                            {/* Card Front */}
                            <div className={`absolute w-full h-full backface-hidden rounded-lg bg-gray-100 rotate-y-180 flex items-center justify-center overflow-hidden ${card.isMatched ? 'opacity-50 ring-4 ring-green-500' : ''}`}>
                                <img
                                    src={`https://cataas.com/cat/cute?seed=${card.seed}`}
                                    alt="Cute cat"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Win Modal */}
            {isGameWon && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl text-center animate-fade-in-up">
                        <h2 className="text-4xl font-bold text-green-500 mb-4">Bravo !</h2>
                        <p className="text-lg text-gray-700 mb-6">Vous avez trouvé toutes les paires en {moves} coups.</p>
                        <button onClick={handleReplay} className="bg-green-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-600">Rejouer</button>
                    </div>
                </div>
            )}
            
            {/* Some CSS for the flip effect */}
            <style>{`
                .perspective { perspective: 1000px; }
                .preserve-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default MemoryGame;
