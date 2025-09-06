
import React, { useState, useRef, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { PromptInput } from './components/PromptInput';
import { SketchPad } from './components/SketchPad';
import { generateImage } from './services/geminiService';
import { LoadingSpinner } from './components/icons';

export type AspectRatio = '1:1' | '2:3' | '3:2';

const App: React.FC = () => {
    const [refImage1, setRefImage1] = useState<File | null>(null);
    const [refImage2, setRefImage2] = useState<File | null>(null);
    const [bgImage, setBgImage] = useState<File | null>(null);

    const [prompt1, setPrompt1] = useState('');
    const [prompt2, setPrompt2] = useState('');
    const [promptOverall, setPromptOverall] = useState('');

    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:2');
    const sketchPadRef = useRef<{ getCanvasData: () => string | null }>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        const canvasData = sketchPadRef.current?.getCanvasData();
        if (!canvasData) {
            setError('Could not get sketch data.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const result = await generateImage({
                refImage1,
                refImage2,
                bgImage,
                prompt1,
                prompt2,
                promptOverall,
                sketchImage: canvasData,
            });
            if (result) {
                setGeneratedImage(`data:image/png;base64,${result}`);
            } else {
                setError('Failed to generate image. The model did not return an image.');
            }
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [refImage1, refImage2, bgImage, prompt1, prompt2, promptOverall]);
    
    return (
        <div className="min-h-screen bg-[#0D1117] text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
                        Pose Painter AI
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">
                        Sketch poses, add references, and bring your vision to life.
                    </p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        {/* Section 1: Upload Images */}
                        <div className="bg-[#161B22] p-6 rounded-lg border border-gray-700">
                            <h2 className="text-xl font-semibold mb-4 text-blue-400 border-b border-gray-700 pb-2">1. Upload Images</h2>
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ImageUploader label="Reference Image 1 (Red Pose)" borderColor="border-red-500/50" onFileChange={setRefImage1} />
                                    <ImageUploader label="Reference Image 2 (Blue Pose)" borderColor="border-blue-500/50" onFileChange={setRefImage2} />
                                </div>
                                <ImageUploader label="Background Image (Optional)" onFileChange={setBgImage} />
                            </div>
                        </div>

                        {/* Section 2: Describe Scene */}
                        <div className="bg-[#161B22] p-6 rounded-lg border border-gray-700">
                             <h2 className="text-xl font-semibold mb-4 text-blue-400 border-b border-gray-700 pb-2">2. Describe Your Scene</h2>
                             <div className="flex flex-col gap-4">
                                <PromptInput label="Prompt for Reference Image 1 (Red Pose)" placeholder="e.g., A fantasy hero with silver armor..." value={prompt1} onChange={setPrompt1} />
                                <PromptInput label="Prompt for Reference Image 2 (Blue Pose)" placeholder="e.g., A powerful sorceress in dark robes..." value={prompt2} onChange={setPrompt2} />
                                <PromptInput label="Prompt for Overall Composition" placeholder="e.g., Standing back-to-back in a dark forest..." value={promptOverall} onChange={setPromptOverall} />
                             </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                         {/* Section 3: Sketch Poses */}
                        <div className="bg-[#161B22] p-6 rounded-lg border border-gray-700 h-full">
                            <SketchPad ref={sketchPadRef} aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} />
                        </div>
                    </div>
                </main>

                <footer className="text-center mt-8">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full max-w-md py-3 px-6 text-lg font-bold text-white rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-[#0D1117] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                    >
                        {isLoading ? <><LoadingSpinner /> Generating...</> : 'Generate Image'}
                    </button>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </footer>
            </div>
            
            {generatedImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setGeneratedImage(null)}>
                    <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700 max-w-4xl max-h-[90vh] " onClick={(e) => e.stopPropagation()}>
                        <img src={generatedImage} alt="Generated result" className="max-w-full max-h-[85vh] object-contain rounded-md" />
                         <button onClick={() => setGeneratedImage(null)} className="absolute top-4 right-4 text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-xl">&times;</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
