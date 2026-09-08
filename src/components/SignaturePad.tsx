import { useEffect, useRef } from "react";
import { Eraser } from "lucide-react";

export default function SignaturePad({ value, onChange, disabled = false }: { value?: string; onChange: (dataUrl:string)=>void; disabled?:boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (value?.startsWith("data:image/png")) {
      const img = new Image();
      img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height); };
      img.src = value;
    }
  }, []);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x:(event.clientX-rect.left)*(canvas.width/rect.width), y:(event.clientY-rect.top)*(canvas.height/rect.height) };
  }
  function down(event:React.PointerEvent<HTMLCanvasElement>){if(disabled)return;drawing.current=true;event.currentTarget.setPointerCapture(event.pointerId);const ctx=canvasRef.current?.getContext("2d");if(!ctx)return;const p=point(event);ctx.beginPath();ctx.moveTo(p.x,p.y);}
  function move(event:React.PointerEvent<HTMLCanvasElement>){if(disabled||!drawing.current)return;const ctx=canvasRef.current?.getContext("2d");if(!ctx)return;const p=point(event);ctx.lineTo(p.x,p.y);ctx.stroke();}
  function up(){if(disabled)return;drawing.current=false;const canvas=canvasRef.current;if(canvas)onChange(canvas.toDataURL("image/png"));}
  function clear(){const canvas=canvasRef.current;const ctx=canvas?.getContext("2d");if(canvas&&ctx)ctx.clearRect(0,0,canvas.width,canvas.height);onChange("");}

  return <div>
    <canvas ref={canvasRef} width={700} height={180} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className={`h-36 w-full touch-none rounded-xl border border-slate-300 bg-white ${disabled?"opacity-60":"cursor-crosshair"}`} />
    {!disabled ? <button type="button" onClick={clear} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"><Eraser size={14}/> Wissen</button> : null}
  </div>;
}
