import { AlbumBook } from '../types';

export function generateSingleFileHTML(album: AlbumBook): string {
  const albumJson = JSON.stringify(album);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${album.title || '3D Memory Photo Album'}</title>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Cinzel:wght@400;600;700&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@500;700&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- React, ReactDOM, Babel for single file in-browser compilation -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      background: #0c0a09;
      color: #f5f5f4;
      overflow-x: hidden;
    }
    .perspective-1500 {
      perspective: 1500px;
    }
    .transform-style-3d {
      transform-style: preserve-3d;
    }
    .backface-hidden {
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    }
    .font-caveat { font-family: 'Caveat', cursive; }
    .font-cinzel { font-family: 'Cinzel', serif; }
    .font-courier { font-family: 'Courier Prime', monospace; }
    .font-dancing { font-family: 'Dancing Script', cursive; }
    .font-playfair { font-family: 'Playfair Display', serif; }
    .font-inter { font-family: 'Inter', sans-serif; }

    /* Paper background textures */
    .bg-parchment {
      background-color: #fdfbf7;
      background-image: radial-gradient(#d6cbb8 0.75px, transparent 0.75px), radial-gradient(#d6cbb8 0.75px, #fdfbf7 0.75px);
      background-size: 30px 30px;
      background-position: 0 0, 15px 15px;
    }
    .bg-cream {
      background-color: #fbf9f1;
    }
    .bg-linen {
      background-color: #f7f4ed;
      background-image: linear-gradient(90deg, rgba(200, 190, 175, 0.15) 1px, transparent 1px), linear-gradient(rgba(200, 190, 175, 0.15) 1px, transparent 1px);
      background-size: 16px 16px;
    }
    .bg-kraft {
      background-color: #e8ded2;
      background-image: radial-gradient(#bfb19e 0.6px, transparent 0.6px);
      background-size: 8px 8px;
    }
    .bg-grid {
      background-color: #fcfbf9;
      background-image: linear-gradient(to right, #ece5da 1px, transparent 1px), linear-gradient(to bottom, #ece5da 1px, transparent 1px);
      background-size: 20px 20px;
    }
    .shadow-book {
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 0, 0, 0.5);
    }
    .spine-gradient {
      background: linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.15) 30%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.4) 100%);
    }
  </style>
</head>
<body class="bg-stone-950 text-stone-100 min-h-screen">
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    const initialAlbumData = ${albumJson};

    // Sound FX helper
    const playAudioBeep = (freq = 400, duration = 0.08) => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    };

    function App() {
      const [album, setAlbum] = useState(() => {
        const saved = localStorage.getItem('standalone_3d_photo_album');
        if (saved) {
          try { return JSON.parse(saved); } catch(e){}
        }
        return initialAlbumData;
      });

      const [currentSpread, setCurrentSpread] = useState(0); // 0 = cover
      const [isFlipping, setIsFlipping] = useState(false);
      const totalPages = album.pages.length;
      const totalSpreads = Math.ceil(totalPages / 2);

      useEffect(() => {
        localStorage.setItem('standalone_3d_photo_album', JSON.stringify(album));
      }, [album]);

      const handleFlipNext = () => {
        if (currentSpread < totalSpreads && !isFlipping) {
          playAudioBeep(320, 0.15);
          setIsFlipping(true);
          setTimeout(() => {
            setCurrentSpread(prev => prev + 1);
            setIsFlipping(false);
          }, 350);
        }
      };

      const handleFlipPrev = () => {
        if (currentSpread > 0 && !isFlipping) {
          playAudioBeep(380, 0.15);
          setIsFlipping(true);
          setTimeout(() => {
            setCurrentSpread(prev => prev - 1);
            setIsFlipping(false);
          }, 350);
        }
      };

      const handlePhotoUpload = (pageId, photoIndex, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          setAlbum(prev => {
            const nextPages = prev.pages.map(p => {
              if (p.id === pageId) {
                const nextPhotos = [...p.photos];
                if (nextPhotos[photoIndex]) {
                  nextPhotos[photoIndex] = { ...nextPhotos[photoIndex], url: base64 };
                }
                return { ...p, photos: nextPhotos };
              }
              return p;
            });
            return { ...prev, pages: nextPages };
          });
          playAudioBeep(600, 0.1);
        };
        reader.readAsDataURL(file);
      };

      const handleTextChange = (pageId, field, val) => {
        setAlbum(prev => ({
          ...prev,
          pages: prev.pages.map(p => p.id === pageId ? { ...p, [field]: val } : p)
        }));
      };

      const handleCaptionChange = (pageId, photoIndex, val) => {
        setAlbum(prev => ({
          ...prev,
          pages: prev.pages.map(p => {
            if (p.id === pageId) {
              const nextPhotos = [...p.photos];
              if (nextPhotos[photoIndex]) {
                nextPhotos[photoIndex] = { ...nextPhotos[photoIndex], caption: val };
              }
              return { ...p, photos: nextPhotos };
            }
            return p;
          })
        }));
      };

      const handleAddPage = () => {
        const newPageNum = album.pages.length + 1;
        const newPage = {
          id: 'page-' + Date.now(),
          pageNumber: newPageNum,
          title: 'Memory #' + newPageNum,
          dateOrLocation: 'New Journey',
          story: 'Write your story and memories here...',
          paperTexture: 'parchment',
          fontStyle: 'playfair',
          layout: 'polaroid-duo',
          photos: [
            {
              id: 'ph-new-1',
              url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
              caption: 'Special moments',
              frameStyle: 'polaroid',
              filter: 'warm',
              rotation: -2
            },
            {
              id: 'ph-new-2',
              url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
              caption: 'Unforgettable smiles',
              frameStyle: 'polaroid',
              filter: 'warm',
              rotation: 2
            }
          ],
          stickers: [
            { id: 'st-1', type: 'sparkle', x: 80, y: 15, rotation: 10, scale: 1 }
          ]
        };
        setAlbum(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
        if (window.confetti) window.confetti({ particleCount: 35, spread: 60 });
        playAudioBeep(520, 0.2);
      };

      // Active pages in current spread
      const leftPageIdx = (currentSpread - 1) * 2;
      const rightPageIdx = leftPageIdx + 1;
      const leftPage = currentSpread > 0 ? album.pages[leftPageIdx] : null;
      const rightPage = currentSpread > 0 ? album.pages[rightPageIdx] : null;

      const renderCoverColor = (color) => {
        switch(color) {
          case 'emerald': return 'from-emerald-950 via-emerald-900 to-emerald-950 border-emerald-700/50';
          case 'sapphire': return 'from-sky-950 via-blue-950 to-indigo-950 border-blue-700/50';
          case 'ruby': return 'from-rose-950 via-red-950 to-stone-950 border-rose-700/50';
          case 'midnight': return 'from-stone-950 via-zinc-900 to-black border-stone-700/50';
          case 'leather':
          default:
            return 'from-amber-950 via-stone-900 to-stone-950 border-amber-800/50';
        }
      };

      const getPaperClass = (texture) => {
        switch(texture) {
          case 'cream': return 'bg-cream text-stone-900';
          case 'linen': return 'bg-linen text-stone-900';
          case 'kraft': return 'bg-kraft text-stone-900';
          case 'grid': return 'bg-grid text-stone-900';
          case 'parchment':
          default:
            return 'bg-parchment text-stone-900';
        }
      };

      const getFontClass = (font) => {
        switch(font) {
          case 'caveat': return 'font-caveat';
          case 'cinzel': return 'font-cinzel';
          case 'courier': return 'font-courier';
          case 'dancing': return 'font-dancing';
          case 'playfair': return 'font-playfair';
          default: return 'font-inter';
        }
      };

      const getFilterClass = (filter) => {
        switch(filter) {
          case 'warm': return 'sepia-[0.25] saturate-125 contrast-105';
          case 'vintage': return 'sepia-[0.55] contrast-110 brightness-95';
          case 'bw': return 'grayscale contrast-125';
          case 'polaroid-fade': return 'saturate-85 contrast-90 brightness-105';
          default: return '';
        }
      };

      const renderPageCard = (page, isRightSide) => {
        if (!page) {
          return (
            <div className="w-full h-full bg-stone-900/60 rounded-r-2xl flex flex-col items-center justify-center border-2 border-dashed border-stone-700 p-8 text-center text-stone-400">
              <p className="text-sm font-medium mb-3">Blank Page</p>
              <button 
                onClick={handleAddPage}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold rounded-xl text-xs transition cursor-pointer shadow-lg"
              >
                + Add Next Memory Page
              </button>
            </div>
          );
        }

        const paperStyle = getPaperClass(page.paperTexture);
        const fontStyle = getFontClass(page.fontStyle);

        return (
          <div className={\`w-full h-full \${paperStyle} relative p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-inner select-none transition-all duration-300 \${isRightSide ? 'rounded-r-2xl border-l border-stone-400/20' : 'rounded-l-2xl border-r border-stone-400/20'}\`}>
            {/* Header / Title area */}
            <div>
              <div className="flex items-baseline justify-between border-b border-stone-400/30 pb-2 mb-4">
                <input 
                  type="text" 
                  value={page.title || ''}
                  onChange={(e) => handleTextChange(page.id, 'title', e.target.value)}
                  className={\`text-lg sm:text-xl font-bold bg-transparent outline-none border-b border-transparent hover:border-stone-400/40 focus:border-amber-600 w-2/3 \${fontStyle}\`}
                  placeholder="Page Title"
                />
                <input 
                  type="text" 
                  value={page.dateOrLocation || ''}
                  onChange={(e) => handleTextChange(page.id, 'dateOrLocation', e.target.value)}
                  className="text-xs font-serif text-stone-500 text-right bg-transparent outline-none border-b border-transparent hover:border-stone-400/40 focus:border-amber-600 w-1/3"
                  placeholder="Date / City"
                />
              </div>

              {/* Photos Gallery */}
              <div className={\`grid gap-4 items-center justify-center my-3 \${page.photos.length === 1 ? 'grid-cols-1' : page.photos.length === 2 ? 'grid-cols-2' : page.photos.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}\`}>
                {page.photos.map((ph, idx) => (
                  <div 
                    key={ph.id || idx}
                    className="relative group bg-white p-2.5 pb-5 rounded shadow-md transition-transform hover:scale-105 duration-200"
                    style={{ transform: \`rotate(\${ph.rotation || 0}deg)\` }}
                  >
                    <div className="relative overflow-hidden rounded bg-stone-100 aspect-4/3 flex items-center justify-center cursor-pointer">
                      <img 
                        src={ph.url} 
                        alt="Scrapbook Memory" 
                        className={\`w-full h-full object-cover \${getFilterClass(ph.filter)}\`}
                      />
                      <label className="absolute inset-0 bg-black/40 text-white text-[11px] font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <span>Click to Change Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handlePhotoUpload(page.id, idx, e.target.files[0])}
                        />
                      </label>
                    </div>
                    <input 
                      type="text"
                      value={ph.caption || ''}
                      onChange={(e) => handleCaptionChange(page.id, idx, e.target.value)}
                      className={\`w-full text-center mt-2 text-xs text-stone-700 bg-transparent outline-none border-b border-transparent hover:border-stone-300 focus:border-stone-500 \${fontStyle}\`}
                      placeholder="Photo caption..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Story & Page Number */}
            <div>
              <textarea 
                value={page.story || ''}
                onChange={(e) => handleTextChange(page.id, 'story', e.target.value)}
                rows={3}
                className={\`w-full bg-transparent resize-none text-xs sm:text-sm text-stone-700 leading-relaxed outline-none border border-transparent hover:border-stone-300/40 rounded p-1.5 focus:border-amber-600/50 \${fontStyle}\`}
                placeholder="Write your story, thoughts, and memories here..."
              />
              <div className="flex justify-between items-center text-[10px] text-stone-400 mt-2 font-serif pt-1 border-t border-stone-300/40">
                <span>{album.title}</span>
                <span>Page {page.pageNumber}</span>
              </div>
            </div>
          </div>
        );
      };

      return (
        <div className="min-h-screen flex flex-col bg-radial from-stone-900 via-stone-950 to-black text-stone-100">
          {/* Header */}
          <header className="sticky top-0 z-30 w-full bg-stone-950/80 backdrop-blur-md border-b border-stone-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-sm shadow">
                📖
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold font-serif text-stone-100">{album.title}</h1>
                <p className="text-[11px] text-stone-400">{album.pages.length} Pages • Self-Contained HTML Book</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleAddPage}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                + Add Page
              </button>
              <button 
                onClick={() => {
                  if (confirm('Reset to default template?')) {
                    localStorage.removeItem('standalone_3d_photo_album');
                    setAlbum(initialAlbumData);
                    setCurrentSpread(0);
                  }
                }}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                Reset
              </button>
            </div>
          </header>

          {/* Book Viewer Stage */}
          <main className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 perspective-1500">
            {/* The 3D Book Container */}
            <div className="relative w-full max-w-5xl aspect-[16/10] max-h-[720px] transition-all duration-500">
              {currentSpread === 0 ? (
                /* COVER VIEW */
                <div 
                  onClick={handleFlipNext}
                  className={\`w-full max-w-md mx-auto h-full rounded-2xl bg-linear-to-br \${renderCoverColor(album.coverColor)} p-8 sm:p-12 flex flex-col justify-between shadow-book border-4 cursor-pointer hover:scale-[1.02] transition-transform duration-300 relative group\`}
                >
                  <div className="absolute top-0 bottom-0 left-6 w-3 bg-amber-950/60 rounded-full border-r border-amber-500/20"></div>
                  
                  <div className="text-center mt-8 pl-4">
                    <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-2 block font-serif">
                      Memory Album
                    </span>
                    <input 
                      type="text" 
                      value={album.title} 
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setAlbum({...album, title: e.target.value})}
                      className="text-2xl sm:text-3xl font-bold font-serif text-amber-200 bg-transparent text-center border-b border-transparent hover:border-amber-400/40 outline-none w-full"
                    />
                    <input 
                      type="text" 
                      value={album.subtitle || ''} 
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setAlbum({...album, subtitle: e.target.value})}
                      className="text-xs sm:text-sm text-stone-300 mt-2 font-serif italic bg-transparent text-center border-b border-transparent hover:border-amber-400/40 outline-none w-full"
                      placeholder="Subtitle or year"
                    />
                  </div>

                  <div className="flex flex-col items-center justify-center my-6 pl-4">
                    <div className="w-20 h-20 rounded-full border-2 border-amber-400/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform bg-amber-950/40 shadow-inner">
                      ✨
                    </div>
                  </div>

                  <div className="text-center pl-4">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium border border-amber-500/30 animate-pulse">
                      Click Book to Open ➔
                    </span>
                  </div>
                </div>
              ) : (
                /* OPEN SPREAD (2 PAGES) */
                <div className="w-full h-full flex rounded-2xl shadow-book bg-stone-900/90 relative overflow-hidden border border-stone-800">
                  {/* Left Page */}
                  <div className="w-1/2 h-full relative">
                    {renderPageCard(leftPage, false)}
                  </div>

                  {/* Spine Center Shadow */}
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 spine-gradient pointer-events-none z-10"></div>

                  {/* Right Page */}
                  <div className="w-1/2 h-full relative">
                    {renderPageCard(rightPage, true)}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Controls Bar */}
            <div className="flex items-center gap-4 mt-6 bg-stone-900/90 px-6 py-2.5 rounded-2xl border border-stone-800 text-xs shadow-xl">
              <button 
                onClick={handleFlipPrev}
                disabled={currentSpread === 0}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-stone-800 text-stone-200 rounded-xl font-medium transition cursor-pointer"
              >
                ◀ Previous
              </button>
              <span className="text-stone-400 font-serif">
                {currentSpread === 0 ? 'Cover' : \`Spread \${currentSpread} of \${totalSpreads}\`}
              </span>
              <button 
                onClick={handleFlipNext}
                disabled={currentSpread >= totalSpreads}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:hover:bg-amber-500 text-stone-950 rounded-xl font-semibold transition cursor-pointer"
              >
                Next ▶
              </button>
            </div>
          </main>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;
}
