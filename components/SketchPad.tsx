
import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { AspectRatio } from '../App';
import { BrushIcon, EraserIcon, UndoIcon, ClearIcon } from './icons';

interface SketchPadProps {
    aspectRatio: AspectRatio;
    setAspectRatio: (ratio: AspectRatio) => void;
}

interface Point {
    x: number;
    y: number;
}

interface Stroke {
    points: Point[];
    color: string;
    width: number;
    tool: 'brush' | 'eraser';
}

const ASPECT_RATIO_MAP: { [key in AspectRatio]: number } = {
    '1:1': 1,
    '2:3': 2 / 3,
    '3:2': 3 / 2,
};

export const SketchPad = forwardRef<{ getCanvasData: () => string | null }, SketchPadProps>(({ aspectRatio, setAspectRatio }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentPath, setCurrentPath] = useState<Stroke | null>(null);

    const [activeTool, setActiveTool] = useState<'brush' | 'eraser'>('brush');
    const [brushColor, setBrushColor] = useState('#EF4444'); // Red
    const [brushSize, setBrushSize] = useState(5);
    const [eraserSize, setEraserSize] = useState(20);

    const colors = [
        { name: 'Red', value: '#EF4444' },
        { name: 'Blue', value: '#3B82F6' },
        { name: 'Green', value: '#22C55E' },
        { name: 'White', value: '#FFFFFF' },
    ];

    const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const touch = 'touches' in e ? e.touches[0] : e;

        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        };
    };
    
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        [...strokes, currentPath].forEach(stroke => {
            if (!stroke || stroke.points.length === 0) return;
            
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            stroke.points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.stroke();
        });
        
        ctx.globalCompositeOperation = 'source-over';
    }, [strokes, currentPath]);

    React.useEffect(() => {
        draw();
    }, [draw]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const point = getCanvasCoordinates(e);
        setCurrentPath({
            points: [point],
            color: brushColor,
            width: activeTool === 'brush' ? brushSize : eraserSize,
            tool: activeTool
        });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !currentPath) return;
        const point = getCanvasCoordinates(e);
        setCurrentPath(prev => prev ? { ...prev, points: [...prev.points, point] } : null);
    };

    const handleMouseUp = () => {
        if (currentPath) {
            setStrokes(prev => [...prev, currentPath]);
        }
        setCurrentPath(null);
        setIsDrawing(false);
    };

    const handleUndo = () => {
        setStrokes(strokes.slice(0, -1));
    };

    const handleClear = () => {
        setStrokes([]);
    };

    useImperativeHandle(ref, () => ({
        getCanvasData: () => {
            const canvas = canvasRef.current;
            if (canvas) {
                // Create a temporary canvas to draw with a white background
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                if(!tempCtx) return null;
                
                tempCtx.fillStyle = '#0D1117'; // Match app background
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(canvas, 0, 0);
                
                return tempCanvas.toDataURL('image/png');
            }
            return null;
        }
    }));
    
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-4 text-blue-400 border-b border-gray-700 pb-2 flex justify-between items-center">
                3. Sketch Poses
                <div>
                    <button onClick={handleUndo} className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-md mr-2 transition-colors">Undo</button>
                    <button onClick={handleClear} className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-md transition-colors">Clear All</button>
                </div>
            </h2>
            
            <div className="bg-[#0D1117] p-2 rounded-md mb-4 border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-300">Aspect Ratio:</span>
                        {(['1:1', '2:3', '3:2'] as AspectRatio[]).map(ratio => (
                            <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-3 py-1 text-sm rounded-md transition-colors ${aspectRatio === ratio ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}>
                                {ratio}
                            </button>
                        ))}
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-300">Tools:</span>
                        {colors.map(color => (
                             <button key={color.name} onClick={() => { setBrushColor(color.value); setActiveTool('brush'); }} className={`w-7 h-7 rounded-full border-2 transition-all ${brushColor === color.value && activeTool === 'brush' ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color.value }}></button>
                        ))}
                         <button onClick={() => setActiveTool('eraser')} className={`p-1 rounded-md ${activeTool === 'eraser' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                           <EraserIcon className="w-5 h-5"/>
                         </button>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="flex items-center gap-2">
                        <BrushIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300 w-12">Brush: {brushSize}</span>
                        <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                    </div>
                     <div className="flex items-center gap-2">
                         <EraserIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300 w-12">Eraser: {eraserSize}</span>
                        <input type="range" min="1" max="100" value={eraserSize} onChange={(e) => setEraserSize(parseInt(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>
            </div>

            <div className="flex-grow w-full aspect-w-1 aspect-h-1" style={{ aspectRatio: ASPECT_RATIO_MAP[aspectRatio] }}>
                <canvas
                    ref={canvasRef}
                    width={800 * ASPECT_RATIO_MAP[aspectRatio]}
                    height={800}
                    className="bg-[#0D1117] rounded-md border border-gray-700 touch-none w-full h-full"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                />
            </div>
        </div>
    );
});
