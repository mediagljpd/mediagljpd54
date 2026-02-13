
import React, { useState, useContext } from 'react';
import { AppContext } from '../../App';
import { AdminSubComponentProps } from './types';
import { PuzzlePieceIcon, CubeTransparentIcon, ViewGridIcon } from '../Icons';
import MemoryGame from './games/MemoryGame';
import CheckersGame from './games/CheckersGame';
import PicrossGame from './games/PicrossGame';

const DEFAULT_MEMORY_IMG = "https://i.postimg.cc/Mp8KLZhF/memory-chats.png";
const DEFAULT_CHECKERS_IMG = "https://i.postimg.cc/cJBm3HSq/dames-animaux.png";
const DEFAULT_PICROSS_IMG = "https://i.postimg.cc/FscWQ6b2/picross.png";

// Sub-component: Game Hub Panel
const RecrePanel: React.FC<AdminSubComponentProps> = ({ showNotification }) => {
    const { settings } = useContext(AppContext);
    const [activeGame, setActiveGame] = useState<string | null>(null);

    const GameCard: React.FC<{title: string, description: string, imageUrl: string, onClick: () => void}> = 
    ({title, description, imageUrl, onClick}) => (
        <div
            onClick={onClick}
            className="group bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl cursor-pointer transform hover:-translate-y-2 transition-all duration-300 w-full max-w-sm text-center"
        >
            <div className="rounded-2xl w-40 h-40 overflow-hidden mx-auto mb-6 transition-shadow duration-300 group-hover:shadow-lg">
                 <img src={imageUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-500">{description}</p>
        </div>
    );

    const renderGameSelection = () => (
        <div>
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800">C'est la récré !</h2>
                <p className="text-lg text-gray-600 mt-2">Choisissez un jeu pour vous détendre.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
                <GameCard
                    title="Memory des chats"
                    description="Testez votre mémoire avec d'adorables félins."
                    imageUrl={settings.gameMemoryImageUrl || DEFAULT_MEMORY_IMG}
                    onClick={() => setActiveGame('memory')}
                />
                <GameCard
                    title="Jeu de dames des animaux"
                    description="Un classique de la stratégie avec une touche animale."
                    imageUrl={settings.gameCheckersImageUrl || DEFAULT_CHECKERS_IMG}
                    onClick={() => setActiveGame('checkers')}
                />
                 <GameCard
                    title="Picross Pokémon"
                    description="Résolvez des grilles pour révéler des Pokémon."
                    imageUrl={settings.gamePicrossImageUrl || DEFAULT_PICROSS_IMG}
                    onClick={() => setActiveGame('picross')}
                />
            </div>
        </div>
    );
    
    const renderActiveGame = () => {
        switch (activeGame) {
            case 'memory': return <MemoryGame onBack={() => setActiveGame(null)} />;
            case 'checkers': return <CheckersGame onBack={() => setActiveGame(null)} />;
            case 'picross': return <PicrossGame onBack={() => setActiveGame(null)} />;
            default: return renderGameSelection();
        }
    };

    return (
        <div>
            {renderActiveGame()}
        </div>
    );
};

export default RecrePanel;
