import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Settings2, Sparkles, Video, 
  Loader2, Download,
  Bot, X, AlertCircle, Plus,
  RefreshCw, Edit, Maximize2, Headset, Check,
  Square, CheckSquare, Megaphone, ExternalLink, Lock,
  History, Copy, ClipboardCheck, Trash2,
  AlertTriangle, Palette, Bookmark, Wand2, GripVertical, Save,
  Image as ImageIcon, Film, Sun, Moon, Wallet, Send,
  ChevronUp, ChevronDown
} from 'lucide-react';

// --- Types & Declarations ---

declare var process: {
  env: {
    API_KEY?: string;
    [key: string]: any;
  }
};

type ModalType = 'settings' | 'usage' | 'price' | 'support' | 'announcement' | 'edit-prompt' | 'styles' | 'library' | null;

interface AppConfig {
  baseUrl: string;
  apiKey: string;
}

interface GeneratedAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  prompt: string;
  modelName: string;
  durationText: string;
  genTimeLabel: string;
  modelId: string;
  timestamp: number;
  status?: 'queued' | 'processing' | 'completed' | 'failed' | 'loading';
  taskId?: string;
  config?: any;
}

interface ReferenceImage {
  id: string;
  data: string;
  mimeType: string;
}

interface ModelDefinition {
  id: string;
  name: string;
  cost: string;
  features: string[];
  maxImages: number;
  supportedAspectRatios: string[];
  supportedResolutions: string[];
}

interface SavedPrompt {
  id: string;
  text: string;
}

// --- Constants ---

const FIXED_BASE_URL = 'https://www.mxhdai.top';

const ASPECT_RATIO_LABELS: Record<string, string> = {
  '1:1': '1:1 (正方形)',
  '2:3': '2:3 (照片)',
  '3:2': '3:2 (摄影)',
  '3:4': '3:4 (小红书)',
  '4:3': '4:3 (早期电视)',
  '4:5': '4:5 (详情页)',
  '5:4': '5:4 (装饰画)',
  '9:16': '9:16 (短视频)',
  '16:9': '16:9 (电脑壁纸)',
  '21:9': '21:9 (宽屏电影)',
};

const EXTENDED_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const GPT1_RATIOS = ['1:1', '2:3', '3:2'];
const GPT15_RATIOS = ['1:1', '2:3', '3:2', '9:16', '16:9'];
const GROK_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];
const KLING_O1_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];
const JIMENG_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9', '21:9'];

const MODELS: ModelDefinition[] = [
  { 
    id: 'gemini-2.5-flash-image', 
    name: 'NANO BANANA', 
    cost: 'Flash',
    features: ['fast', 'multimodal'],
    maxImages: 4,
    supportedAspectRatios: EXTENDED_RATIOS,
    supportedResolutions: ['AUTO']
  },
  { 
    id: 'gemini-3-pro-image-preview', 
    name: 'Nano Banana Pro', 
    cost: 'Pro',
    features: ['hd'],
    maxImages: 8,
    supportedAspectRatios: EXTENDED_RATIOS,
    supportedResolutions: ['1K', '2K', '4K']
  },
  {
    id: 'kling-image-o1',
    name: 'Kling Image O1',
    cost: 'Kling',
    features: ['omni', 'high-quality'],
    maxImages: 4,
    supportedAspectRatios: KLING_O1_RATIOS,
    supportedResolutions: ['1K', '2K']
  },
  {
    id: 'gpt-image-1-all',
    name: 'GPT Image 1',
    cost: 'GPT',
    features: ['stable'],
    maxImages: 4,
    supportedAspectRatios: GPT1_RATIOS,
    supportedResolutions: ['AUTO']
  },
  {
    id: 'gpt-image-1.5-all',
    name: 'GPT Image 1.5',
    cost: 'GPT-1.5',
    features: ['detail'],
    maxImages: 4,
    supportedAspectRatios: GPT15_RATIOS,
    supportedResolutions: ['AUTO']
  },
  {
    id: 'grok-4-image',
    name: 'Grok 4 Image',
    cost: 'Grok',
    features: ['creative'],
    maxImages: 4,
    supportedAspectRatios: GROK_RATIOS,
    supportedResolutions: ['AUTO']
  },
  {
    id: 'jimeng-4.5',
    name: 'Jimeng 4.5',
    cost: 'Jimeng',
    features: ['art'],
    maxImages: 8,
    supportedAspectRatios: EXTENDED_RATIOS,
    supportedResolutions: ['2K', '4K']
  }
];

const VIDEO_MODELS = [
  { 
    id: 'sora-2', 
    name: 'Sora 2', 
    desc: '标清视频', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '10', q: '标清'}, 
      {s: '15', q: '标清'}
    ] 
  },
  { 
    id: 'sora-2-pro', 
    name: 'Sora 2 Pro', 
    desc: '高清/长效', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '15', q: '高清'}, 
      {s: '25', q: '标清'}
    ] 
  },
  { 
    id: 'veo_3_1-fast', 
    name: 'VEO 3.1 FAST', 
    desc: '标清视频', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '8', q: '标清'}
    ] 
  },
  { 
    id: 'veo3.1-pro', 
    name: 'VEO 3.1 PRO', 
    desc: '高清视频', 
    supportedAspectRatios: ['9:16', '16:9'],
    options: [
      {s: '8', q: '高清'}
    ] 
  },
  {
    id: 'jimeng-video-3.0',
    name: 'Jimeng Video 3.0',
    desc: '即梦视频',
    supportedAspectRatios: JIMENG_RATIOS,
    options: [
      {s: '5', q: '标清'},
      {s: '10', q: '标清'}
    ]
  },
  {
    id: 'grok-video-3',
    name: 'Grok Video 3',
    desc: '标清视频', 
    supportedAspectRatios: ['9:16', '16:9', '2:3', '3:2', '1:1'],
    options: [
      {s: '6', q: '标清'}
    ]
  }
];

const STYLES = [
  { zh: "写实", en: "Realistic" },
  { zh: "3D渲染", en: "3D Render" },
  { zh: "扁平化", en: "Flat design" },
  { zh: "日系动漫", en: "Anime" },
  { zh: "Q版卡通", en: "Cartoon" },
  { zh: "传统国风", en: "Chinese" },
  { zh: "赛博朋克", en: "Cyberpunk" },
  { zh: "INS极简", en: "Minimalist" },
  { zh: "线描", en: "Line Art" },
  { zh: "港风", en: "HK Style" },
  { zh: "美式卡通", en: "US Cartoon" },
  { zh: "蒸汽波", en: "Vaporwave" },
  { zh: "水彩", en: "Watercolor" },
  { zh: "油画", en: "Oil Paint" },
  { zh: "像素艺术", en: "Pixel Art" },
  { zh: "故障艺术", en: "Glitch" },
  { zh: "水墨画", en: "Ink Art" },
  { zh: "马克笔", en: "Marker" },
  { zh: "彩铅", en: "Pencil" },
  { zh: "日式极简", en: "Zen" },
  { zh: "民国风", en: "Retro" },
  { zh: "超现实", en: "Surreal" },
  { zh: "蜡笔画", en: "Crayon" },
  { zh: "黏土", en: "Clay" },
  { zh: "折纸", en: "Origami" },
  { zh: "毛毡", en: "Felt" },
  { zh: "针织", en: "Knitted" }
];

const OPTIMIZER_MODEL = 'gemini-3-flash-preview';

// --- Helpers ---
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const base64ToBlob = (base64: string, mimeType: string) => {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (e) {
    console.error("base64ToBlob failed", e);
    return null;
  }
};

const urlToBlob = async (url: string) => {
    try {
        const response = await fetch(url);
        return await response.blob();
    } catch (e) {
        console.error("urlToBlob failed", e);
        return null;
    }
};

const findImageUrlInObject = (obj: any): string | null => {
  if (!obj) return null;
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    const mdMatch = trimmed.match(/!\[.*?\]\((https?:\/\/[^\s"'<>)]+)\)/i);
    if (mdMatch) return mdMatch[1];
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      if (!trimmed.includes(' ')) return trimmed;
    }
    if (trimmed.startsWith('data:image')) return trimmed;
    const urlMatch = trimmed.match(/(https?:\/\/[^\s"'<>]+)/i);
    if (urlMatch) return urlMatch[1];
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findImageUrlInObject(item);
      if (found) return found;
    }
  } else if (typeof obj === 'object') {
    const priorityKeys = ['url', 'b64_json', 'image', 'img', 'link', 'content', 'data', 'url'];
    for (const key of priorityKeys) {
      if (obj[key]) {
        const found = findImageUrlInObject(obj[key]);
        if (found) return found;
      }
    }
    for (const key in obj) {
      if (typeof obj[key] === 'object' || typeof obj[key] === 'string') {
        const found = findImageUrlInObject(obj[key]);
        if (found) return found;
      }
    }
  }
  return null;
};

// --- IndexedDB ---
const DB_NAME = 'viva_ai_db';
const STORE_NAME = 'assets';
const DB_VERSION = 3;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const saveAssetToDB = async (asset: GeneratedAsset) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(asset);
  } catch(e) { console.error("DB Save Error", e); }
};

const getAllAssetsFromDB = async (): Promise<GeneratedAsset[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch(e) { return []; }
};

const deleteAssetFromDB = async (id: string) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
  } catch(e) { console.error("DB Delete Error", e); }
};

// --- Sub-components ---

interface CircularButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
}

const CircularButton = ({ children, onClick, className = "", title }: CircularButtonProps) => (
  <button onClick={onClick} title={title} className={`w-10 h-10 rounded-full border-2 border-black dark:border-zinc-500 flex items-center justify-center brutalist-shadow-sm transition-all hover:translate-y-0.5 hover:shadow-none ${className}`}>
      {children}
  </button>
);

const ModalHeader = ({ title, icon: Icon, onClose, bgColor = "bg-gradient-to-r from-cyan-400 to-emerald-400" }: { title: string, icon: any, onClose: () => void, bgColor?: string }) => (
  <div className={`${bgColor} p-4 border-b-4 border-black dark:border-zinc-600 flex justify-between items-center relative`}>
    <div className="flex items-center gap-3 text-black">
      {Icon && typeof Icon === 'string' ? <span className="text-xl font-bold">{Icon}</span> : Icon && <Icon className="w-8 h-8" />}
      <h2 className="text-2xl font-bold italic tracking-tighter uppercase">{title}</h2>
    </div>
    <button onClick={onClose} 
            className="absolute -top-4 -right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white p-2 border-4 border-black dark:border-zinc-700 brutalist-shadow-sm hover:translate-y-1 hover:shadow-none transition-all z-[80] rounded-full">
      <X className="w-6 h-6" />
    </button>
  </div>
);

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [mainCategory, setMainCategory] = useState<'image' | 'video'>('video');
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [selectedVideoModel, setSelectedVideoModel] = useState('sora-2');
  const [videoOptionIdx, setVideoOptionIdx] = useState(1);
  const [videoRatio, setVideoRatio] = useState('16:9');
  const [activeModal, setActiveModal] = useState<ModalType>('announcement');
  const [previewAsset, setPreviewAsset] = useState<GeneratedAsset | null>(null);
  const [previewRefImage, setPreviewRefImage] = useState<ReferenceImage | null>(null);
  const [config, setConfig] = useState<AppConfig>({ baseUrl: FIXED_BASE_URL, apiKey: '' });
  const [tempConfig, setTempConfig] = useState<AppConfig>(config);
  const [prompt, setPrompt] = useState('');
  const [libraryPrompts, setLibraryPrompts] = useState<SavedPrompt[]>([]);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [imageSize, setImageSize] = useState('AUTO');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generationCount, setGenerationCount] = useState(1);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionCurrent, setSelectionCurrent] = useState({ x: 0, y: 0 });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draggedPromptIdx, setDraggedPromptIdx] = useState<number | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [editingLibraryId, setEditingLibraryId] = useState<string | null>(null);
  const [editingLibraryText, setEditingLibraryText] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const galleryRef = useRef<HTMLDivElement>(null);
  const configRef = useRef(config);
  const isFirstRender = useRef(true);

  // Safe process.env access
  const safeEnvKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';

  useEffect(() => {
    configRef.current = config;
    if (config.apiKey || safeEnvKey) {
        // Optional: Check balance on init if key exists
    }
  }, [config]);

  const checkBalance = async () => {
    const key = config.apiKey || safeEnvKey;
    if (!key) { alert("请先配置API KEY"); return; }
    try {
        setBalance("查询中...");
        const res = await fetch(`${config.baseUrl}/v1/dashboard/billing/subscription`, {
            headers: { 'Authorization': `Bearer ${key}` }
        });
        if (!res.ok) throw new Error("Check failed");
        const data = await res.json();
        
        let remaining: number | undefined = undefined;

        if (data.remaining_amount !== undefined) {
             remaining = parseFloat(data.remaining_amount);
        } else if (data.balance !== undefined) {
             remaining = parseFloat(data.balance);
        } else if (data.hard_limit_usd !== undefined) {
             // Fallback: calculate usage
             const total = parseFloat(data.hard_limit_usd);
             try {
                 const now = new Date();
                 const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                 const end = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                 const resUsage = await fetch(`${config.baseUrl}/v1/dashboard/billing/usage?start_date=${start}&end_date=${end}`, {
                    headers: { 'Authorization': `Bearer ${key}` }
                 });
                 if (resUsage.ok) {
                     const usageData = await resUsage.json();
                     // OpenAI standard: total_usage is in cents. hard_limit_usd is in dollars.
                     const totalUsageCents = usageData.total_usage ? parseFloat(usageData.total_usage) : 0;
                     remaining = Math.max(0, total - (totalUsageCents / 100));
                 } else {
                     remaining = total;
                 }
             } catch (e) {
                 remaining = total;
             }
        }

        if (remaining !== undefined) {
             setBalance(`余额: $${remaining.toFixed(2)}`);
        } else {
             setBalance("查询完成");
        }
    } catch (e) {
        setBalance("查询失败");
        setTimeout(() => setBalance(null), 3000);
    }
  };

  useEffect(() => {
    // Reset video option index when model changes to prevent out-of-bounds errors
    // Skip reset on first render to preserve default 15s (index 1) for sora-2
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setVideoOptionIdx(0);
  }, [selectedVideoModel]);

  useEffect(() => {
    if (mainCategory === 'image') {
      const model = MODELS.find(m => m.id === selectedModel);
      if (model) {
        if (!model.supportedAspectRatios.includes(aspectRatio)) setAspectRatio(model.supportedAspectRatios[0]);
        if (!model.supportedResolutions.includes(imageSize)) setImageSize(model.supportedResolutions[0]);
      }
    } else {
      const model = VIDEO_MODELS.find(m => m.id === selectedVideoModel);
      if (model) {
          if (model.supportedAspectRatios && !model.supportedAspectRatios.includes(videoRatio)) {
              setVideoRatio(model.supportedAspectRatios[0]);
          }
      }

      const max = (selectedVideoModel.startsWith('veo') || selectedVideoModel.startsWith('grok')) ? 2 : 1;
      if (referenceImages.length > max) {
        setReferenceImages(prev => prev.slice(0, max));
      }
    }
  }, [selectedModel, selectedVideoModel, mainCategory, aspectRatio, imageSize, videoRatio]);

  useEffect(() => {
    if (error && error.includes('张参考图')) {
      const currentModel = MODELS.find(m => m.id === selectedModel);
      const max = (mainCategory === 'image') ? (currentModel?.maxImages || 4) : ((selectedVideoModel.startsWith('veo') || selectedVideoModel.startsWith('grok')) ? 2 : 1);
      if (referenceImages.length <= max) {
        setError(null);
      }
    }
  }, [referenceImages, selectedModel, selectedVideoModel, mainCategory, error]);

  useEffect(() => {
    if (activeModal === 'edit-prompt') {
      setPrompt(prev => prev.replace(/([。])(?!\s*\n)/g, '$1\n\n').replace(/(\. )/g, '.\n\n'));
    }
  }, [activeModal]);

  useEffect(() => {
    getAllAssetsFromDB().then(assets => {
        const sorted = assets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setGeneratedAssets(sorted);
        // Restart video polling
        sorted.filter(a => a.type === 'video' && (a.status === 'queued' || a.status === 'processing'))
              .forEach(v => startVideoPolling(v.taskId!, v.id, v.timestamp, v.modelId));
        
        // Restart Kling Image polling
        sorted.filter(a => a.type === 'image' && a.modelId === 'kling-image-o1' && (a.status === 'queued' || a.status === 'processing'))
              .forEach(v => startKlingImagePolling(v.taskId!, v.id, v.timestamp));
    });

    // Load library prompts
    const savedLibrary = localStorage.getItem('viva_library_prompts');
    if (savedLibrary) {
        try { setLibraryPrompts(JSON.parse(savedLibrary)); } catch (e) { setLibraryPrompts([]); }
    }
  }, []);

  // Initialization: Load config from local storage
  useEffect(() => {
    const saved = localStorage.getItem('viva_config');
    
    if (saved) {
      try {
        const p = JSON.parse(saved);
        const enforced = { ...p, baseUrl: FIXED_BASE_URL };
        setConfig(enforced);
        setTempConfig(enforced);
      } catch (e) {
        setConfig({ baseUrl: FIXED_BASE_URL, apiKey: '' });
        setTempConfig({ baseUrl: FIXED_BASE_URL, apiKey: '' });
      }
    }
  }, []);

  const saveConfig = () => {
    const normalized = { ...tempConfig, baseUrl: FIXED_BASE_URL };
    setConfig(normalized);
    setTempConfig(normalized);
    localStorage.setItem('viva_config', JSON.stringify(normalized));
    setActiveModal(null);
    setError(null);
  };

  const startKlingImagePolling = (taskId: string, assetId: string, startTime: number) => {
    const interval = setInterval(async () => {
        let key = configRef.current.apiKey || safeEnvKey;
        if (!key || !taskId) { clearInterval(interval); return; }
        try {
            const url = `${configRef.current.baseUrl}/kling/v1/images/omni-image/${taskId}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' } });
            const data = await res.json();
            
            const taskStatus = data.data?.task_status || '';
            
            if (taskStatus === 'succeed') {
                 const images = data.data?.task_result?.images;
                 const imageUrl = images && images.length > 0 ? images[0].url : null;
                 
                 if (imageUrl) {
                    const finishTime = Date.now();
                    const diff = Math.round((finishTime - startTime) / 1000);
                    const assetUpdates = { status: 'completed' as const, url: imageUrl, genTimeLabel: `${diff}s` };
                    
                    setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...assetUpdates } : a));
                    
                    const assets = await getAllAssetsFromDB();
                    const existing = assets.find(a => a.id === assetId);
                    if (existing) {
                        saveAssetToDB({ ...existing, ...assetUpdates });
                    }
                 } else {
                     setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'failed', genTimeLabel: '无图' } : a));
                 }
                 clearInterval(interval);
            } else if (taskStatus === 'failed') {
                 const errorMsg = data.data?.task_status_msg || '失败';
                 setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'failed', genTimeLabel: errorMsg } : a));
                 clearInterval(interval);
            }
        } catch (e) {
            console.error("Polling error for kling task", taskId, e);
        }
    }, 3000);
  };

  const startVideoPolling = (taskId: string, assetId: string, startTime: number, modelId: string) => {
    const interval = setInterval(async () => {
        let key = configRef.current.apiKey || safeEnvKey;
        if (!key || !taskId) { clearInterval(interval); return; }
        try {
            const isVeoGrokJimeng = modelId.startsWith('veo') || modelId.startsWith('grok') || modelId.startsWith('jimeng');
            const url = isVeoGrokJimeng ? `${configRef.current.baseUrl}/v1/video/query?id=${taskId}` : `${configRef.current.baseUrl}/v1/videos/${taskId}`;
            
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' } });
            const data = await res.json();
            
            const rawStatus = (data.status || data.state || data.data?.status || '').toLowerCase();
            const videoUrl = data.video_url || data.url || data.uri || data.data?.url || data.data?.video_url;

            const isSuccess = ['completed', 'succeeded', 'success', 'done'].includes(rawStatus);
            const isFailed = ['failed', 'error', 'rejected'].includes(rawStatus);

            if (isSuccess && videoUrl) {
                const finishTime = Date.now();
                const diff = Math.round((finishTime - startTime) / 1000);
                const assetUpdates = { status: 'completed' as const, url: videoUrl, genTimeLabel: `${diff}s` };
                
                setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...assetUpdates } : a));
                
                const assets = await getAllAssetsFromDB();
                const existing = assets.find(a => a.id === assetId);
                if (existing) {
                    saveAssetToDB({ ...existing, ...assetUpdates });
                }
                
                clearInterval(interval);
            } else if (isFailed) {
                setGeneratedAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'failed', genTimeLabel: '失败' } : a));
                
                const assets = await getAllAssetsFromDB();
                const existing = assets.find(a => a.id === assetId);
                if (existing) {
                    saveAssetToDB({ ...existing, status: 'failed', genTimeLabel: '失败' });
                }

                clearInterval(interval);
            }
        } catch (e) { 
            console.error("Polling error for task", taskId, e); 
        }
    }, 5000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const currentModel = MODELS.find(m => m.id === selectedModel);
    const max = (mainCategory === 'image') ? (currentModel?.maxImages || 4) : ((selectedVideoModel.startsWith('veo') || selectedVideoModel.startsWith('grok')) ? 2 : 1);
    const remaining = max - referenceImages.length;
    if (remaining <= 0) { 
      setError(`当前模型最多支持 ${max} 张参考图`); 
      return; 
    }
    Array.from(files).slice(0, Math.max(0, remaining)).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const matches = result.match(/^data:(.+);base64,(.+)$/);
        if (matches) setReferenceImages(prev => [...prev, { id: generateUUID(), mimeType: matches[1], data: matches[2] }]);
      };
      reader.readAsDataURL(file as Blob);
    });
  };

  const removeReferenceImage = (id: string) => setReferenceImages(prev => prev.filter(img => img.id !== id));

  const optimizePrompt = async () => {
     if (!prompt) return;
     let key = config.apiKey || safeEnvKey;
     
     setIsOptimizing(true);
     let sys = `你是一位专业的AI绘画提示词工程师。
请将用户的输入（可能是简短的中文或英文）改写成一段高质量、细节丰富的中文绘画提示词。
扩展核心元素：主体、风格、光影、构图和氛围。
不要包含任何宽高比参数（如 --ar, --aspect-ratio）。
只输出优化后的提示词文本，不要输出其他任何解释。`;

     if (mainCategory === 'video') {
       sys = `你是一位专业的AI视频提示词专家。请根据用户的输入，生成一段完整、连贯、高质量的中文视频生成提示词。
该提示词应包含主体描述、场景细节、光影氛围、镜头语言（如运镜方式）和视频风格。
要求：
1. 直接输出最终的提示词段落。
2. 不要包含任何分析、解释、标题或分点（如"核心主题"、"画面细节"等）。
3. 确保提示词适合Sora 2或Veo等模型理解。
4. 仅输出提示词本身。`;
     }
     try {
        const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ model: OPTIMIZER_MODEL, messages: [{ role: "system", content: sys }, { role: "user", content: prompt }] })
        });
        const data = await res.json();
        const optimized = data.choices?.[0]?.message?.content?.trim();
        if (optimized) { setPrompt(optimized); setError(null); }
     } catch (e) { setError("AI优化失败"); } finally { setIsOptimizing(false); }
  };

  const selectStyle = (style: string) => {
    setPrompt(prev => {
        const trimmed = prev.trim();
        if (!trimmed) return style;
        // Check if last char is punctuation
        const lastChar = trimmed.slice(-1);
        const separator = (lastChar === ',' || lastChar === '，' || lastChar === '.' || lastChar === '。') ? ' ' : ', ';
        return trimmed + separator + style;
    });
    setActiveModal(null);
  };

  const savePromptToLibrary = () => {
    if (!prompt.trim()) return;
    const newPrompt = { id: generateUUID(), text: prompt.trim() };
    const updated = [newPrompt, ...libraryPrompts];
    setLibraryPrompts(updated);
    localStorage.setItem('viva_library_prompts', JSON.stringify(updated));
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
    setError(null);
  };

  const removePromptFromLibrary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = libraryPrompts.filter(p => p.id !== id);
    setLibraryPrompts(updated);
    localStorage.setItem('viva_library_prompts', JSON.stringify(updated));
  };

  const usePromptFromLibrary = (text: string) => {
    if (editingLibraryId) return; // Don't use prompt if currently editing
    setPrompt(text);
    setActiveModal(null);
  };

  const handleStartLibraryEdit = (p: SavedPrompt, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLibraryId(p.id);
    setEditingLibraryText(p.text);
  };

  const handleSaveLibraryEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = libraryPrompts.map(p => p.id === id ? { ...p, text: editingLibraryText } : p);
    setLibraryPrompts(updated);
    localStorage.setItem('viva_library_prompts', JSON.stringify(updated));
    setEditingLibraryId(null);
  };

  const handleCancelLibraryEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLibraryId(null);
  };

  // --- Drag & Drop Sorting Handlers ---
  const handleDragStart = (idx: number) => {
    if (editingLibraryId) return;
    setDraggedPromptIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (editingLibraryId) return;
    if (draggedPromptIdx === null || draggedPromptIdx === idx) return;
    
    const items = [...libraryPrompts];
    const draggedItem = items[draggedPromptIdx];
    items.splice(draggedPromptIdx, 1);
    items.splice(idx, 0, draggedItem);
    
    setDraggedPromptIdx(idx);
    setLibraryPrompts(items);
  };

  const handleDragEnd = () => {
    setDraggedPromptIdx(null);
    localStorage.setItem('viva_library_prompts', JSON.stringify(libraryPrompts));
  };

  const executeVideoGeneration = async (overrideConfig?: any) => {
    const tPrompt = overrideConfig?.prompt ?? prompt;
    if (!tPrompt) { setError("请输入提示词"); return; }
    let key = config.apiKey || safeEnvKey;
    
    const placeholders: GeneratedAsset[] = [];
    const count = overrideConfig ? 1 : generationCount;
    const startTime = Date.now();
    const tModelId = overrideConfig?.modelId ?? selectedVideoModel;
    const tRatio = overrideConfig?.videoRatio ?? videoRatio;
    const tOptIdx = overrideConfig?.videoOptionIdx ?? videoOptionIdx;
    const tRefs = overrideConfig?.referenceImages ?? referenceImages;

    for (let i = 0; i < count; i++) {
      placeholders.push({
        id: generateUUID(), url: '', type: 'video', prompt: tPrompt,
        modelId: tModelId, modelName: VIDEO_MODELS.find(m => m.id === tModelId)!.name,
        durationText: `${VIDEO_MODELS.find(m => m.id === tModelId)!.options[tOptIdx].s}s`,
        genTimeLabel: '生成中...',
        timestamp: startTime, status: 'loading',
        config: { modelId: tModelId, videoRatio: tRatio, videoOptionIdx: tOptIdx, prompt: tPrompt, referenceImages: [...tRefs], type: 'video' }
      });
    }
    setGeneratedAssets(prev => [...placeholders, ...prev]);

    setError(null);
    try {
        const createOne = async (pId: string) => {
            let response;
            const isVeoModel = tModelId.startsWith('veo');
            const isGrokModel = tModelId.startsWith('grok');
            const isJimengModel = tModelId.startsWith('jimeng');
            
            if (isVeoModel || isGrokModel || isJimengModel) {
                const payload: any = {
                    model: tModelId,
                    prompt: tPrompt,
                    images: tRefs.map((img: ReferenceImage) => img.data.startsWith('http') ? img.data : `data:${img.mimeType};base64,${img.data}`),
                    aspect_ratio: tRatio
                };

                if (isVeoModel) {
                  payload.enhance_prompt = true;
                  payload.enable_upsample = true;
                }

                if (isGrokModel) {
                   payload.size = '720P';
                }

                if (isJimengModel) {
                    payload.duration = parseInt(VIDEO_MODELS.find(m => m.id === tModelId)!.options[tOptIdx].s);
                }

                response = await fetch(`${config.baseUrl}/v1/video/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'Accept': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                const formData = new FormData();
                formData.append('model', tModelId);
                formData.append('prompt', tPrompt);
                formData.append('seconds', VIDEO_MODELS.find(m => m.id === tModelId)!.options[tOptIdx].s);
                formData.append('size', tRatio.replace(':', 'x'));
                formData.append('watermark', 'false');
                
                if (tRefs && tRefs.length > 0) {
                    const img = tRefs[0];
                    let blob: Blob | null = null;
                    if (img.data.startsWith('http')) {
                        blob = await urlToBlob(img.data);
                    } else {
                        blob = base64ToBlob(img.data, img.mimeType);
                    }
                    if (blob) formData.append('input_reference', blob, 'reference.png');
                }
                response = await fetch(`${config.baseUrl}/v1/videos`, { method: 'POST', headers: { 'Authorization': `Bearer ${key}` }, body: formData });
            }
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "视频生成接口错误");
            
            const tid = data.id || data.data?.id || data.task_id || data.taskId;
            const updatedAsset: any = { ...placeholders.find(x => x.id === pId), status: 'queued', taskId: tid };
            setGeneratedAssets(prev => prev.map(a => a.id === pId ? updatedAsset : a));
            saveAssetToDB(updatedAsset);
            startVideoPolling(tid, pId, startTime, tModelId);
        };
        
        placeholders.forEach(p => createOne(p.id));
    } catch (err: any) { 
        setError(err.message); 
        setGeneratedAssets(prev => prev.map(a => placeholders.some(p => p.id === a.id) ? { ...a, status: 'failed', genTimeLabel: '接口失败' } : a));
    }
  };

  const executeGeneration = async (overrideConfig?: any) => {
    if (mainCategory === 'video' && !overrideConfig) { executeVideoGeneration(); return; }
    if (overrideConfig?.type === 'video') { executeVideoGeneration(overrideConfig); return; }

    const tPrompt = overrideConfig?.prompt ?? prompt;
    if (!tPrompt) { setError("请输入提示词"); return; }
    let key = config.apiKey || safeEnvKey;

    const tModelId = overrideConfig?.modelId ?? selectedModel;
    const tRatio = overrideConfig?.aspectRatio ?? aspectRatio;
    const tSize = overrideConfig?.imageSize ?? imageSize;
    const tRefs = overrideConfig?.referenceImages ?? referenceImages;
    const count = overrideConfig ? 1 : generationCount;
    const startTime = Date.now();

    const placeholders: GeneratedAsset[] = [];
    for (let i = 0; i < count; i++) {
        placeholders.push({
            id: generateUUID(), url: '', type: 'image', prompt: tPrompt,
            modelId: tModelId, modelName: MODELS.find(m => m.id === tModelId)?.name || tModelId,
            durationText: tSize, genTimeLabel: '生成中...',
            timestamp: startTime, status: 'loading',
            config: { modelId: tModelId, aspectRatio: tRatio, imageSize: tSize, prompt: tPrompt, referenceImages: tRefs ? [...tRefs] : [], type: 'image' }
        });
    }
    setGeneratedAssets(prev => [...placeholders, ...prev]);
    setError(null);

    // Specific handling for Kling Omni Image (Async)
    if (tModelId === 'kling-image-o1') {
        const createOneKling = async (pId: string) => {
            try {
                 const payload = {
                    model_name: "kling-image-o1",
                    prompt: tPrompt,
                    n: 1, 
                    aspect_ratio: tRatio,
                    resolution: tSize.toLowerCase(),
                    image_list: tRefs.map((img: ReferenceImage) => ({
                        image: img.data.startsWith('http') ? img.data : `data:${img.mimeType};base64,${img.data}`
                    }))
                 };

                 const res = await fetch(`${config.baseUrl}/kling/v1/images/omni-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify(payload)
                 });
                 const data = await res.json();
                 
                 if (data.code !== 0) throw new Error(data.message || "Kling API Error");
                 
                 const tid = data.data?.task_id;
                 if (!tid) throw new Error("No Task ID returned");

                 const p = placeholders.find(x => x.id === pId);
                 if (p) {
                     const updatedAsset: any = { ...p, status: 'queued', taskId: tid };
                     setGeneratedAssets(prev => prev.map(a => a.id === pId ? updatedAsset : a));
                     saveAssetToDB(updatedAsset);
                     startKlingImagePolling(tid, pId, startTime);
                 }

            } catch (e: any) {
                 setGeneratedAssets(prev => prev.map(a => a.id === pId ? { ...a, status: 'failed', genTimeLabel: '请求失败' } : a));
                 setError(e.message);
            }
        }
        placeholders.forEach(p => createOneKling(p.id));
        return;
    }

    // Default synchronous generation
    try {
      const generateOne = async (pId: string) => {
        const start = Date.now();
        let url = '';
        try {
            if (tModelId.startsWith('gemini')) {
                const parts: any[] = [{ text: tPrompt }];
                if (tRefs && tRefs.length > 0) tRefs.forEach((img: ReferenceImage) => parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } }));
                const res = await fetch(`${config.baseUrl}/v1beta/models/${tModelId}:generateContent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: tRatio, imageSize: tSize === 'AUTO' ? undefined : tSize } } })
                });
                const data = await res.json();
                const part = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData || p.inline_data);
                if (part) { 
                    const d = part.inlineData || part.inline_data; 
                    url = `data:${d.mimeType};base64,${d.data}`; 
                } else url = findImageUrlInObject(data) || '';
                
                if (!url) {
                    const content: any[] = [{ type: "text", text: `${tPrompt} --aspect-ratio ${tRatio}` }];
                    if (tRefs && tRefs.length > 0) tRefs.forEach((img: ReferenceImage) => content.push({ type: "image_url", image_url: { url: img.data.startsWith('http') ? img.data : `data:${img.mimeType};base64,${img.data}` } }));
                    const res2 = await fetch(`${config.baseUrl}/v1/chat/completions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                        body: JSON.stringify({ model: tModelId, messages: [{ role: "user", content }], stream: false })
                    });
                    const data2 = await res2.json();
                    url = findImageUrlInObject(data2) || findImageUrlInObject(data2.choices?.[0]?.message?.content) || '';
                }
            } else {
                const content: any[] = [{ type: "text", text: `${tPrompt} --aspect-ratio ${tRatio}` }];
                if (tRefs && tRefs.length > 0) tRefs.forEach((img: ReferenceImage) => content.push({ type: "image_url", image_url: { url: img.data.startsWith('http') ? img.data : `data:${img.mimeType};base64,${img.data}` } }));
                const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                    body: JSON.stringify({ model: tModelId, messages: [{ role: "user", content }], stream: false })
                });
                const data = await res.json();
                url = findImageUrlInObject(data) || findImageUrlInObject(data.choices?.[0]?.message?.content) || '';
            }
        } catch (e) {
            console.error("Single generation failed", e);
        }

        const diff = Math.round((Date.now() - start) / 1000);
        
        if (url) {
            const placeholder = placeholders.find(x => x.id === pId);
            if (placeholder) {
                const updated: GeneratedAsset = {
                    ...placeholder,
                    url, genTimeLabel: `${diff}s`, status: 'completed', timestamp: Date.now()
                };
                setGeneratedAssets(prev => prev.map(a => a.id === pId ? updated : a));
                saveAssetToDB(updated);
            }
        } else {
            setGeneratedAssets(prev => prev.map(a => a.id === pId ? { ...a, status: 'failed', genTimeLabel: '失败' } : a));
        }
      };
      
      placeholders.forEach(p => generateOne(p.id));
    } catch (err: any) { setError(err.message); }
  };

  const handleAssetDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAssetFromDB(id);
    setGeneratedAssets(prev => prev.filter(a => a.id !== id));
    setSelectedAssetIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('[data-asset-card="true"]') || (e.target as HTMLElement).closest('[data-control-panel="true"]')) return;
      setIsSelecting(true);
      setSelectionStart({ x: e.clientX, y: e.clientY });
      setSelectionCurrent({ x: e.clientX, y: e.clientY });
      if (!e.shiftKey) setSelectedAssetIds(new Set());
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting) return;
    setSelectionCurrent({ x: e.clientX, y: e.clientY });
    
    const x1 = Math.min(selectionStart.x, e.clientX);
    const y1 = Math.min(selectionStart.y, e.clientY);
    const x2 = Math.max(selectionStart.x, e.clientX);
    const y2 = Math.max(selectionStart.y, e.clientY);

    const cards = galleryRef.current?.querySelectorAll('[data-asset-card="true"]');
    const newSelected = new Set(e.shiftKey ? selectedAssetIds : []);
    cards?.forEach(card => {
      const crect = card.getBoundingClientRect();
      const assetId = card.getAttribute('data-asset-id');
      if (assetId && !(crect.right < x1 || crect.left > x2 || crect.bottom < y1 || crect.top > y2)) {
        newSelected.add(assetId);
      }
    });
    setSelectedAssetIds(newSelected);
  };

  const handleContainerMouseUp = () => setIsSelecting(false);

  const toggleAssetSelection = (id: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return;
    
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedAssetIds.size === generatedAssets.length) setSelectedAssetIds(new Set());
    else setSelectedAssetIds(new Set(generatedAssets.map(a => a.id)));
  };

  const handleBatchDownload = () => {
    selectedAssetIds.forEach(id => {
      const asset = generatedAssets.find(a => a.id === id);
      if (asset && asset.url) {
        const link = document.createElement('a');
        link.href = asset.url;
        link.download = `asset-${asset.id}.${asset.type === 'video' ? 'mp4' : 'png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const handleAssetRefresh = (asset: GeneratedAsset) => {
     if (asset.config) {
        setPrompt(asset.config.prompt);
        setReferenceImages(asset.config.referenceImages || []);
        if (asset.type === 'image') {
           setMainCategory('image');
           setSelectedModel(asset.config.modelId);
           setAspectRatio(asset.config.aspectRatio);
           setImageSize(asset.config.imageSize);
           executeGeneration(asset.config);
        } else {
           setMainCategory('video');
           setSelectedVideoModel(asset.config.modelId);
           setVideoRatio(asset.config.videoRatio);
           setVideoOptionIdx(asset.config.videoOptionIdx);
           executeVideoGeneration(asset.config);
        }
     }
  };

  const handleAssetEdit = (asset: GeneratedAsset) => {
     if (asset.type === 'image' && asset.url) {
        const matches = asset.url.match(/^data:([^;]+);base64,(.+)$/);
        const mimeType = matches ? matches[1] : 'image/png';
        const data = matches ? matches[2] : asset.url;
        
        setMainCategory('image');

        setReferenceImages(prev => {
            const currentModel = MODELS.find(m => m.id === selectedModel);
            // Since we are switching to image mode, we assume the user wants to use image limits
            const max = currentModel?.maxImages || 4;
            if (prev.length >= max) {
                setError(`当前模型最多支持 ${max} 张参考图`);
                return prev;
            }
            return [...prev, { id: generateUUID(), mimeType, data }];
        });
     }
  };

  const handleAssetGenVideo = (asset: GeneratedAsset) => { 
    if (asset.type === 'video') return;
    setMainCategory('video'); 
    if (asset.url) {
        const matches = asset.url.match(/^data:([^;]+);base64,(.+)$/);
        const mimeType = matches ? matches[1] : 'image/png';
        const data = matches ? matches[2] : asset.url;
        setReferenceImages([{ id: generateUUID(), mimeType, data }]);
    }
  };

  const handleCopyPrompt = (p: string, id: string) => {
    navigator.clipboard.writeText(p);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentImageModel = MODELS.find(m => m.id === selectedModel);
  const currentVideoModel = VIDEO_MODELS.find(m => m.id === selectedVideoModel);
  const labelClass = "font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-1 block";
  const selectClass = "w-full p-2 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm bg-slate-50 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400";
  
  return (
    <div className={`min-h-screen flex flex-col overflow-hidden relative ${isDarkMode ? 'dark bg-zinc-900 text-white' : 'bg-[#F1F5F9] text-black'}`}
         onMouseMove={handleContainerMouseMove} 
         onMouseUp={handleContainerMouseUp}>
      
      {/* Top Header */}
      <div className="h-16 border-b border-black/10 dark:border-white/10 px-6 flex justify-between items-center z-20 backdrop-blur-sm bg-white/70 dark:bg-zinc-900/70 fixed top-0 left-0 right-0">
          <div className="flex items-center gap-4">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  {isDarkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-slate-700" />}
              </button>
              <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight italic bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">MX Ai</h1>
              </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={checkBalance} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 dark:border-zinc-600 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                 <Wallet className="w-4 h-4 text-emerald-500" />
                 {balance || "查余额"}
             </button>
             <CircularButton onClick={() => setActiveModal('price')} title="价格说明" className="dark:bg-zinc-800 dark:text-white dark:border-zinc-600"><span className="text-lg">¥</span></CircularButton>
             <CircularButton onClick={() => setActiveModal('usage')} title="使用说明" className="dark:bg-zinc-800 dark:text-white dark:border-zinc-600"><Megaphone className="w-5 h-5"/></CircularButton>
             <button onClick={() => setActiveModal('settings')} className="px-4 py-1.5 rounded-full border border-slate-300 dark:border-zinc-600 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors dark:text-white" title="设置">
                登录
             </button>
          </div>
      </div>

      {/* Main Gallery Area */}
      <div ref={galleryRef} className="flex-1 overflow-y-auto pt-20 pb-80 px-4 md:px-8 no-scrollbar" onMouseDown={handleContainerMouseDown}>
          {/* Gallery Tools */}
          <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                 {/* Left empty for balance */}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSelectAll} className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white shadow-sm hover:shadow transition-all">
                   {selectedAssetIds.size === generatedAssets.length && generatedAssets.length > 0 ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>} 全选
                </button>
                <span className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-white shadow-sm">
                   数量 ({generatedAssets.length})
                </span>
                {selectedAssetIds.size > 0 && (
                    <>
                    <button onClick={handleBatchDownload} className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-blue-600 transition-all">下载 ({selectedAssetIds.size})</button>
                    <button onClick={() => { selectedAssetIds.forEach(id => { deleteAssetFromDB(id); setGeneratedAssets(prev => prev.filter(a => a.id !== id)); }); setSelectedAssetIds(new Set()); }} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-red-600 transition-all">删除 ({selectedAssetIds.size})</button>
                    </>
                )}
              </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {generatedAssets.map((asset) => (
              <div key={asset.id} 
                   data-asset-id={asset.id} 
                   data-asset-card="true" 
                   onClick={(e) => toggleAssetSelection(asset.id, e)}
                   className={`group bg-white dark:bg-zinc-800 border-2 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 cursor-pointer relative shadow-lg ${selectedAssetIds.has(asset.id) ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-transparent'}`}>
                
                <button 
                  onClick={(e) => handleAssetDelete(asset.id, e)} 
                  className="absolute top-2 right-2 bg-white/80 dark:bg-black/50 text-red-500 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all z-40 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="aspect-square bg-slate-100 dark:bg-zinc-800 relative overflow-hidden">
                  {(asset.status === 'loading' || asset.status === 'queued' || asset.status === 'processing') ? (
                     <div className="w-full h-full flex flex-col items-center justify-center p-8 animate-pulse text-slate-400">
                        <Loader2 className="w-10 h-10 mb-3 animate-spin" />
                        <span className="font-bold text-xs uppercase tracking-wider">Rendering...</span>
                     </div>
                  ) : asset.status === 'failed' ? (
                     <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 gap-2">
                           <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
                           <span className="font-bold text-xs uppercase tracking-wider text-red-500 text-center">{asset.genTimeLabel || 'Failed'}</span>
                     </div>
                  ) : asset.type === 'image' ? (
                    <img src={asset.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                      {asset.status === 'completed' ? <video src={asset.url} className="w-full h-full object-cover" muted loop autoPlay /> : <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />}
                    </div>
                  )}
                  
                  <div className="absolute top-3 left-3 flex gap-2">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase backdrop-blur-md text-white ${asset.type === 'video' ? 'bg-purple-500/80' : 'bg-cyan-500/80'}`}>{asset.type}</span>
                  </div>

                  {asset.status === 'completed' && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20 backdrop-blur-[2px]">
                        <button onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); }} className="p-2 bg-white rounded-full hover:scale-110 transition-transform"><Maximize2 className="w-5 h-5 text-black"/></button>
                        <a href={asset.url} download={`viva-${asset.id}`} onClick={e => e.stopPropagation()} className="p-2 bg-white rounded-full hover:scale-110 transition-transform"><Download className="w-5 h-5 text-black"/></a>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[10px] text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {asset.modelName}
                    </span>
                    <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded uppercase ${asset.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{asset.genTimeLabel}</span>
                  </div>
                  
                  <div className="relative group/prompt">
                    <p className="text-xs font-medium line-clamp-2 leading-relaxed text-slate-700 dark:text-zinc-300 pr-6" title={asset.prompt}>
                      {asset.prompt}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPrompt(asset.prompt, asset.id);
                      }}
                      className="absolute top-0 right-0 opacity-0 group-hover/prompt:opacity-100 text-slate-400 hover:text-cyan-500 transition-colors"
                    >
                      {copiedId === asset.id ? <ClipboardCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  
                  <div className="pt-2 flex gap-2 border-t border-slate-100 dark:border-zinc-700">
                     <button disabled={asset.status !== 'completed' && asset.status !== 'failed'} onClick={(e) => { e.stopPropagation(); handleAssetRefresh(asset); }} className="flex-1 py-1 rounded bg-slate-50 dark:bg-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-600 transition-colors text-[10px] font-bold text-slate-600 dark:text-zinc-300 flex items-center justify-center gap-1 disabled:opacity-50">
                        <RefreshCw className="w-3 h-3" /> 刷新
                     </button>
                     <button disabled={asset.status !== 'completed' || asset.type === 'video'} onClick={(e) => { e.stopPropagation(); handleAssetEdit(asset); }} className="flex-1 py-1 rounded bg-slate-50 dark:bg-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-600 transition-colors text-[10px] font-bold text-slate-600 dark:text-zinc-300 flex items-center justify-center gap-1 disabled:opacity-50">
                        <Edit className="w-3 h-3" /> 编辑
                     </button>
                     <button disabled={asset.status !== 'completed' || asset.type === 'video'} onClick={(e) => { e.stopPropagation(); handleAssetGenVideo(asset); }} className="flex-1 py-1 rounded bg-slate-50 dark:bg-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-600 transition-colors text-[10px] font-bold text-slate-600 dark:text-zinc-300 flex items-center justify-center gap-1 disabled:opacity-50">
                        <Video className="w-3 h-3" /> 视频
                     </button>
                  </div>
                </div>
              </div>
            ))}

            {generatedAssets.length === 0 && (
              <div className="col-span-full h-[400px] flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700">
                <Bot className="w-32 h-32 mb-4 opacity-20" />
                <span className="font-bold text-3xl uppercase tracking-tighter opacity-30 italic">导演！我已经准备好了</span>
              </div>
            )}
          </div>
      </div>

      {/* Floating Input Bar (Gemini Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 md:pb-6 flex justify-center pointer-events-none" data-control-panel="true">
        <div className="w-full max-w-5xl bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-700 pointer-events-auto flex flex-col overflow-hidden transition-all duration-300 relative">
             
             {/* Toggle Settings Button - Absolute Positioned */}
             <button 
                onClick={() => setShowSettings(!showSettings)} 
                className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400 dark:text-zinc-500 z-50 transition-colors"
                title={showSettings ? "收起设置" : "展开设置"}
             >
                {showSettings ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
             </button>

             {/* Top Controls Row (Collapsible) */}
             {showSettings && (
                 <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-zinc-700/50 animate-in slide-in-from-top-2">
                    {/* Mode Switcher */}
                    <div className="flex bg-slate-200 dark:bg-zinc-700 rounded-lg p-1 mr-2">
                        <button onClick={() => setMainCategory('image')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${mainCategory === 'image' ? 'bg-white dark:bg-zinc-600 text-black dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400'}`}>
                            <ImageIcon className="w-3 h-3"/> 图片
                        </button>
                        <button onClick={() => setMainCategory('video')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${mainCategory === 'video' ? 'bg-white dark:bg-zinc-600 text-black dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400'}`}>
                            <Film className="w-3 h-3"/> 视频
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-300 dark:bg-zinc-700 mx-1 hidden md:block"></div>

                    {/* Model & Settings */}
                    <div className="flex-1 flex flex-wrap items-center gap-2 pr-8">
                        <select value={mainCategory === 'image' ? selectedModel : selectedVideoModel} onChange={(e) => mainCategory === 'image' ? setSelectedModel(e.target.value) : setSelectedVideoModel(e.target.value)} className="bg-transparent text-xs font-bold text-slate-700 dark:text-zinc-300 border-none outline-none focus:ring-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 rounded px-2 py-1">
                            {(mainCategory === 'image' ? MODELS : VIDEO_MODELS).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>

                        <span className="text-slate-300">|</span>

                        {mainCategory === 'image' ? (
                            <>
                            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="bg-transparent text-xs text-slate-600 dark:text-zinc-400 border-none outline-none focus:ring-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 rounded px-2 py-1 w-20">
                                {currentImageModel?.supportedAspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <select value={imageSize} onChange={(e) => setImageSize(e.target.value)} className="bg-transparent text-xs text-slate-600 dark:text-zinc-400 border-none outline-none focus:ring-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 rounded px-2 py-1 w-20">
                                {currentImageModel?.supportedResolutions.map(res => <option key={res} value={res}>{res}</option>)}
                            </select>
                            </>
                        ) : (
                            <>
                            <select value={videoRatio} onChange={(e) => setVideoRatio(e.target.value)} className="bg-transparent text-xs text-slate-600 dark:text-zinc-400 border-none outline-none focus:ring-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 rounded px-2 py-1 w-20">
                                {currentVideoModel?.supportedAspectRatios.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <select value={videoOptionIdx} onChange={(e) => setVideoOptionIdx(parseInt(e.target.value))} className="bg-transparent text-xs text-slate-600 dark:text-zinc-400 border-none outline-none focus:ring-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-700 rounded px-2 py-1 w-24">
                                {currentVideoModel?.options.map((opt, idx) => (
                                    <option key={idx} value={idx}>{opt.s}s ({opt.q})</option>
                                ))}
                            </select>
                            </>
                        )}

                        <span className="text-slate-300">|</span>
                        
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-xs font-bold text-slate-500">数量</span>
                            <input type="range" min="1" max="10" value={generationCount} onChange={(e) => setGenerationCount(parseInt(e.target.value))} className="w-20 accent-cyan-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{generationCount}</span>
                        </div>
                    </div>
                 </div>
             )}

             {/* Reference Images Area */}
             {referenceImages.length > 0 && (
                 <div className="px-4 pt-3 flex gap-3 overflow-x-auto">
                     {referenceImages.map((img, idx) => (
                         <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-600 shadow-sm flex-shrink-0 group">
                             <img src={img.data.startsWith('http') ? img.data : `data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" />
                             <button onClick={() => removeReferenceImage(img.id)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <X className="w-4 h-4 text-white" />
                             </button>
                             <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center py-0.5">
                                {mainCategory === 'video' && (selectedVideoModel.startsWith('veo') || selectedVideoModel.startsWith('grok')) ? (idx === 0 ? '首帧' : '尾帧') : 'REF'}
                             </div>
                         </div>
                     ))}
                 </div>
             )}

             {/* Input Area */}
             <div className="flex items-end gap-2 p-3">
                 <div className="flex flex-col gap-2">
                    <label className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-slate-500 dark:text-zinc-400" title="上传参考图">
                        <ImageIcon className="w-5 h-5" />
                        <input type="file" multiple={mainCategory === 'image'} className="hidden" onChange={handleImageUpload} />
                    </label>
                    <button onClick={() => setActiveModal('library')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors text-slate-500 dark:text-zinc-400" title="提示词库">
                        <Bookmark className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActiveModal('styles')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors text-slate-500 dark:text-zinc-400" title="风格选择">
                        <Palette className="w-5 h-5" />
                    </button>
                 </div>

                 <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请输入..."
                    className="flex-1 max-h-32 min-h-[50px] bg-transparent border-none outline-none resize-none pt-1 pb-2 text-sm text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 leading-relaxed placeholder:animate-pulse"
                 />
                 
                 <div className="flex flex-col gap-2">
                    <button onClick={savePromptToLibrary} disabled={!prompt.trim()} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors text-slate-400 hover:text-cyan-500 disabled:opacity-30" title="保存当前提示词">
                        <Save className="w-5 h-5" />
                    </button>
                    <button onClick={optimizePrompt} disabled={isOptimizing || !prompt.trim()} className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors ${isOptimizing ? 'text-cyan-500' : 'text-slate-400 hover:text-purple-500'} disabled:opacity-30`} title="AI优化">
                        {isOptimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                    </button>
                    <button 
                        onClick={() => executeGeneration()} 
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-500 text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                 </div>
             </div>
             
             {error && <div className="px-4 pb-2 text-xs text-red-500 font-bold">{error}</div>}
             {showSaveSuccess && <div className="px-4 pb-2 text-xs text-green-500 font-bold">已保存到库</div>}
        </div>
      </div>

      {isSelecting && (
        <div className="fixed border-2 border-cyan-400 bg-cyan-400/10 z-[60] pointer-events-none" 
             style={{ 
               left: Math.min(selectionStart.x, selectionCurrent.x), 
               top: Math.min(selectionStart.y, selectionCurrent.y), 
               width: Math.abs(selectionCurrent.x - selectionStart.x), 
               height: Math.abs(selectionCurrent.y - selectionStart.y) 
             }} 
        />
      )}

      {/* --- MODALS --- */}

      {activeModal === 'announcement' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-[550px] bg-white dark:bg-zinc-800 border-4 border-black dark:border-zinc-600 brutalist-shadow animate-in zoom-in-95 relative">
            <ModalHeader title="最新公告 / ANNOUNCEMENT" icon={Megaphone} onClose={() => setActiveModal(null)} />
            <div className="p-8 space-y-6">
              
              <div className="bg-gradient-to-r from-cyan-400 to-emerald-500 text-white p-4 border-2 border-black dark:border-zinc-600 brutalist-shadow-sm flex items-center justify-center gap-2 animate-pulse">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-bold text-lg italic uppercase tracking-wider text-center">
                  首次使用前，请设置API令牌
                </span>
              </div>

              <div className="space-y-4">
                 <div className="bg-green-50 dark:bg-zinc-700/50 border-2 border-black dark:border-zinc-600 p-4 brutalist-shadow-sm transition-transform hover:-translate-y-1">
                    <h3 className="font-bold text-lg mb-2 italic uppercase flex items-center gap-2 dark:text-white">
                        <span className="bg-red-500 text-white px-2 py-0.5 text-xs border border-black dark:border-white">NEW MODEL</span>
                        视频模型上新
                    </h3>
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                        1、新增视频生成模型 <span className="text-black bg-yellow-300 px-1 border border-black">grok-video-3</span>，优点：生成速度快。
                    </p>
                 </div>

                 <div className="bg-blue-50 dark:bg-zinc-700/50 border-2 border-black dark:border-zinc-600 p-4 brutalist-shadow-sm transition-transform hover:-translate-y-1">
                    <h3 className="font-bold text-lg mb-2 italic uppercase flex items-center gap-2 dark:text-white">
                        <span className="bg-green-500 text-black px-2 py-0.5 text-xs border border-black dark:border-white">NEW IMAGE</span>
                        图片模型上新
                    </h3>
                    <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                        2、新增最新图片创作模型 <span className="text-black bg-yellow-300 px-1 border border-black">kling image o1</span>，支持1K，2K。
                    </p>
                 </div>
              </div>
              
              <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black border-4 border-white dark:border-black outline outline-2 outline-black dark:outline-white font-bold text-xl brutalist-shadow hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tighter italic">
                我知道了 / I GOT IT
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-[650px] bg-white dark:bg-zinc-800 border-4 border-black dark:border-zinc-600 brutalist-shadow animate-in zoom-in-95 relative">
            <ModalHeader title="登录" icon={Settings2} onClose={() => setActiveModal(null)} />
            <div className="p-8 space-y-6">
              <p className="text-lg font-bold text-red-500 leading-tight italic">
                API令牌分组：限时特价→企业级→default→优质gemini→逆向
              </p>
              
              <div className="space-y-2">
                <label className="text-base font-bold uppercase text-black dark:text-white italic">API令牌 (KEY)</label>
                <input type="password" value={tempConfig.apiKey} onChange={e => setTempConfig({...tempConfig, apiKey: e.target.value})} placeholder="sk-..." className="w-full p-3 border-2 border-black dark:border-zinc-500 font-bold text-lg focus:bg-yellow-50 dark:bg-zinc-700 dark:text-white outline-none brutalist-input" />
              </div>
              <button onClick={saveConfig} className="w-full py-5 bg-gradient-to-r from-cyan-400 to-emerald-500 border-4 border-black dark:border-zinc-500 font-bold text-2xl brutalist-shadow hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tighter italic text-white">
                登录
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'usage' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-[500px] bg-yellow-50 dark:bg-zinc-800 border-4 border-black dark:border-zinc-600 brutalist-shadow animate-in zoom-in-95 relative">
            <ModalHeader title="Usage Flow (使用流程)" icon={Megaphone} onClose={() => setActiveModal(null)} />
            <div className="p-8 space-y-6">
              {[
                { n: '1', t: '注册与令牌', d: <>前往主站 <a href="https://www.mxhdai.top" target="_blank" className="text-blue-600 font-bold underline italic">www.mxhdai.top</a> 注册并创建您的专属令牌。</> },
                { n: '2', t: '配置使用', d: '点击本站上方设置 按钮，输入令牌即可开始创作。' },
                { n: '3', t: '查询日志', d: '使用记录及额度消耗情况请在主站后台查询。' }
              ].map(step => (
                <div key={step.n} className="relative bg-white dark:bg-zinc-700 border-2 border-black dark:border-zinc-500 p-6 pt-8 brutalist-shadow-sm">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-black dark:bg-zinc-900 text-white rounded-full flex items-center justify-center text-lg italic font-bold border-2 border-white">{step.n}</div>
                  <h3 className="font-bold text-xl mb-2 italic uppercase dark:text-white">{step.t}</h3>
                  <p className="text-base font-bold text-slate-500 dark:text-zinc-300 leading-relaxed italic">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'price' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-[500px] bg-white dark:bg-zinc-800 border-4 border-black dark:border-zinc-600 brutalist-shadow animate-in zoom-in-95 relative">
            <ModalHeader title="Price Desc (价格说明)" icon="¥" onClose={() => setActiveModal(null)} />
            <div className="p-0 max-h-[60vh] overflow-y-auto no-scrollbar">
              {[
                {
                  category: 'AI优化',
                  items: [
                    { m: 'gemini-3-flash-preview', p: '0.002元/次' }
                  ]
                },
                {
                  category: '图片模型',
                  items: [
                    { m: 'Nano Banana', p: '0.06元/张' },
                    { m: 'Nano Banana Pro', p: '0.22元-0.40元/张' },
                    { m: 'Kling Image O1', p: '0.24元/张' },
                    { m: 'gpt-image-1', p: '0.06元/张' },
                    { m: 'gpt-image-1.5', p: '0.06元/张' },
                    { m: 'Grok 4 Image', p: '0.06元/张' },
                    { m: 'Jimeng 4.5', p: '0.13元/张' },
                  ]
                },
                {
                  category: '视频模型',
                  items: [
                    { m: 'VEO 3.1 FAST', p: '0.11元/次' },
                    { m: 'VEO 3.1 PRO', p: '2.45元/次' },
                    { m: 'Jimeng Video 3.0', p: '0.266元/条' },
                    { m: 'Sora 2', p: '0.08元/条' },
                    { m: 'Sora 2 Pro', p: '2.52元/条' },
                    { m: 'Grok Video 3', p: '0.14元/条' },
                  ]
                }
              ].map((cat) => (
                <div key={cat.category} className="border-b-4 border-black dark:border-zinc-600 last:border-b-0">
                  <div className="bg-slate-700 text-white px-6 py-1 text-base font-bold uppercase tracking-wider flex items-center gap-2 italic">
                    <Sparkles className="w-3 h-3" /> {cat.category}
                  </div>
                  {cat.items.map((item, iidx) => (
                    <div key={iidx} className="flex justify-between items-center px-6 py-2 border-b-2 border-black dark:border-zinc-600 last:border-b-0 bg-white dark:bg-zinc-800 hover:bg-yellow-50 dark:hover:bg-zinc-700 transition-colors">
                      <span className="text-xl font-mono font-bold text-black dark:text-white tracking-tight italic">{item.m}</span>
                      <span className="text-lg font-bold text-black dark:text-white italic">{item.p}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'support' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-800 border-4 border-black dark:border-zinc-600 p-12 brutalist-shadow animate-in zoom-in-95 relative group">
            <button onClick={() => setActiveModal(null)} 
                    className="absolute -top-4 -right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white p-2 border-4 border-black dark:border-zinc-600 brutalist-shadow-sm hover:translate-y-1 hover:shadow-none transition-all z-[80] rounded-full">
              <X className="text-white w-7 h-7"/>
            </button>
            <div className="flex flex-col items-center gap-8">
              <div className="w-72 h-72 border-4 border-black dark:border-zinc-600 brutalist-shadow-sm flex items-center justify-center bg-white p-3 relative overflow-visible">
                 <img src="https://lsky.zhongzhuan.chat/i/2025/12/31/6954c34156318.jpg" alt="Support QR" className="w-full h-full object-cover" />
              </div>
              <p className="font-bold text-xl tracking-tight uppercase italic dark:text-white">联系客服</p>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'styles' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-4">
          <div className="w-[1000px] max-w-full bg-white dark:bg-zinc-800 border-4 border-black dark:border-zinc-600 brutalist-shadow animate-in zoom-in-95 relative flex flex-col max-h-[98vh]">
            <ModalHeader title="艺术风格选择 / ART STYLES" icon={Palette} onClose={() => setActiveModal(null)} />
            <div className="flex-1 p-4 md:p-6 overflow-y-auto no-scrollbar bg-[#f8fafc] dark:bg-zinc-900">
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                {STYLES.map(style => (
                  <button 
                    key={style.zh} 
                    onClick={() => selectStyle(`${style.zh} ${style.en}`)}
                    className="group p-2 md:p-3 bg-white dark:bg-zinc-700 border-2 md:border-4 border-black dark:border-zinc-500 flex flex-col items-center justify-center gap-0.5 hover:bg-yellow-200 dark:hover:bg-cyan-900/50 hover:-translate-y-1 transition-all brutalist-shadow-sm"
                  >
                    <span className="text-base md:text-lg font-bold uppercase dark:text-white">{style.zh}</span>
                    <span className="text-[10px] md:text-xs text-slate-500 dark:text-zinc-400 font-bold uppercase group-hover:text-black dark:group-hover:text-white">{style.en}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'library' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-[800px] max-w-full bg-white dark:bg-zinc-800 border-4 border-black dark:border-zinc-600 brutalist-shadow animate-in zoom-in-95 relative flex flex-col max-h-[80vh]">
            <ModalHeader title="提示词库 / PROMPT LIBRARY" icon={Bookmark} onClose={() => setActiveModal(null)} />
            <div className="flex-1 p-6 overflow-y-auto no-scrollbar bg-[#f8fafc] dark:bg-zinc-900 space-y-4">
              {libraryPrompts.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic font-bold">暂无收藏的提示词</div>
              ) : (
                libraryPrompts.map((p, idx) => (
                  <div 
                    key={p.id} 
                    draggable={!editingLibraryId}
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white dark:bg-zinc-700 border-2 border-black dark:border-zinc-500 p-4 brutalist-shadow-sm flex gap-4 items-start group transition-transform ${draggedPromptIdx === idx ? 'opacity-50' : ''}`}
                  >
                     <div className="cursor-move mt-1 text-slate-300 dark:text-zinc-500 hover:text-black dark:hover:text-white"><GripVertical className="w-4 h-4" /></div>
                     <div className="flex-1 min-w-0">
                        {editingLibraryId === p.id ? (
                            <textarea 
                                value={editingLibraryText} 
                                onChange={(e) => setEditingLibraryText(e.target.value)} 
                                className="w-full p-2 border-2 border-black text-sm min-h-[80px] focus:outline-none focus:bg-yellow-50 dark:bg-zinc-800 dark:text-white"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <p className="text-sm font-normal text-slate-700 dark:text-zinc-300 line-clamp-3 leading-relaxed cursor-pointer hover:text-blue-500" onClick={() => usePromptFromLibrary(p.text)}>
                                {p.text}
                            </p>
                        )}
                     </div>
                     <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingLibraryId === p.id ? (
                            <>
                                <button onClick={(e) => handleSaveLibraryEdit(p.id, e)} className="p-1.5 bg-green-100 hover:bg-green-200 border border-black text-green-700"><Check className="w-4 h-4"/></button>
                                <button onClick={handleCancelLibraryEdit} className="p-1.5 bg-red-100 hover:bg-red-200 border border-black text-red-700"><X className="w-4 h-4"/></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => usePromptFromLibrary(p.text)} className="p-1.5 bg-blue-100 hover:bg-blue-200 border border-black text-blue-700" title="使用"><Sparkles className="w-4 h-4"/></button>
                                <button onClick={(e) => handleStartLibraryEdit(p, e)} className="p-1.5 bg-yellow-100 hover:bg-yellow-200 border border-black text-yellow-700" title="编辑"><Edit className="w-4 h-4"/></button>
                                <button onClick={(e) => removePromptFromLibrary(p.id, e)} className="p-1.5 bg-red-100 hover:bg-red-200 border border-black text-red-700" title="删除"><Trash2 className="w-4 h-4"/></button>
                            </>
                        )}
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8" onClick={() => setPreviewAsset(null)}>
           <div className="relative w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setPreviewAsset(null)} className="absolute top-0 right-0 p-2 bg-gradient-to-r from-red-500 to-pink-500 text-white border-2 border-white/20 hover:border-white rounded-full transition-all z-50 shadow-lg">
                <X className="w-8 h-8" />
              </button>

              <div className="flex-1 w-full flex items-center justify-center overflow-hidden mb-4">
                 {previewAsset.type === 'video' ? (
                    <video src={previewAsset.url} controls autoPlay loop className="max-w-full max-h-full border-4 border-black dark:border-zinc-500 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black" />
                 ) : (
                    <img src={previewAsset.url} className="max-w-full max-h-full border-4 border-black dark:border-zinc-500 shadow-[0_0_50px_rgba(0,0,0,0.5)] object-contain bg-white" />
                 )}
              </div>

              <div className="flex gap-4 pointer-events-auto bg-white dark:bg-zinc-800 p-2 border-2 border-black dark:border-zinc-500 brutalist-shadow-sm rounded-xl">
                 <a 
                   href={previewAsset.url} 
                   download={`viva-${previewAsset.id}.${previewAsset.type === 'video' ? 'mp4' : 'png'}`} 
                   className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-white border-2 border-black dark:border-zinc-600 font-bold uppercase hover:translate-y-0.5 hover:shadow-none brutalist-shadow-sm transition-all rounded-lg"
                   onClick={(e) => e.stopPropagation()}
                 >
                    <Download className="w-5 h-5" /> 下载
                 </a>
                 <button 
                   onClick={() => handleCopyPrompt(previewAsset.prompt, previewAsset.id)}
                   className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-700 text-black dark:text-white border-2 border-black dark:border-zinc-600 font-bold uppercase hover:translate-y-0.5 hover:shadow-none brutalist-shadow-sm transition-all rounded-lg"
                 >
                    {copiedId === previewAsset.id ? <ClipboardCheck className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                    复制提示词
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);